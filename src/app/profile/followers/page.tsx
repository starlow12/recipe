'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { User, ArrowLeft, UserMinus, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  isFollowing?: boolean
}

type TabType = 'followers' | 'following'

export default function FollowersPage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('followers')
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get tab from URL params
    const tab = searchParams.get('tab') as TabType
    if (tab === 'following') {
      setActiveTab('following')
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      fetchFollowers()
      fetchFollowing()
    }
  }, [user])

  const fetchFollowers = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('following_id', user.id)

      if (error) throw error

      const followersData = data?.map((item: any) => ({
        ...item.profiles,
        isFollowing: false // Will be updated below
      })) || []

      // Check which followers I'm following back
      if (followersData.length > 0) {
        const { data: mutualFollows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', followersData.map(f => f.id))

        const mutualIds = mutualFollows?.map(f => f.following_id) || []
        
        followersData.forEach((follower: UserProfile) => {
          follower.isFollowing = mutualIds.includes(follower.id)
        })
      }

      setFollowers(followersData)
    } catch (error) {
      console.error('Error fetching followers:', error)
      toast.error('Failed to load followers')
    }
  }

  const fetchFollowing = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', user.id)

      if (error) throw error

      const followingData = data?.map((item: any) => ({
        ...item.profiles,
        isFollowing: true
      })) || []

      setFollowing(followingData)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching following:', error)
      toast.error('Failed to load following')
      setIsLoading(false)
    }
  }

  const handleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!user) return

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)

        toast.success('Unfollowed successfully')
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })

        toast.success('Following successfully')
      }

      // Refresh data
      if (activeTab === 'followers') {
        fetchFollowers()
      } else {
        fetchFollowing()
      }

    } catch (error) {
      console.error('Follow/unfollow error:', error)
      toast.error('Something went wrong')
    }
  }

  const getCurrentUsers = (): UserProfile[] => {
    return activeTab === 'followers' ? followers : following
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
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="mr-4 p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'followers' ? 'Followers' : 'Following'}
          </h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'followers' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Followers ({followers.length})
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'following' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Following ({following.length})
            </button>
          </div>

          {/* Users List */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
              </div>
            ) : getCurrentUsers().length > 0 ? (
              getCurrentUsers().map((profile) => (
                <div key={profile.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <Link href={`/user/${profile.username}`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden cursor-pointer">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </Link>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/user/${profile.username}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-orange-600 transition-colors cursor-pointer">
                          {profile.full_name || `@${profile.username}`}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500">@{profile.username}</p>
                      {profile.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Follow/Unfollow Button */}
                  {profile.id !== user.id && (
                    <button
                      onClick={() => handleFollow(profile.id, profile.isFollowing || false)}
                      className={`px-4 py-2 rounded-full font-semibold text-sm transition-all flex items-center space-x-2 ${
                        profile.isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                      }`}
                    >
                      {profile.isFollowing ? (
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
              ))
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">
                  {activeTab === 'followers' ? '👥' : '🔗'}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === 'followers' 
                    ? 'Share your recipes and people will start following you!'
                    : 'Discover amazing recipes by following other users'
                  }
                </p>
                {activeTab === 'following' && (
                  <Link
                    href="/"
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition-transform font-semibold"
                  >
                    Discover Recipes
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
