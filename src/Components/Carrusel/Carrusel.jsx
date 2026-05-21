import React, { useEffect, useState, useRef } from "react";
import style from "./Carrusel.module.css";

const Carrusel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images?.length);
    }, 8000); // 8 segundos

    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, images?.length]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.warn("Error playing video:", err);
      });
    }
  }, [currentIndex]);

  return (
    <div className={style.carrusel}>
      <video
        key={currentIndex} // Forzar reinicio al cambiar de slide
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="metadata"
        className={style.image}
        // style={{ width: "100%", height: "auto", maxHeight: "400px", borderRadius: "8px" }}
      >
        <source
          type='video/mp4'
          src={images[currentIndex]}
        />
        Tu navegador no soporta videos.
      </video>
    </div>
  );
};

export default Carrusel;
