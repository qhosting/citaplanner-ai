
import React, { useState, useEffect } from 'react';
import { X, Package, RefreshCw, Calculator, AlertTriangle, ShoppingBag, Beaker, Calendar, Fingerprint } from 'lucide-react';
import { Product } from '../types';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  mode: 'create' | 'edit' | 'restock';
  initialData?: Product;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  mode, 
  initialData 
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 5,
    status: 'ACTIVE',
    usage: 'RETAIL',
    batchNumber: '',
    expiryDate: ''
  });

  const [restockAmount, setRestockAmount] = useState(0);

  useEffect(() => {
    if (initialData && (mode === 'edit' || mode === 'restock')) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        sku: generateSKU(),
        category: 'General',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        status: 'ACTIVE',
        usage: 'RETAIL',
        batchNumber: '',
        expiryDate: ''
      });
      setRestockAmount(0);
    }
  }, [initialData, mode, isOpen]);

  const generateSKU = (name: string = '') => {
    const prefix = name ? name.substring(0, 3).toUpperCase() : 'PRD';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  };

  const calculateMargin = () => {
    const price = Number(formData.price) || 0;
    const cost = Number(formData.cost) || 0;
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const margin = calculateMargin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let productToSave: Product;
    if (mode === 'restock') {
      productToSave = {
        ...(formData as Product),
        stock: (formData.stock || 0) + Number(restockAmount)
      };
    } else {
      productToSave = {
        id: initialData?.id || (Date.now().toString(36) + Math.random().toString(36).substring(2)),
        ...(formData as Omit<Product, 'id'>)
      };
    }
    onSave(productToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl rounded-[3.5rem] overflow-hidden flex flex-col max-h-[92vh] border-[#D4AF37]/20 shadow-[0_0_100px_rgba(212,175,55,0.15)] animate-scale-in">
        <div className="flex justify-between items-center p-10 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-5">
            <div className={`p-3.5 rounded-2xl bg-black border ${mode === 'restock' ? 'border-emerald-500/30 text-emerald-500' : 'border-[#D4AF37]/30 text-[#D4AF37]'}`}>
              {mode === 'restock' ? <RefreshCw size={24} /> : <Package size={24} />}
            </div>
            <div>
              <h3 className="font-black text-2xl text-white tracking-tighter uppercase">
                {mode === 'create' && 'Integrar Producto'}
                {mode === 'edit' && 'Configurar Nodo'}
                {mode === 'restock' && 'Saturar Inventario'}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">
                {mode === 'restock' ? 'Incremento de activos en red' : 'Gestión de Activos Aurum'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8 custom-scrollbar bg-[#080808]/50">
          {mode === 'restock' ? (
             <div className="space-y-8">
               <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                 <h4 className="font-black text-xl text-white uppercase tracking-tight mb-2">{formData.name}</h4>
                 <div className="flex gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                   <span className="flex items-center gap-2"><Fingerprint size={12}/> SKU: {formData.sku}</span>
                   <span className="flex items-center gap-2 text-emerald-500"><Package size={12}/> Stock Actual: {formData.stock}</span>
                 </div>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-[#D4AF37] uppercase mb-4 block ml-1 tracking-widest">Cantidad a Ingresar</label>
                 <div className="flex items-center gap-6">
                    <input 
                      type="number" min="1" required autoFocus
                      className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-6 text-2xl font-black text-white focus:border-emerald-500 outline-none transition-all"
                      value={restockAmount}
                      onChange={(e) => setRestockAmount(Number(e.target.value))}
                    />
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Nuevo Total Red</p>
                      <p className="text-3xl font-black text-white">{(formData.stock || 0) + restockAmount}</p>
                    </div>
                 </div>
               </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Identidad del Activo</label>
                <input
                  required type="text"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-[#D4AF37] transition-all font-bold"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name, 
                      sku: mode === 'create' ? generateSKU(name) : prev.sku 
                    }));
                  }}
                  placeholder="Ej: Pigmento Master Dark Brown"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Uso en Protocolo</label>
                <div className="grid grid-cols-2 gap-3">
                   <button
                    type="button"
                    onClick={() => setFormData({...formData, usage: 'RETAIL'})}
                    className={`flex items-center justify-center gap-2 py-4 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${formData.usage === 'RETAIL' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-white/5 text-slate-600 hover:text-white'}`}
                   >
                     <ShoppingBag size={14} /> Venta
                   </button>
                   <button
                    type="button"
                    onClick={() => setFormData({...formData, usage: 'INTERNAL'})}
                    className={`flex items-center justify-center gap-2 py-4 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${formData.usage === 'INTERNAL' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-white/5 text-slate-600 hover:text-white'}`}
                   >
                     <Beaker size={14} /> Insumo
                   </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Identificador SKU</label>
                <div className="flex">
                  <input
                    required type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-l-2xl p-5 text-white outline-none focus:border-[#D4AF37] font-mono font-bold"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, sku: generateSKU(formData.name)})}
                    className="px-5 bg-white/5 border border-l-0 border-white/10 rounded-r-2xl hover:bg-white/10 text-slate-500 transition-all"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-8 pt-4 border-t border-white/5">
                 <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] flex items-center gap-3">
                   <Fingerprint size={16} /> Trazabilidad Técnica
                 </h4>
                 <div className="grid grid-cols-2 gap-8">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Número de Lote</label>
                      <input 
                        type="text"
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-[#D4AF37]"
                        placeholder="BATCH-XXXX"
                        value={formData.batchNumber}
                        onChange={e => setFormData({...formData, batchNumber: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Fecha de Caducidad</label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input 
                          type="date"
                          className="w-full pl-14 pr-5 py-4 bg-black/60 border border-white/10 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#D4AF37]"
                          value={formData.expiryDate}
                          onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                        />
                      </div>
                   </div>
                 </div>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-white/5">
                <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                  <Calculator size={16} /> Parámetros Financieros
                </h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Costo Inversión ($)</label>
                    <input
                      type="number" min="0" step="0.01"
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-black outline-none focus:border-[#D4AF37]"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">P.V.P Sugerido ($)</label>
                    <input
                      type="number" min="0" step="0.01"
                      disabled={formData.usage === 'INTERNAL'}
                      className={`w-full bg-black/60 border rounded-2xl p-4 text-white font-black outline-none transition-all ${formData.usage === 'INTERNAL' ? 'opacity-30 border-white/5' : 'border-white/10 focus:border-[#D4AF37]'}`}
                      value={formData.usage === 'INTERNAL' ? 0 : formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                </div>
                {formData.usage === 'RETAIL' && (
                  <div className="mt-6 flex items-center justify-between bg-[#D4AF37]/5 p-6 rounded-2xl border border-[#D4AF37]/10">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Margen de Rentabilidad:</span>
                    <span className={`text-xl font-black ${margin >= 35 ? 'text-emerald-500' : margin > 0 ? 'text-[#D4AF37]' : 'text-rose-500'}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 pt-4 border-t border-white/5">
                <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                   <Package size={16} /> Auditoría de Stock
                </h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Existencia Base</label>
                    <input
                      type="number" min="0"
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-black outline-none focus:border-[#D4AF37]"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-widest">Umbral Crítico (Alertas)</label>
                    <input
                      type="number" min="1"
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-black outline-none focus:border-[#D4AF37]"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-end gap-6 pt-10 border-t border-white/5">
            <button type="button" onClick={onClose} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest">Abortar</button>
            <button type="submit" className={`px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 ${mode === 'restock' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'gold-btn text-black'}`}>
              {mode === 'restock' ? 'Confirmar Saturación' : 'Sincronizar Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
