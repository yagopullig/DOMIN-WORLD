require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const GameManager = require('./game/manager');

app.use(cors());
app.use(express.json());

// rate limiter básico
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Socket.IO - gerenciamento de salas e jogadas
const manager = new GameManager(io);

io.on('connection', (socket) => {
  console.log('Socket conectado:', socket.id);

  socket.on('joinRoom', async ({ room, token }) => {
    try {
      await manager.joinRoom(socket, room, token);
    } catch (err) {
      socket.emit('errorMessage', err.message);
    }
  });

  socket.on('makeMove', async ({ room, move }) => {
    try {
      await manager.handleMove(socket, room, move);
    } catch (err) {
      socket.emit('errorMessage', err.message);
    }
  });

  socket.on('disconnect', () => {
    manager.handleDisconnect(socket);
    console.log('Socket disconnect:', socket.id);
  });
socket.on('chatMessage', ({ room, message }) => {
  try {
    // simples sanitização server-side
    const sanitize = (t) => {
      if(!t || typeof t !== 'string') return '';
      let s = t.trim();
      s = s.replace(/(idiota|burro|palavrão)/ig, '***');
      if(s.length > 1000) s = s.slice(0,1000);
      return s;
    };
    const clean = sanitize(message);
    // broadcast para a sala
    io.to(room).emit('chatMessage', { id: Date.now(), text: clean, from: socket.id });
  } catch(e){ socket.emit('errorMessage', 'Erro no chat'); }
});
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dominoworld', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async ()=>{
  console.log('MongoDB conectado');
  // Cria admin se não existir
  const User = require('./models/user');
  const adminUser = await User.findOne({ username: 'admin' });
  if(!adminUser){
    await User.create({ username: 'admin', password: process.env.ADMIN_PASS || 'Admin@123', role: 'admin' });
    console.log('Usuário admin criado (username: admin)');
  }
  server.listen(PORT, ()=> console.log('Servidor rodando na porta', PORT));
}).catch(err=>{
  console.error('Erro MongoDB:', err.message);
  process.exit(1);
});
