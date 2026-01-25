
// Data structure you'll receive:
export type RestaurantData = {
  restaurant: {
    id: string
    name: string
    slug: string
    description: string | null
    image_url: string | null
    phone: string | null
    address: string | null
  }
  categories: Array<{
    id: string
    name: string
    name_ar: string | null
    name_fr: string | null
    description: string | null
    image_url: string | null
    menu_items: Array<{
      id: string
      name: string
      name_ar: string | null
      name_fr: string | null
      description: string
      base_price: number
      image_url: string | null
      category_id: string
      preparation_time: number
      is_available: boolean
      allergens: string[] | null
      // Optional nested relations (included by some Supabase selects)
      menu_item_modifiers?: Array<{
        menu_item_id: string
        modifier_id: string
        max_selections: number
        is_required: boolean
        modifiers?: Modifier
      }>
      item_variants?: Array<{
        id: string
        is_available: boolean
      }>
    }>
  }>
}

export type Modifier = {
  id: string
  restaurant_id: string
  name: string
  name_ar: string | null
  name_fr: string | null
  modifier_type: 'choice' | 'multiple' | 'checkbox'
  price: number
  is_default: boolean
  is_active: boolean
}

export type ItemVariant = {
  id: string
  menu_item_id: string
  name: string
  name_ar: string | null
  name_fr: string | null
  price_adjustment: number
  is_available: boolean
}

export type MenuItemModifier = {
  menu_item_id: string
  modifier_id: string
  is_required: boolean
  max_selections: number
}

export type MenuItem = RestaurantData['categories'][0]['menu_items'][0]

export type CartItem = {
  id: string // Unique ID for cart item
  menuItemId: string
  menuItemName: string
  imageUrl?: string | null
  quantity: number
  base_price: number
  selectedVariant?: {
    id: string
    name: string
    priceAdjustment: number
  }
  selectedModifiers: Array<{
    modifierId: string
    modifierName: string
    price: number
  }>
  specialInstructions?: string
  totalPrice: number
}
