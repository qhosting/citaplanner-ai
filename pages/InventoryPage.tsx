
import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, AlertTriangle, TrendingUp, RefreshCw, Edit2, ShoppingBag, Beaker, Copy, Filter, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { InventoryModal } from '../components/InventoryModal';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'RETAIL' | 'INTERNAL'>('RETAIL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'restock'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  // Carga Real desde DB
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts
  });

  const mutation = useMutation({
    mutationFn: (product: Product) => {
      if (modalMode === 'create' || !product.id) return api.createProduct(product);
      return api.updateProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    }
  });

  const stats = useMemo(() => {
    return {
      totalItems: products.length,
      retailValue: products.filter(p => p.usage === 'RETAIL').reduce((acc, curr) => acc + (Number(curr.price) * curr.stock), 0),
      internalItems: products.filter(p => p.usage === 'INTERNAL').length,
      lowStock: products.filter(p => p.stock <= p.minStock).length,
    };
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesUsage = p.usage === activeTab;
    return matchesSearch && matchesCategory && matchesUsage;
  });

  const handleCreate = () => {
    setModalMode('create');
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-entrance">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 uppercase">
            <Package className="text-[#D4AF37]" size={32} />
            Inventario <span className="gold-text-gradient font-light italic">Master</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] ml-10">Control de Activos Aurum Global</p>
        </div>
        <button 
          onClick={handleCreate}
          className="gold-btn text-black px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-card p-6 rounded-3xl border-white/5 group">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Total Items</p>
          <p className="text-3xl font-black text-white">{stats.totalItems}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-white/5 group">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Valor Venta</p>
          <p className="text-3xl font-black text-white">${stats.retailValue.toLocaleString()}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-white/5 group">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Insumos</p>
          <p className="text-3xl font-black text-white">{stats.internalItems}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-white/5 group">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Stock Bajo</p>
          <p className={`text-3xl font-black ${stats.lowStock > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{stats.lowStock}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('RETAIL')}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'RETAIL' ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-slate-500'}`}
        >
          Venta Directa
        </button>
        <button 
          onClick={() => setActiveTab('INTERNAL')}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'INTERNAL' ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-slate-500'}`}
        >
          Consumo Interno
        </button>
      </div>

      <div className="glass-card p-4 rounded-3xl border-white/5 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" placeholder="SKU o Nombre..."
            className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="w-full lg:w-64 px-6 py-3 bg-black/40 border border-white/5 rounded-2xl text-white text-[10px] font-black uppercase outline-none focus:border-[#D4AF37]"
          value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">Todas las Categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Producto</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Inversión</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Disponibilidad</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="font-black text-white group-hover:text-[#D4AF37] transition-colors">{product.name}</div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{product.sku}</div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="font-black text-white">${Number(product.price).toFixed(2)}</div>
                  <div className="text-[9px] text-slate-600 font-black uppercase">Costo: ${Number(product.cost).toFixed(2)}</div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${product.stock <= product.min_stock ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>
                    {product.stock} Unid.
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => { setSelectedProduct(product); setModalMode('edit'); setIsModalOpen(true); }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-[#D4AF37] transition-all">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InventoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(p) => mutation.mutate(p)} 
        mode={modalMode} 
        initialData={selectedProduct} 
      />
    </div>
  );
};
