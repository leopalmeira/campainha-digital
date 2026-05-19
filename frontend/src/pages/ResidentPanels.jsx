import React, { useState, useEffect, useRef } from 'react';
import { Clock, User, RefreshCw, Calendar, MapPin, Phone, X, ChevronDown, ChevronUp } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function fmt(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  let ago = '';
  if (mins < 1) ago = 'Agora';
  else if (mins < 60) ago = `${mins}min atrás`;
  else if (hrs < 24) ago = `${hrs}h atrás`;
  else if (days === 1) ago = 'Ontem';
  else ago = `${days} dias atrás`;
  return {
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
    ago
  };
}

function groupByDate(visitors) {
  const groups = {};
  visitors.forEach(v => {
    const d = new Date(v.timestamp).toDateString();
    if (!groups[d]) groups[d] = [];
    groups[d].push(v);
  });
  return Object.entries(groups);
}

function VisitorCard({ v }) {
  const [expanded, setExpanded] = useState(false);
  const { date, time, weekday, ago } = fmt(v.timestamp);
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#FFF', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }}>
        {/* Foto */}
        <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#F1F5F9', flexShrink: 0, border: '2px solid var(--border-subtle)', position: 'relative' }}>
          {v.photo
            ? <img src={v.photo} alt="Visitante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} style={{ opacity: 0.3 }} /></div>}
          {/* Indicador de câmera */}
          <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', background: v.photo ? '#10B981' : '#6B7280', border: '2px solid var(--bg-deep)' }} />
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Visitante</span>
            <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(0,229,255,0.08)', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>{ago}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Clock size={11} /> {time} • {weekday}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} style={{ opacity: 0.4, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ opacity: 0.4, flexShrink: 0 }} />}
      </div>

      {/* Foto ampliada */}
      {expanded && v.photo && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', maxHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={v.photo} alt="Visitante ampliado" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', background: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={12} /> {date}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', background: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <Clock size={12} /> {time}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryPanel({ unitId, propertyId }) {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | today | withPhoto

  const load = async () => {
    setLoading(true);
    try {
      const url = propertyId 
        ? `${API}/api/visitors/${unitId}?propertyId=${propertyId}`
        : `${API}/api/visitors/${unitId}`;
      const r = await fetch(url);
      setVisitors(await r.json());
    } catch { setVisitors([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [unitId]);

  const filtered = visitors.filter(v => {
    if (filter === 'today') {
      const d = new Date(v.timestamp);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }
    if (filter === 'withPhoto') return !!v.photo;
    return true;
  });

  const groups = groupByDate(filtered);

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Histórico de Visitas</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>
            {visitors.length} visita{visitors.length !== 1 ? 's' : ''} registrada{visitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={load} style={{ background: '#FFF', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      {visitors.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total', value: visitors.length, color: 'var(--primary)' },
            { label: 'Hoje', value: visitors.filter(v => new Date(v.timestamp).toDateString() === new Date().toDateString()).length, color: '#10B981' },
            { label: 'Com Foto', value: visitors.filter(v => v.photo).length, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} style={{ background: '#FFF', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[{ k: 'all', l: 'Todos' }, { k: 'today', l: 'Hoje' }, { k: 'withPhoto', l: 'Com Foto' }].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f.k ? 'var(--primary)' : '#FFF', border: filter === f.k ? 'none' : '1px solid var(--border-subtle)', color: filter === f.k ? '#FFF' : 'var(--text-muted)', transition: 'all 0.2s' }}>
            {f.l}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid rgba(0,229,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'mesh-pulse 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <User size={48} style={{ opacity: 0.15, display: 'block', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Nenhuma visita encontrada</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>As visitas aparecem aqui após a campainha ser tocada.</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {groups.map(([dateKey, items]) => {
            const d = new Date(dateKey);
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const label = dateKey === today ? 'Hoje' : dateKey === yesterday ? 'Ontem' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
            return (
              <div key={dateKey}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((v, i) => <VisitorCard key={v.id || i} v={v} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const DEFAULT_CATEGORIES = [
  { id: 'water',    label: '💧 Marcador de Água', messages: ['Pode entrar para anotar', 'Deixe o aviso na porta', 'Volto em 10 minutos'] },
  { id: 'energy',   label: '⚡ Light / Energia',  messages: ['Pode entrar para verificar', 'Não autorizo o corte hoje', 'Aguarde um momento'] },
  { id: 'delivery', label: '📦 Entregador',        messages: ['Deixe na porta, obrigado!', 'Pode deixar com o vizinho', 'Já abro o portão'] },
  { id: 'general',  label: '💬 Geral',             messages: ['Volto já!', 'Não estou em casa', 'Um momento, por favor', 'Pode deixar recado'] },
];

export function SettingsPanel({ unitName, setUnitName, onSave, unitId, propertyId, propertyType }) {
  const [activeCategory, setActiveCategory] = useState('general');
  const [savedMessages, setSavedMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cd_quick_msgs') || 'null') || DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
  });
  const [customMsg, setCustomMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const [accessCode, setAccessCode] = useState(() => localStorage.getItem('residentAccessCode') || '');
  const [codeCopied, setCodeCopied] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');

  const [mgmtStatus, setMgmtStatus] = useState(null); // { requestedManagement: false, role: 'user' }
  const [requestingMgmt, setRequestingMgmt] = useState(false);

  useEffect(() => {
    const fetchMgmtStatus = async () => {
      if (!unitId || (propertyType !== 'individual' && propertyType !== 'house')) return;
      try {
        const r = await fetch(`${API}/api/resident/status/${unitId}`);
        if (r.ok) {
          const data = await r.json();
          setMgmtStatus(data);
        }
      } catch (err) { console.error('Error loading management status', err); }
    };
    fetchMgmtStatus();
  }, [unitId, propertyType]);

  const handleRequestManagement = async () => {
    setRequestingMgmt(true);
    try {
      const res = await fetch(`${API}/api/resident/request-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId })
      });
      if (res.ok) {
        setMgmtStatus(prev => ({ ...prev, requestedManagement: true }));
        alert('Solicitação de gestão enviada com sucesso! Aguarde a aprovação do administrador do sistema.');
      } else {
        alert('Erro ao enviar solicitação.');
      }
    } catch {
      alert('Erro de conexão ao enviar solicitação.');
    } finally {
      setRequestingMgmt(false);
    }
  };

  useEffect(() => {
    // Load current DND settings
    const loadDnd = async () => {
      try {
        const r = await fetch(`${API}/api/properties/${propertyId}/units/${unitId}`);
        if (r.ok) {
          const data = await r.json();
          const unit = data.units?.find(u => u.id === unitId);
          if (unit?.dndSettings) {
            setDndEnabled(unit.dndSettings.enabled);
            setDndStart(unit.dndSettings.start || '22:00');
            setDndEnd(unit.dndSettings.end || '07:00');
          }
        }
      } catch (err) { console.error('Error loading DND settings', err); }
    };
    if (unitId && propertyId) loadDnd();
  }, [unitId, propertyId]);

  const saveDnd = async (enabled, start, end) => {
    try {
      await fetch(`${API}/api/properties/${propertyId}/units/${unitId}/dnd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dndSettings: { enabled, start, end }
        })
      });
    } catch (err) { console.error('Error saving DND settings', err); }
  };

  // Removido o fetch para /api/properties por motivos de segurança e isolamento

  const copyCode = () => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const saveAll = () => {
    localStorage.setItem('cd_quick_msgs', JSON.stringify(savedMessages));
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addCustom = () => {
    if (!customMsg.trim()) return;
    setSavedMessages(prev => prev.map(c => c.id === activeCategory ? { ...c, messages: [...c.messages, customMsg.trim()] } : c));
    setCustomMsg('');
  };

  const removeMsg = (catId, idx) => {
    setSavedMessages(prev => prev.map(c => c.id === catId ? { ...c, messages: c.messages.filter((_, i) => i !== idx) } : c));
  };

  const activeC = savedMessages.find(c => c.id === activeCategory);

  return (
    <div style={{ padding: '20px 24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Configurações</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>Personalize sua campainha</p>



      {/* ── Nome ── */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>NOME DE EXIBIÇÃO</label>
        <input type="text" className="input-glass" value={unitName} onChange={e => setUnitName(e.target.value)} style={{ width: '100%', marginBottom: '12px' }} />
        
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '16px 0', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', color: 'var(--text-main)' }}>🚫 Não Perturbe</label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bloquear chamadas em horários específicos</span>
            </div>
            <div 
              onClick={() => {
                const newVal = !dndEnabled;
                setDndEnabled(newVal);
                saveDnd(newVal, dndStart, dndEnd);
              }} 
              style={{ 
                width: '44px', height: '24px', borderRadius: '12px', background: dndEnabled ? '#10B981' : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' 
              }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FFF', position: 'absolute', top: '2px', left: dndEnabled ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
            </div>
          </div>
          
          {dndEnabled && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>INÍCIO</label>
                <input type="time" className="input-glass" value={dndStart} onChange={e => { setDndStart(e.target.value); saveDnd(dndEnabled, e.target.value, dndEnd); }} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>FIM</label>
                <input type="time" className="input-glass" value={dndEnd} onChange={e => { setDndEnd(e.target.value); saveDnd(dndEnabled, dndStart, e.target.value); }} style={{ width: '100%', padding: '8px' }} />
              </div>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={saveAll} style={{ width: '100%', padding: '12px', fontSize: '14px', background: saved ? '#10B981' : undefined, transition: 'background 0.3s' }}>
          {saved ? '✓ Salvo!' : 'Salvar Configurações'}
        </button>
      </div>

      {/* ── Mensagens Rápidas ── */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>📨 Mensagens Rápidas</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Respostas prontas que aparecem na campainha quando alguém tocar</p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {savedMessages.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeCategory === c.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeCategory === c.id ? '#000' : 'var(--text-muted)', transition: 'all 0.2s' }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {activeC?.messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '10px 14px' }}>
              <span style={{ fontSize: '13px' }}>"{msg}"</span>
              <button onClick={() => removeMsg(activeCategory, i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 6px' }}>×</button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" className="input-glass" placeholder="Nova mensagem..." value={customMsg}
            onChange={e => setCustomMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()} style={{ flex: 1, fontSize: '13px' }} />
          <button onClick={addCustom} className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: 'auto', flexShrink: 0 }}>+ Add</button>
        </div>
      </div>

      {/* ── Solicitar Promoção a Gestor (Se for Casa Simples) ── */}
      {(propertyType === 'individual' || propertyType === 'house') && (
        <div className="glass-panel" style={{ padding: '20px', marginTop: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Solicitar Gestão de Condomínio
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
            Deseja transformar sua campainha individual em uma Vila ou Condomínio para gerenciar múltiplos moradores e áreas comuns?
          </p>

          {mgmtStatus?.role === 'manager' ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px', color: '#10B981', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
              ✓ Sua conta já foi promovida a Gestor de Condomínio!
            </div>
          ) : mgmtStatus?.requestedManagement ? (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '12px', color: '#F59E0B', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
              ⏳ Solicitação de Gestão pendente de aprovação.
            </div>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleRequestManagement} 
              disabled={requestingMgmt}
              style={{ width: '100%', padding: '12px', fontSize: '14px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', border: 'none', color: '#FFF' }}
            >
              {requestingMgmt ? 'Enviando...' : 'Solicitar Upgrade para Gestor'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ResidentSupportPanel({ unitId, propertyId, propertyType }) {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem('residentEmail');

  const loadTickets = async () => {
    try {
      const r = await fetch(`${API}/api/support?role=resident&propertyId=${propertyId}&unitId=${unitId}`);
      if (r.ok) setTickets(await r.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadTickets(); }, [unitId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'resident', propertyId, unitId, title, message })
      });
      if (res.ok) {
        setTitle('');
        setMessage('');
        loadTickets();
      } else {
        alert('Erro ao abrir ticket.');
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const supportTarget = propertyType === 'individual' ? 'Administração da Plataforma' : 'Gestor do Condomínio';

  return (
    <div style={{ padding: '20px 24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Suporte Técnico</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
        Suas mensagens serão enviadas diretamente para a {supportTarget}.
      </p>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Abrir novo chamado</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" placeholder="Assunto (Ex: Portão não abre)" className="input-glass" 
            value={title} onChange={e => setTitle(e.target.value)} required 
            style={{ padding: '12px' }}
          />
          <textarea 
            placeholder="Descreva o problema em detalhes..." className="input-glass" 
            value={message} onChange={e => setMessage(e.target.value)} required 
            style={{ padding: '12px', minHeight: '100px', resize: 'vertical' }}
          />
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', fontSize: '14px' }}>
            {loading ? 'Enviando...' : 'Enviar Chamado'}
          </button>
        </form>
      </div>

      {tickets.length > 0 && (
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Seus Chamados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tickets.map(t => (
              <div key={t.id} style={{ background: '#FFF', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{t.title}</h4>
                  <span style={{ fontSize: '11px', background: t.status === 'open' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: t.status === 'open' ? '#F59E0B' : '#10B981', padding: '4px 8px', borderRadius: '100px', fontWeight: 700 }}>
                    {t.status === 'open' ? 'Aberto' : 'Resolvido'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px' }}>{t.message}</p>
                
                {t.replies && t.replies.length > 0 && (
                  <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginTop: '12px', border: '1px solid #E2E8F0' }}>
                    <h5 style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748B', fontWeight: 800 }}>RESPOSTAS</h5>
                    {t.replies.map(r => (
                      <div key={r.id} style={{ marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                        <strong style={{ fontSize: '12px', display: 'block', color: 'var(--text-main)' }}>{r.sender}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
