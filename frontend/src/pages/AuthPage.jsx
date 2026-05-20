import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Home, Camera, X, CheckCircle2, Phone, Building2, Download } from 'lucide-react';
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
  const [installPrompt, setInstallPrompt] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [loginType, setLoginType] = useState('password'); // 'password' | 'code'
  const [error, setError] = useState('');
  const [scanningActive, setScanningActive] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [propertyType, setPropertyType] = useState('house'); // 'house' | 'village' | 'condo'
  const [billingModel, setBillingModel] = useState('annual'); // 'annual' | 'monthly'
  const [pixData, setPixData] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [clientUnitId, setClientUnitId] = useState('');
  const [clientAccessCode, setClientAccessCode] = useState('');
  const [globalConfig, setGlobalConfig] = useState(null);
  const [clientLocation, setClientLocation] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/config`)
      .then(res => res.json())
      .then(data => setGlobalConfig(data))
      .catch(err => console.error("Erro ao carregar configuracoes globais:", err));
  }, []);

  // Captura parâmetros da URL para preenchimento automático do código único e ativação do tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const tabParam = params.get('tab');
    
    if (codeParam) {
      setAccessCode(codeParam.toUpperCase());
    }
    if (tabParam === 'code' || codeParam) {
      setLoginType('code');
    }
  }, []);

  // Gerencia o prompt de instalação PWA na tela de login
  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);
  
  const [isPaid, setIsPaid] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Polling para checar se o Pix foi pago/confirmado no Abacate Pay
  useEffect(() => {
    if (step !== 4 || !scannedId || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/payment/abacate/status/${encodeURIComponent(scannedId.trim().toLowerCase())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid) {
            setIsPaid(true);
            clearInterval(interval);
            if ((propertyType === 'house' || propertyType === 'individual') && clientUnitId) {
              navigate(`/morador/${clientUnitId}?new=true`);
            }
          }
        }
      } catch (err) {
        console.error("Erro no polling de confirmacao do Abacate Pay:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [step, scannedId, isPaid, propertyType, clientUnitId, navigate]);



  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'code') {
        let deviceId = localStorage.getItem('cd_device_id');
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
          localStorage.setItem('cd_device_id', deviceId);
        }

        const res = await fetch(`${API}/api/resident/login-by-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accessCode: accessCode.trim().toUpperCase(),
            deviceId
          })
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
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização, que é obrigatória por segurança.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setClientLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
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
      },
      (err) => {
        setLoading(false);
        alert("Por questões de segurança, você precisa permitir a localização (GPS) para ativar a placa no endereço real.");
      },
      { enableHighAccuracy: true }
    );
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

  const getDisplayPrice = () => {
    if (!globalConfig) return 39.90;
    
    // Se for anual
    if (billingModel === 'annual') {
      if (propertyType === 'house') return globalConfig.servicePriceAnnualSimple !== undefined ? globalConfig.servicePriceAnnualSimple : 39.90;
      if (propertyType === 'village') return globalConfig.servicePriceAnnualVilla !== undefined ? globalConfig.servicePriceAnnualVilla : 99.90;
      if (propertyType === 'condo') return globalConfig.servicePriceAnnualCondo !== undefined ? globalConfig.servicePriceAnnualCondo : 159.90;
      return globalConfig.servicePriceAnnual || 39.90;
    }
    
    // Se for mensal
    if (propertyType === 'village') return globalConfig.villaMonthlyBasePrice !== undefined ? globalConfig.villaMonthlyBasePrice : 99.90;
    if (propertyType === 'condo') return globalConfig.condoMonthlyBasePrice !== undefined ? globalConfig.condoMonthlyBasePrice : 159.90;
    
    return 39.90;
  };

  const submitPlan = async (paymentChoice) => {
    setLoading(true);
    try {
      const payload = { 
        userId, 
        propertyId: scannedId, 
        qrImage: scannedImage, 
        paymentChoice, 
        propertyType, 
        billingModel 
      };
      if (clientLocation) {
        payload.latitude = clientLocation.lat;
        payload.longitude = clientLocation.lng;
      }

      const res = await fetch(`${API}/api/auth/link-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        // Salvar sessão para acesso imediato
        sessionStorage.setItem('cd_admin_email', email);
        sessionStorage.setItem('cd_admin_role', data.role || 'client'); 
        if (data.propertyId) sessionStorage.setItem('cd_admin_propertyId', data.propertyId);
        if (data.unitId) {
          setClientUnitId(data.unitId);
          setClientAccessCode(data.accessCode);
          sessionStorage.setItem('residentUnitId', data.unitId);
          sessionStorage.setItem('residentName', name);
          sessionStorage.setItem('residentPropertyId', data.propertyId);
          sessionStorage.setItem('residentAccessCode', data.accessCode);
        }
        
        if (paymentChoice === 'trial') {
          setIsPaid(true);
          if ((propertyType === 'house' || propertyType === 'individual') && data.unitId) {
            navigate(`/morador/${data.unitId}?new=true`);
          } else {
            setStep(4);
          }
        } else {
          // Chamar Abacate Pay para gerar o PIX
          try {
            const abacateRes = await fetch(`${API}/api/payment/abacate/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ propertyId: scannedId })
            });
            const abacateData = await abacateRes.json();
            if (abacateRes.ok && abacateData.success) {
              setPixData(abacateData);
              setStep(4);
              // Se não há QR Code mas tem invoiceUrl (para legado/outros gateways), abre o link
              if (abacateData.fallback && abacateData.invoiceUrl) {
                window.open(abacateData.invoiceUrl, '_blank');
              }
            } else {
              const errMsg = abacateData.detail || abacateData.error || 'Falha ao processar pagamento.';
              alert(`Erro no Abacate Pay: ${errMsg}`);
              // Em caso de erro, o usuário fica na tela atual para tentar novamente.
            }
          } catch(e) {
            alert('Erro de conexão ao processar pagamento.');
          }
        }
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
                <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🏢 Tipo de Imóvel
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'house', label: 'Casa Simples', desc: 'Residência individual padrão', icon: Home },
                    { value: 'village', label: 'Vila / Village', desc: 'Vilas fechadas e condomínios de casas', icon: Home },
                    { value: 'condo', label: 'Condomínio Vertical', desc: 'Edifícios e prédios residenciais', icon: Building2 }
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = propertyType === item.value;
                    return (
                      <label 
                        key={item.value} 
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '16px', 
                          border: `2px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`, 
                          background: isSelected ? '#EFF6FF' : '#FFF', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.08)' : 'none'
                        }}
                      >
                        <input type="radio" name="propertyType" value={item.value} checked={isSelected} onChange={() => setPropertyType(item.value)} style={{ display: 'none' }} />
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isSelected ? '#3B82F6' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                          <Icon size={20} color={isSelected ? '#FFF' : '#64748B'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#1E3A8A' : '#334155' }}>{item.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {(propertyType === 'village' || propertyType === 'condo') && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📆 Período de Cobrança
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { value: 'annual', label: 'Plano Anual', badge: 'Economize' },
                      { value: 'monthly', label: 'Assinatura Mensal', badge: 'Flexível' }
                    ].map(opt => {
                      const isSel = billingModel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBillingModel(opt.value)}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '12px',
                            border: `2px solid ${isSel ? '#3B82F6' : '#E2E8F0'}`,
                            background: isSel ? '#3B82F6' : '#FFF',
                            color: isSel ? '#FFF' : '#475569',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative'
                          }}
                        >
                          {opt.label}
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '8px',
                            fontWeight: 900,
                            background: isSel ? '#10B981' : '#F1F5F9',
                            color: isSel ? '#FFF' : '#64748B',
                            padding: '2px 6px',
                            borderRadius: '100px',
                            border: `1px solid ${isSel ? '#10B981' : '#E2E8F0'}`
                          }}>
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#1E3A8A', background: '#EFF6FF', padding: '10px 14px', borderRadius: '10px', marginTop: '12px', border: '1px solid #BFDBFE', lineHeight: '1.4' }}>
                    💡 <strong>Faturamento Inteligente:</strong> Vilas e condomínios podem escolher o período de assinatura. O plano mensal permite gerenciar dinamicamente unidades adicionais, enquanto o anual fixa um desconto exclusivo para todo o período.
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                <label style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', transition: 'all 0.2s' }}>
                  <input type="checkbox" required style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#3B82F6' }} />
                  <span style={{ color: '#475569', lineHeight: '1.4' }}>
                    Li e concordo com os <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }} onClick={() => setShowTerms(true)}>Termos de Uso e Contrato</button> da plataforma Campainha Digital.
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
                onClick={() => submitPlan(billingModel)}
                disabled={loading}
                style={{ padding: '20px', borderRadius: '16px', background: '#FFF', border: '2px solid #3B82F6', cursor: 'pointer', textAlign: 'left', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)', opacity: loading ? 0.7 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#3B82F6' }}>
                    {billingModel === 'monthly' ? 'Assinatura Mensal via PIX' : 'Assinatura Anual via PIX'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981', textAlign: 'right' }}>
                    R$ {getDisplayPrice().toFixed(2).replace('.', ',')}
                    <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'block' }}>
                      /{billingModel === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                  {billingModel === 'monthly' 
                    ? 'Faturamento mensal baseado nas suas unidades ativas.' 
                    : 'Acesso completo garantido por 12 meses com super desconto.'}
                </div>
              </button>

              <button 
                onClick={() => submitPlan('trial')}
                disabled={loading}
                style={{ padding: '20px', borderRadius: '16px', background: '#F8FAFC', border: '2px dashed #CBD5E1', cursor: 'pointer', textAlign: 'left', opacity: loading ? 0.7 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#475569' }}>
                    Teste Grátis {propertyType === 'house' ? '15' : '30'} Dias
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#64748B' }}>Grátis</div>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>Ativação imediata sem cobrança para testar todas as funções.</div>
              </button>
            </div>
          </div>
        )}

        {!isLogin && step === 4 && (
          <div style={{ textAlign: 'center' }}>
            {isPaid ? (
              <div className="fade-in">
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #10B981', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                  <CheckCircle2 size={50} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#10B981' }}>Placa Ativada! 🎉</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '12px', lineHeight: 1.6 }}>
                  Excelente! O seu plano foi reconhecido e o acesso ao sistema foi <strong>totalmente liberado</strong>!
                </p>

                {clientAccessCode && (
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px dashed rgba(16, 185, 129, 0.3)',
                    borderRadius: '20px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                  }}>
                    <span style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#059669',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '8px'
                    }}>
                      🔑 Seu Código de Acesso Único
                    </span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{
                        fontSize: '26px',
                        fontWeight: 900,
                        color: '#0F172A',
                        fontFamily: 'monospace',
                        letterSpacing: '3px'
                      }}>
                        {clientAccessCode}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(clientAccessCode);
                          alert('Código de acesso copiado com sucesso! Compartilhe com seus familiares.');
                        }}
                        style={{
                          background: '#10B981',
                          border: 'none',
                          color: '#FFF',
                          padding: '6px 14px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        Copiar
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748B', marginTop: '10px', lineHeight: 1.4, margin: '8px 0 0' }}>
                      Compartilhe este mesmo código com seus familiares (suporta o proprietário + até 4 familiares logados).
                    </p>
                  </div>
                )}

                <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(16,185,129,0.05)', borderRadius: '16px', border: '1px dashed #10B981', fontSize: '13px', color: '#0F172A', fontWeight: 600 }}>
                   Plano Ativado com Sucesso! 🛡️
                </div>
                <button onClick={() => { if ((propertyType === 'individual' || propertyType === 'house') && clientUnitId) { navigate(`/morador/${clientUnitId}?new=true`); } else { navigate('/admin'); } }} className="btn-primary w-full" style={{ marginTop: '32px', background: '#10B981', color: '#FFF' }}>
                  Acessar Meu Painel <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={40} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Placa Vinculada!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px', lineHeight: 1.6 }}>
                  Para liberar o acesso ao sistema, realize o pagamento da sua assinatura anual.
                </p>

                {pixData ? (
                  <div style={{ marginTop: '32px', padding: '24px', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#0F172A', marginBottom: '16px' }}>
                      Pague com PIX (R$ {(pixData.value || 39.90).toFixed(2).replace('.', ',')})
                    </strong>

                    {pixData.pixQrCode ? (
                      <>
                        <div style={{ width: '200px', height: '200px', margin: '0 auto', border: '2px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF' }}>
                          <img 
                            src={pixData.pixQrCode && (pixData.pixQrCode.startsWith('http') || pixData.pixQrCode.startsWith('data:')) ? pixData.pixQrCode : `data:image/png;base64,${pixData.pixQrCode}`} 
                            alt="QR Code PIX" 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                          />
                        </div>
                        {pixData.pixCopiaECola && (
                          <div style={{ marginTop: '24px' }}>
                            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>PIX Copia e Cola</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input type="text" value={pixData.pixCopiaECola} readOnly style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', background: '#F8FAFC', outline: 'none' }} />
                              <button onClick={() => { navigator.clipboard.writeText(pixData.pixCopiaECola); alert('Pix copiado!'); }} style={{ padding: '0 16px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>Copiar</button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: 1.6 }}>
                          Sua cobrança foi gerada! Clique abaixo para pagar.
                        </p>
                        {pixData.invoiceUrl && (
                          <a href={pixData.invoiceUrl} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#10B981', color: '#FFF', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '15px' }}>
                            💳 Pagar Agora
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Botão do WhatsApp para Comprovante */}
                    <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                      <a 
                        href={`https://wa.me/${globalConfig?.supportWhatsApp || '5521995879170'}?text=Olá!%20Realizei%20o%20pagamento%20Pix%20para%20a%20minha%20placa%20do%20Campainha%20Digital.%20ID%20da%20Placa:%20${encodeURIComponent(scannedId)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '10px', 
                          fontSize: '13px', 
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: '#25D366',
                          border: 'none',
                          color: '#FFF',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)'
                        }}
                      >
                        💬 Já paguei! Enviar comprovante no WhatsApp
                      </a>
                    </div>
                    
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '16px', lineHeight: '1.4' }}>Após o pagamento, o acesso é liberado em instantes e o recibo enviado para o seu WhatsApp/E-mail.</p>
                  </div>
                ) : (
                  <div style={{ marginTop: '32px', padding: '16px', background: '#F1F5F9', borderRadius: '12px', fontSize: '13px', color: '#475569' }}>
                    Aguardando liberação do sistema.
                  </div>
                )}

                {isPaid ? (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '16px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', marginBottom: '16px' }}>
                      <CheckCircle2 size={24} style={{ color: '#15803D' }} />
                      <span>✓ Pagamento Confirmado com Sucesso! Seu acesso foi liberado.</span>
                    </div>
                    <button onClick={() => { if ((propertyType === 'individual' || propertyType === 'house') && clientUnitId) { navigate(`/morador/${clientUnitId}?new=true`); } else { navigate('/admin'); } }} className="btn-primary w-full">
                      Acessar Meu Painel <ArrowRight size={20} />
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>
                    <span>⏳ Aguardando a confirmação do pagamento... Assim que pagar, o acesso será liberado automaticamente. Não saia desta página!</span>
                  </div>
                )}
              </>
            )}
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
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ position: 'absolute', inset: '60px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '20px' }}></div>
           </div>
           <button onClick={stopScanner} style={{ marginTop: '32px', background: '#FFF', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <X size={20} /> Fechar Câmera
           </button>
        </div>
      )}

      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <div className="fade-in" style={{ background: '#FFF', width: '100%', maxWidth: '600px', maxHeight: '85vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
             <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
               <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>📄 Termos de Uso e Contrato</h3>
               <button type="button" onClick={() => setShowTerms(false)} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'} onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}><X size={18} color="#64748B" /></button>
             </div>
             
             <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
               <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontSize: '15px' }}>1. Aceitação dos Termos</h4>
               <p style={{ marginBottom: '24px' }}>Ao acessar e usar a plataforma Campainha Digital, você concorda em cumprir e ficar vinculado aos seguintes termos e condições de uso. Se não concordar com alguma parte destes termos, não deverá finalizar seu cadastro.</p>
               
               <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontSize: '15px' }}>2. Assinatura e Pagamentos</h4>
               <p style={{ marginBottom: '24px' }}>A utilização dos serviços da Campainha Digital está sujeita ao pagamento da assinatura escolhida no momento do cadastro (plano anual ou outro vigente). O acesso ao painel de administração e a operação da placa (redirecionamento de QR Code e Notificações Push/WhatsApp) dependem da regularidade destes pagamentos. O atraso superior a 5 (cinco) dias acarretará a suspensão temporária dos serviços sem aviso prévio.</p>
               
               <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontSize: '15px' }}>3. Uso da Placa e Infraestrutura</h4>
               <p style={{ marginBottom: '24px' }}>A placa física fornecida ("Campainha Digital") e o QR Code impresso nela são intransferíveis e pertencem exclusivamente ao endereço cadastrado no sistema. O usuário é inteiramente responsável por proteger a placa física contra danos, intempéries extremas ou vandalismo que impossibilitem a leitura do QR Code pelos visitantes.</p>

               <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontSize: '15px' }}>4. Privacidade e Proteção de Dados (LGPD)</h4>
               <p style={{ marginBottom: '24px' }}>Nós nos comprometemos a resguardar seus dados pessoais e de seus visitantes em estrito acordo com a Lei Geral de Proteção de Dados (LGPD). As fotos capturadas e os dados de contato trafegados via plataforma não serão comercializados, cedidos ou divulgados a terceiros, servindo estritamente para o propósito de identificação e notificação de chegada de visitantes na sua propriedade.</p>

               <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontSize: '15px' }}>5. Cancelamento da Assinatura</h4>
               <p style={{ marginBottom: '24px' }}>Você pode cancelar sua assinatura a qualquer momento através do nosso suporte. Não há multa rescisória de cancelamento. Caso haja o cancelamento, a placa QR Code será desativada dos nossos servidores de redirecionamento, e a funcionalidade inteligente da placa deixará de operar imediatamente após o fim do período já pago pelo cliente.</p>
               
               <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontSize: '15px' }}>6. Limitação de Responsabilidade e SLA</h4>
               <p style={{ marginBottom: '8px' }}>A Campainha Digital atua exclusivamente como uma ferramenta tecnológica facilitadora de comunicação e controle de portaria autônoma/digital. Nos isentamos de responsabilidade sobre:</p>
               <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
                 <li>Falhas de conectividade originadas pelas operadoras de telefonia celular;</li>
                 <li>Instabilidades nos serviços de terceiros (WhatsApp / Meta Inc. / Firebase);</li>
                 <li>Falta de energia elétrica ou internet no dispositivo do usuário e do visitante.</li>
               </ul>
             </div>
             
             <div style={{ padding: '20px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowTerms(false)} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 800 }}>Li e Entendi</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
