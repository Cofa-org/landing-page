// Unit-test startup configuration. Never load the application's .env files.
export const SYNTHETIC_UNIT_ENV = {
  VITE_LANDING_BACKEND_URL: "https://unit-backend.invalid",
  VITE_LANDING_BACKEND_API_KEY: "unit-synthetic-api-key",
  VITE_LRS_URL: "https://unit-lrs.invalid",
  VITE_LRS_API_KEY: "unit-synthetic-lrs-key",
  VITE_TURNSTILE_SITE_KEY: "unit-synthetic-turnstile",
  VITE_THUMBMARKJS_API_KEY: "unit-synthetic-thumbmark",
  VITE_SISTEMA_FRANCES_ON: "false",
  VITE_DEV: "false",
  VITE_ENABLE_TEST_PERSONAS: "false",
};
