'use client'

import { useState } from 'react'
import { Modifier, MenuItem } from '@/types'
import { useMenuItemDetails } from '@/hooks/useMenuItemDetails'
import { useCart } from '@/context/CartContext'

interface QuickAddModalProps {
  item: MenuItem
  isOpen: boolean
  onClose: () => void
}

export default function QuickAddModal({
  item,
  isOpen,
  onClose,
}: QuickAddModalProps) {
  const { addItem } = useCart()
  const { modifiers, menuItemModifiers, loading } = useMenuItemDetails(item.id)

  const [selectedModifiers, setSelectedModifiers] = useState<
    Map<string, { modifier: Modifier; selected: boolean }>
  >(new Map())

  if (!isOpen) return null

  // Calculate total price
  const modifiersPrice = Array.from(selectedModifiers.values()).reduce(
    (sum, m) => (m.selected ? sum + m.modifier.price : sum),
    0
  )
  const itemTotal = item.base_price + modifiersPrice

  const handleModifierToggle = (modifier: Modifier) => {
    const key = modifier.id
    const current = selectedModifiers.get(key)

    if (current) {
      const newMap = new Map(selectedModifiers)
      newMap.set(key, { ...current, selected: !current.selected })
      setSelectedModifiers(newMap)
    } else {
      const newMap = new Map(selectedModifiers)
      newMap.set(key, { modifier, selected: true })
      setSelectedModifiers(newMap)
    }
  }

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      imageUrl: item.image_url,
      quantity: 1,
      base_price: item.base_price,
      selectedVariant: undefined,
      selectedModifiers: Array.from(selectedModifiers.values())
        .filter((m) => m.selected)
        .map((m) => ({
          modifierId: m.modifier.id,
          modifierName: m.modifier.name,
          price: m.modifier.price,
        })),
      specialInstructions: undefined,
    })
    onClose()
    // Reset selections
    setSelectedModifiers(new Map())
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Modifiers Section */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading modifiers...</p>
            </div>
          ) : modifiers.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">Add Extras</h3>
              <div className="space-y-3">
                {modifiers.map((modifier) => {
                  const isRequired =
                    menuItemModifiers.find(
                      (m) => m.modifier_id === modifier.id
                    )?.is_required || false

                  const isSelected =
                    selectedModifiers.get(modifier.id)?.selected || false

                  return (
                    <label
                      key={modifier.id}
                      className={`group flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleModifierToggle(modifier)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 bg-white text-transparent group-hover:border-gray-400'
                        }`}
                      >
                        ✓
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold text-text-primary leading-snug">
                            {modifier.name}
                          </div>
                         
                           {modifier.name_ar && (
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            {modifier.name_ar}
                          </div>
                        )}
                        </div>
                        {modifier.price > 0 && (
                            <span className="shrink-0 rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-xs font-bold">
                              {`+$${modifier.price.toFixed(2)}`}
                            </span>
                          )}
                       
                        {isRequired && (
                          <div className="mt-2 text-xs font-semibold text-red-600">
                            Required
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-500 text-center py-4">
                No modifiers available for this item
              </p>
            </div>
          )}

          {/* Price Summary */}
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Base Price:</span>
              <span>${item.base_price.toFixed(2)}</span>
            </div>
            {modifiersPrice > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Extras:</span>
                <span>+${modifiersPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-2 mt-2">
              <span className="font-bold text-lg">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                ${itemTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary hover:bg-primary/70 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
