import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const handler: Handler = async (event) => {
  console.log('Function invoked with method:', event.httpMethod)

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    }
  }

  try {
    // Log environment check
    const hasApiKey = !!process.env.OPENAI_API_KEY
    console.log('Environment check - API Key exists:', hasApiKey)
    
    if (!hasApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Initialize OpenAI client
    console.log('Initializing OpenAI client...')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Parse request body
    console.log('Parsing request body...')
    const { image } = JSON.parse(event.body || '{}')
    
    if (!image) {
      console.log('No image provided in request')
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No image provided' })
      }
    }

    // Validate image data
    console.log('Image data length:', image.length)
    if (!image.startsWith('data:image/') && !image.startsWith('http')) {
      console.log('Invalid image format')
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid image format' })
      }
    }

    console.log('Attempting to call OpenAI API...')
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { 
            type: "input_text", 
            text: "You are a home repair expert. Analyze this image of a home repair issue and provide: 1) A brief summary of the issue, 2) A list of required tools, and 3) Step-by-step instructions to fix it. Return ONLY a JSON object with 'summary', 'tools' (array), and 'steps' (array) fields. Do not include any markdown formatting or explanation." 
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
    console.log('Raw response:', response.output_text)

    // Parse the response and extract JSON
    const jsonResponse = extractJsonFromResponse(response.output_text || '{}')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonResponse)
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

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message,
        type: error.type || error.name
      })
    }
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