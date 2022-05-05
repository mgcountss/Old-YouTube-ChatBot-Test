const { google } = require('googleapis');
const util = require('util');
const fs = require('fs');
let liveChatId = fs.readFileSync('./liveChatId.txt', 'utf8');
const youtubeBot = require('./youtubeBot.js');
let nextPage;
const intervalTime = 5000;
let interval;
let chatMessages = [];
const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);
require('dotenv').config();

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
const redirectURI = process.env.redirectURI1;
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

youtubeService.getTokensWithCode = async code => {
  const credentials = await auth.getToken(code);
  youtubeService.authorize(credentials);
};

youtubeService.authorize = ({ tokens }) => {
  auth.setCredentials(tokens);
  save('./streamerToken.json', JSON.stringify(tokens));
};

youtubeService.findActiveChat = async () => {
  const response = await youtube.liveBroadcasts.list({
    auth,
    part: 'snippet',
    mine: 'true'
  });
  const latestChat = response.data.items[0];
  if (latestChat && latestChat.snippet.liveChatId) {
    fs.writeFileSync('./liveChatId.txt', latestChat.snippet.liveChatId);
    liveChatId = latestChat.snippet.liveChatId;
  }
};

auth.on('tokens', tokens => {
  if (tokens.refresh_token) {
    save('./streamerToken.json', JSON.stringify(auth.tokens));
  }
});

const checkTokens = async () => {
  const tokens = await read('./streamerToken.json');
  if (tokens) {
    auth.setCredentials(tokens);
  }
};

const getChatMessages = async () => {
  const response = await youtube.liveChatMessages.list({
    auth,
    part: 'snippet,authorDetails',
    liveChatId,
    pageToken: nextPage
  });
  const { data } = response;
  chatMessages = data.items;
  nextPage = data.nextPageToken;
  youtubeBot.respond(chatMessages);
};

youtubeService.startTrackingChat = () => {
  interval = setInterval(getChatMessages, intervalTime);
};

youtubeService.stopTrackingChat = () => {
  clearInterval(interval);
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

module.exports = youtubeService;