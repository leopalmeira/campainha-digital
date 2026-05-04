import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Video, Phone, MicOff, PhoneOff } from 'lucide-react';

const socket = io('http://localhost:3001');

export default function ResidentDashboard() {
  const { id } = useParams(); // this is the unitId
  const [call, setCall] = useState(null); // { visitorSocketId, photo, timestamp }
  const [status, setStatus] = useState('idle'); // idle, ringing, monitoring, active
  const audioRef = useRef(null);

  useEffect(() => {
    socket.emit('register_resident', { unitId: id });

    socket.on('incoming_call', (data) => {
      setCall(data);
      setStatus('ringing');
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play blocked', e));
      }
    });

    return () => {
      socket.off('incoming_call');
    };
  }, [id]);

  const handleMonitor = () => {
    setStatus('monitoring');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAnswer = () => {
    setStatus('active');
    socket.emit('answer_call', { visitorSocketId: call.visitorSocketId });
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // WebRTC initialization would go here
  };

  const handleEndCall = () => {
    setStatus('idle');
    setCall(null);
  };

  return (
    <div className="mobile-container fade-in">
      {/* Hidden audio for ringtone */}
      <audio ref={audioRef} loop>
        <source src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" type="audio/mpeg" />
      </audio>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="text-gradient">Painel do Morador</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
          Online
        </div>
      </div>

      {status === 'idle' && (
        <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
          <Video size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p className="text-muted">Aguardando visitantes...</p>
        </div>
      )}

      {status === 'ringing' && call && (
        <div className="glass-panel fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--danger)' }} className="pulse-btn">VISITANTE NA PORTA</h3>
          </div>
          
          <div style={{ position: 'relative', height: '300px', width: '100%', background: '#000' }}>
            {call.photo ? (
              <img src={call.photo} alt="Visitante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sem foto disponível</div>
            )}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
              Ao vivo
            </div>
          </div>

          <div style={{ padding: '24px', display: 'flex', gap: '16px' }}>
            <button className="btn-glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }} onClick={handleMonitor}>
              <Video size={24} style={{ marginBottom: '8px' }} />
              Monitorar
            </button>
            <button className="btn-primary" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', background: 'var(--success)' }} onClick={handleAnswer}>
              <Phone size={24} style={{ marginBottom: '8px' }} />
              Atender
            </button>
          </div>
        </div>
      )}

      {(status === 'monitoring' || status === 'active') && call && (
        <div className="glass-panel fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{status === 'monitoring' ? 'Monitoramento Oculto' : 'Chamada Ativa'}</h3>
            <div style={{ color: 'var(--danger)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div className="pulse-btn" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />
              REC
            </div>
          </div>
          
          <div style={{ flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
             {/* Replace with actual video stream in full implementation */}
             {call.photo ? (
              <img src={call.photo} alt="Visitante" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
            ) : (
              <Video size={64} color="var(--text-muted)" />
            )}
            {status === 'active' && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', width: '100px', height: '150px', background: '#333', borderRadius: '8px', border: '2px solid var(--accent-cyan)' }}>
                {/* Local user video */}
              </div>
            )}
          </div>

          <div style={{ padding: '24px', display: 'flex', gap: '16px', justifyContent: 'center', background: 'var(--glass-bg)' }}>
             {status === 'monitoring' ? (
                <button className="btn-primary" style={{ flex: 1, background: 'var(--success)' }} onClick={handleAnswer}>
                  <Phone size={20} /> Falar
                </button>
             ) : (
                <button className="btn-glass" style={{ width: '56px', height: '56px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MicOff size={24} />
                </button>
             )}
            <button className="btn-danger" style={{ width: '56px', height: '56px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleEndCall}>
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
