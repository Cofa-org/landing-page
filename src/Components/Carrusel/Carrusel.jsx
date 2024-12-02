import React, { useEffect, useState } from 'react';
import style from './Carrusel.module.css';

const Carrusel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 2000);

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [images.length]);

    return (
        <div className={style.carrusel}>
            <div
                className={style.slides}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((src, index) => (
                    <img key={index} src={src} alt={`Slide ${index + 1}`} className={style.image} />
                ))}
            </div>
        </div>
    );
};

export default Carrusel;
