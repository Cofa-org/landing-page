import React, { createContext, useContext, useEffect, useState } from 'react'

const ScrollContext = createContext()

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

export const useScrollContext = () => useContext(ScrollContext)