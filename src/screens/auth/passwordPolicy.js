export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export const PASSWORD_HELPER_TEXT =
  "Entre 8 y 64 caracteres, con al menos un número y un símbolo. Podés usar espacios.";

const NUMBER_REGEX = /\p{N}/u;
const SYMBOL_REGEX = /[\p{P}\p{S}]/u;

/**
 * Misma regla que el back (password.policy.js). Cuenta code points, así un
 * emoji vale 1. Los espacios no cuentan como número ni como símbolo.
 * Devuelve "" si la contraseña cumple, o el mensaje a mostrar.
 */
export const getPasswordPolicyError = (password) => {
  const length = Array.from(password).length;
  if (length < PASSWORD_MIN_LENGTH) {
    return "La contraseña tiene que tener al menos 8 caracteres.";
  }
  if (length > PASSWORD_MAX_LENGTH) {
    return "La contraseña no puede superar los 64 caracteres.";
  }
  if (!NUMBER_REGEX.test(password) || !SYMBOL_REGEX.test(password)) {
    return "La contraseña tiene que tener al menos un número y un símbolo.";
  }
  return "";
};

export const isPasswordPolicyValid = (password) => getPasswordPolicyError(password) === "";
