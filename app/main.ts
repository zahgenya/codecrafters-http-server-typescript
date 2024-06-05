import * as net from 'net';
import * as fs from 'fs/promises'

type RouterHandler = (params: { [key: string]: string }, usrAgent?: string) => Promise<string>

type Route = {
  pattern: RegExp;
  handler: RouterHandler;
}

class Router {
  private routes: Route[] = [];

  addRoute(pattern: RegExp, handler: RouterHandler) {
    this.routes.push({ pattern, handler })
  }

  async handleReq(path: string, usrAgent?: string): Promise<string | undefined> {
    if (!path) {
      console.error('Path is not defined!')
      return undefined
    }
    for (const route of this.routes) {
      const match = path.match(route.pattern)

      if (match) {
        const params = match.groups || {}
        console.log(params)
        return await route.handler(params, usrAgent)
      }
    }
    console.log("No route matched")
    return undefined
  }
}

const router = new Router()


// ROUTES:
router.addRoute(/^\/$/, async () => {
  return `HTTP/1.1 200 OK\r\n\r\n`
})
router.addRoute(/^\/echo\/(?<msg>.+)$/, async (params) => {
  return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${params.msg.length}\r\n\r\n${params.msg}`
})
router.addRoute(/^\/user-agent$/, async (params, usrAgent) => {
  const res = usrAgent || 'No User-Agent provided'
  return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${res.length}\r\n\r\n${res}`
})

const baseDir = process.argv[3]

router.addRoute(/^\/files\/(?<file>.+)$/, async (params) => {
  try {
    const path = `${baseDir}${params.file}`
    console.log(`baseDir: ${baseDir}, path: ${path}`)
    const fileData = await fs.readFile(path, 'utf-8')
    return `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileData.length}\r\n\r\n${fileData}`
  } catch (err) {
    console.log("Error has occurred while reading file: ", err)
    return `HTTP/1.1 404 Not Found\r\n\r\n`
  }
})

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    try {
      const req = data.toString()
      const path = req.split(' ')[1]
      const usrAgentHeader = req.split('\n').find(line => line.startsWith('User-Agent:'))
      const usrAgent = usrAgentHeader ? usrAgentHeader.slice(12).trim() : undefined
      console.log(req)
      let res = await router.handleReq(path, usrAgent)
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
