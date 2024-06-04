import * as net from 'net';

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const req = data.toString()
    const path = req.split(' ')[1]
    console.log(req)
    if (path === '/') {
      socket.write('HTTP/1.1 200 OK\r\n\r\n')
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
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
