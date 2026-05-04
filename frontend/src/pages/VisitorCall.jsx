import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Bell, CheckCircle } from 'lucide-react';

const socket = io('http://localhost:3001');

export default function VisitorCall() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [callingUnit, setCallingUnit] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, calling, answered
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchProperty();
    
    socket.on('call_answered', () => {
      setStatus('answered');
      setCountdown(0);
    });

    return () => {
      socket.off('call_answered');
    };
  }, [id]);

  useEffect(() => {
    let timer;
    if (countdown > 0 && status === 'calling') {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && status === 'calling') {
      setStatus('idle');
      setCallingUnit(null);
    }
    return () => clearTimeout(timer);
  }, [countdown, status]);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/properties/${id}`);
      const data = await res.json();
      setProperty(data);
    } catch (err) {
      console.error('Error fetching property', err);
    }
  };

  const capturePhoto = async () => {
    return new Promise(async (resolve) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            // Wait a brief moment for camera to adjust exposure
            setTimeout(() => {
              const canvas = canvasRef.current;
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
              const photoData = canvas.toDataURL('image/jpeg', 0.8);
              
              // Stop tracks
              stream.getTracks().forEach(t => t.stop());
              resolve(photoData);
            }, 500);
          };
        } else {
          resolve(null);
        }
      } catch (err) {
        console.error("Camera access denied or failed", err);
        resolve(null); // Proceed without photo if denied
      }
    });
  };

  const handleCall = async (unit) => {
    setStatus('calling');
    setCallingUnit(unit);
    setCountdown(30);

    const photoBase64 = await capturePhoto();

    socket.emit('initiate_call', {
      unitId: unit.id,
      photoBase64
    });
  };

  if (!property) return <div className="mobile-container fade-in"><p>Carregando...</p></div>;

  return (
    <div className="mobile-container fade-in" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      {/* Hidden elements for silent capture */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <img src="https://i.imgur.com/your-logo.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '16px', marginBottom: '24px' }} onError={(e) => e.target.style.display='none'}/>
      
      <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '8px' }}>Campainha-Digital</h1>
      <p className="text-muted" style={{ marginBottom: '40px' }}>Você está em: {property.name}</p>

      {status === 'idle' && (
        <div style={{ width: '100%' }}>
          {property.type === 'individual' ? (
            <button className="btn-primary pulse-btn" style={{ width: '100%', padding: '24px', fontSize: '20px', borderRadius: '16px', flexDirection: 'column', gap: '16px' }} onClick={() => handleCall(property.units[0])}>
              <Bell size={48} />
              TOCAR CAMPAINHA
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontWeight: 600 }}>Selecione a Unidade:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {property.units.map(unit => (
                  <button key={unit.id} className="btn-glass" style={{ padding: '16px' }} onClick={() => handleCall(unit)}>
                    {unit.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'calling' && (
        <div className="glass-panel fade-in" style={{ padding: '32px', width: '100%' }}>
          <div className="pulse-btn" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Bell size={40} color="#fff" />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Notificando Morador...</h2>
          <p className="text-muted" style={{ marginBottom: '24px' }}>Unidade: {callingUnit?.name}</p>
          
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
            00:{countdown.toString().padStart(2, '0')}
          </div>
        </div>
      )}

      {status === 'answered' && (
        <div className="glass-panel fade-in" style={{ padding: '32px', width: '100%' }}>
          <CheckCircle size={80} color="var(--success)" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ marginBottom: '8px', color: 'var(--success)' }}>Chamada Atendida</h2>
          <p className="text-muted">Aguarde instruções do morador.</p>
        </div>
      )}
    </div>
  );
}
