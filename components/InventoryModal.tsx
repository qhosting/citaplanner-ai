import React, { useState, useEffect } from 'react';
import { X, Package, RefreshCw, Calculator, AlertTriangle } from 'lucide-react';
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
    status: 'ACTIVE'
  });

  const [restockAmount, setRestockAmount] = useState(0);

  useEffect(() => {
    if (initialData && (mode === 'edit' || mode === 'restock')) {
      setFormData(initialData);
    } else {
      // Reset for create mode
      setFormData({
        name: '',
        sku: generateSKU(),
        category: 'General',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        status: 'ACTIVE'
      });
      setRestockAmount(0);
    }
  }, [initialData, mode, isOpen]);

  // Generador de SKU simple
  const generateSKU = (name: string = '') => {
    const prefix = name ? name.substring(0, 3).toUpperCase() : 'PRD';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  };

  // Cálculo de Margen
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
        // Use Date + Math.random fallback for non-secure contexts
        id: initialData?.id || (Date.now().toString(36) + Math.random().toString(36).substring(2)),
        ...(formData as Omit<Product, 'id'>)
      };
      
      // Auto-generate SKU if empty logic could go here, strictly ensured above though
    }

    onSave(productToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${mode === 'restock' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {mode === 'restock' ? <RefreshCw size={20} /> : <Package size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">
                {mode === 'create' && 'Nuevo Producto'}
                {mode === 'edit' && 'Editar Producto'}
                {mode === 'restock' && 'Reabastecer Inventario'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'restock' ? 'Añade unidades al stock existente' : 'Gestiona los detalles del producto'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          
          {mode === 'restock' ? (
             <div className="space-y-6">
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                 <h4 className="font-medium text-slate-700">{formData.name}</h4>
                 <div className="flex gap-4 mt-2 text-sm text-slate-600">
                   <span>SKU: {formData.sku}</span>
                   <span>Stock Actual: <strong>{formData.stock}</strong></span>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Cantidad a Ingresar</label>
                 <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1"
                      required
                      className="flex-1 p-3 border border-slate-300 rounded-lg text-lg font-bold text-slate-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
                      value={restockAmount}
                      onChange={(e) => setRestockAmount(Number(e.target.value))}
                    />
                    <div className="text-slate-400">
                      Nuevo Total: <strong>{(formData.stock || 0) + restockAmount}</strong>
                    </div>
                 </div>
               </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información General */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name, 
                      // Solo sugerir SKU si estamos creando y el SKU está vacío o es default
                      sku: mode === 'create' ? generateSKU(name) : prev.sku 
                    }));
                  }}
                  placeholder="Ej: Shampoo Profesional 500ml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Código)</label>
                <div className="flex">
                  <input
                    required
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm uppercase"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, sku: generateSKU(formData.name)})}
                    className="px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg hover:bg-slate-200 text-slate-600"
                    title="Regenerar SKU"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="General">General</option>
                  <option value="Cabello">Cabello</option>
                  <option value="Rostro">Rostro</option>
                  <option value="Cuerpo">Cuerpo</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>

              {/* Precios y Costos */}
              <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calculator size={14} /> Finanzas
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                {/* Margen Indicator */}
                <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-600">Margen de Ganancia:</span>
                  <span className={`font-bold ${margin >= 30 ? 'text-green-600' : margin > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Inventario */}
              <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Package size={14} /> Control de Stock
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alerta Stock Bajo</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Se mostrará alerta cuando el stock sea menor a este número.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.status === 'ACTIVE'}
                    onChange={(e) => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Producto Activo (Visible en POS)</span>
                </label>
              </div>

            </div>
          )}

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-white rounded-lg font-medium shadow-sm transition-all ${
                mode === 'restock' 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {mode === 'restock' ? 'Confirmar Ingreso' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};