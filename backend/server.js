require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const WhatsAppService = require('./services/whatsappService');
const PdfService = require('./services/pdfService');
const webPush = require('web-push');
const axios = require('axios');

// Configuração Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''; // Chave de API do Asaas (Produção ou Sandbox)
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'; // Use https://sandbox.asaas.com/api/v3 para testes

// Configuração VAPID
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BOKz4CjOXwpKxhmqIKPx22wV3oAZmUHbrbSvucyErK7tcZB7XxNfiAD9itYQi46nMw0o_7nbuqe6zHu5NiwI0tc';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'wBw8-8ShBBcPYdQ6SH4dOrRER6mS52rFU833Hk6Zgi8';

webPush.setVapidDetails(
  'mailto:suporte@campainhadigital.com.br',
  publicVapidKey,
  privateVapidKey
);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // Configurações para Render Free Tier
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/contracts', express.static(path.join(__dirname, 'contracts')));

// ─── Paths dos bancos JSON ────────────────────────────────────────────────────
const dbPath           = path.join(__dirname, 'db.json');
const residentsDbPath  = path.join(__dirname, 'residents.json');
const visitorsDbPath   = path.join(__dirname, 'visitors.json');
const messagesDbPath   = path.join(__dirname, 'messages.json');
const usersDbPath      = path.join(__dirname, 'users.json');
const subscriptionsDbPath = path.join(__dirname, 'subscriptions.json');
const supportDbPath    = path.join(__dirname, 'support.json');
const configDbPath     = path.join(__dirname, 'platform_config.json');

let properties = [];
let residents  = [];
let visitors   = [];
let messages   = [];
let users      = [];
let subscriptions = [];
let supportTickets = [];

// Configurações Globais da Plataforma (preço, trial, etc.)
let platformConfig = {
  servicePriceAnnual: 39.90,       // Preço da assinatura anual (R$)
  trialDays: 15,                   // Dias de trial grátis
  planName: 'Anual',               // Nome do plano
  pixDueDays: 3,                   // Dias para vencimento do Pix gerado
  companyName: 'Campainha Digital',
  supportWhatsApp: '5521995879170',
  updatedAt: new Date().toISOString()
};

function loadDb() {
  if (fs.existsSync(dbPath))          properties = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (fs.existsSync(residentsDbPath)) residents  = JSON.parse(fs.readFileSync(residentsDbPath, 'utf8'));
  if (fs.existsSync(visitorsDbPath))  visitors   = JSON.parse(fs.readFileSync(visitorsDbPath, 'utf8'));
  if (fs.existsSync(messagesDbPath))  messages   = JSON.parse(fs.readFileSync(messagesDbPath, 'utf8'));
  if (fs.existsSync(usersDbPath))     users      = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
  if (fs.existsSync(subscriptionsDbPath)) subscriptions = JSON.parse(fs.readFileSync(subscriptionsDbPath, 'utf8'));
  if (fs.existsSync(supportDbPath))   supportTickets = JSON.parse(fs.readFileSync(supportDbPath, 'utf8'));
  if (fs.existsSync(configDbPath))    platformConfig = { ...platformConfig, ...JSON.parse(fs.readFileSync(configDbPath, 'utf8')) };
}
loadDb();

const saveDb        = () => fs.writeFileSync(dbPath,          JSON.stringify(properties, null, 2));
const saveResidents = () => fs.writeFileSync(residentsDbPath, JSON.stringify(residents,  null, 2));
const saveVisitors  = () => fs.writeFileSync(visitorsDbPath,  JSON.stringify(visitors,   null, 2));
const saveMessages  = () => fs.writeFileSync(messagesDbPath,  JSON.stringify(messages,   null, 2));
const saveUsers     = () => fs.writeFileSync(usersDbPath,      JSON.stringify(users,      null, 2));
const saveSubscriptions = () => fs.writeFileSync(subscriptionsDbPath, JSON.stringify(subscriptions, null, 2));
const saveSupportTickets = () => fs.writeFileSync(supportDbPath, JSON.stringify(supportTickets, null, 2));
const saveConfig = () => fs.writeFileSync(configDbPath, JSON.stringify(platformConfig, null, 2));

// ─── Config Routes (Configurações Globais da Plataforma) ──────────────────────
app.get('/api/config', (_req, res) => res.json(platformConfig));

app.put('/api/config', (req, res) => {
  const allowed = ['servicePriceAnnual', 'trialDays', 'planName', 'pixDueDays', 'companyName', 'supportWhatsApp'];
  allowed.forEach(key => {
    if (req.body[key] !== undefined) platformConfig[key] = req.body[key];
  });
  platformConfig.updatedAt = new Date().toISOString();
  saveConfig();
  console.log('[CONFIG] Configurações atualizadas:', platformConfig);
  res.json({ success: true, config: platformConfig });
});
// ─── Keep-Alive endpoint (previne spin-down no Render Free) ──────────────────
app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ─── Push Subscription Route ──────────────────────────────────────────────────
app.post('/api/subscribe', (req, res) => {
  const { subscription, unitId, propertyId } = req.body;
  
  if (!subscription || !unitId) return res.status(400).json({ error: 'Faltam dados da inscrição.' });
  
  // Atualiza ou insere
  const existingIndex = subscriptions.findIndex(s => s.unitId === unitId && s.subscription.endpoint === subscription.endpoint);
  if (existingIndex > -1) {
    subscriptions[existingIndex] = { subscription, unitId, propertyId, lastUpdated: new Date().toISOString() };
  } else {
    subscriptions.push({ subscription, unitId, propertyId, lastUpdated: new Date().toISOString() });
  }
  
  saveSubscriptions();
  res.status(201).json({ success: true });
});
// ─── Support Routes ────────────────────────────────────────────────────────────
app.post('/api/support', (req, res) => {
  const { title, message, propertyId, userEmail, userRole } = req.body;
  if (!title || !message || !userEmail) return res.status(400).json({ error: 'Faltam dados.' });
  
  const ticket = {
    id: uuidv4(),
    title, message, propertyId, userEmail, userRole,
    status: 'open',
    createdAt: new Date().toISOString(),
    replies: []
  };
  supportTickets.push(ticket);
  saveSupportTickets();
  res.status(201).json(ticket);
});

app.get('/api/support', (req, res) => {
  const { email, role } = req.query;
  if (email === MASTER_ADMIN_EMAIL) {
    return res.json(supportTickets);
  }
  const userTickets = supportTickets.filter(t => t.userEmail === email);
  res.json(userTickets);
});

app.post('/api/support/:id/reply', (req, res) => {
  const { message, senderEmail, senderRole } = req.body;
  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado.' });
  
  ticket.replies.push({
    message, senderEmail, senderRole,
    createdAt: new Date().toISOString()
  });
  if (senderEmail === MASTER_ADMIN_EMAIL) {
    ticket.status = 'answered';
  } else {
    ticket.status = 'open'; // reopen if client replies
  }
  saveSupportTickets();
  res.json(ticket);
});

