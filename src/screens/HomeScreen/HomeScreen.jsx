import React, { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import StructuredData from '../../Components/Seo/StructuredData';
import { AboutUs, Contact, FrecuentQuestionSection, Hero, OurServices } from '../../Sections'
import WorkWithUs from '../../Sections/WorkWithUs/WorkWithUs'

const HomeScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqData = [
    {
      "@type": "Question",
      "name": "¿Qué requisitos necesito para solicitar un préstamo en COFA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ser mayor de 18 años, DNI vigente, CBU propio y comprobante de ingresos. La evaluación es 100% online y la acreditación puede ser en el día según elegibilidad."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuánto tarda el depósito?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "En operaciones aprobadas, la acreditación puede realizarse en el día hábil. Los tiempos pueden variar por validaciones bancarias y horarios de corte."
      }
    }
  ];

  const breadcrumbData = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Préstamos",
      "item": "https://cofa.com.ar/prestamos"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Requisitos",
      "item": "https://cofa.com.ar/requisitos"
    }
  ];

  return (
    <>
      <Header />
      <Hero />
      <AboutUs />
      {/* <OurServices/> */}
      <FrecuentQuestionSection />
      <WorkWithUs />
      <Contact />
      <Footer />
    </>
  )
}

export default HomeScreen