import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useDeferredValue } from 'react'
import { useDebounce } from './hooks/useDebounce'
import { LeftList } from './components/LeftList'
import { RightList } from './components/RightList'
import { Footer } from './components/Footer'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const [newId, setNewId] = useState('')

  const debouncedLeftSearch = useDebounce(leftSearch, 300)
  const debouncedRightSearch = useDebounce(rightSearch, 300)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <div className="app-container">
          
          {/* Заголовок */}
          <header className="app-header">
            <h1>Менеджер элементов</h1>
            <p>Выбирайте и сортируйте из 1 000 000 элементов</p>
          </header>

          {/* Две колонки */}
          <div className="columns">
            
            {/* Левая колонка */}
            <div className="column left-column">
              <div className="column-header">
                <h2>
                  Доступные
                  <span className="count">1М элементов</span>
                </h2>
              </div>
              
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Фильтр по ID..."
                  value={leftSearch}
                  onChange={(e) => setLeftSearch(e.target.value)}
                />
              </div>

              <div className="add-form">
                <input
                  type="text"
                  placeholder="Новый ID (например, 1000001)"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                />
                <button>Добавить</button>
              </div>

              <LeftList searchTerm={debouncedLeftSearch} />
              <RightList searchTerm={debouncedRightSearch} />
            </div>

            {/* Правая колонка */}
            <div className="column right-column">
              <div className="column-header">
                <h2>
                  Выбранные
                  <span className="count">0 элементов</span>
                </h2>
              </div>
              
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Фильтр выбранных..."
                  value={rightSearch}
                  onChange={(e) => setRightSearch(e.target.value)}
                />
              </div>

              <RightList searchTerm={rightSearch} />
            </div>
          </div>

          {/* Футер */}
          <Footer />
        </div>
      </div>
      
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}

export default App