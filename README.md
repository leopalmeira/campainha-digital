# 🔔 Campainha Digital

> **SaaS de Campainha Inteligente via QR Code com Videochamada P2P Real**

[![GitHub](https://img.shields.io/badge/GitHub-leopalmeira%2Fcampainha--digital-black?logo=github)](https://github.com/leopalmeira/campainha-digital)
[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com)
[![Version](https://img.shields.io/badge/Versão-2.2.0-green)](#)
[![License](https://img.shields.io/badge/Licença-MIT-gray)](#)

---

## 🚀 O que é

Campainha Digital transforma um QR Code em uma campainha inteligente com **videochamada P2P** entre visitante e morador — sem app, sem hardware.

**Fluxo:**
1. Visitante escaneia o QR Code na porta
2. Câmera captura foto para identificação
3. Morador recebe **DING-DONG real** + vibração no celular
4. Morador escolhe: **Modo Oculto** / **Só Áudio** / **Câmera + Áudio**
5. Conexão P2P direta estabelecida via WebRTC

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + Socket.io-client |
| Backend | Node.js + Express + Socket.io |
| Realtime | **WebRTC Nativo** (sem PeerJS) |
| Signaling | Socket.io no próprio servidor |
| ICE/STUN | Google STUN servers |
| TURN | OpenRelay (fallback NAT) |
| Som | **Web Audio API** (DING-DONG sintético) |
| Vibração | `navigator.vibrate()` |
| Deploy | Render.com |
| DB | JSON files (roadmap: PostgreSQL/Neon) |

---

## ⚡ Arquitetura WebRTC

```
[Visitante]            [Servidor Render]          [Morador]
     │── initiate_call ────────►│                      │
     │                          │── incoming_call ─────►│  🔔 DING-DONG + Vibração
     │                          │◄── answer_call ───────│
     │◄── call_answered ────────│                       │
     │── webrtc_offer ──────────►────────────────────── ►│
     │◄── webrtc_answer ────────◄──────────────────────  │
     │◄══ ICE candidates ══════════════════════════════►│
     │◄═══════════ CONEXÃO P2P DIRETA ════════════════►│
```

---

## 📱 Funcionalidades

### Para o Morador (ResidentDashboard)
- ✅ **Som real DING-DONG** via Web Audio API (osciladores sine)
- ✅ **Volume máximo forçado** via GainNode (1.5x)
- ✅ **Vibração** com padrão de campainha
- ✅ **3 modos de atender:** Oculto / Só Áudio / Câmera + Áudio
- ✅ **Modo Oculto:** visitante não sabe que está sendo monitorado
- ✅ **Toggle câmera e mute** durante a chamada
- ✅ **Mensagens rápidas** por categoria (Água, Light, Entregador, Geral)
- ✅ **Histórico profissional** com grupos por data, filtros e foto expandível
- ✅ **Tempo relativo** (Agora, 5min atrás, Ontem...)
- ✅ **Navegação inferior** com Campainha / Histórico / Configurações / Sair
- ✅ PWA instalável

### Para o Visitante (VisitorCall)
- ✅ QR Code único por propriedade
- ✅ Foto automática para identificação
- ✅ Lista de unidades para condomínio/vila
- ✅ Banner de mensagem rápida enviada pelo morador (5s)
- ✅ Modo monitor invisível (não revela que está sendo observado)

### Para o Proprietário (AdminPanel)
- ✅ Geração automática de QR Code único (UUID v4)
- ✅ Aba "Histórico de Visitantes"
- ✅ Códigos de acesso copiáveis por unidade
- ✅ Paywall R$15/mês para endereços adicionais
- ✅ Suporte a Casa / Vila / Condomínio

---

## 🌐 Deploy no Render

### Backend — Web Service
| Campo | Valor |
|-------|-------|
| Root Directory | `backend/` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Env: `FRONTEND_URL` | `https://SEU-FRONTEND.onrender.com` |

### Frontend — Static Site
| Campo | Valor |
|-------|-------|
| Root Directory | `frontend/` |
| Build Command | `npm install --legacy-peer-deps && npm run build` |
| Publish Directory | `dist` |
| Env: `VITE_API_URL` | `https://SEU-BACKEND.onrender.com` |

### ⚠️ Keep-Alive (Render Free)
Configure o [UptimeRobot](https://uptimerobot.com) (gratuito) para chamar:
```
https://SEU-BACKEND.onrender.com/api/ping
```
a cada **10 minutos** — evita o spin-down de 15min.

---

## 💰 Modelo de Negócio

| Plano | Preço | O que inclui |
|-------|-------|-------------|
| **Básico** | Grátis | 1 endereço, QR Code único, videochamada |
| **Adicional** | R$15/mês | Cada novo endereço extra |

---

## 🔑 QR Code — Garantia de Unicidade

- Cada cadastro gera **1 QR Code único** via UUID v4 (`crypto.randomUUID`).
- O link aponta para `/chamada/:propertyId` — nunca se repete.
- **Casa simples:** QR leva direto para tocar a campainha.
- **Condomínio / Vila:** QR mostra lista de unidades configuradas na plataforma.

---

## 🏗️ Estrutura

```
campainha-digital/
├── backend/
│   ├── server.js          # Express + Socket.io + WebRTC signaling
│   ├── db.json            # Propriedades
│   ├── residents.json     # Moradores
│   └── visitors.json      # Histórico (foto + timestamp)
└── frontend/src/pages/
    ├── LandingPage.jsx
    ├── AdminPanel.jsx         # Proprietário: QR, histórico, paywall
    ├── ResidentDashboard.jsx  # Morador: WebRTC + som + vibração
    ├── ResidentPanels.jsx     # Histórico pro + configurações
    ├── VisitorCall.jsx        # Visitante: câmera + WebRTC offer
    ├── ResidentLogin.jsx
    └── AuthPage.jsx
```

---

## 📄 Licença

MIT © [Leo Palmeira](https://github.com/leopalmeira)
