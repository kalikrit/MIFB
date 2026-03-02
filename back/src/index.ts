import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

// ТОЛЬКО CORS - больше ничего!
app.use((req, res, next) => {
  // Всегда разрешаем локальный фронт
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  
  next()
})

app.get('/api/left', (req, res) => {
  res.json({
    items: [{ id: 1 }, { id: 2 }, { id: 3 }],
    total: 1000000,
    hasMore: true,
    nextOffset: 20
  })
})

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})