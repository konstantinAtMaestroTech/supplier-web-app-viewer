const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { PORT } = require('./config.js');

app.options('*', cors()) // I am not sure whether it is safe

let app = express();
app.use(cors({
    origin: ['http://13.53.130.105:3000', 'http://13.53.130.105:3001','http://13.53.130.105', 'http://localhost:4000', 'https://supplier-web-app.maestrotest.info'], //temporary localhost for the mobile version test
    credentials: true,
}));
app.use(express.json());
app.use(express.static('wwwroot'));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: ['http://13.53.130.105:3000', 'http://13.53.130.105:3001', 'http://13.53.130.105', 'http://localhost:4000',  'https://supplier-web-app.maestrotest.info'], //temporary localhost for the mobile version test
      methods: ["GET", "POST"],
      credentials: true
    }
});  

app.use(require('./routes/auth.js'));
app.use(require('./routes/models.js'));
app.use(require('./routes/AssemblySelector.js')(io));

server.listen(PORT, function () { console.log(`Server listening on port ${PORT}...`); });
