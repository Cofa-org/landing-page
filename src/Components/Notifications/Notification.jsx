import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import "./Notification.css";

const Notification = ({ message, type = "success", onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className='notification-icon' />;
      case "error":
        return <FaExclamationCircle className='notification-icon' />;
      case "info":
        return <FaInfoCircle className='notification-icon' />;
      default:
        return <FaCheckCircle className='notification-icon' />;
    }
  };

  return (
    <div className={`notification-container ${type} ${isVisible ? "show" : "hide"}`}>
      <div className='notification-content'>
        {getIcon()}
        <span className='notification-message'>{message}</span>
      </div>
      <button
        className='notification-close'
        onClick={handleClose}
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Notification;
