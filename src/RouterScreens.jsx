import { Route, Routes } from "react-router-dom";
import {
  CofaTipsScreen,
  ComplaintsScreen,
  DischargeScreen,
  ElMejorTratoScreen,
  ErrorScreen,
  HomeScreen,
  PrivacyPoliciesScreen,
  QuejasScreen,
  RegretOrDischargeScreen,
  SuggestionsScreen,
  TermsPointsScreen,
  TermsScreen,
  LoanSimScreen,
  FrecuentQuestionScreen,
} from "./screens";
import { FormWorkWithUs } from "./Sections";
import { BlogDetailScreen } from "./screens/blogDetailScreen/BlogDetailScreen.jsx";
import IaPoliciesScreen from "./screens/IaPoliciesScreen.jsx/IaPoliciesScreen.jsx";

/* import SuggestionsScreen from './screens/SuggestionsScreen/SuggestionsScreen' */

const RouterScreens = () => {
  return (
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
        path='*'
        element={<ErrorScreen />}
      />{" "}
      {/* Error */}
    </Routes>
  );
};

export default RouterScreens;
