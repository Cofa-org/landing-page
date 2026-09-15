const API_URL = import.meta.env.VITE_LANDING_BACKEND_URL;

export async function fetchTestPersonas() {
  try {
    const r = await fetch(`${API_URL}/api/test/personas`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.personas || [];
  } catch {
    return [];
  }
}

export async function fetchTestPersonaById(id) {
  try {
    const r = await fetch(`${API_URL}/api/test/personas/${id}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}