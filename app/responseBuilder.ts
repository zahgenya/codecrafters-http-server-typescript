import * as zlib from "zlib"
import { serverEncodings, statuses } from "./consts"

export class responseBuilder {
  private statusCode: number = 0
  private contentBody: string | Buffer = ""
  private headers: { [key: string]: string } = {}
  private clrf: string = "\r\n"

  status(code: number): this {
    this.statusCode = code
    return this
  }

  header(key: string, value: string): this {
    this.headers[key] = value
    return this
  }

  body(content: string | Buffer): this {
    this.contentBody = content
    return this
  }

  async buildResponse(acceptEncodings?: string[]): Promise<{ headers: string, body: Buffer }> {
    console.log("Encoding inside builder: ", acceptEncodings)
    let body = this.contentBody
    let validEncodings: string[] = []
    if (acceptEncodings !== undefined && acceptEncodings.length > 0) {
      for (let i = 0; i < acceptEncodings.length; i++) {
        if (serverEncodings.includes(acceptEncodings[i])) {
          validEncodings.push(acceptEncodings[i])
        }
      }
      if (validEncodings.includes("gzip")) {
        if (typeof body === "string") {
          body = Buffer.from(body, "utf8")
        }
        body = zlib.gzipSync(body)
        this.header("Content-Encoding", "gzip")
      }
    }
    this.header("Content-Length", body.length.toString())
    const statusMsg = statuses[this.statusCode] || "Unknown Status"
    const headers = Object.entries(this.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join(this.clrf)
    const responseStr = `HTTP/1.1 ${this.statusCode} ${statusMsg}${this.clrf}${headers}${this.clrf}${this.clrf}`
    return { headers: responseStr, body: Buffer.isBuffer(body) ? body : Buffer.from(body) }
  }
}
