# 📝 Diário de Bordo - Campainha-Digital

Este documento registra a evolução, decisões técnicas e marcos do projeto.

---

## 🚀 Fase 1: Fundação e Visão (Início - 04/05/2026)
- **Stack:** React (Vite) + Node.js (Express) + Socket.io + WebRTC Nativo.
- **Design System:** Tema "Midnight Corporate" com Glassmorphism e Aurora Gradients.

## 🎨 Fase 2: Redesign e UX
- Landing Page, Auth, Painel Admin, Dashboard do Morador e tela do Visitante.

## 📱 Fase 3: PWA
- `vite-plugin-pwa`, prompt de instalação nativo.

## 📂 Fase 4: Git
- Repositório: [leopalmeira/campainha-digital](https://github.com/leopalmeira/campainha-digital)

---

## 🔗 Fase 5 — v2.0.0 (09/05/2026): WebRTC P2P Real

### Problema (PeerJS)
- ID fixo `campainha_resident_${id}` causava conflito ao reconectar.
- Servidor PeerJS externo fora do nosso controle.
- Race condition: visitante enviava call antes do morador estar registrado.

### Solução (WebRTC Nativo + Socket.io)
```
Visitante → offer → Servidor → offer → Morador
Morador  → answer → Servidor → answer → Visitante
↕ ICE candidates em tempo real ↕
══ Conexão P2P Direta Estabelecida ══
```
- STUN Google + TURN OpenRelay (fallback NAT).
- `/api/ping` keep-alive para Render Free.
- Histórico de visitantes em `visitors.json`.
- Aba "Histórico" no AdminPanel.
- Códigos de acesso copiáveis com botão COPIAR.

---

## 🎛️ Fase 6 — v2.1.0 (09/05/2026): Painel do Morador Completo

- **Navegação inferior:** Campainha / Histórico / Configurações / Sair.
- **3 modos de atendimento:** Modo Oculto (furtivo) / Só Áudio / Câmera + Áudio.
- **Toggle de câmera e mute** durante chamada ativa.
- **Modo Oculto:** visitante NÃO sabe que está sendo monitorado (permanece na tela "Chamando...").
- **Mensagens rápidas por categoria:** 💧 Água / ⚡ Light / 📦 Entregador / 💬 Geral.
- **Mensagens pré-configuradas:** "Volto já!", "Deixe na porta", "Não estou em casa", etc.
- **Banner de mensagem** aparece na tela do visitante em tempo real (5s).
- Backend: relay `send_quick_message` via Socket.io.

---

## 🔔 Fase 7 — v2.2.0 (09/05/2026): Som Real + Histórico Pro + Paywall

### Som de Campainha Real (Web Audio API)
- **DING-DONG** gerado sinteticamente — sem depender de arquivo externo ou CDN.
- `AudioContext` com osciladores sine: 880Hz (DING) → 660Hz (DONG).
- `GainNode` com gain 1.5x para forçar volume máximo.
- Repetição automática a cada 2.2 segundos enquanto a campainha toca.
- **Vibração real:** padrão `[400,200,400,200,800,500,400,200,400]` via `navigator.vibrate()`.
- Para de tocar e vibrar automaticamente ao atender ou recusar.

### Histórico de Visitantes Profissional
- **Grupos por data:** Hoje / Ontem / "12 de maio" etc.
- **Cards de estatísticas:** Total, Hoje, Com Foto.
- **Filtros rápidos:** Todos / Hoje / Com Foto.
- **Card expansível:** clica para ver foto ampliada + data completa + hora.
- **Tempo relativo:** "Agora", "5min atrás", "2h atrás", "Ontem".
- **Indicador de câmera:** ponto verde (com foto) / cinza (sem foto).

### Paywall — Nova Placa R$15
- Segunda placa em diante exige pagamento de **R$15/mês**.
- Modal profissional com lista de benefícios.
- Botão "Pagar R$15 e Adicionar" (integração Pix a implementar).
- Primeira placa continua gratuita.

### QR Code — Garantia de Unicidade
- 1 QR Code único por cadastro, vinculado ao `propertyId` (UUID v4).
- UUID gerado pelo `crypto` do Node — probabilidade de colisão desprezível.
- QR Code aponta para `/chamada/:propertyId`.
- Ao escanear: casa simples → toca direto; condomínio/vila → lista de unidades.

---

## 🛠️ Próximos Passos
- [ ] Integração Pix para pagamento de novos endereços (R$15/mês).
- [ ] Auth diferenciada: casa → email+senha; condo/vila → código por unidade.
- [ ] Síndico Admin: reconfigurar códigos dos moradores.
- [ ] Migração do banco para PostgreSQL/Neon.
- [ ] Painel de Vendas/Admin Master.
