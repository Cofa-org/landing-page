import { useEffect, useState } from "react";
import { IoMdReturnLeft } from "react-icons/io";
import { Link } from "react-router-dom";
import { Footer, Header } from "../../Components";
import ImageCarousel from "../../Components/ImageCarousel/ImageCarousel";
import { BlogService } from "../../services/blogService.js";
import { formatDate } from "../../lib/utils";
import "./blog-detail.css";

export const BlogDetailSection = ({ slug }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setError("Slug del artículo no encontrado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const blogPost = await BlogService.getPostBySlug(slug);
        if (!blogPost) {
          setError("Artículo no encontrado");
        }
        if (blogPost?.featured_image) {
          const slices = Object.values(blogPost?.featured_image);
          const sliceImages = slices.map((slice) => ({
            src: slice,
            alt: blogPost.title || "Imagen del artículo",
          }));
          if (sliceImages) {
            blogPost.featured_image = sliceImages;
          }
        }

        setPost(blogPost);
      } catch (err) {
        setError("Error al cargar el artículo");
        console.error("Error fetching blog post:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className='blog-detail-section'>
        <Header />
        <div className='blog-detail-loading'>
          <div className='blog-detail-spinner'></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className='blog-detail-section'>
        <div className='blog-detail-container'>
          <Link
            to='/cofa-tips'
            className='blog-detail-back-button'
          >
            <IoMdReturnLeft className='blog-detail-back-icon' />
            Volver al blog
          </Link>

          <div className='blog-detail-error'>
            <h1 className='blog-detail-error-title'>{error || "Artículo no encontrado"}</h1>
            <p className='blog-detail-error-text'>
              El artículo que buscas no existe o ha sido eliminado.
            </p>
            <Link
              to='/blog'
              className='btn btn-primary'
            >
              Ver todos los artículos
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className='blog-detail-section'>
      <div className='blog-detail-container'>
        <Link
          to='/cofa-tips'
          className='blog-detail-back-button'
        >
          <IoMdReturnLeft className='blog-detail-back-icon' />
          Volver al blog
        </Link>

        <article>
          <div className='blog-detail-header'>
            <span className='blog-detail-category'>{post.category}</span>

            <h1 className='blog-detail-title'>{post.title}</h1>

            <div className='blog-detail-meta'>
              <span className='blog-detail-author'>Por {post.author}</span>
              <span className='blog-detail-date'>{formatDate(new Date(post.published_date))}</span>
            </div>
          </div>

          {post.featured_image &&
          Array.isArray(post.featured_image) &&
          post.featured_image.length > 1 ? (
            <ImageCarousel
              images={post.featured_image}
              showControls={true}
            />
          ) : (
            post.featured_image && (
              <img
                src={
                  Array.isArray(post.featured_image)
                    ? post.featured_image[0].src
                    : post.featured_image.src
                }
                alt={post.title}
                className='blog-detail-featured-image'
              />
            )
          )}

          <div
            className='blog-detail-content'
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className='blog-detail-tags'>
              <h3 className='blog-detail-tags-title'>Tags:</h3>
              <div className='blog-detail-tags-list'>
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className='blog-detail-tag'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};