app.put('/api/support/:id/close', (req, res) => {
  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado.' });
  ticket.status = 'closed';
  saveSupportTickets();
  res.json(ticket);
});
// ─── Helpers ─────────────────────────────────────────────────────────────────
const generateAccessCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

// ─── Abacate Pay Payment Routes ────────────────────────────────────────────────

const ABACATE_API_KEY = process.env.ABACATE_API_KEY || 'abc_prod_ydwCLfYbLkygtA0xrsdtzQaH';
const ABACATE_WEBHOOK_SECRET = process.env.ABACATE_WEBHOOK_SECRET || 'senha_secreta_abacate_123';

// POST /api/payment/abacate/create — Gera cobrança Pix para um cliente
app.post('/api/payment/abacate/create', async (req, res) => {
  const { propertyId } = req.body;
  if (!propertyId) return res.status(400).json({ error: 'propertyId é obrigatório.' });

  const property = properties.find(p => p.id === propertyId);
  if (!property) return res.status(404).json({ error: 'Propriedade não encontrada.' });

  const user = users.find(u => u.email === property.adminEmail);

  // Usa preço customizado da propriedade se houver, senão usa o preço global das configurações
  const servicePrice = (property.customPrice !== undefined && property.customPrice !== null && property.customPrice > 0)
    ? Number(property.customPrice)
    : (platformConfig.servicePriceAnnual || 39.90);
  const amountInCents = Math.round(servicePrice * 100);

  try {
    console.log(`[ABACATE] Gerando cobrança PIX para propriedade: ${propertyId}`);
    
    // Payload do Abacate Pay
    const payload = {
      method: "PIX",
      data: {
        amount: amountInCents,
        description: `Assinatura ${platformConfig.planName || 'Anual'} - ${property.name}`,
        externalId: propertyId,
        metadata: {
          propertyId: propertyId
        }
      }
    };

    const chargeRes = await axios.post(`https://api.abacatepay.com/v2/transparents/create`, payload, {
      headers: { 
        'Authorization': `Bearer ${ABACATE_API_KEY}`, 
        'Content-Type': 'application/json' 
      }
    });

    const abacateData = chargeRes.data;

    if (!abacateData.success) {
      throw new Error('Falha ao criar cobrança no Abacate Pay');
    }

    const { id, brCodeBase64, brCode } = abacateData.data;

    return res.json({
      success: true,
      paymentId: id,
      pixQrCode: brCodeBase64.replace('data:image/png;base64,', ''), // Imagem Base64 sem o prefixo para manter compatibilidade com o frontend (embora o novo venha com prefixo, trataremos no frontend se precisar, ou já passamos limpo)
      pixCopiaECola: brCode, // Código Copia e Cola
      value: servicePrice
    });

  } catch (err) {
    console.error('[ABACATE] Erro ao gerar cobrança:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Erro ao gerar cobrança no Abacate Pay.', detail: err.message });
  }
});

// POST /api/webhook/abacate — Recebe notificações de pagamento do Abacate Pay
app.post('/api/webhook/abacate', express.json(), (req, res) => {
  const payload = req.body;
  
  // Segurança do Webhook:
  // Como o usuário vai configurar o Webhook no painel do Abacate Pay e ele pede um "Secret", 
  // recomendamos que a URL do webhook seja cadastrada lá da seguinte forma:
  // https://seu-site.com/api/webhook/abacate?webhookSecret=SENHA_AQUI
  const secretFromQuery = req.query.webhookSecret;
  if (secretFromQuery && secretFromQuery !== ABACATE_WEBHOOK_SECRET) {
     console.log('[ABACATE WEBHOOK] Bloqueado - Secret inválido na URL');
     return res.status(401).send('Unauthorized');
  }

  console.log('[ABACATE WEBHOOK] Recebido evento:', payload.event);

  // O Checkout Transparente do Abacate Pay dispara o evento 'transparent.completed' quando pago.
  if (payload && payload.event === 'transparent.completed' && payload.data && payload.data.externalId) {
    const propertyId = payload.data.externalId;
    const property = properties.find(p => p.id === propertyId);
    
    if (property) {
      property.plan = 'Anual';
      
      const nextPayment = new Date();
      nextPayment.setFullYear(nextPayment.getFullYear() + 1);
      property.nextPaymentDate = nextPayment.toISOString();
      
      // Como o pagamento já foi confirmado, aprova também o morador vinculado a esta placa
      const user = users.find(u => u.email === property.adminEmail);
      if (user) {
        user.status = 'approved';
      }

      saveDb();
      console.log(`[ABACATE WEBHOOK] Propriedade ${propertyId} e usuário ${property.adminEmail} liberados com sucesso.`);
    }
  }

  res.status(200).send('OK');
});

// GET /api/payment/abacate/status/:propertyId — Checa se a propriedade já foi paga e aprovada
app.get('/api/payment/abacate/status/:propertyId', (req, res) => {
  const { propertyId } = req.params;
  const property = properties.find(p => p.id === propertyId);
  if (!property) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  const user = users.find(u => u.email === property.adminEmail);
  const isApproved = user ? user.status === 'approved' : false;
  
  return res.json({
    paid: property.plan === 'Anual',
    approved: isApproved
  });
});



// ─── Master Admin Credentials ────────────────────────────────────────────────
const MASTER_ADMIN_EMAIL = 'leandro2703palmeira@gmail.com';
const MASTER_ADMIN_PASSWORD = '27031981';

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { email, password, clientCode, doormanCode } = req.body;
  
  const rawEmail = (email || '').trim().toLowerCase();
  const rawPassword = (password || '').trim();
  
  // 1. Master Admin
  if (rawEmail === MASTER_ADMIN_EMAIL.toLowerCase() && rawPassword === MASTER_ADMIN_PASSWORD) {
    return res.json({ success: true, role: 'master', email: MASTER_ADMIN_EMAIL });
  }
  
  // 2. Check in standard users first (New flow)
  const user = users.find(u => u.email.toLowerCase() === rawEmail && u.password === rawPassword);
  if (user) {
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Seu cadastro está aguardando aprovação do administrador do projeto.' });
    }
    if (user.status === 'denied') {
      return res.status(403).json({ error: 'Seu cadastro foi recusado pelo administrador.' });
    }
    
    // If approved, check if they have a property linked
    const prop = properties.find(p => p.adminEmail.toLowerCase() === rawEmail);
    return res.json({
      success: true, 
      role: user.role === 'manager' ? 'sindico' : 'user', 
      email: user.email,
      propertyId: prop ? prop.id : null,
      propertyName: prop ? prop.name : null,
      clientCode: prop ? prop.clientCode : null
    });
  }

  // 3. Property Admin (Client) - Legacy/Direct login by code
  const codeToUse = (clientCode || password || '').trim().toUpperCase();
  const propAdmin = properties.find(p =>
    (p.adminEmail || '').toLowerCase() === rawEmail &&
    (p.clientCode === codeToUse || 
     p.clientCode === rawPassword || 
     (p.adminPassword && p.adminPassword === rawPassword))
  );
    return res.json({
      success: true, role: 'sindico', email: propAdmin.adminEmail,
      propertyId: propAdmin.id, propertyName: propAdmin.name,
      clientCode: propAdmin.clientCode
    });

  // 4. Doorman - aceita doormanCode OU password
  const doorCode = (doormanCode || password || '').trim().toUpperCase();
  const propDoor = properties.find(p =>
    (p.doormanEmail || '').toLowerCase() === rawEmail &&
    (p.doormanCode === doorCode || p.doormanCode === rawPassword)
  );
  if (propDoor) {
    return res.json({
      success: true, role: 'doorman', email: propDoor.doormanEmail,
      propertyId: propDoor.id, propertyName: propDoor.name
    });
  }

  res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha/código.' });
});

