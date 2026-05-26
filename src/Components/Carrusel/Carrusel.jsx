import React, { useEffect, useState, useRef } from "react";
import style from "./Carrusel.module.css";

const Carrusel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  // Rotación automática cada 8 segundos
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images?.length);
    }, 8000);

    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, images?.length]);

  // Cambia el src sin desmontar el elemento — evita solicitudes HTTP duplicadas
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !images?.length) return;
    video.src = images[currentIndex];
    video.load();
    video.play().catch((err) => {
      console.warn("Error reproduciendo video:", err);
    });
  }, [currentIndex, images]);

  return (
    <div className={style.carrusel}>
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        preload="none"
        poster="/img/hero-img.webp"
        className={style.image}
      >
        Tu navegador no soporta videos.
      </video>
    </div>
  );
};

export default Carrusel;
