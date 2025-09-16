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
  const [recipesLoading, setRecipesLoading] = useState(true)

  useEffect(() => {
    fetchRecipes()
  }, [])

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

          {recipesLoading ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="animate-spin rounded-full h-20 w-20 sm:h-32 sm:w-32 border-b-2 border-orange-500"></div>
            </div>
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {recipes.map((recipe) => (
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
            </div>
          )}
        </main>
      )}
    </div>
  )
}
