// src/index.ts
import express, { Request, Response } from 'express'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import helmet from 'helmet'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: [
    'http://localhost:5173',     // локальный фронт
    'http://localhost:4173',     // vite preview
    'https://konstantin.github.io', // твой GitHub Pages (позже)
    /\.konstantin\.github\.io$/  // любые поддомены github.io
  ],
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json())

// ============ ХРАНИЛИЩЕ ДАННЫХ ============
const ITEMS_COUNT = 1_000_000

// Генерируем 1,000,000 элементов при старте
console.log('🔄 Generating 1,000,000 items...')
const startTime = Date.now()

const allItems = new Map<number, { id: number }>()
for (let i = 1; i <= ITEMS_COUNT; i++) {
  allItems.set(i, { id: i })
}

// Хранилище для выбранных элементов (общее для всех пользователей)
let selectedItemsOrder: number[] = []
const selectedSet = new Set<number>()

const endTime = Date.now()
console.log(`✅ Generated ${allItems.size.toLocaleString()} items in ${endTime - startTime}ms`)
console.log(`📊 Memory usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`)

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
const getLeftItems = (search: string, offset: number, limit: number) => {
  let candidates: number[] = []
  
  if (search) {
    // Поиск по подстроке (простой, но рабочий)
    for (let id = 1; id <= ITEMS_COUNT; id++) {
      if (!selectedSet.has(id) && id.toString().includes(search)) {
        candidates.push(id)
      }
      if (candidates.length >= offset + limit) break
    }
  } else {
    // Без поиска - все невыбранные
    for (let id = 1; id <= ITEMS_COUNT; id++) {
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
// src/index.ts (продолжение)
    items: paginated.map(id => ({ id })),
    total: candidates.length,
    hasMore: offset + limit < candidates.length,
    nextOffset: offset + limit,
    fullOrder: search ? null : selectedItemsOrder // Полный порядок только без поиска
  }
}

// ============ API ЭНДПОИНТЫ ============

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    itemsCount: allItems.size,
    selectedCount: selectedItemsOrder.length,
    memory: process.memoryUsage().heapUsed / 1024 / 1024
  })
})

// Левый список
app.get('/api/left', (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || ''
    const offset = parseInt(req.query.offset as string) || 0
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    
    const result = getLeftItems(search, offset, limit)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Правый список
app.get('/api/right', (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || ''
    const offset = parseInt(req.query.offset as string) || 0
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    
    const result = getRightItems(search, offset, limit)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Выбор элемента (добавление в правое окно)
app.post('/api/select', (req: Request, res: Response) => {
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

// Отмена выбора (удаление из правого окна)
app.post('/api/deselect', (req: Request, res: Response) => {
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

// Переупорядочивание (Drag & Drop)
app.post('/api/reorder', (req: Request, res: Response) => {
  try {
    const { order } = req.body
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array' })
    }
    
    // Валидация: все ID должны существовать и быть выбранными
    for (const id of order) {
      if (!allItems.has(id)) {
        return res.status(404).json({ error: `Item ${id} not found` })
      }
      if (!selectedSet.has(id)) {
        return res.status(409).json({ error: `Item ${id} is not selected` })
      }
    }
    
    // Проверка: не потеряли ли мы какие-то выбранные элементы
    if (order.length !== selectedSet.size) {
      return res.status(400).json({ error: 'Order must include all selected items' })
    }
    
    selectedItemsOrder = order
    
    res.json({ reordered: true, order })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Добавление нового элемента
app.post('/api/items', (req: Request, res: Response) => {
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

// Batch-эндпоинт для очереди действий
app.post('/api/batch', (req: Request, res: Response) => {
  try {
    const { actions } = req.body
    
    if (!Array.isArray(actions)) {
      return res.status(400).json({ error: 'Actions must be an array' })
    }
    
    console.log(`📦 Received batch with ${actions.length} actions`)
    
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
            // Базовая валидация
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

// ============ ЗАПУСК СЕРВЕРА ============
app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────┐
│  MIFB Server is running!            │
│  📡 Port: ${PORT}                        │
│  📊 Items: ${allItems.size.toLocaleString()}         │
│  🧠 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB    │
│  🔗 http://localhost:${PORT}                │
└─────────────────────────────────────┘
  `)
})