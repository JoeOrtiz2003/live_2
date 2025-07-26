// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

let controlState = { action: "show", timestamp: Date.now() };
let wwcdGame = "Game 1"; // default
let killsGame = "Game 1"; // default
let matchRankingGame = "Game 1"; // default

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get current state
app.get('/api/control', (req, res) => {
  // Always include the last selected WWCD game
  res.json({ ...controlState, wwcdGame, killsGame, matchRankingGame });
});

// Set new state
app.post('/api/control', (req, res) => {
  const { action, game } = req.body;
  if (["show", "hide", "refresh", "scoreboard_show", "scoreboard_hide"].includes(action)) {
    controlState = { action, timestamp: Date.now() };
    res.json({ success: true });
  } else if (action === "wwcd" && game) {
    wwcdGame = game;
    controlState = { action, game, timestamp: Date.now() };
    res.json({ success: true });
  } else if (action === "kills" && game) {
    killsGame = game;
    controlState = { action, game, timestamp: Date.now() };
    res.json({ success: true });
  } else if (action === "match_ranking" && game) {
    matchRankingGame = game;
    controlState = { action, game, timestamp: Date.now() };
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid action" });
  }
});

// Serve controller.html at /controller
app.get('/Controller', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'controller.html'));
});

// Serve display.html at /display
app.get('/Ranking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// Serve scoreboard.html at /scoreboard
app.get('/Scoreboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scoreboard.html'));
});

app.get('/Kills', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kills.html'));
});

app.get('/Match', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'match.html'));
});

// Serve wwcd.html at /WWCD
app.get('/WWCD', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'wwcd.html'));
});

// Serve ranking2.html at /Ranking2
app.get('/Ranking2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ranking.html'));
});

// Fallback: redirect to controller
app.get('*', (req, res) => {
  res.redirect('/controller');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