// ─── Unified Registration Routes ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, whatsapp, password } = req.body;
  if (!name || !email || !password || !whatsapp) {
    return res.status(400).json({ error: 'Nome, e-mail, WhatsApp e senha são obrigatórios.' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });

  const newUser = {
    id: uuidv4(),
    name,
    email: email.toLowerCase(),
    whatsapp,
    password,
    role: 'user', // Starts as a simple user
    status: 'active', // Active immediately so they appear in the dashboard
    scannedPropertyId: null,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers();
  
  // Automate Welcome WhatsApp
  WhatsAppService.sendWelcomeMessage(newUser).catch(err => console.error('Error sending welcome message:', err));
  
  res.status(201).json({ success: true, message: 'Cadastro realizado. Agora escaneie sua placa.', userId: newUser.id });
});

app.post('/api/auth/link-qr', async (req, res) => {
  const { userId, propertyId, qrImage, paymentChoice, propertyType } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  // Check if propertyId is already linked to someone else
  const existingProp = properties.find(p => p.id === propertyId);
  // Bloqueia APENAS se a placa tem um dono DIFERENTE do usuário atual
  if (existingProp && existingProp.adminEmail && existingProp.adminEmail.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(400).json({ error: 'Esta placa já está vinculada a outro administrador. Contate o suporte se for sua placa.' });
  }

  user.scannedPropertyId = propertyId;
  if (qrImage) user.qrImage = qrImage;
  if (paymentChoice) user.paymentChoice = paymentChoice; // 'trial' | 'annual'
  user.status = 'pending'; // Exige aprovação manual do administrador
  user.role = 'manager'; // Mantém o papel de manager, mas pendente de liberação
  
  // Create property automatically
  if (!existingProp) {
    const clientCode = generateAccessCode();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const url = `${frontendUrl}/chamada/${propertyId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url, { width: 500 });

    const trialDays = 15;
    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + trialDays);

    const isCollective = propertyType === 'collective';

    const prop = {
      id: propertyId,
      type: isCollective ? 'collective' : 'individual',
      name: isCollective ? `Condomínio de ${user.name}` : `Propriedade de ${user.name}`,
      adminEmail: user.email,
      adminPassword: user.password,
      clientName: user.name,
      clientPhone: user.whatsapp,
      clientCode,
      doormanCode: null,
      units: isCollective ? [] : [{ id: uuidv4(), name: 'Principal', accessCode: clientCode }],
      qrCodeUrl: qrCodeDataUrl,
      url,
      createdAt: new Date().toISOString(),
      nextPaymentDate: nextPaymentDate.toISOString(),
      plan: 'Trial', // Vai mudar para 'Anual' após pagamento Asaas
      hasGateFeature: false, // Default: disabled
      featureNeighborChat: isCollective ? true : false,
      asaasCustomerId: null
    };
    properties.push(prop);
    saveDb();
  } else {
    // Link existing prop to this user if it was orphaned or just updating
    existingProp.adminEmail = user.email;
    existingProp.adminPassword = user.password;
    existingProp.clientName = user.name;
    existingProp.clientPhone = user.whatsapp;
    saveDb();
  }

  saveUsers();
  
  // Automate PDF Generation and Contract Message
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const contract = await PdfService.generateContract(user, paymentChoice || 'trial');
    const fullContractUrl = `${backendUrl}${contract.url}`;
    
    WhatsAppService.sendContractMessage(user, paymentChoice || 'trial', fullContractUrl).catch(err => console.error('Error sending contract message:', err));
  } catch(error) {
    console.error('Error generating contract:', error);
  }

  const targetProp = existingProp || properties.find(p => p.id === propertyId);
  let unitId = null;
  let accessCode = null;
  if (targetProp && targetProp.type === 'individual' && targetProp.units && targetProp.units.length > 0) {
    unitId = targetProp.units[0].id;
    accessCode = targetProp.units[0].accessCode;
  }

  res.json({ success: true, message: 'Placa vinculada com sucesso! Você já pode acessar seu painel.', propertyId, role: user.role, propertyType: targetProp ? targetProp.type : 'individual', unitId, accessCode });
});

// ─── Master Admin User Management Endpoints ──────────────────────────────────

// Retorna TODOS os usuários registrados (não só pending)
app.get('/api/admin/all-users', (req, res) => {
  const { adminEmail } = req.query;
  if (adminEmail !== MASTER_ADMIN_EMAIL) return res.status(403).json({ error: 'Unauthorized' });
  
  // Enriquecer cada user com dados da propriedade vinculada
  const enriched = users.map(u => {
    const prop = properties.find(p => p.adminEmail?.toLowerCase() === u.email.toLowerCase());
    return {
      ...u,
      property: prop ? {
        id: prop.id,
        name: prop.name,
        type: prop.type,
        unitsCount: prop.units?.length || 0,
        clientCode: prop.clientCode,
        doormanCode: prop.doormanCode
      } : null
    };
  });
  
  res.json(enriched);
});

// Manter compatibilidade com endpoint antigo - agora filtra quem tem ID de placa mas não é gestor ainda
app.get('/api/admin/pending-users', (req, res) => {
  const { adminEmail } = req.query;
  if (adminEmail !== MASTER_ADMIN_EMAIL) return res.status(403).json({ error: 'Unauthorized' });
  const pending = users.filter(u => u.role === 'user' && u.scannedPropertyId);
  res.json(pending);
});

app.post('/api/admin/authorize-user', async (req, res) => {
  const { adminEmail, userId, action, propertyType } = req.body; // action: 'approve' | 'deny' | 'promote' | 'demote'
  if (adminEmail !== MASTER_ADMIN_EMAIL) return res.status(403).json({ error: 'Unauthorized' });

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  if (action === 'deny') {
    user.status = 'denied';
    saveUsers();
    return res.json({ success: true, message: 'Usuário recusado.' });
  }

  if (action === 'demote') {
    user.role = 'user';
    // Se era manager, talvez queiramos mudar o tipo da propriedade para individual?
    const prop = properties.find(p => p.adminEmail?.toLowerCase() === user.email.toLowerCase());
    if (prop) prop.type = 'individual';
    saveUsers();
    saveDb();
    return res.json({ success: true, message: 'Usuário rebaixado para usuário comum.' });
  }

  if (action === 'toggleGate') {
    const prop = properties.find(p => p.adminEmail?.toLowerCase() === user.email.toLowerCase());
    if (prop) {
      prop.hasGateFeature = !prop.hasGateFeature;
      saveDb();
      return res.json({ success: true, message: prop.hasGateFeature ? 'Abertura de portão ativada.' : 'Abertura de portão desativada.' });
    }
    return res.status(404).json({ error: 'Propriedade não encontrada.' });
  }

  if (action === 'promote' || action === 'approve') {
    user.role = 'manager'; 
    user.status = 'approved';
    const prop = properties.find(p => p.adminEmail?.toLowerCase() === user.email.toLowerCase());
    if (prop) {
      prop.type = propertyType || 'condo';
      if (prop.type !== 'individual' && !prop.doormanCode) {
        prop.doormanCode = generateAccessCode();
      }
    }
    saveUsers();
    saveDb();
    return res.json({ success: true, message: 'Usuário promovido a gestor de condomínio.' });
  }

  user.status = 'approved';
  saveUsers();
  res.json({ success: true, message: 'Usuário atualizado.' });
});

// ─── Doorman Auth Route ──────────────────────────────────────────────────────
app.post('/api/doorman/login', (req, res) => {
  const { email, doormanCode } = req.body;
  const prop = properties.find(p => p.doormanEmail === email && p.doormanCode === doormanCode);
  if (!prop) return res.status(401).json({ error: 'Credenciais do porteiro inválidas.' });
  res.json({ success: true, propertyId: prop.id, propertyName: prop.name });
});

// ─── Properties Routes ───────────────────────────────────────────────────────
app.post('/api/properties', async (req, res) => {
  const { type, name, units, adminEmail, adminPassword, id, clientName, clientPhone, clientDocument, clientAddress, doormanEmail, companyName, plan, customPrice } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Nenhum ID de QR Code foi fornecido. O cadastro exige um escaneamento prévio.' });
  }

  // Ensure ID is unique
  if (properties.some(p => p.id === id)) {
    return res.status(400).json({ error: 'Este QR Code / ID já está em uso por outro cliente.' });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${frontendUrl}/chamada/${id}`;

  const qrCodeDataUrl = await QRCode.toDataURL(url, {
    width: 500,
    margin: 2,
    color: { dark: '#000', light: '#FFF' }
  });

  const existingIndex = properties.findIndex(p => p.id === id);
  const isCollective = type === 'village' || type === 'condo' || type === 'collective';
  
  const nextPaymentDate = new Date();
  const trialDays = (type === 'house' || type === 'individual') ? 15 : 30;
  nextPaymentDate.setDate(nextPaymentDate.getDate() + trialDays);

  const clientCode = existingIndex > -1 ? properties[existingIndex].clientCode : generateAccessCode();
  const doormanCode = isCollective ? (existingIndex > -1 && properties[existingIndex].doormanCode ? properties[existingIndex].doormanCode : generateAccessCode()) : null;

  const property = {
    id,
    type: type || 'house',
    name: name || 'Nova Propriedade',
    clientName: clientName || '',
    clientPhone: clientPhone || '',
    clientDocument: clientDocument || '',
    clientAddress: clientAddress || '',
    companyName: companyName || '',
    plan: plan || 'PRO',
    clientCode,
    doormanCode,
    doormanEmail: doormanEmail || null,
    customPrice: customPrice !== undefined ? (customPrice === '' || customPrice === null ? null : Number(customPrice)) : null,
    units: isCollective
      ? (units && units.length > 0 ? units.map(u => ({
          id: uuidv4(),
          name: u.name,
          block: u.block || '',
          street: u.street || '',
          number: u.number || '',
          accessCode: generateAccessCode()
        })) : [])
      : [{ id: uuidv4(), name: 'Principal', block: '', street: '', number: '', accessCode: clientCode }], // Use clientCode as accessCode for single units
    qrCodeUrl: qrCodeDataUrl,
    url,
    adminEmail: adminEmail || null,
    adminPassword: adminPassword || null,
    createdAt: existingIndex > -1 ? properties[existingIndex].createdAt : new Date().toISOString(),
    nextPaymentDate: existingIndex > -1 ? properties[existingIndex].nextPaymentDate : nextPaymentDate.toISOString()
  };

  if (existingIndex > -1) {
    // Preserve existing password if not updated
    if (properties[existingIndex].adminPassword && !adminPassword) {
      property.adminPassword = properties[existingIndex].adminPassword;
    }
    properties[existingIndex] = property;
  } else {
    properties.push(property);
  }

  saveDb();
  res.status(201).json(property);
});

app.get('/api/properties', (req, res) => {
  const { email } = req.query;
  
  // Master Admin always sees everything
  if (email === MASTER_ADMIN_EMAIL) {
    return res.json(properties);
  }

  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  // Filter by adminEmail OR doormanEmail
  const filtered = properties.filter(p => p.adminEmail === email || p.doormanEmail === email);
  res.json(filtered);
});

app.get('/api/properties/:id', (req, res) => {
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  res.json(prop);
});

app.get('/api/properties/:id/units', (req, res) => {
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  // Return unit list with names, IDs, and address info
  res.json(prop.units.map(u => ({ id: u.id, name: u.name, block: u.block || '', street: u.street || '', number: u.number || '' })));
});

app.delete('/api/properties/:id', (req, res) => {
  const { adminEmail } = req.query;
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  
  // Isolamento: Apenas o dono ou Master Admin pode deletar
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Unauthorized to delete this property' });
  }

  properties = properties.filter(p => p.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

// Editar dados do cliente/propriedade (Master Admin ou Admin)
app.put('/api/properties/:id', (req, res) => {
  const { adminEmail, clientName, clientPhone, clientDocument, clientAddress, companyName, plan, name, customPrice } = req.body;
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Unauthorized to edit this property' });
  }

  if (clientName !== undefined) prop.clientName = clientName;
  if (clientPhone !== undefined) prop.clientPhone = clientPhone;
  if (clientDocument !== undefined) prop.clientDocument = clientDocument;
  if (clientAddress !== undefined) prop.clientAddress = clientAddress;
  if (companyName !== undefined) prop.companyName = companyName;
  if (plan !== undefined) prop.plan = plan;
  if (name !== undefined) prop.name = name;
  if (customPrice !== undefined) prop.customPrice = customPrice === '' || customPrice === null ? null : Number(customPrice);

  saveDb();
  res.json(prop);
});

// Liberar mais 15 dias de teste
app.post('/api/properties/:id/extend-trial', (req, res) => {
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const currentPaymentDate = new Date(prop.nextPaymentDate);
  const now = new Date();
  
  // Se já venceu, começa a contar de hoje. Se não venceu, adiciona ao final.
  const baseDate = currentPaymentDate > now ? currentPaymentDate : now;
  baseDate.setDate(baseDate.getDate() + 15);
  
  prop.nextPaymentDate = baseDate.toISOString();
  saveDb();
  res.json({ success: true, nextPaymentDate: prop.nextPaymentDate });
});

// Ativar acesso anual (12 meses) após pagamento
app.post('/api/properties/:id/activate-annual', (req, res) => {
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const currentPaymentDate = new Date(prop.nextPaymentDate);
  const now = new Date();
  
  // Se já venceu, começa a contar de hoje. Se não venceu, adiciona ao final.
  const baseDate = currentPaymentDate > now ? currentPaymentDate : now;
  baseDate.setFullYear(baseDate.getFullYear() + 1);
  
  prop.nextPaymentDate = baseDate.toISOString();
  prop.plan = 'Anual';
  saveDb();
  res.json({ success: true, nextPaymentDate: prop.nextPaymentDate });
});

// Atualizar Configuração de WhatsApp do Condomínio
app.put('/api/properties/:id/whatsapp-config', (req, res) => {
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  
  const { instance, token, supportPhone } = req.body;
  prop.whatsappConfig = { instance, token, supportPhone };
  
  saveDb();
  res.json({ success: true, whatsappConfig: prop.whatsappConfig });
});

// Obter número de suporte público de uma propriedade
app.get('/api/properties/:id/support', (req, res) => {
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Not found' });
  
  if (prop.type === 'condo' || prop.type === 'village') {
    res.json({ supportPhone: prop.whatsappConfig?.supportPhone || '' });
  } else {
    res.json({ supportPhone: '5521995879170' });
  }
});

// ─── INTEGRAÇÃO ASAAS (PAGAMENTO E WEBHOOK) ────────────────────────────────────────────────

// Webhook para receber confirmação de pagamento do Asaas
app.post('/api/webhook/asaas', async (req, res) => {
  const event = req.body.event;
  const payment = req.body.payment;

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const propertyId = payment.externalReference;
    const prop = properties.find(p => p.id === propertyId);

    if (prop) {
      console.log(`Pagamento confirmado para propriedade ${propertyId}`);
      // Renovar plano por 1 ano a partir de hoje (ou da data atual se ainda for no futuro)
      const now = new Date();
      const currentNext = new Date(prop.nextPaymentDate);
      const baseDate = (currentNext > now) ? currentNext : now;
      baseDate.setFullYear(baseDate.getFullYear() + 1);

      prop.nextPaymentDate = baseDate.toISOString();
      prop.plan = 'Anual';
      saveDb();

      // Enviar mensagem de boas-vindas / confirmação
      try {
        const user = users.find(u => u.email === prop.adminEmail);
        if (user) {
          await WhatsAppService.sendWelcomeMessage(user);
        }
      } catch (e) {
        console.error('Erro ao enviar whatsapp de confirmacao de pagamento', e);
      }
    }
  }

  res.status(200).send('OK');
});


const saveSupport = saveSupportTickets;

app.get('/api/support', (req, res) => {
  const { email, role, propertyId } = req.query;

  if (email === MASTER_ADMIN_EMAIL) {
    return res.json(supportTickets);
  }

  if (role === 'manager') {
    const managerProp = properties.find(p => p.adminEmail === email);
    const propId = managerProp ? managerProp.id : null;
    const visibleTickets = supportTickets.filter(t => 
       t.email === email || (propId && t.propertyId === propId && t.role === 'resident')
    );
    return res.json(visibleTickets);
  }

  if (role === 'resident') {
    const visibleTickets = supportTickets.filter(t => t.propertyId === propertyId && t.unitId === req.query.unitId);
    return res.json(visibleTickets);
  }

  res.json([]);
});

app.post('/api/support', (req, res) => {
  const { email, role, propertyId, unitId, title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Campos inválidos' });
  
  const ticket = {
    id: uuidv4(),
    email: email || null,
    unitId: unitId || null,
    role: role || 'admin', 
    propertyId: propertyId || null,
    title,
    message,
    status: 'open',
    createdAt: new Date().toISOString(),
    replies: []
  };
  supportTickets.push(ticket);
  saveSupport();
  res.status(201).json({ success: true, ticket });
});

app.post('/api/support/:id/reply', (req, res) => {
  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
  
  ticket.replies.push({
    id: uuidv4(),
    sender: req.body.sender || 'Admin',
    message: req.body.message,
    createdAt: new Date().toISOString()
  });
  saveSupport();
  res.json({ success: true, ticket });
});

// ─── Unit Management Routes (Admin Panel do Condomínio) ───────────────────────

// Adicionar nova unidade a uma propriedade
app.post('/api/properties/:id/units', (req, res) => {
  const { adminEmail } = req.body;
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  // Verificação de permissão
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Sem permissão para editar esta propriedade.' });
  }

  const { name, block, street, number } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome da unidade é obrigatório.' });

  const newUnit = {
    id: uuidv4(),
    name: name.trim(),
    block: (block || '').trim(),
    street: (street || '').trim(),
    number: (number || '').trim(),
    accessCode: generateAccessCode()
  };

  prop.units.push(newUnit);
  saveDb();
  res.status(201).json(newUnit);
});

// Editar unidade existente
app.put('/api/properties/:propId/units/:unitId', (req, res) => {
  const { adminEmail, name, block, street, number } = req.body;
  const prop = properties.find(p => p.id === req.params.propId);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Sem permissão para editar esta propriedade.' });
  }

  const unit = prop.units.find(u => u.id === req.params.unitId);
  if (!unit) return res.status(404).json({ error: 'Unidade não encontrada.' });

  if (name !== undefined) unit.name = name.trim();
  if (block !== undefined) unit.block = block.trim();
  if (street !== undefined) unit.street = street.trim();
  if (number !== undefined) unit.number = number.trim();

  saveDb();
  res.json(unit);
});

