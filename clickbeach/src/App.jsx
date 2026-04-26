import React, { useState, useEffect } from 'react';
import { 
  Menu, QrCode, ClipboardList, Plus, Trash2, ShoppingCart, 
  ChevronRight, CheckCircle2, Clock, X, Info, Store, User, Copy, History, Pencil
} from 'lucide-react';

// --- SUPABASE SETUP ---
// Variáveis configuradas para o Vercel/GitHub
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
    if (window.supabase) {
      if (!supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setIsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setIsLoaded(true);
    };
    document.head.appendChild(script);
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
  const [view, setView] = useState('landing'); // 'landing', 'admin', 'client'
  
  // App Data
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Admin State
  const [adminTab, setAdminTab] = useState('pedidos'); // 'pedidos', 'cardapio', 'qr', 'historico'
  const [clientEstId, setClientEstId] = useState('');
  
  // UI State
  const [toast, setToast] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- AUTH & SUPABASE LISTENER ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Check URL parameters for direct client access (QR Code simulator)
    const params = new URLSearchParams(window.location.search);
    const clientParam = params.get('kiosque');
    if (clientParam) {
      setClientEstId(clientParam);
      setView('client');
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchMenus = async () => {
      const { data } = await supabase.from('clickbeach_menu').select('*');
      if (data) {
        if (data.length === 0) {
          setMenuItems([
            { id: 'm1', establishmentId: user.id, name: 'Isca de Peixe', description: 'Acompanha molho tártaro e limão', price: 65.0, category: 'Porções' },
            { id: 'm2', establishmentId: user.id, name: 'Camarão Alho e Óleo', description: 'Porção de 500g de camarão fresco', price: 85.0, category: 'Porções' },
            { id: 'm3', establishmentId: user.id, name: 'Batata Frita', description: 'Porção grande de batata frita crocante', price: 35.0, category: 'Porções' },
            { id: 'm4', establishmentId: user.id, name: 'Caipirinha de Limão', description: 'Cachaça, limão, açúcar e gelo', price: 25.0, category: 'Bebidas' },
            { id: 'm5', establishmentId: user.id, name: 'Cerveja Lata', description: 'Cerveja Pilsen 350ml gelada', price: 10.0, category: 'Bebidas' },
            { id: 'm6', establishmentId: user.id, name: 'Água de Coco', description: 'Coco gelado natural', price: 15.0, category: 'Bebidas' },
            { id: 'm7', establishmentId: user.id, name: 'Pastel de Camarão', description: 'Unidade de pastel frito na hora', price: 15.0, category: 'Porções' },
            { id: 'm8', establishmentId: user.id, name: 'Açaí na Tigela', description: 'Acompanha banana e granola (500ml)', price: 28.0, category: 'Sobremesas' }
          ]);
        } else {
          setMenuItems(data);
        }
      }
    };

    const fetchOrders = async () => {
      const { data } = await supabase.from('clickbeach_orders').select('*');
      if (data) setOrders(data);
    };

    fetchMenus();
    fetchOrders();

    const channel = supabase.channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickbeach_menu' }, fetchMenus)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickbeach_orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 text-white font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ROUTING */}
      {view === 'landing' && (
        <LandingView 
          setView={setView} 
          setClientEstId={setClientEstId} 
        />
      )}
      
      {view === 'admin' && (
        <AdminView 
          user={user}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          menuItems={menuItems.filter(m => m.establishmentId === user.id)}
          orders={orders.filter(o => o.establishmentId === user.id).sort((a,b) => b.timestamp - a.timestamp)}
          showToast={showToast}
          setView={setView}
          formatCurrency={formatCurrency}
          setClientEstId={setClientEstId}
        />
      )}

      {view === 'client' && (
        <ClientView
          clientEstId={clientEstId}
          menuItems={menuItems.filter(m => m.establishmentId === clientEstId)}
          setView={setView}
          showToast={showToast}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

// ==========================================
// VIEWS
// ==========================================

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
              cidade_estado: cityState
            }
          }
        });
        
        if (authError) throw new Error(authError.message);
        
        setView('admin');
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
        
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (authError) throw new Error(authError.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos.' : authError.message);
        
        setView('admin');
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
      
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: currentUrl
      });
      
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
            <Store size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-orange-600 mb-2">Click Beach</h1>
        <p className="text-slate-600 mb-8 font-medium">Seu cardápio digital na beira da praia.</p>

        <div className="space-y-6">
          <form onSubmit={isResettingPassword ? handleResetPassword : handleLogin} className="p-5 bg-orange-50 rounded-2xl border border-orange-100 shadow-sm flex flex-col gap-4">
            <h2 className="font-bold text-lg mb-1 flex items-center justify-center gap-2">
              <User className="text-orange-500" /> {isResettingPassword ? 'Recuperar Senha' : (isRegistering ? 'Criar Nova Conta' : 'Login do Estabelecimento')}
            </h2>
            
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            {resetSuccess && <p className="text-emerald-600 text-sm font-medium">{resetSuccess}</p>}
            
            {isResettingPassword ? (
              <input 
                type="email" 
                placeholder="Email para recuperação" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : isRegistering ? (
              <>
                <input 
                  type="text" 
                  placeholder="Nome do quiosque" 
                  value={estName}
                  onChange={(e) => setEstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="text" 
                  placeholder="Nome completo" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="text" 
                  placeholder="CPF/CNPJ" 
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="tel" 
                  placeholder="Celular" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="text" 
                  placeholder="Cidade/Estado" 
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="password" 
                  placeholder="Criar uma senha" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="password" 
                  placeholder="Confirmar Senha" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder="Usuário" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </>
            )}
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors shadow-md mt-2"
            >
              {isResettingPassword ? (isLoading ? 'Enviando...' : 'Enviar link de recuperação') : (isRegistering ? (isLoading ? 'Criando conta...' : 'Abrir Conta e Acessar') : 'Acessar Painel')}
            </button>

            {!isResettingPassword && !isRegistering && (
              <button 
                type="button"
                onClick={() => { setIsResettingPassword(true); setError(''); setResetSuccess(''); }}
                className="text-sm text-slate-500 hover:text-orange-600 font-medium transition-colors"
              >
                Esqueci minha senha
              </button>
            )}

            <button 
              type="button"
              onClick={() => { 
                if (isResettingPassword) {
                  setIsResettingPassword(false);
                } else {
                  setIsRegistering(!isRegistering); 
                }
                setError(''); 
                setResetSuccess('');
                setUsername(''); 
                setPassword(''); 
                setConfirmPassword('');
                setEstName('');
                setFullName('');
                setDocumentId('');
                setPhone('');
                setCityState('');
              }}
              className="text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors"
            >
              {isResettingPassword ? 'Voltar para o login' : (isRegistering ? 'Já tenho uma conta. Fazer login' : 'Não tem conta? Criar agora')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- ADMIN VIEW ---
function AdminView({ user, adminTab, setAdminTab, menuItems, orders, showToast, setView, formatCurrency, setClientEstId }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xl">
            <Store /> Painel do Quiosque
          </div>
          <button 
            onClick={() => setView('landing')}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 mt-2">
        {adminTab === 'pedidos' && <AdminOrders orders={orders} showToast={showToast} formatCurrency={formatCurrency} />}
        {adminTab === 'cardapio' && <AdminMenu user={user} menuItems={menuItems} showToast={showToast} formatCurrency={formatCurrency} />}
        {adminTab === 'qr' && <AdminQR user={user} showToast={showToast} setView={setView} setClientEstId={setClientEstId} />}
        {adminTab === 'historico' && <AdminHistory orders={orders} formatCurrency={formatCurrency} />}
      </main>

      {/* Admin Bottom/Side Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 md:relative md:border-t-0 md:bg-transparent md:justify-center md:gap-4 md:p-4">
        <NavButton active={adminTab === 'pedidos'} onClick={() => setAdminTab('pedidos')} icon={<ClipboardList />} label="Pedidos" badge={orders.filter(o => o.status === 'Novo').length} />
        <NavButton active={adminTab === 'cardapio'} onClick={() => setAdminTab('cardapio')} icon={<Menu />} label="Cardápio" />
        <NavButton active={adminTab === 'qr'} onClick={() => setAdminTab('qr')} icon={<QrCode />} label="QR Code" />
        <NavButton active={adminTab === 'historico'} onClick={() => setAdminTab('historico')} icon={<History />} label="Histórico" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center p-2 md:flex-row md:px-6 md:py-3 md:bg-white md:rounded-full md:shadow-sm transition-colors relative ${
        active ? 'text-orange-600 md:ring-2 md:ring-orange-500' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
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

function AdminOrders({ orders, showToast, formatCurrency }) {
  const updateOrderStatus = async (originalOrders, newStatus) => {
    try {
      await Promise.all(originalOrders.map(order => 
        supabase.from('clickbeach_orders').update({ status: newStatus }).eq('id', order.id)
      ));
      showToast(`Comanda atualizada para ${newStatus}`);
    } catch (error) {
      showToast("Erro ao atualizar pedido.", "error");
    }
  };

  // Group orders by location (mesa) to create "comandas"
  const activeOrders = orders.filter(o => o.status !== 'Finalizado');
  const groupedOrders = activeOrders.reduce((acc, order) => {
    const baseKey = order.location.trim().toUpperCase();
    const key = order.status === 'Pago' ? `${baseKey}_PAGO` : `${baseKey}_ATIVO`;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        customerName: order.customerName,
        location: order.location,
        phone: order.phone,
        items: [],
        total: 0,
        status: order.status,
        originalOrders: [],
        timestamp: order.timestamp
      };
    }
    
    order.items.forEach(item => {
       const existingItem = acc[key].items.find(i => i.name === item.name);
       if (existingItem) {
           existingItem.quantity += item.quantity;
       } else {
           acc[key].items.push({ ...item });
       }
    });

    acc[key].total += order.total;
    acc[key].originalOrders.push(order);
    
    if (order.timestamp > acc[key].timestamp) {
        acc[key].timestamp = order.timestamp;
    }

    const statusPriority = { 'Novo': 1, 'Em Preparo': 2, 'Entregue': 3, 'Pagamento Pendente': 4, 'Pago': 5, 'Finalizado': 6 };
    const currentPriority = statusPriority[acc[key].status] || 99;
    const newPriority = statusPriority[order.status] || 99;
    
    if (newPriority < currentPriority) {
        acc[key].status = order.status;
    }

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
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.status === 'Novo' ? 'bg-red-100 text-red-600' : 
                order.status === 'Em Preparo' ? 'bg-blue-100 text-blue-600' : 
                order.status === 'Entregue' ? 'bg-yellow-100 text-yellow-700' : 
                order.status === 'Pagamento Pendente' ? 'bg-slate-200 text-slate-700' : 
                'bg-emerald-100 text-emerald-700'
              }`}>
                {order.status}
              </span>
            </div>
            
            <div className="mt-4 bg-slate-50 rounded-xl p-3">
              <ul className="space-y-2 mb-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-700"><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                    <span className="text-slate-500">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-800">
                <span>Total da Comanda</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
              <Clock size={12}/> Último pedido: {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 justify-end border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-4">
             {order.status === 'Novo' && (
               <button 
                 onClick={() => updateOrderStatus(order.originalOrders, 'Em Preparo')}
                 className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl font-medium text-sm transition-colors"
               >
                 Preparar
               </button>
             )}
             {(order.status === 'Novo' || order.status === 'Em Preparo') && (
               <button 
                 onClick={() => updateOrderStatus(order.originalOrders, 'Entregue')}
                 className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1"
               >
                 <CheckCircle2 size={16}/> Entregar
               </button>
             )}
             {(order.status === 'Entregue') && (
               <button 
                 onClick={() => updateOrderStatus(order.originalOrders, 'Pagamento Pendente')}
                 className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded-xl font-medium text-sm transition-colors"
               >
                 Pagamento Pendente
               </button>
             )}
             {(order.status === 'Entregue' || order.status === 'Pagamento Pendente') && (
               <button 
                 onClick={() => updateOrderStatus(order.originalOrders, 'Pago')}
                 className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1"
               >
                 <CheckCircle2 size={16}/> Pago
               </button>
             )}
             {(order.status === 'Pago') && (
               <button 
                 onClick={() => updateOrderStatus(order.originalOrders, 'Finalizado')}
                 className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1"
               >
                 <CheckCircle2 size={16}/> Finalizar mesa
               </button>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminHistory({ orders, formatCurrency }) {
  // Group orders by date string
  const groupedByDate = orders.reduce((acc, order) => {
    const dateStr = new Date(order.timestamp).toLocaleDateString('pt-BR');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(order);
    return acc;
  }, {});

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/');
    const [dayB, monthB, yearB] = b.split('/');
    return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
  });

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <History className="mx-auto text-slate-300 mb-4" size={64} />
        <h3 className="text-xl font-bold text-slate-600">Nenhum histórico</h3>
        <p className="text-slate-500">O histórico de pedidos aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Histórico de Pedidos</h2>
      {sortedDates.map(date => (
        <div key={date} className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 border-b border-slate-200 pb-2">{date}</h3>
          <div className="grid gap-3">
            {groupedByDate[date].sort((a, b) => b.timestamp - a.timestamp).map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{order.customerName} <span className="text-orange-600 font-medium">({order.location})</span></h4>
                    <p className="text-xs text-slate-400">
                      {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • Status: {order.status}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600">{formatCurrency(order.total)}</span>
                </div>
                <div className="text-sm text-slate-600 border-t border-slate-50 pt-2 mt-1">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminMenu({ user, menuItems, showToast, formatCurrency }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: 'Bebidas' });

  // Group items by category for display
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleRestoreDefaults = async () => {
    const defaultItems = [
      { establishmentId: user.id, name: 'Isca de Peixe', description: 'Acompanha molho tártaro e limão', price: 65.0, category: 'Porções', available: true },
      { establishmentId: user.id, name: 'Camarão Alho e Óleo', description: 'Porção de 500g de camarão fresco', price: 85.0, category: 'Porções', available: true },
      { establishmentId: user.id, name: 'Batata Frita', description: 'Porção grande de batata frita crocante', price: 35.0, category: 'Porções', available: true },
      { establishmentId: user.id, name: 'Caipirinha de Limão', description: 'Cachaça, limão, açúcar e gelo', price: 25.0, category: 'Bebidas', available: true },
      { establishmentId: user.id, name: 'Cerveja Lata', description: 'Cerveja Pilsen 350ml gelada', price: 10.0, category: 'Bebidas', available: true },
      { establishmentId: user.id, name: 'Água de Coco', description: 'Coco gelado natural', price: 15.0, category: 'Bebidas', available: true },
      { establishmentId: user.id, name: 'Pastel de Camarão', description: 'Unidade de pastel frito na hora', price: 15.0, category: 'Porções', available: true },
      { establishmentId: user.id, name: 'Açaí na Tigela', description: 'Acompanha banana e granola (500ml)', price: 28.0, category: 'Sobremesas', available: true }
    ];
    
    try {
      await supabase.from('clickbeach_menu').insert(defaultItems);
      showToast("Cardápio padrão restaurado!");
    } catch (error) {
      showToast("Erro ao restaurar", "error");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return showToast("Preencha nome e preço", "error");

    try {
      if (editingId) {
        await supabase.from('clickbeach_menu').update({
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          category: newItem.category
        }).eq('id', editingId);
        showToast("Item atualizado com sucesso!");
      } else {
        await supabase.from('clickbeach_menu').insert([{
          establishmentId: user.id,
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          category: newItem.category,
          available: true
        }]);
        showToast("Item adicionado com sucesso!");
      }
      setIsAdding(false);
      setEditingId(null);
      setNewItem({ name: '', description: '', price: '', category: 'Bebidas' });
    } catch (error) {
      showToast(editingId ? "Erro ao atualizar item" : "Erro ao adicionar item", "error");
    }
  };

  const handleEdit = (item) => {
    setNewItem({ name: item.name, description: item.description || '', price: item.price, category: item.category });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    try {
      await supabase.from('clickbeach_menu').delete().eq('id', id);
      showToast("Item removido!");
    } catch (error) {
      showToast("Erro ao remover item", "error");
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      if (String(id).startsWith('m')) {
        const item = menuItems.find(i => i.id === id);
        const { id: memId, ...itemWithoutId } = item;
        await supabase.from('clickbeach_menu').insert([{
          ...itemWithoutId,
          available: !currentStatus
        }]);
      } else {
        await supabase.from('clickbeach_menu').update({
          available: !currentStatus
        }).eq('id', id);
      }
      showToast(currentStatus ? "Produto marcado como indisponível" : "Produto marcado como disponível");
    } catch (error) {
      showToast("Erro ao alterar disponibilidade", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Seu Cardápio</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleRestoreDefaults}
            className="bg-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-300 transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center"
          >
            Restaurar Padrões
          </button>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              if (isAdding) {
                setEditingId(null);
                setNewItem({ name: '', description: '', price: '', category: 'Bebidas' });
              }
            }}
            className="bg-orange-100 text-orange-600 p-2 rounded-xl hover:bg-orange-200 transition-colors flex items-center gap-1 font-medium"
          >
            {isAdding ? <X size={20} /> : <Plus size={20} />} <span className="hidden md:inline">{isAdding ? 'Cancelar' : 'Adicionar'}</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
            <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Caipirinha de Limão" required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="15.00" required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none">
                <option>Bebidas</option>
                <option>Porções</option>
                <option>Pratos</option>
                <option>Sobremesas</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (opcional)</label>
            <input type="text" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Feita com cachaça artesanal" />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors">
            {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
          </button>
        </form>
      )}

      <div>
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 border-b-2 border-orange-200 pb-2 mb-4 pl-2">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group">
                  <div>
                    <h3 className={`font-bold text-lg ${item.available === false ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.name}</h3>
                    {item.description && <p className="text-slate-500 text-sm mt-1">{item.description}</p>}
                    <p className={`${item.available === false ? 'text-slate-400' : 'text-emerald-600'} font-bold mt-2`}>{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button 
                      onClick={() => handleToggleAvailability(item.id, item.available !== false)}
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${item.available !== false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                      {item.available !== false ? 'Disponível' : 'Indisponível'}
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <Pencil size={20} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {menuItems.length === 0 && !isAdding && (
          <div className="text-center py-10 text-slate-500">
            Nenhum item cadastrado. Clique em Adicionar para começar!
          </div>
        )}
      </div>
    </div>
  );
}

function AdminQR({ user, showToast, setView, setClientEstId }) {
  // Creating a simulated URL that would open the client view.
  // In a real deployed app, it would be the exact domain.
  const baseUrl = window.location.href.split('?')[0];
  const clientLink = `${baseUrl}?kiosque=${user.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(clientLink)}&color=ea580c`;

  const copyLink = () => {
    try {
      // Create a temporary textarea to copy
      const el = document.createElement('textarea');
      el.value = clientLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast("Link copiado para a área de transferência!");
    } catch (err) {
      showToast("Erro ao copiar link.", "error");
    }
  };

  const handleSimulateClient = () => {
    setClientEstId(user.uid);
    setView('client');
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Seu QR Code</h2>
        <p className="text-slate-500 mb-8 text-sm">Imprima ou mostre este código para os clientes acessarem o seu cardápio na praia.</p>
        
        <div className="bg-orange-50 p-4 rounded-2xl inline-block shadow-inner mb-8 border border-orange-100">
          <img src={qrUrl} alt="QR Code do Estabelecimento" className="w-64 h-64 mix-blend-multiply" />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seu Código de Acesso Manual</p>
            <div className="bg-slate-100 px-4 py-3 rounded-xl font-mono text-lg text-slate-800 font-bold tracking-widest break-all">
              {user.id}
            </div>
          </div>
          
          <button 
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition-colors font-medium"
          >
            <Copy size={18} /> Copiar Link do Cardápio
          </button>

          <button 
            onClick={() => {
              setClientEstId(user.id);
              setView('client');
            }}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 rounded-xl hover:bg-cyan-700 transition-colors font-medium shadow-md"
          >
            <Menu size={18} /> Abrir Cardápio (Simular Cliente)
          </button>
        </div>
      </div>
    </div>
  );
}

// --- CLIENT VIEW ---
function ClientView({ clientEstId, menuItems, setView, showToast, formatCurrency }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Group items by category for display
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    showToast(`${item.name} adicionado!`);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : null;
      }
      return item;
    }).filter(Boolean)); // Remove nulls (quantity 0)
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-b-3xl shadow-md sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
               Cardápio Digital
            </h1>
            <p className="text-cyan-100 text-sm mt-1">Faça seu pedido direto da cadeira!</p>
          </div>
          <button onClick={() => setView('landing')} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Menu List */}
      <main className="max-w-xl mx-auto p-4 mt-4 space-y-8">
        {menuItems.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Info className="mx-auto mb-4 text-slate-300" size={48} />
            <p>Nenhum produto cadastrado neste quiosque no momento.</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-slate-800 border-b-2 border-orange-200 pb-2 mb-4 pl-2">
                {category}
              </h2>
              <div className="grid gap-4">
                {items.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <h3 className={`font-bold ${item.available === false ? 'text-slate-400' : 'text-slate-800'}`}>{item.name}</h3>
                      {item.description && <p className="text-slate-500 text-xs mt-1 line-clamp-2">{item.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <p className={`${item.available === false ? 'text-slate-400' : 'text-emerald-600'} font-bold`}>{formatCurrency(item.price)}</p>
                        {item.available === false && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">Indisponível</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={item.available === false}
                      className={`p-3 rounded-xl transition-all shadow-sm ${item.available === false ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white'}`}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating Cart Button */}
      {cartCount > 0 && !isCartOpen && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full shadow-xl hover:bg-orange-600 transition-transform hover:scale-105 flex items-center gap-3 z-40 animate-bounce-short"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
              {cartCount}
            </span>
          </div>
          <span className="font-bold">Ver Pedido</span>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <CartModal 
          cart={cart}
          cartTotal={cartTotal}
          close={() => setIsCartOpen(false)}
          updateQuantity={updateQuantity}
          clientEstId={clientEstId}
          setCart={setCart}
          showToast={showToast}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

function CartModal({ cart, cartTotal, close, updateQuantity, clientEstId, setCart, showToast, formatCurrency }) {
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName || !location || !phone) return showToast("Preencha seu nome, local e telefone.", "error");

    setIsSubmitting(true);
    try {
      await supabase.from('clickbeach_orders').insert([{
        establishmentId: clientEstId,
        customerName,
        location,
        phone,
        items: cart,
        total: cartTotal,
        status: 'Novo',
        timestamp: Date.now()
      }]);
      showToast("Pedido enviado com sucesso! Aguarde o preparo.");
      setCart([]);
      close();
    } catch (error) {
      showToast("Erro ao enviar pedido.", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-in">
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
            <ShoppingCart /> Seu Pedido
          </h2>
          <button onClick={close} className="p-2 text-slate-500 hover:bg-orange-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">Carrinho vazio</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex-1 pr-2">
                  <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                  <p className="text-emerald-600 font-medium text-sm">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white rounded-lg shadow-sm">-</button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white rounded-lg shadow-sm">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6 text-lg">
              <span className="font-semibold text-slate-600">Total a pagar:</span>
              <span className="font-extrabold text-2xl text-slate-800">{formatCurrency(cartTotal)}</span>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Seu Nome" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" 
                  required
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Número da Mesa ou Guarda-sol" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" 
                  required
                />
              </div>
              <div>
                <input 
                  type="tel" 
                  placeholder="Seu Telefone (WhatsApp)" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" 
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}
              </button>
            </form>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}