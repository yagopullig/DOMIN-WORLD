import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try{
      await axios.post('http://localhost:5000/api/auth/register', { username, password });
      alert('Registrado com sucesso! Faça login.');
      navigate('/');
    }catch(err){
      alert('Erro ao registrar: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input className="border p-2" placeholder="Usuário" value={username} onChange={e=>setUsername(e.target.value)} />
      <input className="border p-2" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleRegister}>Registrar</button>
    </div>
  );
}
