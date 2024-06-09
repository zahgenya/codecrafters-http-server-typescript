import { Route, RouterHandler } from "./types"

export class Router {
  private routes: Route[] = []

  addRoute(pattern: RegExp, handler: RouterHandler) {
    this.routes.push({ pattern, handler })
  }

  async handleReq(method: string, path: string, usrAgent?: string, reqBody?: string, encodings?: string[]): Promise<{ headers: string, body: Buffer } | undefined> {
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
