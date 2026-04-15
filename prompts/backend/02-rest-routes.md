# Prompt: REST API Routes

## Description
Create RESTful API routes for CRUD operations with proper error handling and validation.

---

## The Prompt

```
Create Express router for [RESOURCE] (e.g., encounters, stock, protocols) with:
1. GET / - List all items (with pagination)
2. GET /:id - Get single item by ID
3. POST / - Create new item
4. PUT /:id - Update existing item
5. DELETE /:id - Delete item
6. Proper HTTP status codes (200, 201, 400, 404, 500)
7. Input validation
8. Error handling with meaningful messages
9. Use async/await pattern
10. Import database helpers from db module

Return JSON responses with consistent structure.
```

---

## Expected Output

### api/src/routes/encounters.js
```javascript
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  createEncounter, 
  getEncounter, 
  listEncounters 
} from '../db/index.js';

const router = Router();

// List encounters
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const encounters = listEncounters(limit);
    
    res.json({
      encounters,
      count: encounters.length
    });
  } catch (err) {
    next(err);
  }
});

// Get single encounter
router.get('/:id', async (req, res, next) => {
  try {
    const encounter = getEncounter(req.params.id);
    
    if (!encounter) {
      return res.status(404).json({ 
        error: 'Encounter not found' 
      });
    }
    
    res.json(encounter);
  } catch (err) {
    next(err);
  }
});

// Create encounter
router.post('/', async (req, res, next) => {
  try {
    const { patientAge, patientSex, symptoms, vitals } = req.body;
    
    // Validation
    if (!patientAge || patientAge < 0) {
      return res.status(400).json({ 
        error: 'Valid patient age is required' 
      });
    }
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ 
        error: 'At least one symptom is required' 
      });
    }
    
    const id = uuidv4();
    
    createEncounter({
      id,
      patientAge,
      patientAgeUnit: req.body.patientAgeUnit || 'years',
      patientSex: patientSex || 'unknown',
      symptoms,
      vitals: vitals || {},
      guidance: null,
      redFlags: []
    });
    
    const encounter = getEncounter(id);
    
    res.status(201).json(encounter);
  } catch (err) {
    next(err);
  }
});

// Update encounter (for adding guidance)
router.put('/:id', async (req, res, next) => {
  try {
    const existing = getEncounter(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ 
        error: 'Encounter not found' 
      });
    }
    
    // Update logic here (if needed)
    // For now, encounters are immutable after creation
    
    res.json(existing);
  } catch (err) {
    next(err);
  }
});

export default router;
```

### api/src/routes/stock.js
```javascript
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  upsertStockItem,
  getStockItem,
  listStockItems,
  updateStockQuantity,
  getLowStockItems
} from '../db/index.js';

const router = Router();

// List all stock items
router.get('/', async (req, res, next) => {
  try {
    const items = listStockItems();
    const lowStock = getLowStockItems();
    
    res.json({
      items,
      count: items.length,
      lowStockCount: lowStock.length
    });
  } catch (err) {
    next(err);
  }
});

// Get low stock alerts
router.get('/alerts', async (req, res, next) => {
  try {
    const alerts = getLowStockItems();
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

// Get single item
router.get('/:id', async (req, res, next) => {
  try {
    const item = getStockItem(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Create or update stock item
router.post('/', async (req, res, next) => {
  try {
    const { name, category, quantity, unit, minQuantity } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    
    const id = req.body.id || uuidv4();
    
    upsertStockItem({
      id,
      name: name.trim(),
      category,
      quantity: Math.max(0, parseInt(quantity) || 0),
      unit,
      minQuantity: parseInt(minQuantity) || 10
    });
    
    const item = getStockItem(id);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// Update quantity only
router.patch('/:id/quantity', async (req, res, next) => {
  try {
    const item = getStockItem(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const { quantity, delta } = req.body;
    let newQuantity;
    
    if (typeof delta === 'number') {
      newQuantity = Math.max(0, item.quantity + delta);
    } else if (typeof quantity === 'number') {
      newQuantity = Math.max(0, quantity);
    } else {
      return res.status(400).json({ 
        error: 'Provide quantity or delta' 
      });
    }
    
    updateStockQuantity(req.params.id, newQuantity);
    
    res.json(getStockItem(req.params.id));
  } catch (err) {
    next(err);
  }
});

export default router;
```

---

## Response Structure Patterns

### Success - Single Item
```json
{
  "id": "uuid",
  "name": "item name",
  "...": "other fields"
}
```

### Success - List
```json
{
  "items": [...],
  "count": 42,
  "page": 1,
  "totalPages": 5
}
```

### Error
```json
{
  "error": "Human readable message",
  "code": "VALIDATION_ERROR",
  "details": { "field": "specific issue" }
}
```

---

## Variations

### With Pagination
```
Add cursor-based pagination to the list endpoint. Accept 'cursor' and 'limit' query params, return 'nextCursor' in response.
```

### With Search
```
Add a search endpoint that accepts a 'q' query parameter and searches across multiple fields.
```

### With Audit Log
```
Add middleware that logs all mutations (POST, PUT, DELETE) to an audit_log table with timestamp and user info.
```
