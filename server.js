const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server);

let investments = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.emit('investmentList', investments);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.post('/investment', (req, res) => {
  const investment = req.body;
  const timestamp = Math.floor(Date.now() / 1000);
  investment.timestamp = timestamp;
  console.log('Received investment:', investment);

  investments.push(investment);
  io.emit('investmentList', investments);
  res.status(200).send('Investment added');
});

app.delete('/clear-investments', (req, res) => {
  investments = [];
  io.emit('investmentList', investments);
  res.status(200).send('All investments cleared');
});

server.listen(5000, () => console.log('Main chart server listening on port 5000'));
