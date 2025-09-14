'use client'

import React from 'react'
import { Navigation } from '../../components/Navigation'
import { User, Settings, Camera, Users, Heart } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <User className="w-16 h-16 text-white" />
              </div>
              <button className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 md:mb-0">
                  @foodlover2024
                </h1>
                <button className="bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-full transition-colors">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Edit Profile
                </button>
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-8 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">Recipes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">456</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">89</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-600 max-w-md">
                Home chef passionate about healthy, delicious meals. 
                Love experimenting with Mediterranean and Asian cuisines! 🥗🍜
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="flex border-b border-gray-200">
            <button className="flex-1 py-4 px-6 text-center font-medium text-orange-500 border-b-2 border-orange-500">
              My Recipes (12)
            </button>
            <button className="flex-1 py-4 px-6 text-center font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Saved Recipes (8)
            </button>
            <button className="flex-1 py-4 px-6 text-center font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Liked Recipes (24)
            </button>
          </div>

          {/* Recipe Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Recipe Cards */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="aspect-square bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="text-4xl">🍝</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Delicious Recipe {i}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      A tasty dish that everyone will love
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>⏱️ 30 min</span>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>24</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
