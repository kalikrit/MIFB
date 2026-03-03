import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableItemProps {
  id: number
  children: React.ReactNode
}

export const SortableItem = ({ id, children }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
    background: isDragging ? '#f0f9ff' : 'transparent',
  }
  
  return (
    <div
     ref={setNodeRef} 
     style={style} 
     {...attributes} 
     {...listeners}
     className={isDragging ? 'dragging' : ''}
     >
      {children}
    </div>
  )
}