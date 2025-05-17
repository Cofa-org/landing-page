import React, { useEffect, useState, useRef } from "react";
import style from "./Carrusel.module.css";

const Carrusel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  const startTimeout = (duration) => {
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, duration);
  };

  useEffect(() => {
    const isFirstImage = currentIndex === 0;
    const delay = isFirstImage ? 1500 : 7000;

    startTimeout(delay);

    // Trigger animation class
    setIsAnimating(true);
    const animationTimeout = setTimeout(() => {
      setIsAnimating(false);
    }, 1000); // duración de la animación (1s)

    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(animationTimeout);
    };
  }, [currentIndex, images.length]);

  return (
    <div className={style.carrusel}>
      <div
        className={`${style.slides} ${isAnimating ? style.fadeIn : ""}`}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: "transform 1s ease-in-out",
        }}
      >
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            className={style.image}
          />
        ))}
      </div>
    </div>
  );
};

export default Carrusel;
