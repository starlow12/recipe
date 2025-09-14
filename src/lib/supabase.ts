import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qtecuenoabtzlyrfkquo.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3em5vbGFvdWx1d2Z0c3NpcmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NTk1ODYsImV4cCI6MjA3MzQzNTU4Nn0.9PVV0Gb8NpGVMp26qr-15Hpwordk20gPlLuOCb6hJdI"

export const supabase = createClient(supabaseUrl, supabaseKey)
