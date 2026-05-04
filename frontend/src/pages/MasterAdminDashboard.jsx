import React, { useState } from 'react';
import { LayoutDashboard, Users, ShoppingCart, TrendingUp, ShieldCheck, DollarSign, UserCheck, Activity, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const stats = [
    { label: 'Vendas Totais', value: 'R$ 12.450,00', icon: DollarSign, color: '#10B981' },
    { label: 'Novos Condomínios', value: '42', icon: Building2 => <ShieldCheck />, color: 'var(--primary)' },
    { label: 'Chamadas Hoje', value: '1,284', icon: Activity, color: '#F59E0B' },
    { label: 'Vendedores Ativos', value: '12', icon: UserCheck, color: '#8B5CF6' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', display: 'flex' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '260px', background: 'var(--bg-surface-elevated)', borderRight: '1px solid var(--border-subtle)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
           <ShieldCheck size={32} color="var(--primary)" />
           <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>HQ Admin</span>
        </div>
        
        <SidebarLink icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <SidebarLink icon={ShoppingCart} label="Vendas" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
        <SidebarLink icon={Users} label="Vendedores" active={activeTab === 'sellers'} onClick={() => setActiveTab('sellers')} />
        <SidebarLink icon={TrendingUp} label="Relatórios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
        
        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
           <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Usuário Logado</p>
           <p style={{ fontSize: '14px', fontWeight: 700 }}>Admin Master</p>
           <Link to="/" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', display: 'block', marginTop: '4px' }}>Log Out</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>Monitoramento Global</h1>
              <p style={{ color: 'var(--text-muted)' }}>Controle total de vendas e performance da plataforma.</p>
           </div>
           <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                 <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                 <input type="text" placeholder="Buscar venda ou vendedor..." className="input-glass" style={{ paddingLeft: '48px', width: '300px' }} />
              </div>
              <button className="btn-secondary" style={{ padding: '12px 20px' }}>
                 <Filter size={18} /> Filtros
              </button>
           </div>
        </header>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
           {stats.map((stat, i) => (
             <div key={i} className="premium-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <div style={{ padding: '12px', background: `${stat.color}20`, borderRadius: '12px' }}>
                      <stat.icon size={24} color={stat.color} />
                   </div>
                   <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>+12% este mês</span>
                </div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{stat.label}</h4>
                <p style={{ fontSize: '28px', fontWeight: 800 }}>{stat.value}</p>
             </div>
           ))}
        </div>

        {/* Tables Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
           <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Vendas Recentes</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                       <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>CLIENTE</th>
                       <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>PLANO</th>
                       <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>VENDEDOR</th>
                       <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>STATUS</th>
                    </tr>
                 </thead>
                 <tbody>
                    <TableRow name="Condomínio Solar" plan="Anual Premium" seller="Marcos Silva" status="Pago" />
                    <TableRow name="Casa de Praia" plan="Anual Individual" seller="Site (Direto)" status="Pago" />
                    <TableRow name="Residencial Flores" plan="Anual Premium" seller="Ana Beatriz" status="Pendente" />
                    <TableRow name="Vila das Palmeiras" plan="Anual Premium" seller="Marcos Silva" status="Pago" />
                 </tbody>
              </table>
           </div>

           <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Ranking Vendedores</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <SellerRank name="Marcos Silva" sales="R$ 4.200" rank={1} />
                 <SellerRank name="Ana Beatriz" sales="R$ 2.850" rank={2} />
                 <SellerRank name="Ricardo Lopes" sales="R$ 1.900" rank={3} />
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginTop: '32px' }}>Ver Todos Vendedores</button>
           </div>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', background: active ? 'rgba(0, 229, 255, 0.1)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
       <Icon size={20} /> {label}
    </button>
  );
}

function TableRow({ name, plan, seller, status }) {
   return (
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
         <td style={{ padding: '20px 16px', fontWeight: 600 }}>{name}</td>
         <td style={{ padding: '20px 16px', color: 'var(--text-muted)' }}>{plan}</td>
         <td style={{ padding: '20px 16px' }}>{seller}</td>
         <td style={{ padding: '20px 16px' }}>
            <span style={{ padding: '4px 8px', borderRadius: '4px', background: status === 'Pago' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: status === 'Pago' ? '#10B981' : '#F59E0B', fontSize: '11px', fontWeight: 800 }}>{status}</span>
         </td>
      </tr>
   );
}

function SellerRank({ name, sales, rank }) {
   return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: rank === 1 ? 'var(--primary)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: rank === 1 ? '#000' : '#fff', fontWeight: 800 }}>{rank}</div>
         <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 700 }}>{name}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Meta: 85% atingida</p>
         </div>
         <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{sales}</span>
      </div>
   );
}
