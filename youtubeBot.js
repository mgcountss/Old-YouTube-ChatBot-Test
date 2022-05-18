const { google } = require('googleapis');
const util = require('util');
const fs = require('fs');
let archive = require('./archive.json');
let liveChatId = fs.readFileSync('./liveChatId.txt', 'utf8');
const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);
require('dotenv').config();
let chatMessages = require('./chatMessages.json');
let users = require('./users.json');

const save = async (path, str) => {
  await writeFilePromise(path, str);
};

const read = async path => {
  const fileContents = await readFilePromise(path);
  return JSON.parse(fileContents);
};

const youtube = google.youtube('v3');
const OAuth2 = google.auth.OAuth2;

const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const redirectURI = process.env.redirectURI2;

const scope = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

const auth = new OAuth2(clientId, clientSecret, redirectURI);

const youtubeService = {};

youtubeService.getCode = response => {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope
  });
  response.redirect(authUrl);
};

// Request access from tokens using code from login
youtubeService.getTokensWithCode = async code => {
  const credentials = await auth.getToken(code);
  youtubeService.authorize(credentials);
};

// Storing access tokens received from google in auth object
youtubeService.authorize = ({ tokens }) => {
  auth.setCredentials(tokens);
  save('./botToken.json', JSON.stringify(tokens));
};

auth.on('tokens', tokens => {
  if (tokens.refresh_token) {
    save('./botToken.json', JSON.stringify(auth.tokens));
  }
});

// Read tokens from stored file
const checkTokens = async () => {
  const tokens = await read('./botToken.json');
  if (tokens) {
    auth.setCredentials(tokens);
  }
};

let currentGiveaway = require('./currentGiveaway.json');

youtubeService.giveaway = giveaway => {
  currentGiveaway = giveaway;
  fs.writeFileSync('./currentGiveaway.json', JSON.stringify(currentGiveaway));
  //youtubeService.insertMessage("A new giveaway has been created! Type " + giveaway.keyword + " to enter!");
};
youtubeService.giveawayEnd = async () => {
  currentGiveaway.enabled = false;
  fs.writeFileSync('./currentGiveaway.json', JSON.stringify(currentGiveaway));
};
youtubeService.winner = async () => {
  const winner = currentGiveaway.users[Math.floor(Math.random() * currentGiveaway.users.length)];
  //youtubeService.insertMessage(winner.name + ' has won the giveaway!');
  currentGiveaway.winner = winner;
  fs.writeFileSync('./currentGiveaway.json', JSON.stringify(currentGiveaway));
  return winner;
};

