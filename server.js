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
            res.status(400).json({ error: err.message });
        } else {
            res.json({ message: 'User registered successfully' });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.getUser(username, (err, user) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else if (!user) {
            res.status(401).json({ error: 'User not found' });
        } else if (user.password !== password) {
            res.status(401).json({ error: 'Incorrect password' });
        } else {
            res.json({ message: 'Login successful' });
        }
    });
});

app.post('/createConvo', (req, res) => {
    const { name, participants } = req.body;
    db.createConversation(name, participants, (err, convoId) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ id: convoId, message: 'Conversation created successfully' });
        }
    });
});

app.get('/convos/:user', (req, res) => {
    const { user } = req.params;
    db.getConversations(user, (err, convos) => {
        if (err) {
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
            res.status(400).json({ error: err.message });
        } else {
            res.json({ id: messageId, message: 'Message sent successfully' });
        }
    });
});

app.get('/messages/:convoId', (req, res) => {
    const { convoId } = req.params;
    db.getMessages(convoId, (err, messages) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json(messages);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});