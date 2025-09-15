'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Upload, X, Type, Camera, ArrowLeft, Send,
  Sparkles, Trash2, Plus, Bold, Italic,
  Smile, ChefHat, Palette
} from 'lucide-react'
import toast from 'react-hot-toast'

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

interface Recipe {
  id: string
  title: string
  description: string
  image_url: string
  category: string
  prep_time: number
  cook_time: number
  servings: number
}

export default function CreateStoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storyContainerRef = useRef<HTMLDivElement>(null)
  
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [backgroundColor, setBackgroundColor] = useState('#FF6B35')
  const [isLoading, setIsLoading] = useState(false)
  const [currentTool, setCurrentTool] = useState<'media' | 'text' | 'stickers' | 'recipes' | 'effects'>('media')
  
  // Text elements
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  
  // Stickers
  const [stickers, setStickers] = useState<Sticker[]>([])
  
  // Recipe
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  
  // Dragging
  const [isDragging, setIsDragging] = useState(false)
  const [dragElementId, setDragElementId] = useState<string | null>(null)
  const [dragType, setDragType] = useState<'text' | 'sticker' | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const backgroundColors = [
    '#FF6B35', '#F7931E', '#FFD23F', '#06FFA5',
    '#3CBCCF', '#1E88E5', '#5E35B1', '#E91E63',
    '#FF5722', '#795548', '#607D8B', '#424242'
  ]

  const backgroundGradients = [
    'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
    'linear-gradient(45deg, #FFD93D, #6BCF7F)',
    'linear-gradient(45deg, #4FACFE, #00F2FE)',
    'linear-gradient(45deg, #FA709A, #FEE140)',
    'linear-gradient(45deg, #A18CD1, #FBC2EB)',
    'linear-gradient(45deg, #667eea, #764ba2)'
  ]

  const storyStickers = [
    '❤️', '😍', '🔥', '✨', '🌟', '💯', 
    '🎉', '🌈', '💫', '🦋', '🌸', '🍕',
    '☀️', '🌙', '⭐', '💖', '🎈', '🌻'
  ]

  useEffect(() => {
    if (user) {
      fetchUserRecipes()
    }
  }, [user])

  // Redirect if not logged in
  if (!loading && !user) {
    router.push('/auth/login')
    return null
  }

  const fetchUserRecipes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
    }
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

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    setMediaFile(file)
    setMediaType(isImage ? 'image' : 'video')

    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaType(null)
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addTextElement = () => {
    if (!newText.trim()) return

    const newElement: TextElement = {
      id: Date.now().toString(),
      text: newText,
      x: 50, // percentage
      y: 50, // percentage
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'Arial',
      isBold: false,
      isItalic: false
    }

    setTextElements(prev => [...prev, newElement])
    setNewText('')
    setSelectedTextId(newElement.id)
  }

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }

  const deleteTextElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id))
    setSelectedTextId(null)
  }

  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Date.now().toString(),
      content: emoji,
      x: Math.random() * 60 + 20, // percentage
      y: Math.random() * 60 + 20, // percentage
      size: 40
    }

    setStickers(prev => [...prev, newSticker])
  }

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id))
  }

  const selectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    toast.success(`Recipe "${recipe.title}" added to story!`)
  }

  const removeRecipe = () => {
    setSelectedRecipe(null)
  }

  // Mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent, elementId: string, type: 'text' | 'sticker') => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    setDragElementId(elementId)
    setDragType(type)
    
    if (type === 'text') {
      setSelectedTextId(elementId)
    }

    const rect = storyContainerRef.current?.getBoundingClientRect()
    if (rect) {
      let element
      if (type === 'text') {
        element = textElements.find(el => el.id === elementId)
      } else {
        element = stickers.find(el => el.id === elementId)
      }
      
      if (element) {
        setDragOffset({
          x: e.clientX - rect.left - (element.x / 100) * rect.width,
          y: e.clientY - rect.top - (element.y / 100) * rect.height
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragElementId || !dragType) return

    const rect = storyContainerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(90, x))
    const clampedY = Math.max(0, Math.min(90, y))

    if (dragType === 'text') {
      updateTextElement(dragElementId, { x: clampedX, y: clampedY })
    } else {
      setStickers(prev =>
        prev.map(el =>
          el.id === dragElementId
            ? { ...el, x: clampedX, y: clampedY }
            : el
        )
      )
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragElementId(null)
    setDragType(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || !user) return null

    try {
      const fileExt = mediaFile.name.split('.').pop()
      const fileName = `story-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `stories/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, mediaFile)

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

    if (!mediaFile && textElements.length === 0 && !selectedRecipe) {
      toast.error('Please add some content to your story')
      return
    }

    setIsLoading(true)

    try {
      let mediaUrl = null
      let finalMediaType = 'image'
      
      if (mediaFile) {
        mediaUrl = await uploadMedia()
        if (!mediaUrl) {
          setIsLoading(false)
          return
        }
        finalMediaType = mediaType || 'image'
      } else {
        // Create a simple colored background as image
        mediaUrl = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="533" viewBox="0 0 300 533"><rect width="300" height="533" fill="${encodeURIComponent(backgroundColor)}"/></svg>`
        finalMediaType = 'image'
      }

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Create text overlay from elements
      let textOverlay = null
      if (textElements.length > 0) {
        textOverlay = JSON.stringify({
          elements: textElements,
          stickers: stickers
        })
      }

      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: finalMediaType,
          text_overlay: textOverlay,
          recipe_id: selectedRecipe?.id || null,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Story creation error:', error)
        toast.error('Failed to create story')
        return
      }

      toast.success('Story created successfully! 🎉')
      router.push('/')

    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTextElement = textElements.find(el => el.id === selectedTextId)

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
        <div className="flex items-center justify-between p-4 text-white relative z-10">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Create Story</h1>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Story Canvas */}
        <div 
          ref={storyContainerRef}
          className="aspect-[9/16] relative overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ background: backgroundColor }}
        >
          {/* Media Background */}
          {mediaPreview && (
            <div className="absolute inset-0">
              {mediaType === 'image' ? (
                <img 
                  src={mediaPreview} 
                  alt="Story media"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={mediaPreview}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              )}
            </div>
          )}

          {/* Recipe Card */}
          {selectedRecipe && (
            <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {selectedRecipe.image_url ? (
                    <img 
                      src={selectedRecipe.image_url} 
                      alt={selectedRecipe.title}
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
                    {selectedRecipe.title}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedRecipe.category} • {selectedRecipe.prep_time + selectedRecipe.cook_time} min
                  </p>
                </div>
                <button
                  onClick={removeRecipe}
                  className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Text Elements */}
          {textElements.map(element => (
            <div
              key={element.id}
              className={`absolute cursor-move select-none transition-all ${
                selectedTextId === element.id ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
              }`}
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
                wordWrap: 'break-word'
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'text')}
            >
              {element.text}
            </div>
          ))}

          {/* Stickers */}
          {stickers.map(sticker => (
            <div
              key={sticker.id}
              className="absolute cursor-move select-none hover:scale-110 transition-transform"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                fontSize: `${sticker.size}px`,
                transform: 'translate(-50%, -50%)'
              }}
              onMouseDown={(e) => handleMouseDown(e, sticker.id, 'sticker')}
              onDoubleClick={() => deleteSticker(sticker.id)}
            >
              {sticker.content}
            </div>
          ))}

          {/* Remove media button */}
          {mediaPreview && (
            <button
              onClick={removeMedia}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Tools */}
        <div className="p-4 space-y-4">
          {/* Tool Selector */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2">
            {[
              { id: 'media', icon: Camera, label: 'Media' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'stickers', icon: Smile, label: 'Stickers' },
              { id: 'recipes', icon: ChefHat, label: 'Recipes' },
              { id: 'effects', icon: Sparkles, label: 'Effects' }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id as any)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all text-xs ${
                  currentTool === tool.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <tool.icon className="w-4 h-4" />
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Tool Options */}
          <div className="bg-gray-900 rounded-xl p-4 max-h-60 overflow-y-auto">
            {/* Media Tools */}
            {currentTool === 'media' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Photo/Video</span>
                </button>
              </div>
            )}

            {/* Text Tools */}
            {currentTool === 'text' && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text..."
                    className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <button
                    onClick={addTextElement}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {selectedTextElement && (
                  <div className="space-y-3 border-t border-gray-700 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Selected: "{selectedTextElement.text.substring(0, 20)}..."</span>
                      <button
                        onClick={() => deleteTextElement(selectedTextElement.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Font Size</label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={selectedTextElement.fontSize}
                        onChange={(e) => updateTextElement(selectedTextElement.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateTextElement(selectedTextElement.id, { isBold: !selectedTextElement.isBold })}
                        className={`px-3 py-1 rounded ${selectedTextElement.isBold ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateTextElement(selectedTextElement.id, { isItalic: !selectedTextElement.isItalic })}
                        className={`px-3 py-1 rounded ${selectedTextElement.isItalic ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {['#FFFFFF', '#000000', '#FF6B35', '#3CBCCF', '#FFD23F'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateTextElement(selectedTextElement.id, { color })}
                          className={`w-8 h-8 rounded border-2 ${
                            selectedTextElement.color === color ? 'border-blue-400' : 'border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stickers */}
            {currentTool === 'stickers' && (
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-3">
                  {storyStickers.map((sticker, index) => (
                    <button
                      key={index}
                      onClick={() => addSticker(sticker)}
                      className="text-2xl p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Tap to add • Double-tap to remove
                </p>
              </div>
            )}

            {/* Recipes */}
            {currentTool === 'recipes' && (
              <div className="space-y-4">
                <div className="text-white text-sm mb-2">Add Recipe to Story:</div>
                {recipes.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recipes.map(recipe => (
                      <button
                        key={recipe.id}
                        onClick={() => selectRecipe(recipe)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedRecipe?.id === recipe.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center overflow-hidden">
                            {recipe.image_url ? (
                              <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ChefHat className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{recipe.title}</p>
                            <p className="text-xs opacity-70">{recipe.category}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recipes found</p>
                    <p className="text-xs">Create a recipe first!</p>
                  </div>
                )}
              </div>
            )}

            {/* Effects */}
            {currentTool === 'effects' && (
              <div className="space-y-4">
                <div>
                  <p className="text-white text-sm mb-2">Background Colors:</p>
                  <div className="grid grid-cols-6 gap-2">
                    {backgroundColors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setBackgroundColor(color)}
                        className={`w-10 h-10 rounded-lg border-2 ${
                          backgroundColor === color ? 'border-blue-400' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white text-sm mb-2">Gradients:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {backgroundGradients.map((gradient, index) => (
                      <button
                        key={index}
                        onClick={() => setBackgroundColor(gradient)}
                        className="w-full h-12 rounded-lg border-2 border-gray-600 hover:border-blue-400"
                        style={{ background: gradient }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline indicator */}
          <div className="flex items-center justify-center text-gray-400 text-sm">
            <span>Story will expire in 24 hours</span>
          </div>
        </div>
      </div>
    </div>
  )
}
