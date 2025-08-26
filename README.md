# Dominó World - Projeto Concluído (versão melhorada)

Esta versão inclui:
- Backend com Express + Socket.IO para partidas em tempo real
- Regras básicas de validação de jogadas de Dominó e controle de turnos
- Autenticação JWT + bcrypt
- Painel admin básico
- Frontend React + Vite + Tailwind com integração Socket.IO
- Dockerfile e docker-compose para orquestração (MongoDB + app)

## Como rodar (desenvolvimento)
1. Copie `.env.example` para `.env` tanto em `backend/` quanto em `frontend/` se necessário.
2. Backend:
```bash
cd backend
npm install
npm run dev
```
3. Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Docker (produção local)
```bash
docker-compose up --build
```

## Notas
- O servidor em Node usa Socket.IO para gerenciar salas e sincronizar jogadas.
- A lógica do jogo é um modelo simplificado que valida se a peça pode ser colocada nas extremidades.
- Melhorias possíveis: IA de bot, persistência de partidas completas, chat moderado por backend, testes automatizados, balanceamento e deploy em nuvem.
