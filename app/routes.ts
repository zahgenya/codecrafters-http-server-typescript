import { baseDir } from "./consts"
import { responseBuilder } from "./responseBuilder"
import * as fs from "fs/promises"

export async function handleFileRoute(method: string, params: { [key: string]: string }, userAgent?: string, reqBody?: string, encodings?: string[]): Promise<{ headers: string, body: Buffer }> {
  if (method === "GET") {
    try {
      const path = `${baseDir}${params.file}`
      console.log(`baseDir: ${baseDir}, path: ${path}`)
      const fileData = await fs.readFile(path, "utf-8")
      return new responseBuilder()
        .status(200)
        .header("Content-Type", "application/octet-stream")
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
}

export async function handleUserAgentRoute(method: string, params: { [key: string]: string }, userAgent?: string, reqBody?: string, encodings?: string[]): Promise<{ headers: string, body: Buffer }> {
  const res = userAgent || "No User-Agent provided"
  if (method === "GET") {
    return new responseBuilder()
      .status(200)
      .header("Content-Type", "text/plain")
      .body(res)
      .buildResponse(encodings)
  }
  return new responseBuilder().status(405).buildResponse()
}

export async function handleEchoRoute(method: string, params: { [key: string]: string }, userAgent?: string, reqBody?: string, encodings?: string[]): Promise<{ headers: string, body: Buffer }> {
  if (method === "GET") {
    return new responseBuilder()
      .status(200)
      .header("Content-Type", "text/plain")
      .body(params.msg)
      .buildResponse(encodings)
  }
  return new responseBuilder().status(405).buildResponse()
}

export async function handleHomeRoute(method: string): Promise<{ headers: string, body: Buffer }> {
  if (method === "GET") {
    return new responseBuilder().status(200).buildResponse()
  }
  return new responseBuilder().status(405).buildResponse()
}
