const { google } = require('googleapis');
const util = require('util');
const fs = require('fs');
let archive = require('./archive.json');
let liveChatId = fs.readFileSync('./liveChatId.txt', 'utf8');
const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);
require('dotenv').config();
let chatMessages = require('./chatMessages.json');

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

youtubeService.respond = newMessages => {
  newMessages.forEach(message => {
    if (archive.includes(message.etag) == false) {
      const messageText = message.snippet.displayMessage.toLowerCase();
      archive.push(message.etag);
      chatMessages.push(message);
      if (messageText.includes('thank')) {
        const author = message.authorDetails.displayName;
        const response = `You're welcome ${author}!`;
        youtubeService.insertMessage(response);
      }
    }
  });
  save('./chatMessages.json', JSON.stringify(chatMessages));
  save('./archive.json', JSON.stringify(archive));
};

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

// As we progress throug this turtorial, Keep the following line at the nery bottom of the file
// It will allow other files to access to our functions
module.exports = youtubeService;