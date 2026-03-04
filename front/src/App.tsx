import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useMemo } from 'react'
import { useDebounce } from './hooks/useDebounce'
import { useActionQueue } from './hooks/useActionQueue'
import { useAddItem } from './hooks/useAddItem'
import { LeftList } from './components/LeftList'
import { RightList } from './components/RightList'
import { Footer } from './components/Footer'
import { validateNewId } from './utils/validation'
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

// Внутренний компонент с доступом к queryClient
function AppContent() {
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const [newId, setNewId] = useState('')
  const [newIdError, setNewIdError] = useState<string | null>(null)
  const [selectedCount, setSelectedCount] = useState(0)
  
  const { addAction } = useActionQueue(queryClient)
  const { addItem, isPending, error: addError } = useAddItem()
  
  const debouncedLeftSearch = useDebounce(leftSearch, 300)
  const debouncedRightSearch = useDebounce(rightSearch, 300)
  
  // Получаем текущий максимальный ID из кэша
  const maxId = useMemo(() => {
    const data = queryClient.getQueryData<{ pages: any[] }>(['left-items', ''])
    if (data?.pages && data.pages.length > 0) {
      const allItems = data.pages.flatMap((page: any) => page.items || [])
      if (allItems.length > 0) {
        const max = Math.max(...allItems.map((item: any) => item.id))
        return max
      }
    }
    return 1000000
  }, [queryClient])
  
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateNewId(newId, maxId)
    if (!validation.valid) {
      setNewIdError(validation.error || null)
      return
    }
    
    addItem(parseInt(newId))
    setNewId('')
    setNewIdError(null)
  }
  
  return (
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

            {/* Форма добавления нового элемента */}
            <form className="add-form" onSubmit={handleAddItem}>
              <input
                type="text"
                placeholder="Новый ID (например, 1000001)"
                value={newId}
                onChange={(e) => {
                  setNewId(e.target.value)
                  setNewIdError(null)
                }}
                disabled={isPending}
              />
              <button 
                type="submit"
                disabled={isPending || !newId.trim()}
              >
                {isPending ? 'Добавление...' : 'Добавить'}
              </button>
            </form>
            
            {/* Ошибки валидации */}
            {newIdError && (
              <div className="error-message" style={{ padding: '0 16px 12px' }}>
                ⚠️ {newIdError}
              </div>
            )}
            {addError && (
              <div className="error-message" style={{ padding: '0 16px 12px' }}>
                ⚠️ {addError}
              </div>
            )}

            <LeftList 
              searchTerm={debouncedLeftSearch} 
              addAction={addAction} 
            />
          </div>

          {/* Правая колонка */}
          <div className="column right-column">
            <div className="column-header">
              <h2>
                Выбранные
                <span className="count">{selectedCount} элементов</span>
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
            
            <RightList 
              searchTerm={debouncedRightSearch} 
              onTotalChange={setSelectedCount}
              addAction={addAction} 
            />
          </div>
        </div>

        {/* Футер */}
        <Footer />
      </div>
    </div>
  )
}

// Главный компонент с провайдером
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}

export default App