import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

const FAQ_DATABASE = [
  { keywords: ['senha', 'recuperar', 'esqueci'], answer: 'Para recuperar sua senha, vá até a tela de login e clique em "Esqueci minha senha" para receber um e-mail de recuperação.' },
  { keywords: ['whatsapp', 'configurar', 'zap', 'token'], answer: 'Você pode configurar o WhatsApp de disparo indo no Painel Administrativo, clicando na aba "Configurações" e inserindo sua Instância e Token da Evolution/Z-API.' },
  { keywords: ['placa', 'qr', 'qrcode', 'vincular', 'cadastrar'], answer: 'Para cadastrar uma nova placa QR Code, faça login no painel, clique em "Nova Placa" e escaneie o código com a câmera do seu celular.' },
  { keywords: ['porteiro', 'portaria', 'doorman'], answer: 'O porteiro tem uma visão de painel separada. Você pode cadastrar o e-mail dele dentro da aba "Propriedades" e ele acessará pela tela de login.' },
  { keywords: ['pagamento', 'plano', 'mensalidade', 'valor'], answer: 'Nossos planos incluem um trial gratuito de 15 dias. Após isso, você pode optar pela assinatura Anual. Pagamentos são gerenciados no painel de gestão.' },
  { keywords: ['convidar', 'morador', 'novo', 'adicionar'], answer: 'Vá na aba "Unidades", crie a unidade e o sistema gerará um código de acesso. Se o WhatsApp estiver configurado, você pode enviar o convite em massa!' },
  { keywords: ['suporte', 'ajuda', 'falar com humano', 'atendente'], answer: 'Se precisar de suporte humanizado, você pode abrir um Ticket na aba "Suporte" do seu painel, ou nos contatar via WhatsApp oficial: (21) 99999-9999.' },
  { keywords: ['portão', 'abrir', 'fechadura'], answer: 'A abertura remota de portão é exclusiva para o plano Condomínio. Requer a instalação de um relé WiFi compatível com a plataforma.' },
  { keywords: ['visita', 'historico', 'foto', 'quem tocou'], answer: 'Todas as visitas ficam registradas na aba "Histórico" ou "Atividade" do seu app, com a foto capturada no momento em que a pessoa tocou a campainha.' },
  { keywords: ['vizinho', 'interfone', 'ligar', 'mensagem'], answer: 'Se o condomínio habilitou, você pode ligar ou enviar mensagem para um vizinho na aba "Vizinhos" do app de morador.' },
  { keywords: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite'], answer: 'Olá! Sou a IA da Campainha Digital. Como posso te ajudar hoje?' },
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Olá! Sou a IA de Suporte da Campainha Digital. Em que posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');

    // Simulate AI thinking and responding
    setTimeout(() => {
      const lowerInput = userText.toLowerCase();
      let foundAnswer = null;

      // Simple keyword matching
      for (const item of FAQ_DATABASE) {
        if (item.keywords.some(kw => lowerInput.includes(kw))) {
          foundAnswer = item.answer;
          break;
        }
      }

      if (!foundAnswer) {
        foundAnswer = 'Desculpe, não entendi completamente. Posso ajudar com configurações de placa, WhatsApp, unidades, suporte e planos. Tente usar outras palavras ou acesse a aba "Suporte" para falar com um humano.';
      }

      setMessages(prev => [...prev, { role: 'bot', text: foundAnswer }]);
    }, 600);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--primary)', color: '#FFF',
          border: 'none', cursor: 'pointer', zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.4)',
          display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '350px', height: '500px', maxWidth: 'calc(100vw - 48px)',
          background: '#FFF', borderRadius: '20px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', zIndex: 10000,
          border: '1px solid var(--border-subtle)', overflow: 'hidden',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{ background: '#0F172A', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '50%' }}><Bot size={20} color="#000" /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>IA de Suporte</h3>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Campainha Digital</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                {msg.role === 'bot' && <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={14} color="#000" /></div>}
                
                <div style={{
                  background: msg.role === 'user' ? '#10B981' : '#FFF',
                  color: msg.role === 'user' ? '#FFF' : '#1E293B',
                  padding: '10px 14px', borderRadius: '16px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                  maxWidth: '80%', fontSize: '13px', lineHeight: '1.5',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: msg.role === 'bot' ? '1px solid #E2E8F0' : 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '12px', background: '#FFF', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Digite sua dúvida..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', background: '#F1F5F9' }}
            />
            <button type="submit" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10B981', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
