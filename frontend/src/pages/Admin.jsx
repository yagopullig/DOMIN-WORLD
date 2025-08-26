import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Admin(){
  const [moves, setMoves] = useState([]);

  useEffect(()=>{
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/game/moves', { headers: { Authorization: 'Bearer ' + token } })
      .then(res => setMoves(res.data))
      .catch(err => alert('Erro ao buscar moves: ' + (err.response?.data?.message || err.message)));
  },[]);

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">Painel Admin - Movimentações</h2>
      <div className="bg-white p-3 rounded shadow max-h-[600px] overflow-auto">
        {moves.length===0 ? <div>Nenhuma jogada</div> : moves.map(m=> (
          <div key={m._id} className="border-b py-2">
            <div><strong>Usuário:</strong> {m.user}</div>
            <div><strong>Peças:</strong> {JSON.stringify(m.tiles)}</div>
            <div className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
