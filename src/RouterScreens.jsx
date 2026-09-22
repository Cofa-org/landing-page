import { Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "./Components/Loader/Loader";
import OnboardingFlowScreen from "./screens/registrationSim/OnboardingFlowScreen.jsx";
import { useAuth } from "./context/index.js";
import LoginScreen from "./screens/auth/LoginScreen.jsx";
import RegisterScreen from "./screens/auth/RegisterScreen.jsx";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen.jsx";
import ResetPasswordScreen from "./screens/auth/ResetPasswordScreen.jsx";

/**
 * Guard que redirige al home si el usuario ya tiene sesión activa.
 * - Mientras authLoading es true mostramos los children (optimistic): si el usuario
 *   sí tiene sesión, el redirect ocurre igual en cuanto me() responde (< 200 ms).
 *   Esto evita mostrar una página en blanco mientras se verifica la cookie.
 * IMPORTANTE: definida fuera del componente para que React no la trate como un
 * tipo nuevo en cada render (lo que causaría unmount/remount de la ruta).
 */
const RedirectIfAuth = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  if (!authLoading && user) return <Navigate to="/" replace />;
  return children;
};

/**
 * Guard que redirige a /ingresar si el usuario NO tiene sesión activa.
 * Renderiza los children mientras authLoading es true (optimistic).
 */
const RequireAuth = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  if (!authLoading && !user) return <Navigate to="/ingresar" replace />;
  return children;
};

// Lazy-loaded screens
const HomeScreen = lazy(() => import("./screens/HomeScreen/HomeScreen"));
const LoanSimScreen = lazy(() => import("./screens/LoanSim/LoanSimScreen"));
const CofaTipsScreen = lazy(() => import("./screens/cofaTipsScreen/CofaTipsScreen.jsx"));
const ComplaintsScreen = lazy(() => import("./screens/ComplaintsScreen/ComplaintsScreen"));
const DischargeScreen = lazy(() => import("./screens/DischargeScreen/DischargeScreen"));
const ElMejorTratoScreen = lazy(() => import("./screens/ElMejorTratoScreen/ElMejorTratoScreen"));
const ErrorScreen = lazy(() => import("./screens/ErrorScreen/ErrorScreen"));
const PrivacyPoliciesScreen = lazy(
  () => import("./screens/PrivacyPoliciesScreen/PrivacyPoliciesScreen"),
);
const QuejasScreen = lazy(() => import("./screens/QuejasScreen/QuejasScreen"));
const RegretOrDischargeScreen = lazy(
  () => import("./screens/RegretOrDischargeScreen/RegretOrDischargeScreen"),
);
const SuggestionsScreen = lazy(() => import("./screens/SuggestionsScreen/SuggestionsScreen"));
const TermsPointsScreen = lazy(() => import("./screens/TermsScreen/TermsPointsScreen"));
const TermsScreen = lazy(() => import("./screens/TermsScreen/TermsScreen"));
const FrecuentQuestionScreen = lazy(
  () => import("./screens/FrecuentQuestionScreen/FrecuentQuestionScreen"),
);
const SacarPrestamoScreen = lazy(() => import("./screens/SacarPrestamoScreen/SacarPrestamoScreen"));
const FormWorkWithUs = lazy(() => import("./Sections/WorkWithUs/FormWorkWithUs"));
const BlogDetailScreen = lazy(() => import("./screens/blogDetailScreen/BlogDetailScreen.jsx"));
const IaPoliciesScreen = lazy(() => import("./screens/IaPoliciesScreen.jsx/IaPoliciesScreen.jsx"));
const ReqAutoridadesScreen = lazy(() => import("./screens/ReqAutoridadesScreen/ReqAutoridadesScreen.jsx"));
const DNIUploadMobileScreen = lazy(() => import("./screens/DNIUploadMobile/DNIUploadMobileScreen"));
const MisSolicitudesScreen = lazy(() => import("./screens/MisSolicitudesScreen/MisSolicitudesScreen"));

/* import SuggestionsScreen from './screens/SuggestionsScreen/SuggestionsScreen' */

