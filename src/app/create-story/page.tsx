'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Upload, X, Type, Camera, Video, ArrowLeft, Send, Palette,
  Sparkles, RotateCw, Move, Trash2, Plus, Minus, Bold, Italic,
  AlignCenter, AlignLeft, AlignRight, Circle, Square, Heart,
  Star, Smile, Music, MapPin, Coffee, Sun, Moon, Zap, ChefHat, Search
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
  alignment: 'left' | 'center' | 'right'
  rotation: number
}

interface Sticker {
  id: string
  type: 'emoji' | 'icon'
  content: string
  x: number
  y: number
  size: number
  rotation: number
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

interface FormData {
  media: File | null
  mediaType: 'image' | 'video' | null
  textOverlay: string
  backgroundColor: string
  gradientType: 'solid' | 'gradient' | 'animated'
  recipeId: string | null
}

export default function CreateStoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    media: null,
    mediaType: null,
    textOverlay: '',
    backgroundColor: '#FF6B35',
    gradientType: 'gradient',
    recipeId: null
  })
  
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTool, setCurrentTool] = useState<'media' | 'text' | 'draw' | 'stickers' | 'effects' | 'recipes'>('media')
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#FFFFFF')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)

  const backgroundGradients = [
    'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
    'linear-gradient(45deg, #A8E6CF, #DCEDC1)',
    'linear-gradient(45deg, #FFD93D, #6BCF7F)',
    'linear-gradient(45deg, #4FACFE, #00F2FE)',
    'linear-gradient(45deg, #43E97B, #38F9D7)',
    'linear-gradient(45deg, #FA709A, #FEE140)',
    'linear-gradient(45deg, #A18CD1, #FBC2EB)',
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #f093fb, #f5576c)',
    'linear-gradient(45deg, #4facfe, #00f2fe)',
    'linear-gradient(45deg, #667db6, #0082c8, #0082c8, #667db6)',
    'linear-gradient(45deg, #f12711, #f5af19)',
  ]

  const storyStickers = [
    { type: 'emoji', content: '❤️' },
    { type: 'emoji', content: '😍' },
    { type: 'emoji', content: '🔥' },
    { type: 'emoji', content: '✨' },
    { type: 'emoji', content: '🌟' },
    { type: 'emoji', content: '💯' },
    { type: 'emoji', content: '🎉' },
    { type: 'emoji', content: '🌈' },
    { type: 'emoji', content: '💫' },
    { type: 'emoji', content: '🦋' },
    { type: 'emoji', content: '🌸' },
    { type: 'emoji', content: '🍕' },
  ]

  const fontFamilies = [
    'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 
    'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Palatino'
  ]

  useEffect(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect())
    }

    const handleResize = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect())
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const getMousePosition = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!containerRect) return { x: 0, y: 0 }
    
    const x = ((e.clientX - containerRect.left) / containerRect.width) * 100
    const y = ((e.clientY - containerRect.top) / containerRect.height) * 100
    
    return { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    }
  }, [containerRect])

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

    setFormData(prev => ({
      ...prev,
      media: file,
      mediaType: isImage ? 'image' : 'video'
    }))

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

  const addTextElement = () => {
    if (!newText.trim()) return

    const newElement: TextElement = {
      id: Date.now().toString(),
      text: newText,
      x: 25,
      y: 30,
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'Arial',
      isBold: false,
      isItalic: false,
      alignment: 'center',
      rotation: 0
    }

    setTextElements(prev => [...prev, newElement])
    setNewText('')
    setSelectedElementId(newElement.id)
  }

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }

  const deleteTextElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id))
    setSelectedElementId(null)
  }

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string, type: 'text' | 'sticker') => {
    e.preventDefault()
    e.stopPropagation()
    
    const pos = getMousePosition(e)
    let element

    if (type === 'text') {
      element = textElements.find(el => el.id === elementId)
      setSelectedElementId(elementId)
    } else {
      element = stickers.find(el => el.id === elementId)
    }

    if (element) {
      setIsDragging(true)
      setDragOffset({
        x: pos.x - element.x,
        y: pos.y - element.y
      })
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId) return

    const pos = getMousePosition(e)
    const newX = pos.x - dragOffset.x
    const newY = pos.y - dragOffset.y

    // Update text element position
    const textElement = textElements.find(el => el.id === selectedElementId)
    if (textElement) {
      updateTextElement(selectedElementId, {
        x: Math.max(0, Math.min(90, newX)),
        y: Math.max(0, Math.min(90, newY))
      })
      return
    }

    // Update sticker position
    const sticker = stickers.find(el => el.id === selectedElementId)
    if (sticker) {
      setStickers(prev =>
        prev.map(el =>
          el.id === selectedElementId
            ? {
                ...el,
                x: Math.max(0, Math.min(containerRect ? containerRect.width - 50 : 250, (newX / 100) * (containerRect?.width || 300))),
                y: Math.max(0, Math.min(containerRect ? containerRect.height - 50 : 450, (newY / 100) * (containerRect?.height || 533)))
              }
            : el
        )
      )
    }
  }, [isDragging, selectedElementId, dragOffset, getMousePosition, textElements, stickers, containerRect])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  const addSticker = (sticker: { type: string, content: string }) => {
    const newSticker: Sticker = {
      id: Date.now().toString(),
      type: sticker.type as 'emoji' | 'icon',
      content: sticker.content,
      x: Math.random() * 200 + 50,
      y: Math.random() * 300 + 100,
      size: 40,
      rotation: 0
    }

    setStickers(prev => [...prev, newSticker])
  }

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id))
  }

  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !containerRect) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'draw') return
    setIsDrawing(true)
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const pos = getCanvasPosition(e)
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool !== 'draw') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const pos = getCanvasPosition(e)
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.strokeStyle = brushColor
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const selectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setFormData(prev => ({ ...prev, recipeId: recipe.id }))
    toast.success(`Recipe "${recipe.title}" added to story!`)
  }

  const removeRecipe = () => {
    setSelectedRecipe(null)
    setFormData(prev => ({ ...prev, recipeId: null }))
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

    if (!formData.media && !formData.textOverlay.trim() && textElements.length === 0 && !selectedRecipe) {
      toast.error('Please add some content to your story')
      return
    }

    setIsLoading(true)

    try {
      let mediaUrl = null
      
      if (formData.media) {
        mediaUrl = await uploadMedia()
        if (formData.media && !mediaUrl) {
          setIsLoading(false)
          return
        }
      }

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Create story with enhanced data
      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: mediaUrl || null,
          media_type: formData.media ? formData.mediaType : 'image',
          text_overlay: formData.textOverlay.trim() || null,
          background_style: formData.gradientType === 'solid' ? formData.backgroundColor : backgroundGradients[0],
          text_elements: textElements.length > 0 ? JSON.stringify(textElements) : null,
          stickers: stickers.length > 0 ? JSON.stringify(stickers) : null,
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

  const selectedTextElement = textElements.find(el => el.id === selectedElementId)

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
            className="bg-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Sharing...' : 'Share'}
          </button>
        </div>

        {/* Story Canvas */}
        <div 
          ref={containerRef}
          className="aspect-[9/16] relative overflow-hidden cursor-pointer select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background */}
          <div 
            className="absolute inset-0"
            style={{ 
              background: formData.gradientType === 'solid' 
                ? formData.backgroundColor 
                : backgroundGradients[0]
            }}
          />
          
          {/* Media */}
          {mediaPreview && (
            <div className="absolute inset-0">
              {formData.mediaType === 'image' ? (
                <img 
                  src={mediaPreview} 
                  alt="Story media"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  ref={videoRef}
                  src={mediaPreview}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              )}
            </div>
          )}

          {/* Drawing Canvas */}
          <canvas
            ref={canvasRef}
            width={300}
            height={533}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: 'none', pointerEvents: currentTool === 'draw' ? 'auto' : 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {/* Recipe Card */}
          {selectedRecipe && (
            <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
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
                  className="p-1 text-gray-400 hover:text-gray-600"
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
                selectedElementId === element.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
              }`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                fontSize: `${element.fontSize}px`,
                color: element.color,
                fontFamily: element.fontFamily,
                fontWeight: element.isBold ? 'bold' : 'normal',
                fontStyle: element.isItalic ? 'italic' : 'normal',
                textAlign: element.alignment,
                transform: `rotate(${element.rotation}deg)`,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                pointerEvents: 'auto'
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element.id, 'text')}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedElementId(element.id)
              }}
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
                left: `${sticker.x}px`,
                top: `${sticker.y}px`,
                fontSize: `${sticker.size}px`,
                transform: `rotate(${sticker.rotation}deg)`,
                pointerEvents: 'auto'
              }}
              onMouseDown={(e) => handleElementMouseDown(e, sticker.id, 'sticker')}
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
          <div className="flex items-center justify-center space-x-1 overflow-x-auto pb-2">
            {[
              { id: 'media', icon: Camera, label: 'Media' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'draw', icon: Circle, label: 'Draw' },
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
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Size</label>
                        <input
                          type="range"
                          min="12"
                          max="60"
                          value={selectedTextElement.fontSize}
                          onChange={(e) => updateTextElement(selectedTextElement.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Rotation</label>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={selectedTextElement.rotation}
                          onChange={(e) => updateTextElement(selectedTextElement.id, { rotation: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
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

            {/* Drawing Tools */}
            {currentTool === 'draw' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Brush Size</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="flex-1 ml-4"
                  />
                  <span className="text-white text-sm ml-2">{brushSize}px</span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {['#FFFFFF', '#000000', '#FF6B35', '#3CBCCF', '#FFD23F', '#E91E63'].map(color => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-10 h-10 rounded border-2 ${
                        brushColor === color ? 'border-blue-400' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <button
                  onClick={clearCanvas}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  Clear Drawing
                </button>
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
                      className="text-3xl p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {sticker.content}
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
                  <p className="text-white text-sm mb-2">Background Style:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {backgroundGradients.slice(0, 9).map((gradient, index) => (
                      <button
                        key={index}
                        onClick={() => setFormData(prev => ({ ...prev, backgroundColor: gradient }))}
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
