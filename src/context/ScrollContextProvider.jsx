import { useEffect, useState } from 'react'
import { ScrollContext } from './scrollContext'

const ScrollContextProvider = ({children}) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <ScrollContext.Provider value={{scrolled}}>
            {children}
        </ScrollContext.Provider>
    )
}

export default ScrollContextProvider
