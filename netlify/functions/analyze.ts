import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

interface AnalysisResult {
  summary: string;
  tools: string[];
  steps: string[];
  safetyWarnings: {
    hazardousMaterials: string[];
    ageRelated: boolean;
    generalWarnings: string[];
  };
  imageDescriptions: string[];
}

interface AnalyzeRequestBody {
  images?: string[];
  description?: string;
  imageDescriptions?: string[];
  previousAnalysis?: {
    summary: string;
    tools: string[];
    steps: string[];
    safetyWarnings: {
      hazardousMaterials: string[];
      ageRelated: boolean;
      generalWarnings: string[];
    };
  };
}

const HAZARDOUS_MATERIALS = {
  LEAD: {
    items: [
      "Old paint (especially if chalking, flaking, or peeling)",
      "Old plumbing and pipe solder",
      "Vintage vinyl blinds or mini-blinds",
      "Old ceramic tiles or glazed pottery",
      "Vintage linoleum flooring",
      "Older brass fixtures and faucets",
      "Older electrical wiring with cloth insulation"
    ]
  },
  ASBESTOS: {
    items: [
      "Popcorn ceilings (acoustic ceiling texture)",
      "Vermiculite insulation",
      "Old vinyl floor tiles and sheet flooring",
      "Pipe insulation and wrap",
      "Old HVAC duct insulation",
      "Textured wall surfaces (stipple or swirl patterns)",
      "Old cement siding (transite)",
      "Old roof shingles and felt",
      "Old furnace and boiler insulation",
      "Window caulking and glazing",
      "Old fire doors",
      "Spray-on fireproofing",
      "Old joint compound and spackling",
      "Old electrical panel backing boards",
      "Old heat-resistant gloves and pads",
      "Old gaskets in furnaces and wood stoves"
    ]
  },
  OTHER: {
    items: [
      "Mercury in old thermostats",
      "PCBs in old fluorescent light ballasts",
      "Creosote in old railroad ties or telephone poles",
      "Formaldehyde in old particle board and paneling",
      "Mold in damp or water-damaged areas"
    ]
  }
};

