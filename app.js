var rcon = require('rcon/node-rcon.js');
const https = require('https'); // Use 'http' for non-secure requests

const RCON_IP = process.env.RCON_IP || '0.0.0.0';
const RCON_PORT = process.env.RCON_PORT || 25575;
const RCON_PASSWORD = process.env.RCON_PASSWORD || ''; // The password has changed compared to the previous commits for obvious security reasons.

var rconAuthenticated = false;
var messages = ["wow", "wowiegee", "woowowwow"];

var conn = new rcon(RCON_IP, RCON_PORT, RCON_PASSWORD);
console.log("loading...");
conn.on('auth', function() {
        console.log("RCON Authenticated successfully");
        rconAuthenticated = true;
    }).on('response', function(str) {
        console.log("Response: " + str);
    }).on('error', function(err) {
        console.log("Error: " + err);
        rconAuthenticated = false;
        conn.connect();
    }).on('end', function() {
        console.log("Connection closed");
        rconAuthenticated = false;
        conn.connect();
    }
);
conn.connect();

function getRecentMessages() {
    https.get('https://announcements-voxia.onrender.com', (res) => {
        let serverMessages = '';
    
        res.on('data', (chunk) => {
            serverMessages += chunk;
        });
    
        res.on('end', () => {
            try {
                console.log(serverMessages);
                let messagesJSON = JSON.parse(serverMessages);
                messages = messagesJSON;
            } catch (error) {
                console.log('Error parsing JSON of most recent messages:', error);
            }
        });
    }).on('error', (err) => {
        console.log('failed to retrieve most recent messages: ' + err.message);
    });
}
getRecentMessages();
setInterval(getRecentMessages, 10000);

function getRandomEven(min, max) {
    min = Math.ceil(min / 2) * 2; // Ensure min is even
    max = Math.floor(max / 2) * 2; // Ensure max is even
    return Math.floor(Math.random() * ((max - min) / 2 + 1)) * 2 + min;
}

function sendAnnouncment() {
    if (rconAuthenticated) {
        let msgID = getRandomEven(0, messages.length-1);
        console.log("Sending message ID: " + msgID);
        let commands = [];
        if (messages[msgID + 1] != undefined){
            if (messages[msgID + 1] != ''){
                commands = messages[msgID+1].split("::");
                console.log("Commands: " + commands);
            }
            console.log("not undefined!");
        }
        if (messages[msgID] != "")
            conn.send('tellraw @a {"text": "' + messages[msgID] + '"}');
        if (commands.length > 0) {
            for (let i = 0; i < commands.length; i++) {
                conn.send(commands[i]);
                console.log("Sent command: " + commands[i]);
            }
        }
        console.log("Announcement sent");
    }
}
sendAnnouncment();
setInterval(sendAnnouncment, 30000);


// Express!!!
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Hello, this is the announcements manager for Voxia- wait how did you get here..?");
});

app.listen(3000, () => {
    console.log(`Server is listening on port 3000`);
});