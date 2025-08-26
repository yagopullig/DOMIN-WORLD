// manager.js - gerencia salas, estado do jogo e validação simples de jogadas
const jwt = require('jsonwebtoken');
const Move = require('../models/move');
const User = require('../models/user');

function shuffle(array){ return array.sort(()=>Math.random()-0.5); }

class GameRoom {
  constructor(name){
    this.name = name;
    this.players = []; // [{id, username, socketId}]
    this.board = []; // peças no tabuleiro em ordem
    this.hands = {}; // userId -> [{a,b},...]
    this.turnIndex = 0;
    this.boneyard = []; // peças remanescentes para comprar
    this.started = false;
  }
}

class GameManager {
  constructor(io){
    this.io = io;
    this.rooms = {}; // name -> GameRoom
  }

  async joinRoom(socket, roomName, token){
    // Decodifica token (não é autenticação rigorosa aqui, apenas ilustração)
    let payload = null;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    } catch(e){ throw new Error('Token inválido'); }

    const user = await User.findById(payload.id).select('-password');
    if(!user) throw new Error('Usuário não existe');
    socket.join(roomName);

    if(!this.rooms[roomName]) this.rooms[roomName] = new GameRoom(roomName);
    const room = this.rooms[roomName];

    // adiciona jogador se não existir
    if(!room.players.find(p=>p.id==user._id.toString())){
      room.players.push({ id: user._id.toString(), username: user.username, socketId: socket.id });
    } else {
      // atualiza socketId
      const p = room.players.find(p=>p.id==user._id.toString());
      p.socketId = socket.id;
    }

