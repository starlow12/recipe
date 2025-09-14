'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Heart, Plus, ChefHat } from 'lucide-react'

export const Navigation = () => {
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
            <Link href="/create" className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
              <Plus className="w-6 h-6 text-gray-700 hover:text-orange-500 transition-colors" />
            </Link>
            <Link href="/liked" className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
              <Heart className="w-6 h-6 text-gray-700 hover:text-red-500 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
