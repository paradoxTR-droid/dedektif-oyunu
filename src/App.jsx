import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// --- SES MOTORU (Web Audio API) ---
let audioCtx = null;
let ambientOsc = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Arka plan gerilim sesi (Ambient Drone)
    ambientOsc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    ambientOsc.type = 'sine';
    ambientOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Çok kalın bir bas
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    ambientOsc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    ambientOsc.start();
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
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'static') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch (e) {
    console.log("Ses çalınamadı.");
  }
};

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);

  // Oyun Durumları
  const [uvMode, setUvMode] = useState(false);
  const [activeRoom, setActiveRoom] = useState('board'); // board, archive, lab, terminal
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Envanter & Kombinasyon Sistemi
  const [inventory, setInventory] = useState([
    { id: 'uv_light', name: 'Mor Ötesi Fener', desc: 'Gizli mürekkepleri görünür kılar.', icon: '💡' }
  ]);
  const [craftSlot1, setCraftSlot1] = useState(null);
  const [craftSlot2, setCraftSlot2] = useState(null);

  // Odalar & İpuçları Durumu
  const [safeUnlocked, setSafeUnlocked] = useState(false);
  const [safeInput, setSafeInput] = useState('');
  const [safeModalOpen, setSafeModalOpen] = useState(false);
  
  const [archiveSearched, setArchiveSearched] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState(null);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    "Sistem v5.0 Başlatıldı...",
    "Lütfen Güvenlik Erişim Kodunu Giriniz (Örn: LOGIN <KOD>)",
  ]);
  const [terminalLoggedIn, setTerminalLoggedIn] = useState(false);

  // Zaman Sayacı
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, gameWon]);

  // Bildirim Sistemi
  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const startGame = () => {
    initAudio();
    playSound('static');
    setGameStarted(true);
  };

  // Eşya Birleştirme Mantığı
  const handleCombine = () => {
    if (!craftSlot1 || !craftSlot2) {
      notify('İki eşya seçmelisiniz!');
      playSound('error');
      return;
    }

    const ids = [craftSlot1.id, craftSlot2.id];
    
    // UV Fener + Boş Kağıt = Gizli Harita
    if (ids.includes('uv_light') && ids.includes('blank_paper')) {
      playSound('success');
      notify('KOMBİNASYON BAŞARILI: Gizli Harita Elde Edildi!');
      
      // Boş kağıdı sil, Haritayı ekle (UV fener kaybolmaz)
      setInventory(prev => [
        ...prev.filter(item => item.id !== 'blank_paper'),
        { id: 'secret_map', name: 'Gizli Harita', desc: 'İptal Kodu = H2O + NaCl', icon: '🗺️' }
      ]);
      setCraftSlot1(null);
      setCraftSlot2(null);
    } else {
      playSound('error');
      notify('Bu eşyalar birbiriyle birleştirilemez!');
      setCraftSlot1(null);
      setCraftSlot2(null);
    }
  };

  // Kasa Açma Kontrolü
  const handleSafeSubmit = () => {
    playSound('click');
    if (safeInput === '1984') {
      setSafeUnlocked(true);
      playSound('success');
      notify('Kasa Açıldı! Teyp Kaseti ve USB Disk bulundu.');
      setInventory(prev => [
        ...prev,
        { id: 'usb_disk', name: 'Master USB Disk', desc: 'Terminal Root erişimi.', icon: '💾' },
        { id: 'tape', name: 'Teyp Kaseti #04', desc: 'Eski bir ses kaydı.', icon: '📻' }
      ]);
      setSafeModalOpen(false);
    } else {
      playSound('error');
      notify('Hatalı Şifre!');
      setSafeInput('');
    }
  };

  // Arşiv Arama
  const searchArchive = () => {
    playSound('click');
    if (!archiveSearched) {
      playSound('success');
      setArchiveSearched(true);
      notify('Çekmecede "Boş Bir Kağıt" buldun!');
      setInventory(prev => [
        ...prev,
        { id: 'blank_paper', name: 'Boş Kağıt', desc: 'Üzerinde hiçbir şey yazmıyor gibi.', icon: '📄' }
      ]);
    } else {
      notify('Burada başka bir şey yok.');
    }
  };

  // Terminal İşleme
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toUpperCase();
    playSound('click');

    let newLogs = [...terminalLogs, `> ${terminalInput}`];

    if (cmd === 'HELP') {
      newLogs.push("Komutlar: HELP, STATUS, CLEAR, LOGIN <ŞİFRE>, OVERRIDE <KOD>");
    } else if (cmd === 'STATUS') {
      newLogs.push(`Durum: CRITICAL | Kalan Süre: ${Math.floor(timeRemaining / 60)}dk`);
    } else if (cmd === 'CLEAR') {
      newLogs = [];
    } else if (cmd.startsWith('LOGIN')) {
      if (cmd.includes('OMEGA') && inventory.some(i => i.id === 'usb_disk')) {
        setTerminalLoggedIn(true);
        newLogs.push("ERİŞİM ONAYLANDI: Admin Yetkileri Verildi.");
        newLogs.push("Sistemi durdurmak için İptal Kodunu girin: OVERRIDE <KOD>");
      } else {
        newLogs.push("ERİŞİM REDDEDİLDİ: Şifre hatalı veya USB Master Disk takılı değil.");
      }
    } else if (cmd.startsWith('OVERRIDE')) {
      if (terminalLoggedIn) {
        // İptal Kodu = H2O (305) + NaCl (112) = 417
        if (cmd.includes('417')) {
          setGameWon(true);
          playSound('success');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          newLogs.push("SİSTEM İPTAL EDİLDİ. VERİLER KURTARILDI. ZAFER!");
        } else {
          newLogs.push("HATA: İptal Kodu Geçersiz! Harita ve Laboratuvar verilerini kontrol edin.");
        }
      } else {
        newLogs.push("HATA: Önce LOGIN olmalısınız.");
      }
    } else {
      newLogs.push(`Bilinmeyen Komut. Yardım için 'HELP' yazın.`);
    }

    setTerminalLogs(newLogs);
    setTerminalInput('');
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Başlangıç Ekranı
  if (!gameStarted) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center font-mono text-emerald-500">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-pulse tracking-widest text-red-600">DOSYA #1984</h1>
        <p className="mb-8 text-slate-400 text-center max-w-md text-sm">
          Sistem kendini imha etmeden önce gizli ajanlık verilerini kurtarman gerekiyor. 
          İpuçlarını birleştir, şifreleri çöz ve terminali ele geçir.
        </p>
        <button 
          onClick={startGame}
          className="px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-xl border-2 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
        >
          SİSTEMİ BAŞLAT
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-mono relative overflow-hidden select-none">
      
      {/* CRT SCANLINE EFEKTİ (Ekrana retro televizyon havası katar) */}
      <div 
        className="absolute inset-0 pointer-events-none z-50 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}
      />

      {/* TOAST BİLDİRİMİ */}
      {toastMessage && (
        <div className="absolute top-20 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* HEADER BAR */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <span className="text-2xl animate-pulse">🚨</span>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-wider text-red-500">DOSYA #1984</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded border border-red-900/50">
          <span className="text-red-500">⏳</span>
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-slate-400">İMHA SÜRESİ</span>
            <span className="text-lg font-bold text-red-500 tracking-widest">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setUvMode(!uvMode); playSound('click'); }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${uvMode ? 'bg-purple-900 border-purple-500 text-purple-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            💡 UV Modu {uvMode ? 'AÇIK' : 'KAPALI'}
          </button>
        </div>
      </header>

      {/* ANA İÇERİK - SOL (Odalar) / SAĞ (Envanter) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SOL MENÜ (Oda Navigasyonu) */}
        <nav className="w-48 bg-slate-900 border-r border-slate-800 p-4 flex flex-col space-y-2 z-10">
          <span className="text-[10px] text-slate-500 font-bold mb-2 block">MEKANLAR</span>
          
          <button onClick={() => { setActiveRoom('board'); playSound('click'); }} className={`text-left px-3 py-2 text-sm rounded font-bold transition-colors ${activeRoom === 'board' ? 'bg-amber-600 text-slate-950' : 'hover:bg-slate-800 text-slate-300'}`}>
            📌 Mantar Pano
          </button>
          
          <button onClick={() => { setActiveRoom('archive'); playSound('click'); }} className={`text-left px-3 py-2 text-sm rounded font-bold transition-colors ${activeRoom === 'archive' ? 'bg-amber-600 text-slate-950' : 'hover:bg-slate-800 text-slate-300'}`}>
            🗄️ Arşiv Odası
          </button>
          
          <button onClick={() => { setActiveRoom('lab'); playSound('click'); }} className={`text-left px-3 py-2 text-sm rounded font-bold transition-colors ${activeRoom === 'lab' ? 'bg-amber-600 text-slate-950' : 'hover:bg-slate-800 text-slate-300'}`}>
            🔬 Laboratuvar
          </button>
          
          <button onClick={() => { setActiveRoom('terminal'); playSound('click'); }} className={`text-left px-3 py-2 text-sm rounded font-bold transition-colors mt-auto ${activeRoom === 'terminal' ? 'bg-emerald-600 text-slate-950' : 'hover:bg-slate-800 text-slate-300'}`}>
            💻 OS Terminal
          </button>
        </nav>

        {/* ORTA ALAN (Oda İçerikleri) */}
        <main className={`flex-1 relative overflow-auto transition-colors duration-500 ${uvMode ? 'bg-[#0a0715]' : 'bg-[#151720]'}`}>
          
          {/* ODA: MANTAR PANO */}
          {activeRoom === 'board' && (
            <div className="w-full h-full relative p-8">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
              
              {/* Fotoğraf */}
              <div
                className="absolute z-10 w-48 bg-amber-50 p-2 shadow-2xl rounded transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer border border-amber-200"
                style={{ top: '10%', left: '15%' }}
                onClick={() => { setInspectItem({ title: 'Olay Yeri', type: 'photo', uvText: 'GİZLİ KOD: 19' }); playSound('click'); }}
              >
                <div className="w-3 h-3 bg-red-600 rounded-full mx-auto -mt-3 mb-2 shadow" />
                <div className="h-28 bg-slate-800 rounded flex items-center justify-center relative overflow-hidden">
                  <span className="text-4xl opacity-50">🔥</span>
                  {uvMode && <div className="absolute inset-0 bg-purple-900/90 flex items-center justify-center text-yellow-300 font-bold">KOD: 19</div>}
                </div>
              </div>

              {/* Not */}
              <div
                className="absolute z-10 w-60 bg-yellow-100 p-4 shadow-xl rounded transform rotate-2 hover:rotate-0 transition-transform cursor-pointer border-l-4 border-yellow-500"
                style={{ top: '15%', left: '45%' }}
                onClick={() => { setInspectItem({ title: 'Ajan Notu', type: 'note', content: 'Şifre "OMEGA". Kasa şifresi = Doğum yılı (1984) + UV kodu.' }); playSound('click'); }}
              >
                <div className="w-3 h-3 bg-red-600 rounded-full absolute top-2 left-2 shadow" />
                <h3 className="font-bold text-sm text-yellow-900 mb-1">Ajan Notu</h3>
                <p className="text-xs text-yellow-800 italic line-clamp-2">Şifre "OMEGA". Kasa şifresi...</p>
              </div>

              {/* Çelik Kasa */}
              <div
                className="absolute z-10 w-40 bg-slate-800 p-4 shadow-2xl rounded-lg border-2 border-slate-600 text-center cursor-pointer hover:border-amber-500"
                style={{ top: '50%', left: '25%' }}
                onClick={() => { if(!safeUnlocked) { setSafeModalOpen(true); playSound('click'); } else { notify('Kasa zaten açık!'); } }}
              >
                <span className="text-3xl block my-1">{safeUnlocked ? '🔓' : '🔒'}</span>
                <span className="text-xs font-bold text-slate-200 block">Kasa</span>
              </div>
            </div>
          )}

          {/* ODA: ARŞİV ODASI */}
          {activeRoom === 'archive' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
              <div className="text-center mb-8">
                <span className="text-6xl block mb-2">🗄️</span>
                <h2 className="text-xl font-bold text-slate-300">Tozlu Arşiv Dolapları</h2>
                <p className="text-xs text-slate-500">Çekmeceleri karıştırarak ipucu ara.</p>
              </div>
              <button 
                onClick={searchArchive}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded shadow-lg transition-all"
              >
                {archiveSearched ? 'Tekrar Ara (Boş)' : 'Çekmeceyi Aç ve Ara'}
              </button>
            </div>
          )}

          {/* ODA: LABORATUVAR */}
          {activeRoom === 'lab' && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="w-full max-w-2xl bg-emerald-950/30 p-8 rounded border-4 border-emerald-900 shadow-2xl relative">
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-emerald-800 rounded" />
                <h2 className="text-center text-emerald-500 font-bold mb-6 font-serif">KİMYA TAHTASI</h2>
                <div className="text-emerald-300 font-mono space-y-4 text-lg">
                  <p>H2O <span className="opacity-50">.......</span> 305</p>
                  <p>NaCl <span className="opacity-50">......</span> 112</p>
                  <p>CO2 <span className="opacity-50">.......</span> 88</p>
                  <p className="mt-8 text-sm italic text-emerald-600">"Tepkimelerin toplamı, sistemin anahtarıdır."</p>
                </div>
              </div>
            </div>
          )}

          {/* ODA: TERMINAL */}
          {activeRoom === 'terminal' && (
            <div className="w-full h-full bg-black p-6 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 text-emerald-500 text-sm">
                {terminalLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
              <form onSubmit={handleTerminalSubmit} className="flex items-center space-x-2 border-t border-emerald-900 pt-3">
                <span className="text-emerald-500 font-bold">&gt;</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Komut girin..."
                  className="flex-1 bg-transparent border-none outline-none text-emerald-300 placeholder-emerald-800 text-sm"
                  autoFocus
                />
                <button type="submit" className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-bold rounded">
                  ÇALIŞTIR
                </button>
              </form>
            </div>
          )}
        </main>

        {/* SAĞ MENÜ (Envanter & Crafting) */}
        <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col z-10">
          {/* Envanter Listesi */}
          <div className="p-4 flex-1 overflow-auto">
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-3">💼 Envanter</h2>
            <div className="space-y-2">
              {inventory.map((item) => (
                <div key={item.id} className="p-2 border border-slate-800 bg-slate-950 rounded flex items-center space-x-3 group">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                  </div>
                  {/* Birleştirme Slotuna Ekle Butonu */}
                  <button 
                    onClick={() => {
                      playSound('click');
                      if (!craftSlot1) setCraftSlot1(item);
                      else if (!craftSlot2 && craftSlot1.id !== item.id) setCraftSlot2(item);
                      else notify('Slotlar dolu veya aynı eşya!');
                    }}
                    className="text-[10px] bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Seç
                  </button>
                  {/* Ses kaseti ise dinleme butonu */}
                  {item.id === 'tape' && (
                    <button onClick={() => { setAudioModalOpen(true); playSound('click'); }} className="text-[10px] bg-red-900 text-red-200 px-2 py-1 rounded">
                      Dinle
                    </button>
                  )}
                  {/* Harita ise inceleme butonu */}
                  {item.id === 'secret_map' && (
                    <button onClick={() => { setInspectItem({ title: 'Gizli Harita', type: 'note', content: 'Terminal İptal Kodu Formülü: H2O + NaCl' }); playSound('click'); }} className="text-[10px] bg-amber-900 text-amber-200 px-2 py-1 rounded">
                      İncele
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kombinasyon Alanı (Crafting) */}
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase mb-2 text-center">🔧 Birleştirme Alanı</h2>
            <div className="flex space-x-2 mb-2">
              <div 
                className="flex-1 h-12 border-2 border-dashed border-slate-700 rounded flex items-center justify-center bg-slate-900 cursor-pointer"
                onClick={() => { setCraftSlot1(null); playSound('click'); }}
              >
                {craftSlot1 ? <span className="text-xl" title="Çıkarmak için tıkla">{craftSlot1.icon}</span> : <span className="text-[10px] text-slate-600">Slot 1</span>}
              </div>
              <div className="flex items-center justify-center text-slate-600 font-bold">+</div>
              <div 
                className="flex-1 h-12 border-2 border-dashed border-slate-700 rounded flex items-center justify-center bg-slate-900 cursor-pointer"
                onClick={() => { setCraftSlot2(null); playSound('click'); }}
              >
                {craftSlot2 ? <span className="text-xl" title="Çıkarmak için tıkla">{craftSlot2.icon}</span> : <span className="text-[10px] text-slate-600">Slot 2</span>}
              </div>
            </div>
            <button 
              onClick={handleCombine}
              className="w-full py-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-200 font-bold text-xs rounded transition-colors"
            >
              BİRLEŞTİR
            </button>
          </div>
        </aside>
      </div>

      {/* MODALLAR */}
      
      {/* KASA MODALI */}
      {safeModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-72 text-center">
            <h3 className="text-sm font-bold text-amber-400 mb-4">GÜVENLİK KODU</h3>
            <input type="text" value={safeInput} readOnly className="w-full text-center text-2xl bg-slate-950 border border-slate-800 py-2 rounded text-amber-400 tracking-widest mb-4" />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1,2,3,4,5,6,7,8,9,0].map(n => (
                <button key={n} onClick={() => { if(safeInput.length < 4) setSafeInput(p=>p+n); playSound('click'); }} className="bg-slate-800 py-2 rounded text-white font-bold">{n}</button>
              ))}
              <button onClick={() => setSafeInput('')} className="bg-red-900/50 py-2 rounded text-red-200 font-bold">C</button>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setSafeModalOpen(false)} className="flex-1 py-2 bg-slate-800 text-xs rounded">İptal</button>
              <button onClick={handleSafeSubmit} className="flex-1 py-2 bg-amber-600 text-slate-950 font-bold text-xs rounded">AÇ</button>
            </div>
          </div>
        </div>
      )}

      {/* TEYP KASETİ MODALI */}
      {audioModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-80 text-center">
            <span className="text-4xl block mb-2">📻</span>
            <h3 className="text-sm font-bold text-red-400 mb-4">TEYP KASETİ #04</h3>
            <p className="text-xs italic bg-slate-950 p-3 rounded text-amber-200 mb-4">
              "{audioPlaying ? '...Sisteme giriş kelimesi OMEGA... Unutmayın OMEGA...' : 'Dinlemek için oynat.'}"
            </p>
            <div className="flex space-x-2">
              <button onClick={() => { setAudioPlaying(!audioPlaying); playSound(audioPlaying ? 'click' : 'static'); }} className={`flex-1 py-2 font-bold text-xs rounded ${audioPlaying ? 'bg-red-600 text-white' : 'bg-emerald-600 text-slate-950'}`}>
                {audioPlaying ? 'Durdur' : 'Oynat'}
              </button>
              <button onClick={() => { setAudioModalOpen(false); setAudioPlaying(false); }} className="px-4 py-2 bg-slate-800 text-xs rounded">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* İNCELEME MODALI (Resim/Not okuma) */}
      {inspectItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-80">
            <h3 className="text-sm font-bold text-amber-400 mb-4">{inspectItem.title}</h3>
            {inspectItem.type === 'photo' && (
              <div className="h-40 bg-slate-950 rounded flex items-center justify-center relative mb-4">
                <span className="text-5xl">🔥</span>
                {uvMode && <div className="absolute inset-0 bg-purple-900/90 flex items-center justify-center font-bold text-yellow-300">{inspectItem.uvText}</div>}
              </div>
            )}
            {inspectItem.type === 'note' && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded mb-4">{inspectItem.content}</p>
            )}
            <button onClick={() => setInspectItem(null)} className="w-full py-2 bg-slate-800 text-xs font-bold rounded">Kapat</button>
          </div>
        </div>
      )}

      {/* OYUN BİTİŞ EKRANLARI */}
      {gameWon && (
        <div className="fixed inset-0 bg-emerald-950/90 flex flex-col items-center justify-center z-50 p-4 text-center">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-3xl font-bold text-emerald-400 mb-2">SİSTEM KURTARILDI</h2>
          <p className="text-slate-300 max-w-md mb-8">Tüm bulmacaları ustalıkla çözdün, doğru kombinasyonları yaptın ve iptal kodunu bularak dünyayı büyük bir krizden kurtardın.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded shadow-lg">Yeniden Oyna</button>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 p-4 text-center">
          <span className="text-6xl block mb-4 animate-bounce">💀</span>
          <h2 className="text-3xl font-bold text-red-500 mb-2">SÜRE DOLDU</h2>
          <p className="text-slate-300 max-w-md mb-8">Verileri zamanında kurtaramadın. Bütün dosyalar geri döndürülemez şekilde imha edildi.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg">Tekrar Dene</button>
        </div>
      )}
    </div>
  );
}