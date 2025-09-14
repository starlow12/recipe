'use client'

import React, { useState } from 'react'
import { Navigation } from '../../components/Navigation'
import { Heart, Search, Clock, Users, ChefHat } from 'lucide-react'

export default function SavedRecipesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  // Sample saved recipes data
  const savedRecipes = [
    {
      id: 1,
      title: "Mediterranean Quinoa Bowl",
      description: "Fresh and healthy bowl with quinoa, vegetables, and tahini dressing",
      image: "🥗",
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      category: "Lunch",
      likes: 42
    },
    {
      id: 2,
      title: "Chocolate Chip Cookies",
      description: "Classic homemade cookies that are crispy outside, chewy inside",
      image: "🍪",
      prepTime: 10,
      cookTime: 12,
      servings: 24,
      category: "Dessert",
      likes: 87
    },
    {
      id: 3,
      title: "Spicy Thai Basil Stir Fry",
      description: "Authentic Thai stir fry with fresh basil and chilies",
      image: "🍜",
      prepTime: 5,
      cookTime: 10,
      servings: 3,
      category: "Dinner",
      likes: 63
    },
    {
      id: 4,
      title: "Avocado Toast Supreme",
      description: "Elevated avocado toast with poached egg and everything seasoning",
      image: "🥑",
      prepTime: 8,
      cookTime: 5,
      servings: 1,
      category: "Breakfast",
      likes: 28
    },
    {
      id: 5,
      title: "Homemade Pizza Margherita",
      description: "Classic Italian pizza with fresh mozzarella and basil",
      image: "🍕",
      prepTime: 30,
      cookTime: 15,
      servings: 4,
      category: "Dinner",
      likes: 95
    },
    {
      id: 6,
      title: "Berry Smoothie Bowl",
      description: "Antioxidant-rich smoothie bowl topped with fresh fruits",
      image: "🫐",
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      category: "Breakfast",
      likes: 34
    }
  ]

  const filteredRecipes = savedRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Saved Recipes</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Your collection of favorite recipes - {savedRecipes.length} recipes saved
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your saved recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Results */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                {/* Recipe Image */}
                <div className="aspect-square bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center relative">
                  <span className="text-6xl">{recipe.image}</span>
                  <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </button>
                </div>

                {/* Recipe Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                      {recipe.category}
                    </span>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{recipe.likes}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {recipe.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  {/* Recipe Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{recipe.servings}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChefHat className="w-4 h-4" />
                      <span>Easy</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-500 mb-6">
              Try searching with different keywords
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Empty State for no saved recipes */}
        {savedRecipes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No saved recipes yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start exploring and save recipes you love!
            </p>
            <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition-transform">
              Discover Recipes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
