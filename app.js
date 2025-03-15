var rcon = require('rcon/node-rcon.js');
const https = require('https'); // Use 'http' for non-secure requests

const RCON_IP = '51.222.147.157';
const RCON_PORT = 8011;
const RCON_PASSWORD = '819VDe1x3l201';

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
                console.log('before: ' + messages);
                messages = JSON.parse(serverMessages);
                console.log('after: ' + messages);
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

function sendAnnouncment() {
    if (rconAuthenticated) {
        conn.send('tellraw @a {"text": "' + messages[Math.floor(Math.random() * messages.length)] + '"}');
        console.log("Announcement sent");
    }
}
sendAnnouncment();
setInterval(sendAnnouncment, 30000);