import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Home } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate auth success and redirect to admin
    navigate('/admin');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden', background: 'var(--bg-deep)' }}>
      
      {/* Visual Effects: Mesh Gradient Aurora Background */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'mesh-pulse 15s infinite alternate ease-in-out', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'mesh-pulse 20s infinite alternate-reverse ease-in-out', zIndex: 0 }}></div>
      
      <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10 }}>
         <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='var(--text-muted)'}>
            <Home size={16} /> Voltar ao Início
         </Link>
      </div>

      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px', zIndex: 1, position: 'relative' }}>
        
        {/* Glow Effects: Subtle Icon Glow */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '20px', border: '1px solid var(--border-subtle)', marginBottom: '24px', boxShadow: '0 0 40px rgba(0, 229, 255, 0.1)' }}>
             <ShieldCheck size={40} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '12px' }}>
            {isLogin ? 'Painel de Controle' : 'Criar Conta'}
          </h2>
          <p className="text-muted" style={{ fontSize: '15px', lineHeight: 1.5 }}>
            {isLogin ? 'Acesse o painel do seu condomínio para gerenciar acessos.' : 'Inicie a transição para a segurança inteligente hoje.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div style={{ position: 'relative', width: '100%' }}>
              <User size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', pointerEvents: 'none' }} />
              <input type="text" placeholder="Nome do Condomínio / Síndico" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} required />
            </div>
          )}
          
          <div style={{ position: 'relative', width: '100%' }}>
            <Mail size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', pointerEvents: 'none' }} />
            <input type="email" placeholder="E-mail corporativo" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} required />
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <Lock size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', pointerEvents: 'none' }} />
            <input type="password" placeholder="Senha segura" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} required />
          </div>

          <button type="submit" className="btn-primary w-full" style={{ padding: '16px', marginTop: '12px', fontSize: '16px' }}>
            {isLogin ? 'Acessar Sistema' : 'Finalizar Cadastro'} <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-muted" style={{ fontSize: '14px' }}>
            {isLogin ? 'Ainda não é cliente?' : 'Já possui uma conta?'}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, marginLeft: '8px', cursor: 'pointer', fontSize: '14px', textShadow: '0 0 10px rgba(0, 229, 255, 0.3)' }}
            >
              {isLogin ? 'Cadastre seu condomínio' : 'Faça login aqui'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
