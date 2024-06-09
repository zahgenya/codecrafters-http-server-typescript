# HTTP Server
This is my implementation of HTTP server built using Node.js. The server supports handling multiple routes, serves files, and supports gzip compression.
## Features
- Handle multiple routes with different HTTP methods.
- Serve files from a specified directory.
- Support gzip compression for responses.
## Requirements
- Node.js (>= 14.x) tested on 20.12.2
- Bun need to be installed globaly
## Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/zahgenya/codecrafters-http-server-typescript
    cd codecrafters-http-server-typescript
    ```
2. Install dependencies (if any):
    ```bash
    npm install
    ```
## Usage
To run the server:
```bash
$ ./your_server.sh
```
## Compression
The server supports gzip compression for responses if the client requests it via the Accept-Encoding header.
## Files feature
The HTTP server supports serving files from a specified directory, allowing users to interact with resources stored on the server. Users can specify the base directory from which files will be served as a command-line argument when starting the server. This directory argument enables flexibility, as users can configure the server to serve files from different locations on their system or network. 
## Environment Variables
PORT: The port number on which the server listens (default is 4221).