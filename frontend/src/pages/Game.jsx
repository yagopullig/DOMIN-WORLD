import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import DominoBoard from '../components/DominoBoard';
import Chat from '../components/Chat';

const SOCKET_URL = 'http://localhost:5000';

export default function Game(){
  const [socket, setSocket] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [roomName, setRoomName] = useState('sala1');

  useEffect(()=>{
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', ()=> console.log('Socket conectado:', s.id));
    s.on('roomUpdate', data => setRoomData(data));
    s.on('gameStart', data => setRoomData(data));
    s.on('gameUpdate', data => setRoomData(data));
    s.on('errorMessage', msg => alert('Erro: ' + msg));

    return ()=> s.disconnect();
  },[]);

  useEffect(()=>{
    if(socket){
      const token = localStorage.getItem('token');
      socket.emit('joinRoom', { room: roomName, token });
    }
  }, [socket, roomName]);

  return (
    <div className="flex gap-4">
      <div className="w-3/4"><DominoBoard socket={socket} roomData={roomData} /></div>
      <div className="w-1/4"><Chat socket={socket} roomName={roomName} roomData={roomData} /></div>
    </div>
  );
}
