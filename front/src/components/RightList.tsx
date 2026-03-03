import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { api } from '../api/client'
import { SortableItem } from './SortableItem'
import { useDeselectItem, useReorderItems } from '../hooks/useItemMutations'

interface RightListProps {
  searchTerm: string
  onTotalChange?: (total: number) => void
}

export const RightList = ({ searchTerm, onTotalChange }: RightListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const deselectMutation = useDeselectItem()
  const reorderMutation = useReorderItems()
  
  // Настройка сенсоров для DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // 5px движения активируют драг
    })
  )
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ['right-items', searchTerm],
    queryFn: ({ pageParam = 0 }) => 
      api.getRightItems(searchTerm, pageParam, 20),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
  })
  
  const allItems = data?.pages.flatMap(page => page.items) ?? []
  const totalCount = data?.pages[0]?.total ?? 0
  const fullOrder = data?.pages[0]?.fullOrder ?? [] // полный порядок для DnD
  
  useEffect(() => {
    if (onTotalChange) {  
      onTotalChange(totalCount)
    }
  }, [totalCount, onTotalChange])

  // Виртуализация
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 45,
    overscan: 5,
  })
  
  // Инфинити-скролл
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
  
  // Обработчики DnD
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    
    if (!over || active.id === over.id) return
    
    const oldIndex = fullOrder.indexOf(active.id as number)
    const newIndex = fullOrder.indexOf(over.id as number)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    const newFullOrder = arrayMove(fullOrder, oldIndex, newIndex)
    
    // 👇 Отправляем на сервер
    reorderMutation.mutate(newFullOrder)
  }
  
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fullOrder}
        strategy={verticalListSortingStrategy}
      >
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
              
              if (isLoaderRow) {
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
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {hasNextPage ? (
                      <div className="loader">Загрузка...</div>
                    ) : (
                      <div className="end-message">Конец списка</div>
                    )}
                  </div>
                )
              }
              
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
                >
                  <SortableItem id={item.id}>
                    <div className="list-item">
                      <span className="drag-handle">⋮⋮</span>
                      <span className="item-id">#{item.id}</span>
                      <button 
                        className="deselect-btn"
                        onClick={() => deselectMutation.mutate(item.id)}
                        disabled={deselectMutation.isPending}
                      >
                        ×
                      </button>
                    </div>
                  </SortableItem>
                </div>
              )
            })}
          </div>
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeId ? (
          <div className="list-item" style={{ background: '#f0f9ff', border: '2px solid #3b82f6' }}>
            <span className="drag-handle">⋮⋮</span>
            <span className="item-id">#{activeId}</span>
            <button className="deselect-btn">×</button>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}