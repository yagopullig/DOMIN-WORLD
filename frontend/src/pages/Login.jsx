import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      alert('Login realizado com sucesso!');
      navigate('/game');
    } catch(err){
      alert('Usuário ou senha incorretos!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input className="border p-2" placeholder="Usuário" value={username} onChange={e=>setUsername(e.target.value)} />
      <input className="border p-2" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleLogin}>Login</button>
    </div>
  );
}
