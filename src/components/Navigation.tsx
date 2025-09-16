'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  ChefHat, 
  Plus, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Search,
  Heart,
  BookOpen,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export const Navigation = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Signed out successfully!')
      router.push('/')
      setIsMenuOpen(false)
      setIsProfileMenuOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
    setIsProfileMenuOpen(false)
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
    setIsMenuOpen(false)
  }

  const closeMenus = () => {
    setIsMenuOpen(false)
    setIsProfileMenuOpen(false)
  }

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 font-bold text-lg sm:text-xl text-gray-900 hover:text-orange-600 transition-colors"
              onClick={closeMenus}
            >
              <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
              <span className="hidden xs:block">RecipeGram</span>
              <span className="block xs:hidden">RG</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {user ? (
                <>
                  <Link 
                    href="/" 
                    className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    <span>Home</span>
                  </Link>
                  
                  <Link 
                    href="/search" 
                    className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </Link>
                  
                  <Link 
                    href="/create" 
                    className="flex items-center space-x-1 bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                  </Link>
                  
                  <Link 
                    href="/create-story" 
                    className="flex items-center space-x-1 bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Story</span>
                  </Link>

                  <div className="relative">
                    <button
                      onClick={toggleProfileMenu}
                      className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold">
                        {user.user_metadata?.avatar_url ? (
                          <img 
                            src={user.user_metadata.avatar_url} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Desktop Profile Dropdown */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <Link 
                          href="/profile" 
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeMenus}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        
                        <Link 
                          href="/my-recipes" 
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeMenus}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>My Recipes</span>
                        </Link>
                        
                        <Link 
                          href="/favorites" 
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeMenus}
                        >
                          <Heart className="w-4 h-4" />
                          <span>Favorites</span>
                        </Link>
                        
                        <hr className="my-2 border-gray-200" />
                        
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/auth/login" 
                    className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-1">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 pb-3 mb-3 border-b border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold">
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <Link 
                    href="/" 
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeMenus}
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </Link>
                  
                  <Link 
                    href="/search" 
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeMenus}
                  >
                    <Search className="w-5 h-5" />
                    <span className="font-medium">Search</span>
                  </Link>
                  
                  <Link 
                    href="/create" 
                    className="flex items-center space-x-3 px-3 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    onClick={closeMenus}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Recipe</span>
                  </Link>
                  
                  <Link 
                    href="/create-story" 
                    className="flex items-center space-x-3 px-3 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                    onClick={closeMenus}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Story</span>
                  </Link>
                  
                  <Link 
                    href="/profile" 
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeMenus}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </Link>
                  
                  <Link 
                    href="/my-recipes" 
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeMenus}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">My Recipes</span>
                  </Link>
                  
                  <Link 
                    href="/favorites" 
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeMenus}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">Favorites</span>
                  </Link>
                  
                  <hr className="my-3 border-gray-200" />
                  
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="flex items-center justify-center py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    onClick={closeMenus}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="flex items-center justify-center py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    onClick={closeMenus}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Overlay for closing menus when clicking outside */}
      {(isMenuOpen || isProfileMenuOpen) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={closeMenus}
        />
      )}
    </>
  )
}
