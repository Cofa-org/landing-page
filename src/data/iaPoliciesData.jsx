import React from "react";
import { Link } from "react-router-dom";

export const iaPoliciesData = [
  {
    content: "Introducción",
    paragraphs: [
      "COFA utiliza tecnologías de Inteligencia Artificial (IA) para mejorar la calidad de sus servicios digitales, fortalecer los procesos de análisis crediticio, prevenir fraudes y ofrecer una experiencia más ágil, segura y personalizada.",
      "Esta Política explica cómo COFA aplica la IA, qué principios la guían y qué derechos tienen los usuarios al interactuar con herramientas que utilicen esta tecnología.",
      "El uso de nuestros servicios implica la aceptación de esta Política."
    ]
  },
  {
    content: "Objetivo",
    paragraphs: [
      "Establecer las reglas, límites y lineamientos de COFA para asegurar que la IA se utilice de manera:"
    ],
    bullets: [
      "ética",
      "segura",
      "transparente",
      "respetuosa de los derechos de los usuarios",
      "y en cumplimiento con las normativas aplicables del BCRA, UIF, AAIP y legislación vigente"
    ]
  },
  {
    content: "Alcance",
    paragraphs: [
      "Esta Política aplica a:"
    ],
    bullets: [
      "todos los servicios digitales prestados por COFA",
      "sistemas de análisis de riesgo crediticio, prevención de fraude y lavado de activos",
      "herramientas de soporte al cliente",
      "modelos predictivos o automatizados utilizados para evaluar operaciones",
      "sistemas provistos por terceros incorporados a nuestros servicios",
      "interacciones del usuario con chatbots o funcionalidades basadas en IA"
    ]
  },
  {
    content: "Principios rectores del uso de IA en COFA",
    paragraphs: [
      "El desarrollo y uso de IA en COFA se rige por los siguientes principios:"
    ],
    subItems: [
      {
        title: "Transparencia",
        text: "COFA informará a los usuarios cuando una herramienta o interacción utilice IA."
      },
      {
        title: "Supervisión humana",
        text: "Las decisiones que afecten el acceso al crédito no son completamente automatizadas.\nSiempre interviene personal especializado para validar o revisar los resultados."
      },
      {
        title: "Protección de datos personales",
        text: "Toda IA utilizada por COFA respeta la Ley 25.326 y normativa aplicable sobre privacidad y seguridad."
      },
      {
        title: "No discriminación",
        text: "COFA prohíbe sistemas que generen sesgos injustificados o discriminación directa o indirecta."
      },
      {
        title: "Seguridad y confidencialidad",
        text: "La IA empleada debe ser robusta y cumplir con las medidas de seguridad requeridas para evitar accesos indebidos o manipulaciones."
      },
      {
        title: "Ética y responsabilidad",
        text: "COFA aplica IA únicamente cuando aporta valor y sin generar afectación a los derechos de los usuarios."
      }
    ]
  },
  {
    content: "¿Cómo utiliza COFA la Inteligencia Artificial?",
    paragraphs: [
      "COFA puede emplear IA en:"
    ],
    subItems: [
      {
        title: "Análisis de riesgo y scoring crediticio",
        text: "Para analizar información proporcionada por el usuario y otras fuentes habilitadas legalmente, con el fin de evaluar solicitudes a nivel crediticio y de prevención de lavado de activos."
      },
      {
        title: "Prevención de fraude financiero y digital",
        text: "Sistemas que detectan patrones inusuales o potencialmente fraudulentos."
      },
      {
        title: "Soporte y atención al usuario",
        text: "Chatbots y herramientas automatizadas que ayudan a resolver consultas, siempre con la opción de atención humana."
      },
      {
        title: "Procesos internos",
        text: "Automatización de tareas operativas, análisis documental y procesos de calidad."
      }
    ],
    paragraphsBottom: [
      "En ningún caso la IA de COFA accede a datos sin autorización o fuera de la finalidad declarada."
    ]
  },
  {
    content: "Qué información nunca se utiliza con IA externa",
    paragraphs: [
      "COFA no comparte con proveedores externos de IA información que pueda identificar a los usuarios, ni utilizará IA no autorizada para procesar datos personales.",
      "En particular, nunca se envían:"
    ],
    bullets: [
      "DNI, CUIT/CUIL, teléfonos o direcciones",
      "datos financieros o crediticios (CBU, CVU, ingresos, recibos, saldos, historial de mora)",
      "credenciales, claves o información de seguridad",
      "datos de menores",
      "información biométrica o sensible",
      "información confidencial o comercial de COFA",
      "documentación regulatoria o legal reservada"
    ],
    paragraphsBottom: [
      "COFA solo utiliza IA externa en entornos seguros, controlados y compatibles con la normativa vigente."
    ]
  },
  {
    content: "Proveedores tecnológicos",
    paragraphs: [
      "La IA utilizada por COFA puede integrar tecnologías provistas por:"
    ],
    bullets: [
      "OpenAI",
      "Anthropic",
      "Google Cloud (Gemini)",
      "Perplexity",
      "Assembly AI"
    ],
    paragraphsBottom: [
      "entre otros proveedores que cumplan con:"
    ],
    bulletsBottom: [
      "estándares de privacidad y seguridad",
      "eliminación periódica de datos",
      "no entrenamiento con información de COFA sin consentimiento previo",
      "políticas claras de confidencialidad"
    ],
    paragraphsFinal: [
      "Cuando corresponda, COFA publicará la lista actualizada de proveedores aprobados."
    ]
  },
  {
    content: "Decisiones automatizadas y derechos del usuario",
    paragraphs: [
      "Los usuarios tienen derecho a:"
    ],
    subItems: [
      {
        title: "Saber cuándo interactúan con IA",
        text: "COFA informará de forma visible cuando un chatbot o sistema automático esté respondiendo."
      },
      {
        title: "Solicitar intervención humana",
        text: "Si una interacción automatizada no es satisfactoria, el usuario puede requerir asistencia humana."
      },
      {
        title: "Solicitar explicación",
        text: "En procesos donde intervenga IA, el usuario puede solicitar una explicación clara del funcionamiento general del modelo utilizado (sin revelar información sensible o confidencial)."
      },
      {
        title: "Impugnar decisiones",
        text: "Cualquier decisión automatizada relevante —en particular relacionada al otorgamiento de crédito— puede ser revisada por personal autorizado."
      }
    ]
  },
  {
    content: "Seguridad y gobernanza",
    paragraphs: [
      "COFA mantiene controles y auditorías continuas sobre los sistemas de IA, incluyendo:"
    ],
    bullets: [
      "registro interno de los sistemas utilizados",
      "validaciones periódicas de modelos",
      "controles de sesgos y equidad",
      "análisis de impacto",
      "supervisión humana en tareas críticas",
      "protocolos de ciberseguridad según las mejores prácticas del sector financiero"
    ]
  },
  {
    content: "Incidentes y reportes",
    paragraphs: [
      "Cualquier incidente relacionado con el uso de IA en la interacción con la plataforma de COFA, debe ser informado a COFA a través de los canales oficiales de soporte.",
      "COFA investigará cada caso conforme sus políticas de privacidad, seguridad y cumplimiento normativo."
    ]
  },
  {
    content: "Actualizaciones de esta Política",
    paragraphs: [
      "COFA podrá actualizar esta Política para adaptarse a:"
    ],
    bullets: [
      "cambios regulatorios del BCRA, UIF o AAIP",
      "nuevas tecnologías o proveedores",
      "mejores prácticas en seguridad y ética",
      "evolución del marco legal argentino o internacional"
    ],
    paragraphsBottom: [
      "Las actualizaciones serán publicadas en este misma sección de la página web."
    ]
  },
  {
    content: "Contacto",
    paragraphs: [
      "Para consultas sobre esta Política, los usuarios pueden comunicarse a:",
      "consultas@cofa.com.ar",
      "Última actualización: 24 de febrero de 2026"
    ]
  }
];

export const iaPoliciesFooter = (
  <span style={{ fontSize: "14px", marginTop: "4rem", marginBottom: "-4rem", display: "block" }}>
    Para más información, consulta nuestros{" "}
    <Link className="linkRedirect" to={"/terminos-y-condiciones/#top"}>
      Términos y condiciones
    </Link>{" "}
    y{" "}
    <Link className="linkRedirect" to={"/politicas-de-privacidad/#top"}>
      Políticas de privacidad
    </Link>
    .
  </span>
);
