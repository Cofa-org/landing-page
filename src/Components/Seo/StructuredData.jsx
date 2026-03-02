import React from 'react';
import PropTypes from 'prop-types';

const StructuredData = ({ faqData, breadcrumbData }) => {
  return (
    <>
      {faqData && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData,
          })}
        </script>
      )}
      {breadcrumbData && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbData,
          })}
        </script>
      )}
    </>
  );
};

StructuredData.propTypes = {
  faqData: PropTypes.arrayOf(
    PropTypes.shape({
      '@type': PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      acceptedAnswer: PropTypes.shape({
        '@type': PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
      }).isRequired,
    })
  ),
  breadcrumbData: PropTypes.arrayOf(
    PropTypes.shape({
      '@type': PropTypes.string.isRequired,
      position: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      item: PropTypes.string.isRequired,
    })
  ),
};

export default StructuredData;