const Koa = require('koa')
const axios = require('axios').default
const { nanoid } = require('nanoid')
const bodyParser = require('koa-bodyparser');

const app = new Koa()
const port = process.env.LISTEN_PORT || 3000
const lambdaHost = process.env.LAMBDA_HOST || 'localhost'
const lambdaPort = process.env.LAMBDA_PORT || 8080

/**
 *
 * @param {Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>} ctx
 * @param {string} errorMessage
 */
function sendError(ctx, errorMessage) {
  console.error(`[${ctx.requestId}] ${errorMessage}`)
  ctx.response.status = 500
  ctx.body = errorMessage
}

// Parse the body from the context
app.use(bodyParser({
  enableTypes: ['text', 'json', 'form'],
  detectJSON: () => false,
}));

app.use(async ctx => {
  const requestId = nanoid(8)
  const req = ctx.request

  ctx.requestId = requestId

  let body = {};

  if (ctx.request.rawBody !== undefined) {
    body = ctx.request.rawBody;
  } else if (ctx.request.body !== undefined) {
    body = ctx.request.body;
  }

  const data = JSON.stringify({
    requestContext: {
      // Not sure what to do here
    },
    httpMethod: req.method.toUpperCase(),
    path: req.path,
    queryStringParameters: req.query,
    headers: req.headers,
    body,
    isBase64Encoded: false,
  })

  const options = {
    url: `http://${lambdaHost}:${lambdaPort}/2015-03-31/functions/function/invocations`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
    responseType: 'text',
    data
  }

  let response;

  try {
    response = await axios(options)
  } catch (error) {
    return sendError(ctx, `Unknown error occurred when calling lambda: ${error}`)
  }

  const json = response.data
  console.log(`[${requestId}] Response received: ${JSON.stringify(json)}`);

  try {
    if (json.errorType) {
      return sendError(ctx, `Error calling lambda: ${json.errorType} - ${json.errorMessage}\n\n${json.trace}`)
    }

    ctx.status = json.statusCode
    Object.keys(json.headers).forEach((x) => ctx.set(x, json.headers[x]))
    ctx.body = json.body || ''
  } catch (error) {
    return sendError(ctx, `Error parsing lambda JSON response: ${error}`)
  }
})

app.listen(port, () => {
  console.log(`Proxy listening at http://localhost:${port}`)
})
