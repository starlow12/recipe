'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Recipe } from '@/lib/types'
import { useParams, useRouter } from 'next/navigation'
import { User, Users, Heart, Clock, ChefHat, UserPlus, UserMinus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface UserProfile {
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
}

export default function UserProfilePage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats>({
    recipesCount: 0,
    followersCount: 0,
    followingCount: 0
  })
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (username) {
      fetchUserProfile()
    }
  }, [username])

  useEffect(() => {
    if (user && profile) {
      checkFollowStatus()
    }
  }, [user, profile])

  const fetchUserProfile = async () => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError || !profileData) {
        toast.error('User not found')
        router.push('/')
        return
      }

      setProfile(profileData)

      // Get user's recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .eq('created_by', profileData.id)
        .order('created_at', { ascending: false })

      if (!recipesError) {
        setRecipes(recipesData || [])
      }

      // Get stats
      await fetchStats(profileData.id)

    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load profile')
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async (userId: string) => {
    try {
      // Get recipes count
      const { count: recipesCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)

      // Get followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      setStats({
        recipesCount: recipesCount || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const checkFollowStatus = async () => {
    if (!user || !profile || user.id === profile.id) return

    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .single()

      setIsFollowing(!!data)
    } catch (error) {
      // User not following - this is expected for the .single() query
    }
  }

  const handleFollow = async () => {
    if (!user || !profile) {
      toast.error('Please sign in to follow users')
      return
    }

    if (user.id === profile.id) {
      toast.error("You can't follow yourself")
      return
    }

    setFollowLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)

        setIsFollowing(false)
        setStats(prev => ({ ...prev, followersCount: Math.max(0, prev.followersCount - 1) }))
        toast.success('Unfollowed successfully')
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: profile.id })

        setIsFollowing(true)
        setStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }))
        toast.success('Following successfully')
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast.error('Something went wrong')
    } finally {
      setFollowLoading(false)
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
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
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg overflow-hidden">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 md:mb-0">
                  @{profile.username}
                </h1>
                
                {user && user.id !== profile.id && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-2 rounded-full font-semibold transition-all flex items-center space-x-2 ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                    } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isFollowing ? (
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

              {profile.full_name && (
                <h2 className="text-xl text-gray-700 mb-4 font-medium">
                  {profile.full_name}
                </h2>
              )}

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-8 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.recipesCount}</div>
                  <div className="text-sm text-gray-600">Recipes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.followersCount}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.followingCount}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-600 max-w-md">
                {profile.bio || "This user hasn't written a bio yet."}
              </p>
            </div>
          </div>
        </div>

        {/* Recipes */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Recipes ({stats.recipesCount})
            </h2>
          </div>

          <div className="p-6">
            {recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <Link href={`/recipe/${recipe.id}`} key={recipe.id}>
                    <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="aspect-square bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center group-hover:scale-105 transition-transform relative overflow-hidden">
                        {recipe.image_url ? (
                          <img 
                            src={recipe.image_url} 
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">🍽️</span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                            {recipe.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {recipe.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {recipe.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
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
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No recipes yet
                </h3>
                <p className="text-gray-500">
                  {profile.username} hasn't shared any recipes yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
