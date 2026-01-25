import { RestaurantData } from '@/types'

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
        className={`px-2 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
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
    )
}

export default Category
