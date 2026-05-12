import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Plus, ScanLine, Search, Mail, Building2, Trash2, LogOut, Check, X, Camera, RefreshCw, Copy, ExternalLink, Activity, Users, Globe, Database, Phone, CreditCard, MapPin, User, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedId, setScannedId] = useState('');
  
  // Expanded form state
  const [newClient, setNewClient] = useState({
    name: '', // Property Name
    type: 'house',
    numUnits: 1,
    clientName: '',
    email: '',
    clientPhone: '',
    clientDocument: '',
    clientAddress: '',
    doormanEmail: ''
  });
  
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
    if (!scannedId || !newClient.email || !newClient.clientName) return;

    setIsRegistering(true);
    try {
      const res = await fetch(`${API}/api/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scannedId,
          adminEmail: newClient.email,
          name: newClient.name,
          type: newClient.type,
          clientName: newClient.clientName,
          clientPhone: newClient.clientPhone,
          clientDocument: newClient.clientDocument,
          clientAddress: newClient.clientAddress,
          doormanEmail: newClient.doormanEmail,
          units: newClient.type !== 'house' ? Array.from({ length: newClient.numUnits }, (_, i) => ({ name: `Unidade ${i + 1}` })) : []
        })
      });

      if (res.ok) {
        alert('Cliente registrado com sucesso!');
        setScannedId('');
        setNewClient({
          name: '', type: 'house', numUnits: 1, clientName: '', email: '', clientPhone: '', clientDocument: '', clientAddress: '', doormanEmail: ''
        });
        setActiveTab('clients');
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

  const copyToClipboard = (text) => {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      alert('Código copiado: ' + text);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
    document.body.removeChild(input);
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.includes(searchQuery)
  );

  const totalUnits = clients.reduce((acc, c) => acc + (c.units ? c.units.length : 0), 0);
  
  const fmtDate = (isoString) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }}></div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* SIDEBAR */}
      <aside className="glass-panel" style={{ width: '280px', margin: '24px 0 24px 24px', display: 'flex', flexDirection: 'column', borderRadius: '24px', zIndex: 10 }}>
        <div style={{ padding: '32px 24px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)' }}>
            <ShieldCheck size={32} color="var(--primary)" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>Master Admin</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Controle Geral do Sistema</span>
        </div>

        <nav style={{ padding: '24px 12px', flex: 1 }}>
          <SidebarBtn icon={Users} label="Clientes" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <SidebarBtn icon={Plus} label="Novo Cliente" active={activeTab === 'register'} onClick={() => setActiveTab('register')} />
          <SidebarBtn icon={Activity} label="Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Logado como:</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{localStorage.getItem('cd_admin_email')}</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/auth'); }} className="btn-secondary w-full" style={{ padding: '12px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '24px 40px', overflowY: 'auto', zIndex: 1, position: 'relative' }}>
        
        <header className="fade-in" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Painel Geral</h1>
            <p className="text-muted" style={{ fontSize: '15px' }}>Gerenciamento avançado de clientes e propriedades.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Buscar clientes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-glass" style={{ paddingLeft: '48px', width: '300px', height: '48px' }} />
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('register')} style={{ height: '48px', padding: '0 24px' }}>
              <Plus size={20} /> Adicionar
            </button>
          </div>
        </header>

        {/* STATS */}
        <div className="fade-in delay-100" style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
           <StatCard title="Clientes Ativos" value={clients.length} icon={Users} color="var(--primary)" />
           <StatCard title="Total de Unidades" value={totalUnits} icon={Building2} color="#10B981" />
           <StatCard title="Status do Sistema" value="ONLINE" icon={Activity} color="#F59E0B" />
        </div>

        {activeTab === 'clients' && (
          <section className="fade-in delay-200">
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Lista de Clientes</h3>
                <button onClick={fetchClients} className="btn-secondary" style={{ padding: '8px', borderRadius: '12px' }}><RefreshCw size={18} /></button>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cliente / Propriedade</th>
                      <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Contato</th>
                      <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Códigos de Acesso</th>
                      <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Vencimento</th>
                      <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados...</td></tr>
                    ) : filteredClients.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</td></tr>
                    ) : filteredClients.map(client => (
                      <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{client.clientName || 'Cliente sem nome'}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}><Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />{client.name} ({client.type})</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px', fontFamily: 'monospace' }}>ID: {client.id}</div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontSize: '13px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} color="var(--primary)" /> {client.adminEmail}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> {client.clientPhone || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Cód. Admin:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', letterSpacing: '1px' }}>{client.clientCode || 'N/A'}</span>
                              <button onClick={() => copyToClipboard(client.clientCode)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Copy size={14} /></button>
                            </div>
                          </div>
                          {(client.type === 'condo' || client.type === 'village') && (
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Cód. Porteiro:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', letterSpacing: '1px' }}>{client.doormanCode || 'N/A'}</span>
                                <button onClick={() => copyToClipboard(client.doormanCode)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Copy size={14} /></button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>{fmtDate(client.nextPaymentDate)}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{client.units?.length || 0} unid.</div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <a href={client.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '8px', borderRadius: '8px' }} title="Acessar Campainha"><ExternalLink size={16} /></a>
                            <button onClick={() => deleteClient(client.id)} className="btn-secondary" style={{ padding: '8px', borderRadius: '8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} title="Excluir"><Trash2 size={16} /></button>
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
          <section className="fade-in delay-200">
            <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '50%', marginBottom: '16px' }}>
                  <User size={32} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>Cadastro de Cliente</h2>
                <p className="text-muted">Preencha os dados detalhados para gerar os acessos e códigos únicos.</p>
              </div>

              <form onSubmit={handleRegisterClient}>
                
                {/* Etapa 1: QR Code */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ScanLine size={16}/> 1. Vincular Placa Física</h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" placeholder="Escaneie o QR Code ou cole o ID..." value={scannedId} onChange={e => setScannedId(e.target.value)} className="input-glass" style={{ flex: 1, fontFamily: 'monospace' }} required />
                    <button type="button" onClick={startScanner} className="btn-primary" style={{ padding: '0 24px' }}>
                      <Camera size={20} />
                    </button>
                  </div>
                </div>

                {/* Etapa 2: Dados Pessoais */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16}/> 2. Dados do Cliente / Contrato</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Nome Completo / Razão Social *</label>
                      <input type="text" value={newClient.clientName} onChange={e => setNewClient({...newClient, clientName: e.target.value})} className="input-glass" required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>E-mail de Acesso (Admin) *</label>
                      <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="input-glass" required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Telefone / WhatsApp</label>
                      <input type="tel" value={newClient.clientPhone} onChange={e => setNewClient({...newClient, clientPhone: e.target.value})} className="input-glass" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>CPF / CNPJ</label>
                      <input type="text" value={newClient.clientDocument} onChange={e => setNewClient({...newClient, clientDocument: e.target.value})} className="input-glass" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Endereço Completo</label>
                    <input type="text" value={newClient.clientAddress} onChange={e => setNewClient({...newClient, clientAddress: e.target.value})} className="input-glass" />
                  </div>
                </div>

                {/* Etapa 3: Propriedade */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={16}/> 3. Configuração da Propriedade</h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Nome do Imóvel/Condomínio *</label>
                    <input type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="input-glass" required />
                  </div>

                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Tipo de Instalação</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { val: 'house', label: 'Casa Simples' },
                      { val: 'village', label: 'Vila de Casas' },
                      { val: 'condo', label: 'Condomínio' }
                    ].map(t => (
                      <button key={t.val} type="button" onClick={() => setNewClient({ ...newClient, type: t.val })} className="btn-secondary" style={{ padding: '12px', background: newClient.type === t.val ? 'rgba(0,229,255,0.1)' : 'transparent', borderColor: newClient.type === t.val ? 'var(--primary)' : 'var(--border-subtle)', color: newClient.type === t.val ? 'var(--primary)' : 'var(--text-main)' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {newClient.type !== 'house' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Qtd. Unidades</label>
                        <input type="number" min="1" value={newClient.numUnits} onChange={e => setNewClient({ ...newClient, numUnits: parseInt(e.target.value) || 1 })} className="input-glass" required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>E-mail Porteiro (Opcional)</label>
                        <input type="email" value={newClient.doormanEmail} onChange={e => setNewClient({...newClient, doormanEmail: e.target.value})} className="input-glass" placeholder="Acesso Tablet Portaria" />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="submit" disabled={isRegistering} className="btn-primary" style={{ flex: 1, padding: '16px', fontSize: '16px', opacity: isRegistering ? 0.7 : 1 }}>
                    {isRegistering ? 'Gerando Acessos...' : 'Finalizar Cadastro e Gerar Códigos'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* SCANNER MODAL */}
        {showScanner && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(10px)' }}>
            <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', position: 'relative', overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><ScanLine size={18}/> Escaneamento Óptico</span>
                <button onClick={stopScanner} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '250px', height: '250px', border: '2px solid var(--primary)', borderRadius: '24px', boxShadow: '0 0 0 1000px rgba(0,0,0,0.6)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)', animation: 'scan-anim 2s linear infinite' }}></div>
                </div>
              </div>
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.5)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aponte a câmera para o QR Code para capturar a chave de segurança física.</p>
              </div>
            </div>
            <style>{`@keyframes scan-anim { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}</style>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px', background: active ? 'rgba(0, 229, 255, 0.1)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-muted)', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition-fast)', fontWeight: 600, fontSize: '14px', textAlign: 'left', marginBottom: '8px', borderLeft: active ? '4px solid var(--primary)' : '4px solid transparent' }}>
      <Icon size={18} /> {label}
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="glass-panel" style={{ flex: 1, padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', borderTop: `2px solid ${color}` }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
        <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{value}</h3>
      </div>
    </div>
  );
}
