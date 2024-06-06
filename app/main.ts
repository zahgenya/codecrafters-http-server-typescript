import * as net from 'net';
import * as fs from 'fs/promises'

type RouterHandler = (method: string, params: { [key: string]: string }, usrAgent?: string, reqBody?: string) => Promise<string>

type Route = {
  pattern: RegExp;
  handler: RouterHandler;
}

class Router {
  private routes: Route[] = [];

  addRoute(pattern: RegExp, handler: RouterHandler) {
    this.routes.push({ pattern, handler })
  }

  async handleReq(method: string, path: string, usrAgent?: string, reqBody?: string): Promise<string | undefined> {
    if (!path) {
      console.error('Path is not defined!')
      return undefined
    }
    for (const route of this.routes) {
      const match = path.match(route.pattern)

      if (match) {
        const params = match.groups || {}
        console.log(params)
        return await route.handler(method, params, usrAgent, reqBody)
      }
    }
    console.log("No route matched")
    return undefined
  }
}

const router = new Router()


// ROUTES:
router.addRoute(/^\/$/, async (method) => {
  if (method === "GET") {
    return `HTTP/1.1 200 OK\r\n\r\n`
  }
  return `HTTP/1.1 405 Method Not Allowed\r\n\r\n`
})
router.addRoute(/^\/echo\/(?<msg>.+)$/, async (method, params) => {
  if (method === "GET") {
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${params.msg.length}\r\n\r\n${params.msg}`
  }
  return `HTTP/1.1 405 Method Not Allowed\r\n\r\n`
})
router.addRoute(/^\/user-agent$/, async (method, params, usrAgent) => {
  const res = usrAgent || 'No User-Agent provided'
  if (method === "GET") {
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${res.length}\r\n\r\n${res}`
  }
  return `HTTP/1.1 405 Method Not Allowed\r\n\r\n`
})

const baseDir = process.argv[3]

router.addRoute(/^\/files\/(?<file>.+)$/, async (method, params, userAgent, reqBody) => {
  if (method === "GET") {
    try {
      const path = `${baseDir}${params.file}`
      console.log(`baseDir: ${baseDir}, path: ${path}`)
      const fileData = await fs.readFile(path, 'utf-8')
      return `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileData.length}\r\n\r\n${fileData}`
    } catch (err) {
      console.log("Error has occurred while reading file: ", err)
      return `HTTP/1.1 404 Not Found\r\n\r\n`
    }
  } else if (method === "POST") {
    const reqMsg = reqBody || 'Request body is empty'
    const path = `${baseDir}${params.file}`
    try {
      await fs.writeFile(path, reqMsg)
      return `HTTP/1.1 201 Created\r\n\r\n`
    } catch (err) {
      console.log("Error has occurred while writting a file: ", err)
      return `HTTP/1.1 500 Internal Server Error\r\n\r\n`
    }
  }
  return `HTTP/1.1 405 Method Not Allowed\r\n\r\n`
})

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    try {
      const req = data.toString()
      const path = req.split(' ')[1]
      const method = req.split(' ')[0].trim()
      const reqBody = req.split('\n')[7]
      const usrAgentHeader = req.split('\n').find(line => line.startsWith('User-Agent:'))
      const usrAgent = usrAgentHeader ? usrAgentHeader.slice(12).trim() : undefined
      console.log(req)
      let res = await router.handleReq(method, path, usrAgent, reqBody)
      if (res !== undefined) {
        socket.write(res)
      } else {
        socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`)
      }
    } catch (err) {
      console.error("Error processing request!")
      socket.write(`HTTP/1.1 500 Internal Server Error\r\n\r\n`)
    } finally {
      socket.end()
    }
  })
});

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});
