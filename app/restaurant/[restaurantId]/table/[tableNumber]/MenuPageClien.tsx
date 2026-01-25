'use client'

import MenuItemModal from "@/component/MenuItemModal"
import QuickAddModal from "@/component/QuickAddModal"
import Cart from "@/component/Cart"
import { RestaurantData, MenuItem } from "@/types"
import Image from "next/image"
import { useState } from "react"
import { useCart } from "@/context/CartContext"


interface Props {
  initialData: RestaurantData
  tableNumber: string
}

export default function MenuPageClient({
  initialData,
  tableNumber
}: Props) {
  const { restaurant, categories } = initialData
  const { getItemCount } = useCart()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RestaurantData['categories'][0]['menu_items'][0] | null>(null)

  // Get current category and its items
  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId 
  )  

  const categoryItems = selectedCategoryId !== null 
    ? (selectedCategory?.menu_items || [])
    : categories.flatMap((cat) => cat.menu_items)
  
  // Filter items by search query
  const currentItems = categoryItems.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      (item.name_ar && item.name_ar.toLowerCase().includes(query)) ||
      item.description.toLowerCase().includes(query)
    )
  })

  const handleOpenModal = (item: MenuItem) => {
    setIsModalOpen(true)
    setSelectedItem(item)
  }

  const handleQuickAdd = (item: MenuItem) => {
    setSelectedItem(item)
    setIsQuickAddOpen(true)
  }

  if (isCartOpen) {
    return <Cart onClose={() => setIsCartOpen(false)} tableNumber={tableNumber} />
  }

  return (
    <div className={`${isModalOpen ? 'h-screen overflow-hidden' : 'min-h-screen'} relative bg-gray-50`}>
      {/* Header with restaurant info */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-gray-600 mt-1">{restaurant.description}</p>
              )}
             
            </div>
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-primary hover:bg-primary/70 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>🛒</span>
              <span>Cart</span>
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl relative mx-auto  bg-white z-10 py-8">
        {/* Search Filter */}

        <div className="sticky top-0 w-full  px-4 py-4 bg-white z-10">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="pb-4  z-10">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                    selectedCategoryId === category.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {category.name}
                  {category.menu_items.length > 0 && (
                    <span className="ml-2 text-sm">
                      ({category.menu_items.length})
                    </span>
                  )}
                </button>
              ))}
              <button
                  
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                    selectedCategoryId === null
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Tout
                  {/* {menu_items.length > 0 && (
                    <span className="ml-2 text-sm">
                      ({menu_items.length})
                    </span>
                  )} */}
                </button>
            </div>
          </div>
        )}
        </div>

        {/* Menu Items Grid */}
        {currentItems.length > 0 ? (
         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-4 gap-6">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                {/* Image */}
                {item.image_url ? (
                  <div className="relative h-48 w-full bg-gray-200">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-48 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {item.name}
                  </h3>
                  {item.name_ar && (
                    <p className="text-sm text-gray-500 text-right mb-2">
                      {item.name_ar}
                    </p>
                  )}

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
                    {item.description}
                  </p>

                  {/* Allergens */}
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {item.allergens.map((allergen, idx) => (
                        <span
                          key={idx}
                          className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t pt-3 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-2xl font-bold text-green-600">
                          ${item.base_price.toFixed(2)}
                        </span>
                        {item.preparation_time && (
                          <p className="text-xs text-gray-500">
                            ~{item.preparation_time}min
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickAdd(item)}
                        className="flex-1 bg-primary hover:bg-primary/70 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-medium transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery
                ? `No items found matching "${searchQuery}"`
                : 'No items in this category'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-green-600 hover:text-green-700 underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
      {isModalOpen && selectedItem && (
        <MenuItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isQuickAddOpen && selectedItem && (
        <QuickAddModal
          item={selectedItem}
          isOpen={isQuickAddOpen}
          onClose={() => {
            setIsQuickAddOpen(false)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}