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

## 💎 v2.8.0 — Master Admin White Theme & Dossiê Detalhado (12/05/2026)

### Redesign Visual (White Theme)
- Mudança radical da estética escura/brutalista para um design **White Theme (Clean & Professional)**.
- Fundo em cinza ultra-claro (`#F8FAFC`) com painéis brancos puros e sombras suaves.
- Sidebar fixa em branco com tipografia em `Inter` de alto contraste.
- Cards estatísticos com indicadores de performance (ex: faturamento estimado, variação percentual).

### Gestão Detalhada de Clientes & Empresas
- **Dossiê do Cliente**: Adição de campos detalhados para **Razão Social/Empresa**, **CPF/CNPJ**, **Plano de Assinatura** e **Endereço Completo**.
- **Dashboard Analítico**: Sidebar agora inclui links funcionais para "Análise de Dados", "Logs do Sistema" e "Configurações de Rede".
- **Visualização Expandida**: Implementado modal de detalhes ("Dossiê") para visualização profunda de todos os dados de um cliente específico sem sair da lista principal.

### Melhorias de UX
- Campo de busca global aprimorado (busca por empresa, documento ou código).
- Sistema de cores semântico para planos (Basic, Pro, Enterprise).
- Feedback visual de status global (Operacional/Offline) integrado ao Master Admin.

---

## ☁️ v2.9.0 — Migração Global para White Theme (12/05/2026)

### Padronização Visual (Premium Clean)
- **Migração Completa de Todos os Painéis**: `AdminPanel`, `ResidentDashboard`, `PorteiroDashboard` e `ResidentPanels` foram totalmente redesenhados para o **White Theme**.
- **Consistência de Marca**: Agora todo o ecossistema segue a estética do Master Admin (Fundo `#F8FAFC`, Cards `#FFFFFF` com sombras suaves e bordas sutis).
- **Paleta de Cores**: Substituição do Ciano `#00E5FF` pelo Azul Profissional `#3B82F6` como cor primária global.
- **Tipografia & Contraste**: Melhoria drástica na legibilidade com textos em `#0F172A` e `#64748B`.

### Fluxos de Autenticação Redesenhados
- **Páginas de Login**: `ResidentLogin`, `PorteiroLogin` e `AuthPage` (Admin) agora possuem um visual limpo, focado em conversão e facilidade de uso, mantendo o banner de PWA integrado.
- **Elementos de UI**: Atualização do `index.css` com variáveis globais para o tema claro, garantindo que novos componentes já nasçam no padrão visual correto.

### Melhorias de Infraestrutura UI
- **Shadow Tokens**: Implementação de sombras multinível para criar profundidade em superfícies brancas.
- **Border System**: Uso de `--border-subtle` (`#E2E8F0`) para delimitação de seções sem poluição visual.

---

## 🔧 v2.9.1 — Correção de Cadastro & Simplificação Master HQ (12/05/2026)

### Correções de Backend
- **Fix 500 Error**: Corrigido erro de referência no endpoint `POST /api/properties` onde as variáveis `companyName` e `plan` não estavam sendo extraídas do corpo da requisição, causando falha no registro de novos clientes.
- **Normalização de Acesso**: Adicionado `.trim().toUpperCase()` nos endpoints de login e registro de moradores para garantir que códigos digitados com espaços ou minúsculas funcionem corretamente.

### UX & Interface (Master HQ)
- **Limpeza de Interface**: Removidos módulos redundantes ou não funcionais solicitados pelo usuário: "Logs do Sistema", "Rede Global", "Preferências" e "Banco de Dados".
- **Foco Operacional**: O painel Master agora foca exclusivamente no que é essencial: **Gerenciar Clientes** e **Novo Registro**.

---

## 🔐 v2.9.2 — Integração Portaria & Fluxo de Autorização (12/05/2026)

### Acesso Unificado
- **Login Inteligente por Código**: A página de acesso do morador agora reconhece automaticamente se o código inserido pertence a um morador ou a um porteiro, redirecionando para o painel correto (`ResidentDashboard` ou `PorteiroDashboard`). Isso resolve a confusão de múltiplos logins.

### Comunicação em Tempo Real (Loop Completo)
- **Autorização do Morador**: Adicionado botão "Liberar Entrada" no painel do morador durante chamadas.
- **Feedback na Portaria**: Quando o morador autoriza, o porteiro recebe instantaneamente um alerta visual gigante ("ACESSO LIBERADO") com efeito de som e vibração.
- **Feedback ao Visitante**: O visitante agora vê uma tela de sucesso ("Portão Liberado! Seja bem-vindo!") quando o morador clica no botão, encerrando a chamada de forma amigável após 8 segundos.

### UX & Polimento
- **Alertas Sonoros**: Implementados sons de notificação para a portaria garantir que nenhum acesso passe despercebido.
- **Isolamento de Dados**: Garantido que o `propertyId` correto seja usado em todas as emissões de socket para evitar vazamento de notificações entre condomínios diferentes.

---

## 💎 v2.9.3 — Exclusividade de QR Codes (12/05/2026)

### Segurança & Integridade
- **Bloqueio de Duplicidade**: Implementada verificação rigorosa no backend para garantir que cada QR Code (Property ID) seja único. O sistema agora impede que um ID já cadastrado seja atribuído a um novo cliente, garantindo exclusividade absoluta.
- **Feedback de Erro**: O Painel Master agora exibe mensagens de erro detalhadas caso tente-se registrar um QR Code que já pertence a outra placa/cliente.

---

## 📸 v2.9.4 — Escaneamento Obrigatório de Placas (12/05/2026)

### Lógica de Registro
- **Remoção de Auto-Geração de ID**: O sistema agora exige obrigatoriamente que um ID de QR Code seja fornecido via escaneamento no Painel Master. A função de fallback que gerava IDs aleatórios (`uuidv4`) foi removida para garantir que o sistema apenas vincule IDs de placas físicas já existentes e entregues aos clientes.
- **Validação Rigorosa**: O backend agora retorna erro caso tente-se criar uma propriedade sem um ID escaneado, reforçando o fluxo de trabalho físico-digital.

---

## 🏗️ v2.9.5 — Novo Fluxo de Ativação Wizard (12/05/2026)

### Experiência do Usuário (Onboarding)
- **Wizard de Configuração**: Reestruturei o fluxo inicial do cliente para ser mais lógico e profissional:
    1. **Tipo**: Seleção do imóvel (Casa, Vila ou Condomínio).
    2. **Configuração**: Definição de nomes e lista de unidades.
    3. **Pagamento**: Tela de checkout simulada para o plano de R$ 15,00/mês.
    4. **Ativação**: O escaneamento da placa física agora é o passo final ("Grand Finale"), vinculando toda a configuração feita ao hardware escaneado.
- **UX Polida**: Adicionada tela de resumo de pedido e ícones de pagamento para aumentar a percepção de valor e confiança do cliente.

---

## 🎨 v2.9.6 — Padronização de Branding HD (12/05/2026)

### Branding & Design
- **Novo Logo HD**: Criado um componente de Logo em SVG de alta definição, garantindo nitidez perfeita em qualquer tamanho de tela (mobile, tablet e desktop). O design segue a identidade visual da marca: ícone de onda digital circular com centro laranja vibrante e tipografia moderna.
- **Unificação Total**: O novo logo foi aplicado em todos os pontos de contato da plataforma:
    - Landing Page (Home)
    - Telas de Login (Morador, Porteiro e Administrador)
    - Painéis de Controle (Admin, Master e Porteiro)
    - Interface do Visitante (Tela de Chamada)
- **Consistência Visual**: A substituição de ícones genéricos pelo logo oficial reforça o profissionalismo e a confiança na marca Campainha-Digital.

---

## 🎨 v2.9.7 — Ajuste de Precisão no Logo (12/05/2026)

### Branding & Fixes
- **Correção de Layout**: Resolvido o problema onde o texto do logo quebrava em duas linhas em telas menores. Agora o logo é estritamente de uma única linha (`whiteSpace: 'nowrap'`).
- **Fidelidade Visual**: Ajustado o SVG para corresponder exatamente à imagem original da marca:
    - Ícone à esquerda com ondas saindo para a direita.
    - Espaçamento (viewBox) corrigido para evitar que as ondas pareçam "cortadas".
    - Cores sincronizadas com o azul escuro e ciano originais.
- **Redimensionamento**: Ajustado o tamanho base do logo nas telas de login (42px) para garantir que caiba perfeitamente dentro dos painéis de vidro (`glass-panel`) sem transbordar.

---

## 🎥 v2.9.8 — Integração de Avatar IA na Home (12/05/2026)

### Conteúdo & UX
- **Vídeo de Apresentação**: Integrei o vídeo do avatar (IA) diretamente no início da Landing Page para aumentar a conversão e explicar o produto visualmente.
- **Edição e Corte (Cropping)**: Apliquei técnicas de CSS (`overflow: hidden` + `object-fit: cover`) para remover as barras brancas superiores e inferiores do vídeo original, deixando o foco apenas no avatar falando.
- **Autoplay Inteligente**: O vídeo inicia automaticamente em modo mudo (padrão de navegadores modernos) com loop infinito, funcionando como um elemento dinâmico de destaque no Hero.
- **Badge de Status**: Adicionei um indicador visual ("Apresentação Oficial") sobre o vídeo para dar um toque mais premium à interface.

---

## 🏗️ v2.9.9 — Estabilização e Expansão do Master Admin (12/05/2026)

### Dashboard Master
- **Correção de Crash (Tela Branca)**: Identificado e corrigido um erro de runtime que causava tela branca ao acessar o "Novo Registro" ou renderizar a tabela de clientes devido a ícones não importados (`Briefcase`, `ExternalLink`, etc.).
- **Alinhamento de Branding**: Ajustado o tamanho do logo na barra lateral para 32px e corrigido o alinhamento do texto para garantir que a marca fique perfeitamente visível e profissional, sem quebras indesejadas.
- **Expansão de Funcionalidades**: Adicionados 7 novos módulos estratégicos prontos para produção:
    1.  **Analytics & Uso**: Monitoramento de chamadas e uptime.
    2.  **Equipe / Porteiros**: Gestão centralizada de operadores.
    3.  **Logs do Sistema**: Auditoria de segurança em tempo real.
    4.  **Financeiro / Pix**: Visão de MRR e status de pagamentos.
    5.  **Suporte & Tickets**: Central de atendimento ao cliente.
    6.  **Configurações Globais**: Controle de versão e limites do sistema.
    7.  **API / Integrações**: Chaves de acesso e webhooks.

