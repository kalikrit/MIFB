import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect } from 'react'
import { api } from '../api/client'
import './LeftList.css'

interface LeftListProps {
  searchTerm: string
  addAction: (action: any) => void 
}

export const LeftList = ({ searchTerm, addAction }: LeftListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Добавляем searchTerm в queryKey и передаём в API
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['left-items', searchTerm], 
    queryFn: ({ pageParam = 0 }) => 
      api.getLeftItems(searchTerm, pageParam, 20),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
  })
  
  const handleSelect = (id: number) => {
    addAction({ type: 'select', id })
  }

  // Склеиваем все страницы в один массив
  const allItems = data?.pages.flatMap(page => page.items) ?? []
  const totalCount = data?.pages[0]?.total ?? 0
  
  // Виртуализация
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length, // +1 для индикатора загрузки
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 45, // высота строки в пикселях
    overscan: 5, // сколько строк рендерить выше/ниже видимой области
  })

  // Подгрузка при скролле
  useEffect(() => {
    const lastIndex = rowVirtualizer.range?.endIndex ?? 0
    
    if (
      hasNextPage && 
      !isFetchingNextPage && 
      lastIndex >= allItems.length - 3 // за 3 строки до конца
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage, 
    allItems.length, 
    rowVirtualizer.range?.endIndex
  ])
  
  if (status === 'pending') {
    return <div className="loading">Loading initial data...</div>
  }
  
  if (status === 'error') {
    return <div className="error">Error: {error?.message}</div>
  }
  
  return (
    <div className="left-list-container">
      <div className="list-header">
        <h3>Доступные элементы <span className="count">({totalCount.toLocaleString()})</span></h3>
      </div>
      
      <div
        ref={scrollRef}
        className="virtual-scroll-container"
        style={{
          height: '600px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index >= allItems.length
            const item = allItems[virtualRow.index]
            
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: '8px 12px',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isLoaderRow ? (
                  hasNextPage ? (
                    <div className="loader">Загрузка...</div>
                  ) : (
                    <div className="end-message">Конец списка</div>
                  )
                ) : (
                  <>
                    <span className="item-id">#{item.id}</span>
                    <button 
                      className="select-btn"
                      onClick={() => handleSelect(item.id)}
                    >
                      +
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {isFetchingNextPage && (
        <div className="footer-loader">Загрузка следующей страницы...</div>
      )}
    </div>
  )
}