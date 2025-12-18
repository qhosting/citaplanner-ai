
import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, AlertTriangle, TrendingUp, RefreshCw, Edit2, ShoppingBag, Beaker, Copy, Filter } from 'lucide-react';
import { Product } from '../types';
import { InventoryModal } from '../components/InventoryModal';
import { toast } from 'sonner';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Shampoo Reparador', sku: 'SHM-001', category: 'Cabello', price: 25.00, cost: 12.50, stock: 45, minStock: 10, status: 'ACTIVE', usage: 'RETAIL' },
    { id: '2', name: 'Crema Facial Hidratante', sku: 'CRM-204', category: 'Rostro', price: 45.00, cost: 20.00, stock: 8, minStock: 15, status: 'ACTIVE', usage: 'RETAIL' },
    { id: '3', name: 'Pigmento Labial Pro', sku: 'PIG-992', category: 'Insumos', price: 0, cost: 85.00, stock: 3, minStock: 5, status: 'ACTIVE', usage: 'INTERNAL' },
    { id: '4', name: 'Guantes Nitrilo (Caja)', sku: 'GUA-002', category: 'Insumos', price: 0, cost: 15.00, stock: 12, minStock: 10, status: 'ACTIVE', usage: 'INTERNAL' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'RETAIL' | 'INTERNAL'>('RETAIL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'restock'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  const stats = useMemo(() => {
    return {
      totalItems: products.length,
      retailValue: products.filter(p => p.usage === 'RETAIL').reduce((acc, curr) => acc + (curr.price * curr.stock), 0),
      internalItems: products.filter(p => p.usage === 'INTERNAL').length,
      lowStock: products.filter(p => p.stock <= p.minStock && p.status === 'ACTIVE').length,
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

  const handleEdit = (product: Product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleRestock = (product: Product) => {
    setModalMode('restock');
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleClone = (product: Product) => {
    const clonedProduct: Product = {
      ...product,
      id: '', // Modal generará uno nuevo
      name: `${product.name} (Copia)`,
      sku: `${product.sku}-CP`,
      stock: 0, // Inicia en cero para la copia
    };
    setModalMode('create');
    setSelectedProduct(clonedProduct);
    setIsModalOpen(true);
    toast.info("Configurando copia del producto...");
  };

  const handleSaveProduct = (product: Product) => {
    if (modalMode === 'create' || !product.id) {
      const finalProduct = {
        ...product,
        id: product.id || (Date.now().toString(36) + Math.random().toString(36).substring(2))
      };
      setProducts([...products, finalProduct]);
      toast.success("Producto creado exitosamente");
    } else {
      setProducts(products.map(p => p.id === product.id ? product : p));
      toast.success("Producto actualizado");
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-indigo-600" size={32} />
            Inventario
          </h1>
          <p className="text-slate-500 font-medium">Control de activos y mercancía para la venta.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all font-black shadow-xl shadow-slate-200 active:scale-95"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform"><Package size={20} /></div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Items</p>
          <p className="text-2xl font-black text-slate-900">{stats.totalItems}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Valor Venta</p>
          <p className="text-2xl font-black text-slate-900">${stats.retailValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform"><Beaker size={20} /></div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Insumos</p>
          <p className="text-2xl font-black text-slate-900">{stats.internalItems}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className={`p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform ${stats.lowStock > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}><AlertTriangle size={20} /></div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Stock Bajo</p>
          <p className="text-2xl font-black text-slate-900">{stats.lowStock}</p>
        </div>
      </div>

      {/* Tabs de Navegación Mejorados */}
      <div className="flex bg-slate-200 p-1.5 rounded-[2.2rem] mb-8 w-fit mx-auto sm:mx-0 border border-slate-300 shadow-inner">
        <button 
          onClick={() => setActiveTab('RETAIL')}
          className={`flex items-center gap-3 px-8 py-3 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${
            activeTab === 'RETAIL' 
              ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag size={16} className={activeTab === 'RETAIL' ? 'text-indigo-600' : 'text-slate-400'} />
          Productos de Venta
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'RETAIL' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-300 text-slate-700'
          }`}>
            {products.filter(p => p.usage === 'RETAIL').length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('INTERNAL')}
          className={`flex items-center gap-3 px-8 py-3 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${
            activeTab === 'INTERNAL' 
              ? 'bg-white text-amber-600 shadow-md ring-1 ring-black/5' 
              : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'
          }`}
        >
          <Beaker size={16} className={activeTab === 'INTERNAL' ? 'text-amber-600' : 'text-slate-400'} />
          Insumos Profesionales
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'INTERNAL' ? 'bg-amber-50 text-amber-700' : 'bg-slate-300 text-slate-700'
          }`}>
            {products.filter(p => p.usage === 'INTERNAL').length}
          </span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" placeholder="Busca por nombre o SKU..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Producto</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SKU</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Finanzas</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Disponibilidad</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="opacity-20 mb-4"><Package size={64} className="mx-auto" /></div>
                    <p className="text-slate-400 font-medium">No se encontraron productos en esta categoría.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{product.name}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{product.category}</div>
                    </td>
                    <td className="px-8 py-5 text-xs text-slate-500 font-mono font-bold">{product.sku}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-black text-slate-900">
                        {product.usage === 'RETAIL' ? `$${product.price.toFixed(2)}` : 'Insumo'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">Costo: ${product.cost.toFixed(2)}</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-black transition-all ${
                        product.stock === 0 ? 'bg-rose-100 text-rose-700' :
                        product.stock <= product.minStock ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => handleRestock(product)} 
                          className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                          title="Reabastecer"
                         >
                           <RefreshCw size={18} />
                         </button>
                         <button 
                          onClick={() => handleClone(product)} 
                          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                          title="Clonar Producto"
                         >
                           <Copy size={18} />
                         </button>
                         <button 
                          onClick={() => handleEdit(product)} 
                          className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                          title="Editar"
                         >
                           <Edit2 size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InventoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProduct} 
        mode={modalMode} 
        initialData={selectedProduct} 
      />
    </div>
  );
};
