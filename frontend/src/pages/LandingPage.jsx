import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Zap, Clock, Check, X, ArrowRight, Video } from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', padding: '20px 0', zIndex: 100, background: 'rgba(5, 11, 20, 0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Campainha Digital" style={{ width: '32px', height: '32px', borderRadius: '6px' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://i.imgur.com/your-logo.png'; }} />
            <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>Campainha Digital</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#fff'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>Recursos</a>
            <a href="#compare" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#fff'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>Comparativo</a>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>
            <Link to="/auth" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Entrar</Link>
            <Link to="/auth" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'var(--text-main)', color: 'var(--bg-deep)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.transform='translateY(-2px)'} onMouseOut={e => e.target.style.transform='translateY(0)'}>
                Começar Agora
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: '160px', paddingBottom: '100px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '1000px', height: '1000px', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 60%)', zIndex: -1 }}></div>

        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div style={{ zIndex: 1 }}>
            <div className="animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '100px', color: 'var(--primary)', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
              <Zap size={16} /> O Fim dos Interfones Tradicionais
            </div>
            
            <h1 className="animate-fade-up delay-100" style={{ fontSize: 'clamp(48px, 5vw, 64px)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-2px', marginBottom: '24px' }}>
              Segurança de alto nível,<br />na palma da <span className="text-gradient-primary">sua mão.</span>
            </h1>
            
            <p className="animate-fade-up delay-200" style={{ fontSize: '20px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '540px' }}>
              Transforme a portaria do seu condomínio com uma placa inteligente de QR Code. Atenda visitantes de qualquer lugar do mundo com vídeo ao vivo. Sem fios, sem manutenção.
            </p>
            
            <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: '16px' }}>
              <Link to="/auth" style={{ textDecoration: 'none' }}>
                <button className="btn-primary">
                  Criar Conta Gratuita <ArrowRight size={20} />
                </button>
              </Link>
              <a href="#compare" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary">
                  Ver Comparativo
                </button>
              </a>
            </div>
          </div>

          {/* Premium UI Mockup */}
          <div className="animate-fade-up delay-400" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10%', right: '10%', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.3, zIndex: -1 }}></div>
            
            <div className="iphone-mockup">
              <div className="iphone-notch"></div>
              {/* Fake App Screen */}
              <div style={{ width: '100%', height: '100%', background: '#0A111F', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '60px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Portaria Principal</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
                </div>
                {/* Video Area */}
                <div style={{ flex: 1, margin: '0 16px', background: '#111A2C', borderRadius: '24px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80" alt="Visitante" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                  <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} /> Ao vivo
                  </div>
                  <div style={{ position: 'absolute', bottom: '24px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}>
                      <Video size={24} color="#000" />
                    </div>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)' }}>
                      <X size={24} color="#fff" />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Aguardando resposta...
                </div>
              </div>
            </div>
            
            {/* Floating QR Card */}
            <div style={{ position: 'absolute', bottom: '10%', left: '-20%', background: 'rgba(17, 26, 44, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', animation: 'float 5s ease-in-out infinite reverse' }}>
              <div style={{ width: '64px', height: '64px', background: '#fff', padding: '4px', borderRadius: '12px' }}>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example" alt="QR" style={{ width: '100%', height: '100%' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Placa Inteligente</div>
                <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Pronta para uso</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '100px 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>Tecnologia que <span className="text-gradient">redefine segurança.</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>Construído com os mesmos padrões de criptografia das maiores instituições financeiras.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="premium-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Smartphone size={24} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Mobilidade Total</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>O visitante toca, seu smartphone chama. Atenda a porta via vídeo estando no trabalho ou em viagem internacional.</p>
            </div>
            
            <div className="premium-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Monitoramento Furtivo</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Acesse a câmera instantaneamente sem que o visitante perceba. Você no controle total antes de iniciar o áudio.</p>
            </div>

            <div className="premium-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Clock size={24} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Instalação em 60 Segundos</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Sem furadeiras, sem passar cabos, sem eletricista. Fixe a placa com fita dupla-face e ative no painel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="compare" style={{ padding: '120px 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>Por que somos a <span className="text-gradient">escolha lógica?</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Compare os custos e benefícios ocultos das tecnologias do mercado.</p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: '24px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Critério</th>
                  <th style={{ width: '30%', textAlign: 'center' }}>Interfones Tradicionais</th>
                  <th className="highlight" style={{ width: '30%', textAlign: 'center' }}>Campainha Digital</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Custo de Instalação</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Alto (Obras e Cabos)</td>
                  <td className="highlight" style={{ textAlign: 'center' }}>Zero (Imediato)</td>
                </tr>
                <tr>
                  <td>Manutenção Anual</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Constante (Rachaduras, Água)</td>
                  <td className="highlight" style={{ textAlign: 'center' }}>Zero (Nuvem)</td>
                </tr>
                <tr>
                  <td>Atendimento</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Apenas dentro de casa</td>
                  <td className="highlight" style={{ textAlign: 'center' }}>Global via Smartphone</td>
                </tr>
                <tr>
                  <td>Identificação Visual</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}><X size={20} color="#EF4444" style={{ display: 'inline-block', verticalAlign: 'middle' }} /></td>
                  <td className="highlight" style={{ textAlign: 'center' }}><Check size={20} color="#10B981" style={{ display: 'inline-block', verticalAlign: 'middle' }} /> Câmera ao Vivo</td>
                </tr>
                <tr>
                  <td>Registro de Visitantes</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}><X size={20} color="#EF4444" style={{ display: 'inline-block', verticalAlign: 'middle' }} /></td>
                  <td className="highlight" style={{ textAlign: 'center' }}><Check size={20} color="#10B981" style={{ display: 'inline-block', verticalAlign: 'middle' }} /> Captura Automática</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{ padding: '100px 0', borderTop: '1px solid var(--border-subtle)', background: 'radial-gradient(ellipse at bottom, rgba(0, 229, 255, 0.1) 0%, var(--bg-deep) 100%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '24px' }}>Eleve o padrão do seu condomínio.</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '20px', marginBottom: '40px' }}>Inicie sua transição para a portaria digital hoje mesmo.</p>
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '20px 48px', fontSize: '18px' }}>
              Cadastrar Meu Condomínio <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </section>
      
      <footer style={{ padding: '40px 0', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
         <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>© {new Date().getFullYear()} Campainha Digital. O padrão em segurança patrimonial moderna.</p>
      </footer>
    </>
  );
}
