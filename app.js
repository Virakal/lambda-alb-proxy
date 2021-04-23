const express = require('express')
const http = require('http')
const { nanoid } = require('nanoid')

const app = express()
const port = process.env.LISTEN_PORT || 3000
const lambdaHost = process.env.LAMBDA_HOST || 'localhost'
const lambdaPort = process.env.LAMBDA_PORT || 8080

function sendError(res, errorMessage) {
  console.error(`[${res.locals.requestId}] ${errorMessage}`)
  res.status(500)
  res.send(errorMessage)
}

app.all('/', (req, res) => {
  const requestId = nanoid(8)
  res.locals.requestId = requestId

  console.log(`[${requestId}] Request received`);

  const data = JSON.stringify({
    requestContext: {
      // Not sure what to do here
    },
    httpMethod: req.method.toUpperCase(),
    path: req.path,
    queryStringParameters: req.query,
    headers: req.headers,
    body: req.body,
    isBase64Encoded: false,
  })

  const options = {
    hostname: lambdaHost,
    port: lambdaPort,
    path: '/2015-03-31/functions/function/invocations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  let responseData = []

  const request = http.request(options, (result) => {
    result.on('data', (d) => {
      responseData.push(d)
    })

    result.on('end', () => {
      const responseString = responseData.join('')
      console.log(`[${requestId}] Response received: ${responseString}`);

      try {
        const json = JSON.parse(responseString)

        if (json.errorType) {
          return sendError(res, `Error calling lambda: ${json.errorType} - ${json.errorMessage}\n\n${json.trace}`)
        }

        res.status(json.statusCode)
        res.set(json.headers)
        res.send(json.body || '')
      } catch (error) {
        return sendError(res, `Error parsing lambda JSON response: ${error}`)
      }
    })
  })

  request.on('error', (error) => {
    return sendError(res, `Unknown error occurred when calling lambda: ${error}`)
  })

  request.write(data)
  request.end()
})

app.listen(port, () => {
  console.log(`Proxy listening at http://localhost:${port}`)
})