youtubeService.respond = newMessages => {
  let commands = require('./commands.json');
  let blacklist = require('./blacklist.json');
  if (newMessages) {
    newMessages.forEach(message => {
      if (archive.includes(message.id) == false) {
        archive.push(message.id);
        chatMessages.push(message);
        let index = users.findIndex(x => x.id === message.authorDetails.channelId);
        let rank = "User"
        if (message.authorDetails.isChatOwner == true) {
          rank = "Owner"
        } else if (message.authorDetails.isChatModerator == true) {
          'Moderator'
        } else if (message.authorDetails.isChatSponsor == true) {
          'Sponsor'
        } else if (message.authorDetails.isVerified == true) {
          'Verified'
        }
        if (index == -1) {
          users.push({
            "id": message.authorDetails.channelId,
            "name": message.authorDetails.displayName,
            "image": message.authorDetails.profileImageUrl,
            "messages": 1,
            "points": 0,
            "hours": 0,
            "lastMSG": new Date().getTime(),
            "rank": rank
          });
        } else {
          if (users[index].lastMSG - new Date().getTime() >= 300000) {
            users[index].hours += 0.0833333333333;
            users[index].points += Math.floor(Math.random(1, 25) * 10);
          } else {
            users[index].points += 0.5;
          }
          users[index].name = message.authorDetails.displayName;
          users[index].messages++;
          users[index].lastMSG = new Date().getTime();
          users[index].image = message.authorDetails.profileImageUrl
          users[index].rank = rank
        }
        fs.writeFileSync('./users.json', JSON.stringify(users));
        if (blacklist.includes(message.authorDetails.channelId) == false) {
          let messageText = message.snippet.displayMessage.toLowerCase();
          let isChatModerator = message.authorDetails.isChatModerator;
          let isChatOwner = message.authorDetails.isChatOwner;
          let isChatSponsor = message.authorDetails.isChatSponsor;
          let isVerified = message.authorDetails.isVerified;
          if (currentGiveaway.keyword) {
            if (messageText.toLowerCase() == currentGiveaway.keyword.toLowerCase() && currentGiveaway.enabled == true) {
              if (currentGiveaway.permissions == "mods" && isChatModerator == true) {
                if (currentGiveaway.requirements !== "none") {
                  if (currentGiveaway.requirements.includes('points_')) {
                    if (users[index].points >= parseInt(currentGiveaway.requirements.split('_')[1])) {
                      g()
                    } else {
                      youtubeService.insertMessage(message.authorDetails.displayName + " => You need at least " + currentGiveaway.requirements.split('_')[1] + " points to enter!");
                    }
                  } else if (currentGiveaway.requirements.includes('hours_')) {
                    if (users[index].points >= parseInt(currentGiveaway.requirements.split('_')[1])) {
                      g()
                    } else {
                      youtubeService.insertMessage(message.authorDetails.displayName + " => You need at least " + currentGiveaway.requirements.split('_')[1] + " hours to enter!");
                    }
                  }
                }
              } else if (currentGiveaway.permissions == "everyone") {
                if (currentGiveaway.requirements !== "none") {
                  if (currentGiveaway.requirements.includes('points_')) {
                    if (users[index].points >= parseFloat(currentGiveaway.requirements.split('_')[1])) {
                      g()
                    } else {
                      youtubeService.insertMessage(message.authorDetails.displayName + " => You need at least " + currentGiveaway.requirements.split('_')[1] + " points to enter!");
                    }
                  } else if (currentGiveaway.requirements.includes('hours_')) {
                    if (users[index].points >= parseFloat(currentGiveaway.requirements.split('_')[1])) {
                      g()
                    } else {
                      youtubeService.insertMessage(message.authorDetails.displayName + " => You need at least " + currentGiveaway.requirements.split('_')[1] + " hours to enter!");
                    }
                  }
                }
              }
              function g() {
                let index = currentGiveaway.users.findIndex(x => x.id === message.authorDetails.channelId);
                if (index == -1) {
                  currentGiveaway.users.push({
                    "id": message.authorDetails.channelId,
                    "name": message.authorDetails.displayName,
                    "image": message.authorDetails.profileImageUrl
                  });
                  fs.writeFileSync('./currentGiveaway.json', JSON.stringify(currentGiveaway));
                  youtubeService.insertMessage(message.authorDetails.displayName + " has entered the giveaway!");
                } else {
                  youtubeService.insertMessage(message.authorDetails.displayName + " => You have already entered this giveaway!");
                }
              }
            }
          }
          commands.forEach(command => {
            if (messageText.includes(' ')) {
              if (messageText.split(' ')[0] == (command.keyword)) {
                if (command.permissions.mods == true && isChatModerator == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.owner == true && isChatOwner == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.sponsor == true && isChatSponsor == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.verified == true && isVerified == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.everyone == true) {
                  handleCommand(command, message, messageText)
                }
              }
            } else {
              if (messageText == command.keyword) {
                if (command.permissions.mods == true && isChatModerator == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.owner == true && isChatOwner == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.sponsor == true && isChatSponsor == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.verified == true && isVerified == true) {
                  handleCommand(command, message, messageText)
                } else if (command.permissions.everyone == true) {
                  handleCommand(command, message, messageText)
                }
              }
            }
          });
        }
      }
    });
  }
  while (chatMessages.length > 100) {
    chatMessages.shift();
  }
  while (archive.length > 100) {
    archive.shift();
  }
  save('./chatMessages.json', JSON.stringify(chatMessages));
  save('./archive.json', JSON.stringify(archive));
};

function handleCommand(command, message, messageText) {
  command.response = command.response.replace(/\$\{username\}/g, message.authorDetails.displayName);
  command.response = command.response.replace(/\$\{query\}/g, messageText.split('' + command.keyword + ' ')[1]);
  youtubeService.insertMessage(command.response);
}
youtubeService.insertMessage = messageText => {
  youtube.liveChatMessages.insert(
    {
      auth,
      part: 'snippet',
      resource: {
        snippet: {
          type: 'textMessageEvent',
          liveChatId,
          textMessageDetails: {
            messageText
          }
        }
      }
    },
    (err) => {
      if (err) {
        console.log('error:', err);
      }
    }
  );
};

checkTokens();

module.exports = youtubeService;