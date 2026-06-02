
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'MERCADOPAGO'>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientName, setClientName] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients()
  });

  const [lastSale, setLastSale] = useState<{ id: string, date: string, items: CartItem[], total: number, paymentMethod: PaymentMethod | 'MERCADOPAGO', change: number, clientName?: string } | null>(null);
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

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toLocaleString() : price.toFixed(2);
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

    // Mercado Pago Flow
    if (paymentMethod === 'MERCADOPAGO') {
      try {
        toast.loading("Generando link de pago...");
        const response = await fetch('/api/payments/create_preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            payer: { email: 'test_user@test.com', name: clientName || 'Cliente Mostrador' },
            branchId: localStorage.getItem('aurum_branch_id')
          })
        });
        const data = await response.json();

        if (data.init_point) {
          // In a real POS, show QR or open window.
          window.open(data.init_point, '_blank', 'width=800,height=600');

          // For now, assume success after user returns (Optimistic UI for demo)
          // In production, use websocket or polling to check status
          toast.dismiss();
          toast.success("Ventana de pago abierta. Verifique terminal.");
        } else {
          toast.error("Error conectando con Mercado Pago");
        }
      } catch (e) {
        toast.error("Error de red al procesar pago");
      }
      return; // Don't close modal immediately or handle as standard sale yet
    }

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
    return <div className="h-screen flex items-center justify-center bg-transparent"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-80px)] overflow-hidden bg-main">
      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
        {/* Search and Filter Section */}
        <div className="glass-card p-4 md:p-5 rounded-[2rem] border-main mb-6 bg-card-theme/50 backdrop-blur-md">
          <div className="flex flex-col xl:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={20} />
              <input
                type="text" placeholder="Escanear SKU o buscar activo..."
                className="w-full pl-14 pr-6 py-4 bg-black/5 dark:bg-black/20 border border-main rounded-2xl text-main outline-none focus:border-[#D4AF37]/30 text-base md:text-lg font-medium transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus
              />
            </div>
            <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
              <button onClick={() => setActiveTab('ALL')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === 'ALL' ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black shadow-lg shadow-[#D4AF37]/20' : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5 hover:border-[#D4AF37]/20'}`}>Todo</button>
              <button onClick={() => setActiveTab('PRODUCTS')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black shadow-lg shadow-[#D4AF37]/20' : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5 hover:border-[#D4AF37]/20'}`}><Package size={12} /> Activos</button>
              <button onClick={() => setActiveTab('SERVICES')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SERVICES' ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black shadow-lg shadow-[#D4AF37]/20' : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5 hover:border-[#D4AF37]/20'}`}><BriefcaseMedical size={12} /> Rituales</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 md:gap-4 pb-24 custom-scrollbar pr-2">
          {filteredItems.map(item => {
            const isProduct = 'stock' in item;
            const hasStock = !isProduct || item.stock > 0;
            return (
              <button
                key={item.id} onClick={() => hasStock && addToCart(item)} disabled={!hasStock}
                className={`flex flex-col glass-card p-0 rounded-[2.5rem] border-main transition-all text-left group relative overflow-hidden h-full ${!hasStock ? 'opacity-30 grayscale cursor-not-allowed text-muted' : 'bg-card-theme hover:border-[#D4AF37]/30 hover:shadow-2xl'}`}
              >
                {/* 🖼️ MEDIA CONTAINER */}
                <div className="h-48 w-full relative overflow-hidden bg-white/[0.03]">
                  {('imageUrl' in item && item.imageUrl) ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/5 group-hover:text-[#D4AF37]/10 transition-colors">
                      {isProduct ? <Package size={64} /> : <BriefcaseMedical size={64} />}
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] backdrop-blur-md border ${isProduct ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'}`}>
                      {isProduct ? 'Activo Físico' : 'Ritual / Servicio'}
                    </span>
                  </div>
                  {isProduct && item.stock <= item.minStock && (
                     <div className="absolute bottom-4 left-4 bg-red-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-lg animate-pulse">Low Stock</div>
                  )}
                </div>

                <div className="p-8 flex flex-col flex-1 justify-between">
                  <div>
                    {'sku' in item && <span className="text-[9px] text-[#D4AF37] font-mono font-bold tracking-widest block mb-2">{item.sku}</span>}
                    <h3 className="font-black text-main text-xl leading-tight uppercase tracking-tighter group-hover:text-[#D4AF37] transition-colors">{item.name}</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-2 line-clamp-1">{item.category || 'Sin Categoría'}</p>
                  </div>

                  <div className="mt-10 flex justify-between items-end">
                    <div>
                      <span className="block text-2xl font-black text-main tracking-tighter">${formatPrice(item.price)}</span>
                      {isProduct && <span className="text-[9px] font-black uppercase tracking-widest text-muted">Stock: {item.stock}</span>}
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted group-hover:bg-gradient-to-r group-hover:from-[#D4AF37] group-hover:to-[#AA7C11] group-hover:text-black transition-all shadow-xl"><Plus size={24} /></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full lg:max-w-md bg-card-theme border-l border-main flex flex-col h-[50vh] lg:h-full shadow-2xl relative z-10">
        <div className="p-6 border-b border-main flex justify-between items-center bg-black/5 dark:bg-black/40">
          <h2 className="font-black text-[10px] text-main uppercase tracking-[0.4em] flex items-center gap-3"><ShoppingCart size={18} className="text-[#D4AF37]" /> Ticket de Operación</h2>
          <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-muted hover:text-rose-500 disabled:opacity-30 transition-colors" title="Abortar Ticket"><Trash2 size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted opacity-20"><ScanLine size={64} className="mb-6" /><p className="text-[10px] font-black uppercase tracking-widest">Esperando captura de activos</p></div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="glass-card p-5 rounded-[2rem] border-main group bg-white/[0.01]">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-main text-[10px] uppercase tracking-tight line-clamp-2 pr-4">{item.name}</h4>
                    <span className="font-black text-main text-xs tracking-tighter">${formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black/5 dark:bg-black/40 rounded-xl border border-main h-8">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-3 text-muted hover:text-main h-full border-r border-main"><Minus size={12} /></button>
                      <span className="px-3 text-[10px] font-black text-main min-w-[30px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-3 text-muted hover:text-main h-full border-l border-main"><Plus size={12} /></button>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Tag size={12} className={item.discount > 0 ? 'text-[#D4AF37]' : 'text-muted'} />
                      <input type="number" min="0" max="100" value={item.discount} onChange={(e) => updateDiscount(item.id, Number(e.target.value))} className="w-10 text-right text-[10px] font-black bg-transparent border-b border-main text-[#D4AF37] focus:outline-none p-0" />
                      <span className="text-[10px] text-muted font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 md:p-8 bg-black/5 dark:bg-black border-t border-main space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted"><span>Subtotal</span><span className="text-main">${formatPrice(subtotal)}</span></div>
          {totalDiscount > 0 && (<div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#D4AF37]"><span>Descuentos Red</span><span>-${formatPrice(totalDiscount)}</span></div>)}
          <div className="flex justify-between text-3xl font-black text-main tracking-tighter pt-4 border-t border-main"><span>Total</span><span>${formatPrice(total)}</span></div>
          <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black hover:scale-[1.01] transition-all py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-lg shadow-[#D4AF37]/25 mt-4 flex items-center justify-center gap-3"><CreditCard size={18} /> Procesar Cobro</button>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="glass-card rounded-[3.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-scale-in border-white/10">
            <div className="p-10 bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] text-black text-center"><p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Cobro en Mostrador</p><p className="text-6xl font-black tracking-tighter">${formatPrice(total)}</p></div>
            <div className="p-10 space-y-8 bg-main">
              <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-3 ml-2">Identidad del Cliente</label>
                <div className="relative group">
                  <div className="flex gap-2">
                    <input 
                      type="text" value={clientName} 
                      onChange={(e) => {
                        setClientName(e.target.value);
                        if (selectedClient && e.target.value !== selectedClient.name) {
                          setSelectedClient(null);
                        }
                      }} 
                      placeholder="Buscar o escribir cliente..." 
                      className="w-full p-5 bg-black/5 dark:bg-black/40 border border-main rounded-2xl text-main font-bold outline-none focus:border-[#D4AF37] transition-all" 
                    />
                    {selectedClient && (
                      <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 text-[8px] font-black uppercase">
                        <CheckCircle2 size={12} /> Vinculado
                      </div>
                    )}
                  </div>

                  {/* 🔍 Client Search Dropdown */}
                  {clientName && !selectedClient && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-2xl p-2 z-[300] shadow-2xl max-h-48 overflow-y-auto scrollbar-custom">
                      {clients
                        .filter((c: any) => c.name.toLowerCase().includes(clientName.toLowerCase()) || c.phone?.includes(clientName))
                        .slice(0, 5)
                        .map((c: any) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedClient(c);
                              setClientName(c.name);
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-all text-left"
                          >
                            <div>
                              <p className="text-[10px] font-black text-white uppercase">{c.name}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase">{c.phone || 'Sin Teléfono'}</p>
                            </div>
                            <Plus size={14} className="text-[#D4AF37]" />
                          </button>
                        ))}
                      <div className="p-3 border-t border-white/5 text-center">
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest italic">Presione enter para usar como cliente nuevo</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setPaymentMethod('CASH')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-main text-muted hover:border-muted'}`}><Banknote size={24} /><span className="font-bold text-xs">Efectivo</span></button>
                <button onClick={() => setPaymentMethod('SPEI')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'SPEI' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600' : 'border-main text-muted hover:border-muted'}`}><ScanLine size={24} /><span className="font-bold text-xs">SPEI</span></button>
                <button onClick={() => setPaymentMethod('MERCADOPAGO')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'MERCADOPAGO' ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'border-main text-muted hover:border-muted'}`}><CreditCard size={24} /><span className="font-bold text-xs">MP</span></button>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Monto Recibido</label>
                  <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37] text-2xl font-black">$</span><input type="number" autoFocus className="w-full pl-12 pr-6 py-4 text-3xl font-black bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} /></div>
                  <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-500">Cambio:</span><span className={`text-sm ${Number(amountTendered) - total < 0 ? 'text-red-500' : 'text-emerald-500'}`}>${formatPrice(Math.max(0, Number(amountTendered) - total))}</span></div>
                </div>
              )}
            </div>

            <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-6">
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Abortar</button>
              <button onClick={processPayment} disabled={(paymentMethod === 'CASH' && (Number(amountTendered) < total)) || isProcessing} className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:scale-[1.02] transition-all px-10 py-4 rounded-2xl text-black font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20 flex items-center gap-3 disabled:opacity-30">
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
                <div key={idx} className="flex justify-between"><span className="font-bold">{it.quantity}X {it.name.substring(0, 20)}</span><span>${formatPrice(it.price * it.quantity)}</span></div>
              ))}
            </div>
            <div className="border-t-2 border-dashed border-black pt-6 space-y-2">
              <div className="flex justify-between font-black text-lg"><span>TOTAL</span><span>${formatPrice(lastSale.total)}</span></div>
              <div className="flex justify-between opacity-60"><span>MÉTODO</span><span>{lastSale.paymentMethod}</span></div>
              {lastSale.paymentMethod === 'CASH' && <div className="flex justify-between opacity-60"><span>CAMBIO</span><span>${formatPrice(lastSale.change)}</span></div>}
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
