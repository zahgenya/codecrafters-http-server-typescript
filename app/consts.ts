export const statuses: { [key: number]: string } = {
  200: "OK",
  405: "Method Not Allowed",
  404: "Not Found",
  201: "Created",
  500: "Internal Server Error",
}

export const baseDir = process.argv[3]
export const serverEncodings: string[] = ["gzip"]
