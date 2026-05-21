import React, { useState, useEffect, useRef } from "react";
import styles from "./ImageCarousel.module.css";

const ImageCarousel = ({ images, interval = 8000, showControls = false }) => {

  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    if (images.length > 1) {
      timeoutRef.current = setTimeout(
        () => setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1)),
        interval
      );
    }

    return () => {
      resetTimeout();
    };
  }, [currentIndex, images, interval]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (!images || images.length === 0) {
    return <div>No hay imágenes para mostrar.</div>;
  }

  return (
    <div className={styles.carouselContainer}>
      {showControls && images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={`${styles.carouselButton} ${styles.prevButton}`}
          >
            &#10094;
          </button>
          <button
            onClick={goToNext}
            className={`${styles.carouselButton} ${styles.nextButton}`}
          >
            &#10095;
          </button>
        </>
      )}
      <div
        className={styles.carouselSlider}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            className={styles.carouselSlide}
            key={index}
          >
            <img
              src={image.src}
              alt={`Slide ${index + 1}`}
              className={styles.carouselImage}
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
