/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Pill, Sparkles, Check, Package, X } from 'lucide-react';
import MonoTag from '../ui/MonoTag';
import { cn } from '../../lib/utils';

const DOSAGE_OPTIONS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Ointment',
  'Gel',
  'Drops',
  'Inhaler',
  'Patch',
  'Device',
  'Other'
];

export default function ProductListManager({
  products = [],
  productNames = [],
  onChange
}) {
  // Normalize initial products
  const normalizedProducts = React.useMemo(() => {
    if (Array.isArray(products) && products.length > 0) {
      return products;
    }
    if (Array.isArray(productNames) && productNames.length > 0) {
      return productNames.map(name => ({
        id: Math.random().toString(36).substring(2, 9),
        name: typeof name === 'string' ? name : (name.name || 'Product'),
        molecule: typeof name === 'object' ? (name.molecule || '') : '',
        dosageForm: typeof name === 'object' ? (name.dosageForm || 'Tablet') : 'Tablet'
      }));
    }
    return [];
  }, [products, productNames]);

  const [items, setItems] = useState(normalizedProducts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newMolecule, setNewMolecule] = useState('');
  const [newDosageForm, setNewDosageForm] = useState('Tablet');

  const emitChange = (newItems) => {
    setItems(newItems);
    const names = newItems.map(p => p.name).filter(Boolean);
    onChange?.({
      products: newItems,
      productNames: names
    });
  };

  const handleAddProduct = (e) => {
    e?.preventDefault();
    const trimmedName = newProductName.trim();
    if (!trimmedName) return;

    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: trimmedName,
      molecule: newMolecule.trim(),
      dosageForm: newDosageForm || 'Tablet'
    };

    const updated = [...items, newItem];
    emitChange(updated);

    // Reset form
    setNewProductName('');
    setNewMolecule('');
    setNewDosageForm('Tablet');
    setShowAddForm(false);
  };

  const handleRemove = (idToRemove) => {
    const updated = items.filter(item => item.id !== idToRemove);
    emitChange(updated);
  };

  return (
    <div className="space-y-3 font-sans">
      
      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold block px-0.5">
            Detailing Portfolio ({items.length} Products)
          </span>
          <span className="text-[0.625rem] text-ink-soft px-0.5">
            Brands and molecules you detail to doctors
          </span>
        </div>

        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-[0.75rem] text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Add New Product Inline Form */}
      {showAddForm && (
        <div className="p-4 bg-white rounded-[1.25rem] border-2 border-navy-900 shadow-md space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-xs text-ink">Add Product to Portfolio</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 text-ink-mute hover:text-ink rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                Brand / Product Name *
              </label>
              <input
                type="text"
                required
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g. Calcipime-D, Telma-H, Rosuvas"
                className="w-full bg-cream-50/80 focus:bg-white border border-line focus:border-navy-900 rounded-[0.75rem] px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all placeholder:text-ink-mute"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                Molecule / Active Salt (Optional)
              </label>
              <input
                type="text"
                value={newMolecule}
                onChange={(e) => setNewMolecule(e.target.value)}
                placeholder="e.g. Calcium Citrate Maleate 250mg + Vit D3"
                className="w-full bg-cream-50/80 focus:bg-white border border-line focus:border-navy-900 rounded-[0.75rem] px-3.5 py-2 text-xs font-medium text-ink outline-none transition-all placeholder:text-ink-mute"
              />
            </div>

            <div>
              <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                Dosage Form
              </label>
              <div className="flex flex-wrap gap-1">
                {DOSAGE_OPTIONS.map((form) => (
                  <button
                    key={form}
                    type="button"
                    onClick={() => setNewDosageForm(form)}
                    className={cn(
                      "px-2.5 py-1 rounded-[0.5rem] text-[0.6875rem] font-medium transition-colors",
                      newDosageForm === form
                        ? "bg-navy-900 text-white font-bold"
                        : "bg-cream-100 text-ink-soft hover:bg-cream-200"
                    )}
                  >
                    {form}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-ink-soft hover:text-ink transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddProduct}
              disabled={!newProductName.trim()}
              className="px-4 py-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white rounded-[0.75rem] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Product</span>
            </button>
          </div>
        </div>
      )}

      {/* List of Products */}
      {items.length === 0 ? (
        <div className="p-4 bg-cream-50/60 rounded-[1rem] border border-line border-dashed text-center">
          <p className="text-xs text-ink-mute font-medium">
            No products added yet. Tap "+ Add Product" to add the brands you detail.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white hover:bg-cream-50/40 rounded-[1rem] border border-line flex items-center justify-between gap-3 shadow-2xs transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-[0.625rem] bg-navy-100 text-navy-900 flex items-center justify-center font-bold flex-shrink-0">
                  <Pill className="w-4 h-4 text-navy-800" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-xs text-ink truncate">{item.name}</h5>
                    <span className="text-[0.625rem] font-mono px-2 py-0.5 rounded-full bg-cream-100 text-ink-soft border border-line font-medium">
                      {item.dosageForm || 'Tablet'}
                    </span>
                  </div>
                  {item.molecule && (
                    <p className="text-[0.6875rem] text-ink-mute truncate mt-0.5">
                      {item.molecule}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-1.5 text-ink-mute hover:text-coral-600 hover:bg-coral-50 rounded-[0.5rem] transition-colors flex-shrink-0"
                title="Remove product"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
