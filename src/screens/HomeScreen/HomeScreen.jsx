import { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import { AboutUs, Contact, FrecuentQuestionSection, Hero, CofaTipsSection } from '../../Sections'
import WorkWithUs from '../../Sections/WorkWithUs/WorkWithUs'

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
      <WorkWithUs />
      <Contact />
      <Footer />
    </>
  )
}

export default HomeScreen
