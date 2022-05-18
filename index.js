const express = require('express');
const path = require('path');
const youtubeBot = require('./youtubeBot.js');
const youtubeClient = require('./youtubeClient.js');
const botToken = require('./botToken.json');
const streamerToken = require('./streamerToken.json');
const chatMessages = require('./chatMessages.json');
let users = require('./users.json');
let commands = require('./commands.json');
const server = express();
const bodyParser = require('body-parser');
const fs = require('fs');
server.use(bodyParser.json());
server.set('view engine', 'ejs');

server.get('/', (req, res) => {
    if (streamerToken.access_token && botToken.access_token) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/setup');
    }
});

server.get('/dashboard', (req, res) => {
    if (streamerToken.access_token && botToken.access_token) {
        res.sendFile(path.join(__dirname + '/dashboard.html'))
    } else {
        res.redirect('/');
    }
});

server.get('/commands', (req, res) => {
    if (streamerToken.access_token && botToken.access_token) {
        res.render('commands.ejs', {
            commands: commands
        });
    } else {
        res.redirect('/');
    }
});

server.get('/users', (req, res) => {
    if (streamerToken.access_token && botToken.access_token) {
        res.render('users.ejs', {
            users: users
        });
    } else {
        res.redirect('/');
    }
});

server.get('/giveaway', (req, res) => {
    if (streamerToken.access_token && botToken.access_token) {
        res.render('giveaway.ejs');
    } else {
        res.redirect('/');
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

server.post('/api/commands/delete', (req, res) => {
    let id = req.body.id;
    let index = commands.findIndex(x => x.id === id);
    if (index !== -1) {
        commands.splice(index, 1);
        fs.writeFileSync('./commands.json', JSON.stringify(commands));
        res.send({ "success": true });
    } else {
        res.send({ "error": 'Command not found.' })
    }
});

server.post('/api/commands/create', (req, res) => {
    let exists = false;
    commands.forEach(command => {
        if (command.keyword == req.body.keyword) {
            exists = true;
        }
    })
    if (exists == false) {
        commands.push({
            keyword: req.body.keyword,
            response: req.body.response,
            permissions: req.body.permissions,
            id: makeid(7)
        });
        fs.writeFileSync('./commands.json', JSON.stringify(commands));
        res.send({ "success": true });
    } else {
        res.send({ "success": false });
    }
});

server.post('/api/commands/edit', (req, res) => {
    let exists = false;
    commands.forEach(command => {
        if (command.keyword == req.body.keyword) {
            exists = true;
        }
    })
    if (exists == true) {
        let index = commands.findIndex(x => x.id === req.body.id);
        if (index !== -1) {
            commands[index].response = req.body.response;
            commands[index].keyword = req.body.keyword;
            commands[index].permissions = req.body.permissions;
            fs.writeFileSync('./commands.json', JSON.stringify(commands));
            res.send({ "success": true });
        }
    } else {
        res.send({ "success": false });
    }
});

server.post('/api/sendMessage', (req, res) => {
    if (req.body.message.length > 0) {
        if (req.body.sender === 'bot') {
            youtubeBot.insertMessage(req.body.message);
        } else {
            youtubeClient.insertMessage(req.body.message);
        }
        res.send({ "success": true });
    } else {
        res.send({ 'error': 'Message too short' });
    }
});

server.post('/giveaway/start', (req, res) => {
    console.log(req.body)
    if (req.body.command.length > 0 && req.body.prize.length > 0 && (req.body.require.split('_')[1].length > 0 || req.body.require == "none")) {
        let giveaway = {
            keyword: req.body.command,
            prize: req.body.prize,
            enabled: true,
            winner: {},
            users: [],
            permissions: req.body.perms,
            requirements: req.body.require
        }
        youtubeBot.giveaway(giveaway)
        res.send({ "success": true });
    } else {
        res.send({ 'error': 'Message too short' });
    }
});

server.post('/giveaway/end', (req, res) => {
    youtubeBot.giveawayEnd()
    res.send({ "success": true });
});

server.post('/giveaway/pick', async (req, res) => {
    let winner = await youtubeBot.winner();
    res.send({ "success": true, "winner": winner });
});

server.get('/api/giveaway', (req, res) => {
    fs.readFile('./currentGiveaway.json', 'utf8', (err, data) => {
        res.send(JSON.parse(data))
    })
})

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

function makeid(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

server.listen(80, function () {
    console.log('ChatBot is Online');
});