import * as net from "net";
import * as fs from "fs/promises"

type RouterHandler = (method: string, params: { [key: string]: string }, usrAgent?: string, reqBody?: string, encodings?: string[]) => Promise<string>

type Route = {
  pattern: RegExp;
  handler: RouterHandler;
}

const statuses: { [key: number]: string } = {
  200: "OK",
  405: "Method Not Allowed",
  404: "Not Found",
  201: "Created",
  500: "Internal Server Error",
}

const serverEncodings: string[] = ["gzip"]

class Router {
  private routes: Route[] = [];

  addRoute(pattern: RegExp, handler: RouterHandler) {
    this.routes.push({ pattern, handler })
  }

  async handleReq(method: string, path: string, usrAgent?: string, reqBody?: string, encodings?: string[]): Promise<string | undefined> {
    if (!path) {
      console.error("Path is not defined!")
      return undefined
    }
    for (const route of this.routes) {
      const match = path.match(route.pattern)

      if (match) {
        const params = match.groups || {}
        console.log(params)
        return await route.handler(method, params, usrAgent, reqBody, encodings)
      }
    }
    console.log("No route matched")
    return undefined
  }
}

const router = new Router()

class responseBuilder {
  private statusCode: number = 0;
  private contentBody: string = "";
  private headers: { [key: string]: string } = {};
  private clrf: string = "\r\n";

  status(code: number): this {
    this.statusCode = code
    return this
  }

  header(key: string, value: string): this {
    this.headers[key] = value
    return this
  }

  body(content: string): this {
    this.contentBody = content
    return this
  }

  buildResponse(acceptEncodings?: string[]): string {
    console.log("Encoding inside builder: ", acceptEncodings)
    if (acceptEncodings !== undefined) {
      let values: string[] = []
      for (let i = 0; i < acceptEncodings.length; i++) {
        if (serverEncodings.includes(acceptEncodings[i])) {
          values.push(acceptEncodings[i])
        }
      }
      let valuesStr = values.join(", ")
      this.header("Content-Encoding", valuesStr)
    }
    const statusMsg = statuses[this.statusCode] || "Unknown Status"
    const headers = Object.entries(this.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join(this.clrf)
    const responseStr = `HTTP/1.1 ${this.statusCode} ${statusMsg}${this.clrf}`
    return `${responseStr}${headers}${this.clrf}${this.clrf}${this.contentBody}`
  }
}

// ROUTES:
router.addRoute(/^\/$/, async (method) => {
  if (method === "GET") {
    return new responseBuilder().status(200).buildResponse()
  }
  return new responseBuilder().status(405).buildResponse()
})
router.addRoute(/^\/echo\/(?<msg>.+)$/, async (method, params, userAgent, reqBody, encodings) => {
  if (method === "GET") {
    return new responseBuilder()
      .status(200)
      .header("Content-Type", "text/plain")
      .header("Content-Length", params.msg.length.toString())
      .body(params.msg)
      .buildResponse(encodings)
  }
  return new responseBuilder().status(405).buildResponse()
})
router.addRoute(/^\/user-agent$/, async (method, params, userAgent, reqBody, encodings) => {
  const res = userAgent || "No User-Agent provided"
  if (method === "GET") {
    return new responseBuilder()
      .status(200)
      .header("Content-Type", "text/plain")
      .header("Content-Length", res.length.toString())
      .body(res)
      .buildResponse(encodings)
  }
  return new responseBuilder().status(405).buildResponse()
})

const baseDir = process.argv[3]

router.addRoute(/^\/files\/(?<file>.+)$/, async (method, params, userAgent, reqBody, encodings) => {
  if (method === "GET") {
    try {
      const path = `${baseDir}${params.file}`
      console.log(`baseDir: ${baseDir}, path: ${path}`)
      const fileData = await fs.readFile(path, "utf-8")
      return new responseBuilder()
        .status(200)
        .header("Content-Type", "application/octet-stream")
        .header("Content-Length", fileData.length.toString())
        .body(fileData)
        .buildResponse(encodings)
    } catch (err) {
      console.log("Error has occurred while reading file: ", err)
      return new responseBuilder().status(404).buildResponse()
    }
  } else if (method === "POST") {
    const reqMsg = reqBody || "Request body is empty"
    const path = `${baseDir}${params.file}`
    try {
      await fs.writeFile(path, reqMsg)
      return new responseBuilder().status(201).buildResponse()
    } catch (err) {
      console.log("Error has occurred while writting a file: ", err)
      return new responseBuilder().status(500).buildResponse()
    }
  }
  return new responseBuilder().status(405).buildResponse()
})

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    try {
      const req = data.toString()
      const path = req.split(" ")[1]
      const method = req.split(" ")[0].trim()
      const reqBody = req.split("\r\n\r\n")[1];
      const usrAgentHeader = req.split("\n").find(line => line.startsWith("User-Agent:"))
      const encodingHeader = req.split("\n").find(line => line.startsWith("Accept-Encoding:"))
      const encodings = encodingHeader ? encodingHeader.slice(17).trim().split(", ") : undefined
      console.log(`ENCODING=(${encodings})`)
      const usrAgent = usrAgentHeader ? usrAgentHeader.slice(12).trim() : undefined
      console.log(req)
      let res = await router.handleReq(method, path, usrAgent, reqBody, encodings)
      if (res !== undefined) {
        socket.write(res)
      } else {
        socket.write(new responseBuilder().status(404).buildResponse())
      }
    } catch (err) {
      console.error("Error processing request!", err)
      socket.write(new responseBuilder().status(500).buildResponse())
    } finally {
      socket.end()
    }
  })
});

// You can use print statements as follows for debugging, they"ll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
