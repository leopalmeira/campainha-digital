import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Home, BellRing } from 'lucide-react';

export default function ResidentLogin() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/resident/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessCode })
      });
      const data = await res.json();

      if (res.ok && data.unitId) {
        localStorage.setItem('residentUnitId', data.unitId);
        localStorage.setItem('residentName', data.unitName || 'Morador');
        localStorage.setItem('residentPropertyName', data.propertyName || '');
        navigate(`/morador/${data.unitId}`);
      } else {
        setError(data.error || 'Código ou e-mail incorreto. Verifique com o administrador.');
      }
    } catch (err) {
      setError('Falha na conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden', background: 'var(--bg-deep)' }}>
      
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'mesh-pulse 18s infinite alternate ease-in-out', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'mesh-pulse 22s infinite alternate-reverse ease-in-out', zIndex: 0 }}></div>
      
      <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10 }}>
         <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='var(--text-muted)'}>
            <Home size={16} /> Voltar ao Início
         </Link>
      </div>

      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px', zIndex: 1, position: 'relative' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '24px', boxShadow: '0 0 40px rgba(16, 185, 129, 0.1)' }}>
             <BellRing size={40} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '12px' }}>
            Minha Campainha
          </h2>
          <p className="text-muted" style={{ fontSize: '15px', lineHeight: 1.5 }}>
            Acesse seu painel de morador para receber chamadas do portão no celular.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#EF4444', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Mail size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', pointerEvents: 'none' }} />
            <input 
              type="email" 
              placeholder="Seu e-mail de morador" 
              className="input-glass" 
              style={{ paddingLeft: '48px', width: '100%' }} 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <Lock size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', pointerEvents: 'none' }} />
            <input 
              type="text" 
              placeholder="Código de acesso (fornecido pelo admin)" 
              className="input-glass" 
              style={{ paddingLeft: '48px', width: '100%' }} 
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full" 
            style={{ padding: '16px', marginTop: '12px', fontSize: '16px', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'Entrar na Campainha'} <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.5 }}>
            Após o login, instale o app no celular para receber notificações em tempo real.
          </p>
          <Link to="/auth" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'inline-block', marginTop: '12px' }}>
            Sou administrador / síndico →
          </Link>
        </div>
      </div>
    </div>
  );
}
