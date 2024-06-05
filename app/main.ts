import * as net from 'net';

type RouterHandler = (params: { [key: string]: string }, usrAgent?: string) => string

type Route = {
  pattern: RegExp;
  handler: RouterHandler;
}

class Router {
  private routes: Route[] = [];

  addRoute(pattern: RegExp, handler: RouterHandler) {
    this.routes.push({ pattern, handler })
  }

  handleReq(path: string, usrAgent?: string): string | undefined {
    for (const route of this.routes) {
      const match = path.match(route.pattern)

      if (match) {
        const params = match.groups || {}
        console.log(params)
        return route.handler(params, usrAgent)
      }
    }
    console.log("No route matched")
    return undefined
  }
}

const router = new Router()
router.addRoute(/^\/$/, () => {
  return `HTTP/1.1 200 OK\r\n\r\n`
})
router.addRoute(/^\/echo\/(?<msg>.+)$/, (params) => {
  return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${params.msg.length}\r\n\r\n${params.msg}`
})
router.addRoute(/^\/user-agent$/, (params, usrAgent) => {
  const res = usrAgent || 'No User-Agent provided'
  return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${res.length}\r\n\r\n${res}`
})

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const req = data.toString()
    const path = req.split(' ')[1]
    const usrAgentHeader = req.split('\n').find(line => line.startsWith('User-Agent:'))
    const usrAgent = usrAgentHeader ? usrAgentHeader.slice(12).trim() : undefined
    console.log(req)
    let res = router.handleReq(path, usrAgent)
    if (res !== undefined) {
      socket.write(res)
    } else {
      socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`)
    }
    socket.end()
  })
});

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});
