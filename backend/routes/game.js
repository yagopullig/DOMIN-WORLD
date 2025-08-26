const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { sanitizeInput } = require('../middleware/security');
const Game = require('../models/move');

router.get('/status', (req, res) => {
  res.json({ status: 'ok', msg: 'API de jogo funcionando' });
});

router.get('/moves', auth, async (req, res) => {
  const moves = await Game.find().limit(50).sort({createdAt:-1});
  res.json(moves);
});

module.exports = router;
