'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChefHat, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from URL parameters
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'signup') {
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          return
        }

        // Verify the token with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          console.error('Email confirmation error:', error)
          setStatus('error')
          setMessage('Failed to confirm email. The link may be expired or invalid.')
          return
        }

        if (data.user) {
          // Create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: data.user.user_metadata.username,
              email: data.user.email!,
              full_name: data.user.user_metadata.full_name,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })

          if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
            console.error('Profile creation error:', profileError)
          }

          setStatus('success')
          setMessage('Email confirmed successfully! You can now sign in to your account.')
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login?message=email-confirmed')
          }, 3000)
        }
      } catch (error) {
        console.error('Email confirmation error:', error)
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6">
            {status === 'loading' && (
              <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            )}
            
            {status === 'error' && (
              <div className="h-20 w-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'loading' && 'Confirming Email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {status === 'loading' && 'Please wait while we confirm your email address.'}
            {message}
          </p>

          {/* Actions */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Redirecting to login page in 3 seconds...
              </div>
              <Link
                href="/auth/login?message=email-confirmed"
                className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Link
                href="/auth/signup"
                className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all mr-4"
              >
                Try Again
              </Link>
              <Link
                href="/auth/login"
                className="inline-block bg-white text-gray-800 px-8 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:border-orange-300 hover:bg-gray-50 transition-all"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
