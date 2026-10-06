import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// --- SES MOTORU ---
let audioCtx = null;
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
};

const playSound = (type) => {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
      osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'static') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch (e) {
    console.log("Ses çalınamadı.");
  }
};

// --- EPISODE VERİLERİ ---
const EPISODES = {
  ep1: {
    id: 'ep1',
    title: 'DOSYA #1984',
    desc: 'Biyokimyasal bir felaketi önlemek için terminal şifresini bul.',
    theme: 'red',
    time: 900,
    rooms: [
      { id: 'board', name: '📌 Mantar Pano' },
      { id: 'archive', name: '🗄️ Arşiv Odası' },
      { id: 'lab', name: '🔬 Laboratuvar' },
      { id: 'terminal', name: '💻 OS Terminal' }
    ],
    initialInventory: [
      { id: 'uv_light', name: 'Mor Ötesi Fener', desc: 'Gizli mürekkepleri görünür kılar.', icon: '💡' }
    ]
  },
  ep2: {
    id: 'ep2',
    title: 'DOSYA #2010: GARAJDAKİ SIR',
    desc: 'Olay yerine terk edilmiş aracın 9 inç multimedya ekranındaki kaçakçılık rotasını deşifre et.',
    theme: 'cyan',
    time: 1200,
    rooms: [
      { id: 'board', name: '📌 Vaka Panosu' },
      { id: 'garage', name: '🚘 Garaj' },
      { id: 'workbench', name: '🧰 Çalışma Tezgahı' },
      { id: 'android', name: '📱 ADB Terminal' }
    ],
    initialInventory: [
      { id: 'phone', name: 'Akıllı Telefon', desc: 'Sadece el feneri uygulaması çalışıyor.', icon: '📱' }
    ]
  },
  ep3: {
    id: 'ep3',
    title: 'DOSYA #0354: BOZKIR MOCAMP',
    desc: 'Yozgat-Sorgun hattında ıssız bir tesisteki hırsızlık. İfadelerdeki poğaça ve kahve yalanını ortaya çıkar.',
    theme: 'amber',
    time: 600,
    rooms: [
      { id: 'board', name: '📌 Vaka Panosu' },
      { id: 'cafe', name: '☕ Kafe Alanı' },
      { id: 'kitchen', name: '🍳 Mutfak' },
      { id: 'terminal', name: '💻 Sorgu Terminali' }
    ],
    initialInventory: [
      { id: 'notebook', name: 'Polis Not Defteri', desc: 'Şüpheli: Şef Kasım. İddiası: Olay anında sıcacık poğaçamı yiyordum.', icon: '📓' }
    ]
  }
};

