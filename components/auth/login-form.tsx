'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner' 
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { signIn } from '@/lib/actions/auth'
import type { LoginInput } from '@/lib/validations/auth'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
    remember: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("📝 Login form submitted with email:", formData.email)
    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn(formData)

      if (result.success) {
        console.log("✅ Login successful - redirecting to:", redirectTo)
        toast.success('Welcome back!', {
          description: 'You have successfully signed in.',
        })
        // Small delay to ensure session cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push(redirectTo)
        router.refresh()
      } else {
        console.error("❌ Login failed:", result.error)
        if (result.field) {
          setErrors({ [result.field]: result.error || 'Validation error' })
        } else {
          toast.error('Sign in failed', {
            description: result.error || 'Please check your credentials and try again.',
          })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An unexpected error occurred', {
        description: 'Please try again later.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              className={errors.email ? 'border-error-500' : ''}
              required
            />
            {errors.email && (
              <p className="text-sm text-error-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary-400 hover:text-primary-300 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
              className={errors.password ? 'border-error-500' : ''}
              required
            />
            {errors.password && (
              <p className="text-sm text-error-500">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              checked={formData.remember}
              onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
              disabled={isLoading}
              className="h-4 w-4 rounded border-border-primary bg-bg-elevated text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-secondary"
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember me for 30 days
            </Label>
          </div>
        </CardContent>

        <CardFooter className="flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="text-sm text-center text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-primary-400 hover:text-primary-300 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
