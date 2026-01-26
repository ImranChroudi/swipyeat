'use client'

import MenuItemModal from "@/component/MenuItemModal"
import Cart from "@/component/Cart"
import { RestaurantData, MenuItem } from "@/types"
import { useState } from "react"
import { useCart } from "@/context/CartContext"
import Item from "./Item"
import Category from "./Category"
import { Search } from "lucide-react"
import { ShoppingBag } from "lucide-react"
import { ChevronDown } from "lucide-react"


interface Props {
  initialData?: RestaurantData
  tableNumber?: string
  restaurantId?: string
}

export default function MenuPageClient({
  initialData,
  tableNumber,
  restaurantId
}: Props) {
  const { restaurant, categories } = initialData
  const { getItemCount, getTotal } = useCart()
  // Default to "Tout" (all categories) on first load
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RestaurantData['categories'][0]['menu_items'][0] | null>(null)
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId 
  )  

  const categoryItems = selectedCategoryId !== null 
    ? (selectedCategory?.menu_items || [])
    : categories.flatMap((cat) => cat.menu_items)
  

  const matchesSearch = (item: RestaurantData['categories'][0]['menu_items'][0]) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      (item.name_ar && item.name_ar.toLowerCase().includes(query)) ||
      item.description.toLowerCase().includes(query)
    )
  }

  const currentItems = categoryItems.filter(matchesSearch)

  const groupedCategories =
    selectedCategoryId === null
      ? categories
          .map((cat) => ({
            category: cat,
            items: (cat.menu_items || []).filter(matchesSearch),
          }))
          .filter((g) => g.items.length > 0)
      : []

   

  const handleOpenModal = (item: MenuItem) => {
    setIsModalOpen(true)
    setSelectedItem(item)
  }

  const anyModalOpen = isModalOpen || isOverlayOpen


  if (isCartOpen) {
    return <Cart onClose={() => setIsCartOpen(false)} tableNumber={tableNumber} restaurantId={restaurantId} />
  }

  return (
    <div className={`${anyModalOpen ? 'h-screen overflow-hidden' : 'min-h-screen'} relative bg-gray-50 shadow-lg`}>
      {/* Header with restaurant info */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-gray-600 mt-1">{restaurant.description}</p>
              )}
             
            </div>
            {/* Language selector (header) */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
                aria-label="Language"
                className="appearance-none h-10 rounded-xl border-2 border-primary/40 bg-white pl-4 pr-10 text-sm font-bold text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="fr">fr</option>
                <option value="en">en</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl relative mx-auto  bg-white z-10 py-2">
        {/* Search Filter */}

        <div className="sticky top-0 w-full  py-2 bg-white z-1111">
        <div className="mb-2 px-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-1 bg-gray-200 focus:ring-primary/80 outline-none  text-lg"
            />
            <span className="absolute left-3 top-1/2  transform -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
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
          <div className=" z-10 px-4">
            <div className="flex gap-2 overflow-x-auto py-2 ">
            <button    
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                    selectedCategoryId === null
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Tout
                </button>
              {categories.map((category) => (
                <Category key={category.id} category={category} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} />
              ))}
             
            </div>
          </div>
        )}
        </div>

        {/* Menu Items */}
        {selectedCategoryId === null ? (
          groupedCategories.length > 0 ? (
            <div className="px-4 space-y-8">
              {groupedCategories.map(({ category, items }) => (
                <section key={category.id}>
                  <div className="sticky top-28 z-10 -mx-4 px-4 py-2 bg-white/95 backdrop-blur border-b border-gray-100">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-extrabold text-text-primary">
                        {category.name}
                      </h2>
                      <span className="text-xs font-semibold text-gray-500">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => (
                      <div key={item.id}>
                        <Item item={item} handleOpenModal={handleOpenModal} onOverlayChange={setIsOverlayOpen} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? `No items found matching "${searchQuery}"`
                  : 'No items in this restaurant'}
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
          )
        ) : currentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-4 gap-3">
            {currentItems.map((item) => (
              <div key={item.id}>
                <Item item={item} handleOpenModal={handleOpenModal} onOverlayChange={setIsOverlayOpen} />
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

      {/* Floating Cart Button */}
      {!anyModalOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          aria-label="Open cart"
          className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-white border-2 border-primary/40 ring-2 ring-primary/20 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        >
          <span className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow">
            {getItemCount()}
          </span>
          <ShoppingBag className="w-6 h-6 text-primary" />
        </button>
      )}

      {isModalOpen && selectedItem && (
        <MenuItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

    </div>
  )
}