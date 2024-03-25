import React, { useState, useEffect } from 'react';

function AnimatedTitle() {
  const options = ['rápidos', 'sencillos' , '100% online'];
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOptionIndex((prevIndex) => (prevIndex + 1) % options.length);
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  return (
      <h1 className='animated-title typewriter'>
        <TypeWriterText text={options[currentOptionIndex]} />
        <span className="cursor" />
      </h1>
  );
}

function TypeWriterText({ text }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      setDisplayedText((prevText) => {
        currentIndex += 1;
        return text.slice(0, currentIndex);
      });

      if (currentIndex === text.length) {
        clearInterval(typingInterval);
      }
    }, 100); // Velocidad de escritura (ms por caracter)

    return () => clearInterval(typingInterval);
  }, [text]);

  return <>{displayedText}</>;
}

export default AnimatedTitle;
