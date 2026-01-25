'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { CartItem } from '@/types'

export type OrderStatus = 'preparation' | 'ready' | 'served'

export interface Order {
  id: string
  orderNumber: string
  tableNumber: string
  items: CartItem[]
  status: OrderStatus
  createdAt: string
  subtotal: number
  serviceFee: number
  total: number
}

interface OrderContextType {
  currentOrder: Order | null
  createOrder: (tableNumber: string, items: CartItem[], subtotal: number, serviceFee: number, total: number) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  clearOrder: () => void
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  const generateOrderNumber = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = Math.floor(Math.random() * 1000)
    const letter = letters[Math.floor(Math.random() * letters.length)]
    return `${letter}${numbers.toString().padStart(3, '0')}`
  }

  const createOrder = (
    tableNumber: string,
    items: CartItem[],
    subtotal: number,
    serviceFee: number,
    total: number
  ) => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      tableNumber,
      items,
      status: 'preparation',
      createdAt: new Date().toISOString(),
      subtotal,
      serviceFee,
      total,
    }
    setCurrentOrder(newOrder)
  }

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setCurrentOrder((prev) => {
      if (prev && prev.id === orderId) {
        return { ...prev, status }
      }
      return prev
    })
  }

  const clearOrder = () => {
    setCurrentOrder(null)
  }

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        createOrder,
        updateOrderStatus,
        clearOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}