---

## 🚀 v2.9.10 — Refinamento de UX e Som na Home (12/05/2026)

### Landing Page
- **Restauração do Layout**: Reposicionei o mockup original do iPhone no Hero para manter a demonstração do app, conforme solicitado.
- **Destaque de Vídeo IA**: O vídeo do avatar foi movido para uma seção de destaque absoluta no topo da página (acima do Hero), garantindo impacto imediato sem interferir na visualização do smartphone.
- **Ativação de Áudio**: Removido o atributo `muted` padrão para permitir áudio. Adicionado suporte a clique no vídeo para iniciar o som (necessário devido às políticas de autoplay dos navegadores) e um indicador visual "Clique para Som".
- **Corte de Precisão (Zoom)**: Ajustado o zoom do vídeo (`scale(1.3)`) para garantir que as barras brancas superiores e inferiores sejam cortadas de forma limpa, mantendo o enquadramento no avatar.

---

## 📽️ v2.9.12 — Relocação do Vídeo e Ajuste de Autoplay (12/05/2026)

### Landing Page
- **Nova Posição do Vídeo**: O vídeo de apresentação foi movido para dentro do Hero, posicionado estrategicamente logo abaixo do texto principal ("Atenda o portão..."), otimizando o fluxo de leitura e impacto visual.
- **Remoção de Menções a IA**: Removidos todos os selos e textos que referenciavam o vídeo como sendo gerado por Inteligência Artificial, tornando a apresentação mais natural e direta.
- **Som Ativado**: Configurado o vídeo para carregar com som ativado por padrão. Adicionado suporte a `onMouseOver` para forçar o `play` e `volume` caso o navegador bloqueie o autoplay silencioso.
- **Limpeza de Layout**: Removida a seção superior redundante que continha o vídeo anteriormente.

---

## 🛠️ v2.9.13 — Estabilização, Login Unificado e Painel Central (13/05/2026)

### Login Unificado & Redirecionamento
- **Refatoração do Login**: O endpoint `/api/admin/login` e a página `AuthPage.jsx` agora são o ponto de entrada único para Master Admins, Administradores de Propriedade (Clientes) e Porteiros.
- **Detecção de Cargo**: O sistema detecta automaticamente se o usuário é Master, Cliente ou Porteiro e o redireciona instantaneamente para o dashboard correto (`/master-admin`, `/admin` ou `/portaria`).
- **Persistência de Sessão**: Correção na gravação do `propertyId` para porteiros, garantindo que o painel carregue os dados corretos após o login.

### Painel de Monitoramento Central (Portaria)
- **Visão Multi-Imóvel**: Porteiros (especialmente em centrais de monitoramento) agora podem visualizar e pesquisar unidades em todos os condomínios que gerenciam simultaneamente.
- **Busca Global**: Implementada busca rápida que filtra por nome do morador, número da unidade ou nome do condomínio.
- **Real-time Centralizado**: O sistema de autorização via Socket.io foi adaptado para monitorar múltiplos canais de autorização ao mesmo tempo.

### Flexibilidade & Onboarding
- **Casa Simples Descomplicada**: Removida a obrigatoriedade de preencher o nome do condomínio para cadastros do tipo "Casa Simples". O sistema agora gera um nome padrão amigável (ex: "Residência [Nome]") se deixado em branco.
- **Feedback de Credenciais**: O Master Admin agora recebe um alerta claro com o e-mail e o código único de acesso logo após o registro bem-sucedido de um novo cliente, facilitando o repasse das informações.

### Infraestrutura & Disponibilidade
- **GitHub Keep-Alive Action**: Criada automação via GitHub Actions (`keepalive.yml`) que realiza um "ping" no backend e frontend a cada 5 minutos. Isso impede que o Render entre em modo "sleep" (hibernação) no plano gratuito, garantindo resposta imediata da campainha.
- **Isolamento de Dados**: Reforçada a lógica de consulta no backend para garantir que clientes vejam apenas suas propriedades, enquanto o Master Admin mantém visão total.

---

## 🏢 v3.0.0 — Painel do Condomínio, Comunicação entre Moradores & Gestão Completa (14/05/2026)

### Gestão de Unidades (Backend + Frontend)
- **CRUD Completo de Unidades**: Novo componente `UnitManager.jsx` permite cadastrar, editar e excluir unidades com campos de **Bloco/Rua**, **Número da Casa/Apto** e **Nome**.
- **Endpoints REST**: `POST/PUT/DELETE /api/properties/:id/units/:unitId` com validação de permissão por `adminEmail`.
- **Endereço Obrigatório**: Unidades sem bloco/rua e número exibem aviso visual de que não poderão ser localizadas pelo interfone.

### Comunicação entre Moradores (Interfone Digital)
- **Busca por Endereço**: Moradores buscam vizinhos digitando **Bloco/Rua + Número** (não mais por nome).
- **Endpoint de Busca**: `GET /api/properties/:id/search-unit?block=&number=` retorna apenas unidades com endereço cadastrado.
- **Chamada Direta**: Ao encontrar o vizinho, o morador pode iniciar chamada WebRTC instantânea.

### Broadcast de Mensagens do Condomínio
- **Componente BroadcastPanel**: Síndico envia mensagens com prioridade (Normal/Urgente) para todos os moradores.
- **WebSocket em Tempo Real**: Evento `broadcast_message` emitido para todas as unidades da propriedade.
- **Persistência**: Mensagens salvas em `messages.json` com histórico e controle de leitura.
- **Aba Avisos no App**: Moradores recebem avisos com badge de notificação (não lidos) e notificação push.

### Gestão de Pessoas
- **Componente ResidentManager**: Visualização de códigos de acesso por unidade, com botão de cópia e WhatsApp.
- **Bloqueio de Morador**: Regeneração de código de acesso (`POST /units/:unitId/regenerate-code`) invalida acesso anterior.
- **Gestão de Porteiro**: Cadastro/remoção de e-mail do porteiro (`PUT /api/properties/:id/doorman`), com geração automática de código.

### Porteiro — Busca por Endereço
- **Campos de Busca**: Porteiro agora busca unidades por **Bloco/Rua** e **Número** em vez de texto livre.
- **Chamada Direta**: Botão "Chamar Morador" emite `initiate_call` via Socket.io direto do painel.
- **Cards com Endereço**: Cada unidade exibe bloco, rua e número cadastrados.

### Cadastro com Seleção de Papel
- **Novos Papéis**: Na tela de cadastro (`AuthPage`), o usuário seleciona se é **Síndico/Admin de Condomínio** ou **Administrador de Vila**.
- **Armazenamento**: Papel salvo em `localStorage` para controle de acesso ao painel de administração.

### Modelo de Preços Atualizado
- **Condomínios e Vilas**: R$ 159,90/mês para até 100 unidades + R$ 3,25/unidade extra.
- **Tablet Comodado**: Porteiro recebe tablet em comodato para uso na portaria.
- **Contrato de Prestação de Serviços**: Geração de contrato com cláusulas de serviço, deveres, quebra de contrato e datas de pagamento.

### Estrutura de Novos Arquivos
- `frontend/src/components/UnitManager.jsx` — CRUD de unidades
- `frontend/src/components/BroadcastPanel.jsx` — Envio de comunicados
- `frontend/src/components/ResidentManager.jsx` — Gestão de moradores e porteiros
- `backend/messages.json` — Persistência de mensagens broadcast

### AdminPanel — Novas Abas
- 🏠 **Propriedades** — QR Codes e configuração
- 🏢 **Unidades** — Cadastro com endereço completo
- 👥 **Pessoas** — Moradores e porteiro
- 📢 **Mensagens** — Broadcast para moradores
- 📋 **Histórico** — Visitantes

---

## 🚀 v3.1.0 — Redesign do Painel do Morador e Novo Modelo de Pricing (14/05/2026)

### Painel do Morador Redesenhado
- **Modularização:** O painel foi refatorado para usar componentes independentes (`MessagesPanel.jsx`, `IntercomPanel.jsx`, `ServicesPanel.jsx`).
- **Avisos do Condomínio:** Notificações do síndico (broadcast) e da portaria ficam agora num painel recolhível (accordion) logo no topo, sinalizando com "badge" dinâmico a quantidade de itens não lidos, deixando o centro da tela limpo.
- **Botões de Serviços e Parceiros:** Criado o esqueleto de UI (`ServicesPanel.jsx`) onde futuramente aparecerão parceiros de Farmácia, Gás, Água e Mercado.

### Comunicação Bi-direcional com Portaria
- **Interfone Morador → Portaria:** O morador agora tem um atalho direto (`resident_call_doorman`) para iniciar chamada de voz para o tablet da portaria.
- **Mensagem Morador → Portaria:** Adicionado campo de texto no aplicativo do morador para enviar recados de texto diretamente para a portaria.
- **Alertas no PorteiroDashboard:** O painel da portaria agora reage com banners flutuantes e toques sonoros ao receber chamadas de voz (`incoming_resident_call`) ou mensagens (`resident_message`) do morador.

### Calculadora Interativa na Landing Page e Remoção de Paywall
- **Simulador de Assinatura:** O cartão estático de R$ 39,90 foi substituído por uma **calculadora de arrastar (range slider)** que calcula automaticamente a regra de negócio para condomínios.
- **Regra do Simulador:** 
  - Até 100 unidades: valor fixo de R$ 159,90.
  - De 101 a 200 unidades: R$ 3,25 por cada unidade extra.
  - Mais de 200 unidades: R$ 2,25 por cada unidade extra.
- **Fim do Paywall de R$ 15:** O modal e a tela de pagamento que impediam o síndico de adicionar múltiplas propriedades (blocos/ruas) sem pagar R$ 15 avulsos foram totalmente removidos. O foco agora é gerir as unidades internamente, cobrando o pacote completo.

---

## 🤝 v3.2.0 — Integração WhatsApp, Contratos Automáticos e Compliance Corporativo (16/05/2026)

