import { Footer, Header } from "../../Components/index.js";
import { Contact, IaPoliciesHeader, IaPoliciesMain } from "../../Sections/index.js";

const IaPoliciesScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Desplazarse al principio de la página
  }, []);

  return (
    <>
      <Header />
      <IaPoliciesHeader />
      <IaPoliciesMain />
      <Contact />
      <Footer />
    </>
  );
};

export default IaPoliciesScreen;
