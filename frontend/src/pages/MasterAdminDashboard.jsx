import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Download, Trash2, Home, Building2, TreePine, X, ShieldCheck, LogOut, ChevronRight, Settings, Camera, ScanLine, Clock, User, RefreshCw, Copy, Check, MessageCircle, CreditCard, Users, LayoutDashboard, Database, Activity, History, Settings2, Search, Bell, AlertTriangle, Briefcase, ExternalLink, PieChart, Server, Shield, Globe, FileText, Headphones, BarChart3, QrCode
} from 'lucide-react';
import Logo from '../components/Logo';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';



export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState('clients');
  const [clientsSubTab, setClientsSubTab] = useState('properties'); // 'properties' | 'users'
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedId, setScannedId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserForm, setEditUserForm] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isApproving, setIsApproving] = useState(false);
  const [userFilter, setUserFilter] = useState('all'); // all | pending | approved | manager

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const lastClientsStateRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [modalTab, setModalTab] = useState('info'); // 'info' | 'tech'

  useEffect(() => {
    if (selectedClient) {
      setModalTab('info');
    }
  }, [selectedClient]);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(current => current === msg ? null : current);
    }, 8000);
  };

  const [newClient, setNewClient] = useState({
    name: '', // Property Name
    type: 'house',
    billingModel: 'annual',
    numUnits: 1,
    clientName: '',
    email: '',
    clientPhone: '',
    clientDocument: '',
    clientAddress: '',
    doormanEmail: '',
    companyName: '',
    plan: 'Basic',
    customPrice: ''
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [supportTickets, setSupportTickets] = useState([]);

  useEffect(() => {
    const role = sessionStorage.getItem('cd_admin_role');
    if (role !== 'master') {
      navigate('/auth');
      return;
    }
    const loadAll = (hideLoading = false) => {
      fetchClients(hideLoading);
      fetchPendingUsers();
      fetchAllUsers();
      fetchSupportTickets();
    };
    loadAll(false);
    const interval = setInterval(() => { loadAll(true); }, 1200000); // Atualiza silenciosamente a cada 20 minutos
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchSupportTickets = async () => {
    try {
      const email = sessionStorage.getItem('cd_admin_email');
      const res = await fetch(`${API}/api/support?email=${encodeURIComponent(email)}&role=master`);
      const data = await res.json();
      setSupportTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const email = sessionStorage.getItem('cd_admin_email');
      const res = await fetch(`${API}/api/admin/pending-users?adminEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      setPendingUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const email = sessionStorage.getItem('cd_admin_email');
      const res = await fetch(`${API}/api/admin/all-users?adminEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async (hideLoading = false) => {
    if (!hideLoading) setLoading(true);
    try {
      const email = sessionStorage.getItem('cd_admin_email');
      const res = await fetch(`${API}/api/properties?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      
      // Compara com o estado anterior para disparar notificações se houver pagamentos novos
      const lastClientsState = lastClientsStateRef.current;
      if (lastClientsState && lastClientsState.length > 0) {
        data.forEach(newC => {
          const oldC = lastClientsState.find(o => o.id === newC.id);
          // Se o plano mudou para Anual ou se a data de validade aumentou significativamente
          if (oldC && (
            (oldC.plan !== 'Anual' && newC.plan === 'Anual') || 
            (new Date(newC.nextPaymentDate) > new Date(oldC.nextPaymentDate) + 5 * 24 * 60 * 60 * 1000)
          )) {
            const msg = `🎉 Pagamento confirmado para ${newC.clientName || newC.name}! Plano Anual ativado até ${new Date(newC.nextPaymentDate).toLocaleDateString('pt-BR')}.`;
            triggerToast(msg);
            setNotifications(prev => [{
              id: Date.now(),
              message: msg,
              time: new Date().toLocaleTimeString('pt-BR'),
              read: false
            }, ...prev]);
          }
        });
      }
      
      lastClientsStateRef.current = data;
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!hideLoading) setLoading(false);
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
    
    // Auto-generate name for houses if empty
    const propertyName = newClient.type === 'house' && !newClient.name 
      ? `Residência ${newClient.clientName}` 
      : newClient.name;

    if (!scannedId || !newClient.email || !newClient.clientName || (!propertyName && newClient.type !== 'house')) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch(`${API}/api/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scannedId,
          adminEmail: newClient.email,
          name: propertyName,
          type: newClient.type,
          billingModel: newClient.billingModel || 'annual',
          clientName: newClient.clientName,
          clientPhone: newClient.clientPhone,
          clientDocument: newClient.clientDocument,
          clientAddress: newClient.clientAddress,
          doormanEmail: newClient.doormanEmail,
          companyName: newClient.companyName,
          plan: newClient.plan,
          customPrice: newClient.customPrice === '' ? null : Number(newClient.customPrice),
          units: newClient.type !== 'house' ? Array.from({ length: newClient.numUnits }, (_, i) => ({ name: `Unidade ${i + 1}` })) : []
        })
      });

      if (res.ok) {
        const savedData = await res.json();
        const unitsList = savedData.units.map(u => `${u.name}: ${u.accessCode}`).join('\n');
        alert(`Cliente registrado com sucesso!\n\nACESSO ADMIN (Painel):\nE-mail: ${newClient.email}\nCódigo: ${savedData.clientCode}\n\nACESSO MORADORES (App):\n${unitsList}`);
        setScannedId('');
        setNewClient({
          name: '', type: 'house', numUnits: 1, clientName: '', email: '', clientPhone: '', clientDocument: '', clientAddress: '', doormanEmail: '', companyName: '', plan: 'Basic', customPrice: '', billingModel: 'annual'
        });
        setActiveTab('clients');
        fetchClients();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao registrar cliente.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAuthorizeUser = async (userId, action, propertyType) => {
    const adminEmail = sessionStorage.getItem('cd_admin_email');
    setIsApproving(true);
    try {
      const res = await fetch(`${API}/api/admin/authorize-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, userId, action, propertyType })
      });
      if (res.ok) {
        const msgs = { approve: 'Usuário aprovado!', deny: 'Usuário recusado.', promote: 'Usuário promovido a Gestor!', demote: 'Usuário rebaixado.' };
        alert(msgs[action] || 'Ação realizada.');
        fetchPendingUsers();
        fetchAllUsers();
        fetchClients();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao processar autorização.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReplyTicket = async (ticketId) => {
    const message = window.prompt("Digite sua resposta para o ticket:");
    if (!message) return;
    try {
      const email = sessionStorage.getItem('cd_admin_email');
      const res = await fetch(`${API}/api/support/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, senderEmail: email, senderRole: 'master' })
      });
      if (res.ok) {
        alert("Resposta enviada!");
        fetchSupportTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = allUsers.filter(u => {
    if (userFilter === 'pending') return u.status === 'pending';
    if (userFilter === 'approved') return u.status === 'approved' && u.role === 'user';
    if (userFilter === 'manager') return u.role === 'manager';
    return true;
  });

  const handleSaveEdit = async () => {
    try {
      const email = sessionStorage.getItem('cd_admin_email') || 'leandro2703palmeira@gmail.com';
      const res = await fetch(`${API}/api/properties/${encodeURIComponent(selectedClient.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, adminEmail: email })
      });
      if (res.ok) {
        alert('Dados updated com sucesso! ✅');
        setIsEditing(false);
        setSelectedClient(null);
        fetchClients();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Excluir esta conta de usuário permanentemente do sistema? ⚠️')) return;
    try {
      const adminEmail = sessionStorage.getItem('cd_admin_email') || 'leandro2703palmeira@gmail.com';
      const res = await fetch(`${API}/api/admin/users/${encodeURIComponent(userId)}?adminEmail=${encodeURIComponent(adminEmail)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Conta de usuário excluída com sucesso! ✅');
        fetchAllUsers();
        fetchPendingUsers();
      } else {
        alert('Erro ao excluir conta de usuário.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditUser = async () => {
    try {
      const adminEmail = sessionStorage.getItem('cd_admin_email') || 'leandro2703palmeira@gmail.com';
      const res = await fetch(`${API}/api/admin/users/${encodeURIComponent(selectedUser.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editUserForm, adminEmail })
      });
      if (res.ok) {
        alert('Dados da conta de usuário atualizados com sucesso! ✅');
        setIsEditingUser(false);
        setSelectedUser(null);
        fetchAllUsers();
        fetchPendingUsers();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erro ao atualizar dados do usuário.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteClient = async (id) => {
    if (!window.confirm('Excluir este cliente permanentemente?')) return;
    const email = sessionStorage.getItem('cd_admin_email') || 'leandro2703palmeira@gmail.com';
    try {
      const res = await fetch(`${API}/api/properties/${encodeURIComponent(id)}?adminEmail=${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Cliente excluído com sucesso! ✅');
        fetchClients();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erro ao excluir o cliente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao tentar excluir o cliente.');
    }
  };

  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clients, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `campainha_digital_db_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCSV = () => {
    if (clients.length === 0) return alert('Nenhum dado para exportar.');
    const headers = ['ID', 'Cliente', 'CPF/CNPJ', 'Empresa', 'Email', 'Telefone', 'Plano', 'Validade'];
    const rows = clients.map(c => [
      c.id,
      c.clientName || c.name || '',
      c.clientDocument || '',
      c.companyName || '',
      c.adminEmail || '',
      c.clientPhone || '',
      c.plan || '',
      c.nextPaymentDate ? new Date(c.nextPaymentDate).toLocaleDateString('pt-BR') : ''
    ]);
    
    // Adiciona BOM para abrir perfeitamente no Excel brasileiro (separado por ;)
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += headers.join(";") + "\n";
    rows.forEach(r => {
      csvContent += r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(";") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `campainha_digital_db_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.includes(searchQuery)
  );

  const totalUnits = clients.reduce((acc, c) => acc + (c.units ? c.units.length : 0), 0);

  const stats = [
    { label: 'Clientes Ativos', value: clients.length, icon: Users, color: '#3B82F6' },
    { label: 'Total de Unidades', value: totalUnits, icon: Building2, color: '#10B981' },
    { label: 'Usuários Cadastrados', value: allUsers.length, icon: User, color: '#6366F1' },
    { label: 'Gestores Ativos', value: allUsers.filter(u => u.role === 'manager').length, icon: ShieldCheck, color: '#F59E0B' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1E293B', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {toast && (
        <div className="fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0F172A', color: '#FFF', padding: '16px 24px', borderRadius: '16px', border: '1px solid #1E293B', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10000, maxWidth: '400px' }}>
          <div style={{ background: '#10B981', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>✓</div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '13px', color: '#10B981' }}>Nova Atualização Financeira</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', lineHeight: 1.4 }}>{toast}</p>
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>×</button>
        </div>
      )}
      
      {/* SIDEBAR - PREMIUM DARK DESIGN */}
      <aside style={{ width: '280px', background: '#070B14', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Logo size={32} light={true} />
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #10B981 0%, transparent 100%)', width: '40px', marginTop: '8px' }} />
        </div>

        <nav style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <SidebarLink icon={Users} label="Gestão de Clientes" active={activeTab === 'clients'} onClick={() => { setActiveTab('clients'); setClientsSubTab('properties'); }} />
          <SidebarLink icon={ShieldCheck} label="Solicitações de Gestão" active={activeTab === 'authorizations'} onClick={() => setActiveTab('authorizations')} count={pendingUsers.length} />
          <SidebarLink icon={Plus} label="Novo Registro" active={activeTab === 'register'} onClick={() => setActiveTab('register')} />
          
          <div style={{ padding: '24px 12px 8px', fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' }}>Sistema & Finanças</div>
          <SidebarLink icon={CreditCard} label="Financeiro / Pix" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
          <SidebarLink icon={Headphones} label="Suporte Técnico" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
          <SidebarLink icon={Settings2} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>LP</div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#F8FAFC', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Leandro Palmeira</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Administrador Master</p>
            </div>
          </div>
          <button onClick={() => { sessionStorage.clear(); localStorage.clear(); navigate('/auth'); }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', background: 'rgba(239, 68, 68, 0.05)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <LogOut size={14} /> Encerrar Sessão
          </button>
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#475569' }}>
            <div style={{ color: '#10B981', fontWeight: 800, marginBottom: '4px' }}>INOVA SIMPLES (I.S.)</div>
            <div>CNPJ: 65.628.833/0001-47</div>
            <div style={{ marginTop: '8px' }}>
              Central: <a href="https://wa.me/5521995879170" target="_blank" rel="noreferrer" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 'bold' }}>(21) 99587-9170</a>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main style={{ flex: 1, padding: '40px' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-1.5px' }}>
              {activeTab === 'clients' && (clientsSubTab === 'properties' ? "Visão Geral de Clientes" : "Gestão de Usuários")}
              {activeTab === 'register' && "Registrar Nova Placa"}
              {activeTab === 'authorizations' && "Aguardando Autorização"}
              {activeTab === 'billing' && "Financeiro & Assinaturas"}
              {activeTab === 'support' && "Central de Suporte"}
              {activeTab === 'settings' && "Configurações Globais"}
            </h2>
            <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px' }}>Controle total sobre a infraestrutura Campainha Digital.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
             <button 
               onClick={() => {
                 setShowNotifications(!showNotifications);
                 // Marca todas como lidas ao abrir o sino
                 setNotifications(prev => prev.map(n => ({ ...n, read: true })));
               }} 
               style={{ padding: '12px', borderRadius: '12px', background: '#FFF', border: '1px solid #E2E8F0', color: '#64748B', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
               title="Notificações Financeiras"
             >
               <Bell size={20}/>
               {notifications.some(n => !n.read) && (
                 <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }} />
               )}
             </button>
             
             {showNotifications && (
               <div className="fade-in" style={{ position: 'absolute', top: '56px', right: '180px', width: '340px', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 1000, padding: '16px', color: '#0F172A' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                   <strong style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notificações Financeiras</strong>
                   <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#10B981', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>Real-time</span>
                 </div>
                 {notifications.length === 0 ? (
                   <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>Nenhum pagamento recebido nesta sessão.</p>
                 ) : (
                   <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {notifications.map(n => (
                       <div key={n.id} style={{ padding: '10px', borderRadius: '10px', background: '#F8FAFC', borderLeft: '4px solid #10B981', fontSize: '12px' }}>
                         <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.4, fontWeight: 600 }}>{n.message}</p>
                         <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginTop: '6px', textAlign: 'right', fontWeight: 500 }}>{n.time}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             )}

             <button onClick={() => setActiveTab('register')} style={{ padding: '0 24px', height: '48px', borderRadius: '12px', background: '#3B82F6', color: '#FFF', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
               <Plus size={20} /> Novo Cliente
             </button>
          </div>
        </header>

        {/* STATS GRID */}
        {activeTab === 'clients' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: '#FFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ background: `${s.color}15`, padding: '10px', borderRadius: '12px' }}>
                    <s.icon size={24} color={s.color} />
                  </div>
                  <div style={{ color: '#10B981', fontSize: '12px', fontWeight: 700 }}>+12% ↑</div>
                </div>
                <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 600, margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '4px 0 0' }}>{s.value}</h3>
              </div>
            ))}
          </div>
        )}

        {/* MAIN VIEWS */}
        <div style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          {activeTab === 'clients' && (
            <>
              {/* Seleção de Sub-abas dentro de Gestão de Clientes */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '32px', gap: '24px' }}>
                <button 
                  onClick={() => setClientsSubTab('properties')}
                  style={{
                    padding: '12px 8px',
                    border: 'none',
                    background: 'none',
                    borderBottom: clientsSubTab === 'properties' ? '3px solid #3B82F6' : '3px solid transparent',
                    color: clientsSubTab === 'properties' ? '#3B82F6' : '#64748B',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Building2 size={16} /> Placas e Clientes ({clients.length})
                </button>
                <button 
                  onClick={() => setClientsSubTab('users')}
                  style={{
                    padding: '12px 8px',
                    border: 'none',
                    background: 'none',
                    borderBottom: clientsSubTab === 'users' ? '3px solid #3B82F6' : '3px solid transparent',
                    color: clientsSubTab === 'users' ? '#3B82F6' : '#64748B',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <User size={16} /> Contas de Usuários ({allUsers.length})
                </button>
              </div>

              {clientsSubTab === 'properties' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ position: 'relative', width: '400px' }}>
                  <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome, email, empresa ou documento..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFF', color: '#0F172A', fontWeight: 700, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
                    <Download size={16} /> Exportar CSV
                  </button>
                  <button onClick={exportToJSON} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFF', color: '#0F172A', fontWeight: 700, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
                    <Download size={16} /> Backup JSON
                  </button>
                  <button onClick={fetchClients} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                    <RefreshCw size={16} /> Atualizar Lista
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #F1F5F9' }}>
                      <th style={{ padding: '16px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Informações do Cliente</th>
                      <th style={{ padding: '16px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Contato & Empresa</th>
                      <th style={{ padding: '16px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Configuração / Plano</th>
                      <th style={{ padding: '16px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>QR Code & Códigos</th>
                      <th style={{ padding: '16px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Status / Pagamento</th>
                      <th style={{ padding: '16px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && clients.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Buscando base de dados...</td></tr>
                    ) : filteredClients.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Nenhum cliente cadastrado ou encontrado.</td></tr>
                    ) : filteredClients.map((client) => (
                      <tr key={client.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>{client.clientName || "Nome não informado"}</div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{client.clientDocument || "CPF/CNPJ pendente"}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontFamily: 'monospace', background: '#F1F5F9', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }}>{client.id}</div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={14} color="#6366F1"/> {client.companyName || "N/A"}</div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{client.adminEmail}</div>
                          <div style={{ fontSize: '13px', color: '#64748B' }}>{client.clientPhone}</div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                            <Building2 size={14} color="#10B981" /> {client.name}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                             <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>{client.type?.toUpperCase()}</span>
                             <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '100px', fontWeight: 700, marginLeft: '4px' }}>{client.plan || "PRO"}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button onClick={() => setSelectedClient(client)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFF', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                              <QrCode size={14} color="#3B82F6" /> Ver QR Code
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 800 }}>ADMIN</div>
                                <code style={{ fontWeight: 800, color: '#3B82F6', fontSize: '13px' }}>{client.clientCode}</code>
                              </div>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(client.clientCode); alert('Código Admin copiado!'); }}
                                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            
                            {client.type === 'individual' || client.type === 'house' ? (
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span>📱 Aparelhos:</span>
                                <strong style={{ color: (client.units?.[0]?.devices?.length || 0) >= 5 ? '#EF4444' : '#1E293B' }}>
                                  {client.units?.[0]?.devices?.length || 0} / 5
                                </strong>
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span>📱 Total Logins:</span>
                                <strong>
                                  {client.units?.reduce((acc, u) => acc + (u.devices?.length || 0), 0) || 0}
                                </strong>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{new Date(client.nextPaymentDate).toLocaleDateString('pt-BR')}</div>
                          {new Date(client.nextPaymentDate) > new Date() ? (
                            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Faltam {Math.ceil((new Date(client.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24))} dias
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>STATUS: VENCIDO</div>
                          )}
                          {client.plan !== 'Anual' && (
                            <button onClick={async () => {
                              if (!window.confirm('Liberar mais 15 dias de teste para este cliente?')) return;
                              try {
                                const res = await fetch(`${API}/api/properties/${encodeURIComponent(client.id)}/extend-trial`, { method: 'POST' });
                                if (res.ok) { alert('Teste liberado com sucesso!'); fetchClients(); }
                              } catch {}
                            }} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#3B82F6', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', display: 'block' }}>
                              Liberar +15 Dias Teste
                            </button>
                          )}
                           <div style={{ marginTop: '8px', fontSize: '10px', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }} title="Toda confirmação de pagamento e liberação de licenças ocorre de forma 100% automatizada e segura pelo Webhook do Abacate Pay.">
                             <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                             Abacate Pay Automático
                           </div>
                           
                           {client.paymentProof && (
                             <div style={{ marginTop: '8px', fontSize: '10px', color: '#475569', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '2px', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 10px', borderRadius: '8px', width: 'fit-content' }}>
                               <div style={{ fontSize: '8px', color: '#059669', textTransform: 'uppercase', fontWeight: 800 }}>Autenticação Pagamento</div>
                               <code style={{ fontSize: '9px', fontWeight: 800, color: '#065F46', display: 'block', wordBreak: 'break-all' }}>{client.paymentProof.id}</code>
                             </div>
                           )}
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setSelectedClient(client)} style={{ padding: '8px', borderRadius: '8px', background: '#F1F5F9', border: 'none', cursor: 'pointer' }} title="Detalhes/Editar"><ExternalLink size={16} /></button>
                            <button onClick={() => deleteClient(client.id)} style={{ padding: '8px', borderRadius: '8px', background: '#FFF1F2', border: 'none', cursor: 'pointer', color: '#E11D48' }} title="Excluir"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ padding: '10px' }}>
              <SectionTitle icon={User} title="Todos os Usuários Registrados" />
              <p style={{ color: '#64748B', marginTop: '8px' }}>Todos que fizeram cadastro no sistema. Gerencie papéis e autorizações.</p>
              
              {/* Filtros */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: `Todos (${allUsers.length})` },
                  { key: 'pending', label: `Pendentes (${allUsers.filter(u => u.status === 'pending').length})` },
                  { key: 'approved', label: `Usuários (${allUsers.filter(u => u.status === 'approved' && u.role === 'user').length})` },
                  { key: 'manager', label: `Gestores (${allUsers.filter(u => u.role === 'manager').length})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setUserFilter(f.key)} style={{ padding: '8px 16px', borderRadius: '100px', border: userFilter === f.key ? '2px solid #3B82F6' : '1px solid #E2E8F0', background: userFilter === f.key ? '#EFF6FF' : '#FFF', color: userFilter === f.key ? '#3B82F6' : '#64748B', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{f.label}</button>
                ))}
              </div>

              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
                  <Users size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                  <h3 style={{ color: '#64748B' }}>Nenhum usuário encontrado neste filtro</h3>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredUsers.map(user => (
                    <UserManagementCard 
                      key={user.id} 
                      user={user} 
                      onAction={handleAuthorizeUser} 
                      disabled={isApproving}
                      onEdit={(u) => { setSelectedUser(u); setEditUserForm(u); setIsEditingUser(true); }}
                      onDelete={handleDeleteUser}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

          {activeTab === 'authorizations' && (
            <div style={{ padding: '10px' }}>
              <SectionTitle icon={ShieldCheck} title="Promoção de Administradores" />
              <p style={{ color: '#64748B', marginTop: '8px' }}>Usuários que já vincularam uma placa e desejam converter sua conta em Gestor de Condomínio.</p>
              
              <div style={{ marginTop: '32px' }}>
                {pendingUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
                    <Users size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: '#64748B' }}>Nenhuma solicitação pendente</h3>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pendingUsers.map(user => (
                      <PendingUserCard 
                        key={user.id} 
                        user={user} 
                        onAuthorize={handleAuthorizeUser} 
                        disabled={isApproving}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 800 }}>Cadastro Detalhado de Empresa/Cliente</h3>
                <p style={{ color: '#64748B' }}>Vincule a placa física aos dados contratuais do cliente.</p>
              </div>

              <form onSubmit={handleRegisterClient} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                
                {/* Coluna 1: Dados Contratuais */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <SectionTitle icon={Briefcase} title="Dados da Empresa / Cliente" />
                  
                  <div>
                    <Label>Nome Completo ou Razão Social *</Label>
                    <Input type="text" value={newClient.clientName} onChange={e => setNewClient({...newClient, clientName: e.target.value})} required />
                  </div>

                  <div>
                    <Label>Nome da Empresa (Nome Fantasia)</Label>
                    <Input type="text" value={newClient.companyName} onChange={e => setNewClient({...newClient, companyName: e.target.value})} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <Label>E-mail Principal *</Label>
                      <Input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Telefone / WhatsApp *</Label>
                      <Input type="tel" value={newClient.clientPhone} onChange={e => setNewClient({...newClient, clientPhone: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <Label>CPF ou CNPJ</Label>
                      <Input type="text" value={newClient.clientDocument} onChange={e => setNewClient({...newClient, clientDocument: e.target.value})} />
                    </div>
                    <div>
                      <Label>Plano Escolhido</Label>
                      <select style={inputStyle} value={newClient.plan} onChange={e => setNewClient({...newClient, plan: e.target.value})}>
                        <option value="Basic">Basic (R$ 49/mês)</option>
                        <option value="Pro">Pro (R$ 149/mês)</option>
                        <option value="Enterprise">Enterprise (Custom)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Preço da Assinatura Anual (R$)</Label>
                    <Input type="number" step="0.01" placeholder="Deixe em branco para usar o preço padrão global (R$ 39,90)" value={newClient.customPrice} onChange={e => setNewClient({...newClient, customPrice: e.target.value})} />
                  </div>

                  <div>
                    <Label>Endereço de Faturamento</Label>
                    <Input type="text" value={newClient.clientAddress} onChange={e => setNewClient({...newClient, clientAddress: e.target.value})} />
                  </div>
                </div>

                {/* Coluna 2: Configuração Técnica */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <SectionTitle icon={ScanLine} title="Vincular Dispositivo (QR Code)" />
                  
                  <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                    <Label>ID da Placa (Física ou Digital) *</Label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input type="text" value={scannedId} onChange={e => setScannedId(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} required placeholder="ID da placa..." />
                      <button type="button" onClick={() => setScannedId(`CD_${Math.random().toString(36).substring(2, 10).toUpperCase()}`)} style={{ padding: '0 16px', borderRadius: '12px', background: '#3B82F6', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Gerar ID</button>
                      <button type="button" onClick={startScanner} style={{ padding: '0 16px', borderRadius: '12px', background: '#0F172A', color: '#FFF', border: 'none', cursor: 'pointer' }}><Camera size={20}/></button>
                    </div>
                  </div>

                  <SectionTitle icon={Building2} title="Instalação Local" />

                  {newClient.type !== 'house' && (
                    <div>
                      <Label>Nome do Condomínio / Local da Instalação *</Label>
                      <Input type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required placeholder="Ex: Edifício Solar das Palmeiras" />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <Label>Tipo de Propriedade</Label>
                      <select style={inputStyle} value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value})}>
                        <option value="house">Casa Simples</option>
                        <option value="village">Vila / Village</option>
                        <option value="condo">Condomínio Vertical</option>
                        <option value="collective">Escritórios / Coworking</option>
                      </select>
                    </div>
                    {newClient.type !== 'house' && (
                      <div>
                        <Label>Quantidade de Unidades</Label>
                        <Input type="number" min="1" value={newClient.numUnits} onChange={e => setNewClient({...newClient, numUnits: parseInt(e.target.value) || 1})} />
                      </div>
                    )}
                  </div>

                  {(newClient.type === 'condo' || newClient.type === 'village') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div>
                        <Label>Modelo de Cobrança ({newClient.type === 'condo' ? 'Condomínio' : 'Vila'})</Label>
                        <select 
                          style={inputStyle} 
                          value={newClient.billingModel || 'annual'} 
                          onChange={e => setNewClient({...newClient, billingModel: e.target.value})}
                        >
                          <option value="annual">Plano Anual Fixo</option>
                          <option value="monthly">
                            {newClient.type === 'condo' 
                              ? 'Assinatura Mensal (Base R$ 159,90 + R$ 1,55/un adicional)' 
                              : 'Assinatura Mensal (Base R$ 99,90 + R$ 1,20/un adicional)'}
                          </option>
                        </select>
                      </div>
                      
                      {newClient.billingModel === 'monthly' && (
                        <div style={{ fontSize: '11px', color: '#1E3A8A', background: '#EFF6FF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #BFDBFE', marginTop: '-8px' }}>
                          ℹ️ <strong>Assinatura Mensal Ativa:</strong> Cobrança base mensal de {newClient.type === 'condo' ? 'R$ 159,90 (até 100 unidades) + R$ 1,55 por cada unidade adicional' : 'R$ 99,90 (até 100 unidades) + R$ 1,20 por cada unidade adicional'}. O valor será calculado dinamicamente baseado na quantidade de unidades inserida.
                        </div>
                      )}
                    </div>
                  )}

                  {newClient.type !== 'house' && (
                    <div>
                      <Label>E-mail da Portaria (Acesso Tablet)</Label>
                      <Input type="email" value={newClient.doormanEmail} onChange={e => setNewClient({...newClient, doormanEmail: e.target.value})} placeholder="porteiro@condominio.com" />
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                    <button type="submit" disabled={isRegistering} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#3B82F6', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', opacity: isRegistering ? 0.7 : 1 }}>
                      {isRegistering ? "Processando Registro..." : "FINALIZAR E GERAR ACESSOS"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'billing' && (
            <BillingTab clients={clients} API={API} onRefresh={fetchClients} onDeleteClient={deleteClient} />
          )}

          {activeTab === 'support' && (
             <div style={{ padding: '10px' }}>
               <SectionTitle icon={Headphones} title="Central de Suporte" />
               <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {supportTickets.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                         Nenhum ticket de suporte no momento.
                      </div>
                    ) : (
                      supportTickets.map(ticket => (
                        <div key={ticket.id} style={{ padding: '20px', background: ticket.status === 'open' ? '#FFF1F2' : '#F8FAFC', border: `1px solid ${ticket.status === 'open' ? '#FECACA' : '#E2E8F0'}`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '10px', background: ticket.status === 'open' ? '#EF4444' : '#10B981', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                                {ticket.status === 'open' ? 'PENDENTE' : 'RESPONDIDO'}
                              </span>
                              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>TICKET #{ticket.id.slice(0,6).toUpperCase()}</span>
                            </div>
                            <h4 style={{ margin: '0 0 4px', fontWeight: 800 }}>{ticket.title}</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                               {ticket.message}<br/>
                               <small>Por: {ticket.userEmail} ({ticket.userRole})</small>
                            </p>
                            {ticket.replies && ticket.replies.length > 0 && (
                               <div style={{ marginTop: '12px', paddingLeft: '12px', borderLeft: '2px solid #E2E8F0', fontSize: '12px', color: '#475569' }}>
                                  <strong>Última resposta ({ticket.replies[ticket.replies.length-1].senderRole}):</strong> {ticket.replies[ticket.replies.length-1].message}
                               </div>
                            )}
                          </div>
                          <button onClick={() => handleReplyTicket(ticket.id)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#FFF', border: `1px solid ${ticket.status === 'open' ? '#EF4444' : '#3B82F6'}`, color: ticket.status === 'open' ? '#EF4444' : '#3B82F6', fontWeight: 700, cursor: 'pointer' }}>
                             RESPONDER
                          </button>
                        </div>
                      ))
                    )}
                 </div>
                 <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', height: 'fit-content' }}>
                    <h5 style={{ margin: '0 0 16px', fontWeight: 800 }}>Resumo de Suporte</h5>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>Tickets Abertos</span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>12</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>Tempo Médio</span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>14 min</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>Satisfação</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>98%</span>
                    </div>
                 </div>
               </div>
             </div>
           )}

          {activeTab === 'settings' && (
            <GlobalSettingsTab API={API} />
          )}

        </div>
      </main>

      {/* SCANNER MODAL */}
      {showScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#FFF', padding: '24px', borderRadius: '24px', width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Escaneando Placa</h3>
              <button onClick={stopScanner} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
            </div>
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '1' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: '40px', border: '2px solid #3B82F6', borderRadius: '24px', boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)' }}></div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748B', fontSize: '14px' }}>Aproxime a câmera do QR Code da campainha física.</p>
          </div>
        </div>
      )}

      {/* CLIENT DETAIL MODAL */}
      {selectedClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#FFF', padding: '40px', borderRadius: '32px', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Briefcase size={28} color="#3B82F6" /> Dossiê do Cliente
                </h3>
                <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: '13px' }}>ID Único da Placa: <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#0F172A', fontWeight: 700 }}>{selectedClient.id}</code></p>
              </div>
              <button onClick={() => { setSelectedClient(null); setIsEditing(false); }} style={{ padding: '8px', borderRadius: '12px', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}><X size={20}/></button>
            </div>

            {/* Abas do Modal */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #F1F5F9', marginBottom: '28px', paddingBottom: '2px' }}>
              <button 
                onClick={() => setModalTab('info')} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '10px 10px 0 0', 
                  border: 'none', 
                  background: 'none', 
                  color: modalTab === 'info' ? '#3B82F6' : '#64748B', 
                  borderBottom: modalTab === 'info' ? '3px solid #3B82F6' : '3px solid transparent',
                  fontWeight: 700, 
                  fontSize: '14px',
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FileText size={16} /> Dados Cadastrais
              </button>
              <button 
                onClick={() => setModalTab('tech')} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '10px 10px 0 0', 
                  border: 'none', 
                  background: 'none', 
                  color: modalTab === 'tech' ? '#3B82F6' : '#64748B', 
                  borderBottom: modalTab === 'tech' ? '3px solid #3B82F6' : '3px solid transparent',
                  fontWeight: 700, 
                  fontSize: '14px',
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Settings2 size={16} /> Configuração Técnica
              </button>
            </div>

            {/* Conteúdo Aba 1: Dados Cadastrais */}
            {modalTab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <DetailRow label="NOME COMPLETO DO TITULAR" value={selectedClient.clientName} isEdit={isEditing} onChange={v => setEditForm({...editForm, clientName: v})} />
                  <DetailRow label="CPF / CNPJ DO CLIENTE" value={selectedClient.clientDocument || "---"} isEdit={isEditing} onChange={v => setEditForm({...editForm, clientDocument: v})} />
                  <DetailRow label="NOME DA EMPRESA / CONDOMÍNIO (CONTRATUAL)" value={selectedClient.companyName || "Pessoa Física"} isEdit={isEditing} onChange={v => setEditForm({...editForm, companyName: v})} />
                </div>
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>E-MAIL ADMINISTRATIVO</div>
                    {isEditing ? (
                      <input 
                        type="email" 
                        value={editForm.adminEmail !== undefined ? editForm.adminEmail : selectedClient.adminEmail || ''} 
                        onChange={e => setEditForm({...editForm, adminEmail: e.target.value})} 
                        style={{ ...inputStyle, padding: '8px 12px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>{selectedClient.adminEmail || "---"}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>WHATSAPP / TELEFONE</div>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.clientPhone !== undefined ? editForm.clientPhone : selectedClient.clientPhone || ''} 
                        onChange={e => setEditForm({...editForm, clientPhone: e.target.value})} 
                        style={{ ...inputStyle, padding: '8px 12px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>{selectedClient.clientPhone || "---"}</div>
                    )}
                  </div>

                  <DetailRow label="ENDEREÇO DE FATURAMENTO" value={selectedClient.clientAddress || "---"} isEdit={isEditing} onChange={v => setEditForm({...editForm, clientAddress: v})} />
                  
                  <DetailRow 
                    label="PREÇO CUSTOMIZADO DE ASSINATURA (R$ - Ignora Padrão Global)" 
                    value={isEditing ? (editForm.customPrice !== undefined && editForm.customPrice !== null ? editForm.customPrice : '') : (selectedClient.customPrice !== undefined && selectedClient.customPrice !== null ? `R$ ${Number(selectedClient.customPrice).toFixed(2)} (${selectedClient.billingModel === 'monthly' ? 'por mês' : 'por ano'})` : (() => {
                      const cType = selectedClient.type || 'house';
                      const cModel = selectedClient.billingModel || 'annual';
                      if (cType === 'house') return "Usando Padrão Global Anual (R$ 39,90 / ano)";
                      if (cType === 'village') {
                        return cModel === 'monthly' 
                          ? `Usando Padrão Global Mensal (Base R$ 99,90/mês + R$ 1,20 por un. adic.)` 
                          : "Usando Padrão Global Anual (R$ 99,90 / ano)";
                      }
                      if (cType === 'condo') {
                        return cModel === 'monthly' 
                          ? `Usando Padrão Global Mensal (Base R$ 159,90/mês + R$ 1,55 por un. adic.)` 
                          : "Usando Padrão Global Anual (R$ 159,90 / ano)";
                      }
                      return "Usando Padrão Global";
                    })())} 
                    isEdit={isEditing} 
                    onChange={v => setEditForm({...editForm, customPrice: v === '' ? null : Number(v)})} 
                  />
                </div>
              </div>
            )}

            {/* Conteúdo Aba 2: Configuração Técnica */}
            {modalTab === 'tech' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                <div>
                  <DetailRow label="NOME DA INSTALAÇÃO (PROPRIEDADE)" value={selectedClient.name} isEdit={isEditing} onChange={v => setEditForm({...editForm, name: v})} />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>TIPO DE PROPRIEDADE</div>
                      {isEditing ? (
                        <select 
                          value={editForm.type !== undefined ? editForm.type : selectedClient.type || 'house'} 
                          onChange={e => setEditForm({...editForm, type: e.target.value})} 
                          style={{ ...inputStyle, padding: '8px 12px', fontSize: '14px' }}
                        >
                          <option value="house">Casa Simples</option>
                          <option value="village">Vila / Village</option>
                          <option value="condo">Condomínio Vertical</option>
                          <option value="collective">Escritórios / Coworking</option>
                        </select>
                      ) : (
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', textTransform: 'uppercase' }}>{selectedClient.type || 'house'}</div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>PLANO DO SISTEMA</div>
                      {isEditing ? (
                        <select 
                          value={editForm.plan !== undefined ? editForm.plan : selectedClient.plan || 'PRO'} 
                          onChange={e => setEditForm({...editForm, plan: e.target.value})} 
                          style={{ ...inputStyle, padding: '8px 12px', fontSize: '14px' }}
                        >
                          <option value="Basic">Basic (R$ 49/mês)</option>
                          <option value="Pro">Pro (R$ 149/mês)</option>
                          <option value="Enterprise">Enterprise (Custom)</option>
                          <option value="Anual">Anual (R$ 39,90)</option>
                        </select>
                      ) : (
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>{selectedClient.plan || "PRO"}</div>
                      )}
                    </div>
                  </div>

                  {((editForm.type !== undefined ? editForm.type : selectedClient.type) === 'condo' || 
                    (editForm.type !== undefined ? editForm.type : selectedClient.type) === 'village') && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                        MODELO DE COBRANÇA ({(editForm.type !== undefined ? editForm.type : selectedClient.type) === 'condo' ? 'CONDOMÍNIO' : 'VILA'})
                      </div>
                      {isEditing ? (
                        <select 
                          value={editForm.billingModel !== undefined ? editForm.billingModel : selectedClient.billingModel || 'annual'} 
                          onChange={e => setEditForm({...editForm, billingModel: e.target.value})} 
                          style={{ ...inputStyle, padding: '8px 12px', fontSize: '14px', width: '100%' }}
                        >
                          <option value="annual">Plano Anual Fixo</option>
                          <option value="monthly">
                            {(editForm.type !== undefined ? editForm.type : selectedClient.type) === 'condo'
                              ? 'Assinatura Mensal (Base R$ 159,90 + R$ 1,55/un adicional)'
                              : 'Assinatura Mensal (Base R$ 99,90 + R$ 1,20/un adicional)'}
                          </option>
                        </select>
                      ) : (
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', textTransform: 'uppercase' }}>
                          {(selectedClient.billingModel === 'monthly') ? 'Assinatura Mensal (Base + Adicional)' : 'Plano Anual Fixo'}
                        </div>
                      )}
                    </div>
                  )}

                  <DetailRow label="UNIDADES DETECTADAS" value={`${selectedClient.units?.length || 0} Unidade(s)`} />
                  <DetailRow label="ACESSOS TÉCNICOS" value={`CÓDIGO ADMIN: ${selectedClient.clientCode} | PORTARIA: ${selectedClient.doormanCode || 'N/A'}`} />
                  
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>URL PÚBLICA DE CHAMADA</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <code style={{ fontSize: '12px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        {`${window.location.origin}/chamada/${selectedClient.id}`}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/chamada/${selectedClient.id}`);
                          triggerToast('URL copiada para a área de transferência! 📋');
                        }}
                        style={{ padding: '10px', borderRadius: '8px', background: '#3B82F6', color: '#FFF', border: 'none', cursor: 'pointer' }}
                        title="Copiar URL"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px' }}>CÓDIGOS DE ACESSO INDIVIDUAIS (MORADORES)</div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                      {selectedClient.units?.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{u.name}</span>
                            <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                              📱 {u.devices?.length || 0}/5 logs
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <code style={{ color: '#10B981', fontWeight: 800, fontSize: '13px' }}>{u.accessCode}</code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(u.accessCode);
                                triggerToast(`Código de ${u.name} copiado! 📋`);
                              }}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: '#94A3B8' }}
                              title="Copiar Código"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!selectedClient.units || selectedClient.units.length === 0) && (
                        <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>Nenhuma unidade cadastrada.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '16px', letterSpacing: '0.5px' }}>QR CODE PARA IMPRESSÃO DA PLACA</div>
                  
                  <div id="print-qr-code" style={{ background: '#FFF', padding: '20px', borderRadius: '20px', border: '1px solid #CBD5E1', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                    <img 
                      src={selectedClient.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/chamada/${selectedClient.id}`)}`} 
                      alt="QR Code" 
                      style={{ width: '180px', height: '180px', display: 'block' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '20px' }}>
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedClient.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/chamada/${selectedClient.id}`)}`;
                        link.download = `qrcode_${selectedClient.id}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: '#0F172A', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Download size={14} /> Download PNG
                    </button>
                    
                    <button 
                      onClick={() => {
                        window.open(`${window.location.origin}/chamada/${selectedClient.id}`, '_blank');
                      }}
                      style={{ padding: '10px 14px', borderRadius: '10px', background: '#FFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={14} /> Testar Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ações do Modal */}
            <div style={{ marginTop: '40px', display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
              <button 
                onClick={() => {
                  const data = `
DOSSIÊ DE CLIENTE - CAMPAINHA DIGITAL
=======================================
CLIENTE: ${selectedClient.clientName}
CPF/CNPJ: ${selectedClient.clientDocument || 'Não informado'}
EMPRESA: ${selectedClient.companyName || 'Pessoa Física'}
EMAIL: ${selectedClient.adminEmail}
TELEFONE: ${selectedClient.clientPhone || 'Não informado'}
ENDEREÇO: ${selectedClient.clientAddress || 'Não informado'}
PREÇO ANUAL: ${selectedClient.customPrice !== null ? `R$ ${selectedClient.customPrice}` : 'Preço Padrão (R$ 39,90)'}

DADOS TÉCNICOS:
PROPRIEDADE: ${selectedClient.name}
TIPO: ${selectedClient.type}
PLANO: ${selectedClient.plan}
ID DA PLACA: ${selectedClient.id}

ACESSOS:
CÓDIGO ADMIN: ${selectedClient.clientCode}
CÓDIGO PORTARIA: ${selectedClient.doormanCode || 'N/A'}
URL: ${window.location.origin}/chamada/${selectedClient.id}
                  `;
                  navigator.clipboard.writeText(data.trim());
                  triggerToast('Dossiê completo copiado! 📋');
                }}
                style={{ padding: '14px 20px', borderRadius: '12px', background: '#0F172A', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
              >
                <Copy size={16} /> COPIAR DOSSIÊ
              </button>

              <button 
                onClick={async () => {
                  if (window.confirm(`⚠️ EXCLUSÃO PERMANENTE ⚠️\n\nTem certeza absoluta de que deseja excluir o cliente "${selectedClient.clientName || selectedClient.name}"?\n\nEsta ação excluirá a propriedade, todas as suas unidades e removerá permanentemente as contas de todos os usuários administradores/moradores associados no banco de dados. Esta ação é IRREVERSÍVEL!`)) {
                    await deleteClient(selectedClient.id);
                    setSelectedClient(null);
                  }
                }}
                style={{ padding: '14px 20px', borderRadius: '12px', background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECACA', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
              >
                <Trash2 size={16} /> EXCLUIR CLIENTE
              </button>

              <div style={{ flex: 1 }} />

              {isEditing ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => { setIsEditing(false); setEditForm({}); }} 
                    style={{ padding: '14px 20px', borderRadius: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveEdit} 
                    style={{ padding: '14px 24px', borderRadius: '12px', background: '#10B981', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                  >
                    SALVAR ALTERAÇÕES
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setIsEditing(true); setEditForm(selectedClient); }} 
                  style={{ padding: '14px 24px', borderRadius: '12px', background: '#3B82F6', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                >
                  EDITAR DADOS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER EDIT MODAL */}
      {selectedUser && isEditingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#FFF', padding: '40px', borderRadius: '32px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Editar Usuário</h3>
                <p style={{ color: '#64748B', margin: 0, fontSize: '13px' }}>ID: {selectedUser.id}</p>
              </div>
              <button onClick={() => { setSelectedUser(null); setIsEditingUser(false); }} style={{ padding: '8px', borderRadius: '12px', background: '#F1F5F9', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Label>Nome Completo</Label>
                <Input type="text" value={editUserForm.name || ''} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={editUserForm.email || ''} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input type="tel" value={editUserForm.whatsapp || ''} onChange={e => setEditUserForm({...editUserForm, whatsapp: e.target.value})} />
              </div>
              <div>
                <Label>ID de Placa Vinculada</Label>
                <Input type="text" value={editUserForm.scannedPropertyId || ''} onChange={e => setEditUserForm({...editUserForm, scannedPropertyId: e.target.value})} />
              </div>
              <div>
                <Label>Cargo / Role</Label>
                <select style={inputStyle} value={editUserForm.role || 'user'} onChange={e => setEditUserForm({...editUserForm, role: e.target.value})}>
                  <option value="user">Usuário Comum</option>
                  <option value="manager">Gestor de Condomínio</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select style={inputStyle} value={editUserForm.status || 'pending'} onChange={e => setEditUserForm({...editUserForm, status: e.target.value})}>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="denied">Recusado / Bloqueado</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button onClick={() => { setSelectedUser(null); setIsEditingUser(false); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSaveEditUser} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#10B981', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick, count }) {
  return (
    <button 
      onClick={onClick} 
      style={{ 
        width: '100%', 
        padding: '12px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        background: active ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)' : 'transparent', 
        color: active ? '#FFF' : '#64748B', 
        border: 'none', 
        borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
        borderRadius: '0 8px 8px 0', 
        cursor: 'pointer', 
        fontWeight: active ? 700 : 500, 
        fontSize: '14px', 
        transition: 'all 0.2s ease', 
        marginBottom: '2px', 
        textAlign: 'left', 
        position: 'relative' 
      }}
      onMouseEnter={e => { if(!active) e.currentTarget.style.color = '#94A3B8' }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.color = '#64748B' }}
    >
      <Icon size={18} color={active ? '#3B82F6' : '#475569'} style={{ filter: active ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none' }} /> 
      <span style={{ flex: 1 }}>{label}</span>
      {count > 0 && (
        <span style={{ background: '#EF4444', color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', position: 'absolute', right: '12px' }}>
          {count}
        </span>
      )}
    </button>
  );
}

function PendingUserCard({ user, onAuthorize, disabled }) {
  const [propertyType, setPropertyType] = useState('house');

  return (
    <div style={{ background: '#FFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="#94A3B8" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>{user.name}</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{user.email}</p>
            {user.whatsapp && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>WhatsApp: {user.whatsapp}</p>}
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8' }}>
          Placa vinculada: <code style={{ color: '#3B82F6', fontWeight: 700 }}>{user.scannedPropertyId || 'Nenhuma'}</code>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <Label>TIPO DE IMÓVEL</Label>
          <select 
            value={propertyType} 
            onChange={e => setPropertyType(e.target.value)}
            style={{ ...inputStyle, padding: '8px 12px', width: 'auto' }}
          >
            <option value="house">Casa Simples</option>
            <option value="village">Vila / Village</option>
            <option value="condo">Condomínio Vertical</option>
            <option value="collective">Escritórios</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => onAuthorize(user.id, 'approve', propertyType)}
            disabled={disabled}
            style={{ padding: '10px 20px', borderRadius: '10px', background: '#10B981', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}
          >
            Aprovar
          </button>
          <button 
            onClick={() => onAuthorize(user.id, 'deny')}
            disabled={disabled}
            style={{ padding: '10px 20px', borderRadius: '10px', background: '#FFF', border: '1px solid #EF4444', color: '#EF4444', fontWeight: 700, cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}

function UserManagementCard({ user, onAction, disabled, onEdit, onDelete }) {
  const [propertyType, setPropertyType] = useState('house');
  const isManager = user.role === 'manager';
  const isPending = user.role === 'user' && !!user.scannedPropertyId;
  const isDenied = user.status === 'denied';

  const statusColors = {
    pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pendente' },
    approved: { bg: '#D1FAE5', color: '#065F46', label: 'Aprovado' },
    denied: { bg: '#FEE2E2', color: '#991B1B', label: 'Recusado' },
  };
  const roleColors = {
    user: { bg: '#E0E7FF', color: '#3730A3', label: 'Usuário' },
    manager: { bg: '#DBEAFE', color: '#1E40AF', label: 'Gestor' },
  };

  const st = statusColors[user.status] || statusColors.pending;
  const rl = roleColors[user.role] || roleColors.user;

  return (
    <div style={{ background: '#FFF', padding: '20px 24px', borderRadius: '16px', border: `1px solid ${isManager ? '#BFDBFE' : '#E2E8F0'}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isManager ? '#EFF6FF' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: isManager ? '#3B82F6' : '#64748B' }}>
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{user.name}</h4>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>{user.email}</p>
            {user.whatsapp && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>WhatsApp: {user.whatsapp}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: st.bg, color: st.color }}>{st.label}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: rl.bg, color: rl.color }}>{rl.label}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '12px', flexWrap: 'wrap' }}>
        <div><strong style={{ color: '#94A3B8' }}>Cadastro:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')}</div>
        <div><strong style={{ color: '#94A3B8' }}>Placa:</strong> <code style={{ color: '#3B82F6', fontWeight: 700 }}>{user.scannedPropertyId || 'Nenhuma'}</code></div>
        {user.paymentChoice && (
          <div><strong style={{ color: '#94A3B8' }}>Plano Selecionado:</strong> <span style={{ color: user.paymentChoice === 'annual' ? '#3B82F6' : '#F59E0B', fontWeight: 700 }}>{user.paymentChoice === 'annual' ? 'Anual' : 'Teste 15 dias'}</span></div>
        )}
        {user.property && (
          <>
            <div><strong style={{ color: '#94A3B8' }}>Propriedade:</strong> {user.property.name}</div>
            <div><strong style={{ color: '#94A3B8' }}>Tipo:</strong> {user.property.type?.toUpperCase()}</div>
            <div><strong style={{ color: '#94A3B8' }}>Unidades:</strong> {user.property.unitsCount}</div>
          </>
        )}
      </div>

      {/* Imagem do QR Code Capturada */}
      {user.qrImage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <img src={user.qrImage} alt="QR Escaneado" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #CBD5E1' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Imagem Capturada da Placa</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Confirmando vínculo físico.</div>
          </div>
        </div>
      )}

      {/* Property card if manager */}
      {isManager && user.property && (
        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color="#0369A1" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0C4A6E' }}>{user.property.name}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#0369A1' }}><strong>Admin:</strong> <code>{user.property.clientCode}</code></div>
          {user.property.doormanCode && <div style={{ fontSize: '12px', color: '#0369A1' }}><strong>Portaria:</strong> <code>{user.property.doormanCode}</code></div>}
          <div style={{ fontSize: '12px', color: '#0369A1' }}><strong>{user.property.unitsCount}</strong> unidade{user.property.unitsCount !== 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Seletor de Cargo (Sempre visível para usuários aprovados) */}
        {!isDenied && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>CARGO:</span>
            <select 
              value={user.role} 
              onChange={(e) => {
                const newRole = e.target.value;
                if (newRole === 'manager') {
                  onAction(user.id, 'promote', propertyType);
                } else {
                  onAction(user.id, 'demote');
                }
              }}
              disabled={disabled}
              style={{ ...inputStyle, padding: '6px 10px', width: 'auto', fontSize: '12px', border: isManager ? '1px solid #3B82F6' : '1px solid #E2E8F0' }}
            >
              <option value="user">Usuário Normal</option>
              <option value="manager">Gestor de Condomínio</option>
            </select>

            {user.role === 'user' && (
              <>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginLeft: '8px' }}>TIPO SE PROMOVER:</span>
                <select value={propertyType} onChange={e => setPropertyType(e.target.value)} style={{ ...inputStyle, padding: '6px 10px', width: 'auto', fontSize: '12px' }}>
                  <option value="house">Individual / Casa</option>
                  <option value="village">Vila / Village</option>
                  <option value="condo">Condomínio</option>
                </select>
              </>
            )}
            {user.role === 'manager' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>PORTÃO:</span>
                <button 
                  onClick={() => {
                    // Aqui precisaríamos de um endpoint para atualizar a propriedade diretamente
                    // Por enquanto vamos simular a atualização local ou usar o authorize-user se estendido
                    onAction(user.id, 'toggleGate');
                  }}
                  style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: user.property?.hasGateFeature ? '#10B981' : '#F1F5F9',
                    color: user.property?.hasGateFeature ? '#FFF' : '#64748B',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {user.property?.hasGateFeature ? 'ATIVADO' : 'DESATIVADO'}
                </button>
              </div>
            )}
          </div>
        )}

        {isDenied && (
          <button onClick={() => onAction(user.id, 'approve', propertyType)} disabled={disabled} style={{ padding: '8px 18px', borderRadius: '10px', background: '#10B981', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}>Reativar</button>
        )}
        
        {!isDenied && (
          <button onClick={() => onAction(user.id, 'deny')} disabled={disabled} style={{ padding: '8px 18px', borderRadius: '10px', background: '#FFF', border: '1px solid #EF4444', color: '#EF4444', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}>Recusar / Bloquear</button>
        )}

        {onEdit && (
          <button 
            onClick={() => onEdit(user)} 
            disabled={disabled} 
            style={{ padding: '8px 18px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#3B82F6', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}
          >
            Editar
          </button>
        )}
        
        {onDelete && (
          <button 
            onClick={() => onDelete(user.id)} 
            disabled={disabled} 
            style={{ padding: '8px 18px', borderRadius: '10px', background: '#FFF1F2', border: '1px solid #FECACA', color: '#E11D48', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}
          >
            Excluir Conta
          </button>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
      <Icon size={18} color="#3B82F6" />
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{children}</label>;
}

const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFF', outline: 'none', fontSize: '14px', color: '#1E293B' };
function Input(props) { return <input {...props} style={inputStyle} />; }

function DetailRow({ label, value, isEdit, onChange }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>{label}</div>
      {isEdit && onChange ? (
        <input 
          type="text" 
          defaultValue={value === '---' || value === 'Pessoa Física' ? '' : value} 
          onChange={e => onChange(e.target.value)} 
          style={{ ...inputStyle, padding: '8px 12px' }}
        />
      ) : (
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>{value || "---"}</div>
      )}
    </div>
  );
}

// ─── COMPONENTE FINANCEIRO COMPLETO ─────────────────────────────────────────
function BillingTab({ clients, API, onRefresh, onDeleteClient }) {
  const [loading, setLoading] = useState(false);
  const [generatingPix, setGeneratingPix] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [billingFilter, setBillingFilter] = useState('all');

  const now = new Date();

  // Cálculos reais
  const annualClients  = clients.filter(c => c.plan === 'Anual');
  const trialClients   = clients.filter(c => c.plan !== 'Anual' && new Date(c.nextPaymentDate) > now);
  const expiredClients = clients.filter(c => new Date(c.nextPaymentDate) <= now);
  const expiringIn7    = clients.filter(c => {
    const diff = (new Date(c.nextPaymentDate) - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });

  // MRR: R$ 39,90 por cliente anual (dividido em 12 meses) + trial considera 0 receita garantida
  const mrr = (annualClients.length * 39.90 / 12).toFixed(2);
  const arr = (annualClients.length * 39.90).toFixed(2);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(todayStart);
  thisWeekStart.setDate(todayStart.getDate() - todayStart.getDay()); // Domingo

  let vendasHoje = 0;
  let vendasSemana = 0;
  annualClients.forEach(c => {
    const paymentDate = new Date(new Date(c.nextPaymentDate).getTime() - (365 * 24 * 60 * 60 * 1000));
    if (paymentDate >= todayStart) vendasHoje++;
    if (paymentDate >= thisWeekStart) vendasSemana++;
  });

  const faturamentoHoje = (vendasHoje * 39.90).toFixed(2);
  const faturamentoSemana = (vendasSemana * 39.90).toFixed(2);

  const filtered = billingFilter === 'all'     ? clients
    : billingFilter === 'annual'   ? annualClients
    : billingFilter === 'trial'    ? trialClients
    : billingFilter === 'expired'  ? expiredClients
    : expiringIn7;

  const handleGeneratePix = async (client) => {
    setGeneratingPix(client.id);
    setPixData(null);
    try {
      const res = await fetch(`${API}/api/payment/abacate/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: client.id })
      });
      const data = await res.json();
      if (data.success) {
        setPixData({ ...data, clientName: client.clientName || client.name, propertyId: client.id });
      } else {
        alert(data.error || 'Erro ao gerar cobrança.');
      }
    } catch (e) {
      alert('Erro de conexão ao gerar Pix.');
    } finally {
      setGeneratingPix(null);
    }
  };

  const handleActivateAnnual = async (clientId) => {
    if (!window.confirm('Confirmar pagamento e liberar 12 meses de acesso?')) return;
    setLoading(true);
    try {
    const res = await fetch(`${API}/api/properties/${encodeURIComponent(clientId)}/activate-annual`, { method: 'POST' });
    if (res.ok) { alert('Acesso anual liberado com sucesso! ✅'); onRefresh(); setPixData(null); }
    } catch (e) { alert('Erro ao processar.'); }
    finally { setLoading(false); }
  };

  const handleExtendTrial = async (clientId) => {
    if (!window.confirm('Liberar mais 15 dias de teste para este cliente?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/properties/${encodeURIComponent(clientId)}/extend-trial`, { method: 'POST' });
      if (res.ok) { alert('Mais 15 dias de teste liberados! ✅'); onRefresh(); }
    } catch (e) { alert('Erro ao processar.'); }
    finally { setLoading(false); }
  };

  const getStatusBadge = (client) => {
    if (client.plan === 'Anual') return { label: 'ANUAL ATIVO', color: '#10B981', bg: '#ECFDF5' };
    const diff = Math.ceil((new Date(client.nextPaymentDate) - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0)  return { label: 'VENCIDO', color: '#EF4444', bg: '#FFF1F2' };
    if (diff <= 7)  return { label: `VENCE EM ${diff}D`, color: '#F59E0B', bg: '#FFFBEB' };
    return { label: `TRIAL (${diff}d)`, color: '#3B82F6', bg: '#EFF6FF' };
  };

  return (
    <div style={{ padding: '20px' }}>
      <SectionTitle icon={CreditCard} title="Financeiro & Assinaturas" />

      {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '24px', marginBottom: '32px' }}>
        {[
          { label: 'Previsão (ARR)', value: `R$ ${arr}`, sub: `${annualClients.length} assinantes`, bg: 'linear-gradient(135deg, #059669, #10B981)' },
          { label: 'Faturamento Hoje', value: `R$ ${faturamentoHoje}`, sub: `${vendasHoje} vendas confirmadas`, bg: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' },
          { label: 'Vendas na Semana', value: vendasSemana, sub: `R$ ${faturamentoSemana} gerados`, bg: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' },
          { label: 'Em Trial / Exp.', value: `${trialClients.length} / ${expiredClients.length}`, sub: 'Clientes inativos ou no teste', bg: 'linear-gradient(135deg, #D97706, #F59E0B)' },
        ].map((k, i) => (
          <div key={i} style={{ 
            padding: '24px', 
            background: k.bg, 
            borderRadius: '24px', 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s ease-in-out',
            color: '#FFF'
          }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>{k.label}</p>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFF', margin: '8px 0 4px', letterSpacing: '-0.5px' }}>{k.value}</div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── ALERTA VENCENDO ───────────────────────────────────────────────── */}
      {expiringIn7.length > 0 && (
        <div style={{ padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} color="#F59E0B" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#92400E' }}>
            <strong>{expiringIn7.length} cliente(s)</strong> com período de teste vencendo nos próximos 7 dias. Envie uma cobrança Pix agora!
          </span>
        </div>
      )}

      {/* ── FILTROS ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'all',     label: `Todos (${clients.length})` },
          { key: 'annual',  label: `Anuais (${annualClients.length})` },
          { key: 'trial',   label: `Trial (${trialClients.length})` },
          { key: 'expiring',label: `Vencendo (${expiringIn7.length})` },
          { key: 'expired', label: `Vencidos (${expiredClients.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setBillingFilter(f.key)}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '100px', 
              border: billingFilter === f.key ? '2px solid #3B82F6' : '1px solid #E2E8F0', 
              background: billingFilter === f.key ? '#EFF6FF' : '#FFF', 
              color: billingFilter === f.key ? '#3B82F6' : '#64748B', 
              fontWeight: 700, 
              fontSize: '13px', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: billingFilter === f.key ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
            }}>
            {f.label}
          </button>
        ))}
        <button onClick={onRefresh} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#3B82F6', fontWeight: 800, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
          <RefreshCw size={16} /> Atualizar Lista
        </button>
      </div>

      {/* ── TABELA DE CLIENTES ────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)', background: '#FFF' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', textAlign: 'left', borderBottom: '2px solid #F1F5F9' }}>
              {['Cliente', 'Email', 'Tipo / Plano', 'Vencimento', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ padding: '18px 20px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '15px' }}>Nenhum cliente neste filtro.</td></tr>
            ) : filtered.map(client => {
              const badge = getStatusBadge(client);
              const daysLeft = Math.ceil((new Date(client.nextPaymentDate) - now) / (1000 * 60 * 60 * 24));
              return (
                <tr key={client.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFF'}>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>{client.clientName || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', background: '#F1F5F9', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>{client.id}</div>
                  </td>
                  <td style={{ padding: '20px', color: '#475569', fontWeight: 500 }}>{client.adminEmail}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '100px', fontWeight: 700, marginRight: '6px' }}>{(client.type || 'house').toUpperCase()}</span>
                    <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>{client.plan || 'Trial'}</span>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{new Date(client.nextPaymentDate).toLocaleDateString('pt-BR')}</div>
                    <div style={{ fontSize: '11px', color: daysLeft <= 0 ? '#EF4444' : daysLeft <= 7 ? '#F59E0B' : '#64748B', marginTop: '2px', fontWeight: 600 }}>
                      {daysLeft <= 0 ? `Vencido há ${Math.abs(daysLeft)} dias` : `${daysLeft} dias restantes`}
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '6px 12px', borderRadius: '100px', fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                      {badge.label}
                    </span>
                    {client.paymentProof && (
                      <div style={{ marginTop: '8px', padding: '8px 10px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', fontSize: '10px', color: '#065F46', fontFamily: 'monospace', maxWidth: '200px' }}>
                        <strong>Comprovante Pix:</strong>
                        <div style={{ wordBreak: 'break-all', fontWeight: 700, marginTop: '2px', fontSize: '9px' }}>{client.paymentProof.id}</div>
                        <div style={{ marginTop: '4px', fontSize: '9px' }}>
                          <strong>Valor:</strong> R$ {Number(client.paymentProof.value).toFixed(2)}<br/>
                          <strong>Data:</strong> {new Date(client.paymentProof.date).toLocaleDateString('pt-BR')} {new Date(client.paymentProof.date).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Gerar Pix */}
                      <button
                        onClick={() => handleGeneratePix(client)}
                        disabled={generatingPix === client.id || loading}
                        title="Gerar cobrança Pix"
                        style={{ 
                          padding: '8px 14px', 
                          borderRadius: '10px', 
                          background: '#3B82F6', 
                          color: '#FFF', 
                          border: 'none', 
                          fontWeight: 700, 
                          fontSize: '12px', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                          transition: 'all 0.2s'
                        }}>
                        <CreditCard size={14} /> {generatingPix === client.id ? 'Gerando...' : 'Gerar Pix'}
                      </button>
                      {/* Confirmar Pagamento Manual */}
                      {client.plan !== 'Anual' && (
                        <button
                          onClick={() => handleActivateAnnual(client.id)}
                          disabled={loading}
                          title="Confirmar pagamento manual e liberar 12 meses"
                          style={{ 
                            padding: '8px 14px', 
                            borderRadius: '10px', 
                            background: '#10B981', 
                            color: '#FFF', 
                            border: 'none', 
                            fontWeight: 700, 
                            fontSize: '12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                            transition: 'all 0.2s'
                          }}>
                          <Check size={14} /> Confirmar
                        </button>
                      )}
                      {/* Liberar Teste */}
                      {client.plan !== 'Anual' && (
                        <button
                          onClick={() => handleExtendTrial(client.id)}
                          disabled={loading}
                          title="Liberar mais 15 dias de teste"
                          style={{ 
                            padding: '8px 14px', 
                            borderRadius: '10px', 
                            background: '#F59E0B', 
                            color: '#FFF', 
                            border: 'none', 
                            fontWeight: 700, 
                            fontSize: '12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                            transition: 'all 0.2s'
                          }}>
                          <Clock size={14} /> +15 dias
                        </button>
                      )}
                      {/* Excluir Cliente */}
                      {onDeleteClient && (
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          disabled={loading}
                          title="Excluir cliente permanentemente"
                          style={{ 
                            padding: '8px 14px', 
                            borderRadius: '10px', 
                            background: '#EF4444', 
                            color: '#FFF', 
                            border: 'none', 
                            fontWeight: 700, 
                            fontSize: '12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                            transition: 'all 0.2s'
                          }}>
                          <Trash2 size={14} /> Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MODAL PIX ─────────────────────────────────────────────────────── */}
      {pixData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '40px', maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '20px' }}>Cobrança Pix Gerada</h3>
              <button onClick={() => setPixData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={24} /></button>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748B' }}>Cliente: <strong>{pixData.clientName}</strong></p>

            </div>

            {pixData.pixQrCode ? (
              <>
                <img
                  src={`data:image/png;base64,${pixData.pixQrCode}`}
                  alt="QR Code Pix"
                  style={{ width: '200px', height: '200px', borderRadius: '16px', border: '2px solid #E2E8F0', marginBottom: '20px' }}
                />
                <div style={{ background: '#F1F5F9', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>Copia e Cola Pix:</p>
                  <code style={{ fontSize: '10px', wordBreak: 'break-all', color: '#475569' }}>{pixData.pixCopiaECola?.slice(0, 80)}...</code>
                  <button onClick={() => { navigator.clipboard.writeText(pixData.pixCopiaECola); alert('Código copiado!'); }}
                    style={{ marginTop: '8px', padding: '6px 16px', borderRadius: '8px', background: '#3B82F6', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'block', width: '100%' }}>
                    📋 Copiar Código
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: '#EF4444' }}>Erro ao carregar QR Code.</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => setPixData(null)}
                style={{ padding: '12px', borderRadius: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Fechar
              </button>
              <button onClick={() => handleActivateAnnual(pixData.propertyId)}
                style={{ padding: '12px', borderRadius: '12px', background: '#10B981', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                ✅ Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RODAPÉ INFORMATIVO ────────────────────────────────────────────── */}
      <div style={{ marginTop: '32px', padding: '20px 24px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>ℹ️ Como funciona o Financeiro</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '13px', color: '#64748B' }}>
          <div><strong style={{ color: '#3B82F6' }}>🔵 Gerar Pix:</strong> Cria uma cobrança real via Pix e exibe o QR Code para o cliente escanear.</div>
          <div><strong style={{ color: '#10B981' }}>🟢 Confirmar:</strong> Libera manualmente 12 meses de acesso (use quando o pagamento for confirmado fora do sistema).</div>
          <div><strong style={{ color: '#F59E0B' }}>🟡 +15 dias:</strong> Estende o período de teste sem cobrança. Útil para clientes em avaliação.</div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#94A3B8' }}>
          💡 Quando o cliente pagar via Pix, o gateway de pagamentos acionará o Webhook automaticamente e renovará o plano sozinho, de forma instantânea.
        </p>
      </div>
    </div>
  );
}

// ─── COMPONENTE CONFIGURAÇÕES GLOBAIS ───────────────────────────────────────
function GlobalSettingsTab({ API }) {
  const [config, setConfig] = useState({
    servicePriceAnnual: 39.90,
    servicePriceAnnualSimple: 39.90,
    servicePriceAnnualCondo: 159.90,
    servicePriceAnnualVilla: 99.90,
    condoMonthlyBasePrice: 159.90,
    condoMonthlyAdditionalPrice: 1.55,
    villaMonthlyBasePrice: 99.90,
    villaMonthlyAdditionalPrice: 1.20,
    trialDays: 15,
    planName: 'Anual',
    pixDueDays: 3,
    companyName: 'Campainha Digital',
    supportWhatsApp: '5521995879170',
    customPixKey: '',
    customPixCopiaECola: '',
    customPixQrCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null); // ID do tooltip ativo para o tour explicativo
  const [showTour, setShowTour] = useState(true); // Exibe o guia interativo no topo

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error('Erro ao buscar config', e);
    }
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Configurações globais salvas com sucesso! ✅');
      } else {
        alert('Erro ao salvar configurações.');
      }
    } catch (e) {
      alert('Erro de conexão ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const tooltipsData = {
    servicePriceAnnualSimple: "Valor fixo cobrado por ano para o plano de Casa Simples (imóvel individual).",
    servicePriceAnnualVilla: "Valor fixo cobrado por ano para o plano de Vila de Casas (Village).",
    servicePriceAnnualCondo: "Valor fixo cobrado por ano para o plano de Condomínio Vertical.",
    condoMonthlyBasePrice: "Preço mínimo mensal cobrado para Condomínios Verticais. Cobre até 100 unidades ativas.",
    condoMonthlyAdditionalPrice: "Valor cobrado mensalmente por cada unidade adicional além das 100 primeiras no plano de Condomínio.",
    villaMonthlyBasePrice: "Preço mínimo mensal cobrado para Vilas / Villages. Cobre até 100 unidades ativas.",
    villaMonthlyAdditionalPrice: "Valor cobrado mensalmente por cada unidade adicional além das 100 primeiras no plano de Vila.",
    planName: "Nome que será exibido aos clientes nas telas de pagamento (Ex: 'Anual Premium', 'Mensal Recorrente').",
    pixDueDays: "Prazo de validade em dias para o QR Code Pix gerado para pagamento no onboarding do cliente.",
    trialDays: "Quantidade de dias gratuitos oferecidos no cadastro inicial antes do bloqueio por falta de pagamento.",
    companyName: "Nome da plataforma utilizado nos cabeçalhos, e-mails e telas públicas.",
    supportWhatsApp: "WhatsApp oficial com DDI e DDD que será exibido nos botões de ajuda e suporte ao cliente.",
    customPixKey: "Chave Pix para onde o dinheiro deve ir (CNPJ, Celular, etc) caso queira receber direto na sua conta.",
    customPixCopiaECola: "Código completo de 'Copia e Cola' do Pix estático gerado no seu banco.",
    customPixQrCode: "Link público de imagem ou dados brutos em Base64 do QR Code para exibição na tela de onboarding."
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <SectionTitle icon={Settings2} title="Configurações Globais do SaaS" />
        <button 
          onClick={() => setShowTour(!showTour)} 
          style={{ padding: '8px 16px', borderRadius: '20px', background: showTour ? '#EFF6FF' : '#F1F5F9', border: `1px solid ${showTour ? '#BFDBFE' : '#E2E8F0'}`, color: showTour ? '#2563EB' : '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
        >
          💡 {showTour ? 'Ocultar Tour Explicativo' : 'Ativar Tour das Funções'}
        </button>
      </div>

      {showTour && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '16px', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <div>
            <strong>Tour de Orquestração do SaaS:</strong> Colaboradores, este painel define a inteligência de cobrança e funcionamento do Campainha Digital. Passe o cursor sobre o ícone <strong>ℹ️</strong> ao lado de qualquer item para visualizar o seu respectivo balão explicativo em tempo real. Configure com atenção!
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* FINANCEIRO */}
        <div style={{ padding: '24px', background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💰</span> Cobrança & Planos SaaS
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Assinaturas Anuais Fixas</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Label style={{ margin: 0, fontSize: '11px' }}>Casa Anual (R$)</Label>
                    <span 
                      onMouseEnter={() => setActiveTooltip('servicePriceAnnualSimple')} 
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                    >ℹ️</span>
                  </div>
                  <input 
                    type="number" step="0.01"
                    value={config.servicePriceAnnualSimple || 39.90} 
                    onChange={e => handleChange('servicePriceAnnualSimple', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 700 }} 
                  />
                  {activeTooltip === 'servicePriceAnnualSimple' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.servicePriceAnnualSimple}</div>}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Label style={{ margin: 0, fontSize: '11px' }}>Vila Anual (R$)</Label>
                    <span 
                      onMouseEnter={() => setActiveTooltip('servicePriceAnnualVilla')} 
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                    >ℹ️</span>
                  </div>
                  <input 
                    type="number" step="0.01"
                    value={config.servicePriceAnnualVilla || 99.90} 
                    onChange={e => handleChange('servicePriceAnnualVilla', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 700 }} 
                  />
                  {activeTooltip === 'servicePriceAnnualVilla' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.servicePriceAnnualVilla}</div>}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Label style={{ margin: 0, fontSize: '11px' }}>Prédio Anual (R$)</Label>
                    <span 
                      onMouseEnter={() => setActiveTooltip('servicePriceAnnualCondo')} 
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                    >ℹ️</span>
                  </div>
                  <input 
                    type="number" step="0.01"
                    value={config.servicePriceAnnualCondo || 159.90} 
                    onChange={e => handleChange('servicePriceAnnualCondo', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 700 }} 
                  />
                  {activeTooltip === 'servicePriceAnnualCondo' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.servicePriceAnnualCondo}</div>}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Assinaturas Mensais Recorrentes</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Label style={{ margin: 0, fontSize: '11px' }}>Condomínio - Base (R$)</Label>
                      <span 
                        onMouseEnter={() => setActiveTooltip('condoMonthlyBasePrice')} 
                        onMouseLeave={() => setActiveTooltip(null)}
                        style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                      >ℹ️</span>
                    </div>
                    <input 
                      type="number" step="0.01"
                      value={config.condoMonthlyBasePrice || 159.90} 
                      onChange={e => handleChange('condoMonthlyBasePrice', Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 700 }} 
                    />
                    {activeTooltip === 'condoMonthlyBasePrice' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.condoMonthlyBasePrice}</div>}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Label style={{ margin: 0, fontSize: '11px' }}>Condomínio - Unid. Adic. (R$)</Label>
                      <span 
                        onMouseEnter={() => setActiveTooltip('condoMonthlyAdditionalPrice')} 
                        onMouseLeave={() => setActiveTooltip(null)}
                        style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                      >ℹ️</span>
                    </div>
                    <input 
                      type="number" step="0.01"
                      value={config.condoMonthlyAdditionalPrice || 1.55} 
                      onChange={e => handleChange('condoMonthlyAdditionalPrice', Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 700 }} 
                    />
                    {activeTooltip === 'condoMonthlyAdditionalPrice' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.condoMonthlyAdditionalPrice}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Label style={{ margin: 0, fontSize: '11px' }}>Vila - Base (R$)</Label>
                      <span 
                        onMouseEnter={() => setActiveTooltip('villaMonthlyBasePrice')} 
                        onMouseLeave={() => setActiveTooltip(null)}
                        style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                      >ℹ️</span>
                    </div>
                    <input 
                      type="number" step="0.01"
                      value={config.villaMonthlyBasePrice || 99.90} 
                      onChange={e => handleChange('villaMonthlyBasePrice', Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 700 }} 
                    />
                    {activeTooltip === 'villaMonthlyBasePrice' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.villaMonthlyBasePrice}</div>}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Label style={{ margin: 0, fontSize: '11px' }}>Vila - Unid. Adic. (R$)</Label>
                      <span 
                        onMouseEnter={() => setActiveTooltip('villaMonthlyAdditionalPrice')} 
                        onMouseLeave={() => setActiveTooltip(null)}
                        style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                      >ℹ️</span>
                    </div>
                    <input 
                      type="number" step="0.01"
                      value={config.villaMonthlyAdditionalPrice || 1.20} 
                      onChange={e => handleChange('villaMonthlyAdditionalPrice', Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 700 }} 
                    />
                    {activeTooltip === 'villaMonthlyAdditionalPrice' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.villaMonthlyAdditionalPrice}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Label style={{ margin: 0 }}>Nome do Plano</Label>
                  <span 
                    onMouseEnter={() => setActiveTooltip('planName')} 
                    onMouseLeave={() => setActiveTooltip(null)}
                    style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                  >ℹ️</span>
                </div>
                <input 
                  type="text" 
                  value={config.planName || 'Anual'} 
                  onChange={e => handleChange('planName', e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
                />
                {activeTooltip === 'planName' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.planName}</div>}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Label style={{ margin: 0 }}>Vencimento Pix (dias)</Label>
                  <span 
                    onMouseEnter={() => setActiveTooltip('pixDueDays')} 
                    onMouseLeave={() => setActiveTooltip(null)}
                    style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                  >ℹ️</span>
                </div>
                <input 
                  type="number" 
                  value={config.pixDueDays || 3} 
                  onChange={e => handleChange('pixDueDays', Number(e.target.value))}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
                />
                {activeTooltip === 'pixDueDays' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '220px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.pixDueDays}</div>}
              </div>
            </div>
            
          </div>
        </div>

        {/* SISTEMA & CONTATO */}
        <div style={{ padding: '24px', background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span> Configurações Gerais do SaaS
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Label style={{ margin: 0 }}>Dias de Trial (Teste Grátis)</Label>
                <span 
                  onMouseEnter={() => setActiveTooltip('trialDays')} 
                  onMouseLeave={() => setActiveTooltip(null)}
                  style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                >ℹ️</span>
              </div>
              <input 
                type="number" 
                value={config.trialDays || 15} 
                onChange={e => handleChange('trialDays', Number(e.target.value))}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
              />
              {activeTooltip === 'trialDays' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '320px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.trialDays}</div>}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Label style={{ margin: 0 }}>Nome da Empresa / SaaS</Label>
                <span 
                  onMouseEnter={() => setActiveTooltip('companyName')} 
                  onMouseLeave={() => setActiveTooltip(null)}
                  style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                >ℹ️</span>
              </div>
              <input 
                type="text" 
                value={config.companyName || 'Campainha Digital'} 
                onChange={e => handleChange('companyName', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
              />
              {activeTooltip === 'companyName' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '320px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.companyName}</div>}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Label style={{ margin: 0 }}>WhatsApp de Suporte</Label>
                <span 
                  onMouseEnter={() => setActiveTooltip('supportWhatsApp')} 
                  onMouseLeave={() => setActiveTooltip(null)}
                  style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
                >ℹ️</span>
              </div>
              <input 
                type="text" 
                value={config.supportWhatsApp || '5521995879170'} 
                onChange={e => handleChange('supportWhatsApp', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
              />
              {activeTooltip === 'supportWhatsApp' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '320px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.supportWhatsApp}</div>}
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={handleSave}
                disabled={loading}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFF', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
              >
                {loading ? 'SALVANDO CONFIGURAÇÕES...' : '💾 SALVAR CONFIGURAÇÕES DO PLANO'}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* METODO DE PAGAMENTO PIX CUSTOMIZADO */}
      <div style={{ marginTop: '24px', padding: '24px', background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💳</span> Método de Pagamento Pix Customizado (Opcional)
        </h3>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 20px 0', lineHeight: '1.5' }}>
          💡 <strong>Nota dos Engenheiros:</strong> Se configurado, a plataforma ignorará a API automática do Abacate Pay durante o onboarding e apresentará o Pix estático configurado abaixo para o cliente pagar diretamente para você.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Label style={{ margin: 0, fontSize: '12px' }}>Chave Pix Customizada</Label>
              <span 
                onMouseEnter={() => setActiveTooltip('customPixKey')} 
                onMouseLeave={() => setActiveTooltip(null)}
                style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
              >ℹ️</span>
            </div>
            <input 
              type="text" 
              placeholder="Ex: CNPJ, E-mail ou Telefone"
              value={config.customPixKey || ''} 
              onChange={e => handleChange('customPixKey', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
            />
            {activeTooltip === 'customPixKey' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '320px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.customPixKey}</div>}
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Label style={{ margin: 0, fontSize: '12px' }}>Pix Copia e Cola Customizado</Label>
              <span 
                onMouseEnter={() => setActiveTooltip('customPixCopiaECola')} 
                onMouseLeave={() => setActiveTooltip(null)}
                style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
              >ℹ️</span>
            </div>
            <input 
              type="text" 
              placeholder="Código Copia e Cola Pix Completo"
              value={config.customPixCopiaECola || ''} 
              onChange={e => handleChange('customPixCopiaECola', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
            />
            {activeTooltip === 'customPixCopiaECola' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '320px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.customPixCopiaECola}</div>}
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Label style={{ margin: 0, fontSize: '12px' }}>QR Code (URL da Imagem ou Base64)</Label>
              <span 
                onMouseEnter={() => setActiveTooltip('customPixQrCode')} 
                onMouseLeave={() => setActiveTooltip(null)}
                style={{ cursor: 'help', fontSize: '12px', color: '#3B82F6' }}
              >ℹ️</span>
            </div>
            <input 
              type="text" 
              placeholder="https://... ou base64..."
              value={config.customPixQrCode || ''} 
              onChange={e => handleChange('customPixQrCode', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px' }} 
            />
            {activeTooltip === 'customPixQrCode' && <div style={{ position: 'absolute', background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', maxWidth: '320px', zIndex: 10, marginTop: '4px', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{tooltipsData.customPixQrCode}</div>}
          </div>
        </div>
      </div>

    </div>
  );
}