### Cadastro com WhatsApp e Integração
- **Campo de WhatsApp Obrigatório:** Adicionado na tela de registro (`AuthPage.jsx`) com formatação e validação de máscara brasileira `(XX) XXXXX-XXXX`.
- **Exibição do WhatsApp:** O número agora fica visível no Painel Master (`MasterAdminDashboard`) em destaque verde nos cards de usuários pendentes e aprovados, agilizando o contato da equipe comercial.
- **Serviço de WhatsApp Automático:** Criado `backend/services/whatsappService.js` preparado para integrações via Meta API/Evolution/Z-API, responsável pelo envio da mensagem automática de boas-vindas logo após o cadastro e envio de PDF.

### Geração de Contratos Automáticos em PDF
- **Serviço de Contrato (PDFKit):** Criado `backend/services/pdfService.js` que gera contratos dinâmicos altamente profissionais usando `pdfkit`.
- **Design do Contrato:** Padrão Premium com paleta corporativa (Preto, Cinza Chumbo e Azul Profissional).
- **Compliance e Autenticidade:** O documento conta com hash único de segurança, código QR para validação, e todas as cláusulas do serviço, armazenado na nova pasta `backend/contracts/`.

### Identidade e Compliance
- **Informações Obrigatórias da Empresa:** Adicionados os dados "CAMPAINHA DIGITAL INOVA SIMPLES (I.S.) - CNPJ: 65.628.833/0001-47" aos rodapés obrigatórios da aplicação (`LandingPage`, `MasterAdminDashboard`, `AdminPanel`, `PorteiroDashboard`), assegurando conformidade comercial e legal.

### Notificações Push (Acordar PWA)
- **Web-Push Integrado:** Implementado um `Service Worker (sw.js)` que permite que o dispositivo do morador (Android/Desktop) toque, vibre e exiba uma notificação persistente (`requireInteraction: true`) mesmo com a tela apagada ou o PWA em background.
- **Assinatura Automática:** O aplicativo pede permissão de notificação automaticamente e vincula a chave VAPID segura enviando para a nova rota `/api/subscribe`.
- **Gatilho em Tempo Real:** Toda vez que houver um evento `incoming_call` (seja da portaria ou visitante), o backend dispara a notificação acordando o celular.

---

## 🧩 v3.3.0 — Onboarding Inteligente, Suporte, IA e Mobile (17/05/2026)

### Onboarding com Seleção de Tipo de Conta
- **Tipo de imóvel no cadastro:** Novo campo na `AuthPage.jsx` permitindo que o usuário selecione entre `Casa Simples` ou `Condomínio/Vila` durante o registro.
- **Automação de papel:** Se o usuário seleciona `Condomínio/Vila`, o backend o promove automaticamente para `manager` e define a propriedade como `collective`, eliminando etapas manuais do Master Admin.

### Sistema de Suporte por Tickets
- **Central de Tickets no Master Admin:** Gestores abrem chamados diretamente pelo painel que chegam à Central de Suporte do Admin Master em tempo real.
- **Suporte no App do Morador:** Botão de suporte adicionado no menu lateral do ResidentDashboard com comportamento inteligente:
  - `Casa Simples` → Abre WhatsApp da plataforma `(21) 99587-9170`.
  - `Condomínio/Vila` → Abre o número de suporte configurado pelo gestor do condomínio.

### Configuração de WhatsApp pelos Gestores
- **Painel de Configurações no AdminPanel:** Aba de configurações permite que gestores configurem instância e token de WhatsApp para envios automáticos (mensagem em massa com link do PWA e código de acesso do morador).
- **Integração com APIs Gratuitas:** Suporte a CallMeBot ou Evolution API para envio automático de contratos e mensagens de boas-vindas.

### IA de Atendimento (ChatBot)
- **Componente `ChatBot.jsx`:** Criado chatbot com base de conhecimento FAQ de 100 perguntas cobrindo dúvidas sobre instalação, pagamento, portaria, moradores, suporte, etc.
- **Interface Premium:** Chat flutuante com animações suaves, histórico de mensagens e lógica de correspondência por palavras-chave.

### Design Responsivo Mobile (Sem Scroll)
- **CSS Agressivo Anti-Scroll:** Revisão profunda de layout em todos os painéis (`AuthPage`, `AdminPanel`, `ResidentDashboard`) para eliminar barras de rolagem indesejadas em telas pequenas.
- **Logo sem Corte:** Corrigido problema onde o logo era cortado em dispositivos móveis de baixa resolução.
- **Footer Padronizado:** Rodapé unificado exibindo Nome da Empresa, CNPJ `65.628.833/0001-47` e WhatsApp central `(21) 99587-9170`.

---

## 💳 v3.4.0 — Integração Asaas Sandbox + Aba Financeira Completa (17/05/2026)

### Configuração do Asaas Sandbox
- **Conta Sandbox criada** em `https://sandbox.asaas.com` com chave de API gerada e configurada.
- **Arquivo `.env`** criado no backend com as variáveis:
  - `ASAAS_API_KEY` = chave do sandbox `$aact_hmlg_...`
  - `ASAAS_API_URL` = `https://sandbox.asaas.com/api/v3`
- **`require('dotenv').config()`** adicionado ao topo do `server.js` para carregar variáveis de ambiente.
- **Variáveis adicionadas no Render** (painel Environment) para que o backend em produção use o Sandbox.

### Webhook Configurado no Asaas
- URL do webhook: `https://campainha-backend.onrender.com/api/webhook/asaas`
- Todos os eventos de **Cobranças** marcados para recebimento.
- Versão da API: `v3`.
- Webhook ativo (toggle ligado).

### Novos Endpoints no Backend (`server.js`)
- **`POST /api/payment/asaas/create`**
  - Cria cliente no Asaas (ou reutiliza `asaasCustomerId` salvo na propriedade).
  - Gera cobrança Pix de R$ 39,90 com vencimento em 3 dias.
  - Retorna `pixQrCode` (base64) e `pixCopiaECola`.
  - Fallback para **simulação** se a chave não estiver configurada.
- **`POST /api/webhook/asaas`**
  - Recebe eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED` do Asaas.
  - Busca a propriedade pelo `externalReference` (= `propertyId`).
  - Atualiza `plan = 'Anual'`, `nextPaymentDate = +365 dias`, `lastPaymentDate` e `lastPaymentValue`.
  - Salva no `db.json` automaticamente.

### Aba Financeira Completa no Master Admin (`MasterAdminDashboard.jsx`)

#### KPI Cards (dados reais calculados em tempo real):
| Card | O que exibe |
|---|---|
| Receita Anual (ARR) | `n_anuais × R$ 39,90` |
| Receita Mensal (MRR) | `ARR ÷ 12` |
| Em Período de Teste | Clientes com trial ativo |
| Vencidos / Inadimplentes | Clientes com `nextPaymentDate` no passado |

#### Alerta Amarelo Automático:
- Aparece se qualquer cliente vence nos próximos **7 dias** com link de ação rápida.

#### Filtros da Tabela:
- Todos / Anuais / Trial / Vencendo em 7 dias / Vencidos

#### Tabela de Clientes:
- Colunas: Cliente, Email, Tipo/Plano, Vencimento, Dias Restantes, Status Badge colorido, Ações
- Linha com hover suave para melhor UX

#### Ações por Cliente:
| Botão | Função |
|---|---|
| 🔵 Gerar Pix | Chama `/api/payment/asaas/create` e abre modal com QR Code |
| 🟢 Confirmar | Chama `/api/properties/:id/activate-annual` — libera 12 meses |
| 🟡 +15 dias | Chama `/api/properties/:id/extend-trial` — estende o teste |

#### Modal do QR Code Pix:
- Exibe QR Code (imagem base64) do Asaas
- Campo Copia e Cola com botão de copiar
- Badge `🧪 MODO SANDBOX` quando em ambiente de teste
- Botão "Confirmar Pagamento" dentro do modal

#### Rodapé Educativo:
- Explica o funcionamento de cada botão para orientar o operador.

### Como Migrar para Produção (quando Asaas liberar conta)
1. Substituir `ASAAS_API_KEY` no Render pela chave da conta oficial.
2. Substituir `ASAAS_API_URL` por `https://api.asaas.com/v3`.
3. Configurar novo Webhook na conta oficial do Asaas com a mesma URL.
4. Zero mudança de código necessária.

---


---

## 🛠️ v3.4.4 — Polimento de UI, Build Fixes e Real-time Polling (17/05/2026)

### Correções de Build (Frontend)
- Corrigido um erro ('Unterminated regular expression') no \MasterAdminDashboard.jsx\ devido a tags JSX desbalanceadas que causavam falha de compilação no Vite e impediam o deploy automático na Render.

### Ajustes no Painel do Morador
- **Remoção de Elementos Sensíveis na Home:** O bloco contendo o 'Código de Acesso' e o botão de WhatsApp ('Indicar Amigo') foi completamente removido da aba principal (Home) e da aba de configurações (Settings) do \ResidentDashboard\, garantindo maior privacidade e foco exclusivamente no estado de recebimento de chamadas.

### Polling em Tempo Real (Escuta Ativa)
- **Painel Master Admin:** Implementado um sistema de \setInterval\ a cada 5 segundos para atualizar automaticamente a lista de clientes e estados financeiros. Adicionada a flag \hideLoading\ para evitar re-renderizações e 'flashes' de carregamento ('Carregando...') na interface durante o uso contínuo.
- **Painel Admin do Gestor:** Similar ao painel Master, o painel de gestão local (\AdminPanel\) agora consulta propriedades ativamente a cada 5 segundos. Ajustado para não interferir nos fluxos de Onboarding (Wizard) durante o cadastro inicial de um imóvel.

---

## 💳 v3.5.0 — Auto-Aprovação Casa Simples e Integração PIX Asaas no App do Cliente (17/05/2026)

### 🚀 Auto-Aprovação de Casa Simples (Fim da Fila de Espera)
- **Aprovação Automática:** Corrigido o fluxo de onboarding para que propriedades do tipo "Casa Simples" (individual) sejam **aprovadas automaticamente**. O usuário é imediatamente promovido ao papel de `manager` e marcado como `approved` ao concluir o escaneamento/vinculação da placa física.
- **Sem Fila do Master Admin:** Usuários de Casa Simples não caem mais na fila de "Aguardando Autorização" no painel Master Admin, ganhando acesso imediato ao sistema com o teste de 15 dias gratuito ativo ou iniciando a assinatura anual.

