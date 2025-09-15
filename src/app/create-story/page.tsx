'use client'

import React, { useState, useRef } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  X, 
  Type, 
  Camera, 
  Video, 
  ArrowLeft,
  Send,
  Palette
} from 'lucide-react'
import toast from 'react-hot-toast'

interface FormData {
  media: File | null
  mediaType: 'image' | 'video' | null
  textOverlay: string
  backgroundColor: string
  textColor: string
  recipeId: string | null
}

export default function CreateStoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    media: null,
    mediaType: null,
    textOverlay: '',
    backgroundColor: '#FF6B35',
    textColor: '#FFFFFF',
    recipeId: null
  })
  
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTextEditor, setShowTextEditor] = useState(false)

  const backgroundColors = [
    '#FF6B35', '#F7931E', '#FFD23F', '#06FFA5',
    '#3CBCCF', '#1E88E5', '#5E35B1', '#E91E63',
    '#FF5722', '#795548', '#607D8B', '#424242'
  ]

  // Redirect if not logged in
  if (!loading && !user) {
    router.push('/auth/login')
    return null
  }

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB')
      return
    }

    if (isVideo && file.size > 10 * 1024 * 1024) { // 10MB limit for videos
      toast.error('Video size must be less than 10MB')
      return
    }

    setFormData(prev => ({
      ...prev,
      media: file,
      mediaType: isImage ? 'image' : 'video'
    }))

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeMedia = () => {
    setFormData(prev => ({
      ...prev,
      media: null,
      mediaType: null
    }))
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadMedia = async (): Promise<string | null> => {
    if (!formData.media || !user) return null

    try {
      const fileExt = formData.media.name.split('.').pop()
      const fileName = `story-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `stories/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, formData.media)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload media')
        return null
      }

      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Media upload error:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create stories')
      return
    }

    if (!formData.media && !formData.textOverlay.trim()) {
      toast.error('Please add media or text to your story')
      return
    }

    setIsLoading(true)

    try {
      let mediaUrl = null
      
      // Upload media if exists
      if (formData.media) {
        mediaUrl = await uploadMedia()
        if (formData.media && !mediaUrl) {
          setIsLoading(false)
          return
        }
      }

      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Create story
      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: mediaUrl || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="533" viewBox="0 0 300 533"><rect width="300" height="533" fill="${encodeURIComponent(formData.backgroundColor)}"/><text x="150" y="266" text-anchor="middle" fill="${encodeURIComponent(formData.textColor)}" font-size="24" font-family="Arial">${encodeURIComponent(formData.textOverlay)}</text></svg>`,
          media_type: formData.media ? formData.mediaType : 'image',
          text_overlay: formData.textOverlay.trim() || null,
          recipe_id: formData.recipeId,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Story creation error:', error)
        toast.error('Failed to create story')
        return
      }

      toast.success('Story created successfully!')
      router.push('/')

    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
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
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Create Story</h1>
          <div className="w-10"></div>
        </div>

        {/* Story Preview */}
        <div className="aspect-[9/16] bg-gray-900 relative overflow-hidden">
          {mediaPreview ? (
            <>
              {formData.mediaType === 'image' ? (
                <img 
                  src={mediaPreview} 
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={mediaPreview}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              
              {/* Remove media button */}
              <button
                onClick={removeMedia}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center relative"
              style={{ backgroundColor: formData.backgroundColor }}
            >
              {formData.textOverlay && (
                <p 
                  className="text-center px-8 break-words max-w-full text-2xl font-bold"
                  style={{ color: formData.textColor }}
                >
                  {formData.textOverlay}
                </p>
              )}
              
              {!formData.textOverlay && !mediaPreview && (
                <div className="text-center text-white/70">
                  <Camera className="w-16 h-16 mx-auto mb-4" />
                  <p>Tap to add media or text</p>
                </div>
              )}
            </div>
          )}

          {/* Text overlay on media */}
          {mediaPreview && formData.textOverlay && (
            <div className="absolute inset-0 flex items-end justify-center pb-20">
              <p 
                className="text-center px-4 text-2xl font-bold shadow-lg"
                style={{ color: formData.textColor }}
              >
                {formData.textOverlay}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Media Controls */}
          <div className="flex items-center justify-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Add Media</span>
            </button>

            <button
              onClick={() => setShowTextEditor(!showTextEditor)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors"
            >
              <Type className="w-5 h-5" />
              <span>Add Text</span>
            </button>
          </div>

          {/* Text Editor */}
          {showTextEditor && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <textarea
                value={formData.textOverlay}
                onChange={(e) => setFormData(prev => ({ ...prev, textOverlay: e.target.value }))}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                maxLength={200}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-white text-sm">
                  {formData.textOverlay.length}/200
                </div>
              </div>

              {/* Background Colors */}
              {!mediaPreview && (
                <div>
                  <p className="text-white text-sm mb-2">Background Color:</p>
                  <div className="grid grid-cols-6 gap-2">
                    {backgroundColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, backgroundColor: color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.backgroundColor === color ? 'border-white' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Text Color */}
              <div>
                <p className="text-white text-sm mb-2">Text Color:</p>
                <div className="flex space-x-2">
                  {['#FFFFFF', '#000000', '#FF6B35', '#3CBCCF', '#FFD23F'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, textColor: color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.textColor === color ? 'border-blue-500' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Publish Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!formData.media && !formData.textOverlay.trim())}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Story...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Share Story</span>
              </>
            )}
          </button>

          <p className="text-gray-400 text-center text-sm">
            Your story will disappear after 24 hours
          </p>
        </div>
      </div>
    </div>
  )
}