// Deletar unidade
app.delete('/api/properties/:propId/units/:unitId', (req, res) => {
  const { adminEmail } = req.query;
  const prop = properties.find(p => p.id === req.params.propId);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Sem permissão para editar esta propriedade.' });
  }

  const unitIndex = prop.units.findIndex(u => u.id === req.params.unitId);
  if (unitIndex === -1) return res.status(404).json({ error: 'Unidade não encontrada.' });

  prop.units.splice(unitIndex, 1);
  saveDb();
  res.json({ success: true });
});

// ─── Gerenciar Porteiro ───────────────────────────────────────────────────────
app.put('/api/properties/:id/doorman', (req, res) => {
  const { adminEmail, doormanEmail } = req.body;
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  prop.doormanEmail = doormanEmail || null;
  // Gera código de porteiro se não existir e email foi fornecido
  if (doormanEmail && !prop.doormanCode) {
    prop.doormanCode = generateAccessCode();
  }
  // Remove código se email foi removido
  if (!doormanEmail) {
    prop.doormanCode = null;
  }

  saveDb();
  res.json({ success: true, doormanCode: prop.doormanCode, doormanEmail: prop.doormanEmail });
});

// ─── Regenerar código de acesso (bloqueia morador atual) ──────────────────────
app.post('/api/properties/:propId/units/:unitId/regenerate-code', (req, res) => {
  const { adminEmail } = req.body;
  const prop = properties.find(p => p.id === req.params.propId);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  const unit = prop.units.find(u => u.id === req.params.unitId);
  if (!unit) return res.status(404).json({ error: 'Unidade não encontrada.' });

  unit.accessCode = generateAccessCode();
  saveDb();
  res.json({ success: true, newCode: unit.accessCode });
});

