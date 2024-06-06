const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
app.use(express.json()); // to parse JSON bodies

const server = http.createServer(app);
const io = socketIo(server);

let investmentList = []; // Store the list of investments

app.get('/', (req, res) => {
    res.send('Welcome to the Market Mayhem server!');
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.emit('investmentList', investmentList); // Send the investment list to the client
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.post('/investment', (req, res) => {
    const investment = req.body;
    console.log('Received investment:', investment);

    // Generate a timestamp representing the current time
    const timestamp = Date.now();

    // Add the timestamp to the investment object
    investment.timestamp = timestamp;

    investmentList.push(investment); // Add the new investment to the list

    io.emit('investmentList', investmentList); // Send the updated investment list to all clients
    console.log('Broadcasted updated investment list');

    res.status(200).send('Investment added');
});

// New endpoint to get the investment list as JSON
app.get('/investments', (req, res) => {
    res.json(investmentList);
});

// New endpoint to clear all investment history
app.delete('/clear-investments', (req, res) => {
    investmentList = []; // Reset investment list to an empty array
    io.emit('investmentList', investmentList); // Emit the empty list to all clients
    console.log('All investment history cleared');
    res.status(200).send('All investment history cleared');
});

server.listen(5000, () => console.log('User actions server listening on port 5000'));
