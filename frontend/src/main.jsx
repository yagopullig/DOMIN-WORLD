import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Register from './pages/Register'
import Game from './pages/Game'
import Admin from './pages/Admin'

import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App/>}>
          <Route path='admin' element={<Admin/>} />
          <Route index element={<Login/>} />
          <Route path='register' element={<Register/>} />
          <Route path='game' element={<Game/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
