var rcon = require('rcon/node-rcon.js');
const express = require("express");


const app = express();
const PORT = process.env.PORT;
const RCON_IP = '51.222.147.157';
const RCON_PORT = 8011;
const RCON_PASSWORD = '819VDe1x3l201';

var rconAuthenticated = false;
var messages = ["e", "e2", "ee3"];

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

app.get("/", (req, res) => {
    if (rconAuthenticated) {
        conn.send('tellraw @a {"text": "' + messages[Math.floor(Math.random() * messages.length)] + '"}');
        console.log("Announcement sent");
    }
    res.status(200).send("OK");
});

app.use(express.json());
app.post("/", (req, res) => {
    messages = req.body.messages;
    console.log(messages);
    res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});