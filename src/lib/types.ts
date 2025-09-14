export interface Recipe {
  id: string
  title: string
  description: string
  image_url?: string
  prep_time: number
  cook_time: number
  servings: number
  category: string
  ingredients: string[]
  instructions: string[]
  created_by: string
  created_at: string
  likes_count: number
  profiles?: {
    username: string
    full_name?: string
    avatar_url?: string
  }
}

export interface Profile {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  bio?: string
}
