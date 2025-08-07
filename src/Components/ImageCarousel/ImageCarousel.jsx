import React, { useState, useEffect, useRef } from "react";
import styles from "./ImageCarousel.module.css";

const ImageCarousel = ({ images, interval = 8000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);

  function resetTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(
      () =>
        setCurrentIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        ),
      interval
    );

    return () => {
      resetTimeout();
    };
  }, [currentIndex, images, interval]);

  if (!images || images.length === 0) {
    return <div>No hay imágenes para mostrar.</div>;
  }

  return (
    <div className={styles.carouselContainer}>
      <div
        className={styles.carouselSlider}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div className={styles.carouselSlide} key={index}>
            <img src={image.src} alt={image.alt} className={styles.carouselImage} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;