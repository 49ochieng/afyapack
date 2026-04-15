# Lesson 10: Stock Tracking

> Implement medicine inventory management with low-stock alerts.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 30 minutes |
| **Objective** | Build inventory tracking with CRUD operations |
| **Output** | Working stock management page with alerts |
| **Prerequisites** | Lesson 09 (Red flag engine complete) |
| **Files/Folders** | `api/src/routes/stock.js`, `web/src/app/stock/` |

---

## What We're Building

```
┌─────────────────────────────────────────────────┐
│  Stock Management              [+ Add Item]     │
├─────────────────────────────────────────────────┤
│  ⚠️ 3 items are low on stock                    │
├─────────────────────────────────────────────────┤
│  Item            Category    Stock   Status     │
│  ─────────────────────────────────────────────  │
│  ORS Sachets     Fluids      45      ✓ OK      │
│  ACT (Adult)     Antimalarial 8      ⚠️ LOW    │
│  Paracetamol     Analgesic   120     ✓ OK      │
│  Amoxicillin     Antibiotic  3       🔴 CRITICAL│
│  Zinc Tablets    Supplement   15     ✓ OK      │
└─────────────────────────────────────────────────┘
```

---

## Step 1: Create Stock Route

Create file `api/src/routes/stock.js`:

### Copilot Prompt

```
@workspace Create an Express router for /api/stock with:
- GET / - List all stock items with low_stock flag
- GET /:id - Get single item
- POST / - Create new item (name, category, quantity, unit, reorder_level)
- PUT /:id - Update item (quantity, reorder_level)
- GET /low - List only items below reorder level
- Calculate days_until_empty estimation
```

### Expected Code

```javascript
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/index');

const router = express.Router();

// List all stock items
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const items = db.prepare(`
      SELECT *, 
        CASE WHEN quantity <= reorder_level THEN 1 ELSE 0 END as low_stock,
        CASE WHEN quantity <= reorder_level * 0.5 THEN 'critical'
             WHEN quantity <= reorder_level THEN 'low'
             ELSE 'ok' END as status
      FROM stock_items 
      ORDER BY low_stock DESC, name ASC
    `).all();
    
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get low stock items only
router.get('/low', (req, res) => {
  try {
    const db = getDB();
    const items = db.prepare(`
      SELECT *,
        CASE WHEN quantity <= reorder_level * 0.5 THEN 'critical' ELSE 'low' END as status
      FROM stock_items 
      WHERE quantity <= reorder_level
      ORDER BY quantity ASC
    `).all();
    
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single item
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const item = db.prepare('SELECT * FROM stock_items WHERE id = ?').get(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new item
router.post('/', (req, res) => {
  try {
    const { name, category, quantity = 0, unit, reorder_level = 10 } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const id = uuidv4();
    const db = getDB();
    
    db.prepare(`
      INSERT INTO stock_items (id, name, category, quantity, unit, reorder_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, category, quantity, unit, reorder_level);
    
    res.status(201).json({ id, name, category, quantity, unit, reorder_level });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update item
