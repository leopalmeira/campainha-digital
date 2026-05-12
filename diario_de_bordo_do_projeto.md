# 📝 Diário de Bordo - Campainha-Digital

---

## Fase 1–4: Fundação, Design, PWA e Git
(Ver histórico completo no git log)

---

## 🔗 v2.0.0 — WebRTC P2P Nativo (09/05/2026)
- Removido PeerJS. Signaling via Socket.io próprio.
- STUN Google + TURN OpenRelay. Endpoint `/api/ping` keep-alive Render.
- Histórico de visitantes em `visitors.json`. Aba no AdminPanel.

## 🎛️ v2.1.0 — Painel do Morador Completo
- Navegação inferior: Campainha / Histórico / Configurações / Sair.
- 3 modos: Modo Oculto / Só Áudio / Câmera + Áudio.
- Modo oculto invisível: visitante permanece na tela "Chamando".
- Mensagens rápidas por categoria com banner na tela do visitante.

## 🔔 v2.2.0 — Som Real + Histórico Pro + Paywall
- DING-DONG via Web Audio API (osciladores sine 880Hz/660Hz, gain 1.5x).
- Vibração: `[400,200,400,200,800,500,400,200,400]`.
- Histórico com grupos por data, stats (Total/Hoje/Com Foto), filtros, foto expandível.
- Paywall R$15/mês para endereços adicionais. Modal com benefícios.
- QR Code: 1 único por cadastro (UUID v4), nunca se repete.

---

## 🔑 v2.3.0 — Login Duplo por Tipo de Imóvel (09/05/2026)

### Problema
O login do morador pedia e-mail + código para TODOS os tipos, tornando o processo complexo desnecessariamente para moradores de condomínio.

### Solução — Dois modos de login

| Tipo de Imóvel | Modo de Login | Como funciona |
|---|---|---|
| Condomínio / Vila | **Código de Acesso** | Morador digita o código único (ex: `A3F9C2`) — sem e-mail |
| Casa Simples | **E-mail + Senha** | Login tradicional com e-mail e código de acesso |

**Backend:**
- Nova rota `POST /api/resident/login-by-code`: aceita só o `accessCode`, busca em todas as propriedades, retorna `unitId`, `unitName`, `propertyName`.
- Código normalizado em `toUpperCase()` antes da busca — evita erro de digitação.

**Frontend (ResidentLogin.jsx):**
- Dois tabs visuais: `Hash` (Código) e `Mail` (E-mail).
- Campo de código: maiúsculas automáticas + letter-spacing 4px + tamanho 18px — fácil de digitar e conferir.
- Sem e-mail obrigatório no modo código — 1 campo só.

### PWA Install Agressivo
- Banner fixo no rodapé da página de login (não desaparece).
- Ícone + descrição + botão "Instalar" em destaque.
- Ao instalar: banner some e aparece confirmação "App instalado!".
- Evento `appinstalled` capturado para feedback visual.
- O app instalado abre direto na página correta (configurado no `manifest.json`).

---

## 🔒 v2.4.0 e v2.5.0 — Privacidade, Código no Painel e UI Premium (09/05/2026)

### Correções de Cadastro
- Reset da lista de unidades (`unitsList`) no `AdminPanel` ao trocar entre Individual / Condomínio (Bug Corrigido).
- Exibição de contador de unidades no botão "Adicionar".

### Privacidade no Histórico do Admin
- Adicionado um filtro de segurança baseado no dispositivo (`localStorage: cd_admin_props`).
- Administradores visualizam **apenas o histórico das propriedades que eles mesmos criaram**, impedindo vazamento de dados de outras contas e condomínios no banco compartilhado.

### Nova Interface de Autenticação (ResidentLogin)
- **Redesign Absoluto:** Substituição da interface antiga por um design de alto padrão (Glassmorphism, Dark Mode Profundo, Gradientes Aurora).
- Tipografia em alto contraste com feedback tátil de foco para a digitação dos códigos.

