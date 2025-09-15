import "./IaPolicies.css";

const IaPoliciesHeader = () => {
  return (
    <section className='policies-header'>
      <h1
        id='top'
        className='policies-title'
      >
        Política de Uso de Inteligencia Artificial (IA) de COFA{" "}
      </h1>
      <h2 style={{ marginBottom: "1rem" }}>Divulgación de proveedores externos</h2>
      <p className='p-after-title'>
        En COFA nos comprometemos a ofrecer a nuestros clientes, productos y servicios financieros
        digitales seguros, eficientes y alineados con las mejores prácticas del mercado. Nuestros
        valores fundamentales son la confianza, la transparencia y la protección de los datos de
        quienes utilizan nuestra plataforma. Los avances en inteligencia artificial (IA) nos
        permiten optimizar nuestros procesos internos y ofrecer experiencias más personalizadas,
        ágiles y seguras. Para lograrlo, podemos recurrir a proveedores externos especializados en
        IA, así como a modelos desarrollados internamente.
      </p>
    </section>
  );
};

export default IaPoliciesHeader;
