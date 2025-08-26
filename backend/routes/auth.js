const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { sanitizeInput } = require('../middleware/security');
const createError = require('http-errors');

// Registro
router.post('/register', sanitizeInput, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) return next(createError(400, 'Dados inválidos'));
    const exist = await User.findOne({ username });
    if(exist) return next(createError(400, 'Usuário já existe'));
    const user = await User.create({ username, password });
    res.json({ message: 'Usuário criado', user: { id: user._id, username: user.username } });
  } catch(err) { next(err); }
});

// Login
router.post('/login', sanitizeInput, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return next(createError(401, 'Usuário ou senha inválidos'));
    const valid = await user.comparePassword(password);
    if(!valid) return next(createError(401, 'Usuário ou senha inválidos'));
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });
    res.json({ token });
  } catch(err){ next(err); }
});

module.exports = router;
