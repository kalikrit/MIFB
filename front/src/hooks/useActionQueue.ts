import { useRef, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { QueryClient } from '@tanstack/react-query'

export type Action = 
  | { type: 'select'; id: number }
  | { type: 'deselect'; id: number }
  | { type: 'reorder'; order: number[] }

export const useActionQueue = (queryClient: QueryClient) => {
  const queue = useRef<Action[]>([])
  const isSending = useRef(false)
  const queryClientRef = useRef(queryClient)
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const sendScheduled = useRef(false) 
  
  // Настройки
  const MAX_DELAY = 2000        // максимум ждём 2 секунды
  const MIN_ACTIONS = 3         // отправляем при 3+ действиях
  
  // Обновляем ref при изменении queryClient
  useEffect(() => {
    queryClientRef.current = queryClient
  }, [queryClient])
  
  // Дедупликация - оставляем только последние значимые действия
  const deduplicate = (actions: Action[]): Action[] => {
    const result: Action[] = []
    const seen = new Set<string>()
    
    // Идём с конца, оставляем только последнее действие для каждого id
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i]
      const key = action.type === 'reorder' 
        ? 'reorder' 
        : `${action.type}-${action.id}`
      
      if (!seen.has(key)) {
        seen.add(key)
        result.unshift(action)
      }
    }
    
    return result
  }
  
  // Отправка очереди
  const sendQueue = useCallback(async () => {
    // Сбрасываем флаги и таймауты
    sendScheduled.current = false
    if (pendingTimeout.current) {
      clearTimeout(pendingTimeout.current)
      pendingTimeout.current = undefined
    }
    
    if (queue.current.length === 0 || isSending.current) {
      console.log('⏰ Skipping send - empty or already sending')
      return
    }
    
    console.log('⏰ sendQueue START, queue before:', [...queue.current])
    isSending.current = true
    
    const actionsToSend = deduplicate([...queue.current])
    queue.current = []
    
    try {
      await api.sendBatch(actionsToSend)
      console.log('✅ Batch sent, invalidating queries')
      queryClientRef.current.invalidateQueries({ queryKey: ['left-items'] })
      queryClientRef.current.invalidateQueries({ queryKey: ['right-items'] })
    } catch (error) {
      console.log('❌ Batch failed, restoring actions')
      queue.current.unshift(...actionsToSend)
    } finally {
      isSending.current = false
      console.log('⏰ sendQueue END, queue after:', [...queue.current])
    }
  }, [])
  
  // Добавление действия в очередь
  const addAction = useCallback((action: Action) => {
    queue.current.push(action)
    const actionId = action.type === 'reorder' ? 'reorder' : action.id
    console.log('📥 Action added:', action.type, actionId, 'Queue size:', queue.current.length)
    
    // Если набрали минимум действий и отправка ещё не запланирована
    if (queue.current.length >= MIN_ACTIONS && !isSending.current && !sendScheduled.current) {
      console.log('⚡ Min actions reached, sending immediately')
      sendScheduled.current = true
      sendQueue()
      return
    }
    
    // Иначе ставим таймаут, если ещё нет
    if (!pendingTimeout.current && !isSending.current && !sendScheduled.current) {
      console.log(`⏰ Setting timeout for ${MAX_DELAY}ms`)
      sendScheduled.current = true
      pendingTimeout.current = setTimeout(() => {
        console.log('⏰ Max delay reached, sending')
        pendingTimeout.current = undefined
        sendQueue()
      }, MAX_DELAY)
    }
  }, [sendQueue])
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current)
      }
      // Отправляем оставшиеся действия при выходе
      if (queue.current.length > 0) {
        sendQueue()
      }
    }
  }, [sendQueue])
  
  return { addAction }
}