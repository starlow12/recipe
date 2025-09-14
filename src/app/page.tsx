'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '../components/Navigation'
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
      
      {!user ? (
        // Welcome section for non-logged in users
        <main className="flex items-center justify-center py-20">
          <div className="text-center max-w-2xl mx-auto px-4">
            <div className="mb-8 animate-bounce">
              <span className="text-6xl">🍽️</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                RecipeGram
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-fade-in">
              Share your favorite recipes with the world and discover amazing dishes from fellow food lovers!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform shadow-lg hover:shadow-xl">
                Start Cooking 🔥
              </Link>
              <Link href="/auth/login" className="bg-white text-gray-800 px-8 py-3 rounded-full font-semibold border-2 border-gray-200 hover:border-orange-300 hover:scale-105 transition-all shadow-md">
                Sign In
              </Link>
            </div>
          </div>
        </main>
      ) : (
        // Recipe feed for logged in users
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Discover Amazing Recipes
            </h1>
            <p className="text-gray-600">
              Fresh recipes from our community of food lovers
            </p>
          </div>

          {recipesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
            </div>
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
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
                        <span className="text-6xl">🍽️</span>
                      )}
                    </div>
                  </Link>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                        {recipe.category}
                      </span>
                      <button 
                        onClick={() => toggleLike(recipe.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{recipe.likes_count || 0}</span>
                      </button>
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
                        <span>{recipe.prep_time + recipe.cook_time} min</span>
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
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No recipes yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to share a delicious recipe!
              </p>
              <Link
                href="/create"
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition-transform font-semibold"
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
