import React, { useState, useEffect } from 'react';
import { Plus, Download, Trash2, Home, Building2 } from 'lucide-react';

export default function AdminPanel() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ type: 'individual', name: '', units: '' });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/properties');
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let parsedUnits = [];
    if (formData.type === 'collective') {
      parsedUnits = formData.units.split(',').map(u => ({ name: u.trim() }));
    }
    
    try {
      const res = await fetch('http://localhost:3001/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, units: parsedUnits })
      });
      if (res.ok) {
        setFormData({ type: 'individual', name: '', units: '' });
        fetchProperties();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProperty = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await fetch(`http://localhost:3001/api/properties/${id}`, { method: 'DELETE' });
      fetchProperties();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadQR = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${name.replace(/\s+/g, '_')}.png`;
    link.click();
  };

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <img src="https://i.imgur.com/your-logo.png" alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '8px' }} onError={(e) => e.target.style.display='none'}/>
        <div>
          <h1 className="text-gradient">Campainha-Digital</h1>
          <p className="text-muted">Painel Administrativo & Gestão de QR Codes</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>Cadastrar Nova Placa</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" checked={formData.type === 'individual'} onChange={() => setFormData({...formData, type: 'individual'})} />
              <Home size={18} /> Individual
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" checked={formData.type === 'collective'} onChange={() => setFormData({...formData, type: 'collective'})} />
              <Building2 size={18} /> Coletivo (Condomínio/Vila)
            </label>
          </div>
          
          <input 
            type="text" 
            placeholder="Nome do Cliente ou Imóvel" 
            className="input-glass"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          {formData.type === 'collective' && (
            <input 
              type="text" 
              placeholder="Unidades separadas por vírgula (ex: Apto 101, Apto 102)" 
              className="input-glass"
              value={formData.units}
              onChange={(e) => setFormData({...formData, units: e.target.value})}
              required
            />
          )}

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            <Plus size={18} /> Gerar QR Code Único
          </button>
        </form>
      </div>

      <h2 style={{ marginBottom: '16px' }}>Placas Cadastradas</h2>
      {loading ? <p>Carregando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {properties.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>{p.name}</h3>
              <p className="text-muted" style={{ marginBottom: '16px', fontSize: '14px' }}>
                {p.type === 'individual' ? 'Residência Individual' : `${p.units.length} Unidades (Coletivo)`}
              </p>
              
              <img src={p.qrCodeUrl} alt="QR Code" style={{ width: '150px', height: '150px', borderRadius: '8px', marginBottom: '16px', border: '4px solid #fff' }} />
              
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button className="btn-glass" style={{ flex: 1 }} onClick={() => downloadQR(p.qrCodeUrl, p.name)}>
                  <Download size={16} /> Exportar
                </button>
                <button className="btn-danger" style={{ padding: '12px' }} onClick={() => deleteProperty(p.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ marginTop: '16px', fontSize: '12px', wordBreak: 'break-all', color: 'var(--accent-cyan)' }}>
                {p.url}
              </div>
              
              {p.type === 'collective' && (
                <div style={{ marginTop: '16px', width: '100%', textAlign: 'left', fontSize: '12px' }}>
                  <strong>Links dos Moradores:</strong>
                  <ul style={{ paddingLeft: '16px', marginTop: '8px', color: 'var(--text-muted)' }}>
                    {p.units.slice(0, 3).map(u => (
                      <li key={u.id}>{u.name}: /morador/{u.id}</li>
                    ))}
                    {p.units.length > 3 && <li>...</li>}
                  </ul>
                </div>
              )}
              {p.type === 'individual' && p.units[0] && (
                 <div style={{ marginTop: '16px', width: '100%', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                 Link Morador: /morador/{p.units[0].id}
               </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
