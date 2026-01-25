'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CartItem, Modifier, ItemVariant, MenuItem } from '@/types'
import { useMenuItemDetails } from '@/hooks/useMenuItemDetails'
import { useCart } from '@/context/CartContext'
import { ChevronLeft, Pencil } from 'lucide-react'
import EditCartItemModal from '@/component/EditCartItemModal'


interface MenuItemModalProps {
  item: MenuItem
  isOpen: boolean
  onClose: () => void
}

export default function MenuItemModal({
  item,
  isOpen,
  onClose,
}: MenuItemModalProps) {
  const { addItem, items: cartItems } = useCart()
  const { variants, modifiers, loading } = useMenuItemDetails(item.id)

  console.log(variants)

  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<
    Map<string, { modifier: Modifier; selected: boolean }>
  >(new Map())
  const [showSelectedExtras, setShowSelectedExtras] = useState(true)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)

  const matchingCartItems = useMemo(
    () => cartItems.filter((ci) => ci.menuItemId === item.id),
    [cartItems, item.id]
  )
  const totalQtyInCart = useMemo(
    () => matchingCartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0),
    [matchingCartItems]
  )

  if (!isOpen) return null

  // Calculate total price
  const variantPrice = selectedVariant?.price_adjustment || 0
  const modifiersPrice = Array.from(selectedModifiers.values()).reduce(
    (sum, m) => (m.selected ? sum + m.modifier.price : sum),
    0
  )
  const itemTotal = (item.base_price + variantPrice + modifiersPrice) * quantity

  const handleModifierToggle = (modifier: Modifier) => {
    const key = modifier.id
    const current = selectedModifiers.get(key)

    if (current) {
      const newMap = new Map(selectedModifiers)
      newMap.set(key, { ...current, selected: !current.selected })
      setSelectedModifiers(newMap)
      if (!current.selected) setShowSelectedExtras(true)
    } else {
      const newMap = new Map(selectedModifiers)
      newMap.set(key, { modifier, selected: true })
      setSelectedModifiers(newMap)
      setShowSelectedExtras(true)
    }
  }

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      imageUrl: item.image_url,
      quantity,
      base_price: item.base_price,
      selectedVariant: selectedVariant
        ? {
            id: selectedVariant.id,
            name: selectedVariant.name,
            priceAdjustment: selectedVariant.price_adjustment,
          }
        : undefined,
      selectedModifiers: Array.from(selectedModifiers.values())
        .filter((m) => m.selected)
        .map((m) => ({
          modifierId: m.modifier.id,
          modifierName: m.modifier.name,
          price: m.modifier.price,
        })),
      specialInstructions: specialInstructions || undefined,
    })
    onClose()
  }


  const handleSelectVariant = (variant: ItemVariant) => {
    setSelectedVariant(selectedVariant?.id === variant.id ? null : variant)
  }

  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 min-h-screen pb-[85px] overflow-y-auto"
      onClick={onClose}
    >
      {editingCartItem && (
        <EditCartItemModal
          cartItem={editingCartItem}
          menuItem={item}
          isOpen={!!editingCartItem}
          onClose={() => setEditingCartItem(null)}
        />
      )}
      <div
        className="relative min-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item Image - Full Screen Top */}
        <div className="relative h-[50vh] w-full">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
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
                CHEF&apos;S CHOICE
              </span>
              
              {/* Title and Price */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl text-text-primary font-semibold flex-1">{item.name}</h2>
                <span className="text-primary font-bold text-2xl ml-4">
                  {itemTotal.toFixed(2)}Dh
                </span>
              </div>

           
              {/* Description */}
              <div className="mb-4">
                <h3 className="font-bold text-text-primary mb-2">Description</h3>
                <p className="text-text-secondary text-md leading-relaxed">{item.description}</p>
              </div>

              {/* In-cart details */}
              {matchingCartItems.length > 0 && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-green-800">
                        In your cart: {totalQtyInCart}
                      </div>
                      <div className="text-xs text-green-700">
                        {matchingCartItems.length} configuration{matchingCartItems.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {matchingCartItems.map((ci) => {
                      const variantName = ci.selectedVariant?.name
                      const mods = (ci.selectedModifiers || []).map((m) => m.modifierName).filter(Boolean)
                      const modsText = mods.length ? mods.join(', ') : null
                      const note = ci.specialInstructions?.trim()
                      const details = [variantName, modsText, note ? 'Note' : null].filter(Boolean).join(' • ')

                      return (
                        <div
                          key={ci.id}
                          className="flex items-start justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-text-primary">
                              ×{ci.quantity}
                            </div>
                            {details && (
                              <div className="text-xs text-text-secondary truncate">
                                {details}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingCartItem(ci)}
                            className="shrink-0 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 bg-white/80 hover:bg-white px-3 py-2 rounded-lg border border-green-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

             
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
                      <div className="ml-3  flex justify-between w-full flex-1">
                        <div className="font-bold">{variant.name}</div>
                        {variant.name_ar && (
                          <div className="text-sm text-gray-600 text-right">
                            {variant.name_ar}
                          </div>
                        )}
                        {/* <div className="text-sm text-gray-500 mt-1">
                          {variant.name === 'Medium Rare' && 'Warm red center'}
                          {variant.name === 'Medium' && 'Warm pink center'}
                          {variant.name === 'Well Done' && 'Cooked throughout'}
                        </div> */}
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
                  const selected = Array.from(selectedModifiers.values()).filter((m) => m.selected)
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
                        {selected.map(({ modifier }) => (
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
                            {modifier.price > 0 && (
                              <span className="shrink-0 rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-xs font-bold">
                                {`+$${modifier.price.toFixed(2)}`}
                              </span>
                            )}
                          </div>
                          {modifier.name_ar && (
                            <div className="text-xs text-gray-500 mt-1 text-right">
                              {modifier.name_ar}
                            </div>
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

          {/* Fixed Bottom Bar */}
          <div className="fixed bottom-0 bg-white border-t border-gray-200  px-4 w-full py-4">
            <div className="flex flex-col gap-3 md:flex-row items-center justify-between ">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 max-w-max md:w-auto border border-gray-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className=" inline-flex items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4 py-1 border border-gray-200 shadow-sm shadow-primary/60"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="font-bold text-lg w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className=" inline-flex items-center justify-center text-xl font-bold bg-white hover:bg-gray-50 active:bg-gray-100 rounded-lg px-4 py-1 border border-gray-200 shadow-sm shadow-primary/60"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary w-full hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-md transition-colors shadow-sm shadow-primary/10 text-lg ml-4"
              >
                {matchingCartItems.length > 0 ? 'Add more' : 'Add to Cart'} ${itemTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}