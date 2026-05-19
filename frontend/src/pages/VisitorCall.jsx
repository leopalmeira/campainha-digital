import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Bell, CheckCircle, ShieldCheck, MapPin, ChevronRight, Mic, Video, PhoneOff, WifiOff, KeyRound } from 'lucide-react';
import Logo from '../components/Logo';

// ─── Configuração do Socket.io ────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Configuração ICE com STUN públicos do Google (funcionam em qualquer rede)
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // TURN público (fallback para NAT restritivo)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

export default function VisitorCall() {
  const { id } = useParams(); // propertyId
  const [property, setProperty]     = useState(null);
  const [callingUnit, setCallingUnit] = useState(null);
  const [countdown, setCountdown]   = useState(0);
  const [status, setStatus]         = useState('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [residentSocket, setResidentSocket] = useState(null);
  const [quickMessage, setQuickMessage] = useState('');

  const localVideoRef   = useRef(null); // câmera do visitante (oculta)
  const canvasRef       = useRef(null);
  const remoteAudioRef  = useRef(null);
  const remoteVideoRef  = useRef(null); // câmera do morador (quando ativada)
  const socketRef       = useRef(null);
  const pcRef           = useRef(null);   // RTCPeerConnection
  const localStreamRef  = useRef(null);

  // ─── Inicialização do Socket.io ─────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    });
    socketRef.current = socket;

    fetchProperty();

    // Morador atendeu – inicia WebRTC
    // Em modo monitor: visitante vê "Chamando..." — NÃO revela que está sendo visto
    socket.on('call_answered', async ({ residentSocketId, mode, unitId }) => {
      setResidentSocket(residentSocketId);
      // modo monitor: visitante continua vendo a tela de "chamando" (não sabe que está sendo monitorado)
      if (mode !== 'monitor') {
        setStatus('answered');
        setCountdown(0);
      }
      await startWebRTC(residentSocketId, mode);
    });

    // Mensagem rápida enviada pelo morador
    socket.on('quick_message', ({ message }) => {
      setQuickMessage(message);
      setTimeout(() => setQuickMessage(''), 5000);
    });

    // Recebe answer do morador
    socket.on('webrtc_answer', async ({ answer }) => {
      if (pcRef.current && pcRef.current.signalingState !== 'stable') {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('[WebRTC] Erro ao aplicar answer:', e);
        }
      }
    });

    // Recebe ICE candidate do morador
    socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Erro ao adicionar ICE candidate:', e);
        }
      }
    });

    // Chamada encerrada pelo morador
    socket.on('call_ended', () => {
      setStatus('ended');
      stopAll();
    });

    // Renegociação: morador ativou/desativou a câmera — aceitar novo offer
    socket.on('webrtc_offer', async ({ sender, offer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { target: sender, answer: pc.localDescription });
      } catch (e) { console.warn('[WebRTC] Renegociação falhou:', e); }
    });

    // Portão liberado pelo morador
    socket.on('entry_authorized', () => {
      setStatus('authorized');
      setTimeout(() => {
        setStatus('idle');
        setCallingUnit(null);
        stopAll();
      }, 8000); // Back to idle after 8s
    });

    return () => {
      socket.disconnect();
      stopAll();
    };
  }, [id]);

  // ─── Countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (countdown > 0 && status === 'calling') {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && status === 'calling') {
      setStatus('idle');
      setCallingUnit(null);
      stopAll();
    }
    return () => clearTimeout(timer);
  }, [countdown, status]);

  // ─── Helpers ────────────────────────────────────────────────────────────
  const stopAll = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  const fetchProperty = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/properties/${id}`);
      const data = await res.json();
      setProperty(data);
    } catch (err) {
      console.error('[Fetch] Erro ao buscar propriedade:', err);
      setErrorMsg('Não foi possível carregar os dados. Verifique sua conexão.');
      setStatus('error');
    }
  };

  // Captura câmera + foto para o morador ver
  const getMediaAndPhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(() => {});
      }

      // Tira uma foto após 600ms para o morador ver
      await new Promise(res => setTimeout(res, 600));
      const canvas = canvasRef.current;
      if (canvas && localVideoRef.current) {
        canvas.width  = localVideoRef.current.videoWidth  || 640;
        canvas.height = localVideoRef.current.videoHeight || 480;
        canvas.getContext('2d').drawImage(localVideoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.5);
      }
    } catch (err) {
      console.warn('[Media] Câmera indisponível:', err.message);
    }
    return null;
  };

  // ─── WebRTC: Visitante cria a oferta ────────────────────────────────────
  const startWebRTC = useCallback(async (residentSocketId, mode) => {
    if (!localStreamRef.current) return;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    // Adiciona tracks locais à conexão
    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Quando receber áudio/vídeo do morador
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      // Áudio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(e => console.warn('[Audio] autoplay bloqueado:', e));
      }
      // Vídeo do morador (quando ele ativar a câmera)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    // Envia ICE candidates para o morador
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice_candidate', {
          target: residentSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Estado:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        setErrorMsg('Conexão P2P falhou. Verifique sua rede.');
      }
    };

    // Cria e envia offer
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: mode !== 'monitor' // morador ativo manda vídeo/áudio de volta
      });
      await pc.setLocalDescription(offer);

      socketRef.current.emit('webrtc_offer', {
        target: residentSocketId,
        offer: pc.localDescription
      });
    } catch (err) {
      console.error('[WebRTC] Erro ao criar offer:', err);
      setErrorMsg('Erro ao iniciar videochamada.');
    }
  }, []);

  // ─── Tocar campainha ────────────────────────────────────────────────────
  const handleCall = async (unit) => {
    setStatus('calling');
    setCallingUnit(unit);
    setCountdown(30);

    const photo = await getMediaAndPhoto();

    socketRef.current.emit('initiate_call', {
      unitId: unit.id,
      propertyId: property.id, // Vínculo com a propriedade para isolamento
      photoBase64: photo
    });
  };

  const handleHangup = () => {
    if (residentSocket && socketRef.current) {
      socketRef.current.emit('call_ended', { target: residentSocket });
    }
    setStatus('idle');
    setCallingUnit(null);
    stopAll();
  };

  // ─── Render: Loading ─────────────────────────────────────────────────────
  if (!property && status !== 'error') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0, 229, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'mesh-pulse 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Verificando segurança...</p>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)', 
      color: '#F8FAFC', 
      padding: '48px 24px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif'
    }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15%, 45% { transform: rotate(-12deg); }
          30%, 60% { transform: rotate(12deg); }
        }
        @keyframes subtle-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .pulse-button-wrapper {
          position: relative;
          width: 170px;
          height: 170px;
          margin: 0 auto;
          display: flex;
          alignItems: center;
          justifyContent: center;
        }
        .pulse-button-wrapper::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 4px solid rgba(59, 130, 246, 0.4);
          animation: pulse-ring 2.2s infinite ease-in-out;
        }
        .pulse-button-wrapper::after {
          content: '';
          position: absolute;
          inset: -18px;
          border-radius: 50%;
          border: 2px dashed rgba(59, 130, 246, 0.2);
          animation: pulse-ring 2.2s infinite ease-in-out;
          animation-delay: 0.7s;
        }
        .pulse-button {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          border: none;
          color: #FFF;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 12px 35px rgba(29, 78, 216, 0.5), inset 0 2px 4px rgba(255,255,255,0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2;
        }
        .pulse-button:hover {
          transform: scale(1.04);
          box-shadow: 0 16px 45px rgba(29, 78, 216, 0.7), inset 0 2px 4px rgba(255,255,255,0.4);
        }
        .pulse-button:active {
          transform: scale(0.96);
        }
        .visitor-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 32px 24px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
          width: 100%;
          max-width: 400px;
          transition: all 0.3s ease;
        }
        .btn-unit-select {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #FFF;
          padding: 18px 20px;
          border-radius: 18px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          text-align: left;
        }
        .btn-unit-select:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
        }
        .btn-unit-select:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Elementos ocultos para captura de mídia */}
      <video ref={localVideoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef}    style={{ display: 'none' }} />
      <audio  ref={remoteAudioRef} autoPlay playsInline />

      {/* Banner de mensagem rápida do morador */}
      {quickMessage && (
        <div style={{ 
          position: 'fixed', 
          top: '24px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: 'rgba(15, 23, 42, 0.95)', 
          border: '2px solid #3B82F6', 
          borderRadius: '20px', 
          padding: '16px 28px', 
          zIndex: 999, 
          maxWidth: '340px', 
          width: '90%', 
          textAlign: 'center', 
          backdropFilter: 'blur(16px)', 
          boxShadow: '0 12px 40px rgba(59, 130, 246, 0.25)' 
        }}>
          <p style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 800, marginBottom: '6px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>💬 Resposta do Morador</p>
          <p style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFF', lineHeight: '1.4' }}>"{quickMessage}"</p>
        </div>
      )}

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '20px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.05)'
        }}>
          <Logo size={36} showText={false} />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '6px', color: '#FFF' }}>Campainha Digital</h1>
        {property && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#94A3B8', 
            fontSize: '13px',
            background: 'rgba(255,255,255,0.03)',
            padding: '6px 14px',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <MapPin size={13} color="#3B82F6" /> {property.name}
          </div>
        )}
      </header>

      {/* ── Erro ──────────────────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <WifiOff size={32} color="#EF4444" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#FFF' }}>Instabilidade de Rede</h2>
          <p style={{ color: '#94A3B8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>{errorMsg}</p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setStatus('idle'); fetchProperty(); }}>Tentar Novamente</button>
        </div>
      )}

      {/* ── Idle: escolher unidade ─────────────────────────────────────────── */}
      {status === 'idle' && property && (
        <div className="fade-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {property.type === 'individual' || property.type === 'house' ? (
            <div className="visitor-card" style={{ textAlign: 'center', padding: '36px 24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
                Residência
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF', marginBottom: '40px', letterSpacing: '-0.3px' }}>
                Principal
              </h2>
              
              <div className="pulse-button-wrapper" style={{ marginBottom: '40px' }}>
                <button
                  id="btn-tocar-campainha"
                  className="pulse-button"
                  onClick={() => handleCall(property.units[0])}
                >
                  <Bell size={38} style={{ animation: 'wiggle 2.5s infinite ease-in-out' }} />
                  <span style={{ letterSpacing: '1px' }}>TOCAR</span>
                </button>
              </div>
              
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
                Toque no botão para chamar o morador e iniciar o atendimento.
              </p>
            </div>
          ) : (
            <div className="visitor-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontWeight: 800, fontSize: '15px', textAlign: 'center', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Para quem é a visita?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '42vh', overflowY: 'auto', paddingRight: '4px' }}>
                {property.units.map(unit => (
                  <button
                    key={unit.id}
                    id={`btn-unit-${unit.id}`}
                    className="btn-unit-select"
                    onClick={() => handleCall(unit)}
                  >
                    <span style={{ fontSize: '17px', fontWeight: 700 }}>{unit.name}</span>
                    <ChevronRight size={18} color="#3B82F6" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Chamando ──────────────────────────────────────────────────────── */}
      {status === 'calling' && (
        <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 28px' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #3B82F6', borderRadius: '50%', animation: 'pulse-ring 2s infinite ease-in-out', opacity: 0.2 }} />
            <div style={{ position: 'absolute', inset: '8px', background: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}>
              <Bell size={34} color="#FFF" style={{ animation: 'wiggle 1.5s infinite ease-in-out' }} />
            </div>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px', color: '#FFF' }}>Chamando...</h2>
          <p style={{ color: '#94A3B8', marginBottom: '28px', fontSize: '14px' }}>
            Unidade: <span style={{ color: '#FFF', fontWeight: 700 }}>{callingUnit?.name}</span>
          </p>

          <div style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '28px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#3B82F6', fontFamily: 'monospace' }}>
              00:{countdown.toString().padStart(2, '0')}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '28px', lineHeight: '1.5' }}>
            📷 Sua câmera e áudio estão ativos para identificação.
          </p>

          <button
            className="btn-secondary"
            style={{ 
              background: 'rgba(239,68,68,0.08)', 
              border: '1px solid rgba(239,68,68,0.2)', 
              color: '#F87171', 
              padding: '12px 24px', 
              borderRadius: '14px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              margin: '0 auto',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={handleHangup}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            <PhoneOff size={16} /> Cancelar Chamada
          </button>
        </div>
      )}

      {/* ── Chamada ativa (áudio bidirecional + vídeo do morador) ──────── */}
      {status === 'answered' && (
        <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '28px 20px' }}>
          {/* Vídeo do morador (aparece quando ele ativa a câmera) */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#090d16', marginBottom: '20px', minHeight: '200px', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', objectFit: 'cover', minHeight: '200px' }} />
            <div style={{ 
              position: 'absolute', 
              top: '12px', 
              left: '12px', 
              background: '#10B981', 
              padding: '4px 10px', 
              borderRadius: '100px', 
              fontSize: '10px', 
              fontWeight: 900, 
              color: '#FFF', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              animation: 'subtle-pulse 1.5s infinite'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFF' }} /> AO VIVO
            </div>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#10B981' }}>
            Chamada Atendida
          </h2>
          <p style={{ color: '#94A3B8', lineHeight: 1.5, marginBottom: '24px', fontSize: '13px' }}>
            O morador está online. Vocês já podem conversar por voz e vídeo!
          </p>

          <button
            className="btn-secondary"
            style={{ 
              background: 'rgba(239,68,68,0.08)', 
              border: '1px solid rgba(239,68,68,0.2)', 
              color: '#F87171', 
              padding: '12px 24px', 
              borderRadius: '14px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              margin: '0 auto',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={handleHangup}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            <PhoneOff size={16} /> Encerrar Conversa
          </button>
        </div>
      )}

      {/* ── Morador monitorando (furtivo) ──────────────────────────────────── */}
      {status === 'monitored' && (
        <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(245,158,11,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Video size={36} color="#F59E0B" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: '#F59E0B' }}>
            Transmitindo...
          </h2>
          <p style={{ color: '#94A3B8', lineHeight: 1.5, marginBottom: '28px', fontSize: '13px' }}>
            Aguarde um momento enquanto o morador responde ao chamado.
          </p>

          <button
            className="btn-secondary"
            style={{ 
              background: 'rgba(239,68,68,0.08)', 
              border: '1px solid rgba(239,68,68,0.2)', 
              color: '#F87171', 
              padding: '12px 24px', 
              borderRadius: '14px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              margin: '0 auto',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={handleHangup}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            <PhoneOff size={16} /> Cancelar Chamada
          </button>
        </div>
      )}

      {/* ── Portão Liberado ─────────────────────────────────────────────── */}
      {status === 'authorized' && (
        <div className="visitor-card fade-in" style={{ 
          textAlign: 'center', 
          padding: '40px 24px', 
          border: '2px solid #10B981', 
          background: 'rgba(16,185,129,0.06)',
          boxShadow: '0 15px 40px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ 
            width: '90px', 
            height: '90px', 
            background: '#10B981', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 28px', 
            boxShadow: '0 0 35px rgba(16,185,129,0.4)', 
            animation: 'subtle-pulse 1.8s infinite' 
          }}>
            <KeyRound size={40} color="#000" />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#10B981', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Portão Liberado!</h2>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', marginBottom: '6px' }}>Seja bem-vindo!</p>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.5' }}>O morador autorizou sua entrada na residência.</p>
        </div>
      )}

      {/* ── Chamada encerrada ─────────────────────────────────────────────── */}
      {status === 'ended' && (
        <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <PhoneOff size={30} color="#94A3B8" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', color: '#FFF' }}>Chamada Finalizada</h2>
          <p style={{ color: '#94A3B8', marginBottom: '24px', fontSize: '13px' }}>A chamada foi encerrada pelo morador.</p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setStatus('idle'); setCallingUnit(null); }}>Chamar Novamente</button>
        </div>
      )}

      <footer style={{ marginTop: 'auto', paddingTop: '48px' }}>
        <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', letterSpacing: '0.5px' }}>
          Tecnologia Campainha Digital® • Conexão P2P Criptografada
        </p>
      </footer>
    </div>
  );
}
