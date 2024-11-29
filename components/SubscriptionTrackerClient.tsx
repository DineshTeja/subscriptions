'use client'

import { useState, useEffect } from 'react'
import { RocketIcon, Check, X, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'

type Account = {
  id: string
  name: string
}

type Subscription = {
  id: number
  name: string
  price: number
  billing_type: 'monthly' | 'yearly'
  status: 'active' | 'expiring'
  account: string
}

export function SubscriptionTrackerClient() {
  const [isAdding, setIsAdding] = useState(false)
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    price: '',
    billing_type: 'monthly',
    status: 'active' as 'active' | 'expiring',
    account: ''
  })
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')

  useEffect(() => {
    fetchAccounts()
    fetchSubscriptions()
  }, [])

  async function fetchAccounts() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching accounts:', error)
    } else {
      setAccounts(data || [])
    }
  }

  async function fetchSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        accounts (
          id,
          name
        )
      `)
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
    if (newSubscription.name && newSubscription.price && newSubscription.account) {
      const { error } = await supabase
        .from('subscriptions')
        .insert([
          {
            name: newSubscription.name,
            price: parseFloat(newSubscription.price),
            billing_type: newSubscription.billing_type,
            status: newSubscription.status,
            account: newSubscription.account
          }
        ])

      if (error) {
        console.error('Error adding subscription:', error)
      } else {
        setNewSubscription({
          name: '',
          price: '',
          billing_type: 'monthly',
          status: 'active',
          account: ''
        })
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
    setNewSubscription({ name: '', price: '', billing_type: 'monthly', status: 'active', account: '' })
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

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return

    const { data, error } = await supabase
      .from('accounts')
      .insert([{ name: newAccountName }])
      .select()

    if (error) {
      console.error('Error adding account:', error)
    } else {
      setAccounts([...accounts, data[0]])
      setNewAccountName('')
      setIsAddingAccount(false)
    }
  }

  const cycleAccountForSubscription = async (subscription: Subscription) => {
    if (accounts.length === 0) return

    const currentIndex = accounts.findIndex(a => a.id === subscription.account)
    const nextIndex = (currentIndex + 1) % accounts.length
    const nextAccount = accounts[nextIndex]

    const { error } = await supabase
      .from('subscriptions')
      .update({ account: nextAccount.id })
      .eq('id', subscription.id)

    if (error) {
      console.error('Error updating subscription account:', error)
    } else {
      setSubscriptions(subscriptions.map(sub =>
        sub.id === subscription.id
          ? { ...sub, account: nextAccount.id }
          : sub
      ))
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto bg-zinc-950 text-zinc-200 border-zinc-800 h-[90vh] max-h-[800px] flex flex-col">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="text-xl text-zinc-100">subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 justify-between gap-6 sm:gap-4 pt-8 pb-6 sm:pb-10">
            <div>
              <p className="text-sm text-zinc-400">Monthly Recurring</p>
              <p className="text-2xl sm:text-3xl text-zinc-100">${totals.monthly.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Yearly Recurring</p>
              <p className="text-2xl sm:text-3xl text-zinc-100">${totals.yearly.toFixed(2)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm text-zinc-400">Annual Total</p>
              <p className="text-2xl sm:text-3xl text-zinc-100">${annualTotal.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto py-3 sm:py-4 mb-3 sm:mb-4 border-y border-zinc-800">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex-shrink-0 px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 text-sm"
              >
                {account.name}
              </div>
            ))}
            {isAddingAccount ? (
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Account name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="h-7 px-2 py-1 bg-zinc-900 border-zinc-700 text-zinc-100 min-w-[120px]"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddAccount}
                  className="h-7 w-7 bg-zinc-800 hover:bg-zinc-700"
                  disabled={!newAccountName.trim()}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingAccount(false)
                    setNewAccountName('')
                  }}
                  className="h-7 w-7 bg-zinc-800 hover:bg-zinc-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setIsAddingAccount(true)}
                className="h-7 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-sm"
              >
                Add Account
              </Button>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 pr-2 pb-4 -mt-1 sm:mt-0">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`group flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-zinc-800 transition-opacity gap-2 ${sub.status === 'expiring' ? 'opacity-50' : ''
                  }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-zinc-100">{sub.name}</p>
                    <button
                      onClick={() => cycleAccountForSubscription(sub)}
                      className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
                    >
                      {accounts.find(a => a.id === sub.account)?.name || 'No account'}
                    </button>
                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                      {sub.billing_type}
                    </span>
                    <button
                      onClick={() => toggleStatus(sub)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${sub.status === 'active'
                          ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                          : 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
                        }`}
                    >
                      {sub.status}
                    </button>
                  </div>
                </div>
                <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
                  <p className="text-zinc-100 transition-[margin] duration-200 group-hover:mr-2">
                    ${sub.price.toFixed(2)}
                  </p>
                  <div className="sm:w-0 sm:group-hover:w-8 overflow-hidden transition-[width] duration-200">
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
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 py-2">
                <Input
                  placeholder="Name"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 flex-1 min-w-[120px]"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newSubscription.price}
                  onChange={(e) => setNewSubscription({ ...newSubscription, price: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 w-full sm:w-[120px]"
                />
                <Select
                  value={newSubscription.billing_type}
                  onValueChange={(value) => setNewSubscription({
                    ...newSubscription,
                    billing_type: value as 'monthly' | 'yearly'
                  })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 w-full sm:w-[120px]">
                    <SelectValue placeholder="Billing" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newSubscription.status}
                  onValueChange={(value) => setNewSubscription({
                    ...newSubscription,
                    status: value as 'active' | 'expiring'
                  })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 w-full sm:w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newSubscription.account}
                  onValueChange={(value) => setNewSubscription({
                    ...newSubscription,
                    account: value
                  })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 w-full sm:w-[120px]">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleAddSubscription}
                    className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700"
                    disabled={!newSubscription.name || !newSubscription.price || !newSubscription.account}
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