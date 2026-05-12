import React from 'react';

export default function Logo({ size = 40, showText = true, light = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 229, 255, 0.2))' }}
      >
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="45" stroke={light ? '#fff' : '#0F172A'} strokeWidth="8" opacity="0.1" />
        
        {/* Waves */}
        <path d="M70 30C78 38 78 52 70 60" stroke="#00E5FF" strokeWidth="6" strokeLinecap="round" />
        <path d="M80 20C92 32 92 58 80 70" stroke="#00E5FF" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
        <path d="M90 10C106 26 106 74 90 90" stroke="#00E5FF" strokeWidth="6" strokeLinecap="round" opacity="0.3" />

        {/* Center Bell / Core */}
        <circle cx="45" cy="50" r="25" fill={light ? '#fff' : '#0F172A'} />
        <circle cx="45" cy="50" r="12" fill="#F59E0B" />
        <circle cx="45" cy="50" r="6" fill="#FFF" opacity="0.5" />
        
        {/* Connection/Signal Line */}
        <path d="M45 75V85M35 80H55" stroke={light ? '#fff' : '#0F172A'} strokeWidth="4" strokeLinecap="round" />
      </svg>
      
      {showText && (
        <span style={{ 
          fontSize: `${size * 0.6}px`, 
          fontWeight: 900, 
          color: light ? '#FFF' : '#0F172A',
          letterSpacing: '-1px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          Campainha<span style={{ color: '#00E5FF' }}>-Digital</span>
        </span>
      )}
    </div>
  );
}
