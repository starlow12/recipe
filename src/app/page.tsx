import { Navigation } from '../components/Navigation'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to RecipeGram
          </h1>
          <p className="text-gray-600">
            Share your favorite recipes with the world!
          </p>
        </div>
      </main>
    </div>
  )
}
