'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, User, Mail, UserIcon, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileData {
  username: string
  full_name: string
  email: string
  bio: string
  avatar_url: string | null
}

interface FormErrors {
  username?: string
  full_name?: string
  bio?: string
}

export default function EditProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    full_name: '',
    email: '',
    bio: '',
    avatar_url: null
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Fetch profile error:', error)
        // If profile doesn't exist, create basic one from user data
        setProfileData({
          username: user.email?.split('@')[0] || '',
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          bio: '',
          avatar_url: null
        })
      } else {
        setProfileData({
          username: data.username || user.email?.split('@')[0] || '',
          full_name: data.full_name || user.user_metadata?.full_name || '',
          email: data.email || user.email || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (!usernameRegex.test(profileData.username)) {
      newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscores only)'
    }

    // Full name validation
    if (!profileData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    } else if (profileData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters'
    }

    // Bio validation (optional, but limit length)
    if (profileData.bio && profileData.bio.length > 160) {
      newErrors.bio = 'Bio must be 160 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!user) return false

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', user.id)
      .single()

    return !data // Returns true if username is available
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)

    try {
      // Delete old avatar if exists
      if (profileData.avatar_url) {
        const oldFileName = profileData.avatar_url.split('/').pop()
        if (oldFileName && oldFileName.includes(user.id)) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldFileName}`])
        }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload image')
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      console.log('New avatar URL:', publicUrl)

      // Update both local state and database immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Database update error:', updateError)
        toast.error('Failed to save profile picture')
        return
      }

      // Update local state
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success('Profile picture updated successfully!')

    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }

    if (!user) return
    setIsSaving(true)

    try {
      // Check if username is available (if changed)
      const isUsernameAvailable = await checkUsernameAvailability(profileData.username)
      if (!isUsernameAvailable) {
        setErrors({ username: 'Username is already taken' })
        toast.error('Username is already taken')
        setIsSaving(false)
        return
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username.toLowerCase(),
          full_name: profileData.full_name.trim(),
          bio: profileData.bio.trim() || null,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        toast.error('Failed to update profile')
        return
      }

      toast.success('Profile updated successfully!')
      
      // Force page refresh instead of just navigation
      window.location.href = '/profile'

    } catch (error) {
      console.error('Save error:', error)
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || !user || isLoading) {
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
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="mr-4 p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg overflow-hidden">
                {profileData.avatar_url ? (
                  <img 
                    src={profileData.avatar_url} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', profileData.avatar_url)
                      // Fallback to default icon
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
                
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-upload-edit"
                disabled={uploadingImage}
              />
              <label
                htmlFor="avatar-upload-edit"
                className={`absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform cursor-pointer ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </label>
            </div>
            <p className="text-sm text-gray-500">Click the camera icon to update your profile picture</p>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
              <input
                id="username"
                type="text"
                value={profileData.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                className={`pl-8 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your_username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="full_name"
                type="text"
                value={profileData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Your full name"
              />
            </div>
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Email (Read Only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="pl-10 w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="bio"
                rows={3}
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                maxLength={160}
                className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tell people about yourself and your cooking style..."
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              {errors.bio ? (
                <p className="text-sm text-red-600">{errors.bio}</p>
              ) : (
                <p className="text-xs text-gray-500">Share your cooking journey with the world</p>
              )}
              <p className="text-xs text-gray-500">{profileData.bio.length}/160</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
