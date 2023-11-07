import React from 'react'
import { Footer, Header } from '../../Components'
import { AboutUs, ClientReview, Contact, FrecuentQuestion, Hero, OurServices } from '../../Sections'

const HomeScreen = () => {
  return (
    <>
        <Header/>
        <Hero />
        <AboutUs/>
        <OurServices/>
        <ClientReview/>
        <FrecuentQuestion/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default HomeScreen