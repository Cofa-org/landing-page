import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../../lib/utils.js";
import { BlogService } from "../../services/blogService.js";

import "./blog-list.css";
import SocialNetworks from "../../Components/SocialNetworks/SocialNetworks.jsx";

export const BlogListSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const blogPosts = await BlogService.getAllPosts();
        if (!blogPosts || blogPosts.length === 0) {
          setError("No se encontraron artículos del blog");
          setLoading(false);
          return;
        }
        blogPosts.forEach((post) => {
          if (!post.featured_image) {
            return;
          }
          const slices = Object.values(post?.featured_image);
          if (slices && slices.length > 0) {
            post.featured_image = slices;
          }
        });

        setPosts(blogPosts);
      } catch (err) {
        setError("Error al cargar los artículos del blog");
        console.error("Error fetching blog posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleCardClick = (slug) => {
    // La navegación se maneja con Link, pero podemos agregar analytics aquí
    console.log(`Navigating to blog post: ${slug}`);
  };

  if (loading) {
    return (
      <div className='blog-list-loading'>
        <div className='blog-list-spinner'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='blog-list-container'>
        <div className='blog-list-error'>
          <h2 className='blog-list-error-title'>Error</h2>
          <p className='blog-list-error-text'>{error}</p>
        </div>
      </div>
    );
  }
//  posts[0].featured_image = [];
  return (
    <div className='blog-list-page'>
      <div className='blog-list-container'>
        {posts.length === 0 ? (
          <div className='blog-list-empty'>
            <h2 className='blog-list-empty-title'>No hay artículos disponibles</h2>
            <p className='blog-list-empty-text'>
              Pronto publicaremos contenido interesante para ti.
            </p>
          </div>
        ) : (
          <div className='blog-list-grid'>
            {posts.map((post) => (
              <Link
                key={post?.id}
                to={`/blog/${post?.slug}`}
                className='blog-card'
                onClick={() => handleCardClick(post?.slug)}
              >
                {Array.isArray(post.featured_image) && post.featured_image.length > 0 ? (
                  <img
                    src={
                      (Array.isArray(post.featured_image) && post.featured_image.length > 0
                        ? post.featured_image[0]
                        : post.featured_image) ||
                      "https://images.pexels.com/photos/3483098/pexels-photo-3483098.jpeg?auto=compress&cs=tinysrgb&w=800"
                    }
                    alt={post?.title}
                    className='blog-card-image'
                  />
                ) : (
                  <img
                    style={{ objectFit: "contain" }}
                    src='/img/logo_cofa_tips.svg'
                    alt='logo-cofa-tips'
                    width='252'
                    height='243'
                    className='blog-card-image'
                  />
                )}

                <div className='blog-card-content'>
                  <span className='blog-card-category'>{post?.category}</span>

                  <h2 className='blog-card-title'>{post?.title}</h2>

                  <p className='blog-card-description'>{post?.description}</p>

                  <div className='blog-card-meta'>
                    <span className='blog-card-author'>Por {post?.author}</span>
                    <span className='blog-card-date'>
                      {formatDate(new Date(post?.published_date))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <section className='contactInfo'>
        <img
          src='/Logo.svg'
          alt='logo-cofa'
          width='218'
          height='46'
        />
        <SocialNetworks />
      </section>
    </div>
  );
};
