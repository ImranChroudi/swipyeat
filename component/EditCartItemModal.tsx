'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Modifier, ItemVariant, MenuItem, CartItem } from '@/types'
import { useMenuItemDetails } from '@/hooks/useMenuItemDetails'
import { useCart } from '@/context/CartContext'
import { ChevronLeft } from 'lucide-react'

interface EditCartItemModalProps {
  cartItem: CartItem
  menuItem: MenuItem
  isOpen: boolean
  onClose: () => void
}

export default function EditCartItemModal({
  cartItem,
  menuItem,
  isOpen,
  onClose,
}: EditCartItemModalProps) {
  const { updateItem } = useCart()
  const { variants, modifiers, loading } = useMenuItemDetails(menuItem.id)

  const [quantity, setQuantity] = useState(cartItem.quantity)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    cartItem.selectedVariant?.id ?? null
  )
  const [selectedModifierIds, setSelectedModifierIds] = useState<Set<string>>(
    () => new Set((cartItem.selectedModifiers || []).map((m) => m.modifierId))
  )
  const [showSelectedExtras, setShowSelectedExtras] = useState(true)
  const [specialInstructions, setSpecialInstructions] = useState(
    cartItem.specialInstructions || ''
  )

  const selectedVariant = useMemo<ItemVariant | null>(() => {
    if (!selectedVariantId) return null
    return variants.find((v) => v.id === selectedVariantId) ?? null
  }, [variants, selectedVariantId])

  if (!isOpen) return null

  // Calculate total price
  const variantPrice =
    selectedVariant?.price_adjustment ?? cartItem.selectedVariant?.priceAdjustment ?? 0
  const modifiersPrice = Array.from(selectedModifierIds).reduce((sum, id) => {
    const fromDb = modifiers.find((m) => m.id === id)?.price
    const fromCart = cartItem.selectedModifiers?.find((m) => m.modifierId === id)?.price
    return sum + (fromDb ?? fromCart ?? 0)
  }, 0)
  const itemTotal = (menuItem.base_price + variantPrice + modifiersPrice) * quantity

  const handleModifierToggle = (modifier: Modifier) => {
    setSelectedModifierIds((prev) => {
      const next = new Set(prev)
      if (next.has(modifier.id)) next.delete(modifier.id)
      else next.add(modifier.id)
      return next
    })
    setShowSelectedExtras(true)
  }

  const handleSaveChanges = () => {
    const selectedModsFromDb = modifiers
      .filter((m) => selectedModifierIds.has(m.id))
      .map((m) => ({ modifierId: m.id, modifierName: m.name, price: m.price }))
    const selectedModsFromCart = (cartItem.selectedModifiers || []).filter(
      (m) => selectedModifierIds.has(m.modifierId) && !selectedModsFromDb.some((x) => x.modifierId === m.modifierId)
    )

    updateItem(cartItem.id, {
      quantity,
      selectedVariant: selectedVariant
        ? {
            id: selectedVariant.id,
            name: selectedVariant.name,
            priceAdjustment: selectedVariant.price_adjustment,
          }
        : undefined,
      selectedModifiers: [...selectedModsFromDb, ...selectedModsFromCart],
      specialInstructions: specialInstructions || undefined,
      totalPrice: itemTotal,
    })
    onClose()
  }

  const handleSelectVariant = (variant: ItemVariant) => {
    setSelectedVariantId((prev) => (prev === variant.id ? null : variant.id))
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 min-h-screen pb-[85px] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative min-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item Image - Full Screen Top */}
        <div className="relative h-[50vh] w-full">
          {menuItem.image_url ? (
            <Image
              src={menuItem.image_url}
              alt={menuItem.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-linear-to-br from-gray-200 to-gray-300 h-full flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}

          {/* Header Buttons */}
          <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-10">
            <button
              onClick={onClose}
              className="bg-gray-800 bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-90 transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* White Card Overlay */}
        <div className="relative -mt-8 bg-white rounded-t-3xl min-h-[60vh]">
          <div className="p-6">
            {/* Item Header */}
            <div className="mb-6">
              {/* Badge */}
              <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded mb-3">
                EDIT ITEM
              </span>

              {/* Title and Price */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl font-bold flex-1">{menuItem.name}</h2>
                <span className="text-primary font-bold text-2xl ml-4">
                  ${itemTotal.toFixed(2)}
                </span>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h3 className="font-bold text-text-primary mb-2">Description</h3>
                <p className="text-text-secondary text-md leading-relaxed">
                  {menuItem.description}
                </p>
              </div>
            </div>

            {/* VARIANTS SECTION - Cooking Preference */}
            {variants.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Cooking Preference</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                    REQUIRED
                  </span>
                </div>
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <label
                      key={variant.id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => handleSelectVariant(variant)}
                        className="mt-1 w-5 h-5 text-green-500 cursor-pointer"
                      />
                      <div className="ml-3 flex">
                        <div className="font-bold">{variant.name}</div>
                        {variant.name_ar && (
                          <div className="text-sm text-gray-600 text-right">
                            {variant.name_ar}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* MODIFIERS SECTION - Add Extras */}
            {!loading && modifiers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Add Extras</h3>
                {(() => {
                  const selected = modifiers.filter((m) => selectedModifierIds.has(m.id))
                  if (!selected.length) return null

                  if (!showSelectedExtras) {
                    return (
                      <button
                        type="button"
                        onClick={() => setShowSelectedExtras(true)}
                        className="mb-3 inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800"
                      >
                        Show selected extras ({selected.length})
                      </button>
                    )
                  }

                  return (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-text-primary">
                          Selected extras (tap ✕ to remove)
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSelectedExtras(false)}
                          className="text-gray-500 hover:text-gray-800 font-semibold"
                          aria-label="Hide selected extras"
                          title="Hide"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selected.map((modifier) => (
                          <span
                            key={modifier.id}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold border border-gray-200"
                          >
                            <span className="max-w-[220px] truncate">{modifier.name}</span>
                            <button
                              type="button"
                              onClick={() => handleModifierToggle(modifier)}
                              className="shrink-0 text-gray-500 hover:text-gray-800"
                              aria-label={`Remove ${modifier.name}`}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                <div className="space-y-3">
                  {modifiers.map((modifier) => {
                    const isSelected = selectedModifierIds.has(modifier.id)

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
                          
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SPECIAL INSTRUCTIONS */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">Special Instructions</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Add a note (e.g., no salt, extra napkins...)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>


          <div className="fixed bottom-0 bg-white border-t border-gray-200  px-4 w-full py-4">
            <div className="flex flex-col gap-3 md:flex-row items-center justify-between ">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 max-w-max md:w-auto border border-gray-200">
                <button 
                className=" inline-flex items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4 py-1 border border-gray-200 shadow-sm shadow-primary/60"
                 aria-label="Decrease quantity">
                −
                </button>
                <span className="font-bold text-lg w-8 text-center">1</span>
                <button className=" inline-flex items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4 py-1 border border-gray-200/60 shadow-sm shadow-primary/60" aria-label="Increase quantity">+</button></div><button className="flex-1 bg-primary w-full hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-md transition-colors shadow-sm shadow-primary/10 text-lg ml-4">Add more $55.00</button></div></div>

          {/* Fixed Bottom Bar */}
          <div className="fixed w-full max-w-full bottom-0 bg-white border-gray-200  border-t shadow-lg px-6 py-4">
            <div className="flex flex-col gap-2 w-full items-center justify-between">
              {/* Quantity Selector */}
              <div className="flex items-center  gap-2 bg-gray-100 rounded-lg p-2 w-full sm:w-auto border border-gray-200/60">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className=" inline-flex flex-1 items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4 py-1 border border-gray-200 shadow-sm shadow-primary/60"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className=" inline-flex flex-1 items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4 py-1 border border-gray-200 shadow-sm shadow-primary/60"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Save Changes Button */}
              <button
                onClick={handleSaveChanges}
                className="flex-1 w-full bg-primary hover:bg-primary/70 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
              >
                Save Changes ${itemTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
