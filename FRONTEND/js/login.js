document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value.trim();
  const mensaje = document.getElementById('mensaje');

  if (!usuario || !password) {
    mensaje.textContent = 'Por favor, completa todos los campos.';
    mensaje.style.color = 'red';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await response.json();

    if (response.ok && data.empleado) {
      mensaje.textContent = data.message || 'Inicio de sesión exitoso.';
      mensaje.style.color = 'green';

      // Guardar en sessionStorage (token por sesión/navegador)
      sessionStorage.setItem('empleado', JSON.stringify(data.empleado));
      if (data.token) {
        sessionStorage.setItem('token', data.token);
      }

      const rol = data.empleado.nombre_rol?.toLowerCase();

      if (rol === 'mesero') {
        window.location.href = './mesas.html';
      } else if (rol === 'cocinero') {
        window.location.href = './cocina.html';
      } else if (rol === 'cajero') {
        window.location.href = './caja.html';
      } else if (rol === 'administrador') {
        window.location.href = './admin.html';
      } else {
        mensaje.textContent = 'Rol desconocido. Contacta al administrador.';
        mensaje.style.color = 'red';
      }
    } else {
      mensaje.textContent = data.message || 'Credenciales incorrectas.';
      mensaje.style.color = 'red';
    }
  } catch (error) {
    mensaje.textContent = 'Error al conectar con el servidor.';
    mensaje.style.color = 'red';
    console.error('Error:', error);
  }
});
