'use client'
import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Home, Heart, Plus, ChefHat, User, LogOut, Camera, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export const Navigation = () => {
  const { user, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-gray-900 hover:text-orange-600 transition-colors">
            <ChefHat className="w-8 h-8 text-orange-500" />
            <span>RecipeGram</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link href="/" className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
              <Home className="w-6 h-6 text-gray-700 hover:text-orange-500 transition-colors" />
            </Link>
            
            {user ? (
              <>
                {/* Create Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110"
                  >
                    <Plus className="w-6 h-6 text-gray-700 hover:text-orange-500 transition-colors" />
                  </button>

                  {showDropdown && (
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50">
                      <Link
                        href="/create"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-700 font-medium">Create Recipe</span>
                      </Link>
                      <Link
                        href="/create-story"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <Camera className="w-5 h-5 text-purple-500" />
                        <span className="text-gray-700 font-medium">Create Story</span>
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/liked" className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
                  <Heart className="w-6 h-6 text-gray-700 hover:text-red-500 transition-colors" />
                </Link>
                <Link href="/profile" className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
                  <User className="w-6 h-6 text-gray-700 hover:text-orange-500 transition-colors" />
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110"
                >
                  <LogOut className="w-6 h-6 text-gray-700 hover:text-red-500 transition-colors" />
                </button>
              </>
            ) : (
              <Link 
                href="/auth/login" 
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
