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
      background: '#070A13', 
      color: '#F8FAFC', 
      padding: '40px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Esferas de Efeito Aurora de Fundo */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 245, 212, 0.12) 0%, rgba(0, 187, 249, 0.04) 70%, transparent 100%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.04) 75%, transparent 100%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.92); opacity: 0.8; }
          50% { transform: scale(1.18); opacity: 0.35; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          12%, 48% { transform: rotate(-14deg); }
          24%, 60% { transform: rotate(14deg); }
          36% { transform: rotate(-8deg); }
          72% { transform: rotate(0deg); }
        }
        @keyframes subtle-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.15); }
        }
        .visitor-container {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          margin: auto 0;
          box-sizing: border-box;
          z-index: 1;
        }
        .pulse-button-wrapper {
          position: relative;
          width: 180px;
          height: 180px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-button-wrapper::before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 4px solid rgba(0, 245, 212, 0.3);
          animation: pulse-ring 2.5s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .pulse-button-wrapper::after {
          content: '';
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          border: 2px dashed rgba(0, 187, 249, 0.2);
          animation: pulse-ring 2.5s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-delay: 0.8s;
        }
        .pulse-button {
          width: 156px;
          height: 156px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00F5D4 0%, #00BBF9 100%);
          border: none;
          color: #070A13;
          font-size: 16px;
          font-weight: 900;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 16px 40px rgba(0, 245, 212, 0.4), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -4px 10px rgba(0,0,0,0.15);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 2;
        }
        .pulse-button:hover {
          transform: scale(1.06);
          box-shadow: 0 20px 50px rgba(0, 245, 212, 0.6), inset 0 3px 6px rgba(255,255,255,0.6), inset 0 -4px 10px rgba(0,0,0,0.15);
        }
        .pulse-button:active {
          transform: scale(0.94);
        }
        .visitor-card {
          background: rgba(13, 20, 38, 0.60);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 40px 28px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255,255,255,0.06);
          width: 100%;
          box-sizing: border-box;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .btn-unit-select {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #E2E8F0;
          padding: 18px 20px;
          border-radius: 20px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          width: 100%;
          box-sizing: border-box;
          text-align: left;
        }
        .btn-unit-select:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(0, 245, 212, 0.4);
          color: #FFF;
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 245, 212, 0.1);
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

      {/* Container principal de alinhamento estrutural */}
      <div className="visitor-container">
        {/* Header */}
        <header style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ 
            width: '72px', 
            height: '72px', 
            borderRadius: '24px', 
            background: 'rgba(0, 245, 212, 0.08)', 
            border: '1px solid rgba(0, 245, 212, 0.25)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '18px',
            boxShadow: '0 12px 30px rgba(0, 245, 212, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            <Logo size={42} showText={false} />
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 900, 
            letterSpacing: '-0.5px', 
            marginBottom: '8px', 
            background: 'linear-gradient(135deg, #FFFFFF 0%, #A5B4FC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 20px rgba(165, 180, 252, 0.15)',
            margin: '0 0 6px 0'
          }}>
            Campainha Digital
          </h1>
          {property && (
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#00F5D4', 
              fontSize: '13px',
              fontWeight: 700,
              background: 'rgba(0, 245, 212, 0.06)',
              padding: '8px 18px',
              borderRadius: '100px',
              border: '1px solid rgba(0, 245, 212, 0.15)',
              boxShadow: '0 4px 15px rgba(0, 245, 212, 0.05)'
            }}>
              <MapPin size={14} color="#00F5D4" /> {property.name}
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
              <div className="visitor-card" style={{ textAlign: 'center', padding: '40px 28px' }}>
                <span style={{ fontSize: '11px', fontWeight: 850, color: '#00F5D4', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>
                  Residência
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', marginBottom: '36px', letterSpacing: '-0.5px', marginTop: 0 }}>
                  Principal
                </h2>
                
                <div className="pulse-button-wrapper" style={{ marginBottom: '36px' }}>
                  <button
                    id="btn-tocar-campainha"
                    className="pulse-button"
                    onClick={() => handleCall(property.units[0])}
                  >
                    <Bell size={40} style={{ animation: 'wiggle 2.5s infinite ease-in-out' }} />
                    <span style={{ letterSpacing: '2px', fontSize: '15px' }}>TOCAR</span>
                  </button>
                </div>
                
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
                  Toque no botão para chamar o morador e iniciar o atendimento.
                </p>
              </div>
            ) : (
              <div className="visitor-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '36px 28px' }}>
                <p style={{ fontWeight: 800, fontSize: '14px', textAlign: 'center', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px', marginTop: 0 }}>
                  Selecione a residência para chamar:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '42vh', overflowY: 'auto', paddingRight: '4px' }}>
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
            <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 32px' }}>
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #00F5D4', borderRadius: '50%', animation: 'pulse-ring 2s infinite ease-in-out', opacity: 0.3 }} />
              <div style={{ position: 'absolute', inset: '8px', background: 'linear-gradient(135deg, #00F5D4 0%, #00BBF9 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 35px rgba(0, 245, 212, 0.45)' }}>
                <Bell size={36} color="#070A13" style={{ animation: 'wiggle 1.5s infinite ease-in-out' }} />
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: '#FFF', letterSpacing: '-0.5px', marginTop: 0 }}>Chamando...</h2>
            <p style={{ color: '#94A3B8', marginBottom: '28px', fontSize: '14px', margin: '0 0 28px 0' }}>
              Residência: <span style={{ color: '#00F5D4', fontWeight: 800 }}>{callingUnit?.name}</span>
            </p>

            <div style={{ display: 'inline-block', padding: '12px 28px', background: 'rgba(0, 245, 212, 0.04)', borderRadius: '18px', border: '1px solid rgba(0, 245, 212, 0.15)', marginBottom: '28px', boxShadow: 'inset 0 1px 10px rgba(0,245,212,0.05)' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#00F5D4', fontFamily: 'monospace', letterSpacing: '1px' }}>
                00:{countdown.toString().padStart(2, '0')}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px', lineHeight: '1.6', margin: '0 0 28px 0' }}>
              📷 Sua câmera e microfone estão ativos temporariamente para identificação.
            </p>

            <button
              className="btn-secondary"
              style={{ 
                background: 'rgba(239,68,68,0.06)', 
                border: '1px solid rgba(239,68,68,0.25)', 
                color: '#F87171', 
                padding: '14px 28px', 
                borderRadius: '16px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px', 
                margin: '0 auto',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                boxShadow: '0 4px 15px rgba(239,68,68,0.05)'
              }}
              onClick={handleHangup}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.14)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
              }}
            >
              <PhoneOff size={16} /> Cancelar Chamada
            </button>
          </div>
        )}

        {/* ── Chamada ativa (áudio bidirecional + vídeo do morador) ──────── */}
        {status === 'answered' && (
          <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '32px 24px' }}>
            {/* Vídeo do morador (aparece quando ele ativa a câmera) */}
            <div style={{ borderRadius: '24px', overflow: 'hidden', background: '#090d16', marginBottom: '24px', minHeight: '220px', position: 'relative', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', objectFit: 'cover', minHeight: '220px' }} />
              <div style={{ 
                position: 'absolute', 
                top: '14px', 
                left: '14px', 
                background: '#10B981', 
                padding: '6px 12px', 
                borderRadius: '100px', 
                fontSize: '11px', 
                fontWeight: 900, 
                color: '#FFF', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                boxShadow: '0 4px 15px rgba(16,185,129,0.35)',
                animation: 'subtle-pulse 1.5s infinite'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFF' }} /> MORADOR ONLINE
              </div>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: '#10B981', letterSpacing: '-0.5px', marginTop: 0 }}>
              Chamada Atendida
            </h2>
            <p style={{ color: '#94A3B8', lineHeight: 1.6, marginBottom: '28px', fontSize: '13px', margin: '0 0 28px 0' }}>
              O morador está online. Vocês já podem conversar por voz!
            </p>

            <button
              className="btn-secondary"
              style={{ 
                background: 'rgba(239,68,68,0.06)', 
                border: '1px solid rgba(239,68,68,0.25)', 
                color: '#F87171', 
                padding: '14px 28px', 
                borderRadius: '16px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px', 
                margin: '0 auto',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                boxShadow: '0 4px 15px rgba(239,68,68,0.05)'
              }}
              onClick={handleHangup}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.14)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
              }}
            >
              <PhoneOff size={16} /> Encerrar Conversa
            </button>
          </div>
        )}

        {/* ── Morador monitorando (furtivo) ──────────────────────────────────── */}
        {status === 'monitored' && (
          <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(245,158,11,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Video size={36} color="#F59E0B" />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '12px', color: '#F59E0B', letterSpacing: '-0.5px', marginTop: 0 }}>
              Transmitindo...
            </h2>
            <p style={{ color: '#94A3B8', lineHeight: 1.6, marginBottom: '28px', fontSize: '13px', margin: '0 0 28px 0' }}>
              Aguarde um momento enquanto o morador responde ao chamado.
            </p>

            <button
              className="btn-secondary"
              style={{ 
                background: 'rgba(239,68,68,0.06)', 
                border: '1px solid rgba(239,68,68,0.25)', 
                color: '#F87171', 
                padding: '14px 28px', 
                borderRadius: '16px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px', 
                margin: '0 auto',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                boxShadow: '0 4px 15px rgba(239,68,68,0.05)'
              }}
              onClick={handleHangup}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.14)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
              }}
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
            border: '2px solid #00F5D4', 
            background: 'rgba(0, 245, 212, 0.05)',
            boxShadow: '0 25px 50px rgba(0, 245, 212, 0.15)'
          }}>
            <div style={{ 
              width: '96px', 
              height: '96px', 
              background: 'linear-gradient(135deg, #00F5D4 0%, #00BBF9 100%)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 28px', 
              boxShadow: '0 0 35px rgba(0, 245, 212, 0.4)', 
              animation: 'subtle-pulse 1.8s infinite' 
            }}>
              <KeyRound size={42} color="#070A13" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#00F5D4', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 0 }}>Portão Liberado!</h2>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', marginBottom: '8px', margin: '0 0 8px 0' }}>Seja bem-vindo!</p>
            <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>O acesso à residência foi autorizado pelo morador.</p>
          </div>
        )}

        {/* ── Chamada encerrada ─────────────────────────────────────────────── */}
        {status === 'ended' && (
          <div className="visitor-card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <PhoneOff size={32} color="#94A3B8" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '10px', color: '#FFF', letterSpacing: '-0.5px', marginTop: 0 }}>Chamada Finalizada</h2>
            <p style={{ color: '#94A3B8', marginBottom: '28px', fontSize: '14px', margin: '0 0 28px 0' }}>A chamada foi encerrada pelo morador.</p>
            <button className="btn-primary" style={{ width: '100%', fontWeight: 800 }} onClick={() => { setStatus('idle'); setCallingUnit(null); }}>Chamar Novamente</button>
          </div>
        )}

        {/* Footer */}
        <footer style={{ width: '100%', marginTop: '16px', zIndex: 1 }}>
          <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', letterSpacing: '0.8px', margin: 0, fontWeight: 700 }}>
            TECNOLOGIA CAMPAINHA DIGITAL® • CONEXÃO P2P CRIPTOGRAFADA
          </p>
        </footer>
      </div>
    </div>
  );
}
