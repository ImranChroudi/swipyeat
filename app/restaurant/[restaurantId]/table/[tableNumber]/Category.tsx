'use client'

import { RestaurantData } from '@/types'
import Image from 'next/image'

type CategoryType = RestaurantData['categories'][0]

const Category = ({
  category,
  selectedCategoryId,
  setSelectedCategoryId,
}: {
  category: CategoryType
  selectedCategoryId: string | null
  setSelectedCategoryId: (id: string) => void
}) => {
    return (
    <button
        key={category.id}
        onClick={() => setSelectedCategoryId(category.id)}
        className={`shrink-0 w-28 flex flex-col items-stretch gap-2 rounded-2xl p-2 transition-all ${
          selectedCategoryId === category.id
            ? 'bg-primary/10 ring-2 ring-primary'
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-white shadow-sm">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-gray-200 to-gray-300" />
          )}
        </div>
        <div className="w-full">
          <div className="text-xs font-semibold text-text-primary truncate text-left">
            {category.name}
          </div>
          {category.menu_items.length > 0 && (
            <div className="text-[11px] text-gray-500 text-left">
              {category.menu_items.length}
            </div>
          )}
        </div>
      </button>
    )
}

export default Category