// ─── Disparo de Mensagem em Massa pelo WhatsApp (Para Moradores) ─────────────
app.post('/api/properties/:propId/mass-invite', async (req, res) => {
  const { adminEmail } = req.body;
  const prop = properties.find(p => p.id === req.params.propId);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  if (!prop.whatsappConfig || !prop.whatsappConfig.instance || !prop.whatsappConfig.token) {
    return res.status(400).json({ error: 'Configuração de WhatsApp do condomínio ausente. Acesse as configurações para cadastrar sua instância e token.' });
  }

  let sentCount = 0;
  for (const unit of prop.units) {
    if (unit.whatsapp) {
      // Formata mensagem usando o nome do condomínio
      const messageBody = `Olá! O gestor do condomínio *${prop.name || 'Campainha Digital'}* configurou o seu interfone digital.\n\nSua Unidade: ${unit.name}\nSeu Código de Acesso: *${unit.accessCode}*\n\nAcesse agora: ${process.env.FRONTEND_URL || 'https://campainha-digital.com'}/morador-login`;
      
      try {
        // Usa as credenciais do gestor (prop.whatsappConfig.instance / token)
        console.log(`Enviando via Instância ${prop.whatsappConfig.instance}...`);
        await whatsappService.simulateWhatsAppApiCall(unit.whatsapp, messageBody);
        sentCount++;
      } catch (err) {
        console.error(`Falha ao enviar WhatsApp para ${unit.whatsapp}:`, err);
      }
    }
  }

  res.json({ success: true, message: `Convites enviados para ${sentCount} moradores via WhatsApp.` });
});

