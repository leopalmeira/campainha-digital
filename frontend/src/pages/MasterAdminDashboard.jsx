import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Plus, ScanLine, Search, Mail, Building2, Trash2, LogOut, Check, X, Camera, RefreshCw, Copy, ExternalLink, Activity, Users, Globe, Database } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedId, setScannedId] = useState('');
  const [newClient, setNewClient] = useState({ email: '', name: '', type: 'individual' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('cd_admin_role');
    if (role !== 'master') {
      navigate('/auth');
      return;
    }
    fetchClients();
  }, [navigate]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem('cd_admin_email');
      const res = await fetch(`${API}/api/properties?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setShowScanner(true);
    setScannedId('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Erro ao acessar a câmera.");
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
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        const url = code.data;
        // Extract ID from URL like .../chamada/ID
        const match = url.match(/\/chamada\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          setScannedId(match[1]);
          stopScanner();
          return;
        }
      }
    }
    if (showScanner) requestAnimationFrame(tick);
  };

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    if (!scannedId || !newClient.email) return;

    setIsRegistering(true);
    try {
      const res = await fetch(`${API}/api/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scannedId,
          adminEmail: newClient.email,
          name: newClient.name,
          type: newClient.type
        })
      });

      if (res.ok) {
        alert('Cliente registrado com sucesso!');
        setScannedId('');
        setNewClient({ email: '', name: '', type: 'individual' });
        fetchClients();
      } else {
        alert('Erro ao registrar cliente.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  };

  const deleteClient = async (id) => {
    if (!window.confirm('Excluir este cliente permanentemente?')) return;
    const email = localStorage.getItem('cd_admin_email');
    try {
      await fetch(`${API}/api/properties/${id}?adminEmail=${encodeURIComponent(email)}`, { method: 'DELETE' });
      fetchClients();
    } catch (err) { console.error(err); }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.includes(searchQuery)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#e0e0e0', display: 'flex', fontFamily: '"Inter", sans-serif' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* SIDEBAR - SHARP & INDUSTRIAL */}
      <aside style={{ width: '280px', background: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ padding: '32px 24px', borderBottom: '1px solid #1a1a1a', background: 'linear-gradient(to bottom, #0d0d0d, #0a0a0a)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: '#adff2f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="#000" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-1px', color: '#fff' }}>SYSTEM HQ</span>
          </div>
          <span style={{ fontSize: '10px', color: '#666', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Master Admin Access</span>
        </div>

        <nav style={{ padding: '24px 12px', flex: 1 }}>
          <SidebarBtn icon={Users} label="Gerenciar Clientes" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <SidebarBtn icon={Activity} label="Logs do Sistema" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
          <SidebarBtn icon={Globe} label="Rede Global" active={activeTab === 'network'} onClick={() => setActiveTab('network')} />
          <SidebarBtn icon={Database} label="Banco de Dados" active={activeTab === 'db'} onClick={() => setActiveTab('db')} />
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid #1a1a1a', background: '#0d0d0d' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', color: '#444', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Logado como:</p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#adff2f', overflow: 'hidden', textOverflow: 'ellipsis' }}>{localStorage.getItem('cd_admin_email')}</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/auth'); }} style={{ width: '100%', background: 'transparent', border: '1px solid #333', color: '#888', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }} onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#888'; }}>
            <LogOut size={16} /> ENCERRAR SESSÃO
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
        
        {/* Background Glitch Effect Overlay (Subtle) */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 2px)', zIndex: 0 }}></div>

        <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
          <div className="stagger-1">
            <h1 style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-3px', color: '#fff', lineHeight: 1 }}>PAINEL MASTER</h1>
            <p style={{ color: '#666', fontSize: '14px', fontWeight: 500, marginTop: '8px' }}>Ativação e controle de placas Campainha Digital.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }} className="stagger-2">
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
              <input type="text" placeholder="Buscar ID ou Email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: '#111', border: '1px solid #222', color: '#fff', padding: '12px 12px 12px 48px', width: '300px', fontSize: '14px', outline: 'none' }} />
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('register')} style={{ background: '#adff2f', color: '#000', border: 'none', padding: '12px 24px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> NOVO CLIENTE
            </button>
          </div>
        </header>

        {activeTab === 'clients' && (
          <section className="stagger-3" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-1px' }}>CLIENTES ATIVOS ({filteredClients.length})</h3>
                <button onClick={fetchClients} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><RefreshCw size={18} /></button>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
                      <th style={{ padding: '16px 24px', fontSize: '11px', color: '#444', fontWeight: 900, textTransform: 'uppercase' }}>Propriedade / ID</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', color: '#444', fontWeight: 900, textTransform: 'uppercase' }}>Email do Admin</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', color: '#444', fontWeight: 900, textTransform: 'uppercase' }}>Tipo</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', color: '#444', fontWeight: 900, textTransform: 'uppercase' }}>Unidades</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', color: '#444', fontWeight: 900, textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Processando dados do sistema...</td></tr>
                    ) : filteredClients.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Nenhum registro encontrado.</td></tr>
                    ) : filteredClients.map(client => (
                      <tr key={client.id} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#0d0d0d'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>{client.name || 'Sem Nome'}</div>
                          <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', fontFamily: 'monospace' }}>{client.id}</div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail size={14} color="#666" />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{client.adminEmail || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{ padding: '4px 8px', background: '#111', border: '1px solid #222', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#adff2f' }}>{client.type}</span>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} color="#444" />
                            <span style={{ fontSize: '14px', fontWeight: 700 }}>{client.units?.length || 0}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <a href={client.url} target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#666'}><ExternalLink size={18} /></a>
                            <button onClick={() => deleteClient(client.id)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#666'}><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'register' && (
          <section className="stagger-1" style={{ maxWidth: '600px', position: 'relative', zIndex: 1 }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '40px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-1.5px', color: '#fff' }}>REGISTRAR NOVA PLACA</h2>
                <p style={{ color: '#666', fontSize: '13px' }}>Vincule uma placa física a um novo cliente do sistema.</p>
              </div>

              <form onSubmit={handleRegisterClient}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#444', textTransform: 'uppercase', marginBottom: '8px' }}>1. Identificação da Placa (QR Code)</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" placeholder="ID da Placa (Escaneie ou digite)" value={scannedId} onChange={e => setScannedId(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #222', color: '#fff', padding: '14px', outline: 'none', fontFamily: 'monospace' }} required />
                    <button type="button" onClick={startScanner} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '0 20px', cursor: 'pointer' }}>
                      <Camera size={20} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#444', textTransform: 'uppercase', marginBottom: '8px' }}>2. Dados do Cliente</label>
                  <input type="email" placeholder="Email do Cliente" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '14px', outline: 'none', marginBottom: '12px' }} required />
                  <input type="text" placeholder="Nome da Propriedade (Opcional)" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '14px', outline: 'none' }} />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#444', textTransform: 'uppercase', marginBottom: '12px' }}>3. Tipo de Configuração</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['individual', 'collective'].map(type => (
                      <button key={type} type="button" onClick={() => setNewClient({ ...newClient, type })} style={{ flex: 1, padding: '12px', background: newClient.type === type ? '#adff2f15' : 'transparent', border: `1px solid ${newClient.type === type ? '#adff2f' : '#222'}`, color: newClient.type === type ? '#adff2f' : '#666', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', cursor: 'pointer' }}>
                        {type === 'individual' ? 'Casa Única' : 'Múltiplas Unidades'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="submit" disabled={isRegistering} style={{ flex: 1, background: '#adff2f', color: '#000', border: 'none', padding: '16px', fontWeight: 900, cursor: 'pointer', opacity: isRegistering ? 0.5 : 1 }}>
                    {isRegistering ? 'PROCESSANDO...' : 'ATIVAR CLIENTE'}
                  </button>
                  <button type="button" onClick={() => setActiveTab('clients')} style={{ background: 'transparent', border: '1px solid #222', color: '#666', padding: '0 24px', fontWeight: 700, cursor: 'pointer' }}>
                    CANCELAR
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* SCANNER MODAL */}
        {showScanner && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #adff2f', maxWidth: '500px', width: '100%', position: 'relative' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#adff2f', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>Scanner Óptico Ativo</span>
                <button onClick={stopScanner} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ position: 'relative', overflow: 'hidden', aspectRation: '1/1' }}>
                <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '200px', height: '200px', border: '2px solid #adff2f', boxShadow: '0 0 0 1000px rgba(0,0,0,0.7)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: '#adff2f', animation: 'scan-anim 2s linear infinite' }}></div>
                </div>
              </div>
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: '#666', fontSize: '12px' }}>Aponte a câmera para o QR Code da placa física para capturar o identificador único.</p>
              </div>
            </div>
            <style>{`
              @keyframes scan-anim {
                0% { top: 0; }
                50% { top: 100%; }
                100% { top: 0; }
              }
            `}</style>
          </div>
        )}
      </main>

      <style>{`
        .stagger-1 { animation: slideUp 0.4s ease-out forwards; }
        .stagger-2 { animation: slideUp 0.4s ease-out 0.1s forwards; opacity: 0; }
        .stagger-3 { animation: slideUp 0.4s ease-out 0.2s forwards; opacity: 0; }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .btn-primary:hover { background: #9acd32 !important; transform: translateY(-2px); }
        .btn-primary:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}

function SidebarBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', background: active ? '#adff2f10' : 'transparent', color: active ? '#adff2f' : '#666', border: 'none', borderLeft: `3px solid ${active ? '#adff2f' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800, fontSize: '13px', textAlign: 'left', marginBottom: '4px' }}>
      <Icon size={18} /> {label.toUpperCase()}
    </button>
  );
}
