// netlify/functions/ai.js
// Secure proxy — keeps your Anthropic API key hidden from the browser

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Simple rate limit header (Netlify adds IP automatically)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const body = JSON.parse(event.body)

    // Safety: cap tokens so no runaway costs
    if (body.max_tokens > 1000) body.max_tokens = 1000

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return { statusCode: 200, headers, body: JSON.stringify(data) }

  } catch (err) {
    console.error('AI proxy error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
