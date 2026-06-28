const express = require("express");
const session = require("express-session");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const Database = require("better-sqlite3");
const http = require("http");
const cors = require('cors');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server);
const db = new Database("chat.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  auth_code TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const sessionMiddleware = session({
    secret: "change-this-secret",
    resave: false,
    saveUninitialized: false
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// Track active socket connections: socket.id → username
const activeUsers = new Map();

// Chat API routes
app.post("/join", (req, res) => {
    const username = req.body.username?.trim();
    if (!username) return res.json({ error: "Gebruikersnaam verplicht" });

    const existing = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (existing) return res.json({ error: "Naam bestaat al. Gebruik rejoin." });

    const userId = uuidv4();
    const authCode = uuidv4();
    db.prepare("INSERT INTO users(id, username, auth_code) VALUES(?,?,?)").run(userId, username, authCode);

    req.session.userId = userId;
    res.json({ success: true, username, authCode });
});

// Rejoin: alleen auth code nodig
app.post("/rejoin", (req, res) => {
    const authCode = req.body.authCode?.trim();
    if (!authCode) return res.json({ error: "Code verplicht" });

    const user = db.prepare("SELECT * FROM users WHERE auth_code=?").get(authCode);
    if (!user) return res.json({ error: "Ongeldige code" });

    req.session.userId = user.id;
    res.json({ success: true, username: user.username });
});

app.get("/messages", (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });
    const messages = db.prepare(`
        SELECT m.message, m.created_at, u.username
        FROM messages m
        JOIN users u ON u.id = m.user_id
        ORDER BY m.id ASC
    `).all();
    res.json(messages);
});

app.get("/me", (req, res) => {
    if (!req.session.userId) return res.json({ loggedIn: false });
    const user = db.prepare("SELECT username FROM users WHERE id=?").get(req.session.userId);
    res.json({ loggedIn: !!user, username: user?.username || null });
});

io.on("connection", (socket) => {
    const userId = socket.request.session?.userId;
    if (!userId) return;

    const user = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
    if (!user) return;

    activeUsers.set(socket.id, user.username);
    io.emit("users-update", Array.from(activeUsers.values()));

    socket.on("disconnect", () => {
        activeUsers.delete(socket.id);
        io.emit("users-update", Array.from(activeUsers.values()));
    });

    socket.on("chat-message", (text) => {
        if (typeof text !== 'string') return;
        const safeText = text.trim().slice(0, 500);
        if (!safeText) return;

        const now = new Date().toISOString();
        db.prepare("INSERT INTO messages(user_id, message) VALUES(?,?)").run(userId, safeText);
        io.emit("message", { username: user.username, message: safeText, created_at: now });
    });
});

// AzuraCast webhook: fires when track or DJ changes
app.post('/nowplaying-change', (req, res) => {
    io.emit('nowplaying-change', req.body);
    res.status(200).json({ ok: true });
});

app.get('/', (req, res) => {
    res.render('index');
});

// Custom Cast receiver page (runs on Chromecast device)
app.get('/cast', (req, res) => {
    res.render('cast');
});

server.listen(3000, () =>
    console.log("http://localhost:3000")
);
