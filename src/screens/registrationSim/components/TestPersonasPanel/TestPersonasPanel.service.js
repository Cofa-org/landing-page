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
    // Defense-in-depth: validate id shape + URL-encode before using in path.
    // Prevents path traversal and unexpected chars hitting the backend route.
    if (!id || !/^[A-Z0-9_]+$/.test(String(id).slice(0, 64))) return null;
    const r = await fetch(`${API_URL}/api/test/personas/${encodeURIComponent(id)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}