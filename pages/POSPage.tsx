
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, 
  Receipt, ScanLine, Tag, X, Printer, Package, BriefcaseMedical, CheckCircle2, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, Service, CartItem, PaymentMethod } from '../types';
import { api } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const POSPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Real Data Fetching
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts
  });

  const { data: services = [], isLoading: isLoadingServices } = useQuery({
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

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let items: (Product | Service)[] = [];
    
    if (activeTab === 'ALL' || activeTab === 'PRODUCTS') {
      // IMPORTANTE: Solo mostramos productos de Venta (RETAIL)
      items = [...items, ...products.filter((p: Product) => p.status === 'ACTIVE' && p.usage === 'RETAIL')];
    }
    if (activeTab === 'ALL' || activeTab === 'SERVICES') {
      items = [...items, ...services.filter((s: Service) => s.status === 'ACTIVE')];
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
        toast.error("Stock insuficiente");
        return prev;
      }
      if ('stock' in item && item.stock <= 0) {
        toast.error("Sin stock");
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
        // Verificar stock si es producto
        const productDef = products.find((p: Product) => p.id === id);
        if (productDef && newQty > productDef.stock) {
           toast.error(`Solo hay ${productDef.stock} unidades disponibles.`);
           return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
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
    if (paymentMethod === 'CASH' && tendered < total) {
      toast.error("El monto recibido es menor al total.");
      return;
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

    if (result.success) {
      // Invalidar queries para actualizar stock en otras vistas
      queryClient.invalidateQueries({ queryKey: ['products'] });

      setLastSale({
        id: result.saleId || 'Unknown',
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
      toast.success("Venta procesada correctamente");
    } else {
      toast.error("Error procesando la venta");
    }
  };

  const isLoading = isLoadingProducts || isLoadingServices;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100 animate-entrance">
      <div className="flex-1 flex flex-col p-4 pr-2">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input 
               type="text" placeholder="Buscar producto o servicio (Nombre o SKU)..."
               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
               value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus
             />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Todo</button>
            <button onClick={() => setActiveTab('PRODUCTS')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}><Package size={16} /> Productos</button>
            <button onClick={() => setActiveTab('SERVICES')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'SERVICES' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}><BriefcaseMedical size={16} /> Servicios</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 custom-scrollbar">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center h-64">
               <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          ) : filteredItems.map(item => {
            const isProduct = 'stock' in item;
            const hasStock = !isProduct || (item as Product).stock > 0;
            return (
              <button
                key={item.id} onClick={() => hasStock && addToCart(item)} disabled={!hasStock}
                className={`flex flex-col justify-between bg-white p-4 rounded-xl border transition-all text-left group ${!hasStock ? 'opacity-50 grayscale cursor-not-allowed border-slate-200' : 'hover:border-indigo-400 hover:shadow-md border-slate-200'}`}
              >
                <div>
                   <div className="flex justify-between items-start mb-2">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isProduct ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>{isProduct ? 'PROD' : 'SERV'}</span>
                     {'sku' in item && <span className="text-[10px] text-slate-400 font-mono">{(item as Product).sku}</span>}
                   </div>
                   <h3 className="font-semibold text-slate-800 leading-tight mb-1">{item.name}</h3>
                </div>
                <div className="mt-4 flex justify-between items-end">
                   <div>
                     <span className="block text-lg font-bold text-slate-900">${item.price.toFixed(2)}</span>
                     {isProduct && <span className={`text-xs ${(item as Product).stock <= (item as Product).minStock ? 'text-red-500 font-bold' : 'text-slate-400'}`}>Stock: {(item as Product).stock}</span>}
                   </div>
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Plus size={18} /></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-full max-w-md bg-white border-l border-slate-200 flex flex-col h-full shadow-xl">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2"><ShoppingCart size={20} className="text-indigo-600"/> Ticket Actual</h2>
          <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-slate-400 hover:text-red-500 disabled:opacity-30" title="Vaciar Carrito"><Trash2 size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><ScanLine size={48} className="mb-2" /><p>Escanea o selecciona productos</p></div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                 <div className="flex-1">
                    <div className="flex justify-between">
                       <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                       <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <div className="flex items-center bg-white rounded border border-slate-200 h-7">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 text-slate-500 hover:bg-slate-100 h-full border-r border-slate-200"><Minus size={12} /></button>
                          <span className="px-2 text-xs font-bold text-slate-700 min-w-[24px] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 text-slate-500 hover:bg-slate-100 h-full border-l border-slate-200"><Plus size={12} /></button>
                       </div>
                       <span className="text-xs text-slate-400">x ${item.price}</span>
                       <div className="ml-auto flex items-center gap-1">
                          <Tag size={12} className={item.discount > 0 ? 'text-green-500' : 'text-slate-300'} />
                          <input type="number" min="0" max="100" value={item.discount} onChange={(e) => updateDiscount(item.id, Number(e.target.value))} className="w-10 text-right text-xs bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none p-0" />
                          <span className="text-xs text-slate-500">%</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 self-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
           <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
           {totalDiscount > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Descuentos</span><span>-${totalDiscount.toFixed(2)}</span></div>)}
           <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>${total.toFixed(2)}</span></div>
           <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-lg hover:bg-slate-800 disabled:bg-slate-300 mt-4 shadow-lg flex items-center justify-center gap-2"><CreditCard size={20} /> Cobrar</button>
        </div>
      </div>
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
             <div className="p-6 bg-slate-900 text-white text-center"><p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Total a Pagar</p><p className="text-4xl font-bold">${total.toFixed(2)}</p></div>
             <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente (Opcional)</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setPaymentMethod('CASH')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}><Banknote size={24} /><span className="font-bold">Efectivo</span></button>
                   <button onClick={() => setPaymentMethod('SPEI')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'SPEI' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}><ScanLine size={24} /><span className="font-bold">Transferencia</span></button>
                </div>
                {paymentMethod === 'CASH' && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monto Recibido</label>
                     <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span><input type="number" autoFocus className="w-full pl-8 pr-4 py-3 text-xl font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} /></div>
                     <div className="mt-2 flex justify-between text-sm"><span className="text-slate-600">Cambio:</span><span className={`font-bold ${Number(amountTendered) - total < 0 ? 'text-red-500' : 'text-slate-800'}`}>${Math.max(0, Number(amountTendered) - total).toFixed(2)}</span></div>
                  </div>
                )}
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3"><button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button><button onClick={processPayment} disabled={paymentMethod === 'CASH' && (Number(amountTendered) < total)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"><CheckCircle2 size={18} /> Confirmar Venta</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
