import { Header, Footer } from "../../Components/index.js";
import AuthLeftPanel from "./AuthLeftPanel.jsx";
import styles from "./auth.module.css";

const AuthSplitLayout = ({ title, sub, image, children }) => (
  <>
    <Header />
    <div className={styles.splitLayout}>
      <AuthLeftPanel title={title} sub={sub} image={image} />
      <div className={styles.rightPanel}>{children}</div>
    </div>
    <Footer />
  </>
);

export default AuthSplitLayout;