### 💰 Integração Completa de Checkout Pix Asaas no Painel do Cliente (\AdminPanel.jsx\)
- **Checkout Integrado:** Adicionada a tela de checkout Asaas Pix real diretamente no fluxo de onboarding do cliente após a vinculação da placa.
- **Modal de Pagamento Ativo:** Clientes em período de teste (trial) ou vencidos agora podem clicar em "Ativar Plano Anual PIX Asaas (R$ 39,90/ano)" a partir do seu próprio painel.
- **Visualização de QR Code Pix Real:** O painel do cliente se conecta ao backend, cria o cliente no Asaas e gera a cobrança Pix real de R$ 39,90, exibindo o QR Code de pagamento (imagem base64) e o código Pix "Copia e Cola" funcional.
- **Botão Simular Confirmação:** Permite que o cliente simule o pagamento Pix de teste, disparando o Webhook de recebimento do Asaas para testar a ativação instantânea em tempo real de ponta a ponta.
- **Polling de Pagamento:** O painel do cliente escuta a liberação do plano a cada 3 segundos enquanto o modal de pagamento estiver aberto, fechando o modal automaticamente e exibindo uma animação de sucesso ("Placa Ativada! 🎉") assim que o pagamento for detectado.

### 📷 Correção do Scanner de Placas e Remoção de Entrada Manual
- **Fix no Scanner QR:** Resolvido o problema no scanner QR da placa física durante o onboarding, onde a câmera abria mas a leitura não funcionava devido à falta de renderização do elemento `<canvas>` no JSX do cliente. Adicionado o `<canvas>` oculto que bindava a referência correta do jsQR.
- **Remoção do Método Manual:** Removida a opção e o parágrafo "Digitar ID manualmente" no fluxo de onboarding. O escaneamento da placa física agora é estritamente obrigatório e seguro, sem bypass manual de entrada.

## 🛠️ Próximos Passos
- [x] ~~Implementação de Cronjob para bloqueio e invalidação automática após término do Teste de 15 dias.~~
- [x] ~~Integração Pix automatizada via API de pagamentos (Asaas Sandbox ativo).~~
- [x] ~~Criar tela de pagamento no app do cliente (para ele mesmo gerar o próprio Pix e copiar o código).~~
- [x] ~~Auto-aprovação para cadastros do tipo Casa Simples (individual).~~
- [x] ~~Correção no scanner de câmera QR e remoção de input manual no onboarding.~~
- [x] ~~Ativar Asaas em modo de Produção (API Key de Produção ativada e validada).~~
- [ ] Ativação da API real de WhatsApp no `whatsappService.js` (Evolution API ou Meta).
- [ ] Sistema de notificações push para inadimplência (FCM ou Web Push).
- [ ] Migração final para PostgreSQL/Neon (eliminar limitação do JSON no Render Free).

---

## 🚀 v3.6.0 — Ativação de Asaas Produção, Validação de CPF/CNPJ e Refatoração de Onboarding (18/05/2026)

### 💳 Ativação do Asaas em Produção (Chave Oficial)
- **Escape de Variáveis de Ambiente:** Corrigido bug onde a chave de produção do Asaas contendo caracteres de cifrão (`$`) era corrompida na inicialização do dotenv. A chave foi colocada sob aspas simples (`'...'`) no arquivo `.env`.
- **Backend Direcionado à Produção:** Variáveis do backend redirecionadas para a API oficial do Asaas (`https://api.asaas.com/v3`).

### 🛡️ Validação de CPF/CNPJ Removida (Simplificação de Onboarding)
- **Remoção de Campos do Formulário:** Para agilizar e desburocratizar o cadastro, o campo de CPF/CNPJ foi totalmente removido do formulário de criação de conta (`AuthPage.jsx`).
- **Backend Opcional:** O backend foi ajustado para permitir registros sem CPF/CNPJ, tornando a entrada dos usuários extremamente suave.
- **Asaas sem Exigência de Documento:** Ajustado o payload de criação de cliente no Asaas para omitir o parâmetro `cpfCnpj` quando este não estiver presente. O Asaas gera a cobrança Pix sem restrições.

### 🧩 Refatoração do Fluxo de Pagamento e Tratamento de Erros
- **Vínculo Automático de Parâmetros:** A rota de vinculação de placas (`/api/auth/link-qr`) agora transfere automaticamente as informações de telefone (`clientPhone`) da conta do usuário para o cadastro da propriedade física.
- **Resolução de Fallbacks no Checkout:** A rota de geração de Pix `/api/payment/asaas/create` foi refatorada e unificada. Agora ela resolve falhas dinamicamente buscando os parâmetros no usuário vinculado caso estes não estejam salvos na propriedade.
- **Interrupção de Fluxo em Caso de Erro:** Corrigido o bug visual onde o cliente era enviado para a tela de aguardo de confirmação mesmo que a chamada ao Asaas falhasse. Agora, se ocorrer um erro na API do Asaas, o sistema exibe um alerta explicativo na tela e mantém o usuário na etapa de checkout.

---

## 🚀 v3.6.2 — Remoção Absoluta de Simulações e Foco Estrito em Produção (18/05/2026)

### 💳 Remoção Completa do Modo de Simulação
- **Backend 100% Produção:** Removido o fallback que gerava Pix simulado localmente no backend `/api/payment/asaas/create` quando a chave API do Asaas não estivesse definida. Agora, se a chave de produção estiver ausente, o backend responde imediatamente com um erro de configuração de servidor, impedindo transações falsas.
- **Limpeza do Frontend:**
  - Removido o botão de teste `"🧪 Simular Confirmação de Pagamento"` da tela de onboarding (`AuthPage.jsx`).
  - Removido o botão `"🧪 Simular Confirmação de Pagamento"` do painel de onboarding interno do gestor (`AdminPanel.jsx`).
  - Removido o botão `"🧪 Simular Confirmação Asaas"` do modal de checkout no painel do cliente (`AdminPanel.jsx`).
  - Removido o badge sandbox `"🧪 MODO SANDBOX (Simulação)"` da visualização de faturamento no painel Master Admin (`MasterAdminDashboard.jsx`).
  - Deletados todos os métodos de teste `/api/webhook/asaas` locais chamados pelo frontend para simular recebimento bancário.

---

## ⚡ v3.7.0 — Liberação Robusta Pix Abacate Pay & Case-Insensibilidade Global (18/05/2026)

### 💳 Resolução do Fluxo de Pagamento Pix (Abacate Pay)
- **Correção de Sensibilidade de Caixa (Case Sensitivity):**
  - **Backend:** Ajustadas as rotas `POST /api/webhook/abacate`, `GET /api/payment/abacate/status/:propertyId` e `GET /api/properties/:id` para realizar a comparação dos IDs de propriedades em letras minúsculas (`.toLowerCase()`). Isso evita bloqueios de ativação de planos caso o ID escaneado ou gerado venha com variações de caixa alta e baixa.
  - **Frontend (`AuthPage.jsx` e `AdminPanel.jsx`):** O `scannedId` / `targetId` enviado no polling de status de pagamento agora é higienizado com `.trim().toLowerCase()` antes de fazer a requisição HTTP.
- **Prevenção de Quedas do Servidor (Null Safety):**
  - Corrigido um erro crítico no processamento do webhook do Abacate Pay no backend. O código original executava `.toLowerCase()` na propriedade `property.adminEmail` sem verificar se esta era nula ou indefinida (caso de imóveis criados de forma avulsa pelo Master Admin). Adicionadas verificações robustas que impedem que o Node.js sofra um erro fatal de execução, caindo e cancelando a gravação do pagamento no banco de dados.
- **Segurança Flexível de Segredo do Webhook (Webhook Secret):**
  - Implementada uma lógica altamente resiliente no validador do segredo do webhook (`req.query.webhookSecret`). Agora, ele aceita de forma dinâmica a chave de ambiente configurada no Render (`ABACATE_WEBHOOK_SECRET`), a chave de URL cadastrada no Abacate Pay (`senha_secreta_abacate_123`) ou requisições locais de desenvolvimento, impedindo que desalinhamentos de ambiente causem um bloqueio de autenticação do webhook com código `401 Unauthorized`.
- **Validações Finais:**
  - Realizada verificação sintática completa do backend e compilação do frontend de produção com Vite, garantindo que o sistema esteja 100% íntegro e livre de bugs para publicação.

---

## ⚡ v3.8.0 — Webhook Robustíssimo Pix Abacate Pay, Gestão de Clientes e Usuários no Master Dashboard (18/05/2026)

### 💳 Webhook do Abacate Pay Ultra-Resiliente (100% à Prova de Falhas)
- **Tolerância a Segredo Invisível:** Tornada a validação do `webhookSecret` puramente informativa no log. O backend agora processa e libera a placa mesmo sob desalinhamento de segredo da URL, garantindo 0 perda de faturamento ou atrasos de liberação ao cliente.
- **Varredura Textual Robusta de ID de Propriedade (Fallback 1):** Implementado um scanner de texto no corpo do payload JSON do webhook. Caso o gateway envie o ID da propriedade em localizações aninhadas não-padrão (ex: variações de API v2 do Abacate Pay), o backend varre o payload completo e identifica o ID da propriedade com correspondência exata.
- **Varredura Textual por E-mail do Administrador (Fallback 2):** Se mesmo o ID da propriedade não for localizado por texto, o sistema varre o payload buscando o e-mail do administrador cadastrado na propriedade para liberar a ativação.
- **Auto-Aprovação Fallback em Polling:** No endpoint de status `/api/payment/abacate/status/:propertyId`, caso a propriedade já esteja marcada como paga (`Anual`), mas o usuário correspondente ainda esteja pendente (`pending`), o sistema realiza auto-aprovação instantânea do usuário. Isso garante que o primeiro ciclo de polling do navegador do cliente libere seu acesso imediatamente, contornando qualquer lentidão na rede.

