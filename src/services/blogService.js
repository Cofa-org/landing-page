import { supabase } from "../lib/supabase";

export class BlogService {
  static async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from("landing_blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_date", { ascending: false })
        .is("deleted_at", null);


      if (error) {
        console.error("Error fetching blog posts:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAllPosts:", error);
      return [];
    }
  }
  
  static async getPostBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from("landing_blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) {
        console.error("Error fetching blog post:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getPostBySlug:", error);
      return null;
    }
  }

  static async getPostsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from("landing_blog_posts")
        .select("*")
        .eq("category", category)
        .eq("published", true)
        .order("published_date", { ascending: false });

      if (error) {
        console.error("Error fetching posts by category:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getPostsByCategory:", error);
      return [];
    }
  }

  static async createPost(post) {
    try {
      const { data, error } = await supabase.from("landing_blog_posts").insert([post]).select();

      if (error) {
        console.error("Error creating blog post:", error);
        return null;
      }

      return data ? data[0] : null;
    } catch (error) {
      console.error("Error in createPost:", error);
      return null;
    }
  }
}
