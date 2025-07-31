import "./cofa-tips.css";

const CofaTipsSection = () => {
  // Data for pagination dots
  const paginationDots = [
    { active: true, className: "cofa-tips-dot cofa-tips-dot-large" },
    { active: false, className: "cofa-tips-dot cofa-tips-dot-small" },
    { active: false, className: "cofa-tips-dot cofa-tips-dot-small" },
  ];

  return (
    <section className='cofa-tips-section'>
      <div className='container cofa-tips-container'>
        {/* Top section with logo and main card */}
        <div className='cofa-tips-top'>
          {/* COFA Tips Logo */}
          <div className='cofa-tips-logo'>
            <div className='cofa-tips-logo-container'>
              <div className='cofa-tips-logo-container'>
                <div className='cofa-tips-logo-bg'>
                  <img
                    className='cofa-tips-logo-vector1'
                    alt='Vector'
                    src='../../../img/logo_cofa_tips.svg'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Featured content card */}
          <div className='card cofa-tips-featured-card'>
            <div className='card-content'>
              <img
                className='card-image'
                src='../../../img/cofa-tips.webp'
                alt='Card Image'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CofaTipsSection;
