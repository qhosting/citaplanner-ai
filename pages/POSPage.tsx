
import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, 
  Receipt, ScanLine, Tag, X, Printer, Package, BriefcaseMedical, CheckCircle2, Loader2, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, Service, CartItem, PaymentMethod } from '../types';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';

export const POSPage: React.FC = () => {
  // Consumo de Datos Reales
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: api.getServices
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PRODUCTS' | 'SERVICES'>('ALL');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [clientName, setClientName] = useState('');
  
  const [lastSale, setLastSale] = useState<{id: string, date: string, items: CartItem[], total: number, paymentMethod: PaymentMethod, change: number, clientName?: string} | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let items: (Product | Service)[] = [];
    
    if (activeTab === 'ALL' || activeTab === 'PRODUCTS') {
      items = [...items, ...products.filter(p => p.status === 'ACTIVE' && p.usage === 'RETAIL')];
    }
    if (activeTab === 'ALL' || activeTab === 'SERVICES') {
      items = [...items, ...services.filter(s => s.status === 'ACTIVE')];
    }

    return items.filter(item => 
      item.name.toLowerCase().includes(term) || 
      ('sku' in item && item.sku.toLowerCase().includes(term))
    );
  }, [products, services, searchTerm, activeTab]);

  const addToCart = (item: Product | Service) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      
      if ('stock' in item && existing && existing.quantity >= item.stock) {
        toast.error("Stock insuficiente en red");
        return prev;
      }
      if ('stock' in item && item.stock <= 0) {
        toast.error("Activo sin existencia");
        return prev;
      }

      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        const type = 'stock' in item ? 'PRODUCT' : 'SERVICE';
        return [...prev, {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          type,
          discount: 0,
          sku: 'sku' in item ? item.sku : undefined
        }];
      }
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const productDef = products.find(p => p.id === id);
        if (productDef && newQty > productDef.stock) {
           return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateDiscount = (id: string, discount: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, discount: Math.min(100, Math.max(0, discount)) } : i));
  };

  const { subtotal, totalDiscount, total } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    cart.forEach(item => {
      const itemSub = item.price * item.quantity;
      const itemDisc = itemSub * (item.discount / 100);
      sub += itemSub;
      disc += itemDisc;
    });
    return { subtotal: sub, totalDiscount: disc, total: sub - disc };
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setAmountTendered('');
    setPaymentMethod('CASH');
    setIsPaymentModalOpen(true);
  };

  const processPayment = async () => {
    const tendered = Number(amountTendered) || 0;
    
    // Validación solo para efectivo
    if (paymentMethod === 'CASH' && tendered < total) {
      toast.error("Monto insuficiente para liquidar ticket.");
      return;
    }

    setIsProcessing(true);

    const saleData = {
      items: cart,
      total,
      subtotal,
      discountTotal: totalDiscount,
      paymentMethod,
      clientName: clientName || 'Cliente Mostrador'
    };

    const result = await api.processSale(saleData);
    setIsProcessing(false);

    if (result.success) {
      setLastSale({
        id: result.saleId || 'POS-' + Date.now().toString(36).toUpperCase(),
        date: result.date || new Date().toISOString(),
        items: [...cart],
        total,
        paymentMethod,
        change: paymentMethod === 'CASH' ? tendered - total : 0,
        clientName
      });

      setCart([]);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      setClientName('');
      toast.success("Venta registrada exitosamente.");
    } else {
      toast.error("Error al registrar la venta en base de datos.");
    }
  };

  if (loadingProducts || loadingServices) {
    return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#050505]">
      <div className="flex-1 flex flex-col p-6 pr-3">
        {/* ... (Search and Filter Logic) ... */}
        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 mb-6">
          <div className="relative mb-6">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
             <input 
               type="text" placeholder="Escanear SKU o buscar por identidad..."
               className="w-full pl-16 pr-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-white outline-none focus:border-[#D4AF37]/30 text-xl font-medium"
               value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus
             />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveTab('ALL')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'ALL' ? 'bg-[#D4AF37] text-black shadow-2xl' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}>Todo</button>
            <button onClick={() => setActiveTab('PRODUCTS')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-[#D4AF37] text-black shadow-2xl' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}><Package size={14} /> Activos</button>
            <button onClick={() => setActiveTab('SERVICES')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SERVICES' ? 'bg-[#D4AF37] text-black shadow-2xl' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}><BriefcaseMedical size={14} /> Rituales</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 custom-scrollbar pr-2">
          {filteredItems.map(item => {
            const isProduct = 'stock' in item;
            const hasStock = !isProduct || item.stock > 0;
            return (
              <button
                key={item.id} onClick={() => hasStock && addToCart(item)} disabled={!hasStock}
                className={`flex flex-col justify-between glass-card p-6 rounded-[2.5rem] border-white/5 transition-all text-left group relative overflow-hidden ${!hasStock ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:border-[#D4AF37]/30 hover:shadow-2xl'}`}
              >
                <div>
                   <div className="flex justify-between items-start mb-4">
                     <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isProduct ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>{isProduct ? 'ACTIVO' : 'RITUAL'}</span>
                     {'sku' in item && <span className="text-[9px] text-slate-600 font-mono font-bold">{item.sku}</span>}
                   </div>
                   <h3 className="font-black text-white text-lg leading-tight uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{item.name}</h3>
                </div>
                <div className="mt-8 flex justify-between items-end">
                   <div>
                     <span className="block text-2xl font-black text-white tracking-tighter">${item.price.toFixed(2)}</span>
                     {isProduct && <span className={`text-[10px] font-black uppercase tracking-widest ${item.stock <= item.minStock ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>Stock: {item.stock}</span>}
                   </div>
                   <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:bg-[#D4AF37] group-hover:text-black transition-all"><Plus size={20} /></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-md bg-[#0a0a0a] border-l border-white/5 flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* ... (Cart Logic remains same) ... */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
          <h2 className="font-black text-[10px] text-white uppercase tracking-[0.4em] flex items-center gap-3"><ShoppingCart size={18} className="text-[#D4AF37]"/> Ticket de Operación</h2>
          <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-slate-700 hover:text-red-500 disabled:opacity-30 transition-colors" title="Abortar Ticket"><Trash2 size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-800"><ScanLine size={64} className="mb-6 opacity-10" /><p className="text-[10px] font-black uppercase tracking-widest opacity-20">Esperando captura de activos</p></div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="glass-card p-5 rounded-[2rem] border-white/5 group bg-white/[0.01]">
                 <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="font-black text-white text-xs uppercase tracking-tight line-clamp-2 pr-4">{item.name}</h4>
                       <span className="font-black text-white text-sm tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center bg-black/40 rounded-xl border border-white/5 h-8">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-3 text-slate-500 hover:text-white h-full border-r border-white/5"><Minus size={12} /></button>
                          <span className="px-3 text-[10px] font-black text-white min-w-[30px] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-3 text-slate-500 hover:text-white h-full border-l border-white/5"><Plus size={12} /></button>
                       </div>
                       <div className="ml-auto flex items-center gap-2">
                          <Tag size={12} className={item.discount > 0 ? 'text-[#D4AF37]' : 'text-slate-800'} />
                          <input type="number" min="0" max="100" value={item.discount} onChange={(e) => updateDiscount(item.id, Number(e.target.value))} className="w-10 text-right text-[10px] font-black bg-transparent border-b border-white/10 text-[#D4AF37] focus:outline-none p-0" />
                          <span className="text-[10px] text-slate-700 font-bold">%</span>
                       </div>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-black border-t border-white/5 space-y-4">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
           {totalDiscount > 0 && (<div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#D4AF37]"><span>Descuentos Red</span><span>-${totalDiscount.toFixed(2)}</span></div>)}
           <div className="flex justify-between text-3xl font-black text-white tracking-tighter pt-4 border-t border-white/5"><span>Total</span><span>${total.toFixed(2)}</span></div>
           <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full gold-btn text-black py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl mt-4 flex items-center justify-center gap-3"><CreditCard size={18} /> Procesar Cobro</button>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="glass-card rounded-[3.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-scale-in border-white/10">
             <div className="p-10 bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] text-black text-center"><p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Cobro en Mostrador</p><p className="text-6xl font-black tracking-tighter">${total.toFixed(2)}</p></div>
             <div className="p-10 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Identidad del Cliente</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ej: Cliente Mostrador VIP" className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#D4AF37]" />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                   <button onClick={() => setPaymentMethod('CASH')} className={`p-4 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-white/5 text-slate-600 hover:border-white/10'}`}><Banknote size={20} /><span className="text-[8px] font-black uppercase tracking-widest">Efectivo</span></button>
                   <button onClick={() => setPaymentMethod('SPEI')} className={`p-4 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'SPEI' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-white/5 text-slate-600 hover:border-white/10'}`}><Smartphone size={20} /><span className="text-[8px] font-black uppercase tracking-widest">SPEI</span></button>
                   <button onClick={() => setPaymentMethod('CARD')} className={`p-4 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CARD' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-white/5 text-slate-600 hover:border-white/10'}`}><CreditCard size={20} /><span className="text-[8px] font-black uppercase tracking-widest">Terminal</span></button>
                </div>
                
                {paymentMethod === 'CASH' && (
                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                     <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Monto Recibido</label>
                     <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37] text-2xl font-black">$</span><input type="number" autoFocus className="w-full pl-12 pr-6 py-4 text-3xl font-black bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} /></div>
                     <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-500">Cambio:</span><span className={`text-sm ${Number(amountTendered) - total < 0 ? 'text-red-500' : 'text-emerald-500'}`}>${Math.max(0, Number(amountTendered) - total).toFixed(2)}</span></div>
                  </div>
                )}
             </div>
             
             <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-6">
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Abortar</button>
                <button onClick={processPayment} disabled={(paymentMethod === 'CASH' && (Number(amountTendered) < total)) || isProcessing} className="gold-btn px-10 py-4 rounded-2xl text-black font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 disabled:opacity-30">
                  {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} 
                  Confirmar Venta
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Recibo Modal */}
      {isReceiptModalOpen && lastSale && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-6">
           <div className="bg-white text-black p-10 rounded-[1rem] shadow-2xl max-w-sm w-full font-mono text-xs uppercase animate-entrance">
              <div className="text-center mb-8 border-b-2 border-dashed border-black pb-8">
                 <h2 className="text-xl font-black tracking-tighter mb-2">CITAPLANNER</h2>
                 <p className="font-bold tracking-widest">Recibo de Venta</p>
                 <p className="text-[8px] opacity-60">ID: {lastSale.id} • {new Date(lastSale.date).toLocaleString()}</p>
              </div>
              <div className="space-y-4 mb-8">
                 {lastSale.items.map((it, idx) => (
                   <div key={idx} className="flex justify-between"><span className="font-bold">{it.quantity}X {it.name.substring(0, 20)}</span><span>${(it.price * it.quantity).toFixed(2)}</span></div>
                 ))}
              </div>
              <div className="border-t-2 border-dashed border-black pt-6 space-y-2">
                 <div className="flex justify-between font-black text-lg"><span>TOTAL</span><span>${lastSale.total.toFixed(2)}</span></div>
                 <div className="flex justify-between opacity-60"><span>MÉTODO</span><span>{lastSale.paymentMethod}</span></div>
                 {lastSale.paymentMethod === 'CASH' && <div className="flex justify-between opacity-60"><span>CAMBIO</span><span>${lastSale.change.toFixed(2)}</span></div>}
              </div>
              <div className="mt-10 text-center border-t border-black/10 pt-10">
                 <p className="font-black tracking-widest text-[9px] mb-4">GRACIAS POR SU PREFERENCIA</p>
                 <div className="w-32 h-1 bg-black mx-auto mb-10" />
                 <button onClick={() => setIsReceiptModalOpen(false)} className="w-full bg-black text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3"><Printer size={16} /> Cerrar & Imprimir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
