const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', ['http://localhost:3000','https://market-mayhem-client.onrender.com']); // Allow requests from the dashboard
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const server = http.createServer(app);
const io = socketIo(server);

let investments = [];
let latestCandlePoint = 0; // Initialize latest candle point

// Serve the chart page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.emit('investmentList', investments);
    socket.emit('latestCandlePoint', latestCandlePoint); // Emit initial candle point to new client
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
    
    latestCandlePoint = 0;
    io.emit('latestCandlePoint', latestCandlePoint); // Broadcast updated candle point to all clients
    
    res.status(200).send('All investments cleared');
});

// Endpoint to get the current market point
app.get('/current-market-point', (req, res) => {
    res.json({ currentMarketPoint: latestCandlePoint });
});

// Calculate and broadcast the latest candle point every 60 seconds
setInterval(() => {
    const lastMinuteInvestments = investments.filter(inv => inv.timestamp >= (Math.floor(Date.now() / 1000) - 60));
    console.log('Last minute investments:', lastMinuteInvestments); // Log last minute investments
    if (lastMinuteInvestments.length > 0) {
        latestCandlePoint = lastMinuteInvestments[lastMinuteInvestments.length - 1].amount;
    } else {
        latestCandlePoint = 0; // If no investments in the last minute, set to 0
    }
    io.emit('latestCandlePoint', latestCandlePoint);
}, 10000);

server.listen(5000, () => console.log('Main chart server listening on port 5000'));
