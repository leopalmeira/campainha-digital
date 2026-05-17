import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Home, Camera, X, CheckCircle2, Phone, Building2 } from 'lucide-react';
import Logo from '../components/Logo';
import jsQR from 'jsqr';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Cadastro, 2: Scan QR, 3: Aguardando
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [scannedId, setScannedId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [loginType, setLoginType] = useState('password'); // 'password' | 'code'
  const [error, setError] = useState('');
  const [scanningActive, setScanningActive] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [propertyType, setPropertyType] = useState('individual'); // 'individual' ou 'collective'
  const [pixData, setPixData] = useState(null);
  
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
            sessionStorage.setItem('cd_admin_role', 'doorman');
            sessionStorage.setItem('cd_doorman_propertyId', data.propertyId);
            navigate('/portaria');
          } else if (data.unitId) {
            sessionStorage.setItem('residentUnitId', data.unitId);
            sessionStorage.setItem('residentName', data.unitName || 'Morador');
            sessionStorage.setItem('residentPropertyId', data.propertyId || '');
            sessionStorage.setItem('residentAccessCode', data.accessCode || accessCode.toUpperCase());
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
          sessionStorage.setItem('cd_admin_email', data.email);
          if (data.role === 'master') {
            sessionStorage.setItem('cd_admin_role', 'master');
            navigate('/master-admin');
          } else if (data.role === 'doorman') {
            sessionStorage.setItem('cd_admin_role', 'doorman');
            sessionStorage.setItem('cd_doorman_propertyId', data.propertyId);
            navigate('/portaria');
          } else if (data.role === 'sindico') {
            sessionStorage.setItem('cd_admin_role', 'sindico');
            if (data.propertyId) sessionStorage.setItem('cd_admin_propertyId', data.propertyId);
            navigate('/admin');
          } else {
            sessionStorage.setItem('cd_admin_role', 'client');
            if (data.propertyId) sessionStorage.setItem('cd_admin_propertyId', data.propertyId);
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
      // Validate WhatsApp minimum length roughly
      if (whatsapp.length < 14) {
        alert('Por favor, informe um WhatsApp válido com DDD.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, whatsapp, password })
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
    setScanningActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        scanLoop();
      }
    } catch (err) {
      alert("Erro ao acessar câmera.");
      setShowScanner(false);
      setScanningActive(false);
    }
  };

  const stopScanner = () => {
    setScanningActive(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowScanner(false);
  };

  const scanLoop = () => {
    const doTick = () => {
      if (!videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

        if (code) {
          const rawData = code.data;
          // Extrair o ID: tenta /chamada/ID, depois pega a última parte da URL, ou usa o valor bruto
          let finalId = rawData;
          const chamadaMatch = rawData.match(/\/chamada\/([a-zA-Z0-9_-]+)/);
          if (chamadaMatch) {
            finalId = chamadaMatch[1];
          } else {
            // Tenta extrair último segmento de URL (caso seja https://site.com/algo/ID)
            try {
              const urlObj = new URL(rawData);
              const segments = urlObj.pathname.split('/').filter(Boolean);
              if (segments.length > 0) finalId = segments[segments.length - 1];
            } catch {
              // Não é URL válida, usa o valor bruto como ID
              finalId = rawData.trim();
            }
          }

          // Capturar a imagem do QR Code
          const qrImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          setScannedId(finalId);
          setScannedImage(qrImageBase64);
          stopScanner();
          setStep(3); // Vai para escolha de plano
          return;
        }
      }
      requestAnimationFrame(doTick);
    };
    requestAnimationFrame(doTick);
  };

  const submitPlan = async (paymentChoice) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/link-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, propertyId: scannedId, qrImage: scannedImage, paymentChoice, propertyType })
      });
      if (res.ok) {
        const data = await res.json();
        // Salvar sessão para acesso imediato
        sessionStorage.setItem('cd_admin_email', email);
        sessionStorage.setItem('cd_admin_role', data.role || 'client'); 
        if (data.propertyId) sessionStorage.setItem('cd_admin_propertyId', data.propertyId);
        
        // Chamar Asaas para gerar o PIX
        try {
          const asaasRes = await fetch(`${API}/api/payment/asaas/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId: scannedId })
          });
          if (asaasRes.ok) {
            const asaasData = await asaasRes.json();
            if (asaasData.success && asaasData.pixQrCode) {
               setPixData(asaasData);
            }
          } else {
             console.log("Asaas Integration maybe not configured yet");
          }
        } catch(e) {
           console.log("Error calling Asaas endpoint");
        }

        setStep(4);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao vincular placa e plano.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0,2)}) ${value.slice(2)}`;
    }
    if (value.length > 9) {
      value = `${value.slice(0,9)}-${value.slice(9)}`;
    }
    setWhatsapp(value);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px 20px', position: 'relative' }}>
        
        {isLogin && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Logo size={36} />
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '12px', color: 'var(--text-main)' }}>Acesso Unificado</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Entre com sua senha ou código de morador.</p>
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
                <Phone size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                <input type="tel" placeholder="WhatsApp (DDD + Número)" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} value={whatsapp} onChange={handleWhatsappChange} required />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={20} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                <input type="password" placeholder="Crie uma senha" className="input-glass" style={{ paddingLeft: '48px', width: '100%' }} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '8px' }}>Tipo de Imóvel</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${propertyType === 'individual' ? '#3B82F6' : '#E2E8F0'}`, background: propertyType === 'individual' ? '#EFF6FF' : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}>
                    <input type="radio" name="propertyType" value="individual" checked={propertyType === 'individual'} onChange={() => setPropertyType('individual')} style={{ display: 'none' }} />
                    <Home size={16} color={propertyType === 'individual' ? '#3B82F6' : '#94A3B8'} /> Casa Simples
                  </label>
                  <label style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${propertyType === 'collective' ? '#3B82F6' : '#E2E8F0'}`, background: propertyType === 'collective' ? '#EFF6FF' : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}>
                    <input type="radio" name="propertyType" value="collective" checked={propertyType === 'collective'} onChange={() => setPropertyType('collective')} style={{ display: 'none' }} />
                    <Building2 size={16} color={propertyType === 'collective' ? '#3B82F6' : '#94A3B8'} /> Condomínio/Vila
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                <label style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', transition: 'all 0.2s' }}>
                  <input type="checkbox" required style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#3B82F6' }} />
                  <span style={{ color: '#475569', lineHeight: '1.4' }}>
                    Li e concordo com os <a href="/contrato.pdf" target="_blank" style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); window.open('/contrato.pdf', '_blank', 'width=800,height=600'); }}>Termos de Uso e Contrato</a> da plataforma Campainha Digital.
                  </span>
                </label>
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
            
            <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Teve problemas com a câmera? <br/>
              <button 
                onClick={() => {
                  const id = window.prompt("Digite o ID impresso na sua placa:");
                  if (id) { 
                    setScannedId(id); 
                    setStep(3); 
                  }
                }}
                style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, cursor: 'pointer', marginTop: '8px', textDecoration: 'underline' }}
              >
                Digitar ID manualmente
              </button>
            </p>
          </div>
        )}

        {!isLogin && step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Ativação da Placa</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px', lineHeight: 1.6 }}>
              Sua placa foi escaneada com sucesso. Ative sua assinatura para começar a usar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
              <button 
                onClick={() => submitPlan('annual')}
                disabled={loading}
                style={{ padding: '20px', borderRadius: '16px', background: '#FFF', border: '2px solid #3B82F6', cursor: 'pointer', textAlign: 'left', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)', opacity: loading ? 0.7 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#3B82F6' }}>Assinatura Anual</div>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>R$ 39,90/ano (Pagamento Único)</div>
              </button>
            </div>
          </div>
        )}

        {!isLogin && step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={40} color="#10B981" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Placa Vinculada!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px', lineHeight: 1.6 }}>
              Para liberar o acesso ao sistema, realize o pagamento da sua assinatura anual.
            </p>

            {pixData ? (
              <div style={{ marginTop: '32px', padding: '24px', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <strong style={{ display: 'block', fontSize: '16px', color: '#0F172A', marginBottom: '16px' }}>Pague com PIX (R$ 39,90)</strong>
                
                <div style={{ width: '200px', height: '200px', margin: '0 auto', border: '2px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={`data:image/png;base64,${pixData.pixQrCode}`} alt="QR Code PIX" style={{ width: '100%', height: '100%' }} />
                </div>
                
                <div style={{ marginTop: '24px' }}>
                   <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>PIX Copia e Cola</span>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <input type="text" value={pixData.pixCopiaECola} readOnly style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', background: '#F8FAFC', outline: 'none' }} />
                     <button onClick={() => { navigator.clipboard.writeText(pixData.pixCopiaECola); alert('Pix copiado!'); }} style={{ padding: '0 16px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
                        Copiar
                     </button>
                   </div>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '16px', lineHeight: '1.4' }}>Após o pagamento, o acesso é liberado em instantes e o recibo enviado para o seu WhatsApp/E-mail.</p>
              </div>
            ) : (
              <div style={{ marginTop: '32px', padding: '16px', background: '#F1F5F9', borderRadius: '12px', fontSize: '13px', color: '#475569' }}>
                 Aguardando liberação do sistema ou configurando integração de pagamento.
              </div>
            )}
            
            <button onClick={() => navigate('/admin')} className="btn-primary w-full" style={{ marginTop: '24px' }}>
              Acessar Meu Painel <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
      </div>

      <div style={{ width: '100%', textAlign: 'center', background: '#0F172A', color: '#FFF', fontSize: '11px', padding: '12px', lineHeight: '1.4' }}>
        <strong style={{ fontSize: '13px', color: '#10B981', display: 'block', marginBottom: '4px' }}>CAMPAINHA DIGITAL INOVA SIMPLES (I.S.)</strong>
        CNPJ: 65.628.833/0001-47<br/>
        Central WhatsApp: <a href="https://wa.me/5521995879170" target="_blank" rel="noreferrer" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 'bold' }}>(21) 99587-9170</a>
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
