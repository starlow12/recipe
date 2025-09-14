import { Navigation } from '../components/Navigation'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      <main className="flex items-center justify-center py-20">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="mb-8 animate-bounce">
            <span className="text-6xl">🍽️</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              RecipeGram
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fade-in">
            Share your favorite recipes with the world and discover amazing dishes from fellow food lovers! 🧑‍🍳
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform shadow-lg hover:shadow-xl">
              Start Cooking 🔥
            </button>
            <button className="bg-white text-gray-800 px-8 py-3 rounded-full font-semibold border-2 border-gray-200 hover:border-orange-300 hover:scale-105 transition-all shadow-md">
              Explore Recipes 👀
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
