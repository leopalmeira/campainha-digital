import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Phone, MicOff, PhoneOff, Bell, ShieldCheck, EyeOff, Download, AlertCircle, Video, VideoOff, LogOut, History, Settings, Home, KeyRound, MessageCircle, Building2, Mail, ShoppingBag, Share2, X } from 'lucide-react';
import { HistoryPanel, SettingsPanel, ResidentSupportPanel, DEFAULT_CATEGORIES } from './ResidentPanels';
import Logo from '../components/Logo';
import MessagesPanel from '../components/resident/MessagesPanel';
import IntercomPanel from '../components/resident/IntercomPanel';
import ServicesPanel from '../components/resident/ServicesPanel';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
  ]
};

// ─── Som REAL de campainha (MP3) ─────────────────────────────────────────────
let doorbellAudio = null;
let vibrateInterval = null;

function startDoorbell() {
  try {
    if (!doorbellAudio) {
      doorbellAudio = new Audio('/doorbell.mp3');
      doorbellAudio.loop = true;
      doorbellAudio.volume = 1.0; // Volume máximo
    }
    doorbellAudio.currentTime = 0;
    doorbellAudio.play().catch(e => console.warn('[Doorbell]', e));
  } catch (e) { console.warn('[Doorbell]', e); }

  // Vibração contínua agressiva
  const vibrateLoop = () => { if ('vibrate' in navigator) navigator.vibrate([500, 100, 500, 100, 500, 100, 500]); };
  vibrateLoop();
  vibrateInterval = setInterval(vibrateLoop, 2400);
}

function stopDoorbell() {
  if (doorbellAudio) { doorbellAudio.pause(); doorbellAudio.currentTime = 0; }
  if (vibrateInterval) { clearInterval(vibrateInterval); vibrateInterval = null; }
  if ('vibrate' in navigator) navigator.vibrate(0);
}


