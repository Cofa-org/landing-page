import IaPoliciesHeader from "../../Sections/IaPolicies/IaPoliciesHeader.jsx";
import { Footer, Header } from "../../Components/index.js";
import IaPoliciesMain from "../../Sections/IaPolicies/IaPoliciesMain.jsx";

const IaPoliciesScreen = () => {
  return (
    <>
      <Header />
      <IaPoliciesHeader />
      <IaPoliciesMain />
      <Footer />
    </>
  );
};

export default IaPoliciesScreen;