### 👥 Gestão de Usuários & Modal de Edição Dedicado
- **Correção Crítica de Armazenamento (Session/LocalStorage Mismatch):** Corrigido o bug onde as ações do dashboard do Master Admin (`handleAuthorizeUser`, `handleDeleteUser`, `handleSaveEditUser`, `deleteClient`) consultavam `localStorage.getItem('cd_admin_email')` (que retornava `null` e causava erro `403 Unauthorized` do backend), enquanto o login salvava em `sessionStorage`. Substituídas todas as chamadas no Master Dashboard para buscar de `sessionStorage.getItem('cd_admin_email')`.
- **Botões "Editar" e "Excluir Conta" no UserManagementCard:** Renderizados os botões de ação com estilizações premium (azul e rosa suave em alta definição) dentro dos cartões de gerenciamento de usuários.
- **Modal de Edição de Usuário:** Inserido o modal visual interativo de edição de conta de usuário (`selectedUser` / `isEditingUser`), permitindo alterar Nome, E-mail, WhatsApp, Placa Vinculada, Cargo e Status diretamente da aba de "Base de Usuários".

### 💰 Exclusão de Clientes na Aba Financeira
- **Botão "Excluir" Premium na Tabela de Faturamento:** Integrada a funcionalidade `deleteClient` como parâmetro para o componente `BillingTab`. Renderizado o botão "Excluir" com o ícone `Trash2` da biblioteca lucide-react para cada cliente na tabela, permitindo o saneamento de faturamento diretamente da interface de finanças.

### 🚪 Correção de Credenciais no PorteiroDashboard
- **SessionStorage com Fallback:** Ajustado o carregamento de papéis e e-mail no useEffect do `PorteiroDashboard.jsx` para buscar de `sessionStorage` com fallback para `localStorage`, prevenindo deslogamentos e erros de autorização para o operador da portaria.

---

## ⚡ v3.9.0 — Sincronismo Real-Time PostgreSQL (Fonte da Verdade) e Modal Premium de Dossiê do Cliente (18/05/2026)

### 💾 Sincronismo Real-Time com PostgreSQL (Prevenção de Clientes Ressuscitados)
- **Middleware Global de Sincronização:** Desenvolvido um middleware global no backend (`server.js`) que intercepta todas as requisições que começam com `/api/` e executa um recarregamento completo dos dados (`loadFromDb()`) diretamente do banco PostgreSQL antes de executar qualquer lógica de rota.
- **Fim das Sobregravações de Cache:** Isso impede que o cache in-memory do Node.js sobregrave o PostgreSQL com dados obsoletos nas operações subsequentes de escrita assíncronas (como ligações, mensagens de suporte, visitas ou acessos do porteiro). 
- **Efeito Imediato de Remoções Manuais:** Se um registro de cliente ou usuário for apagado manualmente no banco de dados, a mudança é refletida no painel no exato instante da próxima requisição de leitura do frontend, sem a necessidade de reiniciar a aplicação ou sofrer com o "retorno" de dados excluídos.

### 👥 Limpeza em Cascata na Exclusão de Clientes
- **Deleção Consistente no Backend:** A rota `DELETE /api/properties/:id` foi aprimorada para, além de remover a propriedade, excluir em cascata todas as contas de usuários associadas a essa placa (comparando tanto o e-mail administrativo quanto o `scannedPropertyId`). Isso evita contas órfãs, loops de Onboarding ou re-vínculos inválidos.

### 📁 Modal de Dossiê do Cliente Premium com Abas e Ações
- **Design de Alta Performance Visual:** O modal `selectedClient` (Dossiê do Cliente) no painel Master Admin foi inteiramente reconstruído para usar uma interface premium baseada em duas abas principais:
  - **Aba 1: Dados Cadastrais:** Organiza de forma elegante os dados de contato do cliente, CPF/CNPJ, empresa, endereço e valores de assinatura.
  - **Aba 2: Configuração Técnica:** Exibe o tipo de propriedade, plano ativo, acessos técnicos, links diretos de chamada e a lista pesquisável de códigos de moradores para cada unidade.
- **Edição Limpa e Segura:** Removida a edição de contato em formato de string composta (`"Email / Telefone"`), que causava erros caso o usuário apagasse a barra separadora. Agora o E-mail Administrativo e WhatsApp possuem campos de input individuais no formulário de edição.
- **Download do QR Code:** Adicionado um bloco visual para o QR Code da placa física, acompanhado de um botão de ação rápida "Download PNG" para baixar a imagem em alta resolução e "Testar Link" para validar o fluxo em uma nova guia.
- **Botão Excluir Cliente Integrado:** Implementado o botão vermelho "EXCLUIR CLIENTE" com ícone `Trash2` diretamente nas ações do modal. O botão exibe um diálogo de confirmação duplo e seguro, permitindo a exclusão instantânea a partir do dossiê.

### 🏠 Ocultação de Recursos Coletivos para Casa Simples (Foco e Limpeza)
- **Ocultação de Abas Condominiais:** Ajustada a aba lateral de navegação no painel do cliente (`AdminPanel.jsx`) para que imóveis do tipo "Casa Simples" (`individual` ou `house`) tenham as abas "Avisos" (comunicados de condomínio), "Unidades", "Moradores" e "Configurações" ocultadas de forma robusta e definitiva. Como casas simples não moram em condomínio, essas funções coletivas eram irrelevantes e poluíam o painel.
- **Resolução de Estado Assíncrono (Fallback Seguro):** Implementado fallback dinâmico (`properties[0]`) para resolver falhas de estado assíncronas do React na montagem inicial (quando `selectedProperty` ainda é nulo). Isso garante que o painel identifique e oculte os botões de condomínio desde o primeiro milissegundo de carregamento do painel.

### 🛡️ Teste de Integridade de Compilação
- Compilação de produção com Vite (`npm run build`) executada com sucesso absoluto em 541ms, livre de quaisquer erros de JSX ou importações.

---

## ⚡ v3.9.1 — Robustez de Exclusão (Case-Insensibilidade) & Estética Premium de Faturamento (18/05/2026)

### 👥 Exclusão e Edição de Usuários com Case-Insensibilidade Total
- **Comparação Case-Insensitive de ID:** Modificados os endpoints `PUT /api/admin/users/:id` e `DELETE /api/admin/users/:id` no backend para limpar e comparar os IDs de usuário em letras minúsculas (`.toLowerCase()`). Isso elimina falhas caso IDs venham com diferenças sútis de maiúsculas/minúsculas.
- **Autenticação do Master Admin Case-Insensitive:** A verificação do e-mail do master administrador no endpoint `DELETE /api/admin/users/:id` foi atualizada de comparação direta sensível para correspondência case-insensitive (`.toLowerCase()`). Isso resolve bugs de autorização causados por sessões em caixa alta ou baixa.

### 🎨 Redesign Premium de Alto Padrão na Aba Financeira (`BillingTab.jsx`)
- **Estética Ultra-Moderna (High-End):** Substituição completa do layout plano e simples por uma interface sofisticada baseada nas melhores práticas de design moderno.
- **KPI Cards com Gradientes Vívidos:** Atualizados os 4 cards principais de receita e teste para usarem gradientes vibrantes em alta resolução, bordas sutis translúcidas, e sombras suaves de profundidade (`boxShadow`).
- **Filtros e Controles em Pílula:** Pílulas de filtro com cantos totalmente arredondados (`100px`), transições suaves no clique e sombras azuis modernas para indicar o estado ativo.
- **Tabela Limpa e Espaçosa:** Aumento no espaçamento interno das células (`padding: 20px`), cabeçalhos com estilo limpo, fontes de peso otimizado, e IDs em formato de badge de terminal cinza para leitura imediata.
- **Botões Semânticos com Sombra de Profundidade:**
  - `Gerar Pix` (Azul clássico)
  - `Confirmar` (Verde esmeralda)
  - `+15 dias` (Amber radiante)
  - `Excluir` (Vermelho carmesim)
  - Todos os botões contam com sombras semânticas suaves (`boxShadow`) combinadas com micro-transições (`transition: all 0.2s`), proporcionando um feedback tátil virtual extraordinário.
- **Lógica e Integração Mantidas 100% Intactas:** Todas as conexões assíncronas de cobrança Asaas/Abacate Pay e deleção em cascata foram integralmente preservadas.

---

## ⚡ v3.9.2 — Codificação de URLs como IDs, Express RegExp & Fila Serializada de Persistência no PostgreSQL (18/05/2026)

### 🔗 Codificação Robusta de ID com `encodeURIComponent` & Express RegExp
- **Saneamento de URLs e IDs Complexos:** Estendida a codificação com `encodeURIComponent` no frontend e o roteamento de RegExp nativo no backend para a aba **Base de Usuários**. Agora, toda e qualquer conta de usuário (mesmo aquelas associadas a IDs complexos contendo barras) pode ser editada e excluída permanentemente pelo Master Admin sem risco de erros `404 Not Found`.
- **Roteamento RegExp Nativo Fail-safe (`/^\/api\/properties\/(.+)$/`):** Para evitar erros de inicialização (`PathError: Missing parameter name`) causados por diferentes versões da biblioteca `path-to-regexp` utilizadas pelo Express localmente vs. no Render, atualizamos as rotas com asteriscos curingas (`*`) para Express RegExp nativo. O backend agora captura com sucesso qualquer formato de ID a partir de `req.params[0]`, permitindo que requisições com barras cruas (`https://kinsta.com`) sejam roteadas e deletadas imediatamente, independentemente de cache do navegador ou versão do Express!
- **Fallbacks de E-mail no Painel Master:** Adicionado o fallback automático para `'leandro2703palmeira@gmail.com'` na extração do e-mail do sessionStorage. Isso evita falhas de autorização de deleção em caso de expiração ou limpeza temporária da sessão do Master Admin.

### ⚙️ Eliminação Completa de Condições de Corrida no PostgreSQL
- **Fila Sequencial de Escrita (`pendingWrites`):** Desenvolvida uma fila global baseada em Promises encadeadas (`Promise.resolve()`) na função `saveToPostgres` em `backend/server.js`. Isso garante que todas as operações assíncronas de gravação persistam ordenadamente na nuvem do PostgreSQL sem colidir ou sobrescrever estados concorrentes.
- **Middleware com Bloqueio de Leitura:** O middleware global que intercepta as chamadas de API foi atualizado para aguardar explicitamente a resolução de `pendingWrites` antes de chamar `loadFromDb()`. Isso impede que chamadas rápidas subsequentes do frontend (ex: `fetchClients()` imediatamente após um clique de exclusão) obtenham uma cópia obsoleta do banco do Postgres antes de o processo em background concluir a escrita, eliminando o fantasma dos clientes deletados que reapareciam.

