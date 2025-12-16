import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, 
  Receipt, ScanLine, Tag, X, Printer, Package, BriefcaseMedical, CheckCircle2 
} from 'lucide-react';
import { Product, Service, CartItem, PaymentMethod } from '../types';
import { api } from '../services/api';

export const POSPage: React.FC = () => {
  // --- STATE ---
  // Catálogos (En una app real, vendrían de hooks/context)
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Shampoo Reparador', sku: 'SHM-001', category: 'Cabello', price: 25.00, cost: 12.50, stock: 45, minStock: 10, status: 'ACTIVE' },
    { id: '2', name: 'Crema Facial', sku: 'CRM-204', category: 'Rostro', price: 45.00, cost: 20.00, stock: 8, minStock: 15, status: 'ACTIVE' },
    { id: '3', name: 'Gel Fijador', sku: 'GEL-103', category: 'Cabello', price: 15.00, cost: 5.00, stock: 120, minStock: 20, status: 'ACTIVE' }
  ]);
  const [services] = useState<Service[]>([
    { id: 's1', name: 'Consulta General', duration: 30, price: 50.00, category: 'General', status: 'ACTIVE' },
    { id: 's2', name: 'Limpieza Dental', duration: 45, price: 80.00, category: 'Odontología', status: 'ACTIVE' },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PRODUCTS' | 'SERVICES'>('ALL');
  
  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [clientName, setClientName] = useState('');
  
  // Receipt State
  const [lastSale, setLastSale] = useState<{id: string, date: string, items: CartItem[], total: number, paymentMethod: PaymentMethod, change: number, clientName?: string} | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // --- LOGIC ---

  // Filtro de Catálogo
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let items: (Product | Service)[] = [];
    
    if (activeTab === 'ALL' || activeTab === 'PRODUCTS') {
      items = [...items, ...products.filter(p => p.status === 'ACTIVE')];
    }
    if (activeTab === 'ALL' || activeTab === 'SERVICES') {
      items = [...items, ...services.filter(s => s.status === 'ACTIVE')];
    }

    return items.filter(item => 
      item.name.toLowerCase().includes(term) || 
      ('sku' in item && item.sku.toLowerCase().includes(term))
    );
  }, [products, services, searchTerm, activeTab]);

  // Carrito Logic
  const addToCart = (item: Product | Service) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      
      // Stock check for products
      if ('stock' in item && existing && existing.quantity >= item.stock) {
        alert("Stock insuficiente");
        return prev;
      }
      if ('stock' in item && item.stock <= 0) {
        alert("Sin stock");
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
        // Validar Stock si es producto
        const productDef = products.find(p => p.id === id);
        if (productDef && newQty > productDef.stock) {
           return item; // No permitir más del stock
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

  // Totales
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

  // Proceso de Pago
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setAmountTendered('');
    setPaymentMethod('CASH');
    setIsPaymentModalOpen(true);
  };

  const processPayment = async () => {
    const tendered = Number(amountTendered) || 0;
    if (paymentMethod === 'CASH' && tendered < total) {
      alert("El monto recibido es menor al total.");
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
      // Decrementar stock localmente (Optimistic UI)
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.quantity };
        }
        return p;
      }));

      // Set Receipt Data
      setLastSale({
        id: result.saleId || 'Unknown',
        date: result.date || new Date().toISOString(),
        items: [...cart],
        total,
        paymentMethod,
        change: paymentMethod === 'CASH' ? tendered - total : 0,
        clientName
      });

      // Clear Cart & Close Payment
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      setClientName('');
    } else {
      alert("Error procesando la venta");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      
      {/* LEFT: CATALOG */}
      <div className="flex-1 flex flex-col p-4 pr-2">
        {/* Search & Tabs */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input 
               type="text"
               placeholder="Buscar producto o servicio (Nombre o SKU)..."
               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               autoFocus
             />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('ALL')} 
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Todo
            </button>
            <button 
              onClick={() => setActiveTab('PRODUCTS')} 
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
            >
              <Package size={16} /> Productos
            </button>
            <button 
              onClick={() => setActiveTab('SERVICES')} 
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'SERVICES' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
            >
              <BriefcaseMedical size={16} /> Servicios
            </button>
          </div>
        </div>

        {/* Grid Items */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {filteredItems.map(item => {
            const isProduct = 'stock' in item;
            const hasStock = !isProduct || item.stock > 0;
            return (
              <button
                key={item.id}
                onClick={() => hasStock && addToCart(item)}
                disabled={!hasStock}
                className={`flex flex-col justify-between bg-white p-4 rounded-xl border transition-all text-left group ${!hasStock ? 'opacity-50 grayscale cursor-not-allowed border-slate-200' : 'hover:border-indigo-400 hover:shadow-md border-slate-200'}`}
              >
                <div>
                   <div className="flex justify-between items-start mb-2">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isProduct ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                       {isProduct ? 'PROD' : 'SERV'}
                     </span>
                     {'sku' in item && <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>}
                   </div>
                   <h3 className="font-semibold text-slate-800 leading-tight mb-1">{item.name}</h3>
                   <p className="text-sm text-slate-500">{item.category}</p>
                </div>
                
                <div className="mt-4 flex justify-between items-end">
                   <div>
                     <span className="block text-lg font-bold text-slate-900">${item.price.toFixed(2)}</span>
                     {isProduct && (
                       <span className={`text-xs ${item.stock <= item.minStock ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                         Stock: {item.stock}
                       </span>
                     )}
                   </div>
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                     <Plus size={18} />
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: CART */}
      <div className="w-full max-w-md bg-white border-l border-slate-200 flex flex-col h-full shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <ShoppingCart size={20} className="text-indigo-600"/> Ticket Actual
          </h2>
          <button 
             onClick={() => setCart([])} 
             disabled={cart.length === 0}
             className="text-slate-400 hover:text-red-500 disabled:opacity-30" 
             title="Vaciar Carrito"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <ScanLine size={48} className="mb-2" />
              <p>Escanea o selecciona productos</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                 <div className="flex-1">
                    <div className="flex justify-between">
                       <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                       <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       {/* Qty Controls */}
                       <div className="flex items-center bg-white rounded border border-slate-200 h-7">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-2 text-slate-500 hover:bg-slate-100 h-full border-r border-slate-200"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-700 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-2 text-slate-500 hover:bg-slate-100 h-full border-l border-slate-200"
                          >
                            <Plus size={12} />
                          </button>
                       </div>
                       
                       {/* Price Single */}
                       <span className="text-xs text-slate-400">x ${item.price}</span>

                       {/* Discount */}
                       <div className="ml-auto flex items-center gap-1">
                          <Tag size={12} className={item.discount > 0 ? 'text-green-500' : 'text-slate-300'} />
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                            className="w-10 text-right text-xs bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none p-0"
                          />
                          <span className="text-xs text-slate-500">%</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={16} />
                 </button>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
           <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
           </div>
           {totalDiscount > 0 && (
             <div className="flex justify-between text-sm text-green-600">
                <span>Descuentos</span>
                <span>-${totalDiscount.toFixed(2)}</span>
             </div>
           )}
           <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
           </div>

           <button 
             onClick={handleCheckout}
             disabled={cart.length === 0}
             className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed mt-4 shadow-lg flex items-center justify-center gap-2"
           >
             <CreditCard size={20} /> Cobrar
           </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
             <div className="p-6 bg-slate-900 text-white text-center">
                <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Total a Pagar</p>
                <p className="text-4xl font-bold">${total.toFixed(2)}</p>
             </div>
             
             <div className="p-6 space-y-6">
                
                {/* Client Name (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente (Opcional)</label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre del cliente para el ticket"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Method Selection */}
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setPaymentMethod('CASH')}
                     className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                   >
                      <Banknote size={24} />
                      <span className="font-bold">Efectivo</span>
                   </button>
                   <button 
                     onClick={() => setPaymentMethod('SPEI')}
                     className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'SPEI' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                   >
                      <ScanLine size={24} />
                      <span className="font-bold">Transferencia</span>
                   </button>
                </div>

                {/* Amount Input (Only Cash) */}
                {paymentMethod === 'CASH' && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monto Recibido</label>
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                           <input 
                             type="number" 
                             autoFocus
                             className="w-full pl-8 pr-4 py-3 text-xl font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                             value={amountTendered}
                             onChange={(e) => setAmountTendered(e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="mt-2 flex justify-between text-sm">
                        <span className="text-slate-600">Cambio:</span>
                        <span className={`font-bold ${Number(amountTendered) - total < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                           ${Math.max(0, Number(amountTendered) - total).toFixed(2)}
                        </span>
                     </div>
                  </div>
                )}

                {/* SPEI Info */}
                {paymentMethod === 'SPEI' && (
                   <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center">
                      <p className="text-sm text-indigo-800 font-medium mb-1">CLABE Interbancaria</p>
                      <p className="text-xl font-mono font-bold text-indigo-900 select-all">012 345 67890123456 7</p>
                      <p className="text-xs text-indigo-500 mt-2">Banco: BBVA • Titular: Negocio</p>
                   </div>
                )}
             </div>

             <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={processPayment}
                  disabled={paymentMethod === 'CASH' && (Number(amountTendered) < total)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Confirmar Venta
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Receipt Modal (Printable) */}
      {isReceiptModalOpen && lastSale && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <div id="printable-receipt" className="text-center font-mono text-xs text-slate-800 p-2 border border-slate-100 mb-4 bg-white">
                 <h2 className="text-lg font-bold uppercase mb-1">CitaPlanner</h2>
                 <p className="mb-4">Av. Principal 123, Ciudad</p>
                 
                 <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 mb-2">
                    <span>Fecha: {new Date(lastSale.date).toLocaleString()}</span>
                 </div>
                 <div className="text-left mb-2">
                    Cliente: {lastSale.clientName || 'Mostrador'}
                 </div>

                 <table className="w-full text-left mb-4">
                    <thead>
                       <tr className="border-b border-slate-800">
                          <th className="py-1">Cant</th>
                          <th className="py-1">Desc</th>
                          <th className="py-1 text-right">Importe</th>
                       </tr>
                    </thead>
                    <tbody>
                       {lastSale.items.map((item, i) => (
                          <tr key={i}>
                             <td className="py-1">{item.quantity} x {item.name.substring(0,15)}</td>
                             <td className="py-1 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>

                 <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right">
                    <div className="flex justify-between">
                       <span>TOTAL</span>
                       <span className="text-base font-bold">${lastSale.total.toFixed(2)}</span>
                    </div>
                    {lastSale.paymentMethod === 'CASH' && (
                       <>
                        <div className="flex justify-between text-slate-500">
                           <span>Efectivo</span>
                           <span>${(lastSale.total + lastSale.change).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                           <span>Cambio</span>
                           <span>${lastSale.change.toFixed(2)}</span>
                        </div>
                       </>
                    )}
                    {lastSale.paymentMethod === 'SPEI' && (
                       <div className="text-center mt-2 font-bold">[ TRANSFERENCIA ]</div>
                    )}
                 </div>

                 <p className="mt-6 text-center">*** Gracias por su compra ***</p>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setIsReceiptModalOpen(false)}
                   className="flex-1 py-2 text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
                 >
                   Cerrar
                 </button>
                 <button 
                   onClick={() => window.print()}
                   className="flex-1 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center justify-center gap-2"
                 >
                   <Printer size={16} /> Imprimir
                 </button>
              </div>
           </div>
           
           {/* Estilos para impresión (oculta todo menos el recibo) */}
           <style>{`
             @media print {
               body * { visibility: hidden; }
               #printable-receipt, #printable-receipt * { visibility: visible; }
               #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; border: none; }
             }
           `}</style>
        </div>
      )}

    </div>
  );
};