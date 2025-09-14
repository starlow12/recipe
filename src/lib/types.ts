// lib/types.ts

export interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  video_url: string | null
  category: string
  prep_time: number
  cook_time: number
  servings: number
  ingredients: any[] // JSONB array
  instructions: any[] // JSONB array
  created_by: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
  profiles?: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  email: string
  full_name: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  text_overlay: string | null
  recipe_id: string | null
  created_at: string
  expires_at: string
  views_count: number
  profiles?: Profile
}

export interface Highlight {
  id: string
  user_id: string
  title: string
  cover_image: string
  created_at: string
  updated_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  recipe_id: string
  created_at: string
}

export interface SavedRecipe {
  id: string
  user_id: string
  recipe_id: string
  created_at: string
  recipes?: Recipe
}

export interface Comment {
  id: string
  recipe_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile
}
