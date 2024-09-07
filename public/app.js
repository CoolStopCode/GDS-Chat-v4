//app.js
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
            applyCustomColors();
            addOptionsButton();
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

function showOptionsPage() {
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('options-section').style.display = 'block';
    loadOptions();
}

function showChatSection() {
    document.getElementById('options-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'flex';
}

function loadOptions() {
    document.getElementById('options-username').textContent = currentUser;
    document.getElementById('bg-dark-color').value = localStorage.getItem(`${currentUser}_bgDarkColor`) || getComputedStyle(document.documentElement).getPropertyValue('--bg-dark').trim();
    document.getElementById('bg-medium-color').value = localStorage.getItem(`${currentUser}_bgMediumColor`) || getComputedStyle(document.documentElement).getPropertyValue('--bg-medium').trim();
    document.getElementById('bg-light-color').value = localStorage.getItem(`${currentUser}_bgLightColor`) || getComputedStyle(document.documentElement).getPropertyValue('--bg-light').trim();
    document.getElementById('text-primary-color').value = localStorage.getItem(`${currentUser}_textPrimaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    document.getElementById('text-secondary-color').value = localStorage.getItem(`${currentUser}_textSecondaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    document.getElementById('accent-primary-color').value = localStorage.getItem(`${currentUser}_accentPrimaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
    document.getElementById('accent-secondary-color').value = localStorage.getItem(`${currentUser}_accentSecondaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
    document.getElementById('accent-tertiarysecondary-color').value = localStorage.getItem(`${currentUser}_accentTertiaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--accent-tertiary').trim();
    document.getElementById('app-version-display').textContent = APP_INFO.version;
    document.getElementById('last-update').textContent = new Date().toLocaleDateString();
}

function saveOptions() {
    const bgDarkColor = document.getElementById('bg-dark-color').value;
    const bgMediumColor = document.getElementById('bg-medium-color').value;
    const bgLightColor = document.getElementById('bg-light-color').value;
    const textPrimaryColor = document.getElementById('text-primary-color').value;
    const textSecondaryColor = document.getElementById('text-secondary-color').value;
    const accentPrimaryColor = document.getElementById('accent-primary-color').value;
    const accentSecondaryColor = document.getElementById('accent-secondary-color').value;
    const accentTertiaryColor = document.getElementById('accent-tertiary-color').value;

    localStorage.setItem(`${currentUser}_bgDarkColor`, bgDarkColor);
    localStorage.setItem(`${currentUser}_bgMediumColor`, bgMediumColor);
    localStorage.setItem(`${currentUser}_bgLightColor`, bgLightColor);
    localStorage.setItem(`${currentUser}_textPrimaryColor`, textPrimaryColor);
    localStorage.setItem(`${currentUser}_textSecondaryColor`, textSecondaryColor);
    localStorage.setItem(`${currentUser}_accentPrimaryColor`, accentPrimaryColor);
    localStorage.setItem(`${currentUser}_accentSecondaryColor`, accentSecondaryColor);
    localStorage.setItem(`${currentUser}_accentTertiaryColor`, accentTertiaryColor);

    applyCustomColors();
    alert('Options saved successfully!');
    showChatSection();
}

function applyCustomColors() {
    const bgDarkColor = localStorage.getItem(`${currentUser}_bgDarkColor`) || getComputedStyle(document.documentElement).getPropertyValue('--bg-dark').trim();
    const bgMediumColor = localStorage.getItem(`${currentUser}_bgMediumColor`) || getComputedStyle(document.documentElement).getPropertyValue('--bg-medium').trim();
    const bgLightColor = localStorage.getItem(`${currentUser}_bgLightColor`) || getComputedStyle(document.documentElement).getPropertyValue('--bg-light').trim();
    const textPrimaryColor = localStorage.getItem(`${currentUser}_textPrimaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const textSecondaryColor = localStorage.getItem(`${currentUser}_textSecondaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const accentPrimaryColor = localStorage.getItem(`${currentUser}_accentPrimaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
    const accentSecondaryColor = localStorage.getItem(`${currentUser}_accentSecondaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
    const accentTertiaryColor = localStorage.getItem(`${currentUser}_accentTertiaryColor`) || getComputedStyle(document.documentElement).getPropertyValue('--accent-tertiary').trim();

    document.documentElement.style.setProperty('--bg-dark', bgDarkColor);
    document.documentElement.style.setProperty('--bg-medium', bgMediumColor);
    document.documentElement.style.setProperty('--bg-light', bgLightColor);
    document.documentElement.style.setProperty('--text-primary', textPrimaryColor);
    document.documentElement.style.setProperty('--text-secondary', textSecondaryColor);
    document.documentElement.style.setProperty('--accent-primary', accentPrimaryColor);
    document.documentElement.style.setProperty('--accent-secondary', accentSecondaryColor);
    document.documentElement.style.setProperty('--accent-tertiary', accentTertiaryColor);
}

function signOut() {
    if (confirm("Are you sure you want to sign out?")) {
        currentUser = '';
        currentConvo = null;
        stopRealTimeUpdates();
        location.reload();
    }
}

function clearCache() {
    localStorage.clear();
    currentUser = '';
    currentConvo = null;
    stopRealTimeUpdates();
    location.reload();
}

function addOptionsButton() {
    const optionsButton = document.createElement('button');
    optionsButton.textContent = 'Options';
    optionsButton.onclick = showOptionsPage;
    document.getElementById('sidebar').prepend(optionsButton);
}

// Event listeners
document.getElementById('message').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('save-options').addEventListener('click', saveOptions);
document.getElementById('sign-out').addEventListener('click', signOut);
document.getElementById('clear-cache').addEventListener('click', clearCache);

// Display app version
document.addEventListener('DOMContentLoaded', function() {
    const versionElement = document.createElement('div');
    versionElement.id = 'app-version';
    versionElement.textContent = `v${APP_INFO.version}`;
    document.body.appendChild(versionElement);
});