const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./chat.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS conversation_participants (conversation_id INTEGER, username TEXT, FOREIGN KEY(conversation_id) REFERENCES conversations(id), FOREIGN KEY(username) REFERENCES users(username))");
    db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER, sender TEXT, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(conversation_id) REFERENCES conversations(id))");
});

function registerUser(username, password, callback) {
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], callback);
}

function getUser(username, callback) {
    db.get("SELECT * FROM users WHERE username = ?", [username], callback);
}

function createConversation(name, participants, callback) {
    db.run("INSERT INTO conversations (name) VALUES (?)", [name], function(err) {
        if (err) {
            return callback(err);
        }
        const convoId = this.lastID;
        const stmt = db.prepare("INSERT INTO conversation_participants (conversation_id, username) VALUES (?, ?)");
        participants.forEach(participant => {
            stmt.run(convoId, participant);
        });
        stmt.finalize(err => {
            if (err) {
                return callback(err);
            }
            callback(null, convoId);
        });
    });
}

function removeUserFromConversation(convoId, username, callback) {
    console.log(`Database: Removing user ${username} from conversation ${convoId}`);
    
    // First, check if the user is in the conversation
    db.get("SELECT * FROM conversation_participants WHERE conversation_id = ? AND username = ?", 
        [convoId, username], 
        (err, row) => {
            if (err) {
                console.error('Error checking participant:', err.message);
                return callback(err);
            }
            if (!row) {
                console.log(`User ${username} not found in conversation ${convoId}`);
                return callback(new Error('User not found in the conversation'));
            }
            
            // If user is found, proceed with removal
            db.run("DELETE FROM conversation_participants WHERE conversation_id = ? AND username = ?", 
                [convoId, username], 
                function(err) {
                    if (err) {
                        console.error('Error deleting participant:', err.message);
                        return callback(err);
                    }
                    console.log(`Removed user ${username} from conversation ${convoId}. Rows affected: ${this.changes}`);
                    callback(null);
                }
            );
        }
    );
}



function getConversations(username, callback) {
    db.all(`
        SELECT c.id, c.name, GROUP_CONCAT(cp.username, ', ') as participants
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE c.id IN (SELECT conversation_id FROM conversation_participants WHERE username = ?)
        GROUP BY c.id
    `, [username], callback);
}

function sendMessage(sender, convoId, message, callback) {
    db.run("INSERT INTO messages (conversation_id, sender, message) VALUES (?, ?, ?)", 
        [convoId, sender, message], 
        function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, this.lastID);
        }
    );
}

function getMessages(convoId, callback) {
    db.all("SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC", [convoId], callback);
}

module.exports = {
    registerUser,
    getUser,
    createConversation,
    getConversations,
    sendMessage,
    getMessages,
    removeUserFromConversation
};