'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { CartItem, MenuItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (item: MenuItem | AddToCartDraft) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  removeItem: (id: string) => void
  clearCart: () => void
  getSubtotal: () => number
  getTaxes: () => number
  getServiceFee: () => number
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

type AddToCartDraft = Partial<Pick<CartItem, 'selectedVariant' | 'selectedModifiers' | 'specialInstructions'>> & {
  menuItemId: string
  menuItemName: string
  imageUrl?: string | null
  quantity?: number
  // Backward-compat: some callers were using camelCase
  base_price?: number
  basePrice?: number
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => { 
    console.log("items", items)
  }, [items])

  const calculateLineTotal = (cartLike: {
    base_price: number
    selectedVariant?: CartItem['selectedVariant']
    selectedModifiers: CartItem['selectedModifiers']
    quantity: number
  }) => {
    const variantAdj = cartLike.selectedVariant?.priceAdjustment || 0
    const modsTotal = (cartLike.selectedModifiers || []).reduce((sum, m) => sum + m.price, 0)
    return (cartLike.base_price + variantAdj + modsTotal) * cartLike.quantity
  }

  const normalizeAddInput = (input: MenuItem | AddToCartDraft): Omit<CartItem, 'id'> => {
    // 1) Called with MenuItem directly (from menu list)
    if (!('menuItemId' in input)) {
      const base_price = input.base_price ?? 0
      const quantity = 1
      const selectedModifiers: CartItem['selectedModifiers'] = []
      return {
        menuItemId: input.id,
        menuItemName: input.name,
        imageUrl: input.image_url,
        quantity,
        base_price,
        selectedVariant: undefined,
        selectedModifiers,
        specialInstructions: undefined,
        totalPrice: calculateLineTotal({
          base_price,
          selectedVariant: undefined,
          selectedModifiers,
          quantity,
        }),
      }
    }

    // 2) Called with cart-draft object (from modals)
    const base_price = (input.base_price ?? input.basePrice ?? 0) as number
    const quantity = Math.max(1, input.quantity ?? 1)
    const selectedModifiers = (input.selectedModifiers ?? []) as CartItem['selectedModifiers']
    const selectedVariant = input.selectedVariant
    const specialInstructions = input.specialInstructions || undefined

    return {
      menuItemId: input.menuItemId,
      menuItemName: input.menuItemName,
      imageUrl: input.imageUrl,
      quantity,
      base_price,
      selectedVariant,
      selectedModifiers,
      specialInstructions,
      totalPrice: calculateLineTotal({
        base_price,
        selectedVariant,
        selectedModifiers,
        quantity,
      }),
    }
  }

  const addItem = (input: MenuItem | AddToCartDraft) => {
    const item = normalizeAddInput(input)

    // Check if item with same configuration already exists
    const existingItemIndex = items.findIndex(
      (existing) =>
        existing.menuItemId === item.menuItemId &&
        JSON.stringify(existing.selectedVariant) === JSON.stringify(item.selectedVariant) &&
        JSON.stringify(existing.selectedModifiers) === JSON.stringify(item.selectedModifiers) &&
        (existing.specialInstructions || '') === (item.specialInstructions || '')
    )

    if (existingItemIndex !== -1) {
      console.log("existingItemIndex", existingItemIndex)
      // Update quantity if item exists
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity += item.quantity
      updatedItems[existingItemIndex].totalPrice = calculateLineTotal(updatedItems[existingItemIndex])
      setItems(updatedItems)
      return
    }

    // Add new item
    const newItem: CartItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      totalPrice: calculateLineTotal(item),
    }
    console.log("newItem", newItem)
    setItems([...items, newItem])
  }

  const updateItem = (id: string, updates: Partial<CartItem>) => {
    console.log("item updated : ", id)

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates }
          // Recalculate total when anything affecting price changes (quantity, base, variant, modifiers)
          const shouldRecalc =
            'quantity' in updates ||
            'base_price' in updates ||
            'selectedVariant' in updates ||
            'selectedModifiers' in updates
          if (shouldRecalc) {
            updated.totalPrice = calculateLineTotal({
              base_price: updated.base_price,
              selectedVariant: updated.selectedVariant,
              selectedModifiers: updated.selectedModifiers ?? [],
              quantity: updated.quantity,
            })
          }
          return updated
        }
        return item
      })
    )
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const getTaxes = () => {
    return 0
  }

  const getServiceFee = () => {
    // Fixed service fee or percentage
    return Math.max(1.5, getSubtotal() * 0.06)
  }

  const getTotal = () => {
    return getSubtotal() + getServiceFee()
  }

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        getSubtotal,
        getTaxes,
        getServiceFee,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
