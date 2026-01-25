import TrackOrder from '@/component/TrackOrder'

interface PageParams {
  params: Promise<{
    restaurantId: string
    tableNumber: string
  }>
}

export default async function TrackOrderPage({ params }: PageParams) {
  const { restaurantId, tableNumber } = await params

  return <TrackOrder tableNumber={tableNumber} restaurantId={restaurantId} />
}
