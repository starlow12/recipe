'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX, 
  Heart, Send, MoreHorizontal, X, Share2, ChefHat
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Story {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  text_overlay: string | null
  recipe_id: string | null
  created_at: string
  expires_at: string
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  recipes?: {
    id: string
    title: string
    image_url: string
    category: string
  }
}

interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  fontFamily: string
  isBold: boolean
  isItalic: boolean
}

interface Sticker {
  id: string
  content: string
  x: number
  y: number
  size: number
}

interface StoryElements {
  elements?: TextElement[]
  stickers?: Sticker[]
}

export default function StoryViewerPage() {
  const { userId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const storyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [stories, setStories] = useState<Story[]>([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const STORY_DURATION = 5000 // 5 seconds for images

  useEffect(() => {
    if (userId) {
      fetchStories()
    }
  }, [userId])

  useEffect(() => {
    if (stories.length > 0 && isPlaying && !isPaused) {
      startStoryTimer()
    } else {
      stopStoryTimer()
    }

    return () => {
      stopStoryTimer()
      stopProgress()
    }
  }, [currentStoryIndex, isPlaying, isPaused, stories])

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          ),
          recipes (
            id,
            title,
            image_url,
            category
          )
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      setStories(data || [])
      
      if (data && data.length === 0) {
        toast.error('No active stories found')
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('Failed to load stories')
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const startProgress = () => {
    stopProgress()
    setProgress(0)
    
    const currentStory = stories[currentStoryIndex]
    if (!currentStory) return

    const duration = currentStory.media_type === 'video' ? 10000 : STORY_DURATION
    const increment = 100 / (duration / 100) // Update every 100ms
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment
        if (newProgress >= 100) {
          return 100
        }
        return newProgress
      })
    }, 100)
  }

  const stopProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const startStoryTimer = () => {
    stopStoryTimer()
    startProgress()
    
    const currentStory = stories[currentStoryIndex]
    if (!currentStory) return

    const duration = currentStory.media_type === 'video' ? 10000 : STORY_DURATION
    
    storyTimeoutRef.current = setTimeout(() => {
      nextStory()
    }, duration)
  }

  const stopStoryTimer = () => {
    if (storyTimeoutRef.current) {
      clearTimeout(storyTimeoutRef.current)
      storyTimeoutRef.current = null
    }
    stopProgress()
  }

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1)
      setProgress(0)
    } else {
      router.push('/')
    }
  }

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
      setProgress(0)
    }
  }

  const togglePlayPause = () => {
    setIsPaused(!isPaused)
    
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const handleStoryPress = () => {
    setIsPaused(!isPaused)
  }

  const handleReply = async () => {
    if (!user || !replyText.trim()) return

    try {
      toast.success('Reply sent!')
      setReplyText('')
      setShowReplyInput(false)
    } catch (error) {
      toast.error('Failed to send reply')
    }
  }

  const toggleLike = async () => {
    if (!user) return

    try {
      setIsLiked(!isLiked)
      toast.success(isLiked ? 'Unliked' : 'Liked!')
    } catch (error) {
      toast.error('Failed to like story')
    }
  }

  const shareStory = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${stories[currentStoryIndex]?.profiles.username}'s Story`,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      toast.error('Failed to share')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No stories available</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 px-6 py-2 rounded-full"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentStory = stories[currentStoryIndex]
  let storyElements: StoryElements = {}

  // Parse story elements from text_overlay
  try {
    if (currentStory.text_overlay) {
      storyElements = JSON.parse(currentStory.text_overlay)
    }
  } catch (error) {
    console.error('Error parsing story elements:', error)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="max-w-md mx-auto bg-black relative h-screen">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 p-2">
          <div className="flex space-x-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' 
                      : index === currentStoryIndex ? `${progress}%` 
                      : '0%' 
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-30 px-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
                  {currentStory.profiles.avatar_url ? (
                    <img 
                      src={currentStory.profiles.avatar_url} 
                      alt={currentStory.profiles.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                      {currentStory.profiles.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{currentStory.profiles.username}</p>
                  <p className="text-xs text-white/70">
                    {new Date(currentStory.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {currentStory.media_type === 'video' && (
                <>
                  <button
                    onClick={togglePlayPause}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </>
              )}
              
              <button
                onClick={shareStory}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div 
          className="relative h-full"
          onClick={handleStoryPress}
        >
          {/* Background/Media */}
          {currentStory.media_url.startsWith('http') ? (
            <div className="absolute inset-0">
              {currentStory.media_type === 'image' ? (
                <img 
                  src={currentStory.media_url} 
                  alt="Story media"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  ref={videoRef}
                  src={currentStory.media_url}
                  className="w-full h-full object-cover"
                  autoPlay={!isPaused}
                  muted={isMuted}
                  playsInline
                  loop
                  onLoadedMetadata={() => {
                    if (videoRef.current && !isPaused) {
                      videoRef.current.play()
                    }
                  }}
                />
              )}
            </div>
          ) : (
            <div 
              className="absolute inset-0"
              style={{ backgroundColor: '#FF6B35' }}
            />
          )}

          {/* Recipe Card */}
          {currentStory.recipes && (
            <div className="absolute top-20 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {currentStory.recipes.image_url ? (
                    <img 
                      src={currentStory.recipes.image_url} 
                      alt={currentStory.recipes.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {currentStory.recipes.title}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">
                    {currentStory.recipes.category}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/recipe/${currentStory.recipes?.id}`)
                  }}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700 px-3 py-1 rounded-full bg-blue-50"
                >
                  View
                </button>
              </div>
            </div>
          )}

          {/* Text Elements */}
          {storyElements.elements?.map(element => (
            <div
              key={element.id}
              className="absolute select-none pointer-events-none z-20"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                fontSize: `${element.fontSize}px`,
                color: element.color,
                fontFamily: element.fontFamily,
                fontWeight: element.isBold ? 'bold' : 'normal',
                fontStyle: element.isItalic ? 'italic' : 'normal',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                transform: 'translate(-50%, -50%)',
                maxWidth: '80%',
                wordWrap: 'break-word',
                textAlign: 'center'
              }}
            >
              {element.text}
            </div>
          ))}

          {/* Stickers */}
          {storyElements.stickers?.map(sticker => (
            <div
              key={sticker.id}
              className="absolute select-none pointer-events-none z-20"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                fontSize: `${sticker.size}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {sticker.content}
            </div>
          ))}

          {/* Navigation Areas */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              prevStory()
            }}
            className="absolute left-0 top-0 w-1/3 h-full z-10 focus:outline-none"
            style={{ background: 'transparent' }}
            disabled={currentStoryIndex === 0}
          />
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextStory()
            }}
            className="absolute right-0 top-0 w-1/3 h-full z-10 focus:outline-none"
            style={{ background: 'transparent' }}
          />

          {/* Pause indicator */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center z-25 bg-black/20">
              <div className="bg-black/60 rounded-full p-4">
                <Play className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {user && currentStory.user_id !== user.id && (
          <div className="absolute bottom-6 left-0 right-0 z-30 px-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLike()
                }}
                className={`p-3 rounded-full ${isLiked ? 'bg-red-500' : 'bg-white/20'} transition-colors`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'text-white fill-current' : 'text-white'}`} />
              </button>
              
              <div className="flex-1">
                {showReplyInput ? (
                  <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply to story..."
                      className="flex-1 bg-transparent text-white placeholder-white/70 outline-none"
                      maxLength={100}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReply()
                      }}
                      className="text-white hover:text-blue-300"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowReplyInput(false)
                      }}
                      className="text-white hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowReplyInput(true)
                    }}
                    className="w-full bg-white/20 text-white rounded-full py-3 px-6 text-left"
                  >
                    Send message to {currentStory.profiles.username}...
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Story Counter */}
        <div className="absolute bottom-2 right-4 z-30 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          {currentStoryIndex + 1} / {stories.length}
        </div>
      </div>
    </div>
  )
}
