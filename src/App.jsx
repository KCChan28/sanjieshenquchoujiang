import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, 
  setDoc, updateDoc, runTransaction, 
  serverTimestamp, addDoc, writeBatch, query, orderBy, deleteDoc
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { Gift, Trophy, Settings, Share2, Sparkles, AlertCircle, Lock, X, Users, History, Calendar, RotateCcw, Trash2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// --- Firebase Configuration ---
// 👇👇👇 请把你的 firebaseConfig 粘贴在这里 (替换下面这个对象) 👇👇👇
const firebaseConfig = {
  apiKey: "AIzaSyDUyYvKr5M69Lcxu_3TjBU6PHlCQjIYi6o",
  authDomain: "sanjieshenquchoujiang.firebaseapp.com",
  projectId: "sanjieshenquchoujiang",
  storageBucket: "sanjieshenquchoujiang.firebasestorage.app",
  messagingSenderId: "296995102252",
  appId: "1:296995102252:web:e2e58892deb7961265bb89",
  measurementId: "G-101PG44KB2"
};
// 👆👆👆 替换结束 👆👆👆

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-lottery-group-001';

// --- Constants ---
const ADMIN_PASSWORD = 'admin888'; 
const PRIZES = {
  q3: { label: '妻佬的三界', color: 'text-purple-600', bg: 'bg-purple-100' },
  qBody: { label: '妻佬的神躯', color: 'text-blue-600', bg: 'bg-blue-100' },
  b3: { label: '宝の三界', color: 'text-amber-600', bg: 'bg-amber-100' },
  bBody: { label: '宝の神躯', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

// --- Sub-Components ---

// Button Component
const Button = ({ children, onClick, disabled, variant = 'primary', className = '' }) => {
  const baseStyle = "px-4 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600",
    secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
    outline: "border-2 border-white/30 text-white hover:bg-white/10",
    ghost: "text-gray-500 hover:bg-gray-100 shadow-none"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Card Component
const Card = ({ children, className = '', title, icon: Icon, extra }) => (
  <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}>
    {(title || Icon) && (
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-red-500" />}
          <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        {extra}
      </div>
    )}
    <div className="p-5">
      {children}
    </div>
  </div>
);

// Custom Toast Notification
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000); // 稍微延长一点显示时间
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-white ${bgColors[type]} animate-in slide-in-from-top-2 fade-in duration-300 w-max max-w-[90vw]`}>
      {icons[type]}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

// Custom Confirmation Modal
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isDangerous = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDangerous ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            取消
          </Button>
          <Button 
            onClick={onConfirm} 
            className={`flex-1 ${isDangerous ? 'bg-red-500 hover:from-red-600 hover:to-red-700' : ''}`}
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
};

// Winner Section Component
const WinnerSection = ({ pKey, winnersData, currentUserId }) => {
  const list = winnersData?.[pKey] || [];
  const conf = PRIZES[pKey] || { label: '未知奖项', color: 'text-gray-500', bg: 'bg-gray-100' };
  
  return (
    <div className="mb-4 last:mb-0">
      <div className={`flex justify-between items-center mb-2 px-2 py-1 rounded ${conf.bg}`}>
        <h4 className={`font-bold ${conf.color}`}>{conf.label}</h4>
        <span className="text-xs font-mono bg-white/50 px-2 rounded text-gray-600">{list.length}人</span>
      </div>
      {list.length === 0 ? (
        <div className="text-gray-400 text-sm px-2 italic">无人中奖</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {list.map((w, idx) => (
            <div key={w.uid || idx} className="flex items-center gap-2 bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
              <span className="text-xl">{w.avatar}</span>
              <span className="truncate text-sm font-medium text-gray-700">{w.name}</span>
              {currentUserId && w.uid === currentUserId && <span className="ml-auto text-xs bg-red-100 text-red-600 px-1 rounded">我</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Time Display Component
const TimeDisplay = ({ drawTime, status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isDue, setIsDue] = useState(false);

  useEffect(() => {
    if (!drawTime) return;
    const target = new Date(drawTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsDue(true);
        setTimeLeft('已到开奖时间');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}小时 ${minutes}分 ${seconds}秒`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [drawTime]);

  // Modified: Force UTC+8 (China Standard Time)
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const chinaTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    
    const y = chinaTime.getUTCFullYear();
    const m = chinaTime.getUTCMonth() + 1;
    const d = chinaTime.getUTCDate();
    const h = chinaTime.getUTCHours();
    const min = chinaTime.getUTCMinutes();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const w = weekDays[chinaTime.getUTCDay()];
    
    return `${y}年${m}月${d}日 (星期${w}) ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
  };

  return (
    <div className="text-center py-6">
      {drawTime ? (
        <div className="mb-3 font-medium text-red-600 bg-red-50 inline-block px-3 py-1 rounded-lg text-sm border border-red-100">
          开奖时间：{formatDate(drawTime)} <span className="text-xs opacity-70">(北京时间)</span>
        </div>
      ) : (
        <div className="mb-3 font-medium text-gray-400 bg-gray-50 inline-block px-3 py-1 rounded-lg text-sm border border-gray-100">
          暂未设置开奖时间
        </div>
      )}
      
      <div className="text-sm text-gray-500 mb-1">距离开奖还有</div>
      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-mono">
        {timeLeft || '--:--:--'}
      </div>
      {isDue && status === 'open' && (
        <div className="mt-4 animate-bounce text-red-600 font-bold flex items-center justify-center gap-2">
          <AlertCircle size={20}/> 管理员请点击开奖
        </div>
      )}
    </div>
  );
};

// --- Main Application Component ---
export default function LotteryApp() {
  const [user, setUser] = useState(null);
  const [lotteryState, setLotteryState] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  
  // UI States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  // Admin States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Admin Form States
  const [configDrawTime, setConfigDrawTime] = useState('');
  const [prizeCounts, setPrizeCounts] = useState({
    q3: 0, qBody: 0, b3: 0, bBody: 0
  });

  // --- Initial Setup (Favicon & Title) ---
  useEffect(() => {
    // 1. 设置网页标题
    document.title = "妻管严和外甥女的小伙伴们";

    // 2. 动态设置 Favicon 为一个礼物盒 Emoji 🎁
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'icon';
    link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎁</text></svg>`;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  // --- Helpers ---
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // --- Firebase Logic ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // 1. Listen to Lottery State
    const stateUnsub = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'lottery_state', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLotteryState(data);
          
          if (data.config?.counts) {
             setPrizeCounts(prev => ({...prev, ...data.config.counts}));
          }

          if (data.config?.drawTime) {
             setConfigDrawTime(prev => {
                if (prev) return prev;
                const date = new Date(data.config.drawTime);
                const offset = date.getTimezoneOffset() * 60000;
                return (new Date(date - offset)).toISOString().slice(0, 16);
             });
          }
        } else {
          // 初始化时不设默认值，强制留白，由管理员手动设置
          const defaultState = {
            status: 'open',
            config: { counts: { q3: 0, qBody: 0, b3: 0, bBody: 0 }, drawTime: '' },
            winners: {}
          };
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'lottery_state', 'main'), defaultState);
        }
        setLoading(false);
      }
    );

    // 2. Listen to Participants
    const participantsUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'participants'),
      (snapshot) => setParticipants(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // 3. Listen to History (Sorting locally)
    const historyUnsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'history'),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const timeA = a.archivedAt?.seconds || 0;
          const timeB = b.archivedAt?.seconds || 0;
          return timeB - timeA;
        });
        setHistoryList(list);
      }
    );

    return () => { stateUnsub(); participantsUnsub(); historyUnsub(); };
  }, [user]);

  // --- Actions ---
  const handleJoin = async () => {
    if (!nameInput.trim()) return;
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid), {
        uid: user.uid, name: nameInput.trim(), joinedAt: serverTimestamp(),
        avatar: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨'][Math.floor(Math.random() * 9)]
      });
      showToast('报名成功！祝你好运！', 'success');
    } catch (e) {
      console.error(e);
      showToast('报名失败，请重试', 'error');
    }
  };

  const handleUpdateConfig = async () => {
    if (!configDrawTime) return showToast("请选择开奖时间", 'error');
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'lottery_state', 'main'), {
        'config.counts': prizeCounts,
        'config.drawTime': new Date(configDrawTime).toISOString()
      });
      showToast('设置已保存', 'success');
      setIsAdminMode(false);
    } catch (e) {
      showToast('保存失败: ' + e.message, 'error');
    }
  };

  // Logic to execute after confirmation
  const executeStartNewRound = async () => {
    setLoading(true);
    setConfirmConfig(null); // Close modal

    try {
      const chunkSize = 400; 
      const chunks = [];
      for (let i = 0; i < participants.length; i += chunkSize) {
        chunks.push(participants.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const deleteBatch = writeBatch(db);
        chunk.forEach(p => {
          deleteBatch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'participants', p.id));
        });
        await deleteBatch.commit();
      }
      
      const batch = writeBatch(db);
      const stateRef = doc(db, 'artifacts', appId, 'public', 'data', 'lottery_state', 'main');
      
      batch.update(stateRef, {
        status: 'open',
        winners: {}
      });

      await batch.commit();
      showToast('状态已重置，报名已清空', 'success');

    } catch (e) {
      console.error(e);
      showToast('操作失败: ' + e.message, 'error');
    }
    setLoading(false);
  };

  // Logic to execute after confirmation
  const executeDraw = async () => {
    setConfirmConfig(null); // Close modal
    
    try {
      await runTransaction(db, async (transaction) => {
        const stateRef = doc(db, 'artifacts', appId, 'public', 'data', 'lottery_state', 'main');
        const sfDoc = await transaction.get(stateRef);
        if (!sfDoc.exists()) throw "State does not exist!";
        const currentState = sfDoc.data();
        
        const counts = prizeCounts; // Use local state

        const shuffle = (array) => {
          let currentIndex = array.length, randomIndex;
          const newArr = [...array];
          while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [newArr[currentIndex], newArr[randomIndex]] = [newArr[randomIndex], newArr[currentIndex]];
          }
          return newArr;
        };

        let pool = shuffle(participants);
        const q3Winners = pool.slice(0, Math.min(counts.q3, pool.length));
        
        pool = shuffle(participants); 
        const qBodyWinners = pool.slice(0, Math.min(counts.qBody, pool.length));

        const q3WinnerIds = new Set(q3Winners.map(u => u.uid));
        const b3PoolRaw = participants.filter(u => !q3WinnerIds.has(u.uid));
        const b3Pool = shuffle(b3PoolRaw);
        const b3Winners = b3Pool.slice(0, Math.min(counts.b3, b3Pool.length));

        const qBodyWinnerIds = new Set(qBodyWinners.map(u => u.uid));
        const bBodyPoolRaw = participants.filter(u => !qBodyWinnerIds.has(u.uid));
        const bBodyPool = shuffle(bBodyPoolRaw);
        const bBodyWinners = bBodyPool.slice(0, Math.min(counts.bBody, bBodyPool.length));

        const finalWinners = { q3: q3Winners, qBody: qBodyWinners, b3: b3Winners, bBody: bBodyWinners };

        const historyRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'history'));
        const historyData = {
           archivedAt: serverTimestamp(),
           drawTime: currentState.config.drawTime,
           drawConfig: { ...currentState.config, counts: counts },
           winners: finalWinners,
           participantCount: participants.length,
           participantsSnapshot: participants.map(p => ({
             name: p.name, 
             avatar: p.avatar, 
             uid: p.uid
           }))
        };
        transaction.set(historyRef, historyData);

        transaction.update(stateRef, {
          status: 'completed',
          winners: finalWinners,
          'config.counts': { q3: 0, qBody: 0, b3: 0, bBody: 0 },
          'config.drawTime': ''
        });
      });
      showToast('开奖成功！结果已归档，配置已重置', 'success');
    } catch (e) {
      console.error("Draw failed: ", e);
      showToast("开奖失败: " + e.message, 'error');
    }
  };

  const handleStartNewRoundRequest = () => {
    setConfirmConfig({
      title: '⚠️ 确认重置状态？',
      message: '此操作将：\n1. 清空当前所有报名者\n2. 重置开奖状态为“未开奖”\n\n注意：不会修改开奖时间。请确保您已保存上一轮结果（已自动归档）。',
      onConfirm: executeStartNewRound,
      isDangerous: true
    });
  };

  const handleDrawRequest = () => {
    if (participants.length === 0) return showToast("没有报名者，无法开奖", 'error');

    const totalPrizes = Object.values(prizeCounts).reduce((a, b) => a + (parseInt(b) || 0), 0);
    const message = totalPrizes === 0 
      ? '⚠️ 警告：当前设置的所有奖品数量均为 0！\n\n如果继续开奖，将不会产生任何中奖者。\n确定要继续吗？'
      : '系统将使用您【当前输入框中】的奖品数量进行抽奖。\n\n操作包括：\n1. 冻结报名\n2. 抽取幸运儿\n3. 自动归档到历史记录\n4. 清空配置等待下一轮\n\n此操作不可撤销！';

    setConfirmConfig({
      title: '🎁 确认立即开奖？',
      message: message,
      onConfirm: executeDraw,
      isDangerous: false
    });
  };

  const handleDeleteHistoryRequest = (recordId) => {
    setConfirmConfig({
      title: '⚠️ 永久删除记录',
      message: '您确定要永久删除这条历史记录吗？\n删除后将无法找回！此操作主要用于清理测试数据。',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'history', recordId));
          setConfirmConfig(null);
          showToast('记录已删除', 'success');
        } catch (e) {
          showToast('删除失败: ' + e.message, 'error');
        }
      },
      isDangerous: true
    });
  };

  const handleAdminAccess = () => {
    if (isAuthenticated) {
      setIsAdminMode(!isAdminMode);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setIsAdminMode(true);
      setPasswordInput('');
    } else {
      showToast('密码错误', 'error');
    }
  };

  const formatHistoryDate = (timestamp) => {
    if (!timestamp) return '未知日期';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const chinaTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    const y = chinaTime.getUTCFullYear();
    const m = chinaTime.getUTCMonth() + 1;
    const d = chinaTime.getUTCDate();
    const h = chinaTime.getUTCHours();
    const min = chinaTime.getUTCMinutes();
    return `${y}年${m}月${d}日 ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
  };

  // --- Views ---

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">加载中...</div>;

  const isUserJoined = participants.some(p => p.uid === user?.uid);
  const status = lotteryState?.status || 'open';
  
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-20 font-sans">
      {/* Notifications and Modals */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={!!confirmConfig} 
        title={confirmConfig?.title} 
        message={confirmConfig?.message} 
        onConfirm={confirmConfig?.onConfirm} 
        onCancel={() => setConfirmConfig(null)}
        isDangerous={confirmConfig?.isDangerous}
      />

      <header className="bg-gradient-to-b from-red-600 to-red-500 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-yellow-300"></div>
           <div className="absolute bottom-[10%] left-[-10%] w-32 h-32 rounded-full bg-yellow-300"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <Gift className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2 text-shadow-sm">妻管严和外甥女的小伙伴们</h1>
          <p className="text-red-100 opacity-90 text-sm">群友专属 · 自动开奖 · 公平公正</p>
          
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md transition-all shadow-sm hover:shadow-md active:scale-95 group"
          >
            <History className="text-white w-4 h-4 group-hover:-rotate-12 transition-transform" />
            <span className="text-xs font-bold text-white tracking-wide">往期抽奖记录</span>
          </button>
        </div>
      </header>

      <main className="px-4 -mt-10 relative z-20 max-w-md mx-auto space-y-6">
        
        <Card className="text-center">
          {status === 'completed' ? (
            <div className="py-4">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-gray-800">开奖已结束</h2>
              <p className="text-gray-500 text-sm mt-1">恭喜所有中奖的欧皇！</p>
              <p className="text-xs text-gray-400 mt-2">（本期结果已自动保存至历史记录）</p>
            </div>
          ) : (
            <TimeDisplay drawTime={lotteryState?.config?.drawTime} status={status} />
          )}
        </Card>

        {status === 'open' && (
          <Card>
            {!isUserJoined ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg text-gray-800">立即登记参与</h3>
                  <p className="text-xs text-gray-500">输入你在群里的昵称方便大家认领</p>
                </div>
                <input
                  type="text"
                  placeholder="请输入你的昵称..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all text-center text-lg"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                />
                <Button onClick={handleJoin} className="w-full shadow-red-200">
                  确认报名
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="font-bold text-green-700 text-lg">报名成功</h3>
                <p className="text-gray-500 text-sm mt-1">静候佳音，当前已有 {participants.length} 人参与</p>
              </div>
            )}
          </Card>
        )}

        {status === 'open' && participants.length > 0 && (
          <Card title={`已登记仙友 (${participants.length})`} icon={Users}>
            <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
              {[...participants]
                .sort((a, b) => (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0))
                .map((p) => (
                <div key={p.uid} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 transition-all hover:bg-red-50 hover:border-red-100">
                  <div className="text-2xl bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm shrink-0">
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm break-all leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {p.joinedAt?.seconds 
                        ? new Date(p.joinedAt.seconds * 1000).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit', second:'2-digit'}) 
                        : '刚刚'} 登记
                    </div>
                  </div>
                  {p.uid === user?.uid && (
                    <span className="shrink-0 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">我</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title={status === 'completed' ? "中奖名单" : "奖项设置"} icon={Trophy}>
          <div className="space-y-2">
            {status === 'completed' ? (
              <>
                <WinnerSection pKey="q3" winnersData={lotteryState?.winners} currentUserId={user?.uid} />
                <WinnerSection pKey="qBody" winnersData={lotteryState?.winners} currentUserId={user?.uid} />
                <WinnerSection pKey="b3" winnersData={lotteryState?.winners} currentUserId={user?.uid} />
                <WinnerSection pKey="bBody" winnersData={lotteryState?.winners} currentUserId={user?.uid} />
              </>
            ) : (
              Object.keys(PRIZES).map(key => (
                <div key={key} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${PRIZES[key].color.replace('text', 'bg')}`}></div>
                     <span className="font-medium text-gray-700">{PRIZES[key].label}</span>
                   </div>
                   <span className="font-bold text-gray-900">x {lotteryState?.config?.counts[key] || 0}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 text-justify leading-relaxed">
            <span className="font-bold text-gray-500">规则提示：</span>
            系统已设置规则，抽中妻佬三界的仙友，不再参与宝の三界的抽奖，抽中妻佬神躯的仙友，不再参与宝の神躯的抽奖。
          </div>
        </Card>

        {/* Admin Access Button */}
        <div className="text-center pt-8">
           <button 
             onClick={handleAdminAccess}
             className="text-gray-400 text-sm flex items-center justify-center gap-1 mx-auto hover:text-gray-600 transition-colors"
           >
             {isAuthenticated ? <Settings size={14} /> : <Lock size={14} />} 
             {isAuthenticated ? (isAdminMode ? '收起管理' : '管理设置') : '管理员入口'}
           </button>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
             <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="text-red-500" size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">管理员验证</h3>
                  <p className="text-xs text-gray-500">请输入密码以访问管理面板</p>
                </div>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-center focus:ring-2 focus:ring-red-500 outline-none"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
                <Button onClick={handleLoginSubmit} className="w-full">
                  验证身份
                </Button>
             </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
            <div className="bg-white p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="text-red-500" /> 往期抽奖记录
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="bg-gray-100 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {historyList.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>暂无历史记录</p>
                </div>
              ) : (
                historyList.map((record) => (
                  <Card key={record.id} className="mb-4">
                    <div className="border-b border-gray-100 pb-3 mb-3 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={16} />
                          {formatHistoryDate(record.archivedAt)}
                       </div>
                       {/* Delete Button (Admin Only) */}
                       {isAdminMode && isAuthenticated && (
                         <button 
                           onClick={() => handleDeleteHistoryRequest(record.id)}
                           className="text-gray-400 hover:text-red-500 transition-colors p-1"
                           title="删除此记录"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                    
                    <div className="space-y-4">
                      {/* Winners Summary */}
                      <WinnerSection pKey="q3" winnersData={record.winners} currentUserId={user?.uid} />
                      <WinnerSection pKey="qBody" winnersData={record.winners} currentUserId={user?.uid} />
                      <WinnerSection pKey="b3" winnersData={record.winners} currentUserId={user?.uid} />
                      <WinnerSection pKey="bBody" winnersData={record.winners} currentUserId={user?.uid} />
                    </div>

                    {/* Participants Snapshot */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                       <details className="group">
                         <summary className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer list-none font-medium">
                            <span className="bg-gray-100 px-2 py-1 rounded group-hover:bg-gray-200 transition-colors">
                               查看参与名单 ({record.participantCount || record.participantsSnapshot?.length || 0}人)
                            </span>
                         </summary>
                         <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                            {record.participantsSnapshot?.map(p => p.name).join('、')}
                         </div>
                       </details>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {isAdminMode && isAuthenticated && (
          <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold border-b border-gray-600 pb-2 flex justify-between items-center">
              <span>控制台</span>
              <div className="flex gap-2">
                {/* Admin History Link */}
                <button 
                  onClick={() => setShowHistoryModal(true)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                   <History size={12} /> 管理往期记录
                </button>
                <span className="text-xs bg-green-600 px-2 py-1 rounded">已验证</span>
              </div>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">开奖时间</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  value={configDrawTime}
                  onChange={e => setConfigDrawTime(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.keys(PRIZES).map(key => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">{PRIZES[key].label}</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      value={prizeCounts[key]}
                      onChange={e => setPrizeCounts({...prizeCounts, [key]: parseInt(e.target.value) || 0})}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button onClick={handleUpdateConfig} variant="secondary" className="w-full text-sm">
                  保存设置
                </Button>
                
                <div className="flex flex-col gap-3 mt-2">
                  <Button 
                    onClick={handleDrawRequest}
                    disabled={participants.length === 0}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 border-none text-black"
                  >
                    立即开奖
                  </Button>
                  <Button 
                    onClick={handleStartNewRoundRequest}
                    variant="ghost" 
                    className="w-full text-red-400 hover:bg-white/10 hover:text-red-300 gap-2"
                  >
                    <RotateCcw size={16} /> 清空报名重置状态
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Share Hint */}
      <div className="fixed top-4 left-4 z-50">
        <button 
          onClick={() => {
             if (navigator.share) {
               navigator.share({ title: '妻管严和外甥女的小伙伴们', url: window.location.href });
             } else {
               document.execCommand('copy');
               showToast('链接已复制，去微信群粘贴吧！', 'success');
             }
          }}
          className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg text-gray-600 hover:text-red-500 transition-colors"
        >
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
}