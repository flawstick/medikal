"use client"

import { useState, useEffect, useCallback } from "react"
import type { Mission } from "@/lib/types"

let ordersCache: Mission[] | null = null
let fetching: Promise<Mission[]> | null = null
const listeners: Array<(orders: Mission[]) => void> = []

async function fetchOrders(): Promise<Mission[]> {
  const res = await fetch("/api/orders")
  if (!res.ok) throw new Error("Failed to fetch orders")
  const result = await res.json()
  return Array.isArray(result) ? result : result.data || []
}

function notify(orders: Mission[]) {
  for (const listener of listeners) {
    listener(orders)
  }
}

function subscribe(listener: (orders: Mission[]) => void) {
  listeners.push(listener)
  return () => {
    const index = listeners.indexOf(listener)
    if (index > -1) listeners.splice(index, 1)
  }
}

function setCache(orders: Mission[]) {
  ordersCache = orders
  notify(orders)
}

export function useOrders(options?: { refreshInterval?: number }) {
  const [orders, setOrders] = useState<Mission[]>(ordersCache || [])
  const [loading, setLoading] = useState(ordersCache === null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      fetching = fetchOrders()
      const data = await fetching
      setCache(data)
    } finally {
      setLoading(false)
      fetching = null
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe(setOrders)
    if (ordersCache === null) {
      if (!fetching) {
        refresh()
      } else {
        fetching.then(() => {})
      }
    }
    return unsubscribe
  }, [refresh])

  useEffect(() => {
    if (!options?.refreshInterval) return
    const id = setInterval(refresh, options.refreshInterval)
    return () => clearInterval(id)
  }, [options?.refreshInterval, refresh])

  return { orders, loading, refresh }
}

