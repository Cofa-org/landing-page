import React, { useState } from "react";
import { Field, Formik, Form, ErrorMessage } from "formik";
import { FaArrowRightLong, FaCheck } from "react-icons/fa6";
import "./style.css";
import { Link } from "react-router-dom";
import MailService from "../../services/mailService.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import Notification from "../Notifications/Notification.jsx";

const mapSituacionLaboral = (value) => {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes("dependencia") || /\bempleado\b/.test(lowerValue)) return "relacion-dependencia";
  if (lowerValue.includes("monotributista") || lowerValue.includes("autónomo") || lowerValue.includes("autonomo")) return "monotributista";
  if (lowerValue.includes("informal") || lowerValue.includes("negro")) return "informal";
  if (lowerValue.includes("jubilado") || lowerValue.includes("pensionado")) return "jubilado-pensionado";
  if (lowerValue.includes("estudiante")) return "estudiante";
  if (lowerValue.includes("freelance") || lowerValue.includes("independiente")) return "freelancer";
  if (lowerValue.includes("desempleado") || lowerValue.includes("parado") || lowerValue.includes("sin empleo")) return "desempleado";
  return "otro";
};

const mapIngresos = (value) => {
  if (!value) return null;
  // Excluimos puntos y comas por si viene "850.000"
  const cleanValue = value.replace(/[,.]/g, ''); 
  const numValue = Number(cleanValue);
  
  if (isNaN(numValue)) return null;
  
  if (numValue <= 300000) return "Menos de $300.000";
  if (numValue <= 600000) return "De $300.001 a $600.000";
  if (numValue <= 1000000) return "De $600.001 a $1.000.000";
  return "Más de $1.000.000";
};

