'use client'

import { useState, useEffect } from 'react'
import { RocketIcon, Check, X, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from '@/lib/supabase'

type Subscription = {
  id: number
  name: string
  price: number
  billing_type: 'monthly' | 'yearly'
  status: 'active' | 'expiring'
}

export function SubscriptionTrackerClient() {
  const [isAdding, setIsAdding] = useState(false)
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    price: '',
    billing_type: 'monthly',
    status: 'active' as 'active' | 'expiring'
  })
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function fetchSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('status', { ascending: false })
      .order('billing_type')
      .order('name')

    if (error) {
      console.error('Error fetching subscriptions:', error)
    } else {
      setSubscriptions(data || [])
    }
  }

  const totals = subscriptions.reduce((acc, sub) => {
    if (sub.status === 'expiring') return acc
    if (sub.billing_type === 'yearly') {
      acc.yearly += sub.price
    } else {
      acc.monthly += sub.price
    }
    return acc
  }, { monthly: 0, yearly: 0 })

  const annualTotal = (totals.monthly * 12) + totals.yearly

  const handleAddSubscription = async () => {
    if (newSubscription.name && newSubscription.price) {
      const { error } = await supabase
        .from('subscriptions')
        .insert([
          {
            name: newSubscription.name,
            price: parseFloat(newSubscription.price),
            billing_type: newSubscription.billing_type,
            status: newSubscription.status
          }
        ])

      if (error) {
        console.error('Error adding subscription:', error)
      } else {
        setNewSubscription({ name: '', price: '', billing_type: 'monthly', status: 'active' })
        setIsAdding(false)
        fetchSubscriptions()
      }
    }
  }

  const toggleStatus = async (subscription: Subscription) => {
    const newStatus = subscription.status === 'active' ? 'expiring' : 'active'
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: newStatus })
      .eq('id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      setSubscriptions(subscriptions.map(sub =>
        sub.id === subscription.id
          ? { ...sub, status: newStatus }
          : sub
      ))
    }
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setNewSubscription({ name: '', price: '', billing_type: 'monthly', status: 'active' })
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting subscription:', error)
    } else {
      setSubscriptions(subscriptions.filter(sub => sub.id !== id))
    }
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto bg-zinc-950 text-zinc-200 border-zinc-800 h-[800px] flex flex-col">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="text-xl text-zinc-100">subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden">
          <div className="flex justify-between pt-8 pb-10">
            <div>
              <p className="text-sm text-zinc-400">Monthly Recurring</p>
              <p className="text-3xl text-zinc-100">${totals.monthly.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Yearly Recurring</p>
              <p className="text-3xl text-zinc-100">${totals.yearly.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Annual Total</p>
              <p className="text-3xl text-zinc-100">${annualTotal.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 pr-2 pb-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`group flex justify-between items-center py-3 border-b border-zinc-800 transition-opacity ${
                  sub.status === 'expiring' ? 'opacity-50' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-zinc-100">{sub.name}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                      {sub.billing_type}
                    </span>
                    <button
                      onClick={() => toggleStatus(sub)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        sub.status === 'active' 
                          ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' 
                          : 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
                      }`}
                    >
                      {sub.status}
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-zinc-100 transition-[margin] duration-200 group-hover:mr-2">
                    ${sub.price.toFixed(2)}
                  </p>
                  <div className="w-0 group-hover:w-8 overflow-hidden transition-[width] duration-200">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(sub.id)}
                      className="h-8 w-8 bg-red-900/30 hover:bg-red-900/50 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 mt-auto">
            {isAdding ? (
              <div className="flex justify-between items-center gap-2 py-2">
                <Input
                  placeholder="Name"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 w-[200px]"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newSubscription.price}
                  onChange={(e) => setNewSubscription({ ...newSubscription, price: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 w-[120px]"
                />
                <select
                  value={newSubscription.billing_type}
                  onChange={(e) => setNewSubscription({
                    ...newSubscription,
                    billing_type: e.target.value as 'monthly' | 'yearly'
                  })}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 rounded-md p-2 w-[120px]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <select
                  value={newSubscription.status}
                  onChange={(e) => setNewSubscription({
                    ...newSubscription,
                    status: e.target.value as 'active' | 'expiring'
                  })}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 rounded-md p-2 w-[120px]"
                >
                  <option value="active">Active</option>
                  <option value="expiring">Expiring</option>
                </select>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleAddSubscription}
                    className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700"
                    disabled={!newSubscription.name || !newSubscription.price}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={cancelAdd}
                    className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-50"
                onClick={() => setIsAdding(true)}
              >
                <RocketIcon className="mr-2 h-4 w-4" />
                add new subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 