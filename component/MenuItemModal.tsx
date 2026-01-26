'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { CartItem, Modifier, ItemVariant, MenuItem } from '@/types'
import { useMenuItemDetails } from '@/hooks/useMenuItemDetails'
import { useCart } from '@/context/CartContext'
import { ChevronLeft, ReceiptText } from 'lucide-react'
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
  // Paid extras selected (price > 0)
  const [addModifierIds, setAddModifierIds] = useState<Set<string>>(() => new Set())
  // Free ingredients the user wants removed (price === 0)
  const [removeModifierIds, setRemoveModifierIds] = useState<Set<string>>(() => new Set())
  const [showSelectedExtras, setShowSelectedExtras] = useState(true)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)
  const defaultsInitializedRef = useRef(false)
  const [variantError, setVariantError] = useState(false)
  const variantsRef = useRef<HTMLDivElement | null>(null)

  const matchingCartItems = useMemo(
    () => cartItems.filter((ci) => ci.menuItemId === item.id),
    [cartItems, item.id]
  )
  const totalQtyInCart = useMemo(
    () => matchingCartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0),
    [matchingCartItems]
  )

  if (!isOpen) return null

  // Free modifiers default to "With" (we keep this as internal default for the toggle UI)
  useEffect(() => {
    if (defaultsInitializedRef.current) return
    if (loading) return
    if (!modifiers.length) return
    // no state update needed for "with" default; we only track "without" for free mods
    defaultsInitializedRef.current = true
  }, [loading, modifiers])

  // Calculate total price
  const variantPrice = selectedVariant?.price_adjustment || 0
  const modifiersPrice = Array.from(addModifierIds).reduce((sum, id) => {
    const price = modifiers.find((m) => m.id === id)?.price ?? 0
    return sum + price
  }, 0)
  const itemTotal = (item.base_price + variantPrice + modifiersPrice) * quantity

  const setModifierChoice = (modifier: Modifier, choice: 'with' | 'without') => {
    const id = modifier.id
    setShowSelectedExtras(true)

    if (modifier.price === 0) {
      // Free ingredient: With default; Without => add to remove list
      if (choice === 'without') setRemoveModifierIds((prev) => new Set(prev).add(id))
      else
        setRemoveModifierIds((prev) => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      // ensure it's not treated as paid extra
      setAddModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }

    // Paid extra: With => add; Without => not added
    if (choice === 'with') setAddModifierIds((prev) => new Set(prev).add(id))
    else
      setAddModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    // paid extras should not be in remove list
    setRemoveModifierIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      setVariantError(true)
      variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setVariantError(false)

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
      selectedModifiers: modifiers
        .filter((m) => m.price > 0 && addModifierIds.has(m.id))
        .map((m) => ({
          modifierId: m.id,
          modifierName: m.name,
          price: m.price,
        })),
      removedModifiers: modifiers
        .filter((m) => m.price === 0 && removeModifierIds.has(m.id))
        .map((m) => ({
          modifierId: m.id,
          modifierName: m.name,
        })),
      specialInstructions: specialInstructions || undefined,
    })
    onClose()
  }


  const handleSelectVariant = (variant: ItemVariant) => {
    setSelectedVariant(selectedVariant?.id === variant.id ? null : variant)
    setVariantError(false)
  }

  
  return (
    <div
      className="fixed inset-0 bg-white z-[1111] bg-opacity-50 z-50 min-h-screen pb-[100px] overflow-y-auto"
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
        <div className="fixed top-0  h-[45vh]  w-full">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-linear-to-br  from-gray-200 to-gray-300 h-full flex items-center justify-center">
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
        <div className="relative mt-[40vh] -mt-8 bg-white rounded-t-4xl min-h-[60vh]">
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
                            <ReceiptText className="w-3.5 h-3.5" />
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
              <div className="mb-6" ref={variantsRef}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Cooking Preference</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                    REQUIRED
                  </span>
                </div>
                {variantError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    Please choose your variant
                  </div>
                )}
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
            {loading ? (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Add Extras</h3>
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
                    <div className="text-sm font-semibold text-gray-600">Please wait…</div>
                    <div className="text-xs text-gray-500">Loading options…</div>
                  </div>
                </div>
              </div>
            ) : modifiers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Add Extras</h3>
                {(() => {
                  const withMods = modifiers.filter((m) => m.price > 0 && addModifierIds.has(m.id))
                  const withoutMods = modifiers.filter((m) => m.price === 0 && removeModifierIds.has(m.id))
                  const count = withMods.length + withoutMods.length
                  if (!count) return null

                  if (!showSelectedExtras) {
                    return (
                      <button
                        type="button"
                        onClick={() => setShowSelectedExtras(true)}
                        className="mb-3 inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800"
                      >
                        Show selected extras ({count})
                      </button>
                    )
                  }

                  return (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-text-primary">
                          Selected modifiers
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
                      {withMods.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-bold text-gray-600 mb-1">With</div>
                          <div className="flex gap-2 overflow-x-auto flex-nowrap pr-1">
                            {withMods.map((modifier) => (
                              <span
                                key={modifier.id}
                                className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold border border-gray-200"
                              >
                                <span className="max-w-[220px] truncate">{modifier.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setModifierChoice(modifier, 'without')}
                                  className="shrink-0 text-gray-500 hover:text-gray-800"
                                  aria-label={`Set without ${modifier.name}`}
                                  title="Without"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {withoutMods.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-gray-600 mb-1">Without</div>
                          <div className="flex gap-2 overflow-x-auto flex-nowrap pr-1">
                            {withoutMods.map((modifier) => (
                              <span
                                key={modifier.id}
                                className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-800 px-3 py-1 text-xs font-semibold border border-red-200"
                              >
                                <span className="max-w-[220px] truncate">No {modifier.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setModifierChoice(modifier, 'with')}
                                  className="shrink-0 text-red-600 hover:text-red-800"
                                  aria-label={`Set with ${modifier.name}`}
                                  title="With"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                {modifiers.some((m) => (m.price ?? 0) > 0) && (
                  <div className="mb-2 text-xs font-bold text-gray-600">
                    Paid extras
                  </div>
                )}
                <div className="space-y-3">
                  {modifiers.map((modifier) => {
                    const choice =
                      modifier.price === 0
                        ? removeModifierIds.has(modifier.id)
                          ? 'without'
                          : 'with'
                        : addModifierIds.has(modifier.id)
                          ? 'with'
                          : 'without'

                    return (
                      <div
                        key={modifier.id}
                        className={`group flex flex-col items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                          choice === 'without'
                            ? 'border-red-300 bg-red-50/60 shadow-sm'
                            : choice === 'with'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-full flex-1">
                          <div className="flex  items-start w-full justify-between gap-3">
                            <div className="font-semibold text-text-primary leading-snug">
                              {modifier.name}
                            </div>
                            {modifier.name_ar && (
                            <div className="text-xs text-gray-500 mt-1 text-right">
                              {modifier.name_ar}
                            </div>
                          )}
                          </div>
                          
                          
                        </div>


                        <div className='w-full flex items-center justify-between gap-3'>
                        <div>
                            {modifier.price > 0 && (
                              <span className="shrink-0 rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-xs font-bold">
                                {`+$${modifier.price.toFixed(2)}`}
                              </span>
                            )}
                           </div>

                           <div
                          className="shrink-0 inline-flex items-center rounded-full bg-gray-100 p-1 border border-gray-200"
                          role="group"
                          aria-label={`${modifier.name} with/without`}
                        >
                           
                         <button
                            type="button"
                            onClick={() => setModifierChoice(modifier, 'with')}
                            aria-pressed={choice === 'with'}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              choice === 'with'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            With
                          </button>
                          <button
                            type="button"
                            onClick={() => setModifierChoice(modifier, 'without')}
                            aria-pressed={choice === 'without'}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              choice === 'without'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Without
                          </button>
                        </div>
                        </div>
                       
                      </div>
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