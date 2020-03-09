import chatSpeed from "./ChatSpeed/speed";
import info from "./StreamInfo/info";
import admin from "firebase-admin";
const serviceAccount = require("../adminKey.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://rendogtv-viewers-bot.firebaseio.com"
  });
} catch (error) {}

import tmi from "tmi.js";
require("dotenv").config();

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  connection: {
    secure: false,
    reconnect: true
  },
  channels: [process.env.CHANNEL_NAME]
};

process.stdout.write(
  String.fromCharCode(27) + "]0;" + "RenBot" + String.fromCharCode(7)
);

// Create a client with our options
const client = new tmi.client(opts);
export default client;

console.log("Created Client");

import ChatHandler from "./chatHandler";
import WhisperHandler from "./whisperHandler";
import say from "./say";
import botManagement from "./utilities/botManagement";
import commands from "./utilities/commands";
import activeFeatures from "./utilities/activeFeatures";

client.on("chat", ChatHandler);
client.on("whisper", WhisperHandler);
client.on("slowmode", chatSpeed.slowModeUpdate);
client.on("connected", onConnectedHandler);

// Connect to Twitch:
client.connect();

function onConnectedHandler(addr, port) {
  console.log(`* I have a connection`);
  try {
    const fs = require('fs');
    const restart = JSON.parse(fs.readFileSync("./restart.json"));
    console.dir(restart);
    if (restart.restart) {
      if (Date.now() - restart.restartTime < 60*1000)
      say("rendogtv", "Restart complete, @ me again");
      fs.writeFileSync("./restart.json", JSON.stringify({restart: false, restartTime: 0}));
    }
    info.startWebhook();
      
  } catch (error) {
    console.dir(error);
  }
}

setInterval(() => {
  if (!info.isLive()) {
    console.log("Restarting listeners, 6 hours since last time");
    commands.restartListner();
    activeFeatures.restartListner();
  }
}, 1000*60*60*3);

// Restarts the bot every 7 days to keep the webhook going
// If he is live, postpones the restart, checking every hour and then restarts when he is offline
setTimeout(() => {
  if (!info.isLive()) {
    botManagement.restart();
  } else {
    setInterval(() => {
      if (!info.isLive()) {
        botManagement.restart();
      }
    }, 1000*60*60);
  }
}, 1000*60*60*24*7);