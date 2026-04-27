import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Menu, QrCode, ClipboardList, Plus, Trash2, ShoppingCart, 
  ChevronRight, CheckCircle2, Clock, X, Info, Store, User, Copy, History, Pencil, CreditCard
} from 'lucide-react';

// --- ICONE DE QUIOSQUE CUSTOMIZADO ---
const KioskIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="11" r="7" fill="#FBBF24" />
    <rect x="11" y="9" width="9" height="12" rx="1.5" fill="white" stroke="#0F172A" strokeWidth="1.5" />
    <path d="M13 13 C 13 11, 18 11, 18 13 Z" fill="#0F172A" />
    <circle cx="13.5" cy="15.5" r="0.5" fill="#0F172A" />
    <line x1="15" y1="15.5" x2="18" y2="15.5" stroke="#0F172A" strokeWidth="1" strokeLinecap="round" />
    <circle cx="13.5" cy="17.5" r="0.5" fill="#0F172A" />
    <line x1="15" y1="17.5" x2="18" y2="17.5" stroke="#0F172A" strokeWidth="1" strokeLinecap="round" />
    <path d="M7 18 Q 8 14 7 10" stroke="#0F172A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M7 10 Q 5 8 3 10 M7 10 Q 7 6 5 5 M7 10 Q 9 6 11 7 M7 10 Q 11 9 12 12" stroke="#0F172A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M2 18 Q 6 15 10 18 T 18 18" stroke="#06B6D4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M4 21 Q 8 18 12 21 T 20 21" stroke="#0891B2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

