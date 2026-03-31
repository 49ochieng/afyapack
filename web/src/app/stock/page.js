'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { getStock, adjustStock, createStockItem, deleteStockItem } from '@/lib/api';
import { Plus, Minus, Package, AlertTriangle, X, Trash2, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadStock = useCallback(async () => {
    try {
      const data = await getStock();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStock(); }, [loadStock]);

  async function handleAdjust(id, delta) {
    try {
      const updated = await adjustStock(id, delta);
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this item from stock?')) return;
    try {
      await deleteStockItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = items.filter(i => {
    if (filter === 'low')        return i.is_low && !i.is_out;
    if (filter === 'out')        return i.is_out;
    if (filter === 'medicine')   return i.category === 'medicine';
    if (filter === 'consumable') return i.category === 'consumable';
    return true;
  });

  const lowCount = items.filter(i => i.is_low && !i.is_out).length;
  const outCount = items.filter(i => i.is_out).length;

  const FILTERS = [
    { key: 'all',        label: `All (${items.length})` },
    { key: 'low',        label: `Low (${lowCount})` },
    { key: 'out',        label: `Out (${outCount})` },
    { key: 'medicine',   label: 'Medicines' },
    { key: 'consumable', label: 'Supplies' },
  ];

  return (
    <AppShell rightPanel={<RightPanel />}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 lg:px-8 py-8 space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Package size={18} className="text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Tracker</h1>
                  <p className="text-sm text-muted-foreground">
                    {items.length} items
                    {outCount > 0 && ` · ${outCount} out of stock`}
                    {lowCount > 0 && ` · ${lowCount} running low`}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus size={14} />
                Add Item
              </Button>
            </div>
          </motion.div>

          {/* Alert summary */}
          {(outCount > 0 || lowCount > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {outCount > 0 && (
                <AlertCard
                  icon={AlertTriangle}
                  count={outCount}
                  label="items out of stock"
                  color="red"
                />
              )}
              {lowCount > 0 && (
                <AlertCard
                  icon={TrendingDown}
                  count={lowCount}
                  label="items running low"
                  color="amber"
                />
              )}
            </motion.div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150',
                  filter === f.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border text-foreground hover:border-primary/40',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stock list */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="afya-card h-20 skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="afya-card p-10 text-center">
              <Package size={28} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence>
                {filtered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <StockRow item={item} onAdjust={handleAdjust} onDelete={handleDelete} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Add item modal */}
      <AnimatePresence>
        {showAdd && (
          <AddItemModal
            onClose={() => setShowAdd(false)}
            onAdded={item => { setItems(prev => [...prev, item]); setShowAdd(false); }}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function AlertCard({ icon: Icon, count, label, color }) {
  const s = color === 'red'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';
  const ic = color === 'red' ? 'text-red-600' : 'text-amber-600';
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${s}`}>
      <Icon size={18} className={ic} />
      <div>
        <span className="text-lg font-bold">{count}</span>
        <span className="text-sm ml-1.5">{label}</span>
      </div>
    </div>
  );
}

function StockRow({ item, onAdjust, onDelete }) {
  const maxForBar = Math.max(item.low_threshold * 3, item.quantity + 1);
  const pct = Math.min(100, (item.quantity / maxForBar) * 100);

  return (
    <div className={cn(
      'afya-card px-5 py-4 transition-all',
      item.is_out ? 'border-red-200' : item.is_low ? 'border-amber-200' : '',
    )}>
      <div className="flex items-center gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{item.name}</span>
            {item.is_out && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out of stock</span>
            )}
            {!item.is_out && item.is_low && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Low</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
            <span className="text-xs text-muted-foreground">Min: {item.low_threshold} {item.unit}</span>
          </div>
          {/* Stock bar */}
          <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden w-28">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                item.is_out ? 'bg-red-500' : item.is_low ? 'bg-amber-500' : 'bg-emerald-500',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Quantity + controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className={cn(
              'text-xl font-bold',
              item.is_out ? 'text-red-600' : item.is_low ? 'text-amber-600' : 'text-foreground',
            )}>
              {item.quantity}
            </span>
            <p className="text-[10px] text-muted-foreground">{item.unit}</p>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => onAdjust(item.id, 1)}
              className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => onAdjust(item.id, -1)}
              disabled={item.quantity === 0}
              className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 disabled:opacity-40 transition-all"
            >
              <Minus size={12} />
            </button>
          </div>

          <button
            onClick={() => onDelete(item.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', category: 'medicine', quantity: 0, unit: 'units', low_threshold: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleAdd() {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const item = await createStockItem({
        ...form,
        quantity: parseInt(form.quantity) || 0,
        low_threshold: parseInt(form.low_threshold) || 10,
      });
      onAdded(item);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white rounded-2xl border border-border shadow-panel w-full max-w-md p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">Add Stock Item</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{error}</div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Item name *</Label>
            <Input placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="medicine">Medicine</option>
                <option value="consumable">Consumable</option>
                <option value="equipment">Equipment</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input placeholder="tablets, vials…" value={form.unit} onChange={e => set('unit', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Low threshold</Label>
              <Input type="number" min="1" value={form.low_threshold} onChange={e => set('low_threshold', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleAdd} disabled={loading || !form.name.trim()}>
            {loading
              ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              : <Plus size={16} />
            }
            {loading ? 'Adding…' : 'Add Item'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
