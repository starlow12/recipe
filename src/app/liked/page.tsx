'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Recipe } from '@/lib/types'
import Link from 'next/link'
import { Heart, Clock, Users, ChefHat, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface LikedRecipe {
  id: string
  user_id: string
  recipe_id: string
  created_at: string
  recipes: Recipe & {
    profiles: {
      username: string
      full_name: string | null
      avatar_url: string | null
    }
  }
}

export default function LikedRecipesPage() {
  const { user, loading } = useAuth()
  const [likedRecipes, setLikedRecipes] = useState<LikedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchLikedRecipes()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [user, loading])

  const fetchLikedRecipes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          recipes (
            *,
            profiles (
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter out recipes that might have been deleted
      const validLikedRecipes = (data || []).filter((item: any) => item.recipes) as LikedRecipe[]
      setLikedRecipes(validLikedRecipes)
    } catch (error) {
      console.error('Error fetching liked recipes:', error)
      toast.error('Failed to load liked recipes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlike = async (recipeId: string) => {
    if (!user) return

    try {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)

      // Remove from local state
      setLikedRecipes(prev => prev.filter(item => item.recipe_id !== recipeId))
      toast.success('Recipe removed from liked')
    } catch (error) {
      console.error('Error unliking recipe:', error)
      toast.error('Failed to remove recipe')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to see your liked recipes</h2>
            <p className="text-gray-600 mb-6">Keep track of recipes you love by signing in to your account</p>
            <Link 
              href="/auth/login"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recipes You Love
          </h1>
          <p className="text-gray-600">
            All the recipes you've liked in one place
          </p>
        </div>

        {/* Recipes Grid */}
        {likedRecipes.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {likedRecipes.length} liked recipe{likedRecipes.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedRecipes.map((likedRecipe) => {
                const recipe = likedRecipe.recipes
                return (
                  <div
                    key={likedRecipe.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 relative group"
                  >
                    <Link href={`/recipe/${recipe.id}`}>
                      <div className="aspect-square bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center relative cursor-pointer overflow-hidden">
                        {recipe.image_url ? (
                          <img 
                            src={recipe.image_url} 
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-6xl">🍽️</span>
                        )}
                        
                        {/* Unlike button - appears on hover */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleUnlike(recipe.id)
                          }}
                          className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </Link>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                          {recipe.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          Liked {new Date(likedRecipe.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <Link href={`/recipe/${recipe.id}`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-orange-600 transition-colors cursor-pointer">
                          {recipe.title}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {recipe.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{recipe.servings}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ChefHat className="w-4 h-4" />
                          <span>Easy</span>
                        </div>
                      </div>

                      {recipe.profiles && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>by</span>
                          <Link href={`/user/${recipe.profiles.username}`}>
                            <span className="font-medium hover:text-orange-600 transition-colors cursor-pointer">
                              {recipe.profiles.full_name || recipe.profiles.username}
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No liked recipes yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start exploring recipes and like the ones you love!
            </p>
            <Link
              href="/"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-semibold"
            >
              Discover Recipes
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
