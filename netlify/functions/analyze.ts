import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    }
  }

  try {
    const { image } = JSON.parse(event.body || '{}')
    
    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No image provided' })
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a home repair expert. Analyze this image of a home repair issue and provide: 1) A brief summary of the issue, 2) A list of required tools, and 3) Step-by-step instructions to fix it. Format the response as JSON with 'summary', 'tools', and 'steps' fields."
            },
            {
              type: "image_url",
              image_url: image
            }
          ]
        }
      ],
      max_tokens: 500
    })

    const content = response.choices[0].message.content
    const result = JSON.parse(content || '{}')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}

export { handler } 