### Experiência do Morador
- **Código no Painel de Espera:** Enquanto aguarda chamadas (`idle` state), o painel agora exibe em grande destaque o `Código de Acesso` da unidade, facilitando o compartilhamento e memorização.
- **Botão Sair Imediato:** Botão "Sair do App" posicionado de forma ergonômica, que desloga o usuário e o envia diretamente para o `/morador-login` (novo PWA) limpando as credenciais seguras do navegador.

---

## 📲 v2.6.0 — Compartilhamento Inteligente e Cópia Robusta (10/05/2026)

### Melhoria no Botão Copiar
- Navegadores às vezes bloqueiam a API nativa do `navigator.clipboard` se o ambiente não for HTTPS rigoroso ou em certos webviews.
- Adicionado um **fallback automático** (plano B) que recria a função de cópia criando um input invisível e usando `document.execCommand('copy')`. O botão de copiar agora funciona 100% das vezes em qualquer cenário.

### Novo Recurso: Compartilhar no WhatsApp
- Criado o componente `WhatsAppButton` no `AdminPanel.jsx`.
- Ao lado do código do morador, agora existe um botão "WHATSAPP" verde de alto contraste.
- Ao clicar, ele já abre o app do WhatsApp (via API `wa.me`) com uma **mensagem pré-formatada amigável** contendo:
  1. Texto explicativo sobre o aplicativo.
  2. A chave / código único de acesso do morador.
  3. O link exato do PWA de login direto (pego automaticamente via `window.location.origin`).

---

## 👑 v2.7.0 — Master Admin Redesign, Códigos Únicos e PWA da Portaria (11/05/2026)

### Master Admin Dashboard (Redesign Completo)
- Substituição do design brutalista por uma interface de alto padrão (SaaS Premium, Glassmorphism, Dark Mode Elegante).
- Formulário de cadastro expandido para incluir dados vitais do contrato (Nome/Razão Social, E-mail, Telefone, Documento e Endereço).
- Exibição de cards estatísticos rápidos no topo: **Total de Clientes Ativos**, **Total de Unidades** e **Status do Sistema**.
- O sistema agora gera automaticamente códigos exclusivos:
  - **Código do Cliente (Administrador)**: Permite o acesso ao painel de gestão do condomínio.
  - **Código da Portaria**: Gerado para condomínios/vilas, usado exclusivamente para o tablet do porteiro.

### Autenticação Dinâmica e Segura
- **Login do Cliente:** A tela de login (`AuthPage.jsx`) agora exige que o cliente informe seu E-mail e o **Código Único de Acesso** gerado pelo Master Admin.
- **Isolamento de Segurança:** Garante que apenas quem tem o código possa gerenciar a propriedade.

### 🏢 Novo Módulo: PWA da Portaria (Doorman Dashboard)
- **Rotas e Login Exclusivos**: Criadas rotas separadas (`/portaria-login` e `/portaria`) para o porteiro acessar com o e-mail da portaria e o **Código da Portaria**.
- **Painel Tático do Porteiro**: Interface otimizada para tablets, exibindo todas as unidades do condomínio em formato de grid ("blocos/apartamentos").
- **Comunicação Direta**: O porteiro pode tocar em uma unidade para iniciar uma chamada instantânea com o morador (usando a mesma infraestrutura de WebRTC das placas).
- **Feedback Visual de Abertura (Acesso Liberado)**:
  - Adicionado botão verde de alto contraste **"Abrir Portão"** na tela de chamada ativa do morador.
  - Ao clicar, o morador autoriza a entrada. O tablet do porteiro intercepta via WebSocket (`entry_authorized`) e **pisca uma grande notificação verde na tela**, informando visualmente qual apartamento autorizou a entrada, dispensando interfones físicos.

---

## 🛠️ Próximos Passos
- [ ] Integração Pix (R$15 por novo endereço e mensalidade automática).
- [ ] Síndico Admin: reconfigurar códigos dos moradores e gerar novas unidades.
- [ ] Migração banco → PostgreSQL/Neon.
- [ ] Push notifications via FCM (Firebase Cloud Messaging).