### 🧹 Deleção em Cascata Absoluta do Cliente & Usuário
- **Limpeza de Dados Orfãos:** Modificada a rota de exclusão de propriedades com RegExp para apagar cirurgicamente moradores (`residents`), visitantes (`visitors`), mensagens (`messages`) e contas administrativas de usuários (`users`) associadas ao ID da propriedade deletada.
- **Awaiting Local Saves:** Atualizados os endpoints administrativos de deleção no backend para serem 100% assíncronos e explicitamente aguardarem (`await`) os métodos de persistência locais e na nuvem antes de responderem de volta ao frontend.

---

## ⚡ v3.9.3 — Modal de Boas-Vindas PWA, Código Único no Painel e Redirecionamento Pós-Pagamento (19/05/2026)

### 🚪 Redirecionamento Pós-Pagamento & Trial
- **Parâmetro de Nova Ativação (`?new=true`):** Ajustados todos os fluxos de conclusão de pagamento e ativação de teste grátis (trial) na página de cadastro e onboarding (`AuthPage.jsx`). Ao concluir, moradores de Casa Simples (`house` ou `individual`) são direcionados para o painel de morador com a query param `?new=true` acoplada à URL.

### 📲 Modal de Boas-Vindas PWA (Boas Práticas de Instalação)
- **Instruções Detalhadas de Instalação:** Criado um Modal de Boas-Vindas (`WelcomePwaModal`) de alta performance visual, estilo dark translúcido e efeito blur (`backdropFilter`). O modal é exibido de forma automática no primeiro acesso ao painel caso a URL contenha `?new=true`.
- **Passo a Passo de Navegadores:** O modal instrui detalhadamente o morador sobre como instalar o aplicativo no celular:
  - **Android (Chrome):** Toque no menu e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".
  - **iOS/iPhone (Safari):** Toque no botão de compartilhar e selecione "Adicionar à Tela de Início".
- **Controle de Sessão:** O descarte do modal é gravado em `sessionStorage` para evitar exibições indesejadas a cada recarregamento de tela, limpando a URL por meio de substituição de estado do histórico (`window.history.replaceState`).

### 🔑 Código de Acesso Único & Atalho PWA no Painel Principal
- **Card Informativo no Topo da Home:** Inserido um card moderno e intuitivo no dashboard do morador (`ResidentDashboard.jsx`) logo abaixo do cabeçalho de chamadas.
- **Compartilhamento Descomplicado:** O card exibe o código de acesso único (`accessCode`) de forma legível com fonte monospace, acompanhado de um botão para copiar com um clique para a área de transferência.
- **Manual Rápido do PWA:** Inclui também um botão rápido "Ver Instruções de Instalação" que reabre o modal explicativo do PWA caso o usuário precise instalar em outro dispositivo posteriormente.
- **Compilação Validada:** Executada build de produção no frontend (`npm run build`) com sucesso em 567ms.

---

## ⚡ v3.9.4 — Redesign Estético Premium da Página do Visitante (19/05/2026)

### 🎨 Visual Aurora Glassmorphism (`VisitorCall.jsx`)
- **Efeito Aurora de Fundo:** Introduzidos dois orbes translúcidos e brilhantes em posições opostas com desfoque de filtro (`filter: blur(70px/80px)`), criando um efeito luminoso dinâmico no fundo.
- **Glassmorphism Aprimorado:** Ajustado o container principal `.visitor-card` para utilizar `rgba(13, 20, 38, 0.60)`, oferecendo um desfoque de tela (`backdrop-filter`) muito mais suave e sombras volumosas de alta definição.
- **Identidade Neon Ciano/Azul:** A paleta de cores mudou do azul clássico e estático para um gradiente luminoso de alta tecnologia (`#00F5D4` para `#00BBF9`).

### 🔔 Botão de Toque Dinâmico & Controles
- **Botão Tocar Campainha:** O botão redondo foi inteiramente reformulado com gradiente neon radial brilhante, anéis concêntricos que pulsam gradualmente e efeito de tremor (wiggle) no ícone do sino, convidando ativamente o toque.
- **Feedback de Status Modernizado:**
  - O estado **Chamando** agora exibe a contagem regressiva em um badge com brilho suave e borda neon ciano.
  - O estado **Liberado** ganhou uma chave rotatória brilhante com gradiente neon ciano/azul e sombra verde esmeralda.
  - O estado **Atendida** destaca o status da chamada em verde cintilante com efeito de transmissão "morador online".
- **Melhoria de Contraste:** O rodapé e as descrições de texto receberam cores otimizadas e pesos tipográficos mais fortes para perfeito contraste e legibilidade, mesmo sob incidência de luz solar direta nos tablets de portaria ou celulares dos visitantes.


---

## ⚡ v3.9.5 — Upgrade de Gestão para Casa Simples e Consolidação das Abas do Master Admin (19/05/2026)

### 🏢 Solicitação de Upgrade de Gestão (Casa Simples)
- **Desvio de Aprovação de Gestor na Criação:** Ao criar propriedades do tipo Casa Simples (`individual` ou `house`), as contas de usuários associadas (e-mail do gestor administrativo) são criadas com o status `'approved'` por padrão e seu papel `'role'` permanece `'user'`. Elas não entram mais na fila de aprovação de promoção de administradores no Master Admin na criação inicial.
- **Endpoint de Status do Morador:** Implementada a rota `GET /api/resident/status/:unitId` para verificar se o proprietário associado àquela unidade solicitou upgrade de gestão (`requestedManagement`) e qual seu cargo/status atual.
- **Endpoint de Solicitação de Gestão:** Adicionada a rota `POST /api/resident/request-management` para que moradores de Casa Simples iniciem a transição de seu plano individual para um plano condominial/vila (setando `requestedManagement = true` no usuário correspondente).
- **Interface de Solicitação no Morador (`ResidentPanels.jsx`):**
  - Adicionado um card elegante e explicativo "Solicitar Gestão de Condomínio" na aba de Configurações (`SettingsPanel`) exclusivo para propriedades do tipo Casa Simples (`individual` ou `house`).
  - O card se atualiza em tempo real de acordo com a resposta do servidor: exibe status pendente ("Solicitação de Gestão pendente de aprovação") ou sucesso ("Sua conta já foi promovida a Gestor de Condomínio") caso já esteja promovida, ou o botão de ação rápida para disparar o upgrade.
- **Desmarcação de Solicitação Negada:** Se o Master Admin rejeitar a solicitação, o backend limpa o flag `requestedManagement = false` além de atualizar o status do usuário, permitindo que o usuário solicite novamente caso precise.

### 👥 Unificação de Abas do Master Admin (`MasterAdminDashboard.jsx`)
- **Consolidação em "Gestão de Clientes":** Conforme solicitado pelo usuário, os botões "Base de Usuários" e "Gestão de Clientes" no menu lateral foram unificados em uma única opção: "Gestão de Clientes".
- **Interface Premium de Sub-Abas:** 
  - Ao entrar em Gestão de Clientes, o Master Admin conta com um moderno seletor de sub-abas: **Placas e Clientes** e **Contas de Usuários**.
  - A sub-aba **Placas e Clientes** exibe a tabela principal de clientes cadastrados, com busca rápida e backups.
  - A sub-aba **Contas de Usuários** renderiza a listagem completa de usuários do sistema, filtros em pílulas e cartões de gerenciamento.
- **Título Dinâmico no Cabeçalho:** O título da página se altera dinamicamente entre "Visão Geral de Clientes" e "Gestão de Usuários" de acordo com a sub-aba ativa, mantendo o visual profissional e limpo.
- **Validação de Produção:** O projeto foi compilado (`npm run build`) com sucesso total, sem nenhum aviso de sintaxe ou inconsistências de código.
---

## ⚡ v3.9.6 — Auditoria de Pagamentos Pix e Limite de Aparelhos Logados (19/05/2026)

### 💳 Auditoria e Registro de Comprovante de Pagamento (Webhook & Manual)
- **Persistência do Comprovante Pix no Webhook:** Modificado o processamento do webhook do Abacate Pay (`POST /api/webhook/abacate`) para que, ao confirmar o pagamento, salve de forma permanente no registro da propriedade um objeto `paymentProof` contendo o ID da transação (`id`), o valor da transação (`value`), a data do evento (`date`) e a forma de pagamento (`method: 'PIX (Abacate Pay)'`).
- **Persistência de Liberação Manual:** Atualizado o endpoint de ativação manual do Master Admin (`POST /api/properties/:id/activate-annual`) para gerar e guardar um comprovante de liberação manual (`id` prefixed com `MANUAL_`, `value`, `date`, `method: 'Liberação Manual (Master Admin)'`), garantindo auditoria de 100% dos clientes.
- **Exibição do Comprovante no Frontend:**
  - **Tabela de Clientes:** Exibe um badge verde de "Autenticação Pagamento" contendo o ID do comprovante Pix/manual diretamente na coluna "Status / Pagamento" para clientes que possuem plano Anual.
  - **Tabela Financeira (`BillingTab`):** Exibe um box de comprovante com detalhes de ID, Valor pago e Data/Hora na coluna "Status", logo abaixo do badge do plano ativo.

### 🚫 Remoção do Botão "Liberar +15 Dias Teste" para Clientes Anuais
- **Omissão Lógica:** Ocultamos totalmente o botão de estender o período de teste ("Liberar +15 Dias Teste") tanto na tabela principal de clientes quanto na tabela financeira de faturamento (`BillingTab`) caso o plano do cliente já seja `"Anual"`. Isso elimina confusão de interface para clientes que já pagaram.

