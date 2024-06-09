export type RouterHandler = (method: string, params: { [key: string]: string }, usrAgent?: string, reqBody?: string, encodings?: string[]) => Promise<{ headers: string, body: Buffer }>

export type Route = {
  pattern: RegExp;
  handler: RouterHandler;
}
