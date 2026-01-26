'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useOrder } from '@/context/OrderContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useMemo, useRef } from 'react'

interface OrderQRCodeProps {
  tableNumber: string
  onClose: (opts?: { accepted?: boolean }) => void
}

function generateOrderId() {
  try {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      if (typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        // RFC4122-ish v4 UUID formatting
        bytes[6] = (bytes[6] & 0x0f) | 0x40
        bytes[8] = (bytes[8] & 0x3f) | 0x80
        const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
          16,
          20
        )}-${hex.slice(20)}`
      }
    }
  } catch {
    // ignore and fall back
  }
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toBase64Url(input: string) {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export default function OrderQRCode({ tableNumber, onClose }: OrderQRCodeProps) {
  const { currentOrder } = useOrder()

  // Keep a stable ID even if the component re-renders.
  const fallbackOrderId = useMemo(() => generateOrderId(), [])
  const orderId = currentOrder?.id ?? fallbackOrderId
  const hasAcceptedRef = useRef(false)

  useEffect(() => {
    // Listen for the waiter/device inserting the order into Supabase.
    // We match the incoming row against the same `orderId` embedded in the QR.
    const channel = supabase
      .channel(`orders-insert:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (hasAcceptedRef.current) return

          const maybe = payload as unknown
          const row =
            typeof maybe === 'object' &&
            maybe !== null &&
            'new' in maybe &&
            typeof (maybe as Record<string, unknown>).new === 'object' &&
            (maybe as Record<string, unknown>).new !== null
              ? ((maybe as Record<string, unknown>).new as Record<string, unknown>)
              : {}
          const incomingId =
            row.order_id ??
            row.orderId ??
            row.client_order_id ??
            row.clientOrderId ??
            row.customer_order_id ??
            row.customerOrderId ??
            row.id

          if (typeof incomingId === 'string' && incomingId === orderId) {
            hasAcceptedRef.current = true
            alert('Order received! Redirecting to track your order…')
            onClose({ accepted: true })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, onClose])

  const orderItems = currentOrder?.items ?? []
  const subtotal = currentOrder?.subtotal ?? 0
  const taxes = 0
  const total = currentOrder?.total ?? subtotal

  // Create order data object
  const orderData = {
    order_request_id: currentOrder?.orderNumber,
    table_id : tableNumber,
    items: orderItems.map((item) => ({
      plat_id: item.menuItemId,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      options : {
          add : item.selectedModifiers.map((modifier) => 
               ({
                key : modifier.modifierName,
                price : modifier.price
              })
          ) ,
          remove: (item.removedModifiers || []).map((modifier) => ({
            key: modifier.modifierName,
          })),
          
      },
      selectedVariant: item.selectedVariant,
      selectedModifiers: item.selectedModifiers,
      removedModifiers: item.removedModifiers,
      specialInstructions: item.specialInstructions,
      totalPrice: item.totalPrice,
    })),
    subtotal,
    taxes,
    total,
    requested_at: new Date().toISOString(),
  }

  // Convert order data to JSON string for QR code
  const qrData = JSON.stringify(orderData)
  // QR should open a website, but still carry the full order payload.
  // NOTE: very large orders can produce very large URLs; if that becomes an issue, we can switch to storing in Supabase and only encode an id.
  const qrUrl = `https://www.google.com/#order=${toBase64Url(qrData)}`

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Order Confirmation</h2>
          <button
            onClick={() => onClose()}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Wait Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex items-center">
            <div className="shrink-0">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Please wait for the waiter to scan your QR code
              </p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
            <QRCodeSVG
              value={qrUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Scan opens google.com and includes your order data
          </p>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4">
          <div className="mb-4">
            <p className="text-lg font-bold mb-2">Table: {tableNumber}</p>
            <p className="text-xs text-gray-500 break-all">Order ID: {orderId}</p>
            <p className="text-sm text-gray-600">
              {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} • Total: ${total.toFixed(2)}
            </p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onClose()}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
          
        </div>
      </div>
    </div>
  )
}
