import { api, saveSession, clearSession, getCurrentUser } from './api.js';

export function checkAuthGuard(requireAdmin = false) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/frontend/login.html';
    return false;
  }
  if (requireAdmin && user.role !== 'admin') {
    window.location.href = '/frontend/browse.html';
    return false;
  }
  return true;
}

export async function handleLogin(email, password, redirectUrl = '/frontend/browse.html') {
  try {
    const res = await api.login({ email, password });
    if (res.success) {
      saveSession(res.token, res.user);
      window.location.href = redirectUrl;
    }
    return res;
  } catch (err) {
    alert(err.message || 'Login failed');
    throw err;
  }
}

export function handleLogout() {
  clearSession();
  window.location.href = '/frontend/login.html';
}
