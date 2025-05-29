import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    }
  }

  try {
    // Log the API key existence (not the key itself)
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY)
    
    const { image } = JSON.parse(event.body || '{}')
    
    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No image provided' })
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
    // More detailed error logging
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // If it's an OpenAI error, it might have additional details
      status: error.status,
      type: error.type,
      code: error.code
    })

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

export { handler } 