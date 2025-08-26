import React from 'react'
import { Outlet } from 'react-router-dom'

export default function App(){
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="p-4 text-center font-bold text-xl">Dominó World</header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
