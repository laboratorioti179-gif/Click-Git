import React, { useState, useEffect, useMemo } from 'react';
import { 
    Lock, User, LogOut, Receipt, QrCode, UtensilsCrossed, 
    TrendingUp, Settings, Plus, Minus, ShoppingCart, 
    X, ArrowLeft, Download, Send, Search, 
    PieChart as PieChartIcon, BarChart3, ChevronLeft, ChevronRight, Save, MapPin, Store, Phone, Mail, Link as LinkIcon,
    ImagePlus, Trash2, Play, CheckCircle, DollarSign, Check, AlertCircle, BellRing, Camera
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const supabaseUrl = 'https://immwiliotzbuejxffzyl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbXdpbGlvdHpidWVqeGZmenlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTg4MzYsImV4cCI6MjA5NDI5NDgzNn0.XbvSGwkG_MkL9rHF9dxopaJJODAm1HUp27kvbNr60YI';

const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

const formatPrice = (price) => Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTUwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzEyMTIxMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iYXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNjNGE0N2MiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNFTSBGT1RPPC90ZXh0Pjwvc3ZnPg==';

const LoginScreen = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [restaurantName, setRestaurantName] = useState('');
    const [address, setAddress] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [cpf, setCpf] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isResettingPassword) {
            if (!email) {
                setError('Preencha seu e-mail para recuperar a senha.');
                return;
            }
            try {
                const res = await fetch(`${supabaseUrl}/auth/v1/recover`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email.trim() })
                });
                if (res.ok) {
                    setError('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
                    setIsResettingPassword(false);
                } else {
                    const data = await res.json().catch(() => ({}));
                    setError(data.msg || data.message || 'Erro ao enviar e-mail de recuperação.');
                }
            } catch (e) {
                setError('Erro de conexão ao recuperar senha.');
            }
            return;
        }
        if (isRegistering) {
            if (email && password && restaurantName && address && ownerName && cpf && confirmPassword) {
                if (password !== confirmPassword) {
                    setError('As senhas não coincidem.');
                    return;
                }
                try {
                    const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
                        method: 'POST',
                        headers: {
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            email, 
                            password,
                            data: {
                                restaurantName,
                                address,
                                ownerName,
                                cpf
                            }
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        setError(data.msg || data.message || 'Erro ao criar conta. Verifique os dados informados.');
                    } else {
                        setError('');
                        localStorage.setItem('userMetadata', JSON.stringify(data.user?.user_metadata || { restaurantName, address, ownerName, cpf }));
                        localStorage.setItem('userEmail', data.user?.email || email.trim());
                        onLogin(data.user?.id || '00000000-0000-0000-0000-000000000000');
                    }
                } catch (e) {
                    setError('Erro de conexão ao criar conta.');
                }
            } else {
                setError('Preencha todos os campos para criar a conta.');
            }
            return;
        }
        
        try {
            const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim(), password })
            });
            if (res.ok) {
                const data = await res.json();
                setError('');
                localStorage.setItem('userMetadata', JSON.stringify(data.user?.user_metadata || {}));
                localStorage.setItem('userEmail', data.user?.email || email.trim());
                onLogin(data.user?.id || '00000000-0000-0000-0000-000000000000');
            } else {
                if (email === 'admin' && password === 'admin123') {
                    setError('');
                    localStorage.setItem('userMetadata', JSON.stringify({}));
                    localStorage.setItem('userEmail', 'admin@namesa.app');
                    onLogin('00000000-0000-0000-0000-000000000000');
                } else {
                    setError('E-mail ou senha incorretos.');
                }
            }
        } catch (e) {
            if (email === 'admin' && password === 'admin123') {
                setError('');
                localStorage.setItem('userMetadata', JSON.stringify({}));
                localStorage.setItem('userEmail', 'admin@namesa.app');
                onLogin('00000000-0000-0000-0000-000000000000');
            } else {
                setError('Erro ao conectar com o servidor.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a0a]">
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop" 
                    alt="Bar background" 
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/50 via-[#121212]/80 to-[#121212]"></div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 bg-[#1e1e1e]/90 backdrop-blur-md p-8 rounded-2xl w-full max-w-md border border-[#2a2a2a] shadow-2xl animate-in fade-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#c4a47c]/50 to-transparent"></div>
                
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif text-[#c4a47c] mb-2 tracking-wide">NaMesa</h1>
                    <p className="text-[#a0a0a0] text-xs uppercase tracking-[0.2em]">{isResettingPassword ? 'Recuperar Senha' : (isRegistering ? 'Criar Nova Conta' : 'Acesso Restrito')}</p>
                </div>

                {error && (
                    <div className="bg-[#8b0000]/20 border border-[#8b0000] text-[#f5f5f5] p-3 rounded-lg mb-6 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                        <AlertCircle className="text-[#8b0000]" size={16} /> {error}
                    </div>
                )}

                <div className="space-y-4">
                    {!isResettingPassword && isRegistering && (
                        <>
                            <div>
                                <label className="block mb-2 text-sm text-[#a0a0a0]">Nome do Restaurante</label>
                                <div className="relative group">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] group-focus-within:text-[#c4a47c] transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={restaurantName} 
                                        onChange={(e) => setRestaurantName(e.target.value)}
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-[#f5f5f5] outline-none focus:border-[#c4a47c] focus:ring-1 focus:ring-[#c4a47c] transition-all" 
                                        placeholder="Nome do Restaurante"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm text-[#a0a0a0]">Endereço</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] group-focus-within:text-[#c4a47c] transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={address} 
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-[#f5f5f5] outline-none focus:border-[#c4a47c] focus:ring-1 focus:ring-[#c4a47c] transition-all" 
                                        placeholder="Endereço completo"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm text-[#a0a0a0]">Nome do proprietário</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] group-focus-within:text-[#c4a47c] transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={ownerName} 
                                        onChange={(e) => setOwnerName(e.target.value)}
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-[#f5f5f5] outline-none focus:border-[#c4a47c] focus:ring-1 focus:ring-[#c4a47c] transition-all" 
                                        placeholder="Nome do proprietário"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm text-[#a0a0a0]">CPF</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] group-focus-within:text-[#c4a47c] transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={cpf} 
                                        onChange={(e) => setCpf(e.target.value)}
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-[#f5f5f5] outline-none focus:border-[#c4a47c] focus:ring-1 focus:ring-[#c4a47c] transition-all" 
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block mb-2 text-sm text-[#a0a0a0]">E-mail</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] group-focus-within:text-[#c4a47c] transition-colors" size={18} />
                            <input 
                                type="text" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-[#f5f5f5] outline-none focus:border-[#c4a47c] focus:ring-1 focus:ring-[#c4a47c] transition-all" 
                                placeholder="Digite seu e-mail"
                            />
                        </div>
                    </div>
                    {!isResettingPassword && (
                        <>
                            <div>
                                <label className="block mb-2 text-sm text-[#a0a0a0]">Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] group-focus-within:text-[#c4a47c] transition-colors" size={18} />
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-[#f5f5f5] outline-none focus:border-[#c4a47c] focus:ring-1 focus:ring-[#c4a47c] transition-all" 
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            {isRegistering && (
                                <div>
                                    <label className="block mb-2 text-sm text-[#a0a0a0]">Confirmação de senha</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] group-focus-within:text-[#c4a47c] transition-colors" size={18} />
                                        <input 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-[#f5f5f5] outline-none focus:border-[#c4a47c] focus:ring-1 focus:ring-[#c4a47c] transition-all" 
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-[#c4a47c] to-[#d4b48c] hover:from-[#d4b48c] hover:to-[#c4a47c] text-[#121212] font-bold py-3.5 rounded-xl transition-all mt-8 shadow-[0_0_15px_rgba(196,164,124,0.2)] hover:shadow-[0_0_25px_rgba(196,164,124,0.4)] active:scale-[0.98]">
                    {isResettingPassword ? 'Enviar E-mail' : (isRegistering ? 'Criar Conta' : 'Entrar no Sistema')}
                </button>

                <div className="mt-4 text-center flex flex-col gap-3">
                    <button 
                        type="button" 
                        onClick={() => { 
                            if (isResettingPassword) {
                                setIsResettingPassword(false);
                            } else {
                                setIsRegistering(!isRegistering); 
                            }
                            setError(''); 
                        }} 
                        className="text-xs text-[#c4a47c] hover:text-[#d4b48c] transition-colors font-medium"
                    >
                        {isResettingPassword ? 'Voltar ao login' : (isRegistering ? 'Já tenho uma conta. Fazer login' : 'Não tem uma conta? Criar conta')}
                    </button>
                    {!isRegistering && !isResettingPassword && (
                        <button 
                            type="button" 
                            onClick={() => { setIsResettingPassword(true); setError(''); }} 
                            className="text-xs text-[#a0a0a0] hover:text-[#f5f5f5] transition-colors"
                        >
                            Esqueci minha senha
                        </button>
                    )}
                </div>

                <div className="mt-6 text-center text-xs text-[#a0a0a0] border-t border-[#2a2a2a] pt-4">
                    Credenciais de teste:<br/>Usuário: <span className="text-[#f5f5f5]">admin</span> / Senha: <span className="text-[#f5f5f5]">admin123</span>
                </div>
            </form>
        </div>
    );
};

const PedidosList = ({ pedidos, onUpdateStatus, onClearHistory }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'pendente': 
                return { label: 'Preparar', color: 'text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-white', icon: <Play size={16} />, next: 'preparo' };
            case 'preparo': 
                return { label: 'Entregar', color: 'text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white', icon: <CheckCircle size={16} />, next: 'entrega' };
            case 'entrega': 
                return { label: 'Pagar', color: 'text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white', icon: <DollarSign size={16} />, next: 'concluido' };
            case 'cancelado':
                return { label: 'Recusado', color: 'text-red-500 border-red-500/30 cursor-not-allowed opacity-50', icon: <X size={16} />, next: null };
            default: 
                return { label: 'Concluído', color: 'text-zinc-500 border-zinc-700 cursor-not-allowed opacity-50', icon: <Check size={16} />, next: null };
        }
    };

    const groupedPedidos = useMemo(() => {
        return pedidos.reduce((groups, pedido) => {
            const date = new Date(pedido.created_at || Date.now()).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(pedido);
            return groups;
        }, {});
    }, [pedidos]);

    return (
        <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-[#f5f5f5]">Pedidos em Tempo Real</h2>
                <button 
                    onClick={onClearHistory}
                    className="text-xs font-medium text-[#a0a0a0] hover:text-red-500 flex items-center gap-2 transition-colors border border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:border-red-500/30"
                >
                    <Trash2 size={14} /> Limpar Concluídos/Recusados
                </button>
            </div>
            
            {pedidos.length === 0 ? (
                <div className="text-center py-16 text-[#a0a0a0] bg-[#1e1e1e] rounded-xl border border-[#2a2a2a] shadow-inner">
                    <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido novo.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {Object.entries(groupedPedidos).map(([date, items]) => (
                        <div key={date} className="animate-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-4 mb-6">
                                <h3 className="text-[#c4a47c] font-serif text-lg whitespace-nowrap">{date}</h3>
                                <div className="h-[1px] w-full bg-gradient-to-r from-[#2a2a2a] to-transparent"></div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {items.map(p => {
                                    const config = getStatusConfig(p.status);
                                    return (
                                        <div key={p.id} className="bg-[#1e1e1e] border-t-4 border-[#c4a47c] rounded-xl p-5 shadow-lg shadow-[#c4a47c]/5 animate-in slide-in-from-bottom-4 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#2a2a2a]">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-[#c4a47c] text-[#121212] text-xs font-bold px-2 py-1 rounded">MESA {p.table || p.mesa}</span>
                                                        <span className="text-[#c4a47c] font-mono font-bold tracking-tighter">{p.orderNumber}</span>
                                                    </div>
                                                    <p className="text-[#a0a0a0] text-sm">{p.customerName || p.nome_cliente}</p>
                                                </div>
                                                <span className="text-[#a0a0a0] text-xs bg-[#121212] px-2 py-1 rounded">{p.time}</span>
                                            </div>
                                            <div className="space-y-3 mb-5">
                                                {p.items && p.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm items-center">
                                                        <span className="text-[#f5f5f5]"><span className="text-[#c4a47c] font-bold mr-2">{item.quantity}x</span> {item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-[#2a2a2a]">
                                                <span className="text-[#f5f5f5] font-medium text-sm">Total</span>
                                                <span className="text-[#c4a47c] font-bold text-lg">{formatPrice(p.total)}</span>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                {p.status === 'pendente' && (
                                                    <button 
                                                        onClick={() => onUpdateStatus(p.id, 'cancelado')}
                                                        className="flex-1 bg-[#121212] border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 transform active:scale-95"
                                                    >
                                                        <X size={16} /> Recusar
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => onUpdateStatus(p.id, config.next)}
                                                    disabled={!config.next}
                                                    className={`${p.status === 'pendente' ? 'flex-1' : 'w-full'} bg-[#121212] border flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 transform active:scale-95 ${config.color}`}
                                                >
                                                    {config.icon}
                                                    {config.label}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ItemCard = ({ item, onAdd }) => (
    <div className="bg-[#121212] border border-[#2a2a2a] rounded-lg mb-4 overflow-hidden shadow-lg">
        <img 
            src={item.image || fallbackImage} 
            alt={item.name} 
            onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
            className="w-full h-40 object-cover" 
        />
        <div className="p-4 flex justify-between items-center gap-4">
            <div className="flex-1">
                <h3 className="font-semibold text-[#f5f5f5]">{item.name}</h3>
                <p className="text-xs text-[#a0a0a0] mt-1 line-clamp-2">{item.description}</p>
                <p className="font-medium text-[#c4a47c] mt-1">{formatPrice(item.price)}</p>
            </div>
            <button onClick={() => onAdd(item)} className="bg-[#1e1e1e] text-[#c4a47c] hover:bg-[#c4a47c] hover:text-[#121212] p-2.5 rounded-full border border-[#2a2a2a] transition-colors shrink-0">
                <Plus size={20} />
            </button>
        </div>
    </div>
);

const SimuladorCliente = ({ onBack, onAddPedido, menuData, userId }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(menuData[0]?.category || '');
    const [nomeCliente, setNomeCliente] = useState('');
    const [mesaCliente, setMesaCliente] = useState('');

    useEffect(() => {
        if (menuData.length > 0 && !activeCategory) {
            setActiveCategory(menuData[0].category);
        }
    }, [menuData]);

    const addToCart = (item) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const handleCheckout = async () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        try {
            const resExistente = await fetch(`${supabaseUrl}/rest/v1/pedidos?mesa=eq.${mesaCliente}&status=neq.cancelado&user_id=eq.${userId}&order=created_at.desc&limit=1`, {
                headers: supabaseHeaders
            });
            const dadosExistentes = await resExistente.json();
            const pedidoExistente = dadosExistentes && dadosExistentes.length > 0 ? dadosExistentes[0] : null;

            let pedidoId;
            let finalOrderNumber;
            let novoTotalCalculado = total;

            if (pedidoExistente) {
                pedidoId = pedidoExistente.id;
                finalOrderNumber = `#${String(pedidoId).padStart(2, '0')}`;
                novoTotalCalculado = total;

                await fetch(`${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}&user_id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: supabaseHeaders,
                    body: JSON.stringify({
                        status: 'pendente',
                        total: novoTotalCalculado
                    })
                });
            } else {
                const resPedido = await fetch(`${supabaseUrl}/rest/v1/pedidos`, {
                    method: 'POST',
                    headers: supabaseHeaders,
                    body: JSON.stringify({
                        mesa: mesaCliente,
                        nome_cliente: nomeCliente,
                        total: total,
                        status: 'pendente',
                        user_id: userId
                    })
                });

                if (resPedido.ok) {
                    const data = await resPedido.json();
                    pedidoId = data[0]?.id;
                    finalOrderNumber = `#${String(pedidoId).padStart(2, '0')}`;
                }
            }

            if (pedidoId) {
                await fetch(`${supabaseUrl}/rest/v1/itens_pedido`, {
                    method: 'POST',
                    headers: supabaseHeaders,
                    body: JSON.stringify(cart.map(item => ({
                        pedido_id: pedidoId,
                        item_id: item.id,
                        nome_item_historico: item.name,
                        quantidade: item.quantity,
                        preco_unitario: item.price,
                        subtotal: item.price * item.quantity,
                        user_id: userId
                    })))
                });

                const novoPedidoLocal = {
                    id: pedidoId,
                    orderNumber: finalOrderNumber,
                    table: mesaCliente,
                    customerName: pedidoExistente ? pedidoExistente.nome_cliente : nomeCliente,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    status: 'pendente',
                    items: [...cart],
                    total: novoTotalCalculado
                };
                
                onAddPedido(novoPedidoLocal);
            }
            
            setCart([]);
            setIsCartOpen(false);
            setNomeCliente('');
            setMesaCliente('');
            onBack();
        } catch (e) {
            console.error("Erro ao processar comanda", e);
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const isCheckoutValid = nomeCliente.trim() !== '' && mesaCliente.trim() !== '';

    return (
        <div className="w-full h-full bg-[#121212] border-l border-[#2a2a2a] relative flex flex-col animate-in slide-in-from-right">
            <header className="bg-[#1e1e1e] p-4 border-b border-[#2a2a2a] flex justify-between items-center z-10">
                <button onClick={onBack} className="text-[#c4a47c] p-2 hover:bg-[#2a2a2a] rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="font-serif text-lg text-[#f5f5f5] flex-1 text-center pr-8">Cardápio NaMesa</h2>
            </header>

            <div className="flex overflow-x-auto gap-2 p-3 bg-[#1e1e1e] border-b border-[#2a2a2a] shrink-0 no-scrollbar">
                {menuData.map(cat => (
                    <button
                        key={cat.categoryId}
                        onClick={() => setActiveCategory(cat.category)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition-colors ${activeCategory === cat.category ? 'bg-[#c4a47c] text-[#121212] font-bold' : 'bg-[#121212] text-[#a0a0a0] border border-[#2a2a2a]'}`}
                    >
                        {cat.category}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {menuData.map(category => (
                    <div key={category.categoryId} className={activeCategory === category.category ? 'block' : 'hidden'}>
                        {category.items.map(item => (
                            <ItemCard key={item.id} item={item} onAdd={addToCart} />
                        ))}
                    </div>
                ))}
            </div>

            {cartCount > 0 && !isCartOpen && (
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 sm:pb-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent animate-in slide-in-from-bottom">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-[#c4a47c] hover:bg-[#d4b48c] text-[#121212] rounded-xl p-4 flex justify-between items-center font-bold shadow-[0_0_20px_rgba(196,164,124,0.3)] transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={20} />
                            <span>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
                        </div>
                        <span>{formatPrice(cartTotal)}</span>
                    </button>
                </div>
            )}

            {isCartOpen && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col justify-end">
                    <div className="bg-[#1e1e1e] w-full h-[85%] rounded-t-2xl flex flex-col border-t border-[#2a2a2a] animate-in slide-in-from-bottom">
                        <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#c4a47c]">Seu Carrinho</h3>
                            <button onClick={() => setIsCartOpen(false)} className="text-[#a0a0a0] p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="p-4 space-y-4 border-b border-[#2a2a2a]">
                            <div>
                                <label className="block text-sm text-[#a0a0a0] mb-1">Nome</label>
                                <input type="text" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} className="w-full bg-[#121212] border border-[#2a2a2a] rounded-lg p-2.5 text-[#f5f5f5] outline-none focus:border-[#c4a47c]" placeholder="Ex: João Silva" />
                            </div>
                            <div>
                                <label className="block text-sm text-[#a0a0a0] mb-1">Número da Mesa</label>
                                <select 
                                    value={mesaCliente} 
                                    onChange={e => setMesaCliente(e.target.value)} 
                                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-lg p-2.5 text-[#f5f5f5] outline-none focus:border-[#c4a47c]"
                                >
                                    <option value="">Selecione a mesa</option>
                                    {Array.from({ length: 100 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>Mesa {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center mb-4 bg-[#121212] p-3 rounded-lg border border-[#2a2a2a]">
                                    <div>
                                        <p className="font-medium text-[#f5f5f5] text-sm">{item.name}</p>
                                        <p className="text-[#c4a47c] text-xs">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-[#1e1e1e] rounded-full border border-[#2a2a2a] px-2 py-1">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="text-[#a0a0a0] hover:text-[#f5f5f5]"><Minus size={14} /></button>
                                        <span className="text-sm w-4 text-center font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="text-[#c4a47c] hover:text-[#d4b48c]"><Plus size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 pb-8 sm:pb-4 bg-[#121212] border-t border-[#2a2a2a]">
                            <div className="flex justify-between items-center mb-4 text-[#f5f5f5]">
                                <span>Total do Pedido</span>
                                <span className="font-bold text-xl text-[#c4a47c]">{formatPrice(cartTotal)}</span>
                            </div>
                            <button 
                                onClick={handleCheckout}
                                disabled={!isCheckoutValid}
                                className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isCheckoutValid ? 'bg-[#c4a47c] text-[#121212] hover:bg-[#d4b48c]' : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'}`}
                            >
                                Enviar Pedido <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const QRCodeGenerator = ({ onSimulate, menuData, onAddPedido, userId }) => {
    const [restaurantName, setRestaurantName] = useState('NaMesa');
    const [inputUrl, setInputUrl] = useState(window.location.origin + window.location.pathname);
    const [isSimuladorOpen, setIsSimuladorOpen] = useState(false);

    useEffect(() => {
        try {
            const meta = JSON.parse(localStorage.getItem('userMetadata') || '{}');
            if (meta.restaurantName) setRestaurantName(meta.restaurantName);
        } catch (e) {}
    }, []);

    const handleDownload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400; canvas.height = 450;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000'; ctx.font = '32px "Berkshire Swash", cursive'; ctx.textAlign = 'center'; ctx.fillText(restaurantName, canvas.width / 2, 60);
        ctx.font = '16px "Inter", sans-serif'; ctx.fillStyle = '#333333'; ctx.fillText("Peça sem sair da mesa!", canvas.width / 2, 90);

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const baseUrl = inputUrl.trim().replace(/\/$/, '');
        const clientLink = `${baseUrl}?kiosque=${userId}`;
        const qrData = encodeURIComponent(clientLink);
        
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}&color=ea580c`;
        
        img.onload = () => {
            ctx.drawImage(img, (canvas.width - 250) / 2, 120, 250, 250);

            const downloadPdf = () => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save('qrcode-namesa.pdf');
            };

            if (window.jspdf) {
                downloadPdf();
            } else {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = downloadPdf;
                document.head.appendChild(script);
            }
        };
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2a2a2a] pb-6">
                <div>
                    <h2 className="text-xl font-serif text-[#f5f5f5]">Gerador de QR Code</h2>
                    <p className="text-[#a0a0a0] text-sm">Crie o QR Code único para os clientes acessarem o cardápio.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsSimuladorOpen(true)} className="flex-1 sm:flex-none border border-[#c4a47c] text-[#c4a47c] px-4 py-2 rounded-lg font-medium hover:bg-[#c4a47c]/10 transition flex justify-center items-center">
                        Simular Cliente
                    </button>
                    <button onClick={handleDownload} className="flex-1 sm:flex-none bg-[#c4a47c] text-[#121212] px-4 py-2 rounded-lg font-medium hover:bg-[#d4b48c] transition flex items-center justify-center gap-2">
                        <Download size={20} /> Baixar PDF
                    </button>
                </div>
            </div>

            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-[#2a2a2a] mb-6">
                <label className="block text-sm text-[#a0a0a0] mb-2">Link do seu Cardápio Digital</label>
                <input 
                    type="text" 
                    value={inputUrl} 
                    onChange={(e) => setInputUrl(e.target.value)} 
                    className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#c4a47c] transition-colors" 
                    placeholder="Link base" 
                />
                <p className="text-[10px] text-zinc-500 mt-2 italic">* O sistema anexará automaticamente o seu ID ao final deste link usando ?kiosque=.</p>
            </div>
            
            <div className="flex justify-center py-8">
                <div className="bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 w-full max-w-[400px] h-[450px] relative border border-[#2a2a2a] overflow-hidden">
                    <h1 className="text-black text-[32px] mt-2 mb-2 text-center w-full truncate px-4" style={{ fontFamily: "'Berkshire Swash', cursive" }}>{restaurantName}</h1>
                    <p className="text-[#333333] text-[16px] mb-8">Peça sem sair da mesa!</p>
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inputUrl.trim().replace(/\/$/, '') + '?kiosque=' + userId)}&color=ea580c`} 
                        alt="QR Code" 
                        className="w-[250px] h-[250px]" 
                    />
                </div>
            </div>
            
            {isSimuladorOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm transition-opacity">
                    <div className="w-full sm:w-[400px] h-full relative">
                        <SimuladorCliente onBack={() => setIsSimuladorOpen(false)} onAddPedido={onAddPedido} menuData={menuData} userId={userId} />
                    </div>
                </div>
            )}
        </div>
    );
};

const CardapioEditor = ({ menuData, setMenuData, userId }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemImage, setNewItemImage] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleImageFile = (e, setter) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    setter(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleItemChange = (categoryIndex, itemIndex, field, value) => {
        const newData = [...menuData];
        newData[categoryIndex] = { ...newData[categoryIndex] };
        newData[categoryIndex].items = [...newData[categoryIndex].items];
        newData[categoryIndex].items[itemIndex] = { ...newData[categoryIndex].items[itemIndex], [field]: value };
        setMenuData(newData);
    };

    const handleDeleteItem = async (categoryIndex, itemIndex, itemId) => {
        try {
            await fetch(`${supabaseUrl}/rest/v1/itens_cardapio?id=eq.${itemId}&user_id=eq.${userId}`, {
                method: 'DELETE',
                headers: supabaseHeaders
            });
            const newData = [...menuData];
            newData[categoryIndex].items.splice(itemIndex, 1);
            setMenuData(newData);
        } catch (e) { console.error("Erro ao excluir", e); }
    };

    const handleSaveMenu = async () => {
        try {
            const itemsToUpdate = [];
            menuData.forEach(cat => cat.items.forEach(item => itemsToUpdate.push(item)));
            for (const item of itemsToUpdate) {
                await fetch(`${supabaseUrl}/rest/v1/itens_cardapio?id=eq.${item.id}&user_id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: supabaseHeaders,
                    body: JSON.stringify({
                        nome: item.name,
                        descricao: item.description,
                        preco: parseFloat(item.price) || 0,
                        imagem_url: item.image ? item.image.trim() : ''
                    })
                });
            }
            setIsSaved(true);
        } catch (e) { console.error("Erro ao salvar", e); }
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleAddNewItem = async () => {
        if (!newItemName || !selectedCategoryId) return;
        setIsAdding(true);
        try {
            const finalImage = newItemImage && newItemImage.trim() !== '' 
                ? newItemImage.trim() 
                : fallbackImage;
            
            const res = await fetch(`${supabaseUrl}/rest/v1/itens_cardapio`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify({
                    categoria_id: parseInt(selectedCategoryId),
                    nome: newItemName,
                    descricao: newItemDesc,
                    preco: parseFloat(newItemPrice) || 0,
                    imagem_url: finalImage,
                    user_id: userId
                })
            });
            
            if (res.ok) {
                 const newData = [...menuData];
                 const catIndex = newData.findIndex(c => c.categoryId === parseInt(selectedCategoryId));
                 const created = await res.json();
                 if (catIndex >= 0 && created && created.length > 0) {
                     newData[catIndex].items.push({
                         id: created[0].id,
                         name: created[0].nome,
                         description: created[0].descricao,
                         price: created[0].preco,
                         image: created[0].imagem_url
                     });
                     setMenuData(newData);
                 }
                 setNewItemName(''); setNewItemDesc(''); setNewItemPrice(''); setNewItemImage('');
            }
        } catch (e) { console.error(e); }
        setIsAdding(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-[#2a2a2a] pb-6">
                <div>
                    <h2 className="text-xl font-serif text-[#f5f5f5]">Cardápio</h2>
                    <p className="text-[#a0a0a0] text-sm">Gerencie os itens e preços do seu menu.</p>
                </div>
                <button onClick={handleSaveMenu} className="bg-[#c4a47c] text-[#121212] px-6 py-2.5 rounded-lg font-bold hover:bg-[#d4b48c] flex items-center gap-2">
                    <Save size={20} />
                    {isSaved ? "Salvo!" : "Salvar Alterações"}
                </button>
            </div>

            {menuData.map((category, cIdx) => (
                <div key={category.categoryId} className="bg-[#1e1e1e] p-5 rounded-xl border border-[#2a2a2a] shadow-lg">
                    <h3 className="text-lg font-bold text-[#c4a47c] mb-4">{category.category}</h3>
                    <div className="space-y-4">
                        {category.items.map((item, iIdx) => (
                            <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#121212] p-4 rounded-lg border border-[#2a2a2a]">
                                <img 
                                    src={item.image || fallbackImage} 
                                    alt={item.name} 
                                    onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                                    className="w-24 h-16 rounded-md object-cover border border-[#2a2a2a]" 
                                />
                                <div className="flex-1 w-full space-y-2">
                                    <input type="text" value={item.name} onChange={(e) => handleItemChange(cIdx, iIdx, 'name', e.target.value)} className="w-full bg-transparent border-b border-[#2a2a2a] text-[#f5f5f5] font-semibold focus:outline-none focus:border-[#c4a47c] px-1" />
                                    <input type="text" value={item.description} onChange={(e) => handleItemChange(cIdx, iIdx, 'description', e.target.value)} className="w-full bg-transparent border-b border-[#2a2a2a] text-[#a0a0a0] text-sm focus:outline-none focus:border-[#c4a47c] px-1" />
                                    <div className="flex items-center gap-2 w-full border-b border-[#2a2a2a] pb-1 px-1">
                                        <input type="text" value={item.image} onChange={(e) => handleItemChange(cIdx, iIdx, 'image', e.target.value)} className="w-full bg-transparent text-[#a0a0a0] text-sm focus:outline-none focus:border-[#c4a47c]" placeholder="Link da Foto" />
                                        <label className="cursor-pointer text-[#a0a0a0] hover:text-[#c4a47c]" title="Carregar Foto">
                                            <ImagePlus size={16} />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageFile(e, (val) => handleItemChange(cIdx, iIdx, 'image', val))} />
                                        </label>
                                        <label className="cursor-pointer text-[#a0a0a0] hover:text-[#c4a47c]" title="Tirar Foto com a Câmera">
                                            <Camera size={16} />
                                            <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageFile(e, (val) => handleItemChange(cIdx, iIdx, 'image', val))} />
                                        </label>
                                    </div>
                                </div>
                                <div className="w-full sm:w-24">
                                    <input type="number" value={item.price} onChange={(e) => handleItemChange(cIdx, iIdx, 'price', e.target.value)} className="w-full bg-transparent border-b border-[#2a2a2a] text-[#c4a47c] p-2 focus:outline-none focus:border-[#c4a47c]" />
                                </div>
                                <button onClick={() => handleDeleteItem(cIdx, iIdx, item.id)} className="p-2 text-[#a0a0a0] hover:text-[#8b0000]"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#2a2a2a] mt-6">
                <h3 className="text-lg font-bold text-[#c4a47c] mb-4">Adicionar Novo Item</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-2">
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer bg-[#121212] border border-[#2a2a2a] rounded-lg py-2 flex justify-center items-center gap-2 text-[#a0a0a0] hover:text-[#c4a47c] transition-colors text-xs font-medium">
                                <ImagePlus size={14} /> Carregar Foto
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageFile(e, setNewItemImage)} />
                            </label>
                            <label className="flex-1 cursor-pointer bg-[#121212] border border-[#2a2a2a] rounded-lg py-2 flex justify-center items-center gap-2 text-[#a0a0a0] hover:text-[#c4a47c] transition-colors text-xs font-medium">
                                <Camera size={14} /> Tirar Foto
                                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageFile(e, setNewItemImage)} />
                            </label>
                        </div>
                        <input type="text" value={newItemImage} onChange={e => setNewItemImage(e.target.value)} placeholder="Ou cole o Link da Foto" className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] p-2.5 rounded-lg text-sm" />
                    </div>
                    <div className="flex-1 w-full">
                        <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] p-2.5 rounded-lg">
                            <option value="">Categoria...</option>
                            {menuData.map(cat => <option key={cat.categoryId} value={cat.categoryId}>{cat.category}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Nome" className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] p-2.5 rounded-lg" />
                    </div>
                    <div className="flex-1 w-full">
                        <input type="text" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Descrição" className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] p-2.5 rounded-lg" />
                    </div>
                    <div className="w-full sm:w-24">
                        <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" className="w-full bg-[#121212] border border-[#2a2a2a] text-[#c4a47c] p-2.5 rounded-lg" />
                    </div>
                    <button onClick={handleAddNewItem} disabled={isAdding || !newItemName || !selectedCategoryId} className="bg-[#c4a47c] text-[#121212] px-6 py-2.5 rounded-lg font-bold hover:bg-[#d4b48c] disabled:opacity-50">{isAdding ? '...' : 'Adicionar'}</button>
                </div>
            </div>
        </div>
    );
};

const Financeiro = ({ userId }) => {
    const [despesas, setDespesas] = useState([]);
    const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
    const [filtroDia, setFiltroDia] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newExp, setNewExp] = useState({ nome: '', valor: '', categoria: 'Operacional', metodo: 'PIX' });

    useEffect(() => {
        const fetchDespesas = async () => {
            try {
                const res = await fetch(`${supabaseUrl}/rest/v1/despesas?user_id=eq.${userId}&select=*&order=data_despesa.desc`, { headers: supabaseHeaders });
                const data = await res.json();
                setDespesas(data || []);
            } catch (e) { console.error(e); }
        };
        fetchDespesas();
    }, [userId]);

    const handleAddExp = async () => {
        if (!newExp.nome || !newExp.valor) return;
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/despesas`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify({
                    nome: newExp.nome,
                    valor: parseFloat(newExp.valor),
                    categoria: newExp.categoria,
                    metodo_pagamento: newExp.metodo,
                    data_despesa: new Date().toISOString().split('T')[0],
                    user_id: userId
                })
            });
            if (res.ok) {
                const created = await res.json();
                setDespesas([created[0], ...despesas]);
                setNewExp({ nome: '', valor: '', categoria: 'Operacional', metodo: 'PIX' });
                setIsAdding(false);
            }
        } catch (e) { console.error(e); }
    };

    const meses = [
        { v: 1, n: "Jan" }, { v: 2, n: "Fev" }, { v: 3, n: "Mar" }, { v: 4, n: "Abr" },
        { v: 5, n: "Mai" }, { v: 6, n: "Jun" }, { v: 7, n: "Jul" }, { v: 8, n: "Ago" },
        { v: 9, n: "Set" }, { v: 10, n: "Out" }, { v: 11, n: "Nov" }, { v: 12, n: "Dez" }
    ];

    const filtradas = despesas.filter(d => {
        const data = new Date(d.data_despesa);
        const mesMatch = (data.getUTCMonth() + 1) === Number(filtroMes);
        const diaMatch = filtroDia === '' || data.getUTCDate() === Number(filtroDia);
        const searchMatch = d.nome.toLowerCase().includes(searchTerm.toLowerCase());
        return mesMatch && diaMatch && searchMatch;
    });

    const totalGasto = filtradas.reduce((sum, item) => sum + Number(item.valor), 0);
    const categoriasAgrupadas = filtradas.reduce((acc, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + Number(curr.valor);
        return acc;
    }, {});
    const dataPie = Object.keys(categoriasAgrupadas).map(cat => ({ name: cat, value: categoriasAgrupadas[cat] }));
    const cores = ['#c4a47c', '#8b949e', '#58a6ff', '#8b0000', '#2ea043'];

    const categoryColorMap = {
        'Lanches': '#c4a47c',    // Dourado
        'Pratos': '#8b949e',     // Cinza Chumbo
        'Diversão': '#58a6ff',   // Azul
        'Outros': '#d4b48c',     // Dourado Claro
        'Insumos': '#8b0000',    // Vermelho Escuro
        'Operacional': '#2ea043',// Verde
        'Venda': '#c4a47c'       // Dourado (Receitas)
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#2a2a2a] pb-6">
                <div>
                    <h2 className="text-xl font-serif text-[#f5f5f5]">Financeiro</h2>
                    <p className="text-[#a0a0a0] text-sm">Controle de gastos e transações.</p>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-[#c4a47c] text-[#121212] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#d4b48c] transition-colors">
                    <Plus size={20} /> Nova Despesa
                </button>
            </div>

            {isAdding && (
                <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#c4a47c]/30 animate-in zoom-in-95">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <input type="text" value={newExp.nome} onChange={e => setNewExp({...newExp, nome: e.target.value})} placeholder="Nome" className="bg-[#121212] border border-[#2a2a2a] text-white p-2.5 rounded-lg" />
                        <input type="number" value={newExp.valor} onChange={e => setNewExp({...newExp, valor: e.target.value})} placeholder="Valor" className="bg-[#121212] border border-[#2a2a2a] text-white p-2.5 rounded-lg" />
                        <select value={newExp.categoria} onChange={e => setNewExp({...newExp, categoria: e.target.value})} className="bg-[#121212] border border-[#2a2a2a] text-white p-2.5 rounded-lg">
                            <option>Insumos</option><option>Operacional</option><option>Marketing</option><option>Equipe</option>
                        </select>
                        <button onClick={handleAddExp} className="bg-[#c4a47c] text-[#121212] font-bold rounded-lg py-2.5">Salvar</button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-[#121212] border border-[#2a2a2a] text-white px-3 py-2 rounded-lg">
                    {meses.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
                </select>
                <input type="number" value={filtroDia} onChange={e => setFiltroDia(e.target.value)} placeholder="Dia" className="bg-[#121212] border border-[#2a2a2a] text-white px-3 py-2 rounded-lg w-20" />
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" size={16} />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="bg-[#121212] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-white w-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#2a2a2a] shadow-lg">
                    <span className="text-[#a0a0a0] text-sm">Total Gasto</span>
                    <p className="text-3xl font-bold text-[#f5f5f5] mt-1">{formatPrice(totalGasto)}</p>
                </div>
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#2a2a2a] shadow-lg">
                    <span className="text-[#a0a0a0] text-sm">Transações</span>
                    <p className="text-3xl font-bold text-[#f5f5f5] mt-1">{filtradas.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#2a2a2a] h-[300px]">
                    <h3 className="text-sm font-medium text-[#a0a0a0] mb-4">Por Categoria</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={dataPie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {dataPie.map((entry, i) => (
                                    <Cell key={i} fill={categoryColorMap[entry.name] || cores[i % cores.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#121212', border: '1px solid #2a2a2a'}} itemStyle={{color: '#fff'}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-[#1e1e1e] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col max-h-[300px]">
                    <div className="p-4 border-b border-[#2a2a2a] bg-[#121212]/50 text-[#f5f5f5] font-medium">Lista de Gastos</div>
                    <div className="overflow-y-auto flex-1 no-scrollbar">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#121212] text-[#a0a0a0] uppercase sticky top-0">
                                <tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3 text-right">Valor</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2a2a]">
                                {filtradas.map(d => (
                                    <tr key={d.id} className="hover:bg-[#121212]/50">
                                        <td className="px-4 py-3 text-[#a0a0a0]">{new Date(d.data_despesa).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-[#f5f5f5]">{d.nome}</td>
                                        <td className="px-4 py-3 text-right text-[#c4a47c] font-bold">{formatPrice(d.valor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PerfilEditor = () => {
    const [profile, setProfile] = useState({
        restaurantName: '',
        address: '',
        ownerName: '',
        cpf: '',
        email: ''
    });

    useEffect(() => {
        const metaStr = localStorage.getItem('userMetadata');
        const emailStr = localStorage.getItem('userEmail');
        let meta = {};
        try { meta = metaStr ? JSON.parse(metaStr) : {}; } catch(e) {}
        
        setProfile({
            restaurantName: meta.restaurantName || 'NaMesa Bar & Coquetelaria',
            address: meta.address || 'Rua das Flores, 123',
            ownerName: meta.ownerName || 'Admin',
            cpf: meta.cpf || '000.000.000-00',
            email: emailStr || 'admin@namesa.app'
        });
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in max-w-3xl">
            <div className="border-b border-[#2a2a2a] pb-6">
                <h2 className="text-xl font-serif text-[#f5f5f5]">Perfil do Estabelecimento</h2>
                <p className="text-[#a0a0a0] text-sm">Gerencie as informações do seu negócio.</p>
            </div>
            <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#2a2a2a] shadow-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-xs text-[#a0a0a0] mb-2 block flex items-center gap-2"><Store size={14}/> Nome do Estabelecimento</label><input type="text" value={profile.restaurantName} onChange={e => setProfile({...profile, restaurantName: e.target.value})} className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] px-4 py-2.5 rounded-lg focus:border-[#c4a47c] outline-none" /></div>
                    <div><label className="text-xs text-[#a0a0a0] mb-2 block flex items-center gap-2"><MapPin size={14}/> Endereço</label><input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] px-4 py-2.5 rounded-lg focus:border-[#c4a47c] outline-none" /></div>
                    <div><label className="text-xs text-[#a0a0a0] mb-2 block flex items-center gap-2"><User size={14}/> Nome do proprietário</label><input type="text" value={profile.ownerName} onChange={e => setProfile({...profile, ownerName: e.target.value})} className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] px-4 py-2.5 rounded-lg focus:border-[#c4a47c] outline-none" /></div>
                    <div><label className="text-xs text-[#a0a0a0] mb-2 block flex items-center gap-2"><Lock size={14}/> CPF</label><input type="text" value={profile.cpf} onChange={e => setProfile({...profile, cpf: e.target.value})} className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] px-4 py-2.5 rounded-lg focus:border-[#c4a47c] outline-none" /></div>
                    <div className="md:col-span-2"><label className="text-xs text-[#a0a0a0] mb-2 block flex items-center gap-2"><Mail size={14}/> E-mail</label><input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-[#121212] border border-[#2a2a2a] text-[#f5f5f5] px-4 py-2.5 rounded-lg focus:border-[#c4a47c] outline-none opacity-70 cursor-not-allowed" disabled title="O e-mail não pode ser alterado por aqui" /></div>
                </div>
                <div className="flex justify-end pt-4"><button className="bg-[#c4a47c] text-[#121212] px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-[#d4b48c] transition-colors"><Save size={20}/> Salvar Perfil</button></div>
            </div>
        </div>
    );
};

const Dashboard = ({ onLogout, userId }) => {
    const [activeTab, setActiveTab] = useState('pedidos');
    const [pedidos, setPedidos] = useState([]);
    const [menuData, setMenuData] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => localStorage.getItem('sidebarOpen') !== 'false');
    const [notification, setNotification] = useState(null);

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Interação do usuário necessária para som:", e));
    };

    const triggerNotification = (mesa, nome) => {
        setNotification(`Mesa ${mesa} - ${nome}`);
        playNotificationSound();
        setTimeout(() => setNotification(null), 6000);
    };

    const TABS = [
        { id: 'pedidos', label: 'Pedidos', icon: Receipt },
        { id: 'cardapio', label: 'Cardápio', icon: UtensilsCrossed },
        { id: 'financeiro', label: 'Financeiro', icon: BarChart3 },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
        { id: 'perfil', label: 'Perfil', icon: Settings }
    ];

    useEffect(() => {
        const fetchInicial = async (isInterval = false) => {
            try {
                const [catRes, itemsRes, pedRes] = await Promise.all([
                    fetch(`${supabaseUrl}/rest/v1/categorias?select=*&order=ordem.asc`, { headers: supabaseHeaders }),
                    fetch(`${supabaseUrl}/rest/v1/itens_cardapio?user_id=eq.${userId}&select=*`, { headers: supabaseHeaders }),
                    fetch(`${supabaseUrl}/rest/v1/pedidos?user_id=eq.${userId}&select=*,itens_pedido(*)&order=created_at.desc&limit=20`, { headers: supabaseHeaders })
                ]);
                const categorias = await catRes.json();
                const itens = await itemsRes.json();
                const peds = await pedRes.json();
                
                if (peds) {
                    const novosPeds = peds.map(p => ({
                        id: p.id, 
                        orderNumber: `#${String(p.id).padStart(2, '0')}`,
                        table: p.mesa, 
                        customerName: p.nome_cliente, 
                        total: p.total,
                        status: p.status || 'pendente', 
                        time: new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        created_at: p.created_at,
                        items: p.itens_pedido ? p.itens_pedido.map(ip => ({
                            name: ip.nome_item_historico || "Item",
                            quantity: ip.quantidade || 1
                        })) : []
                    }));

                    if (pedidos.length > 0) {
                        const detectado = novosPeds.filter(n => !pedidos.find(p => p.id === n.id));
                        if (detectado.length > 0) {
                            triggerNotification(detectado[0].table, detectado[0].customerName);
                        }
                    }
                    setPedidos(novosPeds);
                }

                if (categorias && !isInterval) {
                    setMenuData(categorias.map(c => ({
                        categoryId: c.id,
                        category: c.nome,
                        items: itens.filter(i => i.categoria_id === c.id).map(i => ({
                            id: i.id, name: i.nome, description: i.descricao, price: i.preco,
                            image: i.imagem_url || fallbackImage
                        }))
                    })));
                }
            } catch (e) { console.error(e); }
        };
        fetchInicial();
        const interval = setInterval(() => fetchInicial(true), 10000);
        return () => clearInterval(interval);
    }, [userId]);

    const handleUpdateStatus = async (id, nextStatus) => {
        if (!nextStatus) return;
        try {
            await fetch(`${supabaseUrl}/rest/v1/pedidos?id=eq.${id}&user_id=eq.${userId}`, {
                method: 'PATCH',
                headers: supabaseHeaders,
                body: JSON.stringify({ status: nextStatus })
            });

            if (nextStatus === 'concluido') {
                const pedidoPago = pedidos.find(p => p.id === id);
                if (pedidoPago) {
                    await fetch(`${supabaseUrl}/rest/v1/despesas`, {
                        method: 'POST',
                        headers: supabaseHeaders,
                        body: JSON.stringify({
                            nome: `Pedido Mesa ${pedidoPago.table}`,
                            valor: pedidoPago.total,
                            categoria: 'Venda',
                            metodo_pagamento: 'Recebido',
                            data_despesa: new Date().toISOString().split('T')[0],
                            user_id: userId
                        })
                    });
                }
            }

            setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p));
        } catch (e) { console.error(e); }
    };

    const handleClearHistory = async () => {
        try {
            await fetch(`${supabaseUrl}/rest/v1/pedidos?user_id=eq.${userId}&status=in.("concluido","cancelado")`, {
                method: 'DELETE',
                headers: supabaseHeaders
            });
            setPedidos(prev => prev.filter(p => p.status !== 'concluido' && p.status !== 'cancelado'));
        } catch (e) { console.error(e); }
    };

    const handleNovoPedido = (pedido) => {
        triggerNotification(pedido.table, pedido.customerName);
        setPedidos(prev => {
            const index = prev.findIndex(p => p.id === pedido.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = {
                    ...pedido,
                    items: [...(prev[index].items || []), ...pedido.items]
                };
                return updated;
            }
            return [pedido, ...prev];
        });
        setActiveTab('pedidos');
    };

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', newState);
    };

    return (
        <div className="h-screen flex flex-row bg-[#0a0a0a] text-[#f5f5f5] overflow-hidden font-sans">
            {notification && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-[#c4a47c] to-[#d4b48c] text-[#121212] px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(196,164,124,0.4)] flex items-center gap-4 animate-in slide-in-from-top-10 duration-500 border border-[#d4b48c]/50">
                    <div className="bg-[#121212] p-2 rounded-full">
                        <BellRing className="text-[#c4a47c] animate-bounce" size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Um novo pedido chegou!</p>
                        <p className="font-bold text-lg leading-tight">{notification}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-50 transition-opacity">
                        <X size={20} />
                    </button>
                </div>
            )}
            
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            <nav className={`bg-[#1e1e1e] border-r border-[#2a2a2a] transition-all duration-300 flex flex-col items-stretch shrink-0 ${isSidebarOpen ? 'absolute md:relative w-64 h-full z-30' : 'relative w-16 md:w-20 z-20'}`}>
                <div className={`p-4 md:p-6 border-b border-[#2a2a2a] h-16 md:h-20 flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
                    <h1 className="text-xl md:text-2xl font-serif text-[#c4a47c] tracking-wide">{isSidebarOpen ? 'NaMesa' : 'N'}</h1>
                </div>
                <div className="flex-1 flex flex-col py-4 md:py-6 space-y-2 px-2 md:px-3 overflow-y-auto no-scrollbar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center rounded-xl transition-all duration-200 shrink-0 w-full ${isSidebarOpen ? 'px-4 py-3 gap-4' : 'justify-center p-3'} ${isActive ? 'bg-[#c4a47c]/10 text-[#c4a47c]' : 'text-[#a0a0a0] hover:bg-[#121212] hover:text-[#f5f5f5]'}`}>
                                <Icon size={20} className="md:w-[22px] md:h-[22px] shrink-0" />
                                {isSidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>}
                            </button>
                        );
                    })}
                </div>
                <div className="p-2 md:p-4 border-t border-[#2a2a2a]">
                    <button onClick={onLogout} className={`flex items-center rounded-xl text-[#8b0000] hover:bg-[#8b0000]/10 transition-colors w-full ${isSidebarOpen ? 'px-4 py-3 gap-3' : 'justify-center p-3'}`}>
                        <LogOut size={20} className="shrink-0" />
                        {isSidebarOpen && <span className="text-sm font-bold whitespace-nowrap">Sair</span>}
                    </button>
                </div>
                <button onClick={toggleSidebar} className="absolute top-1/2 -right-3 -translate-y-1/2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full p-1 text-[#a0a0a0] hover:text-[#c4a47c] transition-colors z-40">
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </nav>

            <main className="flex-1 p-4 md:p-10 overflow-y-auto no-scrollbar pb-safe-area">
                <div className="max-w-full lg:max-w-6xl mx-auto pb-24 md:pb-20">
                    {activeTab === 'pedidos' && <PedidosList pedidos={pedidos} onUpdateStatus={handleUpdateStatus} onClearHistory={handleClearHistory} />}
                    {activeTab === 'cardapio' && <CardapioEditor menuData={menuData} setMenuData={setMenuData} userId={userId} />}
                    {activeTab === 'financeiro' && <Financeiro userId={userId} />}
                    {activeTab === 'qrcode' && <QRCodeGenerator onSimulate={() => setActiveTab('simulador')} menuData={menuData} onAddPedido={handleNovoPedido} userId={userId} />}
                    {activeTab === 'perfil' && <PerfilEditor />}
                    {activeTab === 'simulador' && (
                        <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm transition-opacity">
                            <div className="w-full sm:w-[400px] h-full relative">
                                <SimuladorCliente onBack={() => setActiveTab('qrcode')} onAddPedido={handleNovoPedido} menuData={menuData} userId={userId} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isClientView, setIsClientView] = useState(false);
    const [clientEstId, setClientEstId] = useState(null);
    const [clientMenuData, setClientMenuData] = useState([]);
    const [loadingClient, setLoadingClient] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const kiosqueId = params.get('kiosque') || params.get('id');
        if (kiosqueId) {
            setClientEstId(kiosqueId);
            setIsClientView(true);
            fetchClientMenu(kiosqueId);
        }
    }, []);

    const fetchClientMenu = async (id) => {
        setLoadingClient(true);
        try {
            const [catRes, itemsRes] = await Promise.all([
                fetch(`${supabaseUrl}/rest/v1/categorias?select=*&order=ordem.asc`, { headers: supabaseHeaders }),
                fetch(`${supabaseUrl}/rest/v1/itens_cardapio?user_id=eq.${id}&select=*`, { headers: supabaseHeaders })
            ]);
            const categorias = await catRes.json();
            const itens = await itemsRes.json();
            if (categorias && itens) {
                setClientMenuData(categorias.map(c => ({
                    categoryId: c.id,
                    category: c.nome,
                    items: itens.filter(i => i.categoria_id === c.id).map(i => ({
                        id: i.id, name: i.nome, description: i.descricao, price: i.preco,
                        image: i.imagem_url || fallbackImage
                    }))
                })));
            }
        } catch (e) { console.error(e); }
        setLoadingClient(false);
    };

    useEffect(() => {
        const generateAppIcon = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#0a0a0a';
            const r = 100;
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(512 - r, 0);
            ctx.quadraticCurveTo(512, 0, 512, r);
            ctx.lineTo(512, 512 - r);
            ctx.quadraticCurveTo(512, 512, 512 - r, 512);
            ctx.lineTo(r, 512);
            ctx.quadraticCurveTo(0, 512, 0, 512 - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            ctx.fill();

            ctx.font = 'bold 110px "Inter", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('Na', 185, 285);

            ctx.fillStyle = '#c4a47c';
            ctx.fillText('Mesa', 335, 285);

            return canvas.toDataURL('image/png');
        };

        const iconData = generateAppIcon();

        const meta = document.createElement('meta');
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover";
        document.head.appendChild(meta);

        const iconLink = document.createElement('link');
        iconLink.rel = "icon";
        iconLink.href = iconData;
        document.head.appendChild(iconLink);

        const appleIcon = document.createElement('link');
        appleIcon.rel = "apple-touch-icon";
        appleIcon.href = iconData;
        document.head.appendChild(appleIcon);

        const manifest = {
            "name": "NaMesa",
            "short_name": "NaMesa",
            "start_url": ".",
            "display": "standalone",
            "background_color": "#0a0a0a",
            "theme_color": "#0a0a0a",
            "icons": [
                {
                    "src": iconData,
                    "sizes": "192x192",
                    "type": "image/png"
                },
                {
                    "src": iconData,
                    "sizes": "512x512",
                    "type": "image/png"
                }
            ]
        };
        const stringManifest = JSON.stringify(manifest);
        const blob = new Blob([stringManifest], {type: 'application/json'});
        const manifestURL = URL.createObjectURL(blob);
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestURL;
        document.head.appendChild(manifestLink);

        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Berkshire+Swash&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);

    if (isClientView) {
        if (loadingClient) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#c4a47c] font-serif text-xl animate-pulse">Carregando cardápio...</div>;
        return <SimuladorCliente onBack={() => { window.location.href = window.location.origin + window.location.pathname; }} onAddPedido={() => {}} menuData={clientMenuData} userId={clientEstId} />;
    }

    if (!isLoggedIn) return <LoginScreen onLogin={(id) => { setUserId(id); setIsLoggedIn(true); }} />;
    return <Dashboard onLogout={() => { setIsLoggedIn(false); setUserId(null); }} userId={userId} />;
}