// --- SUPABASE SETUP ---
const getEnvVar = (name, fallback) => {
  try { if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name]; } catch (e) {}
  return fallback;
};
const SUPABASE_URL = getEnvVar('REACT_APP_SUPABASE_URL', 'https://cemsjfobgqjdgyyvbkfi.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('REACT_APP_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbXNqZm9iZ3FqZGd5eXZia2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjAxNjAsImV4cCI6MjA5MjczNjE2MH0.RF22cF54o2rrtGCUHT78kHB_ujtLqNUYzRtvVbmRGFw');
let supabase = null;

export default function AppWrapper() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Carrega Supabase
    if (window.supabase) {
      if (!supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setIsLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setIsLoaded(true);
      };
      document.head.appendChild(script);
    }

    // Carrega Stripe.js
    if (!document.querySelector('script[src="https://js.stripe.com/v3/"]')) {
      const stripeScript = document.createElement('script');
      stripeScript.src = 'https://js.stripe.com/v3/';
      stripeScript.crossOrigin = 'anonymous';
      document.head.appendChild(stripeScript);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return <App />;
}

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminTab, setAdminTab] = useState('pedidos');
  const [clientEstId, setClientEstId] = useState('');
  const [toast, setToast] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const previousOrdersRef = useRef([]);

  // --- AUTH ---
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setView('update_password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientParam = params.get('kiosque');
    if (clientParam) {
      setClientEstId(clientParam);
      setView('client');
    }
  }, []);

  // --- PWA SETUP ---
  useEffect(() => {
    const setupPWA = () => {
      const manifest = {
        name: "Click Beach",
        short_name: "Click Beach",
        display: "standalone",
        start_url: window.location.href.split('?')[0],
        background_color: "#fff7ed",
        theme_color: "#ea580c",
        icons: [{
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='11' r='7' fill='%23FBBF24' /%3E%3Crect x='11' y='9' width='9' height='12' rx='1.5' fill='white' stroke='%230F172A' stroke-width='1.5' /%3E%3Cpath d='M13 13 C 13 11, 18 11, 18 13 Z' fill='%230F172A' /%3E%3Ccircle cx='13.5' cy='15.5' r='0.5' fill='%230F172A' /%3E%3Cline x1='15' y1='15.5' x2='18' y2='15.5' stroke='%230F172A' stroke-width='1' stroke-linecap='round' /%3E%3Ccircle cx='13.5' cy='17.5' r='0.5' fill='%230F172A' /%3E%3Cline x1='15' y1='17.5' x2='18' y2='17.5' stroke='%230F172A' stroke-width='1' stroke-linecap='round' /%3E%3Cpath d='M7 18 Q 8 14 7 10' stroke='%230F172A' stroke-width='1.5' fill='none' stroke-linecap='round' /%3E%3Cpath d='M7 10 Q 5 8 3 10 M7 10 Q 7 6 5 5 M7 10 Q 9 6 11 7 M7 10 Q 11 9 12 12' stroke='%230F172A' stroke-width='1.5' fill='none' stroke-linecap='round' /%3E%3Cpath d='M2 18 Q 6 15 10 18 T 18 18' stroke='%2306B6D4' stroke-width='1.5' fill='none' stroke-linecap='round' /%3E%3Cpath d='M4 21 Q 8 18 12 21 T 20 21' stroke='%230891B2' stroke-width='1.5' fill='none' stroke-linecap='round' /%3E%3C/svg%3E",
          sizes: "512x512 any",
          type: "image/svg+xml",
          purpose: "any maskable"
        }]
      };
      
      let link = document.querySelector('link[rel="manifest"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'manifest';
        document.head.appendChild(link);
      }
      link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest));

      let meta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-capable';
        meta.content = 'yes';
        document.head.appendChild(meta);
      }

      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = manifest.icons[0].src;
        document.head.appendChild(appleIcon);
      }

      if ('serviceWorker' in navigator) {
        const swCode = "self.addEventListener('fetch', function() {});";
        const swBlob = new Blob([swCode], {type: 'application/javascript'});
        navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(() => {});
      }
    };
    setupPWA();
  }, []);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification('Click Beach', { body: msg });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Click Beach', { body: msg });
          }
        });
      }
    }
  }, []);

  // --- DATA FETCHING (POLLING INSTEAD OF REALTIME) ---
  const fetchMenus = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('clickbeach_menu').select('*');
      if (error) console.error(error);
      if (data) setMenuItems(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('clickbeach_orders').select('*');
      if (error) console.error(error);
      if (data) {
        if (user && view === 'admin' && previousOrdersRef.current.length > 0) {
          const currentIds = previousOrdersRef.current.map(o => o.id);
          const newOrders = data.filter(o => !currentIds.includes(o.id) && String(o.establishmentId || o.establishmentid || o.establishment_id).toLowerCase() === String(user.id).toLowerCase());
          if (newOrders.length > 0) {
            showToast("Novo pedido recebido!");
          }
        }
        previousOrdersRef.current = data;
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user, view, showToast]);

  useEffect(() => {
    if (!user && view !== 'client') return;
    
    fetchMenus();
    fetchOrders();

    // WebSockets are not allowed in this environment, using polling
    const interval = setInterval(() => {
      fetchMenus();
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, view, fetchMenus, fetchOrders]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 text-slate-800 font-sans selection:bg-orange-200">
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 text-white font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
        }`}>
          {toast.msg}
        </div>
      )}

      {view === 'landing' && <LandingView setView={setView} setClientEstId={setClientEstId} />}
      
      {view === 'update_password' && <UpdatePasswordView setView={setView} showToast={showToast} />}

      {view === 'admin' && (
        <AdminView 
          user={user}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          menuItems={menuItems.filter(m => {
            const mId = m.establishmentId || m.establishmentid || m.establishment_id;
            return mId && String(mId).toLowerCase() === String(user.id).toLowerCase();
          })}
          orders={orders.filter(o => {
            const oId = o.establishmentId || o.establishmentid || o.establishment_id;
            return oId && String(oId).toLowerCase() === String(user.id).toLowerCase();
          }).sort((a,b) => b.timestamp - a.timestamp)}
          showToast={showToast}
          setView={setView}
          formatCurrency={formatCurrency}
          setClientEstId={setClientEstId}
          refreshMenus={fetchMenus}
          refreshOrders={fetchOrders}
        />
      )}

      {view === 'client' && (
        <ClientView
          clientEstId={clientEstId}
          menuItems={menuItems.filter(m => {
            const mId = m.establishmentId || m.establishmentid || m.establishment_id;
            return mId && String(mId).toLowerCase() === String(clientEstId).toLowerCase();
          })}
          setView={setView}
          showToast={showToast}
          formatCurrency={formatCurrency}
          refreshOrders={fetchOrders}
        />
      )}
    </div>
  );
}

// ==========================================
// VIEWS
// ==========================================

function UpdatePasswordView({ setView, showToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword) return showToast("Digite a nova senha", "error");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Senha atualizada com sucesso!");
      setView('admin');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-orange-100 to-cyan-100">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Criar Nova Senha</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" required />
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-md">
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LandingView({ setView, setClientEstId }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [estName, setEstName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [cityState, setCityState] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      if (!estName || !username || !fullName || !documentId || !phone || !cityState || !password || !confirmPassword) {
        setError('Preencha todos os campos para abrir a conta.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      setIsLoading(true);
      try {
        const currentUrl = window.location.href.split('?')[0];
        const email = username.includes('@') ? username : `${username.replace(/\s+/g, '')}@clickbeach.app`;
        
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: currentUrl,
            data: {
              quiosque: estName,
              nome_completo: fullName,
              documento: documentId,
              celular: phone,
              cidade_estado: cityState,
              assinatura_expira_em: Date.now() + (7 * 24 * 60 * 60 * 1000)
            }
          }
        });
        
        if (authError) throw new Error(authError.message);
        setView('admin');
        if (typeof Notification !== 'undefined') Notification.requestPermission();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!username || !password) {
        setError('Preencha usuário e senha.');
        return;
      }
      setIsLoading(true);
      try {
        const email = username.includes('@') ? username : `${username.replace(/\s+/g, '')}@clickbeach.app`;
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw new Error(authError.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos.' : authError.message);
        setView('admin');
        if (typeof Notification !== 'undefined') Notification.requestPermission();
      } catch (err) {
        setError(err.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos.' : err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!username) {
      setError('Preencha o e-mail para recuperar a senha.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResetSuccess('');
    try {
      const currentUrl = window.location.href.split('?')[0];
      const email = username.includes('@') ? username : `${username.replace(/\s+/g, '')}@clickbeach.app`;
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: currentUrl });
      if (authError) throw new Error(authError.message);
      setResetSuccess('Link de recuperação enviado para o seu e-mail!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-orange-100 to-cyan-100">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-orange-500 text-white rounded-2xl shadow-inner transform rotate-3">
            <KioskIcon size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-orange-600 mb-2">Click Beach</h1>
        <p className="text-slate-600 mb-8 font-medium">Seu cardápio digital na beira da praia.</p>

        <div className="space-y-6">
          <form onSubmit={isResettingPassword ? handleResetPassword : handleLogin} className="p-5 bg-orange-50 rounded-2xl border border-orange-100 shadow-sm flex flex-col gap-4">
            <h2 className="font-bold text-lg mb-1 flex items-center justify-center gap-2 text-slate-700">
              <User className="text-orange-500" size={20} /> {isResettingPassword ? 'Recuperar Senha' : (isRegistering ? 'Criar Nova Conta' : 'Login do Estabelecimento')}
            </h2>
            
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            {resetSuccess && <p className="text-emerald-600 text-sm font-medium">{resetSuccess}</p>}
            
            {isResettingPassword ? (
              <input type="email" placeholder="Email para recuperação" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
            ) : isRegistering ? (
              <div className="space-y-3 text-left">
                <input type="text" placeholder="Nome do quiosque" value={estName} onChange={(e) => setEstName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="text" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="email" placeholder="Email" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="text" placeholder="CPF/CNPJ" value={documentId} onChange={(e) => setDocumentId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="tel" placeholder="Celular" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="text" placeholder="Cidade/Estado" value={cityState} onChange={(e) => setCityState(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="password" placeholder="Criar uma senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ) : (
              <div className="space-y-3">
                <input type="text" placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            )}
            
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors shadow-md mt-2">
              {isResettingPassword ? (isLoading ? 'Enviando...' : 'Enviar link de recuperação') : (isRegistering ? (isLoading ? 'Criando conta...' : 'Abrir Conta e Acessar') : 'Acessar Painel')}
            </button>

            {!isResettingPassword && !isRegistering && (
              <button type="button" onClick={() => { setIsResettingPassword(true); setError(''); setResetSuccess(''); }} className="text-sm text-slate-500 hover:text-orange-600 font-medium transition-colors">
                Esqueci minha senha
              </button>
            )}

            <button type="button" onClick={() => { if (isResettingPassword) setIsResettingPassword(false); else setIsRegistering(!isRegistering); setError(''); setResetSuccess(''); }} className="text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors">
              {isResettingPassword ? 'Voltar para o login' : (isRegistering ? 'Já tenho uma conta. Fazer login' : 'Não tem conta? Criar agora')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- ADMIN VIEW ---
function AdminView({ user, adminTab, setAdminTab, menuItems, orders, showToast, setView, formatCurrency, setClientEstId, refreshMenus, refreshOrders }) {
  const firstName = user?.user_metadata?.nome_completo?.split(' ')[0] || 'Estabelecimento';
  const assinaturaExpiraEm = user?.user_metadata?.assinatura_expira_em;
  const isExpired = assinaturaExpiraEm ? Date.now() > assinaturaExpiraEm : false;

  useEffect(() => {
    if (isExpired && adminTab !== 'assinatura') {
      setAdminTab('assinatura');
    }
  }, [isExpired, adminTab, setAdminTab]);

  const handleTabChange = (tab) => {
    if (isExpired && tab !== 'assinatura') {
      showToast("Sua assinatura expirou. Renove para acessar o painel.", "error");
      return;
    }
    setAdminTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="bg-white shadow-sm border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-sm text-slate-500 font-medium">Olá, {firstName}</div>
            <div className="flex items-center gap-2 text-orange-600 font-bold text-xl">
              <KioskIcon /> Painel do Quiosque
            </div>
          </div>
          <button onClick={() => setView('landing')} className="text-sm text-slate-500 hover:text-slate-800">Sair</button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 mt-2">
        {adminTab === 'pedidos' && <AdminOrders orders={orders} showToast={showToast} formatCurrency={formatCurrency} refreshOrders={refreshOrders} />}
        {adminTab === 'cardapio' && <AdminMenu user={user} menuItems={menuItems} showToast={showToast} formatCurrency={formatCurrency} refreshMenus={refreshMenus} />}
        {adminTab === 'qr' && <AdminQR user={user} showToast={showToast} setView={setView} setClientEstId={setClientEstId} />}
        {adminTab === 'assinatura' && <AdminSubscription user={user} showToast={showToast} />}
        {adminTab === 'historico' && <AdminHistory orders={orders} formatCurrency={formatCurrency} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 md:relative md:border-t-0 md:bg-transparent md:justify-center md:gap-4 md:p-4">
        <NavButton active={adminTab === 'pedidos'} onClick={() => handleTabChange('pedidos')} icon={<ClipboardList />} label="Pedidos" badge={orders.filter(o => o.status === 'Novo').length} />
        <NavButton active={adminTab === 'cardapio'} onClick={() => handleTabChange('cardapio')} icon={<Menu />} label="Cardápio" />
        <NavButton active={adminTab === 'qr'} onClick={() => handleTabChange('qr')} icon={<QrCode />} label="QR Code" />
        <NavButton active={adminTab === 'assinatura'} onClick={() => handleTabChange('assinatura')} icon={<CreditCard />} label="Assinatura" />
        <NavButton active={adminTab === 'historico'} onClick={() => handleTabChange('historico')} icon={<History />} label="Histórico" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-2 md:flex-row md:px-6 md:py-3 md:bg-white md:rounded-full md:shadow-sm transition-colors relative ${active ? 'text-orange-600 md:ring-2 md:ring-orange-500' : 'text-slate-500 hover:text-slate-800'}`}>
      {icon}
      <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0 md:ml-2">{label}</span>
      {badge > 0 && (
        <span className="absolute top-1 right-2 md:top-0 md:-right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

function AdminOrders({ orders, showToast, formatCurrency, refreshOrders }) {
  const updateOrderStatus = async (originalOrders, newStatus) => {
    try {
      const results = await Promise.all(originalOrders.map(order => supabase.from('clickbeach_orders').update({ status: newStatus }).eq('id', order.id)));
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
      showToast(`Comanda atualizada para ${newStatus}`);
      if (refreshOrders) refreshOrders();
    } catch (error) {
      showToast("Erro ao atualizar pedido: " + (error.message || "Erro desconhecido"), "error");
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Finalizado');
  const groupedOrders = activeOrders.reduce((acc, order) => {
    const baseKey = order.location.trim().toUpperCase();
    const key = order.status === 'Pago' ? `${baseKey}_PAGO` : `${baseKey}_ATIVO`;
    if (!acc[key]) {
      acc[key] = { id: key, customerName: order.customerName, location: order.location, phone: order.phone, items: [], total: 0, status: order.status, originalOrders: [], timestamp: order.timestamp };
    }
    order.items.forEach(item => {
       const existingItem = acc[key].items.find(i => i.name === item.name);
       if (existingItem) existingItem.quantity += item.quantity;
       else acc[key].items.push({ ...item });
    });
    acc[key].total += order.total;
    acc[key].originalOrders.push(order);
    if (order.timestamp > acc[key].timestamp) acc[key].timestamp = order.timestamp;
    return acc;
  }, {});

  const comandas = Object.values(groupedOrders).sort((a,b) => b.timestamp - a.timestamp);

  if (comandas.length === 0) {
    return (
      <div className="text-center py-20">
        <ClipboardList className="mx-auto text-slate-300 mb-4" size={64} />
        <h3 className="text-xl font-bold text-slate-600">Nenhum pedido ainda</h3>
        <p className="text-slate-500">Seus pedidos aparecerão aqui em tempo real.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Comandas Abertas</h2>
      {comandas.map(order => (
        <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{order.customerName}</h3>
                <p className="text-orange-600 font-semibold text-sm">Mesa/Local: {order.location}</p>
                {order.phone && <p className="text-slate-500 text-sm mt-1">Tel: {order.phone}</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Novo' ? 'bg-red-100 text-red-600' : order.status === 'Em Preparo' ? 'bg-blue-100 text-blue-600' : order.status === 'Entregue' ? 'bg-yellow-100 text-yellow-700' : order.status === 'Pagamento Pendente' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {order.status}
              </span>
            </div>
            <div className="mt-4 bg-slate-50 rounded-xl p-3">
              <ul className="space-y-2 mb-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-700 font-medium"><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                    <span className="text-slate-500 font-mono">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-800">
                <span>Total da Comanda</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row md:flex-col gap-2 justify-end border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-4">
             {order.status === 'Novo' && <button onClick={() => updateOrderStatus(order.originalOrders, 'Em Preparo')} className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl font-medium text-sm">Preparar</button>}
             {(order.status === 'Novo' || order.status === 'Em Preparo') && <button onClick={() => updateOrderStatus(order.originalOrders, 'Entregue')} className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Entregar</button>}
             {(order.status === 'Entregue') && <button onClick={() => updateOrderStatus(order.originalOrders, 'Pagamento Pendente')} className="flex-1 bg-slate-500 text-white py-2 px-4 rounded-xl font-medium text-sm">Cobrar</button>}
             {(order.status === 'Entregue' || order.status === 'Pagamento Pendente') && <button onClick={() => updateOrderStatus(order.originalOrders, 'Pago')} className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Pago</button>}
             {(order.status === 'Pago') && <button onClick={() => updateOrderStatus(order.originalOrders, 'Finalizado')} className="flex-1 bg-slate-800 text-white py-2 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Finalizar</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminHistory({ orders, formatCurrency }) {
  const groupedByDate = orders.reduce((acc, order) => {
    const dateStr = new Date(order.timestamp).toLocaleDateString('pt-BR');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(order);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const [dA, mA, yA] = a.split('/');
    const [dB, mB, yB] = b.split('/');
    return new Date(yB, mB - 1, dB) - new Date(yA, mA - 1, dA);
  });

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <History className="mx-auto text-slate-300 mb-4" size={64} />
        <h3 className="text-xl font-bold text-slate-600">Nenhum histórico</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Histórico</h2>
      {sortedDates.map(date => (
        <div key={date} className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 border-b border-slate-200 pb-2">{date}</h3>
          <div className="grid gap-3">
            {groupedByDate[date].sort((a, b) => b.timestamp - a.timestamp).map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800">{order.customerName} <span className="text-orange-600">({order.location})</span></h4>
                  <p className="text-xs text-slate-400">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <span className="font-bold text-emerald-600">{formatCurrency(order.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminMenu({ user, menuItems, showToast, formatCurrency, refreshMenus }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: 'Bebidas' });

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return showToast("Preencha nome e preço", "error");
    try {
      const formattedPrice = parseFloat(String(newItem.price).replace(',', '.'));
      if (editingId) {
        const { error } = await supabase.from('clickbeach_menu').update({ name: newItem.name, description: newItem.description, price: formattedPrice, category: newItem.category }).eq('id', editingId);
        if (error) throw error;
        showToast("Item atualizado!");
      } else {
        const { data, error } = await supabase.from('clickbeach_menu').insert([{ establishmentId: user.id, name: newItem.name, description: newItem.description, price: formattedPrice, category: newItem.category, available: true }]).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Item bloqueado para leitura (verifique RLS no banco).");
        showToast("Item adicionado!");
      }
      if (refreshMenus) refreshMenus();
      setIsAdding(false);
      setEditingId(null);
      setNewItem({ name: '', description: '', price: '', category: 'Bebidas' });
    } catch (error) {
      showToast("Erro ao salvar: " + (error.message || "Erro desconhecido"), "error");
    }
  };

  const deleteItem = async (id) => {
    try {
      const { error } = await supabase.from('clickbeach_menu').delete().eq('id', id);
      if (error) throw error;
      showToast("Item removido");
      if (refreshMenus) refreshMenus();
    } catch (e) {
      showToast("Erro ao remover: " + (e.message || "Erro desconhecido"), "error");
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const newStatus = !(item.available !== false);
      const { error } = await supabase.from('clickbeach_menu').update({ available: newStatus }).eq('id', item.id);
      if (error) throw error;
      showToast(newStatus ? "Produto disponível" : "Produto indisponível");
      if (refreshMenus) refreshMenus();
    } catch (e) {
      showToast("Erro ao atualizar: " + (e.message || "Erro desconhecido"), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Cardápio</h2>
        <button onClick={() => { setIsAdding(!isAdding); if (isAdding) { setEditingId(null); setNewItem({ name: '', description: '', price: '', category: 'Bebidas' }); }}} className="bg-orange-100 text-orange-600 p-2 rounded-xl hover:bg-orange-200 transition-colors flex items-center gap-1 font-medium">
          {isAdding ? <X size={20} /> : <Plus size={20} />} <span>{isAdding ? 'Cancelar' : 'Adicionar'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nome do Produto" required />
          <div className="flex gap-4">
            <input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Preço" required />
            <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
              <option>Bebidas</option><option>Porções</option><option>Pratos</option><option>Sobremesas</option>
            </select>
          </div>
          <input type="text" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Descrição (opcional)" />
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl">Salvar Produto</button>
        </form>
      )}

      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xl font-bold text-slate-800 border-b-2 border-orange-200 pb-2 mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group">
                <div>
                  <h3 className={`font-bold text-lg ${item.available === false ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.name}</h3>
                  <p className="text-emerald-600 font-bold mt-1 font-mono">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button 
                    onClick={() => toggleAvailability(item)}
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md transition-colors ${item.available !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                  >
                    {item.available !== false ? 'Disponível' : 'Indisponível'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { setNewItem({name: item.name, description: item.description || '', price: item.price, category: item.category}); setEditingId(item.id); setIsAdding(true); }} className="text-blue-400 hover:text-blue-600 p-2"><Pencil size={20} /></button>
                    <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={20} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {menuItems.length === 0 && !isAdding && (
        <div className="text-center py-10 text-slate-500">Nenhum item no cardápio.</div>
      )}
    </div>
  );
}

function AdminQR({ user, showToast, setView, setClientEstId }) {
  const baseUrl = window.location.href.split('?')[0];
  const clientLink = `${baseUrl}?kiosque=${user.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(clientLink)}&color=ea580c`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR Code</title>
          <style>
            body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
            img { width: 300px; height: 300px; margin-bottom: 20px; }
            h1 { color: #ea580c; margin-bottom: 10px; font-size: 32px; }
            p { color: #475569; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>Cardápio Digital</h1>
          <p>Escaneie o código abaixo para ver o nosso cardápio e fazer seu pedido.</p>
          <img src="${qrUrl}" onload="window.print();window.close()" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Seu QR Code</h2>
        <div className="bg-orange-50 p-4 rounded-2xl inline-block shadow-inner mb-8"><img src={qrUrl} alt="QR Code" className="w-64 h-64 mix-blend-multiply" /></div>
        <div className="space-y-4">
          <div className="bg-slate-100 px-4 py-3 rounded-xl font-mono text-xs text-slate-800 break-all">{user.id}</div>
          <button onClick={() => { const el = document.createElement('textarea'); el.value = clientLink; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); showToast("Link copiado!"); }} className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium">Copiar Link</button>
          <button onClick={handlePrint} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium shadow-md">Imprimir QR Code</button>
          <button onClick={() => { setClientEstId(user.id); setView('client'); }} className="w-full bg-cyan-600 text-white py-3 rounded-xl font-medium shadow-md">Simular Cliente</button>
        </div>
      </div>
    </div>
  );
}

function AdminSubscription({ user, showToast }) {
  const assinaturaExpiraEm = user?.user_metadata?.assinatura_expira_em;
  const isExpired = assinaturaExpiraEm ? Date.now() > assinaturaExpiraEm : false;
  const [pixCode, setPixCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGeneratePix = async () => {
    setLoading(true);
    showToast("Comunicando com o N8N...");
    try {
      // --- CONFIGURAÇÃO N8N AQUI ---
      // Descomente o código abaixo e insira a URL do seu Webhook do N8N
      /*
      const response = await fetch('SUA_URL_DO_WEBHOOK_N8N_AQUI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      });
      const data = await response.json();
      setPixCode(data.pixCopiaECola);
      */

      // Simulação de retorno do N8N (remover ao ligar o webhook real)
      setTimeout(() => {
        setPixCode('00020101021126580014br.gov.bcb.pix0136n8n-simulacao-pix-copia-e-cola');
        setLoading(false);
      }, 1500);
    } catch (e) {
      showToast("Erro ao conectar com N8N", "error");
      setLoading(false);
    }
  };

  const copyPix = () => {
    const el = document.createElement('textarea');
    el.value = pixCode;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast("PIX copiado!");
  };

  const handleCheckPayment = async () => {
    showToast("Verificando pagamento...");
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return showToast("Erro ao verificar", "error");
    
    const novaExpiracao = data?.session?.user?.user_metadata?.assinatura_expira_em;
    if (novaExpiracao && novaExpiracao > Date.now()) {
      showToast("Pagamento confirmado! Assinatura renovada.");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast("Pagamento não identificado ainda. Aguarde uns instantes.", "error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Assinatura</h2>
        <div className="bg-indigo-50 p-4 rounded-2xl inline-block shadow-inner mb-6 text-indigo-500">
          <CreditCard size={64} />
        </div>
        <div className="space-y-4">
          {isExpired && (
            <div className="bg-red-100 text-red-600 p-3 rounded-xl font-bold text-sm">
              Sua assinatura expirou! Renove agora para continuar usando o sistema.
            </div>
          )}
          <p className="text-slate-600">Renove sua assinatura via PIX. A liberação será feita automaticamente pelo sistema após o pagamento.</p>
          
          {!pixCode ? (
            <button onClick={handleGeneratePix} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium shadow-md">
              {loading ? 'Gerando...' : 'Gerar PIX de Assinatura'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-100 p-3 rounded-xl break-all text-xs text-slate-800 font-mono">
                {pixCode}
              </div>
              <button onClick={copyPix} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium shadow-md">
                Copiar PIX Copia e Cola
              </button>
              <button onClick={handleCheckPayment} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium shadow-md">
                Já paguei! Verificar Liberação
              </button>
              <p className="text-xs text-slate-500">Após o pagamento, o N8N processará e renovará sua conta automaticamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientView({ clientEstId, menuItems, setView, showToast, formatCurrency, refreshOrders }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const groupedItems = menuItems.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc; }, {});
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <header className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-b-3xl shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Cardápio Digital</h1><p className="text-cyan-100 text-xs">A beira mar!</p></div>
        <button onClick={() => setView('landing')} className="bg-white/20 p-2 rounded-full"><X size={20} /></button>
      </header>
      <main className="max-w-xl mx-auto p-4 mt-4 space-y-8">
        {Object.entries(groupedItems).length === 0 ? (
          <div className="text-center py-20 text-slate-400">Cardápio ainda não configurado.</div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-slate-800 border-b-2 border-orange-200 pb-2 mb-4">{category}</h2>
              <div className="grid gap-4">
                {items.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="flex-1 pr-4"><h3 className={`font-bold ${item.available === false ? 'text-slate-400' : 'text-slate-800'}`}>{item.name}</h3><p className="text-emerald-600 font-bold font-mono mt-1">{formatCurrency(item.price)}</p></div>
                    <button onClick={() => { setCart(prev => { const ex = prev.find(i => i.id === item.id); if (ex) return prev.map(i => i.id === item.id ? {...i, quantity: i.quantity+1} : i); return [...prev, {...item, quantity: 1}]; }); showToast("Adicionado!"); }} disabled={item.available === false} className={`p-3 rounded-xl shadow-sm ${item.available === false ? 'bg-slate-100 text-slate-300' : 'bg-orange-100 text-orange-600'}`}><Plus size={20} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
      {cartCount > 0 && !isCartOpen && <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full shadow-xl flex items-center gap-3 z-40 animate-bounce"><ShoppingCart size={24} /><span className="font-bold">{cartCount}</span></button>}
      {isCartOpen && <CartModal cart={cart} cartTotal={cartTotal} close={() => setIsCartOpen(false)} updateQuantity={(id, d) => setCart(p => p.map(i => i.id === id ? {...i, quantity: i.quantity+d} : i).filter(i => i.quantity > 0))} clientEstId={clientEstId} setCart={setCart} showToast={showToast} formatCurrency={formatCurrency} refreshOrders={refreshOrders} />}
    </div>
  );
}

function CartModal({ cart, cartTotal, close, updateQuantity, clientEstId, setCart, showToast, formatCurrency, refreshOrders }) {
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!customerName || !location || !phone) return showToast("Preencha todos os campos", "error");
    setSubmitting(true);
    try {
      const { error } = await supabase.from('clickbeach_orders').insert([{ establishmentId: clientEstId, customerName, location, phone, items: cart, total: cartTotal, status: 'Novo', timestamp: Date.now() }]);
      if (error) throw error;
      showToast("Pedido enviado!");
      if (refreshOrders) refreshOrders();
      setCart([]);
      close();
    } catch (e) { 
      showToast("Erro ao enviar: " + (e.message || "Verifique o banco de dados"), "error"); 
    }
    finally { setSubmitting(false); }
  };

  const handleStripePayment = async (e) => {
    e.preventDefault();
    if (!customerName || !location || !phone) return showToast("Preencha todos os campos", "error");
    setSubmitting(true);
    try {
      // Registra o pedido no Supabase como pendente de pagamento online
      const { error } = await supabase.from('clickbeach_orders').insert([{ establishmentId: clientEstId, customerName, location, phone, items: cart, total: cartTotal, status: 'Pagamento Pendente', timestamp: Date.now() }]);
      if (error) throw error;
      
      showToast("Redirecionando para pagamento seguro via Stripe...");
      
      if (window.Stripe) {
        // --- CONFIGURAÇÃO STRIPE AQUI ---
        // Descomente o código abaixo e adicione sua Public Key quando tiver um backend ou Link configurado
        // const stripe = window.Stripe('pk_test_sua_chave_publica');
        
        /* await stripe.redirectToCheckout({
          lineItems: [{ price: 'price_seu_id_de_produto', quantity: 1 }],
          mode: 'payment',
          successUrl: window.location.href + '&pagamento=sucesso',
          cancelUrl: window.location.href,
        });
        */

        // Simulação do redirecionamento
        setTimeout(() => {
          showToast("Pedido salvo! (Insira sua API Key do Stripe no código para checkout real)");
          if (refreshOrders) refreshOrders();
          setCart([]);
          close();
        }, 2500);
      }
    } catch (e) { 
      showToast("Erro de conexão com o Stripe: " + (e.message || "Verifique a configuração"), "error"); 
    }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-in p-6">
        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-orange-800">Seu Pedido</h2><button onClick={close}><X size={24}/></button></div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div><h4 className="font-bold text-slate-800 text-sm">{item.name}</h4><p className="text-emerald-600 text-xs font-mono">{formatCurrency(item.price)}</p></div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6">-</button>
                <span className="font-bold text-xs">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6">+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t space-y-4">
          <div className="flex justify-between font-bold text-lg text-slate-800"><span>Total:</span><span>{formatCurrency(cartTotal)}</span></div>
          <form onSubmit={handleOrder} className="space-y-3">
            <input type="text" placeholder="Seu Nome" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-3 border rounded-xl" required />
            <input type="text" placeholder="Mesa / Guarda-sol" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 border rounded-xl" required />
            <input type="tel" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-xl" required />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg">{submitting ? 'Aguarde...' : 'Pagar na Mesa'}</button>
              <button type="button" onClick={handleStripePayment} disabled={submitting} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg">Pagar com Stripe</button>
            </div>
          </form>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } } .animate-slide-in { animation: slide-in 0.3s forwards; }`}} />
    </div>
  );
}
