// Closed browser-camera guidance; backend DNI causes have their own protocol map.
export const ERROR_MESSAGE = Object.freeze({
  CAMERA_PERMISSION_DENIED:
    "Habilitá el permiso de cámara en tu navegador y reintentá. También podés usar otro celular o contactar a un asesor.",
  CAMERA_NOT_AVAILABLE: "No encontramos una cámara disponible. Reintentá con un navegador compatible en tu celular, otro celular o un asesor.",
  CAMERA_INSUFFICIENT_RESOLUTION:
    "No pudimos iniciar la cámara con esta configuración. Reintentá con otro celular o contactá a un asesor.",
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
