import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

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

    const { image, description } = requestBody
    
    if (!image) {
      console.log('No image provided in request')
      return jsonResponse(400, { 
        error: 'Invalid Request',
        details: 'No image provided'
      })
    }

    // Validate image data
    console.log('Image data length:', image.length)
    if (!image.startsWith('data:image/') && !image.startsWith('http')) {
      console.log('Invalid image format')
      return jsonResponse(400, { 
        error: 'Invalid Request',
        details: 'Invalid image format. Must be a data URL or HTTP URL.'
      })
    }

    console.log('Attempting to call OpenAI API...')
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { 
            type: "input_text", 
            text: `You are a home repair expert. Analyze this image of a home repair issue${description ? ' with the following context: ' + description : ''}. Provide: 1) A brief summary of the issue, 2) A list of required tools, and 3) Step-by-step instructions to fix it. Return ONLY a JSON object with 'summary', 'tools' (array), and 'steps' (array) fields. Do not include any markdown formatting or explanation.` 
          },
          {
            type: "input_image",
            image_url: image,
            detail: "high"
          }
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
      if (!parsedResponse.summary || !parsedResponse.tools || !parsedResponse.steps) {
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