const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { PORT } = require('./config.js');


let app = express();
app.options('*', cors({
  origin: ['http://13.53.130.105:3000', 'http://13.53.130.105:3001','http://13.53.130.105', 'http://localhost:4000', 'https://supplier-web-app.maestrotest.info', 'http://localhost:3000'],
  credentials: true
}));
// I am not sure whether it is safe app.options('*', cors()) 
app.use(cors({
    origin: ['http://13.53.130.105:3000', 'http://13.53.130.105:3001','http://13.53.130.105', 'http://localhost:4000', 'https://supplier-web-app.maestrotest.info', 'http://localhost:3000'], //temporary localhost for the mobile version test
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(express.static('wwwroot'));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: ['http://13.53.130.105:3000', 'http://13.53.130.105:3001', 'http://13.53.130.105', 'http://localhost:4000',  'https://supplier-web-app.maestrotest.info', 'http://localhost:3000'], //temporary localhost for the mobile version test
      methods: ["GET", "POST"],
      credentials: true,
      optionsSuccessStatus: 200,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE']
    }
});  

app.use(require('./routes/auth.js'));
app.use(require('./routes/models.js'));
app.use(require('./routes/AssemblySelector.js')(io));

server.listen(PORT, function () { console.log(`Server listening on port ${PORT}...`); });
