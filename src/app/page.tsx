'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '../components/Navigation'
import { StoriesSection } from '../components/StoriesSection'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Recipe } from '../lib/types'
import Link from 'next/link'
import { Heart, Clock, Users, ChefHat } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Home() {
  const { user, loading } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [maxTime, setMaxTime] = useState(120) // minutes
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, time, likes
  const [showFilters, setShowFilters] = useState(false)

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer', 'Beverage']

  useEffect(() => {
    fetchRecipes()
  }, [])

  useEffect(() => {
    filterAndSortRecipes()
  }, [recipes, searchTerm, selectedCategory, maxTime, sortBy])

  const filterAndSortRecipes = () => {
    let filtered = [...recipes]

    // Search by title and description
    if (searchTerm.trim()) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory)
    }

    // Filter by cooking time
    filtered = filtered.filter(recipe => (recipe.prep_time + recipe.cook_time) <= maxTime)

    // Sort recipes
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'time':
        filtered.sort((a, b) => (a.prep_time + a.cook_time) - (b.prep_time + b.cook_time))
        break
      case 'likes':
        filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredRecipes(filtered)
  }

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
      toast.error('Failed to load recipes')
    } finally {
      setRecipesLoading(false)
    }
  }

  const toggleLike = async (recipeId: string) => {
    if (!user) {
      toast.error('Please sign in to like recipes')
      return
    }

    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', user.id)
        
        toast.success('Recipe unliked')
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ recipe_id: recipeId, user_id: user.id })
        
        toast.success('Recipe liked!')
      }
      
      // Refresh recipes to update like counts
      fetchRecipes()
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      {/* Stories Section - only show when user is logged in */}
      {user && <StoriesSection />}
      
      {!user ? (
        // Welcome section for non-logged in users - Mobile Optimized
        <main className="flex items-center justify-center py-8 px-4 min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-sm mx-auto">
            <div className="mb-6 animate-bounce">
              <span className="text-4xl sm:text-6xl">🍽️</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 animate-fade-in">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                RecipeGram
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 animate-fade-in leading-relaxed">
              Share your favorite recipes with the world and discover amazing dishes from fellow food lovers!
            </p>
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-4 justify-center">
              <Link href="/auth/signup" className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform shadow-lg hover:shadow-xl text-center">
                Start Cooking 🔥
              </Link>
              <Link href="/auth/login" className="bg-white text-gray-800 px-6 py-3 rounded-full font-semibold border-2 border-gray-200 hover:border-orange-300 hover:scale-105 transition-all shadow-md text-center">
                Sign In
              </Link>
            </div>
          </div>
        </main>
      ) : (
        // Recipe feed for logged in users - Mobile Optimized
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Discover Amazing Recipes
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Fresh recipes from our community of food lovers
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found {filteredRecipes.length} recipes
              </p>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Cooking Time: {maxTime} minutes
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="10"
                    value={maxTime}
                    onChange={(e) => setMaxTime(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10 min</span>
                    <span>3 hours</span>
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'newest', label: 'Newest' },
                      { value: 'oldest', label: 'Oldest' },
                      { value: 'time', label: 'Quick First' },
                      { value: 'likes', label: 'Most Liked' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortBy === option.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('All')
                      setMaxTime(120)
                      setSortBy('newest')
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {recipesLoading ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="animate-spin rounded-full h-20 w-20 sm:h-32 sm:w-32 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Link href={`/recipe/${recipe.id}`}>
                    <div className="aspect-square bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center relative cursor-pointer">
                      {recipe.image_url ? (
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl lg:text-6xl">🍽️</span>
                      )}
                    </div>
                  </Link>

                  <div className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-orange-100 text-orange-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        {recipe.category}
                      </span>
                      <button 
                        onClick={() => toggleLike(recipe.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors p-1"
                      >
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">{recipe.likes_count || 0}</span>
                      </button>
                    </div>

                    <Link href={`/recipe/${recipe.id}`}>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 hover:text-orange-600 transition-colors cursor-pointer line-clamp-2">
                        {recipe.title}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                      {recipe.description}
                    </p>

                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{recipe.prep_time + recipe.cook_time} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{recipe.servings}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChefHat className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Easy</span>
                      </div>
                    </div>

                    {recipe.profiles && (
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <span>by</span>
                        <span className="font-medium">
                          {recipe.profiles.full_name || recipe.profiles.username}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-20">
              {recipes.length === 0 ? (
                <>
                  <div className="text-4xl sm:text-6xl mb-4">📝</div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                    No recipes yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-6">
                    Be the first to share a delicious recipe!
                  </p>
                  <Link
                    href="/create"
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 sm:px-8 py-3 rounded-lg hover:scale-105 transition-transform font-semibold inline-block"
                  >
                    Create First Recipe
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-4xl sm:text-6xl mb-4">🔍</div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                    No recipes found
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-6">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('All')
                      setMaxTime(120)
                      setSortBy('newest')
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:scale-105 transition-transform font-semibold"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      )}
    </div>
  )
}
