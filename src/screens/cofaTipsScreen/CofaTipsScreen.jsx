import { Footer, Header } from "../../Components/index.js";
import { CofaTipsSection } from "../../Sections/index.js";
import { BlogListSection } from "../../Sections/blogListSection/BlogListSection.jsx";

function CofaTipsScreen() {
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
