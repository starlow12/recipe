'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '../../../components/Navigation'
import { ArrowLeft, Heart, Bookmark, Share2, Clock, Users, ChefHat, Star } from 'lucide-react'
import Link from 'next/link'

export default function RecipeDetailPage() {
  const params = useParams()
  const recipeId = params.id
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(true)

  // Sample recipe data (in real app this would come from API)
  const recipe = {
    id: recipeId,
    title: "Mediterranean Quinoa Bowl",
    description: "A fresh and healthy Mediterranean-inspired quinoa bowl packed with vegetables, herbs, and a creamy tahini dressing. Perfect for a nutritious lunch or light dinner.",
    image: "🥗",
    author: {
      name: "Chef Maria",
      avatar: "👩‍🍳",
      followers: "2.4k"
    },
    stats: {
      likes: 342,
      saves: 89,
      rating: 4.8,
      reviews: 156
    },
    timing: {
      prepTime: 15,
      cookTime: 20,
      totalTime: 35,
      servings: 4
    },
    difficulty: "Easy",
    category: "Healthy Bowls",
    ingredients: [
      { amount: "1 cup", item: "Quinoa, rinsed" },
      { amount: "2 cups", item: "Vegetable broth" },
      { amount: "1 large", item: "Cucumber, diced" },
      { amount: "2 medium", item: "Tomatoes, chopped" },
      { amount: "1/2 cup", item: "Red onion, finely diced" },
      { amount: "1/2 cup", item: "Kalamata olives, pitted" },
      { amount: "1/2 cup", item: "Feta cheese, crumbled" },
      { amount: "1/4 cup", item: "Fresh parsley, chopped" },
      { amount: "2 tbsp", item: "Fresh mint, chopped" },
      { amount: "3 tbsp", item: "Tahini" },
      { amount: "2 tbsp", item: "Lemon juice" },
      { amount: "1 clove", item: "Garlic, minced" },
      { amount: "2 tbsp", item: "Extra virgin olive oil" }
    ],
    instructions: [
      "Rinse quinoa under cold water until water runs clear. In a medium saucepan, bring vegetable broth to a boil.",
      "Add quinoa to boiling broth, reduce heat to low, cover and simmer for 15 minutes until liquid is absorbed.",
      "Remove from heat and let stand 5 minutes. Fluff with a fork and let cool completely.",
      "While quinoa cools, prepare the tahini dressing by whisking together tahini, lemon juice, minced garlic, and olive oil in a small bowl.",
      "In a large bowl, combine cooled quinoa, diced cucumber, chopped tomatoes, red onion, and olives.",
      "Add fresh herbs (parsley and mint) and gently toss everything together.",
      "Drizzle the tahini dressing over the quinoa mixture and toss to combine.",
      "Top with crumbled feta cheese and serve immediately, or refrigerate for up to 2 hours before serving."
    ],
    tips: [
      "For extra flavor, toast the quinoa in a dry pan for 2-3 minutes before cooking",
      "This bowl tastes even better the next day as flavors meld together",
      "Add grilled chicken or chickpeas for extra protein"
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/liked" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Saved Recipes
        </Link>

        {/* Recipe Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Hero Image */}
          <div className="aspect-video bg-gradient-to-br from-green-200 via-yellow-200 to-orange-200 flex items-center justify-center relative">
            <span className="text-8xl">{recipe.image}</span>
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className={`p-3 rounded-full transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700'}`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className={`p-3 rounded-full transition-all ${isSaved ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-700'}`}
              >
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button className="p-3 bg-white/80 rounded-full text-gray-700 hover:bg-white transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Recipe Info */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                    {recipe.category}
                  </span>
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                    {recipe.difficulty}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {recipe.title}
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {recipe.description}
                </p>
              </div>
            </div>

            {/* Author & Stats */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{recipe.author.avatar}</span>
                <div>
                  <p className="font-medium text-gray-900">{recipe.author.name}</p>
                  <p className="text-sm text-gray-500">{recipe.author.followers} followers</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{recipe.stats.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bookmark className="w-4 h-4" />
                  <span>{recipe.stats.saves}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{recipe.stats.rating} ({recipe.stats.reviews})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Details Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timing & Servings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recipe Info</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-600">Prep Time</span>
                </div>
                <span className="font-medium">{recipe.timing.prepTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-600">Cook Time</span>
                </div>
                <span className="font-medium">{recipe.timing.cookTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-600">Servings</span>
                </div>
                <span className="font-medium">{recipe.timing.servings}</span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ingredients</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-800">
                    <strong>{ingredient.amount}</strong> {ingredient.item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Instructions</h3>
          <div className="space-y-6">
            {recipe.instructions.map((instruction, index) => (
              <div key={index} className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <p className="text-gray-700 leading-relaxed pt-1">
                  {instruction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Chef's Tips</h3>
          <div className="space-y-2">
            {recipe.tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-orange-500 mt-1">💡</span>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
