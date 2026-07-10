import { useState, useEffect } from 'react';
import { useSheetStore } from '../store/sheetStore.js';
import { apiFetch, API_BASE } from '../store/api.js';
import { TAX_RATE, TAX_RATE_LABEL, type Quote } from '@sheetflow/shared';
import { useCustomers } from '../hooks/useCustomers.js';
import { useInventory } from '../hooks/useInventory.js';
import { Plus, Trash2, FileText, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader.js';
import AnimatedSection from './AnimatedSection.js';

export default function QuoteGenerator() {
  const { createQuote, updateQuote, editingQuoteId, setEditingQuote } = useSheetStore();
  const { data: customers = [] } = useCustomers();
  const { data: inventory = [] } = useInventory();

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number; name: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState<string[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // Load quote data when editing
  useEffect(() => {
    if (!editingQuoteId) {
      setCustomerId(''); // eslint-disable-line
      setItems([]);
      setNotes('');
      setValidUntil('');
      return;
    }

    const loadQuote = async () => {
      setLoadingQuote(true);
      try {
        const quote = await apiFetch<Quote>(`${API_BASE}/quotes/${editingQuoteId}`);
        setCustomerId(quote.customerId);
        setNotes(quote.notes ?? '');
        setValidUntil(quote.validUntil ? new Date(quote.validUntil).toISOString().slice(0, 10) : '');
        setItems(quote.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        })));
      } catch {
        useSheetStore.getState().addToast('Failed to load quote', 'error');
      } finally {
        setLoadingQuote(false);
      }
    };
    loadQuote();
  }, [editingQuoteId]);

  // Add empty item line
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', quantity: 1, unitPrice: 0, name: '' },
    ]);
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Select product in line item
  const handleProductChange = (index: number, productId: string) => {
    const product = inventory.find((p) => p.id === productId);
    if (!product) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        productId,
        name: product.name,
        quantity: copy[index].quantity,
        unitPrice: Number(product.price),
      };
      return copy;
    });
  };

  // Change quantity or unit price
  const handleNumberChange = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  // Calculate dynamic totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) return;

    // Validate product fields
    const invalidItem = items.some((item) => !item.productId || item.quantity <= 0 || item.unitPrice <= 0);
    if (invalidItem) return;

    setSubmitting(true);
    try {
      if (editingQuoteId) {
        await updateQuote(editingQuoteId, {
          customerId,
          items,
          notes: notes || null,
          validUntil: validUntil || null,
          total: total,
        });
      } else {
        await createQuote({
          customerId,
          items,
          status: 'Draft',
          notes: notes || null,
          validUntil: validUntil || null,
          total: total,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCustomerId('');
        setItems([]);
        setNotes('');
        setValidUntil('');
        setEditingQuote(null);
      }, 1500);
    } catch {
      // handled by store toasts
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white">
            {editingQuoteId ? 'Edit Quote' : 'Create New Quote'}
          </h1>
          <p className="text-slate-400 mt-2">
            {editingQuoteId ? 'Modify an existing quote and save changes.' : 'Compile products, assign clients, and calculate total values.'}
          </p>
        </div>
        {editingQuoteId && (
          <button
            onClick={() => {
              setEditingQuote(null);
              setCustomerId('');
              setItems([]);
            }}
            className="text-sm text-slate-400 hover:text-white px-3 py-1.5 border border-slate-800 rounded-xl transition-colors"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {loadingQuote ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <SkeletonLoader variant="table-row" count={4} />
          </div>
          <div className="glass-panel p-6 rounded-2xl h-fit">
            <SkeletonLoader variant="card" count={1} />
          </div>
        </div>
      ) : (
      <AnimatedSection className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Client / Customer</label>
            <input
              type="text"
              placeholder="Search customers..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500 mb-2"
            />
            <select
              required
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setCustomerSearch(''); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">Select a Customer...</option>
              {customers
                .filter((c) => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.company?.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-300">Line Items</label>
              <motion.button
                type="button"
                onClick={handleAddItem}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </motion.button>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                    No items added yet. Click "Add Item" to begin.
                  </div>
                ) : (
                  items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className="grid grid-cols-12 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-900"
                    >
                      {/* Product Selector */}
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearch[index] || ''}
                          onChange={(e) => {
                            const copy = [...productSearch];
                            copy[index] = e.target.value;
                            setProductSearch(copy);
                          }}
                          className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                        />
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => { handleProductChange(index, e.target.value); const copy = [...productSearch]; copy[index] = ''; setProductSearch(copy); }}
                          className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                        >
                          <option value="">Select Product...</option>
                          {inventory
                            .filter((p) => !productSearch[index] || p.name.toLowerCase().includes(productSearch[index].toLowerCase()) || p.sku.toLowerCase().includes(productSearch[index].toLowerCase()))
                            .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ${Number(p.price).toFixed(2)} ({p.stock} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Qty"
                          value={item.quantity || ''}
                          onChange={(e) => handleNumberChange(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 font-mono"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-5 sm:col-span-3">
                        <input
                          type="number"
                          required
                          step="0.01"
                          placeholder="Price"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleNumberChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 font-mono"
                        />
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 sm:col-span-2 flex justify-center items-center">
                        <motion.button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          whileHover={{ scale: 1.2, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                          whileTap={{ scale: 0.8 }}
                          className="p-2 text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* Valid Until */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Valid Until <span className="text-slate-500 font-normal">(optional)</span></label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500 [color-scheme:dark]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Notes <span className="text-slate-500 font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes, special instructions..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </form>

        {/* Totals Summary Panel */}
        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
          <h2 className="text-xl font-display font-semibold text-white">Summary</h2>
          
          <div className="divide-y divide-slate-800/60 space-y-4">
            {/* Calculation rows */}
            <div className="space-y-2 text-sm text-slate-400 pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{TAX_RATE_LABEL}</span>
                <span className="font-mono text-slate-200">${tax.toFixed(2)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between text-base font-semibold text-white pt-4">
              <span>Total Quote Value</span>
              <span className="font-mono text-brand-400 text-lg">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit button with Morph transition */}
          <motion.button
            type="submit"
            onClick={handleSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!customerId || items.length === 0 || submitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 relative shadow-lg disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none
              ${success 
                ? 'bg-emerald-500 shadow-emerald-500/20 text-white' 
                : 'bg-brand-500 shadow-brand-500/20 hover:bg-brand-600 text-white'}
            `}
          >
            {submitting ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Loader2 size={18} className="animate-spin" />
                <span>Validating...</span>
              </motion.div>
            ) : success ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className="flex items-center gap-2"
              >
                <Check size={18} />
                <span>Saved!</span>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <FileText size={18} />
                <span>{editingQuoteId ? 'Update Quote' : 'Create Quote'}</span>
              </motion.div>
            )}
          </motion.button>
        </div>
      </AnimatedSection>
      )}
    </div>
  );
}
