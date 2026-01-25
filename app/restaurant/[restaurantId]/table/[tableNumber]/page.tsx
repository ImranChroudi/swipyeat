import { supabase } from "@/lib/supabase"
import MenuPageClient from "./MenuPageClient"
import { RestaurantData } from "@/types"

interface PageParams {
  params: Promise<{
    restaurantId: string
    tableNumber: string
  }>
}

export default async function Page({ params }: PageParams) {
  const { restaurantId, tableNumber } = await params

  try {
    const [restaurantRes, categoriesRes] = await Promise.all([
      // Fetch restaurant
      supabase
        .from('restaurants')
        .select('id, name, slug')
        .eq('id', restaurantId)
        .single(),

      // Fetch categories with items
      supabase
        .from('categories')
        .select(`
          id,
          name,
          name_ar,
          name_fr,
          description,
          image_url,
          menu_items!inner(
            id,
            name,
            name_ar,
            name_fr,
            description,
            base_price,
            image_url,
            category_id,
            preparation_time,
            is_available,
            allergens,
            item_variants(
              id,
              is_available
            ),
            menu_item_modifiers(
              menu_item_id,
              modifier_id,
              max_selections,
              is_required,
              modifiers!inner(
                id,
                name,
                name_ar,
                name_fr,
                price,
                is_active,
                modifier_type
              )
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .eq('menu_items.is_active', true)
        .eq('menu_items.is_available', true)
        .eq('menu_items.menu_item_modifiers.modifiers.is_active', true)
        .order('name')
        .order('name', { referencedTable: 'menu_items' })
    ])

    if (restaurantRes.error) throw restaurantRes.error
    if (categoriesRes.error) throw categoriesRes.error

    console.log(categoriesRes)

    const restaurantData: RestaurantData = {
      restaurant: restaurantRes.data,
      categories: categoriesRes.data || []
    }

    return (
      <MenuPageClient
        initialData={restaurantData}
        tableNumber={tableNumber}
        restaurantId={restaurantId}
      />
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return <div className="p-4 text-red-600">Error: {errorMessage}</div>
  }
}
