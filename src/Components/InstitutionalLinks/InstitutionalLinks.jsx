import { Link } from "react-router-dom";

function InstitutionalLinks() {
  return (
    <div className='links'>
      <Link
        className='linkRedirect'
        to={"/politicas-de-privacidad/#top"}
      >
        Politicas de privacidad
      </Link>
      <Link
        className='linkRedirect'
        to={"/terminos-y-condiciones/#top"}
      >
        Términos y Condiciones
      </Link>
    </div>
  );
}

export default InstitutionalLinks;
