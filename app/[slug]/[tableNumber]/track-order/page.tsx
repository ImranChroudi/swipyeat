import TrackOrder from '@/component/TrackOrder'

interface PageParams {
  params: Promise<{
    slug: string
    tableNumber: string
  }>
}

export default async function TrackOrderPage({ params }: PageParams) {
  const { slug, tableNumber } = await params

  return <TrackOrder tableNumber={tableNumber} restaurantSlug={slug} />
}