const PersonalLendForm = ({ type = "EL-MEJOR-TRATO" }) => {
  const [isSent, setIsSent] = useState(false);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    formData.append("terminos_y_condiciones", values.terminos_y_condiciones);

    if (values.files && values.files.buffer) {
      const file = values.files;
      const blob = new Blob([new Uint8Array(file.buffer)], { type: file.type || "application/pdf" });
      formData.append("archivoPDF", blob, file.originalname);
    }

    searchParams.forEach((value, key) => {
      if (!formData.has(key)) {
        formData.append(key, value);
      }
    });

    try {
      const response = await MailService.sendMail(type, formData);

      setNotification({
        show: true,
        message: "¡Solicitud enviada con éxito!",
        type: "success",
      });
      setIsSent(true);
      resetForm();
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      setNotification({
        show: true,
        message: error.message || "Error en el envío del formulario",
        type: "error",
      });
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
      errors.cuit = "El DNI/CUIT no puede estar vacío";
    } else if (![7, 8, 11].includes(String(values.cuit).length)) {
      errors.cuit = "El documento debe tener 7, 8 u 11 dígitos numéricos";
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
    if (!values.terminos_y_condiciones) {
      errors.terminos_y_condiciones = "Debe aceptar los términos y condiciones";
    } else {
      errors.terminos_y_condiciones = "";
    }

    // Verificar si todos los campos están completos
    const isFormValid = Object.values(errors).every((error) => error === "");

    return isFormValid ? false : errors;
  };

  return (
    <div className='form-template'>
      <Formik
        enableReinitialize={true}
        initialValues={{
          name: searchParams.get("nombre_completo") || searchParams.get("name") || searchParams.get("nombre") || "",
          cuit: searchParams.get("dni_cuit") || searchParams.get("cuit") || searchParams.get("cuil") || "",
          email: searchParams.get("email") || searchParams.get("correo") || "",
          telephone: searchParams.get("telephone") || searchParams.get("telefono") || "",
          situacion: mapSituacionLaboral(searchParams.get("situacion_laboral")) || searchParams.get("situacion") || searchParams.get("sit_laboral") || "",
          ingresos: mapIngresos(searchParams.get("ingresos_promedio")) || searchParams.get("ingresos") || "",
          amount: searchParams.get("importe_solicitado") || searchParams.get("amount") || searchParams.get("monto") || "",
          terminos_y_condiciones: false,
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        {({ isSubmitting, isValid }) => (
          <Form className='form-container'>
            <div className='input-container'>
              <label>Nombre Completo</label>
              <Field
                name='name'
                type='text'
                placeholder='Nombre y apellido'
              />
              <ErrorMessage
                name='name'
                component='div'
                className='error-message'
              />
            </div>

            <div className='input-container'>
              <label>DNI | CUIL | CUIT</label>
              <Field
                name='cuit'
                type='number'
                placeholder='Ej: 11222333 o 20112223330'
              />
              <ErrorMessage
                name='cuit'
                component='div'
                className='error-message'
              />
            </div>

            <div className='input-container'>
              <label>Correo electrónico</label>
              <Field
                name='email'
                type='email'
                placeholder={"nombre123@gmail.com"}
              />
              <ErrorMessage
                name='email'
                component='div'
                className='error-message'
              />
            </div>

            <div className='input-container'>
              <label htmlFor='telephone'>Teléfono</label>
              <Field
                name='telephone'
                placeholder='1122334455'
                id='telephone'
              />
              <ErrorMessage
                name='telephone'
                component='div'
                className='error-message'
              />
            </div>

            <div className='input-container input-container-100'>
              <label htmlFor='mySelectField'>Situación Laboral:</label>
              <Field
                as='select'
                name='situacion'
                id='mySelectField'
              >
                <option
                  value='no'
                  label='Elija su situacion laboral'
                />
                <option
                  value='relacion-dependencia'
                  label='Relacion de dependencia'
                />
                <option
                  value='monotributista'
                  label='Monotribustista/Autónomo'
                />
                <option
                  value='informal'
                  label='Trabajo informal'
                />
                <option
                  value='jubilado-pensionado'
                  label='Jubilado/Pensionado'
                />
                <option
                  value='estudiante'
                  label='Estudiante'
                />
                <option
                  value='freelancer'
                  label='Freelancer'
                />
                <option
                  value='desempleado'
                  label='Desempleado'
                />
                <option
                  value='otro'
                  label='Otro'
                />
              </Field>
              <ErrorMessage
                name='situacion'
                component='div'
                className='error-message'
              />
            </div>

            <div className='input-container input-container-100'>
              <label htmlFor='mySelectField'>Ingresos promedio:</label>
              <Field
                as='select'
                name='ingresos'
                id='mySelectField'
              >
                <option
                  value='no'
                  label='Elija su nivel de ingresos'
                />
                <option
                  value='Menos de $300.000'
                  label='Menos de $300.000'
                />
                <option
                  value='De $300.001 a $600.000'
                  label='De $300.001 a $600.000'
                />
                <option
                  value='De $600.001 a $1.000.000'
                  label='De $600.001 a $1.000.000'
                />
                <option
                  value='Más de $1.000.000'
                  label='Más de $1.000.000'
                />
              </Field>
              <ErrorMessage
                name='ingresos'
                component='div'
                className='error-message'
              />
            </div>

            <div className='input-container input-container-100'>
              <label htmlFor='amount'>Importe solicitado:</label>
              <Field
                name='amount'
                id='amount'
                placeholder='$'
              />
              <ErrorMessage
                name='amount'
                component='div'
                className='error-message'
              />
            </div>
            <div className='input-container-100'>
              <Field
                name='terminos_y_condiciones'
                type='checkbox'
                id='aceptarTerminos'
                className='checkbox'
              />
              <ErrorMessage
                name='terminos_y_condiciones'
                component='div'
                className='error-message'
              />
              <label htmlFor='aceptarTerminos'>
                Acepto los{" "}
                <Link
                  to='/terminos-y-condiciones'
                  style={{ textDecoration: "underline" }}
                >
                  Términos y Condiciones
                </Link>
              </label>
            </div>

            <div className='submit'>
              {isSent ? (
                <span className='sent-message'>
                  Enviado <FaCheck />
                </span>
              ) : (
                <button
                  type='submit'
                  className={`primary-btn ${isSubmitting || !isValid ? "disabled-btn" : ""}`}
                  disabled={isSubmitting || !isValid}
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
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
};

const ContactFormWithDropper = () => {
  return <form>ContactForm</form>;
};

export { PersonalLendForm, ContactFormWithDropper };
