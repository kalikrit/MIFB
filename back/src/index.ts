import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = process.env.PORT || 3001

// ✅ CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  next()
})

app.use(express.json())

// ============ ХРАНИЛИЩЕ ============
const ITEMS_COUNT = 1_000_000
const allItems = new Map<number, { id: number }>()
for (let i = 1; i <= ITEMS_COUNT; i++) {
  allItems.set(i, { id: i })
}

let selectedItemsOrder: number[] = []
const selectedSet = new Set<number>()

// ============ ВСПОМОГАТЕЛЬНЫЕ ============
// Читаем версию из package.json при старте
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
)
const VERSION = packageJson.version
const COMMIT_HASH = process.env.RENDER_GIT_COMMIT || 'local' // Render передает хеш коммита

const getLeftItems = (search: string, offset: number, limit: number) => {
  let candidates: number[] = []
  
  // Получаем все ID из allItems
  const allIds = Array.from(allItems.keys()).sort((a, b) => a - b)
  
  if (search) {
    for (const id of allIds) {
      if (!selectedSet.has(id) && id.toString().includes(search)) {
        candidates.push(id)
      }
      if (candidates.length >= offset + limit) break
    }
  } else {
    for (const id of allIds) {
      if (!selectedSet.has(id)) {
        candidates.push(id)
      }
    }
  }
  
  const paginated = candidates.slice(offset, offset + limit)
  
  return {
    items: paginated.map(id => ({ id })),
    total: candidates.length,
    hasMore: offset + limit < candidates.length,
    nextOffset: offset + limit
  }
}

const getRightItems = (search: string, offset: number, limit: number) => {
  let candidates = [...selectedItemsOrder]
  
  if (search) {
    candidates = candidates.filter(id => id.toString().includes(search))
  }
  
  const paginated = candidates.slice(offset, offset + limit)
  
  return {
    items: paginated.map(id => ({ id })),
    total: candidates.length,
    hasMore: offset + limit < candidates.length,
    nextOffset: offset + limit,
    fullOrder: search ? null : selectedItemsOrder
  }
}

// ============ API ============
// эндпоинт с версией
app.get('/api/version', (req, res) => {
  res.json({
    version: VERSION,
    commit: COMMIT_HASH,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    itemsCount: allItems.size,
    selectedCount: selectedItemsOrder.length
  })
})

app.get('/api/left', (req, res) => {
  try {
    const search = (req.query.search as string) || ''
    const offset = parseInt(req.query.offset as string) || 0
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    
    res.json(getLeftItems(search, offset, limit))
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/right', (req, res) => {
  try {
    const search = (req.query.search as string) || ''
    const offset = parseInt(req.query.offset as string) || 0
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    
    res.json(getRightItems(search, offset, limit))
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/select', (req, res) => {
  try {
    const { id } = req.body
    
    if (!id || typeof id !== 'number') {
      return res.status(400).json({ error: 'ID must be a number' })
    }
    
    if (!allItems.has(id)) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    if (selectedSet.has(id)) {
      return res.status(409).json({ error: 'Item already selected' })
    }
    
    selectedItemsOrder.push(id)
    selectedSet.add(id)
    
    res.json({ id, selected: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/deselect', (req, res) => {
  try {
    const { id } = req.body
    
    if (!id || typeof id !== 'number') {
      return res.status(400).json({ error: 'ID must be a number' })
    }
    
    if (!selectedSet.has(id)) {
      return res.status(404).json({ error: 'Item not selected' })
    }
    
    selectedItemsOrder = selectedItemsOrder.filter(itemId => itemId !== id)
    selectedSet.delete(id)
    
    res.json({ id, deselected: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/reorder', (req, res) => {
  try {
    const { order } = req.body
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array' })
    }
    
    for (const id of order) {
      if (!allItems.has(id)) {
        return res.status(404).json({ error: `Item ${id} not found` })
      }
      if (!selectedSet.has(id)) {
        return res.status(409).json({ error: `Item ${id} is not selected` })
      }
    }
    
    if (order.length !== selectedSet.size) {
      return res.status(400).json({ error: 'Order must include all selected items' })
    }
    
    selectedItemsOrder = order
    
    res.json({ reordered: true, order })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/items', (req, res) => {
  try {
    const { id } = req.body
    
    if (!id || typeof id !== 'number') {
      return res.status(400).json({ error: 'ID must be a number' })
    }
    
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'ID must be a positive integer' })
    }
    
    if (allItems.has(id)) {
      return res.status(409).json({ error: `Item with ID ${id} already exists` })
    }
    
    const newItem = { id }
    allItems.set(id, newItem)
    
    res.status(201).json(newItem)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/batch', (req, res) => {
  try {
    const { actions } = req.body
    
    if (!Array.isArray(actions)) {
      return res.status(400).json({ error: 'Actions must be an array' })
    }
    
    for (const action of actions) {
      switch (action.type) {
        case 'select':
          if (action.id && !selectedSet.has(action.id) && allItems.has(action.id)) {
            selectedItemsOrder.push(action.id)
            selectedSet.add(action.id)
          }
          break
        case 'deselect':
          if (action.id && selectedSet.has(action.id)) {
            selectedItemsOrder = selectedItemsOrder.filter(id => id !== action.id)
            selectedSet.delete(action.id)
          }
          break
        case 'reorder':
          if (Array.isArray(action.order)) {
            const allExist = action.order.every((id: number) => selectedSet.has(id))
            if (allExist && action.order.length === selectedSet.size) {
              selectedItemsOrder = action.order
            }
          }
          break
      }
    }
    
    res.json({ processed: actions.length })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────┐
│  MIFB Server is running!            │
│  📡 Port: ${PORT}                        │
│  📊 Items: ${allItems.size.toLocaleString()}         │
│  🔗 http://localhost:${PORT}                │
└─────────────────────────────────────┘
  `)
})