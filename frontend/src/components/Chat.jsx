import React, { useEffect, useState } from 'react';

const OFFENSIVE = ['idiota','burro','palavrão']; // exemplo simples de bloqueio

function cleanMessage(t){
  let s = t;
  OFFENSIVE.forEach(w=> {
    s = s.replace(new RegExp(w, 'ig'), '***');
  });
  if(s.length>1000) s = s.slice(0,1000);
  return s;
}

export default function Chat({ socket, roomName, roomData }){
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  useEffect(()=>{
    if(!socket) return;
    socket.on('chatMessage', m => setMsgs(prev=>[...prev,m]));
    return ()=> socket.off('chatMessage');
  }, [socket]);

  const send = () => {
    if(!text.trim()) return;
    const clean = cleanMessage(text);
    if(socket) socket.emit('chatMessage', { room: roomName, message: clean });
    setMsgs(prev => [...prev, { id: Date.now(), text: clean }]);
    setText('');
  };

  return (
    <div className="border rounded p-3 h-[600px] bg-white flex flex-col">
      <div className="flex-1 overflow-auto">
        {msgs.map(m=> <div key={m.id} className="p-1">{m.text}</div>)}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="flex-1 border p-2" value={text} onChange={e=>setText(e.target.value)} placeholder="Mensagem" />
        <button onClick={send} className="bg-sky-600 text-white px-3 rounded">Enviar</button>
      </div>
    </div>
  );
}
