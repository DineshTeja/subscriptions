'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const router = useRouter()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.push('/')
            }
        }
        checkUser()
    }, [router, supabase.auth])

    const handleAuth = async () => {
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) {
                alert(`Error signing up: ${error.message}`)
            } else {
                alert('Check your email for the confirmation link!')
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                alert(`Error signing in: ${error.message}`)
            } else {
                router.push('/')
                router.refresh() // Ensure the layout re-renders with the new session
            }
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto bg-zinc-950 text-zinc-200 border-zinc-800">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-zinc-100">Welcome</CardTitle>
                    <CardDescription className="text-zinc-400">
                        {isSignUp ? 'Create an account to track your subscriptions' : 'Sign in to your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="signin" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                            <TabsTrigger value="signin" onClick={() => setIsSignUp(false)} className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400">Sign In</TabsTrigger>
                            <TabsTrigger value="signup" onClick={() => setIsSignUp(true)} className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400">Sign Up</TabsTrigger>
                        </TabsList>
                        <TabsContent value={isSignUp ? 'signup' : 'signin'}>
                            <div className="space-y-4 pt-4">
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                />
                                <Button onClick={handleAuth} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                                    {isSignUp ? 'Sign Up' : 'Sign In'}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                    <p className="mt-4 text-center text-sm text-zinc-500">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}{/* eslint-disable-line react/no-unescaped-entities */}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-semibold text-zinc-300 hover:text-zinc-100"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
} 