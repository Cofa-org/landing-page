import React, { useState } from "react";
import { Field, Formik, Form, ErrorMessage } from "formik";
import { FaArrowRightLong, FaCheck } from "react-icons/fa6";
import "./style.css";
import { Link } from "react-router-dom";

const PersonalLendForm = () => {
  const [isSent, setIsSent] = useState(false);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  const handleAceptoCambio = () => {
    setAceptoTerminos(!aceptoTerminos);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();

    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("telephone", values.telephone);
    formData.append("sit_laboral", values.situacion);
    formData.append("ingresos", values.ingresos);
    formData.append("cuit", values.cuit);
    formData.append("amount", values.amount);

    if (values.files && values.files.buffer) {
      const file = values.files;
      const blob = new Blob([new Uint8Array(file.buffer)], { type: "application/pdf" });
      formData.append("archivoPDF", blob, file.originalname);
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/mail/` + "EL-MEJOR-TRATO",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer clave-secreta-cofa`,
          },
          body: formData,
        }
      );

      if (response.status === 200) {
        setIsSent(true);
        resetForm();
      }
    } catch (error) {
      console.error("Error en el envío del formulario:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};

    if (!values.name) {
      errors.name = "El nombre no puede estar vacío";
    } else {
      errors.name = "";
    }

    if (!values.cuit) {
      errors.cuit = "El CUIL|CUIT no puede estar vacío";
    } else if (String(values.cuit).length !== 11) {
      errors.cuit = "El CUIL|CUIT debe tener 11 dígitos numéricos";
    } else {
      errors.cuit = "";
    }

    const emailPattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!values.email) {
      errors.email = "El email no puede estar vacío";
    } else if (!emailPattern.test(values.email)) {
      errors.email = "Debe ingresar un email válido";
    } else {
      errors.email = "";
    }

    if (!values.telephone) {
      errors.telephone = "El celular no puede estar vacío";
    } else if (String(values.telephone).length !== 10) {
      errors.telephone = "Debe ingresar un celular válido";
    } else {
      errors.telephone = "";
    }

    if (!values.situacion || values.situacion === "no") {
      errors.situacion = "Debe elegir una situación laboral válida";
    } else {
      errors.situacion = "";
    }

    if (!values.ingresos || values.ingresos === "no") {
      errors.ingresos = "Debe elegir un nivel de ingresos válido";
    } else {
      errors.ingresos = "";
    }

    if (!values.amount) {
      errors.amount = "El importe no puede estar vacío";
    } else {
      errors.amount = "";
    }

    // Verificar si todos los campos están completos
    const isFormValid = Object.values(errors).every((error) => error === "");

    return isFormValid ? false : errors;
  };

  return (
    <div className="form-template">
      <Formik
        initialValues={{
          name: "",
          cuit: "",
          email: "",
          telephone: "",
          situacion: "",
          ingresos: "",
          amount: "",
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="form-container">
            <div className="input-container">
              <label>Nombre Completo</label>
              <Field
                name="name"
                type="text"
                placeholder="Nombre y apellido"
              />
              <ErrorMessage
                name="name"
                component="div"
                className="error-message"
              />
            </div>

            <div className="input-container">
              <label>CUIL | CUIT</label>
              <Field
                name="cuit"
                type="number"
                placeholder="00112223330"
              />
              <ErrorMessage
                name="cuit"
                component="div"
                className="error-message"
              />
            </div>

            <div className="input-container">
              <label>Correo electrónico</label>
              <Field
                name="email"
                type="email"
                placeholder={"nombre123@gmail.com"}
              />
              <ErrorMessage
                name="email"
                component="div"
                className="error-message"
              />
            </div>

            <div className="input-container">
              <label htmlFor="telephone">Teléfono</label>
              <Field
                name="telephone"
                placeholder="1122334455"
                id="telephone"
              />
              <ErrorMessage
                name="telephone"
                component="div"
                className="error-message"
              />
            </div>

            <div className="input-container input-container-100">
              <label htmlFor="mySelectField">Situación Laboral:</label>
              <Field
                as="select"
                name="situacion"
                id="mySelectField"
              >
                <option
                  value="no"
                  label="Elija su situacion laboral"
                />
                <option
                  value="relacion-dependencia"
                  label="Relacion de dependencia"
                />
                <option
                  value="monotributista"
                  label="Monotribustista/Autónomo"
                />
                <option
                  value="informal"
                  label="Trabajo informal"
                />
                <option
                  value="jubilado-pensionado"
                  label="Jubilado/Pensionado"
                />
                <option
                  value="estudiante"
                  label="Estudiante"
                />
                <option
                  value="freelancer"
                  label="Freelancer"
                />
                <option
                  value="desempleado"
                  label="Desempleado"
                />
                <option
                  value="otro"
                  label="Otro"
                />
              </Field>
              <ErrorMessage
                name="situacion"
                component="div"
                className="error-message"
              />
            </div>

            <div className="input-container input-container-100">
              <label htmlFor="mySelectField">Ingresos promedio:</label>
              <Field
                as="select"
                name="ingresos"
                id="mySelectField"
              >
                <option
                  value="no"
                  label="Elija su nivel de ingresos"
                />
                <option
                  value="Menos de $300.000"
                  label="Menos de $300.000"
                />
                <option
                  value="De $300.001 a $600.000"
                  label="De $300.001 a $600.000"
                />
                <option
                  value="De $600.001 a $1.000.000"
                  label="De $600.001 a $1.000.000"
                />
                <option
                  value="Más de $1.000.000"
                  label="Más de $1.000.000"
                />
              </Field>
              <ErrorMessage
                name="ingresos"
                component="div"
                className="error-message"
              />
            </div>

            <div className="input-container input-container-100">
              <label htmlFor="amount">Importe solicitado:</label>
              <Field
                name="amount"
                id="amount"
                placeholder="$"
              />
              <ErrorMessage
                name="amount"
                component="div"
                className="error-message"
              />
            </div>
            <div className="input-container-100">
              <input
                type="checkbox"
                id="aceptarTerminos"
                className="checkbox"
                checked={aceptoTerminos}
                onChange={handleAceptoCambio}
              />
              <label htmlFor="aceptarTerminos">
                Acepto los{" "}
                <Link
                  to="/terminos-y-condiciones"
                  style={{ textDecoration: "underline" }}
                >
                  Términos y Condiciones
                </Link>
              </label>
            </div>

            <div className="submit">
              {isSent ? (
                <span className="sent-message">
                  Enviado <FaCheck />
                </span>
              ) : (
                <button
                  type="submit"
                  className={`primary-btn ${
                    isSubmitting || !isValid || !aceptoTerminos ? "disabled-btn" : ""
                  }`}
                  disabled={isSubmitting || !isValid || !aceptoTerminos}
                >
                  Enviar <FaArrowRightLong />
                </button>
              )}
            </div>
            <p style={{ justifyContent: "flex-end", marginTop: "2%" }}>
              Te contactaremos a la brevedad
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
};

const ContactFormWithDropper = () => {
  return <form>ContactForm</form>;
};

export { PersonalLendForm, ContactFormWithDropper };
