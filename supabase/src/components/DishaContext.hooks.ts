import { useContext } from 'react'
import { DishaContext } from './DishaContext.shared'

export function useDisha() {
  const context = useContext(DishaContext)
  if (!context) {
    throw new Error('useDisha must be used within DishaProvider')
  }
  return context
}
