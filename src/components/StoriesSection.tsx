'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { User, Plus } from 'lucide-react'

interface Story {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  text_overlay: string | null
  created_at: string
  expires_at: string
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface StoryGroup {
  user_id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  stories: Story[]
  hasUnviewedStories: boolean
}

export const StoriesSection = () => {
  const { user } = useAuth()
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStories()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchStories = async () => {
    if (!user) return

    try {
      // Get stories from people the user follows + their own stories
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = followingData?.map((f: any) => f.following_id) || []
      const userIds = [user.id, ...followingIds]

      // Get active stories (not expired)
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .in('user_id', userIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group stories by user
     const groupedStories = (storiesData || []).reduce((acc: Record<string, StoryGroup>, story: any) => {
        const userId = story.user_id
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            username: story.profiles.username,
            full_name: story.profiles.full_name,
            avatar_url: story.profiles.avatar_url,
            stories: [],
            hasUnviewedStories: true // For now, assume all are unviewed
          }
        }
        acc[userId].stories.push(story)
        return acc
      }, {} as Record<string, StoryGroup>)

      // Convert to array and sort (user's stories first)
      const sortedGroups = Object.values(groupedStories).sort((a: StoryGroup, b: StoryGroup) => {
        if (a.user_id === user.id) return -1
        if (b.user_id === user.id) return 1
        return 0
      })

      setStoryGroups(sortedGroups)
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* Loading skeleton */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Check if user has any stories
  const userStoryGroup = storyGroups.find(group => group.user_id === user.id)
  const otherStoryGroups = storyGroups.filter(group => group.user_id !== user.id)

  return (
    <div className="px-4 py-6 bg-white border-b border-gray-100">
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {/* User's own story / Add story */}
        <div className="flex-shrink-0 text-center">
          <div className="relative">
            {userStoryGroup ? (
              // User has stories - show with colorful border
              <Link href={`/story/${userStoryGroup.user_id}`}>
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 cursor-pointer">
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Your story"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              // No stories - show add story button
              <Link href="/create-story">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform relative overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <>
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Add story"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20"></div>
                    </>
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                  <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
              </Link>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 w-16 truncate">
            {userStoryGroup ? 'Your story' : 'Add story'}
          </p>
        </div>

        {/* Other users' stories */}
        {otherStoryGroups.map((group) => (
          <div key={group.user_id} className="flex-shrink-0 text-center">
            <Link href={`/story/${group.user_id}`}>
              <div className={`w-16 h-16 rounded-full p-0.5 cursor-pointer hover:scale-105 transition-transform ${
                group.hasUnviewedStories 
                  ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' 
                  : 'bg-gray-300'
              }`}>
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
                    {group.avatar_url ? (
                      <img 
                        src={group.avatar_url} 
                        alt={`${group.username}'s story`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </Link>
            <p className="text-xs text-gray-600 mt-1 w-16 truncate">
              {group.username}
            </p>
          </div>
        ))}

        {/* Show message if no stories */}
        {storyGroups.length === 0 && (
          <div className="flex-shrink-0 text-center py-4">
            <p className="text-gray-500 text-sm">No stories yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  )
}
