export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'prof' | 'admin' | 'superadmin';
  [key: string]: any;
}

/** Indica qué almacenamiento definió el último login válido (tab). Evita usar un token viejo en local si la sesión actual está en session. */
const ACTIVE_AUTH_KEY = 'eduwanka_active_auth';
const ACCESS_TOKEN_KEY = 'eduwanka_access_token';
const USER_KEY = 'eduwanka_user';

/**
 * Borra credenciales en ambos almacenamientos. Debe llamarse al iniciar sesión
 * para no mezclar un usuario "Recordarme" (local) con un login reciente (sesión).
 */
export function clearAllAuthStorages() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_AUTH_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACTIVE_AUTH_KEY);
  } catch {
    // entorno sin window (tests aislados)
  }
}

/**
 * Debe llamarse justo después de guardar token/usuario en login.
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
 * Resuelve de qué almacenamiento leer token y usuario.
 * @returns 'local' | 'session' | null
 */
function getPreferredAuthStorage(): 'local' | 'session' | null {
  // Buscar en sessionStorage primero (mismo tab), luego localStorage (nuevo tab)
  const active = sessionStorage.getItem(ACTIVE_AUTH_KEY) ?? localStorage.getItem(ACTIVE_AUTH_KEY);
  const fromLocal = localStorage.getItem(ACCESS_TOKEN_KEY);
  const fromSession = sessionStorage.getItem(ACCESS_TOKEN_KEY);

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

export function getAccessToken(): string | null {
  const pref = getPreferredAuthStorage();
  if (pref === 'local') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  if (pref === 'session') {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
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
