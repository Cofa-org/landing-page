import { Footer, Header } from "../../Components/index.js";
import { CofaTipsSection } from "../../Sections/index.js";
import { BlogListSection } from "../../Sections/blogListSection/BlogListSection.jsx";
import { useEffect } from "react";

function CofaTipsScreen() {
  useEffect(() => {
    window.scrollTo({ top, behavior: "smooth" });

    return () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />
      <CofaTipsSection />
      <BlogListSection />
      <Footer />
    </div>
  );
}

export default CofaTipsScreen;