export default function ResidentDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('home'); // home | history | messages
  const [showMenu, setShowMenu] = useState(false);
  const [call, setCall] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|ringing|active|monitoring
  const [audioError, setAudioError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [unitName, setUnitName] = useState(() => localStorage.getItem('cd_unit_name') || 'Minha Casa');
  const [accessCode, setAccessCode] = useState('');
  const [visitorSocketId, setVisitorSocketId] = useState(null);
  const [quickMsgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cd_quick_msgs') || 'null') || DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
  });
  const [activeMsgCat, setActiveMsgCat] = useState('general');
  const [sentMsg, setSentMsg] = useState('');
  const [neighborBlock, setNeighborBlock] = useState('');
  const [neighborNumber, setNeighborNumber] = useState('');
  const [neighborResults, setNeighborResults] = useState([]);
  const [neighborSearching, setNeighborSearching] = useState(false);
  const [neighborError, setNeighborError] = useState('');
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem('residentPropertyId'));
  const [broadcastMessages, setBroadcastMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [supportPhone, setSupportPhone] = useState('');

  const [propertyType, setPropertyType] = useState(() => localStorage.getItem('residentPropertyType') || 'individual');
  const [hasGateFeature, setHasGateFeature] = useState(() => localStorage.getItem('residentHasGateFeature') === 'true');
  const [featureNeighborChat, setFeatureNeighborChat] = useState(() => localStorage.getItem('residentFeatureNeighborChat') === 'true');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const isNew = new URLSearchParams(window.location.search).get('new') === 'true';
    const dismissed = sessionStorage.getItem('cd_welcome_dismissed');
    if (isNew && !dismissed) {
      setShowWelcomeModal(true);
    }
  }, []);

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);

  // Refs para escuta ativa dos estados no WebRTC sem stale closures
  const statusRef = useRef(status);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    // Busca informações salvas localmente para evitar consultas inseguras
    const savedCode = localStorage.getItem('residentAccessCode');
    const savedPropId = localStorage.getItem('residentPropertyId');
    if (savedCode) setAccessCode(savedCode);

    const s = io(API, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 20 });
    socketRef.current = s;
    s.emit('register_resident', { unitId: id, propertyId: savedPropId });

    // Fetch broadcast messages and support phone
    const fetchData = async () => {
      if (!savedPropId) return;
      try {
        const res = await fetch(`${API}/api/properties/${savedPropId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setBroadcastMessages(data);
          const readIds = JSON.parse(localStorage.getItem('cd_read_msgs') || '[]');
          setUnreadCount(data.filter(m => !readIds.includes(m.id)).length);
        }
        
        const suppRes = await fetch(`${API}/api/properties/${savedPropId}/support`);
        if (suppRes.ok) {
          const suppData = await suppRes.json();
          if (suppData.supportPhone) setSupportPhone(suppData.supportPhone);
        }
      } catch {}
    };
    fetchData();


    s.on('incoming_call', (data) => {
      setCall(data); setStatus('ringing'); setVisitorSocketId(data.visitorSocketId);
      setTab('home'); setSentMsg('');
      // Som de campainha real + vibração
      startDoorbell();
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🔔 CAMPAINHA!', { body: `${unitName} — alguém está na porta!`, icon: '/logo.png' });
        } catch {}
      }
    });

    s.on('call_answered', async ({ residentSocketId, mode }) => {
      setVisitorSocketId(residentSocketId);
      setStatus('active');
      await startWebRTC(residentSocketId, mode);
    });

    s.on('webrtc_offer', async ({ sender, offer }) => handleOffer(sender, offer));
    s.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });
    s.on('call_blocked_dnd', ({ message }) => {
      alert(message);
    });
    s.on('call_ended', () => { setStatus('idle'); setCall(null); stopAll(); });

    // Receber mensagens broadcast do condomínio
    s.on('broadcast_message', (msg) => {
      setBroadcastMessages(prev => [msg, ...prev]);
      setUnreadCount(prev => prev + 1);
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification(`📢 ${msg.title}`, { body: msg.body, icon: '/logo.png' }); } catch {}
      }
    });

    // Receber mensagem direta do porteiro
    s.on('doorman_message', (msg) => {
      const porteiroMsg = {
        id: Date.now().toString(),
        title: `📋 Mensagem da ${msg.senderName || 'Portaria'}`,
        body: msg.message,
        priority: 'normal',
        createdAt: msg.timestamp || new Date().toISOString()
      };
      setBroadcastMessages(prev => [porteiroMsg, ...prev]);
      setUnreadCount(prev => prev + 1);
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification(`📋 Portaria`, { body: msg.message, icon: '/logo.png' }); } catch {}
      }
    });


    const bip = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', bip);
    
    // Configura Web Push para receber chamada com a tela apagada/fechada
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then(async (perm) => {
        if (perm === 'granted') {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'BOKz4CjOXwpKxhmqIKPx22wV3oAZmUHbrbSvucyErK7tcZB7XxNfiAD9itYQi46nMw0o_7nbuqe6zHu5NiwI0tc'
            });
            await fetch(`${API}/api/subscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: sub,
                unitId: id,
                propertyId: savedPropId
              })
            });
            console.log('Push Subscription enviada com sucesso');
          } catch (e) {
            console.error('Falha ao assinar Push:', e);
          }
        }
      });
    }

    return () => { s.disconnect(); window.removeEventListener('beforeinstallprompt', bip); stopAll(); };
  }, [id]);

  const stopRing = () => { stopDoorbell(); setAudioError(false); };
  const stopAll = () => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
  };

  const searchNeighbor = async () => {
    if (!neighborBlock && !neighborNumber) return;
    setNeighborSearching(true); setNeighborError(''); setNeighborResults([]);
    try {
      const params = new URLSearchParams();
      if (neighborBlock) params.set('block', neighborBlock);
      if (neighborNumber) params.set('number', neighborNumber);
      const r = await fetch(`${API}/api/properties/${propertyId}/search-unit?${params}`);
      if (r.ok) {
        const data = await r.json();
        setNeighborResults(data.filter(u => u.id !== id));
      } else {
        const d = await r.json();
        setNeighborError(d.error || 'Unidade não encontrada.');
      }
    } catch { setNeighborError('Erro de conexão.'); }
    setNeighborSearching(false);
  };

  const handleIntercomCall = (neighbor) => {
    if (!socketRef.current || !propertyId) return;
    setStatus('active');
    socketRef.current.emit('initiate_call', {
      unitId: neighbor.id,
      propertyId: propertyId,
      callerName: unitName,
      photoBase64: null
    });
    setVisitorSocketId(null);
  };

  const markMessagesRead = () => {
    const ids = broadcastMessages.map(m => m.id);
    localStorage.setItem('cd_read_msgs', JSON.stringify(ids));
    setUnreadCount(0);
  };

  const handleOffer = useCallback(async (senderSocketId, offer) => {
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;
    
    // Morador envia APENAS áudio (câmera oculta por padrão)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    
    // Se estiver em modo anônimo (monitoramento), inicia com o microfone mutado
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack && (statusRef.current === 'monitoring' || isMutedRef.current)) {
      audioTrack.enabled = false;
    }
    
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (e) => { if (remoteVideoRef.current && e.streams[0]) { remoteVideoRef.current.srcObject = e.streams[0]; remoteVideoRef.current.play().catch(() => {}); } };
    pc.onicecandidate = (e) => { if (e.candidate) socketRef.current.emit('webrtc_ice_candidate', { target: senderSocketId, candidate: e.candidate }); };
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current.emit('webrtc_answer', { target: senderSocketId, answer: pc.localDescription });
  }, []);

  const startWebRTC = useCallback(async (targetSocketId, mode) => {
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    
    // Se for modo monitor/anônimo, mutar track de áudio
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack && (mode === 'monitor' || statusRef.current === 'monitoring' || isMutedRef.current)) {
      audioTrack.enabled = false;
    }
    
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current.emit('webrtc_ice_candidate', { target: targetSocketId, candidate: e.candidate });
    };

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    socketRef.current.emit('webrtc_offer', { target: targetSocketId, offer: pc.localDescription });
  }, []);

  const handleMonitor = () => {
    stopRing(); 
    setStatus('monitoring'); 
    setCamOn(false);
    setIsMuted(true); // Silencia o microfone do morador
    // Pede apenas áudio para criar a conexão WebRTC (recebe vídeo do visitante)
    socketRef.current.emit('answer_call', { visitorSocketId: call.visitorSocketId, mode: 'monitor', unitId: id });
  };

  const handleAnswer = async () => {
    stopRing(); 
    setStatus('active'); 
    setCamOn(false);
    
    // Reativa o microfone se ele estava mutado (ao clicar em Falar no Modo Anônimo)
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
    }
    setIsMuted(false);
    
    // Sempre atende SÓ com áudio — câmera do morador fica oculta até clicar no botão
    socketRef.current.emit('answer_call', { visitorSocketId: call.visitorSocketId, mode: 'active', unitId: id });
  };

  const handleEnd = () => {
    stopRing();
    if (visitorSocketId) socketRef.current.emit('call_ended', { target: visitorSocketId });
    setStatus('idle'); setCall(null); stopAll();
  };

  const handleOpenGate = () => {
    const propId = call?.propertyId || localStorage.getItem('residentPropertyId');
    if (socketRef.current && call) {
      socketRef.current.emit('authorize_entry', { 
        unitId: id, 
        propertyId: propId, 
        visitorId: visitorSocketId || call.visitorSocketId 
      });
      sendQuickMsg("Portão Aberto! Pode entrar.");
      setTimeout(() => {
        handleEnd();
      }, 3000); // Ends call 3 seconds after opening gate
    }
  };

  const toggleMute = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  };

  const toggleCam = async () => {
    if (!camOn) {
      try {
        const vs = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const videoTrack = vs.getVideoTracks()[0];
        if (!videoTrack) return;

        // Adiciona ao stream local
        localStreamRef.current?.addTrack(videoTrack);

        // Adiciona ao PeerConnection e renegocia para o visitante receber
        const pc = pcRef.current;
        if (pc) {
          const sender = pc.addTrack(videoTrack, localStreamRef.current);
          // Renegociar conexão para enviar o novo track
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit('webrtc_offer', { target: visitorSocketId, offer: pc.localDescription });
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }
        setCamOn(true);
      } catch (e) { console.warn('[ToggleCam]', e); }
    } else {
      // Desligar câmera — remove track do PC e para
      const pc = pcRef.current;
      localStreamRef.current?.getVideoTracks().forEach(t => {
        t.stop();
        localStreamRef.current?.removeTrack(t);
        if (pc) {
          const sender = pc.getSenders().find(s => s.track === t);
          if (sender) pc.removeTrack(sender);
        }
      });
      setCamOn(false);
    }
  };

  const authorizeEntry = () => {
    if (!socketRef.current || !call) return;
    socketRef.current.emit('authorize_entry', { 
      unitId: id, 
      propertyId: call.propertyId,
      visitorId: call.visitId 
    });
    alert('Entrada autorizada! Notificação enviada à portaria.');
  };

  const sendQuickMsg = (msg) => {
    if (!visitorSocketId) return;
    socketRef.current.emit('send_quick_message', { target: visitorSocketId, message: msg });
    setSentMsg(msg);
    setTimeout(() => setSentMsg(''), 3000);
  };

  const saveSettings = () => { localStorage.setItem('cd_unit_name', unitName); };

  const handleShareCode = () => {
    const shareText = `Olá! Adicionei você à nossa Campainha Digital. Acesse o link abaixo para instalar o app e digite o código de acesso único da nossa residência:\n\n🔑 Código Único: ${accessCode}\n\n📲 Link do App: ${window.location.origin}/auth?tab=code&code=${accessCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Campainha Digital - Acesso Compartilhado',
        text: shareText,
        url: `${window.location.origin}/auth?tab=code&code=${accessCode}`
      }).catch(err => {
        console.warn('Erro ao compartilhar nativamente:', err);
      });
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank');
    }
  };

  const activeC = quickMsgs.find(c => c.id === activeMsgCat);

  // ── Bottom Nav (Only Essentials) ──────────────────────────────────────────
  const NavBar = () => (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--border-subtle)', display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {[
        { key: 'home', icon: <Home size={22} />, label: 'Início' },
        { key: 'messages', icon: <Mail size={22} />, label: 'Avisos', badge: unreadCount },
        (featureNeighborChat || propertyType !== 'individual') ? { key: 'intercom', icon: <Building2 size={22} />, label: 'Vizinhos' } : null,
        { key: 'history', icon: <History size={22} />, label: 'Atividade' },
      ].filter(Boolean).map(n => (
        <button key={n.key} onClick={() => { setTab(n.key); if (n.key === 'messages') markMessagesRead(); }} style={{ flex: 1, padding: '12px 4px 8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: tab === n.key ? 'var(--primary)' : '#94A3B8', fontSize: '11px', fontWeight: 700, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' }}>
          <div style={{ transform: tab === n.key ? 'translateY(-2px)' : 'none', transition: 'transform 0.3s' }}>{n.icon}</div>
          {n.badge > 0 && <div style={{ position:'absolute',top:'8px',right:'calc(50% - 18px)',width:'16px',height:'16px',borderRadius:'50%',background:'#EF4444',color:'#fff',fontSize:'9px',fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center', border: '2px solid #fff' }}>{n.badge}</div>}
          <span style={{ opacity: tab === n.key ? 1 : 0.8 }}>{n.label}</span>
          {tab === n.key && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', background: 'var(--primary)', borderRadius: '0 0 4px 4px' }} />}
        </button>
      ))}
    </nav>
  );

  // ── Side Menu (Hamburger) ──────────────────────────────────────────────────
  const HamburgerMenu = () => (
    <>
      <div 
        onClick={() => setShowMenu(false)}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, opacity: showMenu ? 1 : 0, visibility: showMenu ? 'visible' : 'hidden', transition: 'all 0.3s' }} 
      />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '290px', background: '#070B14', borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 1001, transform: showMenu ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', boxShadow: '12px 0 40px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '0 8px' }}>
          <Logo size={32} />
          <button onClick={() => setShowMenu(false)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color="#94A3B8" /></button>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase', paddingLeft: '8px' }}>FUNCIONALIDADES</p>
          
          {(featureNeighborChat || propertyType !== 'individual') && (
            <button onClick={() => { setTab('intercom'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: 'none', background: tab === 'intercom' ? 'linear-gradient(135deg, #3B82F6, #06B6D4)' : 'transparent', color: tab === 'intercom' ? '#FFFFFF' : '#94A3B8', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <Building2 size={18} color={tab === 'intercom' ? '#FFFFFF' : '#64748B'} /> Interfone Digital
            </button>
          )}

          <button onClick={() => { setTab('services'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: 'none', background: tab === 'services' ? 'linear-gradient(135deg, #3B82F6, #06B6D4)' : 'transparent', color: tab === 'services' ? '#FFFFFF' : '#94A3B8', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <ShoppingBag size={18} color={tab === 'services' ? '#FFFFFF' : '#64748B'} /> Parceiros da Região
          </button>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
          
          <p style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase', paddingLeft: '8px' }}>COMPARTILHAR ACESSO</p>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#06B6D4', fontFamily: 'monospace', letterSpacing: '2px' }}>
                {accessCode || '---'}
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(accessCode);
                  alert('Código copiado com sucesso!');
                }}
                style={{
                  background: 'rgba(6,182,212,0.1)',
                  border: 'none',
                  color: '#06B6D4',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}
              >
                Copiar
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.3 }}>
              Compartilhe com até 4 familiares para atenderem esta campainha.
            </p>
            <button 
              onClick={handleShareCode}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                border: 'none',
                borderRadius: '12px',
                color: '#FFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
              }}
            >
              <Share2 size={13} /> Enviar para Familiar
            </button>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
          
          <p style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase', paddingLeft: '8px' }}>APLICATIVO MÓVEL</p>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.06))',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📲 Campainha no Celular
            </span>
            <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.3 }}>
              Instale o App na tela inicial para receber chamadas de vídeo em segundo plano.
            </p>
            {installPrompt ? (
              <button 
                onClick={async () => { 
                  installPrompt.prompt(); 
                  const r = await installPrompt.userChoice; 
                  if (r.outcome === 'accepted') setInstallPrompt(null); 
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#10B981',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                }}
              >
                <Download size={12} /> Instalar Agora
              </button>
            ) : (
              <div style={{ fontSize: '10px', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                Toque no botão de compartilhar (Safari) ou menu (Chrome) e selecione <strong>Adicionar à Tela de Início</strong>.
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
          
          <p style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase', paddingLeft: '8px' }}>CONTA</p>
          
          <button onClick={() => { setTab('settings'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: 'none', background: tab === 'settings' ? 'rgba(255,255,255,0.03)' : 'transparent', color: '#94A3B8', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <Settings size={18} color="#64748B" /> Configurações
          </button>
          
          <button onClick={() => { setTab('support'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: 'none', background: tab === 'support' ? 'rgba(255,255,255,0.03)' : 'transparent', color: '#94A3B8', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <MessageCircle size={18} color={tab === 'support' ? '#06B6D4' : '#64748B'} /> Suporte
          </button>
        </div>

        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontWeight: 700, fontSize: '14px', cursor: 'pointer', width: '100%', justifyContent: 'center', transition: 'background 0.2s' }}>
          <LogOut size={18} /> Sair do App
        </button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', paddingBottom: '72px' }} onClick={() => { if (doorbellAudio) doorbellAudio.play().then(() => doorbellAudio.pause()).catch(() => {}); }}>

      {/* Header (Premium Sticky) */}
      <div style={{ 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(12px)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 90,
        borderBottom: '1px solid #F1F5F9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowMenu(true)} style={{ background: '#0F172A', color: '#FFF', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '20px' }}>
              <div style={{ height: '2px', width: '100%', background: '#FFF', borderRadius: '2px' }} />
              <div style={{ height: '2px', width: '100%', background: '#FFF', borderRadius: '2px' }} />
              <div style={{ height: '2px', width: '60%', background: '#FFF', borderRadius: '2px' }} />
            </div>
          </button>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>{unitName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: status === 'idle' ? '#10B981' : '#EF4444' }} />
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{status === 'idle' ? 'Disponível' : 'Em Chamada'}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {installPrompt && (
            <button onClick={async () => { installPrompt.prompt(); const r = await installPrompt.userChoice; if (r.outcome === 'accepted') setInstallPrompt(null); }}
              style={{ background: '#F1F5F9', color: '#1E293B', border: 'none', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Instalar
            </button>
          )}
        </div>
      </div>

      {audioError && <div style={{ margin: '12px 24px 0', background: '#EF4444', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={16} />Toque na tela para ativar o som!</div>}

      {/* ── HOME TAB ── */}
      {tab === 'home' && (
        <>
          {/* IDLE */}
          {status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 32px', gap: '20px' }}>

              {/* Bell hero */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#FFF', border: '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                  <Bell size={36} color="#10B981" style={{ opacity: 0.8 }}/>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0F172A' }}>Aguardando Chamadas</h3>
                <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Você será notificado quando tocarem.</p>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', background: 'rgba(16,185,129,0.08)', padding: '5px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: 700 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}/> Conectado
                </div>
              </div>

              {/* Mensagens do condomínio - colapssável */}
              <MessagesPanel messages={broadcastMessages} unreadCount={unreadCount} onClear={markMessagesRead}/>

            </div>
          )}

          {/* RINGING */}
          {status === 'ringing' && call && (
            <div style={{ padding: '16px 24px' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '13px', letterSpacing: '1px' }}>CHAMADA RECEBIDA</span>
              </div>

              {/* Foto visitante */}
              <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#F1F5F9', aspectRatio: '4/3', position: 'relative', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                {call.photo ? <img src={call.photo} alt="Visitante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}><Bell size={48} style={{ opacity: 0.1 }} /></div>}
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', color: '#0F172A', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backdropFilter: 'blur(8px)', border: '1px solid var(--border-subtle)' }}>
                  📷 {call.callerName || 'Visitante'} na porta
                </div>
              </div>

              {/* Caller Name highlight */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{call.callerName === 'Visitante' ? 'Chamada do Portão' : `Interfone: ${call.callerName}`}</h3>
              </div>

              {/* Mensagens rápidas */}
              <div style={{ background: '#FFF', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px' }}>📨 ENVIAR MENSAGEM RÁPIDA</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {quickMsgs.map(c => (
                    <button key={c.id} onClick={() => setActiveMsgCat(c.id)}
                      style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeMsgCat === c.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeMsgCat === c.id ? '#000' : 'var(--text-muted)' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {activeC?.messages.map((msg, i) => (
                    <button key={i} onClick={() => sendQuickMsg(msg)}
                      style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid var(--border-subtle)', background: sentMsg === msg ? '#10B981' : 'rgba(255,255,255,0.05)', color: sentMsg === msg ? '#000' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                      {sentMsg === msg ? '✓ Enviado' : `"${msg}"`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de atender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <button onClick={handleMonitor} style={{ padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px' }}>
                  <EyeOff size={22} color="var(--primary)" />Modo Anônimo
                </button>
                <button onClick={() => handleAnswer()} className="btn-primary" style={{ padding: '16px', borderRadius: '14px', background: '#10B981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
                  <Phone size={22} />Atender
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', marginBottom: '10px' }}>Sua câmera fica oculta. Ative depois clicando no ícone 📷</p>
              <button onClick={handleEnd} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PhoneOff size={18} /> Recusar
              </button>
            </div>
          )}

          {/* MONITORING */}
          {status === 'monitoring' && call && (
            <div style={{ padding: '16px 24px' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '14px', padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                <EyeOff size={16} color="#F59E0B" /><span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '13px' }}>Modo Anônimo Ativo — microfone do morador silenciado</span>
              </div>
              <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#000', position: 'relative', marginBottom: '16px', minHeight: '220px' }}>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(245,158,11,0.9)', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, color: '#000' }}>👁 ANÔNIMO</div>
              </div>

              {/* Mensagens rápidas */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>ENVIAR MENSAGEM SEM REVELAR CÂMERA</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {quickMsgs.find(c => c.id === 'general')?.messages.map((msg, i) => (
                    <button key={i} onClick={() => sendQuickMsg(msg)}
                      style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid var(--border-subtle)', background: sentMsg === msg ? '#10B981' : 'rgba(255,255,255,0.05)', color: sentMsg === msg ? '#000' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                      {sentMsg === msg ? '✓' : `"${msg}"`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleAnswer()} className="btn-primary" style={{ flex: 1, padding: '14px', background: '#10B981', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Phone size={18} /> Falar
                </button>
                <button onClick={authorizeEntry} style={{ flex: 1, padding: '14px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid #10B981', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
                  <KeyRound size={18} /> Abrir
                </button>
                <button onClick={handleEnd} style={{ width: '56px', height: '52px', borderRadius: '14px', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneOff size={20} />
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE CALL */}
          {status === 'active' && call && (
            <div style={{ padding: '16px 24px' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '13px' }}>Chamada em andamento</span>
              </div>

              {/* Vídeos */}
              <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', background: '#000', minHeight: '220px', marginBottom: '16px' }}>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', objectFit: 'cover' }} />
                {camOn && <video ref={localVideoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: '12px', right: '12px', width: '100px', borderRadius: '12px', border: '2px solid var(--primary)' }} />}
              </div>

              {/* Mensagens */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {quickMsgs.find(c => c.id === 'general')?.messages.slice(0, 3).map((msg, i) => (
                  <button key={i} onClick={() => sendQuickMsg(msg)}
                    style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid var(--border-subtle)', background: sentMsg === msg ? '#10B981' : 'rgba(255,255,255,0.05)', color: sentMsg === msg ? '#000' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                    {sentMsg === msg ? '✓' : `"${msg}"`}
                  </button>
                ))}
              </div>

              {/* Controles */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
                <button onClick={toggleMute} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', color: isMuted ? '#EF4444' : 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MicOff size={22} />
                </button>
                <button onClick={toggleCam} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: camOn ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.08)', color: camOn ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {camOn ? <Video size={22} /> : <VideoOff size={22} />}
                </button>
                <button onClick={handleEnd} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}>
                  <PhoneOff size={22} />
                </button>
              </div>

              {(hasGateFeature && propertyType !== 'individual') && (
                <button onClick={handleOpenGate} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <KeyRound size={24} /> LIBERAR ENTRADA
                </button>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'messages' && (
        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>📢 Avisos do Condomínio</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>{broadcastMessages.length} mensagen{broadcastMessages.length !== 1 ? 's' : ''}</p>
          {broadcastMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
              <Mail size={40} style={{ opacity: 0.2, marginBottom: '12px' }}/>
              <p style={{ fontWeight: 600 }}>Nenhum aviso recebido</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {broadcastMessages.map(m => (
                <div key={m.id} style={{ background: '#FFF', border: `1px solid ${m.priority === 'urgent' ? 'rgba(239,68,68,0.3)' : '#E2E8F0'}`, borderRadius: '14px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {m.priority === 'urgent' && <span style={{ color: '#EF4444' }}>🚨</span>}
                      {m.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {tab === 'intercom' && (
        <div style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Interfone Digital</h2>
          {propertyId && <IntercomPanel propertyId={propertyId} unitId={id} socketRef={socketRef} unitName={unitName}/>}
        </div>
      )}

      {tab === 'services' && (
        <div style={{ padding: '20px' }}>
          <ServicesPanel/>
        </div>
      )}

      {tab === 'history' && <HistoryPanel unitId={id} propertyId={localStorage.getItem('residentPropertyId')} />}
      {tab === 'settings' && <SettingsPanel unitName={unitName} setUnitName={setUnitName} onSave={saveSettings} unitId={id} propertyId={localStorage.getItem('residentPropertyId')} propertyType={propertyType} />}
      {tab === 'support' && <ResidentSupportPanel unitId={id} propertyId={localStorage.getItem('residentPropertyId')} propertyType={propertyType} />}

      {showWelcomeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div className="fade-in" style={{
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '28px',
            width: '100%',
            maxWidth: '420px',
            padding: '32px 24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            color: '#F8FAFC',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 20px rgba(16,185,129,0.1)'
            }}>
              <ShieldCheck size={36} color="#10B981" />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: '#10B981' }}>
              Ativação Concluída! 🎉
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px' }}>
              Sua campainha digital está ativa. Para receber chamadas de vídeo e voz em tempo real, instale o aplicativo.
            </p>

            {/* Código de acesso único destacado */}
            <div style={{
              background: 'rgba(15,23,42,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Código de Acesso dos Moradores
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', fontFamily: 'monospace', letterSpacing: '2px' }}>
                  {accessCode || '---'}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(accessCode);
                    alert('Código de acesso copiado!');
                  }}
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#60A5FA',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Copiar
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '10px', lineHeight: 1.4, margin: '8px 0 0' }}>
                Envie este código aos outros moradores da casa. Ao baixar o app, eles entrarão direto usando este código.
              </p>
            </div>

            {/* Botão de instalação PWA programático */}
            {installPrompt && (
              <button
                onClick={async () => {
                  installPrompt.prompt();
                  const r = await installPrompt.userChoice;
                  if (r.outcome === 'accepted') setInstallPrompt(null);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                  color: '#FFF',
                  padding: '14px',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}
              >
                <Download size={18} /> Instalar Aplicativo Agora
              </button>
            )}

            {/* Instruções PWA */}
            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '20px', padding: '16px', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFF', display: 'block', marginBottom: '12px' }}>
                📲 Como instalar o aplicativo:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#94A3B8', lineHeight: 1.4 }}>
                <div>
                  <strong style={{ color: '#E2E8F0' }}>Android (Chrome):</strong> Toque no menu <span style={{ color: '#FFF' }}>⋮</span> e selecione <span style={{ color: '#3B82F6', fontWeight: 700 }}>"Instalar aplicativo"</span> ou <span style={{ color: '#3B82F6', fontWeight: 700 }}>"Adicionar à tela inicial"</span>.
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                <div>
                  <strong style={{ color: '#E2E8F0' }}>iOS / iPhone (Safari):</strong> Toque no botão de compartilhar (ícone de seta pra cima <span style={{ color: '#FFF' }}>⎋</span>) e selecione <span style={{ color: '#3B82F6', fontWeight: 700 }}>"Adicionar à Tela de Início"</span>.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowWelcomeModal(false);
                sessionStorage.setItem('cd_welcome_dismissed', 'true');
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
              }}
              style={{
                width: '100%',
                background: '#10B981',
                boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                color: '#FFF',
                padding: '14px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              Começar a Usar o Painel
            </button>
          </div>
        </div>
      )}

      <HamburgerMenu />
      <NavBar />
    </div>
  );
}
