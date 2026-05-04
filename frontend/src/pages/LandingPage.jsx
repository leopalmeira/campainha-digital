import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, EyeOff, Globe2, Camera, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const vantagens = [
    {
      icon: <Zap size={32} color="var(--accent-cyan)" />,
      title: "Instalação Sem Fios",
      desc: "Zero obras, zero cabos. Fixe a placa QR Code na parede e seu sistema já está funcionando."
    },
    {
      icon: <EyeOff size={32} color="var(--accent-cyan)" />,
      title: "Monitoramento Oculto",
      desc: "Veja quem está na porta em tempo real sem que o visitante saiba que está sendo observado."
    },
    {
      icon: <Globe2 size={32} color="var(--accent-cyan)" />,
      title: "Atendimento Remoto",
      desc: "Atenda sua porta de qualquer lugar do mundo, direto da tela do seu smartphone."
    },
    {
      icon: <Camera size={32} color="var(--accent-cyan)" />,
      title: "Captura Automática",
      desc: "Registramos uma foto silenciosa de cada pessoa que toca a campainha, garantindo sua segurança."
    },
    {
      icon: <ShieldCheck size={32} color="var(--accent-cyan)" />,
      title: "Custo-Benefício Imbatível",
      desc: "Adeus manutenção de interfones. Uma solução moderna, mais barata e infinitamente melhor."
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="https://i.imgur.com/your-logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} onError={(e) => e.target.style.display='none'}/>
            <h2 className="text-gradient" style={{ fontSize: '20px', margin: 0 }}>Campainha-Digital</h2>
          </div>
          <Link to="/admin" style={{ textDecoration: 'none' }}>
            <button className="btn-glass" style={{ padding: '8px 16px', fontSize: '14px' }}>Área do Síndico</button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: -1 }}></div>

        <div className="container" style={{ maxWidth: '800px', zIndex: 1 }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', borderRadius: '100px', color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
            O Futuro da Segurança Residencial
          </div>
          <h1 style={{ fontSize: '48px', lineHeight: 1.2, marginBottom: '24px', letterSpacing: '-1px' }}>
            Atenda sua porta de <span className="text-gradient">Qualquer Lugar</span> do mundo.
          </h1>
          <p className="text-muted" style={{ fontSize: '20px', marginBottom: '40px', lineHeight: 1.6 }}>
            Substitua seu interfone antigo por uma placa inteligente de QR Code. 
            Mais segurança, zero instalação e controle total na palma da sua mão.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/admin" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
                Quero para meu Condomínio <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Vantagens Section */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-darker)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>Por que escolher a <span className="text-gradient">Campainha-Digital?</span></h2>
            <p className="text-muted" style={{ fontSize: '18px' }}>5 motivos que tornam o interfone tradicional coisa do passado.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {vantagens.map((vantagem, index) => (
              <div key={index} className="glass-panel" style={{ padding: '32px', transition: 'transform 0.3s ease', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  {vantagem.icon}
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{vantagem.title}</h3>
                <p className="text-muted" style={{ lineHeight: 1.6 }}>{vantagem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
        <p className="text-muted">© 2026 Campainha-Digital. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
