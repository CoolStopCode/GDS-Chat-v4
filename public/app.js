// DOM Elements
const elements = {
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authSection: document.getElementById('auth-section'),
    chatSection: document.getElementById('chat-section'),
    newConvoForm: document.getElementById('new-convo-form'),
    convoList: document.getElementById('convo-list'),
    currentConvoName: document.getElementById('current-convo-name'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message'),
    optionsSection: document.getElementById('options-section'),
    sidebar: document.getElementById('sidebar')
};

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// App State
let currentUser = '';
let currentConvo = null;
let updateInterval;

// Check for existing session
function checkExistingSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        elements.authSection.style.display = 'none';
        elements.chatSection.style.display = 'flex';
        loadConversations();
        startRealTimeUpdates();
        applyCustomColors();
    }
}

// Form Visibility Functions
function toggleForms(showRegister) {
    elements.loginForm.style.display = showRegister ? 'none' : 'block';
    elements.registerForm.style.display = showRegister ? 'block' : 'none';
}

// Input Validation
function validateInput(input, type) {
    const { min, max } = APP_INFO.limits[type];
    return input.length >= min && input.length <= max;
}

// Authentication Functions
function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    if (!validateInput(username, 'username') || !validateInput(password, 'password')) {
        alert(`Username must be ${APP_INFO.limits.username.min}-${APP_INFO.limits.username.max} characters. Password must be ${APP_INFO.limits.password.min}-${APP_INFO.limits.password.max} characters.`);
        return;
    }

    sendRequest('/register', { username, password }, (data) => {
        if (data.error) {
            alert(data.error);
        } else {
            alert('Registration successful. Please log in.');
            toggleForms(false);
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

    sendRequest('/login', { username, password }, (data) => {
        if (data.error) {
            alert(data.error);
        } else {
            currentUser = username;
            localStorage.setItem('currentUser', currentUser);
            elements.authSection.style.display = 'none';
            elements.chatSection.style.display = 'flex';
            loadConversations();
            startRealTimeUpdates();
            applyCustomColors();
            addOptionsButton();
        }
    });
}

// Conversation Management
function showNewConvoForm() {
    elements.newConvoForm.style.display = 'block';
}

function createNewConvo() {
    const name = document.getElementById('new-convo-name').value;
    const participants = document.getElementById('new-convo-participants').value.split(',').map(p => p.trim());
    participants.push(currentUser);
    
    sendRequest('/createConvo', { name, participants }, (data) => {
        if (data.error) {
            alert(data.error);
        } else {
            elements.newConvoForm.style.display = 'none';
            loadConversations();
        }
    });
}

function loadConversations() {
    fetchData(`/convos/${currentUser}`, updateConvoList);
}

function updateConvoList(convos) {
    elements.convoList.innerHTML = '';
    convos.forEach(convo => {
        const convoItem = document.createElement('div');
        convoItem.className = 'convo-item';
        convoItem.innerHTML = `
    <span>${convo.name}</span>
    <button class="delete-convo" onclick="deleteConversation('${convo.id}')">
        <i class="fas fa-trash"></i>
    </button>
`;
    convoItem.setAttribute('data-convoid', convo.id);

        convoItem.onclick = (e) => {
            if (!e.target.classList.contains('delete-convo') && !e.target.closest('.delete-convo')) {
                selectConversation(convo);
            }
        };
        elements.convoList.appendChild(convoItem);
    });
}

function selectConversation(convo) {
    currentConvo = convo;
    elements.currentConvoName.textContent = convo.name;
    loadMessages();
}

function deleteConversation(convoId) {
    if (confirm('Are you sure you want to leave this conversation?')) {
        // Request to remove the current user from the conversation
        sendRequest('/leaveConvo', { convoId, username: currentUser }, (data) => {
            if (data.error) {
                alert(data.error);
            } else {
                // Remove the conversation from the list in the UI
                const convoItem = document.querySelector(`.convo-item[data-convoid='${convoId}']`);
                if (convoItem) {
                    convoItem.remove();
                }

                // Clear the chat view if the user is currently viewing this conversation
                if (currentConvo && currentConvo.id === convoId) {
                    currentConvo = null;
                    elements.currentConvoName.textContent = '';
                    elements.messages.innerHTML = '';
                }

                // Reload the conversations list to reflect the changes
                loadConversations();
            }
        });
    }
}



// Message Management
function loadMessages() {
    if (!currentConvo) return;
    fetchData(`/messages/${currentConvo.id}`, updateMessageList);
}

function updateMessageList(messages) {
    elements.messages.innerHTML = '';
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = `${msg.sender}: ${msg.message}`;
        elements.messages.appendChild(messageDiv);
    });
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

function sendMessage() {
    if (!currentConvo) return;
    const message = elements.messageInput.value;
    
    if (!validateInput(message, 'message')) {
        alert(`Message must be ${APP_INFO.limits.message.min}-${APP_INFO.limits.message.max} characters.`);
        return;
    }

    sendRequest('/send', { sender: currentUser, convoId: currentConvo.id, message }, (data) => {
        if (data.error) {
            alert(data.error);
        } else {
            elements.messageInput.value = '';
            loadMessages();
        }
    });
}

// Real-time Updates
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

// Options Management
function showOptionsPage() {
    elements.chatSection.style.display = 'none';
    elements.optionsSection.style.display = 'block';
    loadOptions();
}

function showChatSection() {
    elements.optionsSection.style.display = 'none';
    elements.chatSection.style.display = 'flex';
}

function loadOptions() {
    document.getElementById('options-username').textContent = currentUser;
    ['bg-dark', 'bg-medium', 'bg-light', 'text-primary', 'text-secondary', 'accent-primary', 'accent-secondary'].forEach(option => {
        const colorInput = document.getElementById(`${option}-color`);
        const colorPreview = document.getElementById(`${option}-preview`);
        const savedColor = localStorage.getItem(`${currentUser}_${option}Color`) || getComputedStyle(document.documentElement).getPropertyValue(`--${option}`).trim();
        colorInput.value = savedColor;
        colorPreview.style.backgroundColor = savedColor;
        colorPreview.onclick = () => colorInput.click();
        colorInput.onchange = (e) => colorPreview.style.backgroundColor = e.target.value;
    });
    document.getElementById('app-version-display').textContent = APP_INFO.version;
    document.getElementById('last-update').textContent = new Date().toLocaleDateString();
}

function saveOptions() {
    ['bg-dark', 'bg-medium', 'bg-light', 'text-primary', 'text-secondary', 'accent-primary', 'accent-secondary'].forEach(option => {
        const value = document.getElementById(`${option}-color`).value;
        localStorage.setItem(`${currentUser}_${option}Color`, value);
    });
    applyCustomColors();
    alert('Options saved successfully!');
    showChatSection();
}

function applyCustomColors() {
    ['bg-dark', 'bg-medium', 'bg-light', 'text-primary', 'text-secondary', 'accent-primary', 'accent-secondary'].forEach(option => {
        const value = localStorage.getItem(`${currentUser}_${option}Color`) || getComputedStyle(document.documentElement).getPropertyValue(`--${option}`).trim();
        document.documentElement.style.setProperty(`--${option}`, value);
    });
}

// User Actions
function signOut() {
    if (confirm("Are you sure you want to sign out?")) {
        localStorage.removeItem('currentUser');
        currentUser = '';
        currentConvo = null;
        stopRealTimeUpdates();
        location.reload();
    }
}

function clearCache() {
    if (confirm("Are you sure you want to sign out and clear all local data?")) {
        localStorage.clear();
        currentUser = '';
        currentConvo = null;
        stopRealTimeUpdates();
        location.reload();
    }
}



// Helper Functions
function sendRequest(url, data, callback) {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(callback);
}

function fetchData(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(callback);
}

// Event Listeners
elements.messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('save-options').addEventListener('click', saveOptions);
document.getElementById('sign-out').addEventListener('click', signOut);
document.getElementById('clear-cache').addEventListener('click', clearCache);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const versionElement = document.createElement('div');
    versionElement.id = 'app-version';
    versionElement.textContent = `v${APP_INFO.version}`;
    document.body.appendChild(versionElement);
    checkExistingSession();
});