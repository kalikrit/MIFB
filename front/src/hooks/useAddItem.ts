import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useState } from 'react'

export const useAddItem = () => {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  
  const mutation = useMutation({
    mutationFn: (id: number) => api.addNewItem(id),
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['left-items'] })
    },
    onError: (err: Error) => {
      setError(err.message)
    }
  })
  
  return {
    addItem: mutation.mutate,
    isPending: mutation.isPending,
    error
  }
}