import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Home, Camera, X, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import jsQR from 'jsqr';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Cadastro, 2: Scan QR, 3: Aguardando
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [scannedId, setScannedId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [loginType, setLoginType] = useState('password'); // 'password' | 'code'
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'code') {
        const res = await fetch(`${API}/api/resident/login-by-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: accessCode.trim().toUpperCase() })
        });
        const data = await res.json();
        if (res.ok) {
          if (data.role === 'doorman') {
            localStorage.setItem('cd_admin_role', 'doorman');
            localStorage.setItem('cd_doorman_propertyId', data.propertyId);
            navigate('/portaria');
          } else if (data.unitId) {
            localStorage.setItem('residentUnitId', data.unitId);
            localStorage.setItem('residentName', data.unitName || 'Morador');
            localStorage.setItem('residentPropertyId', data.propertyId || '');
            localStorage.setItem('residentAccessCode', data.accessCode || accessCode.toUpperCase());
            navigate(`/morador/${data.unitId}`);
          }
        } else {
          setError(data.error || 'Código inválido.');
        }
      } else {
        const res = await fetch(`${API}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, clientCode: password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('cd_admin_email', data.email);
          if (data.role === 'master') {
            localStorage.setItem('cd_admin_role', 'master');
            navigate('/master-admin');
          } else if (data.role === 'doorman') {
            localStorage.setItem('cd_admin_role', 'doorman');
            localStorage.setItem('cd_doorman_propertyId', data.propertyId);
            navigate('/portaria');
          } else if (data.role === 'sindico') {
            localStorage.setItem('cd_admin_role', 'sindico');
            if (data.propertyId) localStorage.setItem('cd_admin_propertyId', data.propertyId);
            navigate('/admin');
          } else {
            localStorage.setItem('cd_admin_role', 'client');
            if (data.propertyId) localStorage.setItem('cd_admin_propertyId', data.propertyId);
            navigate('/admin');
          }
        } else {
          setError(data.error || 'Credenciais inválidas.');
        }
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUserId(data.userId);
        setStep(2);
      } else {
        alert(data.error || 'Erro no cadastro.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      alert("Erro ao acessar câmera.");
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowScanner(false);
  };

  const tick = () => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      canvas.height = videoRef.current.videoHeight;
      canvas.width = videoRef.current.videoWidth;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

      if (code) {
        const url = code.data;
        // Tentativa de extrair ID de chamada ou ID puro
        const match = url.match(/\/chamada\/([a-zA-Z0-9-]+)/);
        const finalId = match ? match[1] : url;
        setScannedId(finalId);
        stopScanner();
        linkQR(finalId);
        return;
      }
    }
    if (showScanner) requestAnimationFrame(tick);
  };

  const linkQR = async (propId) => {
    try {
      const res = await fetch(`${API}/api/auth/link-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, propertyId: propId })
      });
      if (res.ok) {
        setStep(3);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao vincular placa.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#F8FAFC' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px', position: 'relative' }}>
        
        {isLogin && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Logo size={42} />
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '16px', color: 'var(--text-main)' }}>Acesso Unificado</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Entre com sua senha ou código de morador.</p>
            </div>

            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '16px', padding: '4px', marginBottom: '24px' }}>
              <button onClick={() => { setLoginType('password'); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: loginType === 'password' ? '#FFF' : 'transparent', color: loginType === 'password' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: loginType === 'password' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Senha / E-mail</button>
              <button onClick={() => { setLoginType('code'); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: loginType === 'code' ? '#FFF' : 'transparent', color: loginType === 'code' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: loginType === 'code' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Código Morador</button>
            </div>

            {error && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: 600 }}>{error}</div>}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loginType === 'password' ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <Mail size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} required />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} required />
                  </div>
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Lock size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                  <input type="text" value={accessCode} onChange={e => setAccessCode(e.target.value.toUpperCase())} placeholder="Código de Acesso" className="input-glass" style={{ paddingLeft: '48px', width: '100%', textTransform: 'uppercase', letterSpacing: '2px' }} required />
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full" style={{ padding: '16px', fontSize: '16px' }}>
                {loading ? 'Entrando...' : 'Entrar no Sistema'} <ArrowRight size={20} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <p className="text-muted" style={{ fontSize: '14px' }}>
                Novo por aqui? 
                <button onClick={() => setIsLogin(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, marginLeft: '8px', cursor: 'pointer' }}>
                  Criar conta grátis
                </button>
              </p>
            </div>
          </>
        )}

        {!isLogin && step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>Criar Conta</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Comece seu cadastro padrão Campainha Digital.</p>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <User size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                <input type="text" placeholder="Nome Completo" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div style={{ position: 'relative' }}>
                <Mail size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                <input type="email" placeholder="E-mail" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                <input type="password" placeholder="Crie uma senha" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full" style={{ padding: '16px', fontSize: '16px' }}>
                {loading ? 'Processando...' : 'Cadastrar e Continuar'} <ArrowRight size={20} />
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
               <button onClick={() => setIsLogin(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>Voltar para login</button>
            </div>
          </>
        )}

        {!isLogin && step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Camera size={40} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Escaneie seu QR Code</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
                Para finalizar seu cadastro, você precisa escanear o QR Code da sua placa Campainha Digital.
              </p>
            </div>

            <button onClick={startScanner} className="btn-primary w-full" style={{ padding: '18px', borderRadius: '16px' }}>
              <Camera size={20} /> Abrir Câmera
            </button>
            
            <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Tente até conseguir ler o código da placa.
            </p>
          </div>
        )}

        {!isLogin && step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={40} color="#10B981" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Tudo Pronto!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px', lineHeight: 1.6 }}>
              Sua solicitação foi enviada. Agora o administrador do projeto irá autorizar seu cadastro como administrador de condomínio.
            </p>
            <div style={{ marginTop: '32px', padding: '16px', background: '#F1F5F9', borderRadius: '12px', fontSize: '13px', color: '#475569' }}>
               Você receberá um e-mail assim que for aprovado.
            </div>
            <button onClick={() => setIsLogin(true)} className="btn-primary w-full" style={{ marginTop: '32px' }}>
              Voltar ao Início
            </button>
          </div>
        )}
      </div>

      {showScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
           <div style={{ position: 'relative', width: '90%', maxWidth: '400px', aspectRatio: '1', borderRadius: '24px', overflow: 'hidden', border: '4px solid #3B82F6' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: '60px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '20px' }}></div>
           </div>
           <button onClick={stopScanner} style={{ marginTop: '32px', background: '#FFF', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <X size={20} /> Fechar Câmera
           </button>
        </div>
      )}
    </div>
  );
}
