import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ItemVariant, MenuItemModifier, Modifier } from '@/types'

export function useMenuItemDetails(menuItemId: string) {
  const [variants, setVariants] = useState<ItemVariant[]>([])
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [menuItemModifiers, setMenuItemModifiers] = useState<MenuItemModifier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true)

        const [variantsRes, menuItemModifiersRes] = await Promise.all([
          // Get variants for this menu item
          supabase
            .from('item_variants')
            .select('*')
            .eq('menu_item_id', menuItemId)
            .eq('is_available', true),

          // Get modifiers linked to this menu item
          supabase
            .from('menu_item_modifiers')
            .select('*')
            .eq('menu_item_id', menuItemId),
        ])

        if (variantsRes.error) throw variantsRes.error
        if (menuItemModifiersRes.error) throw menuItemModifiersRes.error

        setVariants(variantsRes.data || [])
        setMenuItemModifiers(menuItemModifiersRes.data || [])

        // If there are modifiers linked, fetch their details
        if (menuItemModifiersRes.data && menuItemModifiersRes.data.length > 0) {
          const modifierIds = menuItemModifiersRes.data.map((m) => m.modifier_id)

          const modifiersRes = await supabase
            .from('modifiers')
            .select('*')
            .in('id', modifierIds)
            .eq('is_active', true)

          if (modifiersRes.error) throw modifiersRes.error
          setModifiers(modifiersRes.data || [])
        }
      } catch (err) {
        console.error('Error fetching item details:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (menuItemId) {
      fetchDetails()
    }
  }, [menuItemId])

  return { variants, modifiers, menuItemModifiers, loading, error }
}
