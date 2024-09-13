//server.js

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.registerUser(username, password, (err) => {
        if (err) {
            console.error(`While registering ${username}: Error in /register:`, err.message);
            res.status(400).json({ error: err.message });
        } else {
            console.log(`User ${username} registered successfully`);
            res.json({ message: 'Registry successfull' });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.getUser(username, (err, user) => {
        if (err) {
            console.error(`Error while loging in ${username}: /login:`, err.message);
            res.status(400).json({ error: err.message });
        } else if (!user) {
            console.warn(`User ${username} not found`);
            res.status(401).json({ error: 'User not found' });
        } else if (user.password !== password) {
            console.warn(`Incorrect password for user ${username}`);
            res.status(401).json({ error: 'Incorrect password' });
        } else {
            console.log(`User ${username} logged in successfully`);
            res.json({ message: 'Login successful' });
        }
    });
});

app.post('/createConvo', (req, res) => {
    const { name, participants } = req.body;
    console.log(`Creating conversation: ${name} with participants: ${participants.join(', ')}`);
    db.createConversation(name, participants, (err, convoId) => {
        if (err) {
            console.error('Error in /createConvo:', err.message);
            res.status(400).json({ error: err.message });
        } else {
            console.log(`Conversation ${name} created successfully with ID: ${convoId}`);
            res.json({ id: convoId, message: 'Conversation created successfully' });
        }
    });
});

app.post('/leaveConvo', (req, res) => {
    const { convoId, username } = req.body;
    db.removeUserFromConversation(convoId, username, (err) => {
        if (err) {
            console.error(`While removing ${username} from ${convoId}: /leaveConvo:`, err.message);
            res.status(400).json({ error: err.message });
        } else {
            console.log(`User ${username} removed from ${convoId} conversation`)
            res.json({ message: "removed user" });
        }
    });
});

app.get('/convos/:user', (req, res) => {
    const { user } = req.params;
    db.getConversations(user, (err, convos) => {
        if (err) {
            console.error(`While fetching messages for ${user}: /convos:`, err.message);
            res.status(400).json({ error: err.message });
        } else {
            res.json(convos);
        }
    });
});

app.post('/send', (req, res) => {
    const { sender, convoId, message } = req.body;
    db.sendMessage(sender, convoId, message, (err, messageId) => {
        if (err) {
            console.error(`While ${sender} sending message to ${convoId} /send:`, err.message);
            res.status(400).json({ error: err.message });
        } else {
            console.log(`Message sent by ${sender} in conversation ${convoId} with ID: ${messageId}`);
            res.json({ id: messageId, message: 'Message sent successfully' });
        }
    });
});

app.get('/messages/:convoId', (req, res) => {
    const { convoId } = req.params;
    db.getMessages(convoId, (err, messages) => {
        if (err) {
            console.error('While fetching messages for ${convoId}: /messages:', err.message);
            res.status(400).json({ error: err.message });
        } else {
            res.json(messages);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
