import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, Trash2, Home, Building2, TreePine, X, ShieldCheck, QrCode, LogOut, ChevronRight, Settings, Smartphone, Camera, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(null); // null | 'scan' | 'type' | 'config'
  const [propertyType, setPropertyType] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [unitsList, setUnitsList] = useState([{ name: '' }]);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch(`${API}/api/properties`);
      const data = await res.json();
      setProperties(data);
      if (data.length === 0) setOnboardingStep('scan');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const startScan = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      // Simulate scan success after 3s (real: use BarcodeDetector API)
      setTimeout(() => {
        if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        setScanning(false);
        setOnboardingStep('type');
      }, 3000);
    } catch { setScanning(false); setOnboardingStep('type'); }
  };

  const skipScan = () => setOnboardingStep('type');

  const selectType = (type) => {
    setPropertyType(type);
    if (type === 'individual') {
      setOnboardingStep('config');
      setPropertyName('Minha Casa');
    } else {
      setOnboardingStep('config');
      setPropertyName('');
    }
  };

  const handleUnitChange = (i, v) => { const u = [...unitsList]; u[i].name = v; setUnitsList(u); };
  const addUnit = () => setUnitsList([...unitsList, { name: '' }]);
  const removeUnit = (i) => { if (unitsList.length > 1) setUnitsList(unitsList.filter((_, idx) => idx !== i)); };

  const handleSubmit = async () => {
    const units = propertyType !== 'individual' ? unitsList.filter(u => u.name.trim()) : [];
    if (propertyType !== 'individual' && units.length === 0) return alert('Adicione pelo menos uma unidade.');
    try {
      const res = await fetch(`${API}/api/properties`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: propertyType === 'individual' ? 'individual' : 'collective', name: propertyName, units })
      });
      if (res.ok) { setOnboardingStep(null); fetchProperties(); }
    } catch (err) { console.error(err); }
  };

  const deleteProperty = async (id) => {
    if (!window.confirm('Excluir esta placa?')) return;
    try { await fetch(`${API}/api/properties/${id}`, { method: 'DELETE' }); fetchProperties(); } catch {}
  };

  const downloadQR = (url, name) => { const a = document.createElement('a'); a.href = url; a.download = `QR_${name}.png`; a.click(); };

  // === ONBOARDING: Scan ===
  if (onboardingStep === 'scan') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="fade-in" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(0,229,255,0.08)', borderRadius: '24px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
          <ScanLine size={56} color="var(--primary)" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Bem-vindo!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px' }}>
          Escaneie a <strong style={{ color: '#fff' }}>placa QR Code</strong> que você recebeu para vincular ao seu painel.
        </p>

        {scanning ? (
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--primary)', marginBottom: '24px', position: 'relative' }}>
            <video ref={videoRef} style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block' }} playsInline muted />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '200px', height: '200px', border: '2px solid var(--primary)', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
            <p style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: '14px', fontWeight: 700 }}>Posicione o QR Code no centro...</p>
          </div>
        ) : (
          <button onClick={startScan} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '18px', marginBottom: '16px' }}>
            <Camera size={24} /> Abrir Câmera
          </button>
        )}

        <button onClick={skipScan} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}>
          Configurar manualmente →
        </button>
      </div>
    </div>
  );

  // === ONBOARDING: Type Selection ===
  if (onboardingStep === 'type') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="fade-in" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Qual seu tipo de imóvel?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Isso define como sua campainha será configurada.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { val: 'individual', icon: Home, label: 'Casa Simples', desc: '1 placa, 1 morador', color: '#10B981' },
            { val: 'village', icon: TreePine, label: 'Vila de Casas', desc: '1 placa, várias casas', color: '#F59E0B' },
            { val: 'condo', icon: Building2, label: 'Condomínio', desc: '1 placa, vários apartamentos', color: 'var(--primary)' }
          ].map(t => (
            <button key={t.val} onClick={() => selectType(t.val)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <t.icon size={26} color={t.color} />
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>{t.label}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.desc}</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </button>
          ))}
        </div>

        <button onClick={() => setOnboardingStep('scan')} style={{ display: 'block', margin: '24px auto 0', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>← Voltar</button>
      </div>
    </div>
  );

  // === ONBOARDING: Config ===
  if (onboardingStep === 'config') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="fade-in" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
            {propertyType === 'individual' ? 'Confirme sua casa' : 'Configure as unidades'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {propertyType === 'individual' ? 'Dê um nome à sua propriedade e pronto!' : 'Adicione cada casa ou apartamento do complexo.'}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              {propertyType === 'individual' ? 'Nome da sua casa' : 'Nome do condomínio / vila'}
            </label>
            <input type="text" className="input-glass" placeholder="Ex: Residencial Solar" value={propertyName} onChange={e => setPropertyName(e.target.value)} style={{ width: '100%' }} />
          </div>

          {propertyType !== 'individual' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
                {propertyType === 'village' ? 'Casas da vila' : 'Apartamentos'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                {unitsList.map((u, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>{i+1}</span>
                    <input type="text" className="input-glass" placeholder={propertyType === 'village' ? `Casa ${i+1}` : `Apto ${i+1}`} value={u.name} onChange={e => handleUnitChange(i, e.target.value)} style={{ flex: 1 }} />
                    <button onClick={() => removeUnit(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', padding: '10px', borderRadius: '8px', cursor: 'pointer', opacity: unitsList.length === 1 ? 0.3 : 1 }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button onClick={addUnit} style={{ marginTop: '12px', width: '100%', background: 'transparent', border: '1px dashed var(--primary)', color: 'var(--primary)', padding: '10px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                <Plus size={14} /> Adicionar {propertyType === 'village' ? 'Casa' : 'Apartamento'}
              </button>
            </div>
          )}

          <button onClick={handleSubmit} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '24px' }}>
            Ativar Campainha <ChevronRight size={20} />
          </button>
        </div>

        <button onClick={() => setOnboardingStep('type')} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>← Voltar</button>
      </div>
    </div>
  );

  // === DASHBOARD (after onboarding) ===
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', paddingBottom: '60px' }}>
      <header style={{ background: 'var(--bg-surface-elevated)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={28} color="var(--primary)" />
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Painel do Cliente</h1>
        </div>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
          <LogOut size={18} /> Sair
        </Link>
      </header>

      <main className="container fade-in" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>Minhas Propriedades</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Gerencie placas e unidades</p>
          </div>
          <button className="btn-primary" onClick={() => setOnboardingStep('scan')} style={{ padding: '12px 24px' }}>
            <Plus size={20} /> Nova Placa
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>Carregando...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {properties.map(p => (
              <div key={p.id} className="premium-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>{p.name}</h3>
                    <span style={{ fontSize: '12px', padding: '4px 10px', background: p.type === 'individual' ? 'rgba(16,185,129,0.1)' : 'rgba(0,229,255,0.1)', color: p.type === 'individual' ? '#10B981' : 'var(--primary)', borderRadius: '100px', fontWeight: 600 }}>
                      {p.type === 'individual' ? 'Casa Única' : `${p.units.length} unidades`}
                    </span>
                  </div>
                  <button onClick={() => deleteProperty(p.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>

                <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <img src={p.qrCodeUrl} alt="QR" style={{ width: '140px', height: 'auto' }} />
                </div>

                <button className="btn-secondary" style={{ width: '100%', padding: '12px', fontSize: '13px', marginBottom: '16px' }} onClick={() => downloadQR(p.qrCodeUrl, p.name)}>
                  <Download size={16} /> Baixar QR Code
                </button>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Códigos de Acesso dos Moradores:</span>
                  {p.units.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', marginBottom: '6px' }}>
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{u.name}</span>
                        <input 
                          type="text" 
                          readOnly 
                          value={u.accessCode || '---'} 
                          style={{ width: '100px', fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 800, background: 'rgba(0,229,255,0.08)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,229,255,0.2)', cursor: 'text' }}
                          onClick={(e) => e.target.select()}
                        />
                      </div>
                      <button 
                        onClick={(e) => { 
                          navigator.clipboard.writeText(u.accessCode || '');
                          const btn = e.target;
                          btn.innerText = 'COPIADO!';
                          btn.style.background = '#10B981';
                          btn.style.color = '#fff';
                          setTimeout(() => {
                            btn.innerText = 'COPIAR';
                            btn.style.background = 'rgba(0,229,255,0.1)';
                            btn.style.color = 'var(--primary)';
                          }, 2000);
                        }} 
                        style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(0,229,255,0.1)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}
                      >
                        COPIAR
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
