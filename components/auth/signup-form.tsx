'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { signUp } from '@/lib/actions/auth'
import type { SignupInput } from '@/lib/validations/auth'

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<SignupInput>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignupInput, string>>>({})

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-error-500' }
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-warning-500' }
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-info-500' }
    return { strength, label: 'Strong', color: 'bg-success-500' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const result = await signUp(formData)

      if (result.success) {
        toast.success('Account created!', {
          description: 'Welcome to AI Commerce Lead Generator. Let\'s create your first organization.',
        })
        router.push('/dashboard')
        router.refresh()
      } else {
        if (result.field) {
          setErrors({ [result.field]: result.error || 'Validation error' })
        } else {
          toast.error('Sign up failed', {
            description: result.error || 'Please check your information and try again.',
          })
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
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
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your information to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
              className={errors.name ? 'border-error-500' : ''}
              required
            />
            {errors.name && (
              <p className="text-sm text-error-500">{errors.name}</p>
            )}
          </div>

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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
              className={errors.password ? 'border-error-500' : ''}
              required
            />
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passwordStrength.strength ? passwordStrength.color : 'bg-bg-elevated'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  Password strength: <span className="font-medium">{passwordStrength.label}</span>
                </p>
              </div>
            )}
            {errors.password && (
              <p className="text-sm text-error-500">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={isLoading}
              className={errors.confirmPassword ? 'border-error-500' : ''}
              required
            />
            {errors.confirmPassword && (
              <p className="text-sm text-error-500">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <input
              id="terms"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              disabled={isLoading}
              className="mt-0.5 h-4 w-4 rounded border-border-primary bg-bg-elevated text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-secondary"
            />
            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
              I agree to the{' '}
              <Link href="/terms" className="text-primary-400 hover:text-primary-300 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary-400 hover:text-primary-300 hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-error-500">{errors.termsAccepted}</p>
          )}
        </CardContent>

        <CardFooter className="flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-sm text-center text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-400 hover:text-primary-300 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
