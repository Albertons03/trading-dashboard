import { SignupForm } from '@/components/auth/signup-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | AI Commerce Lead Generator',
  description: 'Create your AI Commerce Lead Generator account',
}

export default function SignupPage() {
  return <SignupForm />
}