router.put('/:id', (req, res) => {
  try {
    const { quantity, reorder_level, name, category, unit } = req.body;
    const db = getDB();
    
    const existing = db.prepare('SELECT * FROM stock_items WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    db.prepare(`
      UPDATE stock_items 
      SET quantity = ?, reorder_level = ?, name = ?, category = ?, unit = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      quantity ?? existing.quantity,
      reorder_level ?? existing.reorder_level,
      name ?? existing.name,
      category ?? existing.category,
      unit ?? existing.unit,
      req.params.id
    );
    
    const updated = db.prepare('SELECT * FROM stock_items WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Adjust quantity (add/remove)
router.post('/:id/adjust', (req, res) => {
  try {
    const { adjustment, reason } = req.body; // adjustment can be positive or negative
    const db = getDB();
    
    const item = db.prepare('SELECT * FROM stock_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const newQuantity = Math.max(0, item.quantity + adjustment);
    
    db.prepare(`
      UPDATE stock_items 
      SET quantity = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newQuantity, req.params.id);
    
    console.log(`[Stock] ${item.name}: ${item.quantity} → ${newQuantity} (${adjustment > 0 ? '+' : ''}${adjustment}) - ${reason || 'No reason'}`);
    
    res.json({ ...item, quantity: newQuantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

Wire up in `api/src/index.js`:
```javascript
const stockRouter = require('./routes/stock');
app.use('/api/stock', stockRouter);
```

---

## Step 2: Seed Default Stock Items

Add to `api/src/db/seed.js`:

```javascript
// Seed stock items
function seedStock() {
  const db = getDB();
  
  const count = db.prepare('SELECT COUNT(*) as count FROM stock_items').get();
  if (count.count > 0) return;
  
  const items = [
    { name: 'ORS Sachets', category: 'Fluids', quantity: 45, unit: 'sachets', reorder_level: 20 },
    { name: 'Zinc Tablets (20mg)', category: 'Supplements', quantity: 60, unit: 'tablets', reorder_level: 30 },
    { name: 'ACT Adult', category: 'Antimalarial', quantity: 24, unit: 'courses', reorder_level: 20 },
    { name: 'ACT Child', category: 'Antimalarial', quantity: 8, unit: 'courses', reorder_level: 15 },
    { name: 'Paracetamol 500mg', category: 'Analgesic', quantity: 120, unit: 'tablets', reorder_level: 50 },
    { name: 'Paracetamol Syrup', category: 'Analgesic', quantity: 6, unit: 'bottles', reorder_level: 5 },
    { name: 'Amoxicillin 250mg', category: 'Antibiotic', quantity: 3, unit: 'courses', reorder_level: 10 },
    { name: 'Cotrimoxazole', category: 'Antibiotic', quantity: 15, unit: 'courses', reorder_level: 10 },
    { name: 'Gentian Violet', category: 'Topical', quantity: 4, unit: 'bottles', reorder_level: 3 },
    { name: 'Chlorhexidine', category: 'Topical', quantity: 8, unit: 'bottles', reorder_level: 5 },
  ];
  
  const stmt = db.prepare(`
    INSERT INTO stock_items (id, name, category, quantity, unit, reorder_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  items.forEach(item => {
    stmt.run(
      require('uuid').v4(),
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.reorder_level
    );
  });
  
  console.log(`[Seed] Added ${items.length} stock items`);
}

// Call in init
module.exports = { seedProtocols, seedStock };
```

---

## Step 3: Create Stock Page

Create file `web/src/app/stock/page.js`:

### Copilot Prompt

```
@workspace Create a Next.js stock management page with:
- Table showing all items with status badges
- Low stock alert banner at top
- Quantity adjustment buttons (+/-)
- Modal for adding new item
- Color-coded status: green=ok, yellow=low, red=critical
```

### Expected Code

```jsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Plus, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
  ok: { label: 'In Stock', color: 'bg-green-100 text-green-700' },
  low: { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

export default function StockPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stock`);
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch stock:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  const adjustQuantity = async (id, adjustment) => {
    try {
      await fetch(`${API_URL}/api/stock/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment }),
      });
      fetchItems();
    } catch (err) {
      console.error('Failed to adjust:', err);
    }
  };
  
  const lowStockItems = items.filter(i => i.status !== 'ok');
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Stock Management</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchItems}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>
      
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-yellow-50 border-yellow-200 p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                {lowStockItems.length} item(s) need restocking
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge 
                  key={item.id} 
                  variant={item.status === 'critical' ? 'destructive' : 'secondary'}
                >
                  {item.name}: {item.quantity} {item.unit}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Stock Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Item</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-center p-4 font-medium">Quantity</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => {
                const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.ok;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        Reorder at: {item.reorder_level} {item.unit}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{item.category}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-lg font-semibold">{item.quantity}</span>
                      <span className="text-gray-500 ml-1">{item.unit}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => adjustQuantity(item.id, -1)}
                          disabled={item.quantity === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => adjustQuantity(item.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Add Item Form (simplified) */}
      {showAddForm && (
        <AddItemModal 
          onClose={() => setShowAddForm(false)} 
          onAdd={fetchItems} 
        />
      )}
    </div>
  );
}

function AddItemModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '', category: '', quantity: 0, unit: '', reorder_level: 10
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      onAdd();
      onClose();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-md m-4">
        <h2 className="text-xl font-semibold mb-4">Add Stock Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Item name"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <Input
            placeholder="Category (e.g., Antimalarial)"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
            />
            <Input
              placeholder="Unit (tablets, bottles)"
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
            />
          </div>
          <Input
            type="number"
            placeholder="Reorder level"
            value={formData.reorder_level}
            onChange={e => setFormData({...formData, reorder_level: parseInt(e.target.value)})}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Item
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
```

---

## Validation Checklist

- [ ] Stock table loads with items
- [ ] Low stock items appear in alert banner
- [ ] Status badges show correct colors
- [ ] +/- buttons adjust quantity
- [ ] Add item modal creates new item
- [ ] Refresh button updates the list

---

## What You Learned

- How to build CRUD operations with Express
- How to implement status calculations in SQL
- How to display tabular data in React
- How to create modal forms
- How to show conditional alerts

---

## Next Step

**Proceed to Lesson 11:** Multilingual Support

You'll add Swahili language support.

---

*Inventory is tracked. Add language support next. →*
