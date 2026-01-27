'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOrder, OrderStatus } from '@/context/OrderContext'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

interface TrackOrderProps {
  tableNumber: string
  restaurantSlug?: string
  onBack?: () => void
  lang?: Lang
}

export default function TrackOrder({ tableNumber, restaurantSlug, onBack, lang = 'fr' }: TrackOrderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentOrder, updateOrderStatus } = useOrder()
  const [activeTab, setActiveTab] = useState<'status' | 'menu' | 'history' | 'profile'>('status')
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null)
  const isRtl = lang === 'ar'

  // Get orderNumber from URL query params (used for realtime status tracking)
  const orderNumber = searchParams.get('orderNumber')

  // Supabase realtime listener for order status changes
  useEffect(() => {
    if (!orderNumber) {
      console.log('No orderNumber provided, skipping realtime subscription')
      return
    }

    console.log('🔍 Listening for status changes on order:', orderNumber)

    const channel = supabase
      .channel(`order-status-${orderNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload) => {
          console.log('📦 Order updated:', payload)
          const updatedOrder = payload.new as { status?: string; order_number?: string }

          if (updatedOrder.status) {
            const newStatus = updatedOrder.status as OrderStatus
            console.log('✅ Status changed to:', newStatus)

            // Update local state
            setLiveStatus(newStatus)

            // Update context (use order_number as id for matching)
            if (updatedOrder.order_number) {
              updateOrderStatus(updatedOrder.order_number, newStatus)
            }

            // Show browser notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(t(lang, 'track_order_title'), {
                body: t(lang, 'order_update_notification', { status: newStatus }),
              })
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Listening for order status changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - enable Realtime on "orders" table')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderNumber, updateOrderStatus, lang])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (restaurantSlug) {
      router.push(`/restaurant/${restaurantSlug}/table/${tableNumber}`)
    }
  }

  const handleTabChange = (tab: 'status' | 'menu' | 'history' | 'profile') => {
    setActiveTab(tab)
    if (tab === 'menu' && restaurantSlug) {
      router.push(`/restaurant/${restaurantSlug}/table/${tableNumber}`)
    }
  }

  // Main status steps (normal flow)
  const statusSteps: Array<{
    key: OrderStatus
    label: string
    description: string
    icon: string
  }> = [
    {
      key: 'preparation',
      label: t(lang, 'status_preparation'),
      description: t(lang, 'status_preparation_desc'),
      icon: '🍳',
    },
    {
      key: 'ready',
      label: t(lang, 'status_ready'),
      description: t(lang, 'status_ready_desc'),
      icon: '🔔',
    },
    {
      key: 'served',
      label: t(lang, 'status_served'),
      description: t(lang, 'status_served_desc'),
      icon: '🍽️',
    },
    {
      key: 'paid',
      label: t(lang, 'status_paid'),
      description: t(lang, 'status_paid_desc'),
      icon: '💳',
    },
  ]

  // Normalize status from database to match our step keys
  const normalizeStatus = (status: string): OrderStatus => {
    const s = status?.toLowerCase()
    // Map 'preparing', 'pending', 'preparation' all to 'preparation'
    if (s === 'preparing' || s === 'pending' || s === 'preparation') {
      return 'preparation'
    }
    if (s === 'ready') return 'ready'
    if (s === 'paid' || s === 'payed' || s === 'payé') return 'paid'
    if (s === 'served') return 'served'
    if (s === 'cancelled' || s === 'canceled' || s === 'annulé' || s === 'annule') return 'cancelled'
    return 'preparation' // default
  }

  const getStatusIndex = (status: OrderStatus) => {
    return statusSteps.findIndex((s) => s.key === status)
  }

  // Use live status from Supabase if available, otherwise use context, default to 'preparation'
  const rawStatus = liveStatus || currentOrder?.status || 'preparation'
  const displayStatus = normalizeStatus(rawStatus)
  const isCancelled = displayStatus === 'cancelled'
  const currentStatusIndex = isCancelled ? -1 : getStatusIndex(displayStatus)

  // Show tracking even if no context order, as long as we have orderNumber from URL
  if (!currentOrder && !orderNumber) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">{t(lang, 'no_active_order')}</p>
          <button
            onClick={handleBack}
            className="text-primary hover:text-primary/70 underline"
          >
            {t(lang, 'go_back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={handleBack}
            className={`${isRtl ? 'ml-4' : 'mr-4'} text-gray-600 hover:text-gray-800`}
          >
            {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </button>
          <h1 className="text-2xl font-bold">{t(lang, 'track_order_title')}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Order Status Card */}
        {isCancelled ? (
          /* Cancelled Order Card */
          <div className="bg-red-50 rounded-lg p-6 mb-6 text-center border border-red-200">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-700">{t(lang, 'status_cancelled')}</h2>
            <p className="text-gray-600">
              {t(lang, 'order_label', { 
                order: orderNumber || currentOrder?.orderNumber || '', 
                table: currentOrder?.tableNumber || tableNumber 
              })}
            </p>
            <p className="text-red-600 mt-3 text-sm">
              {t(lang, 'status_cancelled_desc')}
            </p>
          </div>
        ) : (
          /* Normal Order Confirmation Card */
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
            <h2 className="text-2xl font-bold mb-2">{t(lang, 'order_confirmed')}</h2>
            <p className="text-gray-600">
              {t(lang, 'order_label', { 
                order: orderNumber || currentOrder?.orderNumber || '', 
                table: currentOrder?.tableNumber || tableNumber 
              })}
            </p>
            {/* Live status indicator */}
            <div className="mt-3 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-700">
                {t(lang, 'status_label', { status: statusSteps.find(s => s.key === displayStatus)?.label || displayStatus })}
              </span>
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="space-y-0">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStatusIndex
                const isCurrentStep = index === currentStatusIndex

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Icon and Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                          isActive
                            ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                            : 'bg-gray-100 text-gray-400'
                        } ${isCurrentStep ? 'ring-4 ring-green-200' : ''}`}
                      >
                        {step.icon}
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-10 mt-2 transition-colors ${
                            isActive ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <h3
                        className={`font-bold text-lg mb-1 transition-colors ${
                          isActive ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h3>
                      <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
