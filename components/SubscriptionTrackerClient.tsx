'use client'

import { useState, useEffect } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'

type Subscription = {
  id: number
  name: string
  price: number
  next_billing: string
}

export function SubscriptionTrackerClient() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSubscription, setNewSubscription] = useState({ name: '', price: '', next_billing: '' })
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function fetchSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching subscriptions:', error)
    } else {
      setSubscriptions(data || [])
    }
  }

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0)

  const handleAddSubscription = async () => {
    if (newSubscription.name && newSubscription.price && newSubscription.next_billing) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([
          { 
            name: newSubscription.name, 
            price: parseFloat(newSubscription.price), 
            next_billing: newSubscription.next_billing 
          }
        ])
        .select()

      if (error) {
        console.error('Error adding subscription:', error)
      } else if (data) {
        setSubscriptions([...subscriptions, data[0]])
        setNewSubscription({ name: '', price: '', next_billing: '' })
        setIsModalOpen(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-2xl mx-auto bg-zinc-950 text-zinc-200 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="text-xl text-zinc-100">subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <p className="text-sm text-zinc-400">Total Monthly Cost</p>
            <p className="text-3xl text-zinc-100">${totalMonthly.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex justify-between items-center py-3 border-b border-zinc-800">
                <div>
                  <p className="text-zinc-100">{sub.name}</p>
                  <p className="text-xs text-zinc-500">Next billing: {sub.next_billing}</p>
                </div>
                <p className="text-zinc-100">${sub.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline"
            className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-50"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Subscription
          </Button>
        </CardFooter>
      </Card>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border border-zinc-800 mx-auto max-w-sm sm:max-w-md md:max-w-lg w-[calc(100%-2rem)] p-4">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add New Subscription</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="sm:text-right text-zinc-400">
                Name
              </Label>
              <Input
                id="name"
                value={newSubscription.name}
                onChange={(e) => setNewSubscription({...newSubscription, name: e.target.value})}
                className="sm:col-span-3 bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="sm:text-right text-zinc-400">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                value={newSubscription.price}
                onChange={(e) => setNewSubscription({...newSubscription, price: e.target.value})}
                className="sm:col-span-3 bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="next_billing" className="sm:text-right text-zinc-400">
                Next Billing
              </Label>
              <Input
                id="next_billing"
                type="date"
                value={newSubscription.next_billing}
                onChange={(e) => setNewSubscription({...newSubscription, next_billing: e.target.value})}
                className="sm:col-span-3 bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button 
              onClick={handleAddSubscription} 
              className="w-full sm:w-auto bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
            >
              Add Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 