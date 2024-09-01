let currentUser = '';
let currentConvo = null;
let updateInterval;

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function validateInput(input, type) {
    const limits = APP_INFO.limits[type];
    return input.length >= limits.min && input.length <= limits.max;
}

function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    if (!validateInput(username, 'username') || !validateInput(password, 'password')) {
        alert(`Username must be ${APP_INFO.limits.username.min}-${APP_INFO.limits.username.max} characters. Password must be ${APP_INFO.limits.password.min}-${APP_INFO.limits.password.max} characters.`);
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert('Registration successful. Please log in.');
            showLoginForm();
        }
    });
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!validateInput(username, 'username') || !validateInput(password, 'password')) {
        alert(`Invalid username or password length.`);
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            currentUser = username;
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('chat-section').style.display = 'flex';
            loadConversations();
            startRealTimeUpdates();
        }
    });
}

function showNewConvoForm() {
    document.getElementById('new-convo-form').style.display = 'block';
}

function createNewConvo() {
    const name = document.getElementById('new-convo-name').value;
    const participants = document.getElementById('new-convo-participants').value.split(',').map(p => p.trim());
    participants.push(currentUser);
    
    fetch('/createConvo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, participants }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById('new-convo-form').style.display = 'none';
            loadConversations();
        }
    });
}

function loadConversations() {
    fetch(`/convos/${currentUser}`)
        .then(response => response.json())
        .then(convos => {
            updateConvoList(convos);
        });
}

function updateConvoList(convos) {
    const convoList = document.getElementById('convo-list');
    convoList.innerHTML = '';
    convos.forEach(convo => {
        const convoItem = document.createElement('div');
        convoItem.className = 'convo-item';
        convoItem.textContent = convo.name;
        convoItem.onclick = () => selectConversation(convo);
        convoList.appendChild(convoItem);
    });
}

function selectConversation(convo) {
    currentConvo = convo;
    document.getElementById('current-convo-name').textContent = convo.name;
    loadMessages();
}

function loadMessages() {
    if (!currentConvo) return;
    fetch(`/messages/${currentConvo.id}`)
        .then(response => response.json())
        .then(messages => {
            updateMessageList(messages);
        });
}

function updateMessageList(messages) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = `${msg.sender}: ${msg.message}`;
        messagesDiv.appendChild(messageDiv);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    if (!currentConvo) return;
    const messageInput = document.getElementById('message');
    const message = messageInput.value;
    
    if (!validateInput(message, 'message')) {
        alert(`Message must be ${APP_INFO.limits.message.min}-${APP_INFO.limits.message.max} characters.`);
        return;
    }

    fetch('/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser, convoId: currentConvo.id, message }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            messageInput.value = '';
            loadMessages();
        }
    });
}

function startRealTimeUpdates() {
    updateInterval = setInterval(() => {
        loadConversations();
        if (currentConvo) {
            loadMessages();
        }
    }, 5000);
}

function stopRealTimeUpdates() {
    clearInterval(updateInterval);
}

// Event listeners
document.getElementById('message').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Display app version
document.addEventListener('DOMContentLoaded', function() {
    const versionElement = document.createElement('div');
    versionElement.id = 'app-version';
    versionElement.textContent = `v${APP_INFO.version}`;
    document.body.appendChild(versionElement);
});