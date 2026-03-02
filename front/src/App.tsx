// front/src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { LeftList } from './components/LeftList'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут
      gcTime: 1000 * 60 * 10, // 10 минут
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const [leftSearch, setLeftSearch] = useState('')
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header className="app-header">
          <h1>🎯 1,000,000 Items Manager</h1>
          <p>Backend: <a href="https://mifb.onrender.com" target="_blank">mifb.onrender.com</a></p>
        </header>
        
        <div className="columns">
          <div className="column left-column">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Filter by ID..."
                value={leftSearch}
                onChange={(e) => setLeftSearch(e.target.value)}
              />
            </div>
            <LeftList searchTerm={leftSearch} />
          </div>
          
          <div className="column right-column">
            <div className="placeholder">
              <h3>Right List (coming soon)</h3>
              <p>Selected items will appear here</p>
            </div>
          </div>
        </div>
      </div>
      
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}

export default App