import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect } from 'react'
import { api } from '../api/client'

interface RightListProps {
  searchTerm: string
}

export const RightList = ({ searchTerm }: RightListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['right-items', searchTerm],
    queryFn: ({ pageParam = 0 }) => 
      api.getRightItems(searchTerm, pageParam, 20),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
  })
  
  const allItems = data?.pages.flatMap(page => page.items) ?? []
  const totalCount = data?.pages[0]?.total ?? 0
  
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 45,
    overscan: 5,
  })
  
  useEffect(() => {
    const lastIndex = rowVirtualizer.range?.endIndex ?? 0
    if (
      hasNextPage && 
      !isFetchingNextPage && 
      lastIndex >= allItems.length - 3
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
    return <div className="loader">Загрузка выбранных элементов...</div>
  }
  
  if (status === 'error') {
    return <div className="error">Ошибка: {error?.message}</div>
  }
  
  if (allItems.length === 0) {
    return (
      <div className="placeholder">
        <h3>Нет выбранных элементов</h3>
        <p>Нажмите + в левой колонке, чтобы добавить</p>
      </div>
    )
  }
  
  return (
    <div
      ref={scrollRef}
      className="virtual-scroll-container"
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
              }}
              className="list-item"
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
                    className="deselect-btn"
                    onClick={() => console.log('Убрать', item.id)}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}