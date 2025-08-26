import React, { useEffect, useState } from 'react';

function TileSVG({a,b, className}){
  // simple SVG representation with numbers and dot patterns
  const width = 80, height = 40;
  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width={width} height={height} rx="6" ry="6" fill="#fff" stroke="#222" />
      <line x1={width/2} y1="4" x2={width/2} y2={height-4} stroke="#222" strokeWidth="1" />
      <text x={width*0.25} y={height*0.6} fontSize="14" fontWeight="600" textAnchor="middle" fill="#111">{a}</text>
      <text x={width*0.75} y={height*0.6} fontSize="14" fontWeight="600" textAnchor="middle" fill="#111">{b}</text>
    </svg>
  );
}

export default function DominoBoard({ socket, roomData }){
  const [hand, setHand] = useState([]);

  useEffect(()=>{
    if(!socket) return;
    socket.on('yourHand', h => setHand(h || []));
    return ()=> socket && socket.off('yourHand');
  }, [socket]);

  const makeMove = (tile, side) => {
    if(!socket || !roomData) return alert('Socket não conectado');
    const token = localStorage.getItem('token');
    if(!token) return alert('Token ausente');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;
    socket.emit('makeMove', { room: roomData.name, move: { userId, tile, side } });
    // add simple local animation class (optimistic UI)
    const el = document.getElementById('tile-' + tile.a + '-' + tile.b);
    if(el) { el.classList.add('played'); setTimeout(()=>el.classList.remove('played'), 900); }
  };

  // Drag handlers
  const onDragStart = (e, tile) => {
    e.dataTransfer.setData('application/json', JSON.stringify(tile));
  };
  const onDropSide = (e, side) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if(!data) return;
    const tile = JSON.parse(data);
    makeMove(tile, side);
  };
  const allowDrop = (e) => e.preventDefault();

  return (
    <div className="border rounded p-4 h-[600px] bg-white overflow-auto">
      <h2 className="font-bold mb-2">Tabuleiro de Dominó</h2>
      <div className="mb-3">
        <div className="text-sm text-gray-600">Sala: {roomData ? roomData.name : '—'}</div>
        <div className="text-sm text-gray-600">Jogadores: {roomData ? roomData.players.map(p=>p.username).join(', ') : '—'}</div>
        <div className="text-sm text-gray-600">Vez de: {roomData ? (roomData.turnPlayerId === (localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id : '') ? 'Você' : 'Oponente') : '—'}</div>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold">Tabuleiro (arraste a peça para esquerda/direita)</h3>
        <div className="mt-2 flex gap-2 items-center">
          <div onDrop={(e)=>onDropSide(e,'left')} onDragOver={allowDrop} className="p-2 border rounded min-w-[80px] text-center">Left Drop</div>
          <div className="flex gap-2 items-center">
            {roomData && roomData.board.length>0 ? roomData.board.map((t,i)=> (
              <div key={i} className="tile-display" style={{display:'inline-block'}}><TileSVG a={t.a} b={t.b} /></div>
            )) : <div className="text-sm text-gray-500">Nenhuma peça no tabuleiro</div>}
          </div>
          <div onDrop={(e)=>onDropSide(e,'right')} onDragOver={allowDrop} className="p-2 border rounded min-w-[80px] text-center">Right Drop</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Suas peças</h3>
        <div className="mt-2 flex gap-2 flex-wrap">
          {hand && hand.length>0 ? hand.map((t,i)=> (
            <div key={i} id={`tile-${t.a}-${t.b}`} draggable onDragStart={(e)=>onDragStart(e,t)} className="cursor-grab">
              <TileSVG a={t.a} b={t.b} className="tile-svg"/>
            </div>
          )) : <div className="text-sm text-gray-500">Aguardando suas peças...</div>}
        </div>
      </div>
    </div>
  );
}
