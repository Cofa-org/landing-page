import { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import { AboutUs, Contact, FrecuentQuestionSection, Hero, CofaTipsSection } from '../../Sections'

const HomeScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      <Hero />
      <AboutUs />
      <FrecuentQuestionSection />
      <CofaTipsSection />
      {/* Empleo oculto. La sección sigue en Sections/WorkWithUs/WorkWithUs.jsx */}
      <Contact />
      <Footer />
    </>
  )
}

export default HomeScreen
