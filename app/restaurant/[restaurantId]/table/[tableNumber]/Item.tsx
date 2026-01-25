'use client'

/* eslint-disable @next/next/no-img-element */

import { MenuItem, CartItem } from '@/types'
import { useCart } from '@/context/CartContext'
import { useMemo, useState } from 'react'
import EditCartItemModal from '@/component/EditCartItemModal'
import { Pencil } from 'lucide-react'

const Item = ({ item, handleOpenModal }: { item: MenuItem; handleOpenModal: (item: MenuItem) => void }) => {

  const { addItem, items: cartItems } = useCart()
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)

  const matchingCartItems = useMemo(
    () => cartItems.filter((ci) => ci.menuItemId === item.id),
    [cartItems, item.id]
  )
  const isAdded = matchingCartItems.length > 0
  const primaryCartItem = matchingCartItems[0] ?? null
  const totalQtyInCart = useMemo(
    () => matchingCartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0),
    [matchingCartItems]
  )

  const primaryDetails = useMemo(() => {
    if (!primaryCartItem) return null
    const parts: string[] = []
    if (primaryCartItem.selectedVariant?.name) {
      parts.push(primaryCartItem.selectedVariant.name)
    }
    if (primaryCartItem.selectedModifiers?.length) {
      const modNames = primaryCartItem.selectedModifiers.map((m) => m.modifierName).filter(Boolean)
      if (modNames.length) parts.push(modNames.slice(0, 2).join(', ') + (modNames.length > 2 ? '…' : ''))
    }
    if (primaryCartItem.specialInstructions?.trim()) {
      parts.push('Note')
    }
    return parts.length ? parts.join(' • ') : null
  }, [primaryCartItem])

    return (
        <>
        {editingCartItem && (
          <EditCartItemModal
            cartItem={editingCartItem}
            menuItem={item}
            isOpen={!!editingCartItem}
            onClose={() => setEditingCartItem(null)}
          />
        )}
        <div
                onClick={(e)=>{
                    // Only open the details modal when clicking on the card itself
                    if ((e.target as HTMLElement).closest('button')) return
                    handleOpenModal(item)
                }}
                className="group p-3 min-h-[136px] border border-gray-200 relative flex md:flex-col flex-row overflow-hidden rounded-xl bg-white dark:bg-[#2c2218] shadow-[0_4px_12px_rgba(0,0,0,0.09)] shadow-primary/10 transition-all active:scale-[0.98]"
                >
               <div className="bg-cover flex-1 min-h-full max-w-[130px] rounded-md overflow-hidden ">
                     <img
                      src={"https://th.bing.com/th/id/OIP.9Uri4FM_m1VNxvqZzEwLXwHaE8?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3"}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                </div>
                {/* Image */}
                {/* {item ? (
           
                ) : (
                  <div className="bg-gradient-to-br from-gray-200 h-[100px] w-[100px] to-gray-300 h-full flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )} */}

                {/* Content */}
                <div className="pl-3  flex-1 flex justify-between flex-col">
                 <div>
                 <div className='w-full flex justify-between items-center'>
                  <h3 className="font-semibold text-[18px] leading-normal text-text-primary mb-1">
                    {item.name}
                  </h3>
                  {isAdded && (
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Added ×{totalQtyInCart}
                    </span>
                  )}
                
                  </div>
                 

                  <p className="text-text-secondary max-h-max mb-2 text-sm line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  {isAdded && (primaryDetails || matchingCartItems.length > 1) && (
                    <div className="text-xs text-green-800/90">
                      {primaryDetails ? (
                        <span>{primaryDetails}</span>
                      ) : (
                        <span>In cart</span>
                      )}
                      {matchingCartItems.length > 1 && (
                        <span className="ml-1 text-green-700">
                          (+{matchingCartItems.length - 1} more)
                        </span>
                      )}
                    </div>
                  )}
                 </div>

                 
                  {/* Footer */}
                  <div className="border-t border-gray-200 pt-2">
                   
                    <div className="flex justify-between items-center gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-md font-bold text-primary">
                          {item.base_price.toFixed(0)} Dh
                        </span>
                    </div>
                      {isAdded && primaryCartItem ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCartItem(primaryCartItem)
                          }}
                          className="inline-flex items-center gap-2 bg-primary cursor-pointer shadow-md shadow-primary/40 hover:bg-primary/80 active:bg-primary/90 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const hasModifiers = (item.menu_item_modifiers?.length ?? 0) > 0
                            const hasVariants =
                              (item.item_variants?.some((v) => v.is_available !== false) ?? false)

                            // If the item has variants/modifiers, open the chooser modal.
                            // Otherwise, add directly to cart.
                            if (hasModifiers || hasVariants) {
                              handleOpenModal(item)
                            } else {
                              addItem(item)
                            }
                          }}
                          className=" bg-primary cursor-pointer shadow-md shadow-primary/40 hover:bg-primary/70 text-white px-4 py-1 rounded-lg font-medium transition-colors"
                        >
                          + Add
                        </button>
                      )}
                   
                    </div>
                  </div>
                </div>
              </div>
        </>
    )
}

export default Item
