
import React, { useState, useMemo, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, TrendingUp, RefreshCw, Edit2, ShoppingBag, Beaker, History, Filter, Loader2, Calendar, ClipboardList, Zap, ArrowUpRight, ShieldAlert, Wand2, Download, Upload } from 'lucide-react';
import { Product, InventoryMovement } from '../types';
import { InventoryModal } from '../components/InventoryModal';
import { api } from '../services/api';
import { exportToExcel, importFromExcel } from '../utils/excelUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'RETAIL' | 'INTERNAL' | 'HISTORY'>('RETAIL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'restock'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  const [aiForecast, setAiForecast] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Carga Real desde DB
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['inventoryMovements'],
    queryFn: api.getInventoryMovements,
    enabled: activeTab === 'HISTORY'
  });

  const mutation = useMutation({
    mutationFn: (product: Product) => {
      if (modalMode === 'create' || !product.id) return api.createProduct(product);
      return api.updateProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements'] });
      setIsModalOpen(false);
      toast.success("Arquitectura de stock sincronizada");
    }
  });

  const runAIForecast = async () => {
    if (products.length === 0) return;
    setIsAnalyzing(true);

    try {
      const inventoryState = products.map(p => ({ n: p.name, s: p.stock, m: p.minStock }));
      const prompt = `Analiza este inventario de un estudio de belleza: ${JSON.stringify(inventoryState)}.
      Dime cuáles 3 productos corren riesgo de agotarse pronto basándote en que el umbral minStock es crítico. 
      Devuelve un consejo estratégico breve (máximo 40 palabras) con tono de consultor elite.`;

      const res = await api.generateAIContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiForecast(res.text);
    } catch (e) {
      toast.error("Frecuencia AI inestable");
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  const handleExport = async () => {
    toast.info("Generando ecosistema de activos XLSX...");
    const data = await api.exportProducts();
    if (data.length === 0) {
      toast.error("No hay productos para exportar");
      return;
    }

    const excelData = data.map(p => ({
      Nombre: p.name,
      SKU: p.sku,
      Categoría: p.category,
      PrecioVenta: p.price,
      Costo: p.cost,
      StockActual: p.stock,
      StockMínimo: p.minStock,
      Uso: p.usage,
      Descripción: p.description
    }));

    exportToExcel(excelData, `inventario_${new Date().toISOString().split('T')[0]}`);
    toast.success("Catálogo de activos exportado");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Procesando matriz de activos...");
      const data = await importFromExcel(file);

      const mappedData = data.map((item: any) => ({
        name: item.Nombre || item.name,
        sku: item.SKU || item.sku,
        category: item.Categoría || item.category,
        price: item.PrecioVenta || item.price,
        cost: item.Costo || item.cost,
        stock: item.StockActual || item.stock,
        minStock: item.StockMínimo || item.minStock,
        usage: item.Uso || item.usage || 'RETAIL',
        description: item.Descripción || item.description
      }));

      toast.info("Sincronizando inventario...");
      const res = await api.importProducts(mappedData);
      if (res.success) {
        toast.success(`${res.count} activos integrados al inventario`);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else {
        toast.error("Error en importación: " + res.error);
      }
    } catch (err) {
      toast.error("Error al procesar archivo Excel");
    }
    e.target.value = '';
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
        {aiForecast && (
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-10 rounded-[3.5rem] mb-16 animate-slide-up flex gap-8 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10"><Zap size={100} className="text-[#D4AF37]" /></div>
            <div className="p-5 bg-[#D4AF37] text-black rounded-[2rem] shadow-2xl shrink-0"><Wand2 size={32} /></div>
            <div>
              <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-3">Veredicto Estratégico AI</h4>
              <p className="text-xl font-light text-slate-200 italic leading-relaxed tracking-tight">"{aiForecast}"</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'RETAIL', label: 'Retail & Ventas', icon: ShoppingBag },
            { id: 'INTERNAL', label: 'Consumo Máster', icon: Beaker },
            { id: 'HISTORY', label: 'Auditoría de Movimientos', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 whitespace-nowrap border ${activeTab === tab.id ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-2xl' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'HISTORY' ? (
          <div className="space-y-10 animate-entrance">
            <div className="glass-card p-4 rounded-[3.5rem] border-white/5 flex flex-col lg:flex-row gap-6 justify-between items-center bg-black/20">
              <div className="relative w-full lg:w-[450px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                <input
                  type="text" placeholder="Buscar por SKU o Identidad de Activo..."
                  className="w-full pl-16 pr-6 py-5 bg-black/20 border border-white/5 rounded-3xl text-white outline-none focus:border-[#D4AF37]/30 font-medium transition-all"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <select
                  className="w-full lg:w-72 px-8 py-5 bg-black/40 border border-white/5 rounded-3xl text-zinc-300 text-[10px] font-black uppercase outline-none focus:border-[#D4AF37] cursor-pointer"
                  value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">Todas las Ramas</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button
                  onClick={runAIForecast}
                  disabled={isAnalyzing}
                  className="bg-black/40 text-slate-400 px-6 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest border border-white/5 hover:bg-white/5 transition-all"
                >
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="text-[#D4AF37]" />} Predicción AI
                </button>

                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1">
                  <button onClick={handleExport} title="Exportar Inventario XLSX" className="p-2.5 rounded-xl text-slate-500 hover:text-[#D4AF37] hover:bg-white/5 transition-all"><Download size={18} /></button>
                  <label className="p-2.5 rounded-xl text-slate-500 hover:text-[#D4AF37] hover:bg-white/5 transition-all cursor-pointer">
                    <Upload size={18} />
                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                  </label>
                </div>
              </div>
            </div>

          <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Activo / SKU</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Inversión & Venta</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Trazabilidad</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Estado Red</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="font-black text-lg text-white group-hover:text-[#D4AF37] transition-colors">{product.name}</div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Ref: {product.sku}</div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="font-black text-lg text-white">${Number(product.price).toFixed(2)}</div>
                      <div className="text-[9px] text-slate-600 font-black uppercase">Costo: ${Number(product.cost).toFixed(2)}</div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Lote: {product.batchNumber || 'N/A'}</span>
                        {product.expiryDate && (
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${new Date(product.expiryDate) < new Date() ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-slate-400 border border-white/5'}`}>
                            Exp: {new Date(product.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase border ${product.stock <= product.minStock ? 'border-red-500/30 text-red-500 bg-red-500/5 animate-pulse' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>
                        {product.stock} Unidades
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setSelectedProduct(product); setModalMode('restock'); setIsModalOpen(true); }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-emerald-500 transition-all border border-white/5" title="Saturar Stock">
                          <RefreshCw size={16} />
                        </button>
                        <button onClick={() => { setSelectedProduct(product); setModalMode('edit'); setIsModalOpen(true); }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-[#D4AF37] transition-all border border-white/5">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="animate-entrance">
          <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Estampa de Tiempo</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Activo</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Impacto Red</th>
                  <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.length === 0 ? (
                  <tr><td colSpan={5} className="px-10 py-32 text-center text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">Sin rastro de auditoría en este ciclo</td></tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-10 py-6 text-[11px] font-bold text-slate-500">{new Date(m.date).toLocaleString()}</td>
                      <td className="px-10 py-6">
                        <p className="font-black text-white text-sm uppercase">{m.productName}</p>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${m.type === 'IN' ? 'text-emerald-500 bg-emerald-500/10' : m.type === 'OUT' ? 'text-rose-500 bg-rose-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                          {m.type === 'IN' ? 'Entrada / Compra' : m.type === 'OUT' ? 'Consumo / Venta' : 'Ajuste Manual'}
                        </span>
                        <p className="text-[10px] text-slate-600 mt-1 italic">"{m.reason}"</p>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={`text-lg font-black ${m.type === 'IN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(p) => mutation.mutate(p)}
        mode={modalMode}
        initialData={selectedProduct}
      />
      </div>

      {/* 🔮 FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-10 right-10 z-[600]">
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-3 gold-btn text-black px-6 py-4 rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 font-extrabold text-[10px] uppercase tracking-widest group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Integrar Activo</span>
        </button>
      </div>
    </>
  );
};