const RouterScreens = () => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            marginAuto: "auto",
            width: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Loader />
        </div>
      }
    >
      <Routes>
        <Route
          path='/'
          element={<HomeScreen />}
        />
        {/* Prestamos  */}
        <Route
          path='/prestamos'
          element={<HomeScreen />}
        />
        <Route
          path='/simulador'
          element={<LoanSimScreen />}
        />
        <Route
          path='/registro-simulador'
          element={<OnboardingFlowScreen />}
        />
        {/* Preguntas Frecuentes */}
        <Route
          path='/preguntas-frecuentes'
          element={<FrecuentQuestionScreen />}
        />
        {/* Prestamos  */}
        <Route
          path='/terminos-y-condiciones'
          element={<TermsScreen />}
        />
        {/* Terminos y Condiciones */}
        <Route
          path='/politicas-de-privacidad'
          element={<PrivacyPoliciesScreen />}
        />
        <Route
          path='/politicas-de-uso-ia'
          element={<IaPoliciesScreen />}
        />
        {/* Politicas de Privacidad */}
        {/* <Route path='/puntos-cofa' element={<PointsScreen/>}/>Puntos COFA */}
        <Route
          path='/sugerencias'
          element={<SuggestionsScreen />}
        />{" "}
        {/* Sugerencias */}
        <Route
          path='/baja'
          element={<DischargeScreen />}
        />{" "}
        {/* Baja */}
        <Route
          path='/arrepentimiento'
          element={<RegretOrDischargeScreen />}
        />{" "}
        {/* Arrepentimiento */}
        <Route
          path='/reclamos'
          element={<ComplaintsScreen />}
        />{" "}
        {/* Reclamos */}
        <Route
          path='/requerimientos-autoridades'
          element={<ReqAutoridadesScreen />}
        />{" "}
        {/* Requerimientos Autoridades */}
        <Route
          path='/quejas'
          element={<QuejasScreen />}
        />{" "}
        {/* Quejas */}
        <Route
          path='/terminos-y-condiciones-puntos-cofa'
          element={<TermsPointsScreen />}
        />{" "}
        {/* Terminos y Condiciones Puntos COFA */}
        <Route
          path='/trabaja-con-nosotros'
          element={<FormWorkWithUs />}
        />{" "}
        {/* Trabaja con Nosotros */}
        <Route
          path='/el-mejor-trato'
          element={<ElMejorTratoScreen />}
        />{" "}
        {/* El Mejor Trato */}
        <Route
          path='/sacar-prestamo'
          element={<SacarPrestamoScreen />}
        />{" "}
        {/* Sacar Prestamo */}
        <Route
          path='/cofa-tips'
          element={<CofaTipsScreen />}
        />{" "}
        <Route
          path='/blog/:slug'
          element={<BlogDetailScreen />}
        />
        {/* Cofa Tips */}
        {/* <Route path='/asistencias' element={<AssistenceScreen/>}/> */} {/* Asistencias */}
        {/* <Route path='/asistencias/terminos-multiasistencia' element={<TermsV2 type={'MULTIASISTENCIA'}/>}/>
          <Route path='/asistencias/terminos-salud-integral' element={<TermsV2 type={'SALUDINTEGRAL'}/>}/>
          <Route path='/asistencias/terminos-desempleo' element={<TermsV2 type={'DESEMPLEO'}/>}/> */}
        <Route
          path='/subir-dni'
          element={<DNIUploadMobileScreen />}
        />
        {/* Auth */}
        <Route
          path='/ingresar'
          element={<RedirectIfAuth><LoginScreen /></RedirectIfAuth>}
        />
        <Route
          path='/crear-cuenta'
          element={<RedirectIfAuth><RegisterScreen /></RedirectIfAuth>}
        />
        <Route
          path='/recuperar-contrasena'
          element={<ForgotPasswordScreen />}
        />
        <Route
          path='/restablecer-contrasena'
          element={<ResetPasswordScreen />}
        />
        <Route
          path='/mis-solicitudes'
          element={<RequireAuth><MisSolicitudesScreen /></RequireAuth>}
        />

        <Route
          path='*'
          element={<ErrorScreen />}
        />{" "}
        {/* Error */}
      </Routes>
    </Suspense>
  );
};

export default RouterScreens;
