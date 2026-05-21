import React from 'react';

export default function CadastroQRCode() {
  const signupLink = `${window.location.origin}/login-cliente?signup=true`;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFFFFF',
      margin: 0,
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '360px',
        width: '100%'
      }}>
        {/* Container do QR Code com uma borda sutil e elegante */}
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          border: '1px solid #F1F5F9',
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          <img 
            src="/qrcode_cadastro_cliente.png" 
            alt="QR Code de Cadastro" 
            style={{
              width: '260px',
              height: '260px',
              display: 'block',
              borderRadius: '12px'
            }} 
          />
        </div>
        
        <h1 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#0F172A',
          margin: '0 0 8px 0'
        }}>
          Cadastro de Cliente
        </h1>
        
        <p style={{
          fontSize: '13px',
          color: '#64748B',
          margin: '0 0 20px 0',
          lineHeight: '1.5'
        }}>
          Escaneie o QR Code acima com a câmera do seu celular para ser direcionado à tela de cadastro.
        </p>

        {/* Link alternativo sutil */}
        <a 
          href={signupLink}
          style={{
            fontSize: '12px',
            color: '#3B82F6',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#1D4ED8'}
          onMouseLeave={(e) => e.target.style.color = '#3B82F6'}
        >
          Ou clique aqui para abrir o cadastro
        </a>
      </div>
    </div>
  );
}