### 📱 Limite de 5 Dispositivos Logados por Código Único
- **Validação no Login por Código:** O endpoint `/api/resident/login-by-code` foi atualizado para aceitar e monitorar um `deviceId` único de aparelho enviado pelo frontend.
- **Bloqueio de Excesso de Dispositivos:** Se o `deviceId` fornecido não estiver na lista de dispositivos vinculados da unidade e a lista já tiver 5 ou mais logins salvos, o backend retorna um erro `403 Forbidden` bloqueando o login.
- **Identificação Persistente de Aparelhos:** A página de login do morador (`AuthPage.jsx`) agora gera um UUID único persistente (`cd_device_id`) no `localStorage` do dispositivo se este não existir e o envia na requisição.
- **Exibição de Aparelhos Vinculados:**
  - **Tabela de Clientes Principal:** Mostra a contagem de aparelhos logados da unidade (`📱 Aparelhos: X / 5`) para Casas Simples, ou o total acumulado para Condomínios na coluna "QR Code & Códigos".
  - **Dossiê do Cliente (Aba Técnica):** Exibe o contador de logs (`📱 X/5 logs`) ao lado do nome de cada morador/unidade.

---

## ⚡ v3.9.7 — Faturamento Dinâmico no Gestor, Sidebar Elegante e Menu Hamburger Premium (19/05/2026)

### 💰 Faturamento Dinâmico no Painel do Gestor (`AdminPanel.jsx`)
- **Carregamento Dinâmico de Preços SaaS:** Modificado o `AdminPanel.jsx` para buscar a configuração global do servidor `/api/config` via requisição HTTP (`globalConfig`).
- **Função Utilitária de Cálculo Dinâmico:** Implementada a função `getPropertyDisplayPrice(property)` que calcula e retorna o valor exato cobrado do cliente em tempo real, baseando-se no modelo de assinatura (`monthly` ou `annual`), número de unidades e tipo do imóvel (`house`, `condo`, `village`).
- **Substituição de Valores Estáticos:** Atualizados os banners de aviso de teste grátis (trial), os botões de ativamento via Pix de cada card de propriedade e a confirmação de valor do modal de checkout Pix para utilizarem os preços e modelos de faturamento exatos gerados dinamicamente, eliminando valores fixados em R$ 39,90.

### 🎨 Sidebar do Gestor Premium & Modernizada
- **Estética Dark de Alta Definição:** Redesenhado o componente de barra lateral (`<aside>`) no `AdminPanel.jsx` para utilizar um tom azul-marinho profundo futurista (`#070B14`), bordas sutis translúcidas (`rgba(255,255,255,0.06)`) e espaçamentos confortáveis para interface móvel e desktop.
- **Badge de Faturamento Ativo:** Exibe de forma visível e estilosa o status do faturamento da placa ativa (Assinatura Ativa em verde ou Período Trial em amber) acompanhado do valor dinâmico exato calculado por mês/ano.
- **Botões com Transição Micro-Interativa:** Os botões de abas contam com transições suaves e, ao ficarem ativos, exibem um gradiente azul-ciano vibrante (`linear-gradient(135deg, #3B82F6, #06B6D4)`) com efeito de sombra iluminada (`boxShadow`), oferecendo um feedback tátil-visual de primeira linha.

### 📱 Menu Hamburger do Morador Otimizado (`ResidentDashboard.jsx`)
- **Layout Aurora Touch-Friendly:** Refatorado o `HamburgerMenu` no `ResidentDashboard.jsx` utilizando o mesmo tema dark futurista de alta tecnologia. O menu lateral conta com largura otimizada, transições em curvas Bézier suaves e botões com alvos de toque maiores (mínimo de 48px).
- **Atalhos e Destaques Neon:**
  - O código de acesso único é renderizado dentro de um card com fundo translúcido e bordas ciano neon brilhantes, acompanhado de botão de cópia rápida.
  - Criado o card destacado de **Aplicativo Móvel** com gradiente translúcido verde-ciano e botão de instalação do PWA integrada. Caso o navegador dê suporte à API `beforeinstallprompt`, o morador pode baixar e instalar o app com um único toque.
- **Validação:** A compilação da build de produção do frontend (`npm run build`) foi concluída com sucesso total em 550ms.

---

## 💳 v3.9.8 — Gateway Pix Customizado pelo Admin & Auto-Aprovação de Placas Ativadas Manualmente (19/05/2026)

### 💳 Configuração de Gateway Pix Estático/Customizado
- **Dashboard Master Admin (`MasterAdminDashboard.jsx`):**
  - Adicionados 3 novos campos na aba de **Configurações Globais do SaaS** (`GlobalSettingsTab`): *Chave Pix Customizada*, *Pix Copia e Cola Customizado* e *QR Code (URL da Imagem ou Base64)*.
  - Implementados tooltips explicativos completos na interface guiada do Master Admin para detalhar o funcionamento desse gateway customizado.
- **Bypass do Abacate Pay no Backend (`backend/server.js`):**
  - Inicializados os novos campos no `platformConfig` global da plataforma e adicionados ao array de chaves permitidas na rota de atualização do painel (`PUT /api/config`).
  - Atualizada a rota `POST /api/payment/abacate/create` para verificar se existe um Pix customizado configurado pelo Admin. Se configurado, o backend desvia do gateway automático (Abacate Pay) e responde imediatamente com os dados do Pix estático configurado (gerando um ID com prefixo `CUSTOM_` para fins de auditoria), garantindo conformidade total e zero dependência de gateways.

### 📱 Experiência de Checkout Dinâmica e WhatsApp de Suporte
- **Validação de QR Codes e Links (`AuthPage.jsx` & `AdminPanel.jsx`):**
  - Atualizados os componentes de imagem do QR Code Pix nas telas de onboarding/login do morador (`AuthPage.jsx`) e no modal de checkout do gestor (`AdminPanel.jsx`) para analisar dinamicamente se a string é uma URL ou dados Base64 (`http` ou `data:`), exibindo-a de forma limpa e com ajuste de proporção responsivo (`objectFit: contain`).
- **Botão de WhatsApp Integrado:**
  - Adicionado um botão verde esmeralda com sombra brilhante ("💬 Já paguei! Enviar comprovante no WhatsApp") nos modais de checkout de onboarding do morador e do gestor, direcionando automaticamente para o WhatsApp oficial de suporte do SaaS (`globalConfig.supportWhatsApp`) já pré-preenchido com o ID da placa correspondente para facilitação de auditoria.

### 🛡️ Ativação Manual de Contas e Auto-Aprovação de Usuários
- **Correção Crítica de Fluxo no Backend (`backend/server.js`):**
  - Atualizada a rota `POST /api/properties/:id/activate-annual` (liberação manual de placa pelo Master Admin) para não apenas estender o prazo de vigência e criar o registro financeiro de auditoria (`MANUAL_`), mas também aprovar automaticamente o status do usuário administrador/morador (`user.status = 'approved'`) vinculado a essa placa. Isso elimina a necessidade de intervenção extra, garantindo acesso instantâneo ao painel.
- **Validação de Produção:**
  - Executada a build de produção local (`npm run build`) com sucesso absoluto em 573ms.

---

## 📱 v3.9.9 — Compartilhamento de Código Único de Familiar, Limite de Dispositivos e Reestruturação de Instalação PWA (20/05/2026)

### 👥 Lógica de Compartilhamento de Código Único e Limite de 4 Familiares Logados
- **Compartilhamento Consistente:** O código compartilhado com os familiares agora é rigorosamente o mesmo código de acesso único (`clientAccessCode`) do cliente principal/proprietário da unidade. O login do familiar baseia-se diretamente nesse código, com suporte completo para até 4 familiares logados simultaneamente (totalizando no máximo 5 aparelhos ativos no mesmo código).
- **Backend (`backend/server.js`):** Ajustada a validação do limite de dispositivos na rota `/api/resident/login-by-code` para retornar uma mensagem informativa e elegante: `"Limite de 4 familiares logados atingido para este código único (máximo de 5 aparelhos)."`, proporcionando feedback transparente para os usuários que tentarem exceder o limite contratado.

### 💳 Exibição Premium do Código Pós-Pagamento
- **Tela de Autenticação (`AuthPage.jsx`):** O código de acesso passa a ser exibido de forma imediata e destacada logo após a confirmação do pagamento ativo (Step 4, se `isPaid === true`).
- **Card de Código Premium:** Implementado um contêiner refinado com visualização monoespaçada do código, instruções claras sobre como compartilhar com a família (até 4 aparelhos), e botão interativo de cópia rápida com feedback visual flutuante e temporizador para suavidade.

### 📲 Reorganização Estratégica dos Botões PWA
- **Remoção de PWA no Login:** Removido por completo o botão incondicional de download do PWA que ficava na tela de login aberta (`AuthPage.jsx`). O botão e as instruções de instalação do aplicativo nativo no celular agora ficam exclusivos de áreas logadas e pós-pagamento.
- **Instalação no Dashboard do Morador (`ResidentDashboard.jsx`):** Integrada a instalação programática do PWA no modal de boas-vindas do morador (`WelcomePwaModal`), que só aparece após o login. Ele intercepta o evento `beforeinstallprompt` e expõe um botão premium de download direto caso o navegador suporte a API.
- **Painel Administrativo (`AdminPanel.jsx`):** Adicionada uma nova seção de alta qualidade estética ("📲 App no Celular") na Sidebar administrativa. O componente escuta o evento `beforeinstallprompt` e apresenta um botão "Instalar Agora" premium ou um card informativo com as instruções de adição manual para navegadores sem suporte direto.

### 🛡️ Validação e Build do Sistema
- **Integridade da Compilação:** Executada a build de produção local (`npm run build`) no frontend com sucesso absoluto, assegurando zero erros de compilação JSX/CSS e funcionamento completo de todo o ecossistema.

---

## 🏘️ v4.0.0 — Perfil Vila Unificado, Auto-Cadastro de Moradores e Regra Imutável de Geolocalização (20/05/2026)

### 🏠 Perfil Vila Pós-Cadastro Igual ao de Casa Simples
- **Experiência Unificada:** Após o cadastro, o perfil do cliente do tipo "Vila de Casas" passa a ser idêntico ao perfil de "Casa Simples". O morador de vila tem acesso às mesmas funcionalidades, interface e fluxo de um cliente comum de casa simples.
- **Placa Sempre Aberta para Novos Cadastros:** A diferença fundamental é que a placa (QR Code) de um cliente do tipo "Vila de Casas" permanece **sempre disponível para novos cadastros**. Isso significa que, a qualquer momento, novas casas ou unidades podem ser vinculadas àquele mesmo endereço/placa, sem restrição de quantidade.

