import React from "react";
import { Link } from "react-router-dom";

export const iaPoliciesData = [
  {
    content: "Uso de datos en servicios de IA",
    subcontent: [
      {
        content: "COFA podrá utilizar:",
        subcontent: [
          {
            content: (
              <>
                Datos enviados por los clientes (según se define en nuestros{" "}
                <Link
                  className='linkRedirect'
                  to={"/terminos-y-condiciones/#top"}
                >
                  Términos y condiciones
                </Link>{" "}
                y{" "}
                <Link
                  className='linkRedirect'
                  to={"/politicas-de-privacidad/#top"}
                >
                  Políticas de privacidad
                </Link>
                ).
              </>
            ),
          },
          {
            content:
              "Datos propios y modelos internos desarrollados para análisis y gestión de riesgo crediticio, prevención de fraude, atención al cliente y optimización de procesos.",
          },
        ],
      },
      {
        content: "El tratamiento de estos datos tiene como finalidad:",
        subcontent: [
          { content: "Mejorar la precisión de nuestras evaluaciones de riesgo." },
          { content: "Personalizar ofertas y recomendaciones." },
          {
            content:
              "Optimizar la detección y prevención de operaciones inusuales o sospechosas, tanto para prevención de fraude como de lavado de activos.",
          },
          { content: "Agilizar la atención y resolución de consultas." },
        ],
      },
    ],
  },
  {
    content: "Principios de uso de IA en COFA",
    subcontent: [
      {
        content:
          "Privacidad y seguridad: Todo tratamiento de datos cumplirá con la Ley 25.326 de Protección de Datos Personales, la normativa del BCRA, UIF y demás regulaciones aplicables.",
      },
      {
        content:
          "Control y Transparencia: Los clientes podrán solicitar información sobre el uso de IA en el tratamiento de sus datos.",
      },
      {
        content:
          "Minimización de datos: Solo se utilizarán los datos estrictamente necesarios para la finalidad declarada.",
      },
    ],
  },
  {
    content: "Proveedores externos de IA",
    subcontent: [
      {
        content:
          "Las tecnologías de IA de terceros que COFA pueda integrar estarán siempre detalladas en nuestra lista de proveedores.",
      },
      {
        content: "Actualmente, estos proveedores son, entre otros:",
        subcontent: [
          {
            content:
              "OpenAI: Modelos de procesamiento de lenguaje natural para soporte, redacción y análisis de datos.",
          },
          {
            content:
              "Anthropic: Modelos conversacionales y de análisis de texto, utilizados junto con OpenAI para funciones de atención y soporte.",
          },
          {
            content:
              "Google Gemini: Utilizado para análisis de información y respuestas a consultas, alojado en entornos de Google Cloud seguros y bajo control de COFA.",
          },
          {
            content:
              "Perplexity: Herramientas de investigación y generación de insights para soporte operativo y análisis de tendencias.",
          },
          {
            content:
              "Assembly AI: Modelos de transcripción de audio a texto, utilizados en grabaciones de atención y auditorías internas.",
          },
        ],
      },
    ],
  },
  {
    content: "Conservación y eliminación de datos",
    subcontent: [
      {
        content:
          "Los datos enviados a proveedores de IA externos se eliminarán de dichas plataformas dentro de los 30 días posteriores a su uso, salvo obligación legal en contrario.",
      },
      {
        content:
          "COFA revisa y actualiza periódicamente sus políticas y procedimientos para garantizar el cumplimiento normativo y las mejores prácticas del sector financiero.",
      },
    ],
  },
  {
    content:
      "Contacto: Para consultas sobre el uso de IA en COFA, los clientes pueden escribir a: consultas@cofa.com.ar",
  },
  {
    content: "Última actualización: 14/8/2025",
  },
];