// Salvar configurações de Não Perturbe (DND)
app.post('/api/properties/:propId/units/:unitId/dnd', (req, res) => {
  const { dndSettings } = req.body;
  const prop = properties.find(p => p.id === req.params.propId);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  const unit = prop.units.find(u => u.id === req.params.unitId);
  if (!unit) return res.status(404).json({ error: 'Unidade não encontrada.' });

  unit.dndSettings = dndSettings;
  saveDb();
  res.json({ success: true });
});

// ─── Buscar vizinho por endereço (bloco/rua + número) ─────────────────────────
app.get('/api/properties/:id/search-unit', (req, res) => {
  const { block, street, number } = req.query;
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });

  // Busca por combinação de bloco/rua + número
  const results = prop.units.filter(u => {
    const matchBlock = block ? (u.block || '').toLowerCase().includes(block.toLowerCase()) : true;
    const matchStreet = street ? (u.street || '').toLowerCase().includes(street.toLowerCase()) : true;
    const matchNumber = number ? (u.number || '').toLowerCase() === number.toLowerCase() : true;
    
    // Precisa ter pelo menos bloco ou rua + número para ser encontrado
    const hasAddress = (u.block || u.street) && u.number;
    if (!hasAddress) return false;
    
    return matchBlock && matchStreet && matchNumber;
  });

  if (results.length === 0) {
    return res.status(404).json({ error: 'Nenhuma unidade encontrada com esse endereço. Verifique se os dados estão cadastrados.' });
  }

  res.json(results.map(u => ({ id: u.id, name: u.name, block: u.block || '', street: u.street || '', number: u.number || '' })));
});

// ─── Mensagens do Condomínio (Broadcast) ──────────────────────────────────────

// Enviar mensagem para todos os moradores de uma propriedade
app.post('/api/properties/:id/broadcast', (req, res) => {
  const { adminEmail, title, body, priority } = req.body;
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });
  
  if (adminEmail !== MASTER_ADMIN_EMAIL && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Sem permissão para enviar mensagens.' });
  }

  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'O corpo da mensagem é obrigatório.' });
  }

  const message = {
    id: uuidv4(),
    propertyId: prop.id,
    propertyName: prop.name,
    title: (title || 'Aviso do Condomínio').trim(),
    body: body.trim(),
    priority: priority || 'normal', // normal | urgent
    senderEmail: adminEmail,
    createdAt: new Date().toISOString(),
    readBy: []
  };

  messages.push(message);
  if (messages.length > 1000) messages = messages.slice(-1000);
  saveMessages();

  // Emitir via WebSocket para todos os moradores da propriedade
  prop.units.forEach(unit => {
    io.to(`unit_${unit.id}`).emit('broadcast_message', {
      id: message.id,
      title: message.title,
      body: message.body,
      priority: message.priority,
      propertyName: prop.name,
      createdAt: message.createdAt
    });
  });

  res.status(201).json(message);
});

// Buscar mensagens de uma propriedade
app.get('/api/properties/:id/messages', (req, res) => {
  const prop = properties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Propriedade não encontrada.' });

  const propMessages = messages
    .filter(m => m.propertyId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);

  res.json(propMessages);
});

// Marcar mensagem como lida
app.post('/api/messages/:msgId/read', (req, res) => {
  const { unitId } = req.body;
  const msg = messages.find(m => m.id === req.params.msgId);
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada.' });
  
  if (!msg.readBy.includes(unitId)) {
    msg.readBy.push(unitId);
    saveMessages();
  }
  res.json({ success: true });
});

// ─── Visitor History Routes ───────────────────────────────────────────────────
// Retorna histórico por unitId - Apenas para moradores daquela unidade
app.get('/api/visitors/:unitId', (req, res) => {
  const { propertyId } = req.query; // Validamos o propertyId para garantir isolamento
  
  const unitVisitors = visitors
    .filter(v => v.unitId === req.params.unitId && (!propertyId || v.propertyId === propertyId))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 100);
  res.json(unitVisitors);
});

