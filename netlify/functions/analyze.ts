import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'
import type { ChatCompletionContentPartImage, ChatCompletionContentPartText } from 'openai/resources/chat/completions'

interface AnalysisResult {
  summary: string;
  tools: string[];
  steps: string[];
  safetyWarnings: {
    hazardousMaterials: string[];
    ageRelated: boolean;
    generalWarnings: string[];
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
  // Only log errors or use a debug flag
  const DEBUG = false;
  if (DEBUG) console.log('Function invoked with method:', event.httpMethod)

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
    const hasApiKey = !!process.env.OPENAI_API_KEY
    if (!hasApiKey) {
      return jsonResponse(500, { 
        error: 'Configuration Error',
        details: 'OpenAI API key is not configured'
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    try {
      let requestBody
      try {
        requestBody = JSON.parse(event.body || '{}')
      } catch (e) {
        if (DEBUG) console.error('Failed to parse request body:', e)
        return jsonResponse(400, { 
          error: 'Invalid Request',
          details: 'Request body must be valid JSON'
        })
      }

      const { images, description } = requestBody
      if (!images || !Array.isArray(images) || images.length === 0) {
        return jsonResponse(400, { 
          error: 'Invalid Request',
          details: 'At least one image must be provided'
        })
      }

      // Validate and limit images
      for (const image of images.slice(0, 2)) {
        if (typeof image !== 'string' || (!image.startsWith('data:image/') && !image.startsWith('http'))) {
          return jsonResponse(400, { 
            error: 'Invalid Request',
            details: 'Invalid image format. Must be a data URL or HTTP URL.'
          })
        }
      }

      try {
        const response = await openai.responses.create({
          model: "gpt-4.1-mini",
          input: [{
            role: "user",
            content: [
              {
                type: "input_text",
                text: `You are a home repair expert. Analyze ${images.length > 1 ? 'these images' : 'this image'} of a home repair issue${description ? ' and address this question: ' + description : ''}. Consider common hazardous materials (lead, asbestos, etc.) and provide your analysis as a JSON object with: summary, tools, steps, and safetyWarnings (hazardousMaterials, ageRelated, generalWarnings).`
              },
              ...images.slice(0, 2).map(image => ({
                type: "input_image" as const,
                image_url: image,
                detail: "low" as const
              }))
            ]
          }]
        })

        if (!response.output_text) {
          if (DEBUG) console.error('No output_text in response')
          return jsonResponse(500, {
            error: 'API Error',
            details: 'No response received from OpenAI'
          })
        }

        try {
          const parsedResponse = extractJsonFromResponse(response.output_text)
          if (!parsedResponse.summary || !parsedResponse.tools || !parsedResponse.steps || !parsedResponse.safetyWarnings) {
            if (DEBUG) console.error('Invalid response format:', parsedResponse)
            return jsonResponse(500, {
              error: 'API Error',
              details: 'Invalid response format from OpenAI'
            })
          }
          return jsonResponse(200, parsedResponse)
        } catch (e) {
          if (DEBUG) console.error('Failed to parse OpenAI response:', response.output_text)
          return jsonResponse(500, {
            error: 'API Error',
            details: 'Failed to parse OpenAI response'
          })
        }
      } catch (openaiError) {
        if (DEBUG) console.error('OpenAI API call failed:', openaiError)
        return jsonResponse(500, {
          error: 'OpenAI API Error',
          details: openaiError.message,
          type: openaiError.type
        })
      }
    } catch (error) {
      if (DEBUG) console.error('Detailed error:', error)
      return jsonResponse(500, {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        type: error instanceof Error ? (error.name || 'Error') : 'Unknown'
      })
    }
  } catch (error) {
    if (DEBUG) console.error('Detailed error:', error)
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