import { HttpApi } from "../http";
import { VITE_COFA_AUTH_URL, VITE_URL_LOCAL, VITE_COFA_AUTH_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";

export class BlogService {
  static async getAllPosts() {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/blog`;
      const apiKey = VITE_COFA_AUTH_API_KEY;

      const response = await HttpApi(url, null, HTTP_METHOD.GET, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener posts");
      }
      return await response.json();
    } catch (error) {
      console.error("BLOG_SERVICE_GET_ALL_ERROR:", error);
      return [];
    }
  }

  static async getPostBySlug(slug) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/blog/${slug}`;
      const apiKey = VITE_COFA_AUTH_API_KEY;

      const response = await HttpApi(url, null, HTTP_METHOD.GET, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener post por slug");
      }
      return await response.json();
    } catch (error) {
      console.error("BLOG_SERVICE_GET_BY_SLUG_ERROR:", error);
      return null;
    }
  }

  static async getPostsByCategory(category) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/blog/category/${category}`;
      const apiKey = VITE_COFA_AUTH_API_KEY;

      const response = await HttpApi(url, null, HTTP_METHOD.GET, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener posts por categoría");
      }
      return await response.json();
    } catch (error) {
      console.error("BLOG_SERVICE_GET_BY_CATEGORY_ERROR:", error);
      return [];
    }
  }

  static async createPost(post) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/blog`;
      const apiKey = VITE_COFA_AUTH_API_KEY;

      const response = await HttpApi(url, post, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al crear post");
      }
      return await response.json();
    } catch (error) {
      console.error("BLOG_SERVICE_CREATE_ERROR:", error);
      return null;
    }
  }
}
