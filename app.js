const express = require("express");
const app = express();
var messages = ["e", "e2", "ee3"];

app.get("/", (req, res) => {
    res.send(messages);
});

app.use(express.json());
app.post("/", (req, res) => {
    messages = req.body.messages;
    console.log(messages);
    res.status(200).send("OK");
});

app.listen(3000, () => {
    console.log(`Server is listening on port 3000`);
});