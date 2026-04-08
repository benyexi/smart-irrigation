export const AUTH_STORAGE_KEY = 'auth_user';

interface StoredAuthUser {
  username: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  organization: string;
}

export const readStoredUser = (): StoredAuthUser | null => {
  const local = localStorage.getItem(AUTH_STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local) as StoredAuthUser;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (session) {
    try {
      return JSON.parse(session) as StoredAuthUser;
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return null;
};
