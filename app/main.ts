import * as net from "net"
import { handleEchoRoute, handleFileRoute, handleHomeRoute, handleUserAgentRoute } from "./routes"
import { responseBuilder } from "./responseBuilder"
import { Router } from "./router"

const PORT = parseInt(process.env.PORT || '4221', 10)
console.log(PORT)

const router = new Router()

// ROUTES:
router.addRoute(/^\/$/, handleHomeRoute)
router.addRoute(/^\/echo\/(?<msg>.+)$/, handleEchoRoute)
router.addRoute(/^\/user-agent$/, handleUserAgentRoute)
router.addRoute(/^\/files\/(?<file>.+)$/, handleFileRoute)

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    try {
      const req = data.toString()
      const path = req.split(" ")[1]
      const method = req.split(" ")[0].trim()
      const reqBody = req.split("\r\n\r\n")[1]
      const usrAgentHeader = req.split("\n").find(line => line.startsWith("User-Agent:"))
      const encodingHeader = req.split("\n").find(line => line.startsWith("Accept-Encoding:"))
      const encodings = encodingHeader ? encodingHeader.slice(17).trim().split(", ") : undefined
      console.log(`ENCODING=(${encodings})`)
      const usrAgent = usrAgentHeader ? usrAgentHeader.slice(12).trim() : undefined
      console.log(req)
      let res = await router.handleReq(method, path, usrAgent, reqBody, encodings)
      if (res !== undefined) {
        socket.write(res.headers, 'ascii')
        socket.write(res.body)
      } else {
        let errorResponse = await new responseBuilder().status(404).buildResponse()
        socket.write(errorResponse.headers, 'ascii')
        socket.write(errorResponse.body)
      }
    } catch (err) {
      console.error("Error processing request!", err)
      let errorResponse = await new responseBuilder().status(500).buildResponse()
      socket.write(errorResponse.headers, 'ascii')
      socket.write(errorResponse.body)
    } finally {
      socket.end()
    }
  })
})

server.listen(PORT, "localhost", () => {
  console.log(`Server is running on port ${PORT}`)
})
