// Mensajes user-facing para el flujo de captura de cámara (getUserMedia).
// Espejo de las constantes CAMERA_* definidas en
// landing-page-backend/core/constants/error.constants.js — la landing page
// corre en el navegador y no comparte módulo con el backend, por lo que se
// mantienen duplicadas en frontend. Si el wording cambia, hay que actualizar
// ambos archivos.
export const ERROR_MESSAGE = Object.freeze({
  CAMERA_PERMISSION_DENIED:
    "Necesitamos acceso a tu cámara para sacar las fotos. Sin este permiso no podemos continuar",
  CAMERA_NOT_AVAILABLE: "No encontramos una cámara disponible en tu dispositivo",
  CAMERA_INSUFFICIENT_RESOLUTION:
    "La cámara no tiene suficiente resolución. Probá con otro dispositivo o contactanos",
  CAMERA_BLURRY_PHOTO: "La foto salió borrosa. Mantené firme el celular y volvé a sacarla",
  CAMERA_HTTPS_REQUIRED: "Necesitamos una conexión segura para acceder a la cámara",
  CAMERA_IN_USE: "La cámara está siendo usada por otra aplicación. Cerrala e intentá de nuevo",
});

export const ERROR_CAUSE = Object.freeze({
  CAMERA_PERMISSION_DENIED: "CAMERA_PERMISSION_DENIED",
  CAMERA_NOT_AVAILABLE: "CAMERA_NOT_AVAILABLE",
  CAMERA_INSUFFICIENT_RESOLUTION: "CAMERA_INSUFFICIENT_RESOLUTION",
  CAMERA_BLURRY_PHOTO: "CAMERA_BLURRY_PHOTO",
  CAMERA_HTTPS_REQUIRED: "CAMERA_HTTPS_REQUIRED",
  CAMERA_IN_USE: "CAMERA_IN_USE",
});
