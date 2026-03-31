import React, { useEffect } from 'react'
import { Footer, Header, FrecuentQuestion } from '../../Components'
import { Contact } from '../../Sections'

const FrecuentQuestionScreen = () => {
    useEffect(() => {
        window.scrollTo(0, 0); // Desplazarse al principio de la página
    }, []);

    return (
        <>
            <Header />
            <div style={{ paddingTop: '80px' }}>
                <FrecuentQuestion />
            </div>
            <Contact />
            <Footer />
        </>
    )
}

export default FrecuentQuestionScreen