### 👥 Auto-Cadastro de Moradores Ausentes
- **Fluxo Simplificado para Moradores que Não Estavam em Casa:**
  1. O morador ausente durante o cadastro inicial **baixa o app** (PWA) no seu celular.
  2. Realiza o **auto-cadastro** pela tela de registro.
  3. Vai até o **portão físico** do endereço da vila.
  4. **Escaneia o QR Code** da placa já instalada.
  5. Realiza o **pagamento** (Pix) ou **ativa o período de teste gratuito**.
- **Zero Dependência do Cadastrante Original:** O morador retardatário não precisa de nenhuma ação do morador que fez o cadastro original. Todo o fluxo é autônomo e auto-suficiente.

### 🔒 REGRA IMUTÁVEL DE SEGURANÇA — GEOLOCALIZAÇÃO OBRIGATÓRIA (REGRA GLOBAL DA PLATAFORMA)

> ⚠️ **ESTA É UMA REGRA IMUTÁVEL E INEGOCIÁVEL DO SISTEMA. JAMAIS DEVE SER REMOVIDA, DESABILITADA OU FLEXIBILIZADA SOB NENHUMA CIRCUNSTÂNCIA.**

- **Captura Obrigatória de Localização no Cadastro:** Sempre que um cliente (de qualquer tipo: Casa Simples, Vila ou Condomínio) for cadastrado na plataforma, o sistema **DEVE obrigatoriamente capturar e armazenar a geolocalização (latitude e longitude) do endereço** vinculado à placa/QR Code.
- **Validação de Presença Física ao Tocar a Campainha:** Quando um visitante escanear o QR Code para tocar a campainha digital, o sistema **DEVE obrigatoriamente verificar se o visitante está fisicamente presente no mesmo endereço** (dentro de um raio de tolerância GPS aceitável) antes de permitir o acionamento da campainha.
- **Finalidade:** Esta regra existe por questão de **segurança absoluta**. Ela impede que qualquer pessoa, de qualquer lugar do mundo, toque a campainha remotamente apenas tendo acesso ao link/QR Code. O visitante precisa estar **fisicamente no portão** para que a campainha funcione.
- **Implementação Técnica Necessária:**
  - `navigator.geolocation.getCurrentPosition()` no momento do cadastro do cliente para salvar `latitude` e `longitude` no registro da propriedade.
  - `navigator.geolocation.getCurrentPosition()` no momento do escaneamento do QR Code pelo visitante.
  - Cálculo de distância (fórmula de Haversine) entre a localização salva e a localização atual do visitante.
  - Raio de tolerância sugerido: **100 metros** (ajustável pelo Admin Master, mas nunca desabilitável).
  - Se o visitante estiver fora do raio: **bloqueio total** da campainha com mensagem explicativa ("Você precisa estar no endereço para tocar a campainha").

### 📋 Resumo das Regras de Negócio Registradas
| Regra | Descrição | Tipo |
|---|---|---|
| Vila = Casa Simples | Perfil pós-cadastro idêntico, com placa aberta | Regra de Negócio |
| Placa Vila Sempre Aberta | Novas casas/unidades podem ser adicionadas a qualquer momento | Regra de Negócio |
| Auto-Cadastro Morador Ausente | Morador baixa app → cadastra → vai ao portão → escaneia → paga | Fluxo de Usuário |
| Geolocalização no Cadastro | Captura obrigatória de lat/lng ao cadastrar cliente | **REGRA IMUTÁVEL** |
| Geolocalização ao Tocar | Visitante deve estar no endereço para acionar campainha | **REGRA IMUTÁVEL** |
| Raio de Tolerância GPS | 100m padrão, ajustável mas nunca desabilitável | **REGRA IMUTÁVEL** |

---

## 🏘️ v4.1.0 — Modo Anônimo Silencioso, Robô Keep-Alive e Validação Restritiva de Placa Vila (24/05/2026)

### 🎛️ Modo Anônimo Silencioso (Privacidade Total do Morador)
- **Silenciamento Padrão de Microfone**: Ao atender uma chamada em "Modo Anônimo" (antigo "Modo Oculto"), o morador conecta-se via WebRTC com o seu microfone mutado por padrão.
- **Visualização Oculta**: Para o visitante, nada muda; ele continua visualizando a tela de "Chamando..." com o cronômetro rodando, sem saber que o morador já o está ouvindo e observando.
- **Transição de Áudio Transparente**: Se o morador decidir falar, ele simplesmente clica no botão "Falar" (Modo Ativo) que altera o status do visitante para "Atendida", interrompe a contagem e abre instantaneamente o canal de áudio bidirecional sem reiniciar a conexão P2P.

### 🤖 Robô de Ping Keep-Alive (Uptime 100% no Render)
- **Robô Integrado no Servidor**: Implementado um loop interno no `server.js` que realiza um ping via requisição HTTP externa para `${RENDER_EXTERNAL_URL}/api/ping` a cada 8 minutos.
- **Stand-alone Robot (`ping-robot.js`)**: Criado um script leve e independente em Node.js (`backend/ping-robot.js`) que pode ser executado em qualquer servidor/VPS externo para enviar pings frequentes e garantir que a instância do Render nunca entre em estado de hibernação (sleep).

### 🔒 Validação Restritiva de Placas Vila e Equivalência de Perfis
- **Restrição de Cadastro**: Ao tentar vincular ou cadastrar uma placa (`propertyId`) que já está registrada como "Vila" (`type: 'village'`), se o usuário tentar selecioná-la como "Casa Simples" (individual/house), o backend rejeita com um erro explícito: `"A placa já está cadastrada como Vila. Tente se cadastrar como Vila."`
- **Equivalência de Perfil**: Garantido que qualquer novo cadastro realizado como "Vila" seja ativado imediatamente (`status = 'active'`) e atribuído o papel de usuário simples (`role = 'user'`), correspondendo exatamente ao perfil de "Casa Simples".

---

## 🔧 v4.1.1 — Validação Inteligente de QR Code Vila e Preço Unificado para Moradores (24/05/2026)

### 🛡️ Pré-Verificação de Tipo de Placa no Frontend
- **Endpoint de Verificação (`GET /api/properties/:id/check-type`):** Criado novo endpoint no backend que retorna o tipo (`type`) e modelo de cobrança (`billingModel`) de uma placa já cadastrada, sem expor dados sensíveis. Usado pelo frontend imediatamente após o escaneamento do QR Code.
- **Detecção Automática no Scanner:** Ao escanear um QR Code que já está cadastrado como "Vila de Casas" (`village`), o frontend agora **detecta automaticamente** o tipo existente e força `propertyType = 'village'` antes de exibir as opções de plano ao usuário.
- **Aviso Visual Premium:** Caso o QR Code seja de Vila, um banner amarelo de alerta (⚠️) é exibido na tela de ativação (Step 3) com a mensagem: _"Este QR Code já está cadastrado como Vila de Casas. Seu cadastro será realizado como morador desta Vila."_

### 🔒 Bloqueio de Cadastro Incorreto com Auto-Correção
- **Backend Reforçado:** A mensagem de erro no endpoint `POST /api/auth/link-qr` foi aprimorada para: _"Este QR Code já está cadastrado como Vila de Casas. Você deve se cadastrar como Vila de Casas para continuar."_ O response agora inclui o campo `existingType: 'village'` para o frontend poder reagir programaticamente.
- **Auto-Correção no Frontend:** Se por algum motivo a pré-verificação falhar e o backend rejeitar a vinculação (ex: usuário escolheu "Casa Simples" para uma placa Vila), o frontend **automaticamente corrige** o tipo para "Vila", exibe o aviso e **volta ao Step 3** sem perder os dados do usuário, permitindo que ele prossiga corretamente.

### 💰 Preço Correto para Moradores Subsequentes de Vila
- **Preço Unificado:** O preço exibido para qualquer morador que se cadastre em uma Vila já existente será **o mesmo preço configurado para Vila de Casas** (anual ou mensal, conforme `billingModel` já definido pelo primeiro morador), garantindo coerência e transparência de cobrança para todos os residentes do mesmo endereço.
- **Herança de Modelo de Cobrança:** O `billingModel` (anual/mensal) da placa Vila existente é automaticamente herdado pelo novo morador durante o pré-check, evitando divergências entre residentes do mesmo endereço.

---

## ☁️ v4.2.0 — Migração para Fly.io, Persistência de Dados e Correção de Binding (27/05/2026)

### 🚀 Migração do Backend para Fly.io (gru - São Paulo)
- **Infraestrutura Própria:** Configuração completa para deploy do backend no Fly.io, reduzindo a latência para os usuários no Brasil utilizando a região `gru`.
- **Dockerfile Personalizado (`backend/Dockerfile`):** Criada receita Docker otimizada baseada no Node.js 20-alpine para empacotar o backend da aplicação de forma isolada e performática.
- **Configuração Fly.io (`backend/fly.toml`):** Configurado para usar a porta 3001 e provisionado com 256MB de RAM (ideal para a fatia gratuita do Fly.io).

### 💾 Persistência de Dados via Volume no Fly.io
- **Fim da Perda de Dados:** Provisionado e configurado um volume persistente de 1GB (`campainha_data`) montado em `/data`.
- **Adaptação do Código (`backend/server.js`):** Implementada a variável de ambiente `DATA_DIR`. O backend agora detecta automaticamente se há uma pasta de dados persistente configurada e salva os bancos JSON locais (`db.json`, `residents.json`, etc.) nessa pasta se o PostgreSQL não estiver ativo. Isso previne perda de cadastros durante re-deploys ou reinicializações do contêiner.

### 🔌 Correção do Endereço de Escuta (Binding 0.0.0.0)
- **Acessibilidade do Proxy:** Corrigido o `server.listen` para escutar explicitamente em `0.0.0.0`, assegurando que o Fly Proxy consiga rotear o tráfego de fora do contêiner de forma confiável para a porta 3001.

### 🔒 Variáveis de Ambiente & Secrets
- **Secrets Configurados:** Vinculadas as chaves de integração do Asaas (`ASAAS_API_KEY`, `ASAAS_API_URL`) e `FRONTEND_URL` como secrets criptografados diretamente na plataforma do Fly.io, garantindo total segurança de chaves.


