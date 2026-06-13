window.API_URL = 'http://127.0.0.1:8000/api/v1';

async function logoutAndRedirect(redirectTo = './login.html') {
  const token = sessionStorage.getItem('token');
  if (token) {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
  }
  sessionStorage.clear();
  window.location.href = redirectTo;
}
