import React, { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import { AboutUs, ClientReview, Contact, FrecuentQuestion, Hero, OurServices } from '../../Sections'
import WorkWithUs from '../../Sections/WorkWithUs/WorkWithUs'

const HomeScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
        <Header/>
        <Hero />
        <AboutUs/>
        <OurServices/>
        <ClientReview/>
        <FrecuentQuestion/>
        <WorkWithUs/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default HomeScreen