import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export const useSelectItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => api.selectItem(id),
    
    onSuccess: () => {
      // Инвалидируем оба списка, чтобы они перезагрузили актуальные данные
      queryClient.invalidateQueries({ queryKey: ['left-items'] })
      queryClient.invalidateQueries({ queryKey: ['right-items'] })
    }
  })
}

export const useDeselectItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => api.deselectItem(id),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['left-items'] })
      queryClient.invalidateQueries({ queryKey: ['right-items'] })
    }
  })
}

export const useReorderItems = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (order: number[]) => api.reorderItems(order),
    
    // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ
    onMutate: async (newOrder) => {
      // 1. Отменяем любые текущие запросы (чтобы они не перезаписали наши изменения)
      await queryClient.cancelQueries({ queryKey: ['right-items'] })
      
      // 2. Сохраняем предыдущее состояние для возможного отката
      const previousData = queryClient.getQueryData(['right-items'])
      
      // 3. ОПТИМИСТИЧНО обновляем кэш прямо сейчас
      queryClient.setQueryData(['right-items'], (old: any) => {
        if (!old) return old
        
        // Обновляем fullOrder в первой странице
        const newPages = old.pages.map((page: any, index: number) => {
          if (index === 0) {
            return { 
              ...page, 
              fullOrder: newOrder  // 👈 новый порядок
            }
          }
          return page
        })
        
        return { ...old, pages: newPages }
      })
      
      // 4. Возвращаем предыдущее состояние для отката в случае ошибки
      return { previousData }
    },
    
    // Если сервер вернул ошибку — откатываем изменения
    onError: (err, newOrder, context) => {
      queryClient.setQueryData(['right-items'], context?.previousData)
    },
    
    // После успеха всё равно инвалидируем для синхронизации
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['right-items'] })
    }
  })
}