export default function App() {
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [uvMode, setUvMode] = useState(false);
  const [activeRoom, setActiveRoom] = useState('board');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [inventory, setInventory] = useState([]);
  const [craftSlot1, setCraftSlot1] = useState(null);
  const [craftSlot2, setCraftSlot2] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);

  // Ep1 States
  const [safeUnlocked, setSafeUnlocked] = useState(false);
  const [safeModalOpen, setSafeModalOpen] = useState(false);
  const [archiveSearched, setArchiveSearched] = useState(false);
  
  // Ep2 States
  const [carInspected, setCarInspected] = useState(false);
  const [workbenchSearched, setWorkbenchSearched] = useState(false);
  const [androidUnlocked, setAndroidUnlocked] = useState(false);

  // Ep3 States
  const [cafeSearched, setCafeSearched] = useState(false);
  const [kitchenSearched, setKitchenSearched] = useState(false);

  // Terminal States
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalLoggedIn, setTerminalLoggedIn] = useState(false);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer); setGameOver(true); return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, gameWon]);

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const startEpisode = (epId) => {
    initAudio();
    playSound('static');
    const ep = EPISODES[epId];
    setCurrentEpisode(ep);
    setTimeRemaining(ep.time);
    setInventory(ep.initialInventory);
    setActiveRoom('board');
    setGameStarted(true);
    
    if (epId === 'ep1') setTerminalLogs(["Sistem v5.0 Başlatıldı...", "Lütfen Güvenlik Erişim Kodunu Giriniz (Örn: LOGIN <KOD>)"]);
    else if (epId === 'ep2') setTerminalLogs(["ADB Bağlantısı Bekleniyor...", "Cihaz PIN Kodu Gerekli (Örn: PIN <KOD>)"]);
    else if (epId === 'ep3') setTerminalLogs(["Emniyet Bilgi Sistemi v2.1", "Komutlar: HELP, INTERROGATE <İSİM>, ARREST <İSİM>"]);
  };

  const handleCombine = () => {
    if (!craftSlot1 || !craftSlot2) { notify('İki eşya seçmelisiniz!'); playSound('error'); return; }
    const ids = [craftSlot1.id, craftSlot2.id];
    
    // Ep1 Combo
    if (ids.includes('uv_light') && ids.includes('blank_paper')) {
      playSound('success'); notify('Gizli Harita Elde Edildi!');
      setInventory(prev => [...prev.filter(item => item.id !== 'blank_paper'), { id: 'secret_map', name: 'Gizli Harita', desc: 'İptal Kodu = H2O + NaCl', icon: '🗺️' }]);
    } 
    // Ep2 Combo
    else if (ids.includes('phone') && ids.includes('h4_box')) {
      playSound('success'); notify('TÜVTÜRK Belgesi Okundu!');
      setInventory(prev => [...prev.filter(item => item.id !== 'h4_box'), { id: 'tuvturk_doc', name: 'Muayene Belgesi', desc: 'Randevu Numarası: 1453', icon: '📄' }]);
    } 
    // Ep3 Combo
    else if (ids.includes('coffee_cup') && ids.includes('oven_log')) {
      playSound('success'); notify('ÇELİŞKİ TESPİT EDİLDİ: Sahte Alibi!');
      setInventory(prev => [...prev.filter(item => item.id !== 'coffee_cup' && item.id !== 'oven_log'), { id: 'fake_alibi', name: 'Sahte Alibi Raporu', desc: 'Fırın buz gibiydi! Kasım kesinlikle yalan söylüyor.', icon: '🚨' }]);
    } 
    else {
      playSound('error'); notify('Bu eşyalar birleştirilemez!');
    }
    setCraftSlot1(null); setCraftSlot2(null);
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toUpperCase();
    playSound('click');
    let newLogs = [...terminalLogs, `> ${terminalInput}`];

    if (currentEpisode.id === 'ep1') {
      if (cmd === 'HELP') newLogs.push("Komutlar: HELP, STATUS, CLEAR, LOGIN <ŞİFRE>, OVERRIDE <KOD>");
      else if (cmd.startsWith('LOGIN')) {
        if (cmd.includes('OMEGA') && inventory.some(i => i.id === 'usb_disk')) {
          setTerminalLoggedIn(true); newLogs.push("ERİŞİM ONAYLANDI.");
        } else newLogs.push("ERİŞİM REDDEDİLDİ.");
      } else if (cmd.startsWith('OVERRIDE') && terminalLoggedIn) {
        if (cmd.includes('417')) { setGameWon(true); playSound('success'); confetti(); }
        else newLogs.push("HATA: İptal Kodu Geçersiz!");
      } else newLogs.push("Bilinmeyen Komut.");
    } 
    else if (currentEpisode.id === 'ep2') {
      if (!inventory.some(i => i.id === 'multimedia')) {
        newLogs.push("HATA: ADB Portuna fiziksel erişim yok. Cihazı sökmeniz gerekiyor.");
      } else {
        if (cmd === 'HELP') newLogs.push("Komutlar: HELP, PIN <KOD>, DECRYPT <MOTOR_KODU>");
        else if (cmd.startsWith('PIN')) {
          if (cmd.includes('1453')) { setTerminalLoggedIn(true); newLogs.push("ADB ROOT ERİŞİMİ SAĞLANDI. Şifreli dosya tespit edildi. Çözmek için: DECRYPT <MOTOR_KODU>"); }
          else newLogs.push("YANLIŞ PIN.");
        } else if (cmd.startsWith('DECRYPT') && terminalLoggedIn) {
          if (cmd.includes('G4ED')) { setGameWon(true); playSound('success'); confetti(); newLogs.push("ROTALAR DEŞİFRE EDİLDİ. ZAFER!"); }
          else newLogs.push("HATA: Yanlış Anahtar!");
        } else newLogs.push("Bilinmeyen Komut.");
      }
    }
    else if (currentEpisode.id === 'ep3') {
      if (cmd === 'HELP') newLogs.push("Komutlar: HELP, INTERROGATE <İSİM>, ARREST <İSİM>");
      else if (cmd.startsWith('INTERROGATE')) {
        if (cmd.includes('KASIM')) newLogs.push("KASIM: Ben suçsuzum amirim! Sıcacık mayasız poğaçamı yiyordum.");
        else newLogs.push("Sistemde böyle bir şüpheli kaydı yok.");
      } else if (cmd.startsWith('ARREST')) {
        if (cmd.includes('KASIM')) {
          if (inventory.some(i => i.id === 'fake_alibi')) {
            setGameWon(true); playSound('success'); confetti(); newLogs.push("KASIM TUTUKLANDI. Yalanı ortaya çıktı! VAKA ÇÖZÜLDÜ.");
          } else {
            newLogs.push("HATA: Elinizde kesin bir kanıt (Sahte Alibi) olmadan tutuklama yapamazsınız!");
          }
        } else {
          newLogs.push("Kimi tutuklamaya çalışıyorsunuz?");
        }
      } else newLogs.push("Bilinmeyen Komut.");
    }
    setTerminalLogs(newLogs); setTerminalInput('');
  };

  if (!gameStarted) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center font-mono text-slate-300 overflow-y-auto py-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-12 tracking-widest text-white shadow-black drop-shadow-2xl mt-10">DEDEKTİF<span className="text-amber-500">.OS</span></h1>
        <div className="flex gap-6 flex-wrap justify-center max-w-6xl px-4">
          {Object.values(EPISODES).map(ep => (
            <div key={ep.id} className={`w-80 bg-slate-900 border-2 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer flex flex-col justify-between ${ep.theme === 'red' ? 'border-red-900 hover:border-red-500' : ep.theme === 'cyan' ? 'border-cyan-900 hover:border-cyan-500' : 'border-amber-900 hover:border-amber-500'}`} onClick={() => startEpisode(ep.id)}>
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${ep.theme === 'red' ? 'text-red-500' : ep.theme === 'cyan' ? 'text-cyan-500' : 'text-amber-500'}`}>{ep.title}</h2>
                <p className="text-sm text-slate-400 mb-4 h-24">{ep.desc}</p>
              </div>
              <button className={`w-full py-2 font-bold rounded ${ep.theme === 'red' ? 'bg-red-900 text-red-200' : ep.theme === 'cyan' ? 'bg-cyan-900 text-cyan-200' : 'bg-amber-900 text-amber-200'}`}>VAKAYI AÇ</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isEp1 = currentEpisode.id === 'ep1';
  const isEp2 = currentEpisode.id === 'ep2';
  const isEp3 = currentEpisode.id === 'ep3';
  const themeColor = currentEpisode.theme === 'red' ? 'text-red-500' : currentEpisode.theme === 'cyan' ? 'text-cyan-500' : 'text-amber-500';
  const bgTheme = uvMode ? 'bg-[#0a0715]' : 'bg-[#151720]';

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-mono relative overflow-hidden select-none">
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }} />
      
      {toastMessage && (
        <div className="absolute top-20 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded shadow-lg animate-bounce">{toastMessage}</div>
      )}

      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-20">
        <h1 className={`text-lg font-bold tracking-wider ${themeColor}`}>{currentEpisode.title}</h1>
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded border border-slate-800">
          <span className="text-xl">⏳</span>
          <span className={`text-lg font-bold tracking-widest ${themeColor}`}>
            {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <button onClick={() => window.location.reload()} className="px-3 py-1.5 rounded text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">ÇIKIŞ</button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SOL MENÜ */}
        <nav className="w-48 bg-slate-900 border-r border-slate-800 p-4 flex flex-col space-y-2 z-10">
          {currentEpisode.rooms.map(room => (
            <button key={room.id} onClick={() => { setActiveRoom(room.id); playSound('click'); }} className={`text-left px-3 py-2 text-sm rounded font-bold transition-colors ${activeRoom === room.id ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
              {room.name}
            </button>
          ))}
        </nav>

        {/* ORTA ALAN */}
        <main className={`flex-1 relative overflow-auto transition-colors duration-500 ${bgTheme}`}>
          
          {/* EP1: BOARD */}
          {activeRoom === 'board' && isEp1 && (
             <div className="p-8 h-full relative">
               <div onClick={() => setInspectItem({ title: 'Ajan Notu', type: 'note', content: 'Şifre "OMEGA". Kasa şifresi = Doğum yılı (1984).' })} className="absolute z-10 w-60 bg-yellow-100 p-4 shadow-xl rounded transform rotate-2 cursor-pointer" style={{ top: '15%', left: '45%' }}>
                 <h3 className="font-bold text-sm text-yellow-900 mb-1">Ajan Notu</h3><p className="text-xs text-yellow-800">Şifre "OMEGA"...</p>
               </div>
               <div onClick={() => setSafeModalOpen(true)} className="absolute z-10 w-40 bg-slate-800 p-4 shadow-2xl rounded-lg text-center cursor-pointer" style={{ top: '50%', left: '25%' }}>
                 <span className="text-3xl">🔒</span><span className="text-xs block mt-2">Kasa</span>
               </div>
             </div>
          )}

          {/* EP2: BOARD */}
          {activeRoom === 'board' && isEp2 && (
             <div className="p-8 h-full relative">
               <div onClick={() => setInspectItem({ title: 'Olay Yeri Raporu', type: 'note', content: 'Hedef Araç: 2007 model Hyundai Accent Era 1.6 Select. Kaçakçılar rotayı şifrelemek için Alpha II Motor Kodunu (G4ED) anahtar olarak kullanmışlar.' })} className="absolute z-10 w-72 bg-blue-100 p-4 shadow-xl rounded transform -rotate-1 cursor-pointer border-l-4 border-blue-500" style={{ top: '20%', left: '30%' }}>
                 <h3 className="font-bold text-sm text-blue-900 mb-1">Polis Raporu</h3><p className="text-xs text-blue-800 line-clamp-3">Hedef Araç: 2007 model Hyundai Accent Era...</p>
               </div>
             </div>
          )}

          {/* EP3: BOARD */}
          {activeRoom === 'board' && isEp3 && (
             <div className="p-8 h-full relative">
               <div onClick={() => setInspectItem({ title: 'İfade Tutanağı', type: 'note', content: 'Şüpheli: Aşçı Kasım. İfadesi: "Hırsızlık anında ben masamda fırından daha yeni çıkardığım sıcacık mayasız poğaçamı yiyor, şekerli Türk kahvemi yudumluyordum."' })} className="absolute z-10 w-72 bg-amber-100 p-4 shadow-xl rounded transform rotate-2 cursor-pointer border-l-4 border-amber-500" style={{ top: '15%', left: '25%' }}>
                 <h3 className="font-bold text-sm text-amber-900 mb-1">İfade Tutanağı</h3><p className="text-xs text-amber-800 line-clamp-3">Şüpheli: Aşçı Kasım. İfadesi: "Hırsızlık anında..."</p>
               </div>
             </div>
          )}

          {/* EP1: ARŞİV */}
          {activeRoom === 'archive' && isEp1 && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
              <span className="text-6xl block mb-4">🗄️</span>
              <button onClick={() => { 
                playSound('click'); 
                if(!archiveSearched){ setArchiveSearched(true); notify('Boş Kağıt bulundu!'); setInventory(prev => [...prev, { id: 'blank_paper', name: 'Boş Kağıt', desc: 'Üzerinde hiçbir şey yazmıyor.', icon: '📄' }]); }
                else notify('Başka bir şey yok.');
              }} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded">Çekmeceyi Ara</button>
            </div>
          )}

          {/* EP1: LAB */}
          {activeRoom === 'lab' && isEp1 && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="w-full max-w-2xl bg-emerald-950/30 p-8 rounded border-4 border-emerald-900 shadow-2xl relative">
                <h2 className="text-center text-emerald-500 font-bold mb-6 font-serif">KİMYA TAHTASI</h2>
                <div className="text-emerald-300 font-mono space-y-4 text-lg">
                  <p>H2O <span className="opacity-50">.......</span> 305</p>
                  <p>NaCl <span className="opacity-50">......</span> 112</p>
                </div>
              </div>
            </div>
          )}

          {/* EP2: GARAGE */}
          {activeRoom === 'garage' && isEp2 && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <span className="text-8xl mb-4 opacity-80 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">🚘</span>
              <h2 className="text-xl font-bold text-cyan-400 mb-6">2007 Hyundai Accent Era</h2>
              <div className="flex gap-4">
                <button onClick={() => { playSound('click'); setInspectItem({ title: 'Araç İçi', type: 'note', content: 'Konsolda sonradan takılmış 9 inçlik bir Android Multimedya var. Çıkarmak için tornavida lazım.' }); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-cyan-900 text-sm">İçeri Bak</button>
                <button onClick={() => { 
                  playSound('success'); 
                  if(!carInspected) {
                    setCarInspected(true); notify('Farların arkasında H4 Ampul Kutusu buldun!');
                    setInventory(prev => [...prev, { id: 'h4_box', name: 'H4 LED Kutusu', desc: 'İçinde küçük bir kağıt var. Işık lazım.', icon: '📦' }]);
                  } else notify('Başka dikkat çeken bir şey yok.');
                }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-cyan-900 text-sm">Farları İncele (H4 LED)</button>
              </div>
            </div>
          )}

          {/* EP2: WORKBENCH */}
          {activeRoom === 'workbench' && isEp2 && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-6xl mb-4">🧰</span>
              <button onClick={() => {
                playSound('click');
                if(!workbenchSearched) {
                  setWorkbenchSearched(true); playSound('success'); notify('Tornavida Seti buldun!');
                  setInventory(prev => [...prev, { id: 'screwdriver', name: 'Tornavida Seti', desc: 'İnce işçilik için birebir.', icon: '🪛' }]);
                } else notify('Alet çantası boş.');
              }} className="px-6 py-3 bg-slate-800 border border-slate-600 rounded text-sm font-bold">Alet Çantasını Karıştır</button>
            </div>
          )}

          {/* EP2: ANDROID (ADB) */}
          {activeRoom === 'android' && isEp2 && (
            <div className="w-full h-full flex items-center justify-center p-8">
              {!androidUnlocked ? (
                <div className="text-center bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-2xl">
                  <span className="text-6xl mb-4 block">📱</span>
                  <h3 className="text-lg font-bold text-slate-300 mb-4">9" Android Multimedya</h3>
                  <button onClick={() => {
                    if (inventory.some(i => i.id === 'screwdriver')) {
                      playSound('success'); setAndroidUnlocked(true); notify('Ekran söküldü! ADB Portuna erişildi.');
                      setInventory(prev => [...prev, { id: 'multimedia', name: 'Android Ekran', desc: 'ADB üzerinden bağlı.', icon: '💻' }]);
                    } else { playSound('error'); notify('Sökmek için Tornavida gerekiyor!'); }
                  }} className="px-6 py-2 bg-cyan-900 text-cyan-100 rounded text-sm font-bold hover:bg-cyan-800">Sökmeye Çalış</button>
                </div>
              ) : (
                <div className="w-full h-full bg-black/80 rounded border border-cyan-900 p-4 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 text-cyan-400 text-sm font-mono">
                    {terminalLogs.map((log, i) => <div key={i}>{log}</div>)}
                  </div>
                  <form onSubmit={handleTerminalSubmit} className="flex border-t border-cyan-900 pt-3">
                    <span className="text-cyan-500 font-bold mr-2">shell@android:/$</span>
                    <input type="text" value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} autoFocus className="flex-1 bg-transparent border-none outline-none text-cyan-100" />
                  </form>
                </div>
              )}
            </div>
          )}

          {/* EP3: CAFE */}
          {activeRoom === 'cafe' && isEp3 && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <span className="text-6xl mb-4">☕</span>
              <h2 className="text-xl font-bold text-amber-400 mb-6">Mocamp Kafe Alanı</h2>
              <button onClick={() => {
                playSound('click');
                if(!cafeSearched) {
                  setCafeSearched(true); playSound('success'); notify('Masada yarım bırakılmış kahve fincanı bulundu!');
                  setInventory(prev => [...prev, { id: 'coffee_cup', name: 'Kahve Fincanı', desc: 'Dibinde yoğun şeker telvesi kalmış.', icon: '☕' }]);
                } else notify('Masalarda başka bir şey yok.');
              }} className="px-6 py-3 bg-slate-800 border border-slate-600 rounded text-sm font-bold">Masaları İncele</button>
            </div>
          )}

          {/* EP3: KITCHEN */}
          {activeRoom === 'kitchen' && isEp3 && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <span className="text-6xl mb-4">🍳</span>
              <h2 className="text-xl font-bold text-amber-400 mb-6">Tesis Mutfağı</h2>
              <button onClick={() => {
                playSound('click');
                if(!kitchenSearched) {
                  setKitchenSearched(true); playSound('success'); notify('Endüstriyel Fırın kontrol edildi!');
                  setInventory(prev => [...prev, { id: 'oven_log', name: 'Fırın Isı Kontrolü', desc: 'Fırın buz gibi. En son 4 saat önce çalışmış!', icon: '🌡️' }]);
                } else notify('Mutfakta başka delil yok.');
              }} className="px-6 py-3 bg-slate-800 border border-slate-600 rounded text-sm font-bold">Fırını Kontrol Et</button>
            </div>
          )}

          {/* ORTAK: TERMINAL (EP1 & EP3) */}
          {(activeRoom === 'terminal' && (isEp1 || isEp3)) && (
            <div className="w-full h-full bg-black p-6 flex flex-col">
               <div className={`flex-1 overflow-y-auto space-y-2 mb-4 text-sm ${isEp1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                 {terminalLogs.map((log, index) => <div key={index}>{log}</div>)}
               </div>
               <form onSubmit={handleTerminalSubmit} className={`flex border-t pt-3 ${isEp1 ? 'border-emerald-900' : 'border-amber-900'}`}>
                 <span className={`font-bold mr-2 ${isEp1 ? 'text-emerald-500' : 'text-amber-500'}`}>&gt;</span>
                 <input type="text" value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} autoFocus className={`flex-1 bg-transparent border-none outline-none ${isEp1 ? 'text-emerald-300' : 'text-amber-300'}`} />
               </form>
            </div>
          )}
        </main>

        {/* SAĞ MENÜ (Envanter) */}
        <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col z-10">
          <div className="p-4 flex-1 overflow-auto">
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-3">💼 Envanter</h2>
            <div className="space-y-2">
              {inventory.map((item) => (
                <div key={item.id} className="p-2 bg-slate-950 rounded flex items-center space-x-3 group border border-slate-800 hover:border-slate-600 transition-colors">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                  </div>
                  <button onClick={() => { playSound('click'); if (!craftSlot1) setCraftSlot1(item); else if (!craftSlot2 && craftSlot1.id !== item.id) setCraftSlot2(item); else notify('Slotlar dolu/aynı eşya!'); }} className="text-[10px] bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Seç</button>
                  {item.id === 'secret_map' && <button onClick={() => { setInspectItem({ title: 'Gizli Harita', type: 'note', content: 'Terminal İptal Kodu = H2O + NaCl' }); playSound('click'); }} className="text-[10px] bg-amber-900 text-amber-200 px-2 py-1 rounded">İncele</button>}
                  {item.id === 'tuvturk_doc' && <button onClick={() => { setInspectItem({ title: 'TÜVTÜRK Muayene', type: 'note', content: 'Plaka: *** | Randevu Numarası: 1453 (Multimedya ekranı için PIN olarak ayarlanmış olabilir)' }); playSound('click'); }} className="text-[10px] bg-cyan-900 text-cyan-200 px-2 py-1 rounded">Oku</button>}
                  {item.id === 'notebook' && <button onClick={() => { setInspectItem({ title: 'Polis Not Defteri', type: 'note', content: 'Şüpheli: Kasım. İddiası: "Hırsızlık anında sıcacık mayasız poğaçamı yiyordum."' }); playSound('click'); }} className="text-[10px] bg-amber-900 text-amber-200 px-2 py-1 rounded">Oku</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase mb-2 text-center">🔧 Birleştirme</h2>
            <div className="flex space-x-2 mb-2">
              <div onClick={() => setCraftSlot1(null)} className="flex-1 h-12 border-2 border-dashed border-slate-700 rounded flex items-center justify-center bg-slate-900 cursor-pointer">{craftSlot1 ? <span className="text-xl">{craftSlot1.icon}</span> : <span className="text-[10px]">Slot 1</span>}</div>
              <div className="flex items-center justify-center text-slate-600 font-bold">+</div>
              <div onClick={() => setCraftSlot2(null)} className="flex-1 h-12 border-2 border-dashed border-slate-700 rounded flex items-center justify-center bg-slate-900 cursor-pointer">{craftSlot2 ? <span className="text-xl">{craftSlot2.icon}</span> : <span className="text-[10px]">Slot 2</span>}</div>
            </div>
            <button onClick={handleCombine} className={`w-full py-2 font-bold text-xs rounded transition-colors ${currentEpisode.theme === 'red' ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-200' : currentEpisode.theme === 'cyan' ? 'bg-cyan-900 hover:bg-cyan-800 text-cyan-200' : 'bg-orange-900 hover:bg-orange-800 text-orange-200'}`}>BİRLEŞTİR</button>
          </div>
        </aside>
      </div>

      {/* EP1: Kasa Modalı */}
      {safeModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-lg w-72 text-center border border-slate-700">
            <h3 className="text-sm font-bold text-amber-400 mb-4">GÜVENLİK KODU</h3>
            <button onClick={() => setSafeModalOpen(false)} className="mt-4 px-4 py-2 bg-slate-800 text-xs rounded">Kapat</button>
          </div>
        </div>
      )}

      {/* İnceleme Modalı */}
      {inspectItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-80">
            <h3 className="text-sm font-bold text-amber-400 mb-4">{inspectItem.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded mb-4">{inspectItem.content}</p>
            <button onClick={() => setInspectItem(null)} className="w-full py-2 bg-slate-800 text-xs font-bold rounded">Kapat</button>
          </div>
        </div>
      )}

      {/* WIN/LOSE */}
      {gameWon && (
        <div className="fixed inset-0 bg-emerald-950/90 flex flex-col items-center justify-center z-50 p-4 text-center">
          <span className="text-6xl mb-4">🎉</span><h2 className="text-3xl font-bold text-emerald-400 mb-2">VAKA ÇÖZÜLDÜ!</h2>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-emerald-600 text-slate-950 font-bold rounded mt-6">Menüye Dön</button>
        </div>
      )}
      {gameOver && (
        <div className="fixed inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 p-4 text-center">
          <span className="text-6xl mb-4">💀</span><h2 className="text-3xl font-bold text-red-500 mb-2">SÜRE DOLDU</h2>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 text-white font-bold rounded mt-6">Tekrar Dene</button>
        </div>
      )}
    </div>
  );
}