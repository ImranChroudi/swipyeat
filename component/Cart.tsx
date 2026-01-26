'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useOrder } from '@/context/OrderContext'
import OrderQRCode from './OrderQRCode'
import EditCartItemModal from './EditCartItemModal'
import { supabase } from '@/lib/supabase'
import { MenuItem, CartItem } from '@/types'
import { ReceiptText, Trash2 } from 'lucide-react'


interface CartProps {
  onClose?: () => void
  tableNumber?: string
  restaurantId?: string
}

export default function Cart({ onClose, tableNumber, restaurantId }: CartProps) {
  const router = useRouter()
  const {
    items,
    updateItem,
    removeItem,
    clearCart,
    getSubtotal,
    getServiceFee,
    getTotal,
  } = useCart()
  const { createOrder, currentOrder } = useOrder()

  const [showQRCode, setShowQRCode] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [menuItemForEdit, setMenuItemForEdit] = useState<MenuItem | null>(null)
  const [isLoadingMenuItem, setIsLoadingMenuItem] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null)

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      const toRemove = items.find((it) => it.id === id) ?? null
      setPendingRemove(toRemove)
    } else {
      updateItem(id, { quantity: newQuantity })
    }
  }

  const handlePlaceOrder = () => {
    if (items.length === 0 || !tableNumber) return
    // Create order
    createOrder(tableNumber, items, getSubtotal(), getServiceFee(), getTotal())
    setShowQRCode(true)
    // Immediately clear cart (also clears localStorage)
    clearCart()
  }

  const formatCustomizations = (item: typeof items[0]) => {
    const parts: string[] = []
    if (item.selectedVariant) {
      parts.push(item.selectedVariant.name)
    }
    if (item.removedModifiers?.length) {
      const names = item.removedModifiers.map((m) => m.modifierName).filter(Boolean)
      if (names.length) parts.push(`No: ${names.slice(0, 2).join(', ')}${names.length > 2 ? '…' : ''}`)
    }
    if (item.specialInstructions) {
      parts.push(item.specialInstructions)
    }
    return parts.join(', ')
  }

  const handleEditItem = async (cartItem: CartItem) => {
    setIsLoadingMenuItem(true)
    try {
      // Fetch menu item details
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', cartItem.menuItemId)
        .single()

      if (error) throw error
      if (data) {
        setMenuItemForEdit(data as MenuItem)
        setEditingItem(cartItem)
      }
    } catch (err) {
      console.error('Error fetching menu item:', err)
    } finally {
      setIsLoadingMenuItem(false)
    }
  }


    return (
    <>
      {showQRCode && tableNumber && (
        <OrderQRCode
          tableNumber={tableNumber}
          onClose={(opts) => {
            setShowQRCode(false)

            // Only redirect once the order is actually inserted/accepted in Supabase.
            if (opts?.accepted) {
              clearCart()
              if (restaurantId && tableNumber) {
                const orderId = currentOrder?.id
                const href = orderId
                  ? `/restaurant/${restaurantId}/table/${tableNumber}/track-order?orderId=${encodeURIComponent(orderId)}`
                  : `/restaurant/${restaurantId}/table/${tableNumber}/track-order`
                router.push(href)
              } else if (onClose) {
                onClose()
              }
            }
          }}
        />
      )}
      {editingItem && menuItemForEdit && (
        <EditCartItemModal
          cartItem={editingItem}
          menuItem={menuItemForEdit}
          isOpen={!!editingItem}
          onClose={() => {
            setEditingItem(null)
            setMenuItemForEdit(null)
          }}
        />
      )}
      {pendingRemove && (
        <div
          className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4"
          onClick={() => setPendingRemove(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Remove item?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will remove <span className="font-semibold">{pendingRemove.menuItemName}</span> from your cart.
                </p>
              </div>
              <button
                onClick={() => setPendingRemove(null)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingRemove(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeItem(pendingRemove.id)
                  setPendingRemove(null)
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
              >
                ←
              </button>
            )}
            <h1 className="text-2xl font-bold">Cart</h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Your cart is empty</p>
            <p className="text-gray-400 text-sm mt-2">
              Add items from the menu to get started
            </p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4"
                >
                  {/* Item Image */}
                  <div className="relative w-full h-40 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.menuItemName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                      <h3 className="font-bold text-lg text-text-primary wrap-break-word">
                        {item.menuItemName}
                      </h3>
                      <span className="text-primary font-bold text-lg sm:text-base whitespace-nowrap">
                        {item.totalPrice?.toFixed(0)} Dh
                      </span>
                    </div>

                    {/* Customizations */}
                    {formatCustomizations(item) && (
                      <p className="text-sm text-gray-500 italic mb-3 wrap-break-word">
                        {formatCustomizations(item)}
                      </p>
                    )}

                    {/* Selected modifiers (removable) */}
                    {item.selectedModifiers?.length ? (
                      <div className="flex gap-2 mb-3 overflow-x-auto flex-nowrap pr-1">
                        {item.selectedModifiers.map((mod) => (
                          <span
                            key={mod.modifierId}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold border border-gray-200"
                          >
                            <span className="max-w-[220px] truncate">{mod.modifierName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (item.selectedModifiers || []).filter(
                                  (m) => m.modifierId !== mod.modifierId
                                )
                                updateItem(item.id, { selectedModifiers: next })
                              }}
                              className="shrink-0 text-gray-500 hover:text-gray-800"
                              aria-label={`Remove ${mod.modifierName}`}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Removed modifiers (kitchen: don't put) */}
                    {item.removedModifiers?.length ? (
                      <div className="flex gap-2 mb-3 overflow-x-auto flex-nowrap pr-1">
                        {item.removedModifiers.map((mod) => (
                          <span
                            key={mod.modifierId}
                            className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-800 px-3 py-1 text-xs font-semibold border border-red-200"
                          >
                            <span className="max-w-[220px] truncate">No {mod.modifierName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (item.removedModifiers || []).filter(
                                  (m) => m.modifierId !== mod.modifierId
                                )
                                updateItem(item.id, { removedModifiers: next })
                              }}
                              className="shrink-0 text-red-600 hover:text-red-800"
                              aria-label={`Undo remove ${mod.modifierName}`}
                              title="Undo"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Quantity Controls and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center justify-between gap-2 bg-gray-100 rounded-lg p-1 max-w-max sm:w-auto border border-gray-200">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className=" inline-flex items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4  border border-gray-200 shadow-sm shadow-primary/60"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="font-bold w-10 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className=" inline-flex items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4  border border-gray-200 shadow-sm shadow-primary/60"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleEditItem(item)}
                          disabled={isLoadingMenuItem}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 active:bg-primary/20 px-3 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                        >
                          <ReceiptText className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setPendingRemove(item)}
                          className="inline-flex items-center justify-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 px-3 py-2 rounded-lg font-semibold"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Frequently Bought Together Section */}
            {/* <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">
                Frequently bought together
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                  <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-4xl">🍋</span>
                    </div>
                  </div>
                  <h3 className="font-bold mb-1">Iced Lemonade</h3>
                  <p className="text-green-600 font-bold mb-2">+$3.50</p>
                  <button className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 rounded-lg transition-colors">
                    Add
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                  <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                      <span className="text-4xl">🍫</span>
                    </div>
                  </div>
                  <h3 className="font-bold mb-1">Chocolate Dip</h3>
                  <p className="text-green-600 font-bold mb-2">+$1.00</p>
                  <button className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 rounded-lg transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div> */}

           

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
               
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer with Total and Place Order Button */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200/90 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4 justify-between flex flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">Total Payable</p>
              <p className="text-2xl font-semibold text-primary">${getTotal().toFixed(2)}</p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={!tableNumber}
              className=" sm:w-auto bg-primary shadow-md  hover:bg-primary/70 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-6 shadow-primary/60 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Place Order →
            </button>
          </div>
        </div>
      )}
    </div>
    </>
    )
}
