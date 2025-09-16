'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '../../components/Navigation'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Recipe } from '../../lib/types'
import { User, Settings, Camera, Users, Heart, Clock, ChefHat } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string
  created_at: string
}

interface ProfileStats {
  recipesCount: number
  followersCount: number
  followingCount: number
  likesCount: number
}

interface SavedRecipeData {
  recipe_id: string
  recipes: Recipe
}

interface LikedRecipeData {
  recipe_id: string
  recipes: Recipe
}

type TabType = 'recipes' | 'saved' | 'liked'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ProfileStats>({
    recipesCount: 0,
    followersCount: 0,
    followingCount: 0,
    likesCount: 0
  })
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('recipes')
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchStats()
      fetchUserRecipes()
      fetchSavedRecipes()
      fetchLikedRecipes()
    }
  }, [user])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchProfile()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const fetchStats = async () => {
    if (!user) return

    try {
      // Get recipes count
      const { count: recipesCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get followers count  
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id)

      // Get total likes on user's recipes
      const { data: userRecipes } = await supabase
        .from('recipes')
        .select('likes_count')
        .eq('user_id', user.id)

      const likesCount = userRecipes?.reduce((total: number, recipe: any) => total + (recipe.likes_count || 0), 0) || 0

      setStats({
        recipesCount: recipesCount || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        likesCount
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUserRecipes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching user recipes:', error)
      toast.error('Failed to load recipes')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSavedRecipes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select(`
          recipe_id,
          recipes (
            *,
            profiles (
              username,
              full_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const savedRecipesData = data as SavedRecipeData[]
      setSavedRecipes(savedRecipesData?.map((item: SavedRecipeData) => item.recipes).filter(Boolean) || [])
    } catch (error) {
      console.error('Error fetching saved recipes:', error)
    }
  }

  const fetchLikedRecipes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          recipe_id,
          recipes (
            *,
            profiles (
              username,
              full_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const likedRecipesData = data as LikedRecipeData[]
      setLikedRecipes(likedRecipesData?.map((item: LikedRecipeData) => item.recipes).filter(Boolean) || [])
    } catch (error) {
      console.error('Error fetching liked recipes:', error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)

    try {
      // Delete old avatar if exists
      if (profile?.avatar_url && profile.avatar_url.includes('supabase')) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath])
        }
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage - Fixed path
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file) // Changed from filePath to just fileName

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload image')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName) // Changed from filePath to fileName

      const publicUrl = urlData.publicUrl
      
      console.log('Generated avatar URL:', publicUrl)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        toast.error('Failed to update profile')
        return
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      toast.success('Profile picture updated successfully!')

    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const getCurrentRecipes = (): Recipe[] => {
    switch (activeTab) {
      case 'recipes':
        return recipes
      case 'saved':
        return savedRecipes
      case 'liked':
        return likedRecipes
      default:
        return recipes
    }
  }

  const getCurrentCount = (): number => {
    switch (activeTab) {
      case 'recipes':
        return stats.recipesCount
      case 'saved':
        return savedRecipes.length
      case 'liked':
        return likedRecipes.length
      default:
        return stats.recipesCount
    }
  }

  if (loading || !user) {
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg overflow-hidden">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
                )}
                
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              {/* Upload button */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform cursor-pointer ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-0 truncate">
                  @{profile?.username || user?.email?.split('@')[0] || 'user'}
                </h1>
                <Link 
                  href="/profile/edit"
                  className="bg-gray-100 hover:bg-gray-200 px-4 sm:px-6 py-2 rounded-full transition-colors inline-flex items-center justify-center text-sm sm:text-base"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </div>

              {profile?.full_name && (
                <h2 className="text-lg sm:text-xl text-gray-700 mb-4 font-medium">
                  {profile.full_name}
                </h2>
              )}

              {/* Stats */}
              <div className="flex justify-center sm:justify-start space-x-6 sm:space-x-8 mb-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.recipesCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Recipes</div>
                </div>
                <div className="text-center cursor-pointer hover:text-orange-500 transition-colors">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.followersCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center cursor-pointer hover:text-orange-500 transition-colors">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.followingCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Following</div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl">
                {profile?.bio || "No bio yet. Share something about your cooking journey!"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('recipes')}
              className={`flex-shrink-0 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'recipes' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Recipes ({stats.recipesCount})
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`flex-shrink-0 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'saved' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved ({savedRecipes.length})
            </button>
            <button 
              onClick={() => setActiveTab('liked')}
              className={`flex-shrink-0 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'liked' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Liked ({likedRecipes.length})
            </button>
          </div>

          {/* Recipe Grid */}
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-orange-500"></div>
              </div>
            ) : getCurrentRecipes().length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {getCurrentRecipes().map((recipe: Recipe) => (
                  <Link href={`/recipe/${recipe.id}`} key={recipe.id}>
                    <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                      <div className="aspect-square bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center group-hover:scale-105 transition-transform relative overflow-hidden">
                        {recipe.image_url ? (
                          <img 
                            src={recipe.image_url} 
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl sm:text-4xl">🍽️</span>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                            {recipe.category}
                          </span>
                          {activeTab !== 'recipes' && recipe.profiles && (
                            <span className="text-xs text-gray-500 truncate ml-2">
                              by {recipe.profiles.full_name || recipe.profiles.username}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm sm:text-base">
                          {recipe.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                          {recipe.description}
                        </p>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <ChefHat className="w-3 h-3" />
                              <span>{recipe.servings}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{recipe.likes_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-20">
                <div className="text-4xl sm:text-6xl mb-4">
                  {activeTab === 'recipes' ? '📝' : activeTab === 'saved' ? '🔖' : '❤️'}
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                  {activeTab === 'recipes' && 'No recipes yet'}
                  {activeTab === 'saved' && 'No saved recipes'}
                  {activeTab === 'liked' && 'No liked recipes yet'}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-6">
                  {activeTab === 'recipes' && 'Start sharing your delicious recipes!'}
                  {activeTab === 'saved' && 'Save recipes you want to try later'}
                  {activeTab === 'liked' && 'Like recipes to see them here'}
                </p>
                {activeTab === 'recipes' && (
                  <Link
                    href="/create"
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 sm:px-8 py-3 rounded-lg hover:scale-105 transition-transform font-semibold text-sm sm:text-base"
                  >
                    Create Your First Recipe
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
