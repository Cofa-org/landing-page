import React, { useState, useEffect } from 'react';
import './ClientReview.css';
import { ImQuotesLeft, ImQuotesRight } from 'react-icons/im';
import { IoIosArrowRoundBack, IoIosArrowRoundForward } from 'react-icons/io';
import { clientReview } from '../../data/info';

const ClientReview = () => {
  const [currentReview, setCurrentReview] = useState(0);

  const nextReview = () => {
    setCurrentReview((prevReview) => (prevReview + 1) % clientReview.length);
  };

  const prevReview = () => {
    setCurrentReview((prevReview) =>
      (prevReview - 1 + clientReview.length) % clientReview.length
    );
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      nextReview();
    }, 7000);

    return () => clearInterval(intervalId);
  }, [currentReview]);

  return (
    <section className="clientReview">
      <div className="info-review">
        <h2>¿Qué dicen nuestros clientes sobre COFA?</h2>
        <span className="quotes open-quotes">
          <ImQuotesLeft />
        </span>
        <div key={clientReview[currentReview].id} className="review">
          <p className="quote">{clientReview[currentReview].content}</p>
          <span className="authorReview">{clientReview[currentReview].author}</span>
        </div>
        <span className="quotes close-quotes">
          <ImQuotesRight />
        </span>
      </div>
      <div className="container-arrow-icon">
        <IoIosArrowRoundBack onClick={prevReview} />
        <IoIosArrowRoundForward onClick={nextReview} />
      </div>
    </section>
  );
};

export default ClientReview;
