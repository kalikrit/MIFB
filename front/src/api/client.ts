// front/src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mifb.onrender.com'

export interface PageResponse {
  items: Array<{ id: number }>
  total: number
  hasMore: boolean
  nextOffset: number
  fullOrder?: number[] // для правого списка
}

export const api = {
  baseUrl: API_BASE_URL, 
  // Левый список
  getLeftItems: async (search: string, offset: number, limit: number): Promise<PageResponse> => {
    const params = new URLSearchParams({
      ...(search && { search }),
      offset: String(offset),
      limit: String(limit)
    })
    
    const response = await fetch(`${API_BASE_URL}/api/left?${params}`)
    if (!response.ok) throw new Error('Failed to fetch left items')
    return response.json()
  },
  
  // Правый список
  getRightItems: async (search: string, offset: number, limit: number): Promise<PageResponse> => {
    const params = new URLSearchParams({
      ...(search && { search }),
      offset: String(offset),
      limit: String(limit)
    })
    
    const response = await fetch(`${API_BASE_URL}/api/right?${params}`)
    if (!response.ok) throw new Error('Failed to fetch right items')
    return response.json()
  },

  // Выбрать элемент (добавить в правый список)
  selectItem: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!response.ok) throw new Error('Failed to select item')
    return response.json()
  },

  // Отменить выбор (удалить из правого списка)
  deselectItem: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/deselect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!response.ok) throw new Error('Failed to deselect item')
    return response.json()
  },
  
  // Действия (для batch-очереди)
  sendBatch: async (actions: any[]) => {
    const response = await fetch(`${API_BASE_URL}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions })
    })
    if (!response.ok) throw new Error('Batch failed')
    return response.json()
  }
}