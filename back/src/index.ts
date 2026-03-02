import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

app.use((req, res, next) => {
  // Жестко задаем заголовки
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  next()
})

app.get('/api/left', (req, res) => {
  res.json({
    items: [{ id: 1 }, { id: 2 }],
    total: 1000000,
    hasMore: true,
    nextOffset: 20
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})