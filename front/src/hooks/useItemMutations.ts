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