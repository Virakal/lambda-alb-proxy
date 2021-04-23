const express = require('express')
const http = require('http')
const { nanoid } = require('nanoid')

const app = express()
const port = process.env.LISTEN_PORT || 3000
const lambdaHost = process.env.LAMBDA_HOST || 'localhost'
const lambdaPort = process.env.LAMBDA_PORT || 8080

app.all('/', (req, res) => {
  const requestId = nanoid(8)
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
      res.send(responseString)
    })
  })

  request.on('error', (error) => {
    console.error(`[${requestId}] Errored: ${error}`)
  })

  request.write(data)
  request.end()
})

app.listen(port, () => {
  console.log(`Proxy listening at http://localhost:${port}`)
})
