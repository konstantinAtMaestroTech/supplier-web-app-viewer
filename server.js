const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { PORT } = require('./config.js');

let app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('wwwroot'));

const server = http.createServer(app);
const io = socketIo(server);

app.use(require('./routes/auth.js'));
app.use(require('./routes/models.js'));
app.use(require('./routes/AssemblySelector.js')(io));

server.listen(PORT, function () { console.log(`Server listening on port ${PORT}...`); });
