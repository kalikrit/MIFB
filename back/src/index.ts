import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

// Минимальный CORS - ничего лишнего
app.use((req, res, next) => {
  // Жестко задаем origin
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Отвечаем на preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  
  next()
})

app.get('/api/left', (req, res) => {
  res.json({
    items: Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })),
    total: 1000000,
    hasMore: true,
    nextOffset: 20
  })
})

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})