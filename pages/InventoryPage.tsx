import React, { useState, useMemo } from 'react';
import { Package, Search, Filter, Plus, AlertTriangle, TrendingUp, MoreVertical, RefreshCw, Edit2, Archive } from 'lucide-react';
import { Product } from '../types';
import { InventoryModal } from '../components/InventoryModal';

export const InventoryPage: React.FC = () => {
  // Datos Mock Iniciales
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Shampoo Reparador', sku: 'SHM-001', category: 'Cabello', price: 25.00, cost: 12.50, stock: 45, minStock: 10, status: 'ACTIVE' },
    { id: '2', name: 'Crema Facial Hidratante', sku: 'CRM-204', category: 'Rostro', price: 45.00, cost: 20.00, stock: 8, minStock: 15, status: 'ACTIVE' },
    { id: '3', name: 'Gel Fijador', sku: 'GEL-103', category: 'Cabello', price: 15.00, cost: 5.00, stock: 120, minStock: 20, status: 'ACTIVE' },
    { id: '4', name: 'Kit Tinte Premium', sku: 'KIT-550', category: 'Cabello', price: 35.00, cost: 18.00, stock: 0, minStock: 5, status: 'INACTIVE' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'restock'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  // Estadísticas Calculadas
  const stats = useMemo(() => {
    return {
      totalItems: products.length,
      totalValue: products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0),
      lowStock: products.filter(p => p.stock <= p.minStock && p.status === 'ACTIVE').length,
    };
  }, [products]);

  // Filtros
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handlers
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

  const handleSaveProduct = (product: Product) => {
    if (modalMode === 'create') {
      setProducts([...products, product]);
    } else {
      setProducts(products.map(p => p.id === product.id ? product : p));
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Inventario
          </h1>
          <p className="text-slate-500 mt-1">Gestiona productos, stock y precios.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200"
        >
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase">Total Productos</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalItems}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase">Valor Inventario</p>
            <p className="text-2xl font-bold text-slate-800">${stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-lg ${stats.lowStock > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase">Alertas Stock Bajo</p>
            <p className="text-2xl font-bold text-slate-800">{stats.lowStock}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="w-full md:w-48 pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Precio</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{product.name}</div>
                    {product.stock <= product.minStock && product.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full mt-1">
                        <AlertTriangle size={10} /> Stock Bajo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{product.sku}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 font-medium text-right">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                      product.stock === 0 ? 'bg-red-100 text-red-700' :
                      product.stock <= product.minStock ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`w-2 h-2 rounded-full inline-block ${product.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => handleRestock(product)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Reabastecer"
                       >
                         <RefreshCw size={18} />
                       </button>
                       <button 
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                       >
                         <Edit2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
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