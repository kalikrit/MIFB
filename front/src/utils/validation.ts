export const validateNewId = (idStr: string, currentMaxId: number): { valid: boolean; error?: string } => {
  if (!idStr.trim()) {
    return { valid: false, error: 'Введите ID' }
  }
  
  const id = Number(idStr)
  
  if (isNaN(id)) {
    return { valid: false, error: 'ID должен быть числом' }
  }
  
  if (!Number.isInteger(id)) {
    return { valid: false, error: 'ID должен быть целым числом' }
  }
  
  if (id <= 0) {
    return { valid: false, error: 'ID должен быть положительным' }
  }
  
  if (id <= currentMaxId) {
    return { valid: false, error: `ID ${id} уже существует (макс. ${currentMaxId})` }
  }
  
  return { valid: true }
}