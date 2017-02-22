const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(app);

const draws = {};
let newDraws = {};
let incrementer = 0;

const onJoined = (sock) => {
  const socket = sock;

  socket.join('lobby');

  socket.emit('join', draws);
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('clientUpdate', (data) => {
    // make a new time
    const date = new Date();
    const year = date.getUTCFullYear();
    let month = date.getUTCMonth();
    if (month < 10) { month = `0${month}`; }
    let day = date.getUTCDate();
    if (day < 10) { day = `0${day}`; }
    let hour = date.getUTCHours();
    if (hour < 10) { hour = `0${hour}`; }
    let minutes = date.getUTCMinutes();
    if (minutes < 10) { minutes = `0${minutes}`; }
    let seconds = date.getUTCSeconds();
    if (seconds < 10) { seconds = `0${seconds}`; }
    let milliseconds = date.getUTCMilliseconds();
    if (milliseconds < 100) { milliseconds = `0${milliseconds}`; }
    if (milliseconds < 10) { milliseconds = `0${milliseconds}`; }

    // check if XXXX:XX:XX:XX:XX:XX:XXX:0 exists
    if (draws[`${year}:${month}:${day}:${hour}:${minutes}:${seconds}:${milliseconds}:0`]) {
      // loop intil you find a valid XXXX:XX:XX:XX:XX:XX:XXX:Y
      while (draws[`${year}:${month}:${day}:${hour}:${minutes}:${seconds}:${milliseconds}:${incrementer}`]) {
        incrementer++;
      }
    }
    
    draws[`${year}:${month}:${day}:${hour}:${minutes}:${seconds}:${milliseconds}:${incrementer}`] = data;
    newDraws[`${year}:${month}:${day}:${hour}:${minutes}:${seconds}:${milliseconds}:${incrementer}`] = data;

    incrementer = 0;

    socket.emit('serverReturnUpdate', { timestamp: `${year}:${month}:${day}:${hour}:${minutes}:${seconds}:${milliseconds}:${incrementer}`, square: data });
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
});

console.log('Websocket server started');

setInterval(() => {
  io.sockets.in('lobby').emit('serverUpdate', newDraws);
  newDraws = {};
}, 1000);
