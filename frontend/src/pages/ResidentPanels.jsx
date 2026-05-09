import React, { useState } from 'react';
import { Clock, User, RefreshCw, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function fmt(ts) {
  const d = new Date(ts);
  return { date: d.toLocaleDateString('pt-BR'), time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
}

export function HistoryPanel({ unitId }) {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/visitors/${unitId}`);
      setVisitors(await r.json());
      setLoaded(true);
    } catch { setVisitors([]); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, [unitId]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Histórico de Visitas</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Registro de todas as campanhas recebidas</p>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Carregando...</p>}

      {!loading && visitors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <User size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma visita registrada ainda.</p>
        </div>
      )}

      {!loading && visitors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visitors.map((v, i) => {
            const { date, time } = fmt(v.timestamp);
            return (
              <div key={v.id || i} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', overflow: 'hidden' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: '#111', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {v.photo
                    ? <img src={v.photo} alt="Visitante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={28} style={{ opacity: 0.3 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Visitante</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <Clock size={11} /> {date} às {time}
                  </div>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.3, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DEFAULT_CATEGORIES = [
  {
    id: 'water', label: '💧 Marcador de Água', messages: ['Pode entrar para anotar', 'Deixe o aviso na porta', 'Volto em 10 minutos']
  },
  {
    id: 'energy', label: '⚡ Light / Energia', messages: ['Pode entrar para verificar', 'Não autorizo o corte hoje', 'Aguarde um momento']
  },
  {
    id: 'delivery', label: '📦 Entregador', messages: ['Deixe na porta, obrigado!', 'Pode deixar com o vizinho', 'Já abro o portão']
  },
  {
    id: 'general', label: '💬 Geral', messages: ['Volto já!', 'Não estou em casa', 'Um momento, por favor', 'Pode deixar recado']
  }
];

export function SettingsPanel({ unitName, setUnitName, onSave }) {
  const [activeCategory, setActiveCategory] = useState('general');
  const [savedMessages, setSavedMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cd_quick_msgs') || 'null') || DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
  });
  const [customMsg, setCustomMsg] = useState('');

  const saveAll = () => {
    localStorage.setItem('cd_quick_msgs', JSON.stringify(savedMessages));
    onSave();
  };

  const addCustom = () => {
    if (!customMsg.trim()) return;
    setSavedMessages(prev => prev.map(c => c.id === activeCategory
      ? { ...c, messages: [...c.messages, customMsg.trim()] }
      : c));
    setCustomMsg('');
  };

  const removeMsg = (catId, idx) => {
    setSavedMessages(prev => prev.map(c => c.id === catId
      ? { ...c, messages: c.messages.filter((_, i) => i !== idx) }
      : c));
  };

  const activeC = savedMessages.find(c => c.id === activeCategory);

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Configurações</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Personalize sua campainha</p>

      {/* Nome */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>NOME DE EXIBIÇÃO</label>
        <input type="text" className="input-glass" value={unitName} onChange={e => setUnitName(e.target.value)} style={{ width: '100%', marginBottom: '12px' }} />
        <button className="btn-primary" onClick={saveAll} style={{ width: '100%', padding: '12px', fontSize: '14px' }}>Salvar Configurações</button>
      </div>

      {/* Mensagens Rápidas */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>📨 Mensagens Rápidas</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Configure respostas que aparecem quando alguém tocar a campainha</p>

        {/* Categoria tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {savedMessages.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeCategory === c.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeCategory === c.id ? '#000' : 'var(--text-muted)', transition: 'all 0.2s' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Mensagens da categoria ativa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {activeC?.messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '10px 14px' }}>
              <span style={{ fontSize: '13px' }}>"{msg}"</span>
              <button onClick={() => removeMsg(activeCategory, i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
          ))}
        </div>

        {/* Add custom */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" className="input-glass" placeholder="Nova mensagem..." value={customMsg} onChange={e => setCustomMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()} style={{ flex: 1, fontSize: '13px' }} />
          <button onClick={addCustom} className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: 'auto', flexShrink: 0 }}>+ Add</button>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_CATEGORIES };
