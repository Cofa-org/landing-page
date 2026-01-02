const VITE_COFA_AUTH_URL =
  import.meta.env.VITE_COFA_AUTH_URL || "";

const VITE_COFA_AUTH_API_KEY =
  import.meta.env.VITE_COFA_AUTH_API_KEY || "";

const VITE_COFA_AUTH_EMAIL = import.meta.env.COFA_AUTH_EMAIL || "";
const VITE_COFA_AUTH_PASS = import.meta.env.COFA_AUTH_PASS || "";

const VITE_URL_LOCAL = import.meta.env.VITE_URL_LOCAL;

const VITE_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://qofkplavgmamstbvzluw.supabase.co";
const VITE_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZmtwbGF2Z21hbXN0YnZ6bHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA4MTQ4MjksImV4cCI6MjAyNjM5MDgyOX0.jWhINTCMNJem7q5v_Ot-Dnr8hRnbP92Ns5ljvkXWzyA";

export {
  VITE_COFA_AUTH_URL,
  VITE_COFA_AUTH_API_KEY,
  VITE_URL_LOCAL,
  VITE_COFA_AUTH_EMAIL,
  VITE_COFA_AUTH_PASS,
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
};