// Retorna histórico por propertyId (todos as unidades) - Apenas para o admin da propriedade
app.get('/api/visitors/property/:propertyId', (req, res) => {
  const { adminEmail } = req.query;
  
  // Validação de propriedade e admin
  const prop = properties.find(p => p.id === req.params.propertyId);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  
  // Se adminEmail for fornecido, verificamos se ele é o dono (Isolamento)
  if (adminEmail && prop.adminEmail !== adminEmail) {
    return res.status(403).json({ error: 'Unauthorized access to this property history' });
  }
  
  const propVisitors = visitors
    .filter(v => v.propertyId === req.params.propertyId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 200);
  res.json(propVisitors);
});

// ─── Resident Auth Routes ─────────────────────────────────────────────────────
app.post('/api/resident/register', (req, res) => {
  const { email, accessCode } = req.body;
  if (!email || !accessCode)
    return res.status(400).json({ error: 'E-mail e código de acesso são obrigatórios.' });

  let foundUnit = null, foundProperty = null;
  for (const prop of properties) {
    const unit = prop.units.find(u => u.accessCode === accessCode.trim().toUpperCase());
    if (unit) { foundUnit = unit; foundProperty = prop; break; }
  }
  if (!foundUnit) return res.status(404).json({ error: 'Código de acesso inválido.' });

  const existing = residents.find(r => r.email === email && r.unitId === foundUnit.id);
  if (existing)
    return res.json({ unitId: foundUnit.id, unitName: foundUnit.name, propertyName: foundProperty.name, propertyId: foundProperty.id, message: 'Já registrado.' });

  residents.push({
    email, unitId: foundUnit.id, unitName: foundUnit.name,
    propertyId: foundProperty.id, propertyName: foundProperty.name,
    createdAt: new Date().toISOString()
  });
  saveResidents();
  res.status(201).json({ unitId: foundUnit.id, unitName: foundUnit.name, propertyName: foundProperty.name, propertyId: foundProperty.id });
});

app.post('/api/resident/login', (req, res) => {
  const { email, accessCode } = req.body;
  if (!email || !accessCode)
    return res.status(400).json({ error: 'E-mail e código de acesso são obrigatórios.' });

  let foundUnit = null, foundProperty = null;
  for (const prop of properties) {
    const unit = prop.units.find(u => u.accessCode === accessCode.trim().toUpperCase());
    if (unit) { foundUnit = unit; foundProperty = prop; break; }
  }
  if (!foundUnit) return res.status(401).json({ error: 'Código de acesso inválido.' });

  const existing = residents.find(r => r.email === email && r.unitId === foundUnit.id);
  if (!existing) {
    residents.push({
      email, unitId: foundUnit.id, unitName: foundUnit.name,
      propertyId: foundProperty.id, propertyName: foundProperty.name,
      createdAt: new Date().toISOString()
    });
    saveResidents();
  }
  res.json({ unitId: foundUnit.id, unitName: foundUnit.name, propertyName: foundProperty.name, propertyId: foundProperty.id });
});

app.post('/api/resident/login-by-code', (req, res) => {
  const { accessCode } = req.body;
  if (!accessCode) return res.status(400).json({ error: 'Código de acesso é obrigatório.' });

  const code = accessCode.trim().toUpperCase();

  // 1. Check if it's a doorman code first
  const doormanProp = properties.find(p => p.doormanCode === code);
  if (doormanProp) {
    return res.json({
      role: 'doorman',
      propertyId: doormanProp.id,
      propertyName: doormanProp.name
    });
  }

  // 2. Check if it's a resident unit code
  let foundUnit = null, foundProperty = null;
  for (const prop of properties) {
    const unit = prop.units.find(u => u.accessCode === code);
    if (unit) { foundUnit = unit; foundProperty = prop; break; }
  }

  if (!foundUnit) return res.status(401).json({ error: 'Código de acesso inválido. Verifique com o síndico/proprietário.' });

  res.json({
    role: 'resident',
    unitId: foundUnit.id,
    unitName: foundUnit.name,
    propertyName: foundProperty.name,
    propertyId: foundProperty.id,
    propertyType: foundProperty.type,
    hasGateFeature: foundProperty.hasGateFeature || false,
    featureNeighborChat: foundProperty.featureNeighborChat || false
  });
});

const residentSockets = new Map();
const doormanSockets = new Map();

