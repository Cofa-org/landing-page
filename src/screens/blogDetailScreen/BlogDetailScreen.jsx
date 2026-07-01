import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Footer, Header } from "../../Components/index.js";
import { BlogDetailSection } from "../../Sections/blogDetailSection/BlogDetailSection.jsx";

export const BlogDetailScreen = () => {
  const { slug } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      <BlogDetailSection slug={slug}/>
      <Footer />
    </>
  );
};

export default BlogDetailScreen