const handler: Handler = async (event) => {
  console.log('Function invoked with method:', event.httpMethod)

  // Always return JSON responses
  const jsonResponse = (statusCode: number, body: any) => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' })
  }

  try {
    // Log environment check
    const hasApiKey = !!process.env.OPENAI_API_KEY
    console.log('Environment check - API Key exists:', hasApiKey)
    
    if (!hasApiKey) {
      return jsonResponse(500, { 
        error: 'Configuration Error',
        details: 'OpenAI API key is not configured'
      })
    }

    // Initialize OpenAI client
    console.log('Initializing OpenAI client...')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Parse request body
    let requestBody
    try {
      requestBody = JSON.parse(event.body || '{}')
    } catch (e) {
      return jsonResponse(400, { 
        error: 'Invalid Request',
        details: 'Request body must be valid JSON'
      })
    }

    const { images, description, imageDescriptions, previousAnalysis } = requestBody
    
    if (!images && !imageDescriptions) {
      console.log('No images or image descriptions provided')
      return jsonResponse(400, { 
        error: 'Invalid Request',
        details: 'No images or image descriptions provided'
      })
    }

    // Validate image data
    for (const image of images || []) {
      console.log('Image data length:', image.length)
      if (!image.startsWith('data:image/') && !image.startsWith('http')) {
        console.log('Invalid image format')
        return jsonResponse(400, { 
          error: 'Invalid Request',
          details: 'Invalid image format. Must be a data URL or HTTP URL.'
        })
      }
    }

    console.log('Attempting to call OpenAI API...')
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{
        role: "user",
        content: imageDescriptions ? [
          { 
            type: "input_text", 
            text: `You are a home repair expert. A user has asked a follow-up question about their home repair issue: "${description}"

Here are the detailed descriptions of the images they previously shared:
${imageDescriptions.map((desc, i) => `Image ${i + 1}: ${desc}`).join('\n\n')}

Previous analysis:
- Summary: ${previousAnalysis?.summary}
- Tools needed: ${previousAnalysis?.tools.join(', ')}
- Steps: ${previousAnalysis?.steps.join('; ')}
- Safety Warnings:
  * Hazardous Materials: ${previousAnalysis?.safetyWarnings.hazardousMaterials.join(', ') || 'None identified'}
  * Pre-1990 Home: ${previousAnalysis?.safetyWarnings.ageRelated ? 'Yes' : 'No'}
  * General Warnings: ${previousAnalysis?.safetyWarnings.generalWarnings.join(', ') || 'None'}

Please address their follow-up question directly, using phrases like "You asked about..." or "Regarding your question about...". Provide your response in a JSON object with the following fields:
1. 'summary': A direct answer to their question
2. 'tools': Any additional or modified tools needed
3. 'steps': Any additional or modified steps
4. 'safetyWarnings': Updated safety warnings if relevant
5. 'imageDescriptions': The same image descriptions provided (to maintain context for future questions)

Do not include any markdown formatting or explanation outside the JSON object.`
          }
        ] : [
          { 
            type: "input_text", 
            text: `You are a home repair expert with special expertise in identifying potential hazards and safety risks. Analyze ${images!.length > 1 ? 'these images' : 'this image'} of a home repair issue${description ? ' and address this question/description: ' + description : ''}. 

First, provide a detailed technical description of each image, including:
- All visible construction materials and their conditions
- Architectural features and their approximate age
- Any visible damage or wear
- Surrounding context and environmental factors
- Specific measurements or dimensions if discernible
- Any text or markings visible in the image
- Lighting conditions and any shadows that might affect visibility
Store these descriptions to help answer follow-up questions later.

Then, estimate the approximate age of the home based on visible architectural features, materials, and fixtures. If you believe the home was built before 1990, this should be noted.

Next, carefully examine the images for any potential hazardous materials, particularly:
${Object.entries(HAZARDOUS_MATERIALS).map(([category, data]) => 
  `${category}:\n${data.items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

Provide your analysis in a JSON object with the following fields:
1. 'summary': A brief summary that${description ? ' starts by directly addressing the user\'s question/description (using phrases like "You asked about..." or "Regarding your question about...") and then' : ''} explains the repair issue
2. 'tools': An array of required tools
3. 'steps': An array of step-by-step instructions
4. 'safetyWarnings': An object containing:
   - 'hazardousMaterials': Array of potentially hazardous materials identified
   - 'ageRelated': Boolean indicating if the home appears to be pre-1990
   - 'generalWarnings': Array of other safety considerations
5. 'imageDescriptions': Array of detailed technical descriptions for each image

Do not include any markdown formatting or explanation outside the JSON object.`
          },
          ...(images || []).map(image => ({
            type: "input_image" as const,
            image_url: image,
            detail: "high" as const
          }))
        ]
      }]
    })

    console.log('OpenAI API response received')
    console.log('Response type:', typeof response.output_text)
    
    if (!response.output_text) {
      return jsonResponse(500, {
        error: 'API Error',
        details: 'No response received from OpenAI'
      })
    }

    try {
      const parsedResponse = extractJsonFromResponse(response.output_text)
      
      // Validate response format
      if (!parsedResponse.summary || !parsedResponse.tools || !parsedResponse.steps || !parsedResponse.safetyWarnings || !parsedResponse.imageDescriptions) {
        return jsonResponse(500, {
          error: 'API Error',
          details: 'Invalid response format from OpenAI'
        })
      }

      return jsonResponse(200, parsedResponse)
    } catch (e) {
      console.error('Failed to parse OpenAI response:', response.output_text)
      return jsonResponse(500, {
        error: 'API Error',
        details: 'Failed to parse OpenAI response'
      })
    }
  } catch (error) {
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: error.status,
      type: error.type,
      code: error.code
    })

    // If it's an OpenAI API error, it might have additional details
    if (error instanceof Error && 'status' in error) {
      console.error('OpenAI API Error details:', {
        status: (error as any).status,
        data: (error as any).data,
        headers: (error as any).headers
      })
    }

    return jsonResponse(500, {
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      type: error instanceof Error ? (error.name || 'Error') : 'Unknown'
    })
  }
}

// Helper function to clean markdown and extract JSON
function extractJsonFromResponse(text: string): any {
  try {
    // First, try parsing the text directly
    return JSON.parse(text)
  } catch (e) {
    // If that fails, try to extract JSON from markdown
    try {
      // Remove markdown code block syntax if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      
      // If no markdown, try to find the first { and last }
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.slice(start, end + 1))
      }
      
      throw new Error('No valid JSON found in response')
    } catch (e) {
      throw new Error('Failed to parse response: ' + e.message)
    }
  }
}

export { handler } 