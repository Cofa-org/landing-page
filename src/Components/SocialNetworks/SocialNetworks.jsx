import { BsFacebook, BsInstagram, BsLinkedin, BsTiktok } from "react-icons/bs";
import { Link } from "react-router-dom";
import "./SocialNetworks.css";

function SocialNetworks() {
  return (
    <div className='socialMediaList'>
      <Link
        to={"https://www.facebook.com/cofa.ar"}
        target='_blank'
        aria-label='Facebook COFA'
      >
        <BsFacebook />
      </Link>
      <Link
        to={"https://www.instagram.com/cofa.ar"}
        target='_blank'
        aria-label='Instagram COFA'
      >
        <BsInstagram />
      </Link>
      <Link
        to={"https://www.tiktok.com/@cofa.ar?lang=es"}
        target='_blank'
        aria-label='TikTok COFA'
      >
        <BsTiktok />
      </Link>
      <Link
        to={"https://www.linkedin.com/company/cofa-ar/"}
        target='_blank'
        aria-label='LinkedIn COFA'
      >
        <BsLinkedin />
      </Link>
    </div>
  );
}

export default SocialNetworks;