io.on('connection', (socket) => {
  console.log('[WS] conectado:', socket.id);

  socket.on('register_doorman', ({ propertyId }) => {
    socket.join(`doorman_${propertyId}`);
    if (!doormanSockets.has(propertyId)) doormanSockets.set(propertyId, new Set());
    doormanSockets.get(propertyId).add(socket.id);
    console.log(`[WS] Porteiro ${socket.id} → property_${propertyId}`);
  });

  socket.on('register_resident', ({ unitId }) => {
    socket.join(`unit_${unitId}`);
    if (!residentSockets.has(unitId)) residentSockets.set(unitId, new Set());
    residentSockets.get(unitId).add(socket.id);
    console.log(`[WS] Morador ${socket.id} → unit_${unitId}`);
  });

  socket.on('initiate_call', ({ unitId, propertyId, photoBase64, callerName }) => {
    console.log(`[WS] Chamada para unit_${unitId} na prop_${propertyId} de ${socket.id} (${callerName || 'visitante'})`);

    // Check for DND (Do Not Disturb)
    const prop = properties.find(p => p.id === propertyId);
    if (prop) {
      const unit = prop.units.find(u => u.id === unitId);
      if (unit && unit.dndSettings && unit.dndSettings.enabled) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = unit.dndSettings.start.split(':').map(Number);
        const [endH, endM] = unit.dndSettings.end.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        let isDnd = false;
        if (startMins <= endMins) {
          if (currentMins >= startMins && currentMins <= endMins) isDnd = true;
        } else {
          // Overlap midnight
          if (currentMins >= startMins || currentMins <= endMins) isDnd = true;
        }

        if (isDnd) {
          console.log(`[WS] Chamada bloqueada por DND para unit_${unitId}`);
          socket.emit('call_blocked_dnd', { message: 'O morador configurou para não receber chamadas neste horário.' });
          return;
        }
      }
    }

    const visit = {
      id: uuidv4(),
      unitId,
      propertyId,
      visitorSocketId: socket.id,
      photo: photoBase64 || null,
      callerName: callerName || 'Visitante',
      timestamp: new Date().toISOString()
    };
    visitors.push(visit);
    if (visitors.length > 500) visitors = visitors.slice(-500);
    saveVisitors();

    io.to(`unit_${unitId}`).emit('incoming_call', {
      visitorSocketId: socket.id,
      photo: photoBase64,
      callerName: callerName || 'Visitante',
      timestamp: visit.timestamp,
      visitId: visit.id,
      propertyId
    });

    // Enviar notificação push para acordar o celular em background
    const unitSubs = subscriptions.filter(s => s.unitId === unitId);
    if (unitSubs.length > 0) {
      const payload = JSON.stringify({
        title: '🔔 Campainha Digital',
        body: `Visitante na portaria aguardando!`,
        url: `/morador/${unitId}`
      });
      unitSubs.forEach(sub => {
        webPush.sendNotification(sub.subscription, payload).catch(err => {
          console.error('[WebPush] Falha ao enviar:', err.message);
        });
      });
    }
  });

  socket.on('answer_call', ({ visitorSocketId, mode, unitId }) => {
    io.to(visitorSocketId).emit('call_answered', {
      residentSocketId: socket.id,
      mode,
      unitId
    });
  });

  socket.on('webrtc_offer', ({ target, offer }) => {
    io.to(target).emit('webrtc_offer', { sender: socket.id, offer });
  });

  socket.on('webrtc_answer', ({ target, answer }) => {
    io.to(target).emit('webrtc_answer', { sender: socket.id, answer });
  });

  socket.on('webrtc_ready', ({ target }) => {
    io.to(target).emit('webrtc_ready', { residentSocketId: socket.id });
  });

  socket.on('webrtc_ice_candidate', ({ target, candidate }) => {
    io.to(target).emit('webrtc_ice_candidate', { sender: socket.id, candidate });
  });

  socket.on('call_ended', ({ target }) => {
    if (target) io.to(target).emit('call_ended');
  });

  socket.on('send_quick_message', ({ target, message }) => {
    if (target) io.to(target).emit('quick_message', { message });
  });

  // Porteiro envia mensagem de texto para uma unidade específica
  socket.on('doorman_message', ({ unitId, propertyId, message, senderName }) => {
    if (!unitId || !message) return;
    console.log(`[WS] Porteiro → unit_${unitId}: ${message}`);
    io.to(`unit_${unitId}`).emit('doorman_message', {
      message,
      senderName: senderName || 'Portaria',
      propertyId,
      timestamp: new Date().toISOString()
    });
  });

  // Porteiro inicia chamada (interfone) para uma unidade
  socket.on('doorman_call', ({ unitId, propertyId, callerName }) => {
    if (!unitId) return;
    console.log(`[WS] Porteiro chamando unit_${unitId}`);

    // Check for DND
    const prop = properties.find(p => p.id === propertyId);
    if (prop) {
      const unit = prop.units.find(u => u.id === unitId);
      if (unit && unit.dndSettings && unit.dndSettings.enabled) {
        // ... (DND logic same as above, could refactor into helper)
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = unit.dndSettings.start.split(':').map(Number);
        const [endH, endM] = unit.dndSettings.end.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        let isDnd = false;
        if (startMins <= endMins) {
          if (currentMins >= startMins && currentMins <= endMins) isDnd = true;
        } else {
          if (currentMins >= startMins || currentMins <= endMins) isDnd = true;
        }

        if (isDnd) {
          socket.emit('call_blocked_dnd', { message: 'O morador está em modo Não Perturbe.' });
          return;
        }
      }
    }

    io.to(`unit_${unitId}`).emit('incoming_call', {
      visitorSocketId: socket.id,
      photo: null,
      callerName: callerName || 'Portaria',
      timestamp: new Date().toISOString(),
      visitId: uuidv4(),
      propertyId,
      fromDoorman: true
    });

    const unitSubs = subscriptions.filter(s => s.unitId === unitId);
    if (unitSubs.length > 0) {
      const payload = JSON.stringify({
        title: '📞 Chamada da Portaria',
        body: `A portaria está interfonando!`,
        url: `/morador/${unitId}`
      });
      unitSubs.forEach(sub => {
        webPush.sendNotification(sub.subscription, payload).catch(err => {
          console.error('[WebPush] Falha ao enviar:', err.message);
        });
      });
    }
  });

  // Morador envia mensagem para a portaria
  socket.on('resident_message_doorman', ({ propertyId, unitId, message, senderName, authorizeEntry }) => {
    if (!propertyId || !message) return;
    console.log(`[WS] Morador → doorman_${propertyId}: ${message} (Auth: ${!!authorizeEntry})`);
    io.to(`doorman_${propertyId}`).emit('resident_message', {
      message,
      senderName: senderName || 'Morador',
      unitId,
      authorizeEntry: !!authorizeEntry,
      timestamp: new Date().toISOString()
    });
  });

  // Morador inicia chamada para a portaria
  socket.on('resident_call_doorman', ({ propertyId, unitId, callerName }) => {
    if (!propertyId) return;
    console.log(`[WS] Morador ${unitId} chamando doorman_${propertyId}`);
    
    // Find unit info to provide context to doorman
    const prop = properties.find(p => p.id === propertyId);
    let unitInfo = { name: callerName || 'Morador' };
    if (prop) {
      const unit = prop.units.find(u => u.id === unitId);
      if (unit) {
        unitInfo = { ...unit };
      }
    }

    io.to(`doorman_${propertyId}`).emit('incoming_resident_call', {
      residentSocketId: socket.id,
      unitId,
      callerName: unitInfo.name,
      unitDetails: unitInfo,
      timestamp: new Date().toISOString()
    });
  });


  socket.on('authorize_entry', ({ unitId, propertyId, visitorId }) => {
    // Notify the doorman that entry was authorized by the resident
    io.to(`doorman_${propertyId}`).emit('entry_authorized', { unitId, visitorId, timestamp: new Date().toISOString() });
    
    // Notify the visitor as well
    if (visitorId) {
      io.to(visitorId).emit('entry_authorized', { unitId, timestamp: new Date().toISOString() });
    }
  });

  socket.on('disconnect', () => {
    residentSockets.forEach((sockets, unitId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) residentSockets.delete(unitId);
    });
    doormanSockets.forEach((sockets, propId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) doormanSockets.delete(propId);
    });
  });
});

const cron = require('node-cron');

// ─── CRONJOB: Verificação de Teste (Trial) Expirado ──────────────────────────
// Roda todos os dias às 00:00
cron.schedule('0 0 * * *', () => {
  console.log('[CRON] Verificando vencimento de planos de teste (Trial)...');
  const now = new Date();
  let updated = false;

  properties.forEach(prop => {
    if (prop.plan === 'Trial' && prop.nextPaymentDate) {
      const expirationDate = new Date(prop.nextPaymentDate);
      if (now > expirationDate) {
        prop.status = 'suspended';
        prop.plan = 'Expired';
        console.log(`[CRON] Propriedade ${prop.name} (ID: ${prop.id}) expirada. Acesso suspenso.`);
        updated = true;
      }
    }
  });

  if (updated) {
    saveDb();
    console.log('[CRON] Banco de dados atualizado com suspensões.');
  } else {
    console.log('[CRON] Nenhuma propriedade expirada encontrada hoje.');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
