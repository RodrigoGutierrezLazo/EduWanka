export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'prof' | 'admin' | 'superadmin';
  [key: string]: any;
}

/**
 * Indica qué almacenamiento definió el último login válido (tab). Evita usar
 * un perfil cacheado viejo en local si la sesión actual quedó en session.
 *
 * Nota de seguridad: la credencial real ya no vive aquí. La autenticación la
 * resguarda el backend mediante una cookie de sesión httpOnly (Sanctum SPA),
 * inaccesible para JavaScript y por tanto inmune a robo vía XSS. Lo que se
 * cachea en este módulo es solo una copia no sensible del perfil del usuario
 * (id/nombre/email/rol) para que la UI pueda renderizar de inmediato y decidir
 * a qué ruta redirigir; el servidor sigue siendo la única fuente de verdad
 * (cualquier 401 limpia este caché y redirige a /login).
 */
const ACTIVE_AUTH_KEY = 'eduwanka_active_auth';
const USER_KEY = 'eduwanka_user';

/**
 * Borra el perfil cacheado en ambos almacenamientos. Debe llamarse al iniciar
 * sesión para no mezclar un usuario "Recordarme" (local) con un login reciente
 * (sesión), y al recibir un 401 inesperado del servidor.
 */
export function clearAllAuthStorages() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_AUTH_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACTIVE_AUTH_KEY);
  } catch {
    // entorno sin window (tests aislados)
  }
}

/**
 * Debe llamarse justo después de guardar el perfil del usuario en login.
 * @param source
 */
export function setActiveAuthSource(source: 'local' | 'session') {
  try {
    if (source === 'local' || source === 'session') {
      sessionStorage.setItem(ACTIVE_AUTH_KEY, source);
      localStorage.setItem(ACTIVE_AUTH_KEY, source);
    }
  } catch {
    // ignore
  }
}

/**
 * Resuelve de qué almacenamiento leer el perfil cacheado del usuario.
 * @returns 'local' | 'session' | null
 */
function getPreferredAuthStorage(): 'local' | 'session' | null {
  // Buscar en sessionStorage primero (mismo tab), luego localStorage (nuevo tab)
  const active = sessionStorage.getItem(ACTIVE_AUTH_KEY) ?? localStorage.getItem(ACTIVE_AUTH_KEY);
  const fromLocal = localStorage.getItem(USER_KEY);
  const fromSession = sessionStorage.getItem(USER_KEY);

  if (active === 'local') {
    if (fromLocal) return 'local';
    if (fromSession) return 'session';
    return null;
  }
  if (active === 'session') {
    // En nuevo tab no habrá sessionStorage, fallback a localStorage
    if (fromSession) return 'session';
    if (fromLocal) return 'local';
    return null;
  }

  // Sin bandera (sesiones antiguas): preferir lo que exista
  if (fromLocal && fromSession) {
    return 'session';
  }
  if (fromLocal) return 'local';
  if (fromSession) return 'session';
  return null;
}

/**
 * Heurística optimista de UI: refleja si hay un perfil cacheado de un login
 * previo. NO es el mecanismo de seguridad (la cookie httpOnly de sesión lo es)
 * — solo evita parpadeos de "no autenticado" mientras el navegador ya cuenta
 * con una sesión válida. El servidor corrige cualquier estado desincronizado
 * devolviendo 401, lo que dispara `clearAllAuthStorages` y la redirección.
 */
export function isAuthenticated(): boolean {
  return Boolean(getCurrentUser());
}

export function getCurrentUserRole(): 'student' | 'prof' | 'admin' | 'superadmin' | null {
  try {
    return getCurrentUser()?.role ?? null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  try {
    const pref = getPreferredAuthStorage();
    let rawUser;
    if (pref === 'local') {
      rawUser = localStorage.getItem(USER_KEY);
    } else if (pref === 'session') {
      rawUser = sessionStorage.getItem(USER_KEY);
    } else {
      rawUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    }
    
    if (!rawUser) return null;
    
    const parsedUser = JSON.parse(rawUser);
    if (typeof parsedUser !== 'object' || parsedUser === null) {
      return null;
    }

    return parsedUser as User;
  } catch {
    return null;
  }
}
