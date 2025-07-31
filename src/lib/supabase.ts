import { createClient } from "@supabase/supabase-js";
import { VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_URL } from "../config";

export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  published_date: string;
  featured_image: string;
  author: string;
  category: string;
  tags: string[];
  slug: string;
  created_at: string;
  updated_at: string;
}
