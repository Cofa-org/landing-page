import "./cofa-tips.css";
import "../blogListSection/blog-list.css";
import { ImageCarousel } from "../../Components/index.js";

const CofaTipsSection = () => {
  const carouselImages = [
    { src: "../../../img/cofa-tips-2.webp", alt: "Imagen de Cofa Tips 1" },
    { src: "../../../img/cofa-tips-3.webp", alt: "Imagen de Cofa Tips 2" },
    { src: "../../../img/cofa-tips-4.webp", alt: "Imagen de Cofa Tips 3" },
  ];

  return (
    <section className='cofa-tips-section'>
      <div className='container cofa-tips-container'>
        {/* Top section with logo and main card */}
        <div className='cofa-tips-top'>
          {/* COFA Tips Logo */}
          <div className='cofa-tips-logo'>
            <div className='cofa-tips-logo-container'>
              <div className='cofa-tips-logo-container'>
                <div className='cofa-tips-logo-bg'>
                  <img
                    className='cofa-tips-logo-vector1'
                    alt='Vector'
                    src='../../../img/logo_cofa_tips.svg'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Featured content card */}
          <div className='card cofa-tips-featured-card'>
            <ImageCarousel
              interval={5000}
              images={carouselImages}
            />
          </div>
        </div>

        {/* Blog List Header */}
        <div className='cofa-tips-header'>
          <h1 className='blog-tips-title'>La seguridad es lo primero</h1>
          {/* <p className='blog-list-subtitle'>
            Descubre consejos financieros, noticias y guías para tomar las mejores decisiones con tu
            dinero
          </p> */}
        </div>

        {/* Banner */}
        <div className='cofa-tips-banner'>
          <img
            src='../../../img/BannerLargo-Desk.webp'
            alt='Banner'
          />
        </div>
      </div>
    </section>
  );
};

export default CofaTipsSection;
