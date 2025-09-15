'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Recipe } from '@/lib/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  Heart, 
  Bookmark, 
  Clock, 
  Users, 
  ChefHat, 
  User,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Share2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface RecipeWithProfile extends Recipe {
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
  }
}

interface UserInteractions {
  isLiked: boolean
  isSaved: boolean
  isFollowing: boolean
}

export default function RecipeViewPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const recipeId = params.id as string

  const [recipe, setRecipe] = useState<RecipeWithProfile | null>(null)
  const [interactions, setInteractions] = useState<UserInteractions>({
    isLiked: false,
    isSaved: false,
    isFollowing: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({
    like: false,
    save: false,
    follow: false
  })

  useEffect(() => {
    if (recipeId) {
      fetchRecipe()
    }
  }, [recipeId])

  useEffect(() => {
    if (user && recipe) {
      fetchUserInteractions()
    }
  }, [user, recipe])

  const fetchRecipe = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('id', recipeId)
        .single()

      if (error) {
        console.error('Recipe fetch error:', error)
        toast.error('Recipe not found')
        return
      }

      setRecipe(data as RecipeWithProfile)
    } catch (error) {
      console.error('Error fetching recipe:', error)
      toast.error('Failed to load recipe')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserInteractions = async () => {
    if (!user || !recipe) return

    try {
      // Check if liked
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', recipe.id)
        .single()

      // Check if saved
      const { data: saveData } = await supabase
        .from('saved_recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', recipe.id)
        .single()

      // Check if following recipe creator
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', recipe.created_by)
        .single()

      setInteractions({
        isLiked: !!likeData,
        isSaved: !!saveData,
        isFollowing: !!followData
      })
    } catch (error) {
      console.error('Error fetching user interactions:', error)
    }
  }

  const handleLike = async () => {
    if (!user || !recipe) {
      toast.error('Please sign in to like recipes')
      return
    }

    setActionLoading(prev => ({ ...prev, like: true }))

    try {
      if (interactions.isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipe.id)

        // Update likes count
        await supabase
          .from('recipes')
          .update({ likes_count: Math.max(0, (recipe.likes_count || 0) - 1) })
          .eq('id', recipe.id)

        setRecipe(prev => prev ? { ...prev, likes_count: Math.max(0, (prev.likes_count || 0) - 1) } : null)
        setInteractions(prev => ({ ...prev, isLiked: false }))
        toast.success('Recipe unliked')
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ user_id: user.id, recipe_id: recipe.id })

        // Update likes count
        await supabase
          .from('recipes')
          .update({ likes_count: (recipe.likes_count || 0) + 1 })
          .eq('id', recipe.id)

        setRecipe(prev => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : null)
        setInteractions(prev => ({ ...prev, isLiked: true }))
        toast.success('Recipe liked!')
      }
    } catch (error) {
      console.error('Like error:', error)
      toast.error('Something went wrong')
    } finally {
      setActionLoading(prev => ({ ...prev, like: false }))
    }
  }

  const handleSave = async () => {
    if (!user || !recipe) {
      toast.error('Please sign in to save recipes')
      return
    }

    setActionLoading(prev => ({ ...prev, save: true }))

    try {
      if (interactions.isSaved) {
        // Unsave
        await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipe.id)

        setInteractions(prev => ({ ...prev, isSaved: false }))
        toast.success('Recipe removed from saved')
      } else {
        // Save
        await supabase
          .from('saved_recipes')
          .insert({ user_id: user.id, recipe_id: recipe.id })

        setInteractions(prev => ({ ...prev, isSaved: true }))
        toast.success('Recipe saved!')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Something went wrong')
    } finally {
      setActionLoading(prev => ({ ...prev, save: false }))
    }
  }

  const handleFollow = async () => {
    if (!user || !recipe) {
      toast.error('Please sign in to follow users')
      return
    }

    if (user.id === recipe.created_by) {
      toast.error("You can't follow yourself")
      return
    }

    setActionLoading(prev => ({ ...prev, follow: true }))

    try {
      if (interactions.isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', recipe.created_by)

        setInteractions(prev => ({ ...prev, isFollowing: false }))
        toast.success('Unfollowed successfully')
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: recipe.created_by })

        setInteractions(prev => ({ ...prev, isFollowing: true }))
        toast.success('Following successfully')
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast.error('Something went wrong')
    } finally {
      setActionLoading(prev => ({ ...prev, follow: false }))
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title,
          text: recipe?.description || 'Check out this amazing recipe!',
          url: url
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url)
      toast.success('Recipe link copied to clipboard!')
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

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipe not found</h2>
            <Link href="/" className="text-orange-600 hover:text-orange-800">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to recipes
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Recipe Image */}
          {recipe.image_url && (
            <div className="aspect-video bg-gray-200">
              <img 
                src={recipe.image_url} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-6">
              <div className="flex-1 mb-4 md:mb-0">
                <span className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  {recipe.category}
                </span>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {recipe.title}
                </h1>
                {recipe.description && (
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {recipe.description}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleLike}
                  disabled={actionLoading.like}
                  className={`p-3 rounded-full transition-all ${
                    interactions.isLiked
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                  } ${actionLoading.like ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart className={`w-5 h-5 ${interactions.isLiked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleSave}
                  disabled={actionLoading.save}
                  className={`p-3 rounded-full transition-all ${
                    interactions.isSaved
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                  } ${actionLoading.save ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Bookmark className={`w-5 h-5 ${interactions.isSaved ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recipe stats */}
            <div className="grid grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 rounded-xl">
              <div className="text-center">
                <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Prep Time</p>
                <p className="text-lg font-semibold">{recipe.prep_time} min</p>
              </div>
              <div className="text-center">
                <ChefHat className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Cook Time</p>
                <p className="text-lg font-semibold">{recipe.cook_time} min</p>
              </div>
              <div className="text-center">
                <Users className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Servings</p>
                <p className="text-lg font-semibold">{recipe.servings}</p>
              </div>
              <div className="text-center">
                <Heart className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Likes</p>
                <p className="text-lg font-semibold">{recipe.likes_count || 0}</p>
              </div>
            </div>

            {/* Creator Profile */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link href={`/user/${recipe.profiles.username}`}>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden cursor-pointer">
                      {recipe.profiles.avatar_url ? (
                        <img 
                          src={recipe.profiles.avatar_url} 
                          alt={recipe.profiles.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link href={`/user/${recipe.profiles.username}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors cursor-pointer">
                        {recipe.profiles.full_name || `@${recipe.profiles.username}`}
                      </h3>
                    </Link>
                    <p className="text-gray-600">@{recipe.profiles.username}</p>
                    {recipe.profiles.bio && (
                      <p className="text-sm text-gray-600 mt-1">{recipe.profiles.bio}</p>
                    )}
                  </div>
                </div>

                {user && user.id !== recipe.created_by && (
                  <button
                    onClick={handleFollow}
                    disabled={actionLoading.follow}
                    className={`px-6 py-2 rounded-full font-semibold transition-all flex items-center space-x-2 ${
                      interactions.isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                    } ${actionLoading.follow ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {interactions.isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Ingredients */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>
                <div className="space-y-3">
                  {recipe.ingredients.map((ingredient: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-800">
                        {ingredient.amount && ingredient.unit
                          ? `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
                          : ingredient.amount
                          ? `${ingredient.amount} ${ingredient.name}`
                          : ingredient.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructions</h2>
                <div className="space-y-4">
                  {recipe.instructions.map((instruction: string, index: number) => (
                    <div key={index} className="flex space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed pt-1">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
