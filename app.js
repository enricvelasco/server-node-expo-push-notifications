const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const { Expo } = require("expo-server-sdk");

const app = express();
const expo = new Expo();
const {port} = require('./config/environment');


app.use(cors());
app.options('*', cors());
app.use(express.static(__dirname + '/'));

// Use Node.js body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

/*** EXPO *****/
let savedPushTokens = [];
const handlePushTokens = ({ title, body }) => {
  let notifications = [];
  console.log('PUSH_TOKEN_', savedPushTokens)
  for (let pushToken of savedPushTokens) {
    console.log('PUSH_TOKEN')
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    notifications.push({
      to: pushToken,
      sound: "default",
      title: title,
      body: body,
      data: { body }
    });
  }
  /* notifications.push({
    to: 'ExponentPushToken[2n3fSbBNoVKh0r7o4XbvMx]',
    sound: "default",
    title: title,
    body: body,
    data: { body }
  }); */

  let chunks = expo.chunkPushNotifications(notifications);

  (async () => {
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};

const saveToken = token => {
  console.log(token, savedPushTokens);
  const exists = savedPushTokens.find(t => t === token);
  if (!exists) {
    console.log('SAVE_TOKEN', token)
    savedPushTokens.push(token);
  }
};

app.use(express.json());

app.post("/token", (req, res) => {
  console.log('TOKEN_RECEIVED:', req.body.token)
  saveToken(req.body.token);
  console.log(`Received push token, ${req.body.token.value}`);
  res.send({value: 'ok'});
});

app.post("/message", (req, res) => {
  handlePushTokens(req.body);
  console.log(`Received message, with title: ${req.body.title}`);
  res.send(`Received message, with title: ${req.body.title}`);
});

app.listen(port, () => {
  console.log(`Server Online on Port ${port}`);
});
/**************/

app.get('/', (req, res) => {
  res.send('PUSH_SERVER')
})

/* app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})*/
