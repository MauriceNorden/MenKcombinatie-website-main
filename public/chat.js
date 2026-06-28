const socket = io();

const chatAuth     = document.getElementById('chat-auth');
const chatAuthcode = document.getElementById('chat-authcode');
const chatroom     = document.getElementById('chatroom');
const inputZone    = document.getElementById('input_zone');
const usersBar     = document.getElementById('chat-users-bar');
const usersList    = document.getElementById('chat-users-list');

// Check session on page load
fetch('/me')
    .then(r => r.json())
    .then(data => { if (data.loggedIn) showChatRoom(); });

// Nieuwe gebruiker
document.getElementById('form-join').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    if (!username) return;

    const res = await fetch('/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}`
    });
    const data = await res.json();

    if (data.error) { showFormError('form-join', data.error); return; }

    document.getElementById('authcode-display').textContent = data.authCode;
    chatAuth.style.display = 'none';
    chatAuthcode.style.display = 'block';
});

// Terugkerende gebruiker: alleen code
document.getElementById('form-rejoin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const authCode = e.target.authCode.value.trim();

    const res = await fetch('/rejoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `authCode=${encodeURIComponent(authCode)}`
    });
    const data = await res.json();

    if (data.error) { showFormError('form-rejoin', data.error); return; }

    reconnectAndEnter();
});

document.getElementById('enter-chat-btn').addEventListener('click', () => {
    reconnectAndEnter();
});

function reconnectAndEnter() {
    // Reconnect so socket picks up the new session cookie
    socket.disconnect();
    socket.connect();
    chatAuth.style.display = 'none';
    chatAuthcode.style.display = 'none';
    showChatRoom();
}

function showChatRoom() {
    chatAuth.style.display = 'none';
    chatAuthcode.style.display = 'none';
    chatroom.style.display = 'block';
    inputZone.style.display = 'flex';
    usersBar.style.display = 'flex';
    loadHistory();
}

async function loadHistory() {
    try {
        const res = await fetch('/messages');
        if (!res.ok) return;
        const messages = await res.json();
        chatroom.innerHTML = '';

        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const old    = messages.filter(m => parseTs(m.created_at) < cutoff);
        const recent = messages.filter(m => parseTs(m.created_at) >= cutoff);

        if (old.length > 0) {
            const details = document.createElement('details');
            details.className = 'old-messages';
            const summary = document.createElement('summary');
            summary.textContent = `${old.length} eerdere berichten`;
            details.appendChild(summary);
            old.forEach(m => details.appendChild(createMessageEl(m)));
            chatroom.appendChild(details);
        }

        recent.forEach(m => chatroom.appendChild(createMessageEl(m)));
        chatroom.scrollTop = chatroom.scrollHeight;
    } catch (err) {
        console.error('History load failed:', err);
    }
}

socket.on('message', (msg) => {
    if (chatroom.style.display !== 'block') return;
    chatroom.appendChild(createMessageEl(msg));
    chatroom.scrollTop = chatroom.scrollHeight;
});

socket.on('users-update', (users) => {
    usersList.textContent = users.length > 0 ? users.join(', ') : 'Niemand online';
});

document.getElementById('send_message').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message');
    const text = input.value.trim();
    if (text) {
        socket.emit('chat-message', text);
        input.value = '';
    }
});

function createMessageEl(msg) {
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML =
        `<strong>${escHtml(msg.username)}</strong>` +
        `<span class="msg-time">${formatTime(msg.created_at)}</span>` +
        `<span class="msg-text">${escHtml(msg.message)}</span>`;
    return div;
}

function formatTime(ts) {
    if (!ts) return '';
    const date = new Date(typeof ts === 'string' && !ts.includes('T')
        ? ts.replace(' ', 'T') + 'Z'
        : ts);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return timeStr;
    if (diffDays === 1) return `gisteren ${timeStr}`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + ' ' + timeStr;
}

function parseTs(ts) {
    if (!ts) return 0;
    return new Date(ts.replace(' ', 'T') + 'Z').getTime();
}

function showFormError(formId, msg) {
    const form = document.getElementById(formId);
    let err = form.querySelector('.form-error');
    if (!err) {
        err = document.createElement('p');
        err.className = 'form-error';
        form.insertBefore(err, form.firstChild);
    }
    err.textContent = msg;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
