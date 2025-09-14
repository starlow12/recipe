'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Heart, Plus } from 'lucide-react'

export const Navigation = () => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            RecipeGram
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="p-2 rounded-full hover:bg-gray-100">
              <Home className="w-6 h-6" />
            </Link>
            <Link href="/create" className="p-2 rounded-full hover:bg-gray-100">
              <Plus className="w-6 h-6" />
            </Link>
            <Link href="/liked" className="p-2 rounded-full hover:bg-gray-100">
              <Heart className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
