const express = require('express');
const path = require('path');
const youtubeBot = require('./youtubeBot.js');
const youtubeClient = require('./youtubeClient.js');
const botToken = require('./botToken.json');
const streamerToken = require('./streamerToken.json');
const chatMessages = require('./chatMessages.json');
const server = express();

server.get('/', (req, res) => {
    if (streamerToken.access_token && botToken.access_token) {
        res.sendFile(path.join(__dirname + '/index.html'))
    } else {
        res.redirect('/setup');
    }
});

server.get('/dashboard', (req, res) => {
    if (streamerToken.access_token && botToken.access_token) {
        res.sendFile(path.join(__dirname + '/dashboard.html'))
    } else {
        res.redirect('/dashboard');
    }
});

server.get('/status', (req, res) => {
    let send = {
        bot: false,
        streamer: false
    }
    if (streamerToken.access_token) {
        send.streamer = true;
    }
    if (botToken.access_token) {
        send.bot = true;
    }
    res.send(send);
});

server.get('/api/chatMessages', (req, res) => {
    res.send(chatMessages);
});

server.get('/api/sendMessage', (req, res) => {
    if (req.query.message.length > 0) {
        if (req.query.sender === 'bot') {
            youtubeBot.insertMessage(req.query.message);
        } else {
            youtubeClient.insertMessage(req.query.message);
        }
        res.send('Message sent');
    } else {
        res.send({ 'error': 'Message too short' });
    }
});

server.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname + '/setup.html'));
})

server.get('/authorize/bot', (request, response) => {
    youtubeBot.getCode(response);
});

server.get('/callback/bot', (req, response) => {
    const { code } = req.query;
    youtubeBot.getTokensWithCode(code);
    response.redirect('/');
});

server.get('/authorize/client', (request, response) => {
    youtubeClient.getCode(response);
});

server.get('/callback/client', (req, response) => {
    const { code } = req.query;
    youtubeClient.getTokensWithCode(code);
    response.redirect('/');
});

server.get('/start-tracking-chat', (req, res) => {
    youtubeClient.startTrackingChat();
    res.redirect('/');
});

server.get('/stop-tracking-chat', (req, res) => {
    youtubeClient.stopTrackingChat();
    res.redirect('/');
});

server.get('/insert-message', (req, res) => {
    youtubeBot.insertMessage('Hello World');
    res.redirect('/');
});

setTimeout(function () {
    youtubeClient.findActiveChat();
    youtubeClient.startTrackingChat();
}, 5000)

server.listen(80, function () {
    console.log('ChatBot is Online');
});