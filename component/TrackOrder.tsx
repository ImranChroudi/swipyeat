'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrder, OrderStatus } from '@/context/OrderContext'
import { ChevronLeft } from 'lucide-react'

interface TrackOrderProps {
  tableNumber: string
  restaurantId?: string
  onBack?: () => void
}

export default function TrackOrder({ tableNumber, restaurantId, onBack }: TrackOrderProps) {
  const router = useRouter()
  const { currentOrder } = useOrder()
  const [activeTab, setActiveTab] = useState<'status' | 'menu' | 'history' | 'profile'>('status')

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (restaurantId) {
      router.push(`/restaurant/${restaurantId}/table/${tableNumber}`)
    }
  }

  const handleTabChange = (tab: 'status' | 'menu' | 'history' | 'profile') => {
    setActiveTab(tab)
    if (tab === 'menu' && restaurantId) {
      router.push(`/restaurant/${restaurantId}/table/${tableNumber}`)
    }
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">No active order</p>
          <button
            onClick={handleBack}
            className="text-primary hover:text-primary/70 underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const statusSteps: Array<{
    key: OrderStatus
    label: string
    description: string
    icon: string
  }> = [
    {
      key: 'preparation',
      label: 'In Preparation',
      description: 'The kitchen is crafting your meal with fresh ingredients.',
      icon: '🍳',
    },
    {
      key: 'ready',
      label: 'Ready',
      description: 'Your order is plated and waiting for a server.',
      icon: '🔔',
    },
    {
      key: 'served',
      label: 'Served',
      description: 'Arriving at your table. Enjoy your meal!',
      icon: '🍽️',
    },
  ]

  const getStatusIndex = (status: OrderStatus) => {
    return statusSteps.findIndex((s) => s.key === status)
  }

  const currentStatusIndex = getStatusIndex(currentOrder.status)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={handleBack} className="mr-4 text-gray-600 hover:text-gray-800">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Track Order</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Order Confirmation Card */}
        <div className="bg-green-50 rounded-lg p-6 mb-6 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Your order is confirmed!</h2>
          <p className="text-gray-600">
            Order #{currentOrder.orderNumber} • Table {currentOrder.tableNumber}
          </p>
        </div>

        {/* Order Status Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Icon and Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        isActive
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-16 mt-2 ${
                          isActive ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <h3
                      className={`font-bold text-lg mb-1 ${
                        isActive ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
