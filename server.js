const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Allow requests from the dashboard
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const server = http.createServer(app);
const io = socketIo(server);

let investments = [];
let uptrendMarketValue = 0;
let downtrendMarketValue = 0;

// Serve the chart page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.emit('investmentList', investments);
  socket.emit('marketValues', { uptrend: uptrendMarketValue, downtrend: downtrendMarketValue }); // Emit initial market values to new client
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

  // Update market values
  switch (investment.marketMove) {
    case 'uptrend':
      uptrendMarketValue += investment.amount;
      break;
    case 'downtrend':
      downtrendMarketValue += investment.amount;
      break;
    default:
      break;
  }

  io.emit('marketValues', { uptrend: uptrendMarketValue, downtrend: downtrendMarketValue }); // Broadcast updated market values to all clients

  res.status(200).send('Investment added');
});

app.delete('/clear-investments', (req, res) => {
  investments = [];
  uptrendMarketValue = 0;
  downtrendMarketValue = 0;
  io.emit('investmentList', investments);
  io.emit('marketValues', { uptrend: uptrendMarketValue, downtrend: downtrendMarketValue }); // Broadcast updated market values to all clients
  res.status(200).send('All investments cleared');
});

// Endpoint to get current market values
app.get('/current-market-value', (req, res) => {
  res.json({ uptrend: uptrendMarketValue, downtrend: downtrendMarketValue });
});

server.listen(5000, () => console.log('Main chart server listening on port 5000'));