    // se já houver 2 jogadores e jogo não iniciou, inicia o jogo
    if(room.players.length >= 2 && !room.started){
      this.startGame(room);
    } else {
      this.io.to(roomName).emit('roomUpdate', this.publicRoom(room));
    }
  }

  startGame(room){
    // gera todas as peças do dominó (0-6)
    const pieces = [];
    for(let a=0;a<=6;a++) for(let b=a;b<=6;b++) pieces.push({a,b});
    const shuffled = shuffle(pieces);
    // distribui 7 peças para cada jogador (caso 2 jogadores)
    const perPlayer = 7;
    room.players.forEach((p,i)=>{
      room.hands[p.id] = shuffled.slice(i*perPlayer, (i+1)*perPlayer);
    });
    room.boneyard = shuffled.slice(room.players.length*perPlayer);
    room.board = [];
    room.turnIndex = 0; // jogador 0 começa
    room.started = true;
    this.io.to(room.name).emit('gameStart', this.publicRoom(room));
    // enviar mão individual para cada jogador
    room.players.forEach(p => {
      const sock = this.io.sockets.sockets.get(p.socketId);
      if(sock) sock.emit('yourHand', room.hands[p.id]);
    });
  }

  publicRoom(room){
    return {
      name: room.name,
      players: room.players.map(p=>({ id: p.id, username: p.username })),
      board: room.board,
      handsCount: Object.fromEntries(Object.entries(room.hands).map(([k,v])=>[k,v.length])),
      turnPlayerId: room.players[room.turnIndex] ? room.players[room.turnIndex].id : null,
      started: room.started
    };
  }

  findRoom(roomName){
    return this.rooms[roomName];
  }

  tileMatches(tile, edge){
    // edge is number on board extremity
    return tile.a===edge || tile.b===edge;
  }

  // move = { userId, tile: {a,b}, side: 'left'|'right' }
  async handleMove(socket, roomName, move){
    const room = this.findRoom(roomName);
    if(!room) throw new Error('Sala não encontrada');
    const playerIndex = room.players.findIndex(p=>p.id===move.userId);
    if(playerIndex === -1) throw new Error('Jogador não nesta sala');
    if(room.players[room.turnIndex].id !== move.userId) throw new Error('Não é a vez deste jogador');

    const hand = room.hands[move.userId] || [];
    const tileIndex = hand.findIndex(t => (t.a===move.tile.a && t.b===move.tile.b) || (t.a===move.tile.b && t.b===move.tile.a));
    if(tileIndex === -1) throw new Error('Peça não encontrada na mão');

    // validação simples: se board vazio, qualquer peça serve
    if(room.board.length === 0){
      room.board.push(move.tile);
      hand.splice(tileIndex,1);
    } else {
      const left = room.board[0].a !== undefined ? room.board[0] : room.board[0];
      const right = room.board[room.board.length-1];
      const leftEdge = room.board[0].a === undefined ? null : room.board[0].a;
      // compute edges as values on free sides
      const leftVal = room.board[0].a === undefined ? null : room.board[0].a;
      const rightVal = room.board[room.board.length-1].b === undefined ? null : room.board[room.board.length-1].b;

      // simpler: derive left number and right number from current board ends
      const leftNum = room.board[0].a !== undefined ? room.board[0].a : room.board[0].a;
      const rightNum = room.board[room.board.length-1].b !== undefined ? room.board[room.board.length-1].b : room.board[room.board.length-1].b;

      // Actually compute extremes properly:
      const leftExtreme = room.board[0].a !== undefined ? room.board[0].a : room.board[0].a;
      const rightExtreme = room.board[room.board.length-1].b !== undefined ? room.board[room.board.length-1].b : room.board[room.board.length-1].b;

      const leftEdgeNum = room.board[0].a;
      const rightEdgeNum = room.board[room.board.length-1].b;

      // allow if tile matches left or right edge numbers (considering rotation)
      const matchesLeft = (move.tile.a === leftEdgeNum) || (move.tile.b === leftEdgeNum);
      const matchesRight = (move.tile.a === rightEdgeNum) || (move.tile.b === rightEdgeNum);

      if(move.side === 'left' && matchesLeft){
        room.board.unshift(move.tile);
        hand.splice(tileIndex,1);
      } else if(move.side === 'right' && matchesRight){
        room.board.push(move.tile);
        hand.splice(tileIndex,1);
      } else {
        throw new Error('Jogada inválida - peça não conecta nas extremidades');
      }
    }

    // grava jogada (simplificado)
    await Move.create({ user: move.userId, tiles: [move.tile] });

    // atualiza vez
    room.turnIndex = (room.turnIndex + 1) % room.players.length;

    this.io.to(room.name).emit('gameUpdate', this.publicRoom(room));
    // enviar mãos atualizadas individualmente
    room.players.forEach(p => {
      const sock = this.io.sockets.sockets.get(p.socketId);
      if(sock) sock.emit('yourHand', room.hands[p.id]);
    });
// se houver bot na vez, acionar jogada automática simples
const currentPlayer = room.players[room.turnIndex];
if(currentPlayer && currentPlayer.username && currentPlayer.username.toLowerCase().includes('bot')){
  setTimeout(()=>{
    try{
      const botHand = room.hands[currentPlayer.id] || [];
      let played = false;
      if(room.board.length===0 && botHand.length>0){
        const tile = botHand[0];
        room.board.push(tile); botHand.splice(0,1);
        played = true;
      } else {
        const leftEdge = room.board[0].a;
        const rightEdge = room.board[room.board.length-1].b;
        for(let i=0;i<botHand.length;i++){
          const t = botHand[i];
          if(t.a===leftEdge||t.b===leftEdge){ room.board.unshift(t); botHand.splice(i,1); played=true; break; }
          if(t.a===rightEdge||t.b===rightEdge){ room.board.push(t); botHand.splice(i,1); played=true; break; }
        }
      }
      if(played){
        room.turnIndex = (room.turnIndex + 1) % room.players.length;
        this.io.to(room.name).emit('gameUpdate', this.publicRoom(room));
        room.players.forEach(p => {
          const sock = this.io.sockets.sockets.get(p.socketId);
          if(sock) sock.emit('yourHand', room.hands[p.id]);
        });
      }
    }catch(e){ /* ignore bot errors */ }
  }, 800);
}

  }

  handleDisconnect(socket){
    // remove socketId de players quando desconectar
    Object.values(this.rooms).forEach(room => {
      const p = room.players.find(p=>p.socketId===socket.id);
      if(p) p.socketId = null;
      // opcional: remover player se desconectar por muito tempo
    });
  }
}

module.exports = GameManager;
