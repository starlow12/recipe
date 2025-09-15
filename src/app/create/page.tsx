'use client'

import React, { useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Upload, Clock, Users, ChefHat, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Ingredient {
  amount: string
  unit: string
  name: string
}

interface FormData {
  title: string
  description: string
  category: string
  prep_time: number | ''
  cook_time: number | ''
  servings: number | ''
  image: File | null
  ingredients: Ingredient[]
  instructions: string[]
}

interface FormErrors {
  title?: string
  category?: string
  ingredients?: string
  instructions?: string
}

export default function CreateRecipePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    image: null,
    ingredients: [{ amount: '', unit: '', name: '' }],
    instructions: ['']
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Common units for ingredients
  const commonUnits = [
    'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
    'gram', 'grams', 'kg', 'pound', 'pounds', 'oz', 'ml', 'liter', 'piece', 'pieces'
  ]

  const categories = [
    'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer', 
    'Soup', 'Salad', 'Main Course', 'Side Dish', 'Beverage'
  ]

  // Redirect if not logged in
  if (!loading && !user) {
    router.push('/auth/login')
    return null
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setFormData(prev => ({ ...prev, image: file }))

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }))
    setImagePreview(null)
  }

  // Ingredient functions
  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { amount: '', unit: '', name: '' }]
    }))
  }

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }))
    }
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index][field] = value
    setFormData(prev => ({ ...prev, ingredients: newIngredients }))
  }

  // Instruction functions
  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index)
      }))
    }
  }

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...formData.instructions]
    newInstructions[index] = value
    setFormData(prev => ({ ...prev, instructions: newInstructions }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Recipe title is required'
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }

    const hasValidIngredients = formData.ingredients.some(ing => 
      ing.name.trim() && (ing.amount.trim() || ing.unit.trim())
    )
    if (!hasValidIngredients) {
      newErrors.ingredients = 'Please add at least one ingredient with a name'
    }

    const hasValidInstructions = formData.instructions.some(inst => inst.trim())
    if (!hasValidInstructions) {
      newErrors.instructions = 'Please add at least one instruction'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!formData.image || !user) return null

    try {
      const fileExt = formData.image.name.split('.').pop()
      const fileName = `recipe-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `recipes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, formData.image)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload image')
        return null
      }

      const { data: urlData } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()

    if (!validateForm() && !isDraft) {
      toast.error('Please fix the errors below')
      return
    }

    if (!user) {
      toast.error('Please sign in to create recipes')
      return
    }

    setIsLoading(true)

    try {
      // Upload image if exists
      let imageUrl = null
      if (formData.image) {
        imageUrl = await uploadImage()
        if (formData.image && !imageUrl) {
          // Image upload failed
          setIsLoading(false)
          return
        }
      }

      // Filter out empty ingredients and instructions
      const validIngredients = formData.ingredients.filter(ing => ing.name.trim())
      const validInstructions = formData.instructions.filter(inst => inst.trim())

      // Create recipe
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          prep_time: formData.prep_time || 0,
          cook_time: formData.cook_time || 0,
          servings: formData.servings || 1,
          ingredients: validIngredients,
          instructions: validInstructions,
          image_url: imageUrl,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Recipe creation error:', error)
        toast.error('Failed to create recipe')
        return
      }

      toast.success(isDraft ? 'Recipe saved as draft!' : 'Recipe published successfully!')
      router.push(`/recipe/${data.id}`)

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Recipe</h1>
            <p className="text-gray-600">Share your culinary masterpiece with the world!</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            {/* Recipe Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="What's the name of your amazing dish?"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Photo
              </label>
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Recipe preview" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </label>
              )}
            </div>

            {/* Recipe Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.prep_time}
                  onChange={(e) => handleInputChange('prep_time', e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="30"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChefHat className="w-4 h-4 inline mr-1" />
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.cook_time}
                  onChange={(e) => handleInputChange('cook_time', e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="45"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => handleInputChange('servings', e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="4"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select 
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us about your recipe. What makes it special?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Ingredients *
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="2"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    >
                      <option value="">Unit</option>
                      {commonUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Sugar"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="col-span-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {errors.ingredients && <p className="mt-1 text-sm text-red-600">{errors.ingredients}</p>}
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Instructions *
                </label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </div>
              <div className="space-y-3">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex space-x-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-medium text-sm mt-2">
                      {index + 1}
                    </div>
                    <textarea
                      placeholder={`Step ${index + 1} - Describe what to do...`}
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      rows={3}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </div>
                ) : (
                  'Publish Recipe 🚀'
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
