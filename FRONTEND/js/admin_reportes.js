// FRONTEND/js/admin_reportes.js

let empleado = null;

function authHeaders() {
  const token = sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

document.addEventListener('DOMContentLoaded', () => {
  empleado = JSON.parse(sessionStorage.getItem('empleado'));

  if (!empleado) {
    window.location.href = './login.html';
    return;
  }

  const rol = empleado.nombre_rol?.toLowerCase();
  if (rol !== 'administrador') {
    alert('No tienes permiso para ver esta pantalla.');
    window.location.href = './login.html';
    return;
  }

  const bienvenida = document.getElementById('adminBienvenida');
  if (bienvenida) {
    bienvenida.textContent = `Bienvenido, ${empleado.nombre} ${empleado.apellido}`;
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    logoutAndRedirect();
  });

  document.getElementById('navResumen').addEventListener('click', () => {
    window.location.href = './admin.html';
  });
  document.getElementById('navReportes').addEventListener('click', () => {});
  document.getElementById('navMesas').addEventListener('click', () => {
    window.location.href = './admin_mesas.html';
  });
  document.getElementById('navMenu').addEventListener('click', () => {
    window.location.href = './admin_menu.html';
  });
  document.getElementById('navEmpleados').addEventListener('click', () => {
    window.location.href = './admin_empleados.html';
  });
  document.getElementById('navCategorias').addEventListener('click', () => {
    window.location.href = './admin_categorias.html';
  });

  cargarVentasDia();
  setInterval(cargarVentasDia, 30000);
});

async function cargarVentasDia() {
  try {
    const res = await fetch(`${API_URL}/admin/resumen`, { headers: { ...authHeaders() } });
    if (!res.ok) {
      console.error('No se pudo obtener el resumen de admin');
      return;
    }

    const data = await res.json();
    renderVentasDia(data);
  } catch (err) {
    console.error('Error cargando ventas del día:', err);
  }
}

function renderVentasDia(data) {
  const totalHoy = Number(data.ventas_dia ?? 0);
  const ventasEl = document.getElementById('ventasDiaTotal');
  if (ventasEl) {
    ventasEl.textContent = '$' + totalHoy.toLocaleString();
  }

  const facturasHoy = data.facturas_hoy || [];

  const cantidadHoy = data.facturas_dia ?? facturasHoy.length;
  const facturasEl = document.getElementById('facturasDiaTotal');
  if (facturasEl) {
    facturasEl.textContent = Number(cantidadHoy).toString();
  }

  const tbody = document.getElementById('tbodyFacturas');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!facturasHoy.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay facturas emitidas hoy.</td></tr>';
    return;
  }

  facturasHoy.forEach(f => {
    const tr = document.createElement('tr');

    const fecha = f.fecha_emision ?? '';
    const mesaTexto = f.pedido?.mesa
      ? `Mesa ${f.pedido.mesa.numero_mesa}`
      : (f.pedido ? `Mesa #${f.pedido.id_mesa}` : '-');

    const total = Number(f.total ?? 0);

    tr.innerHTML = `
      <td>${f.numero_factura}</td>
      <td>${fecha}</td>
      <td>${mesaTexto}</td>
      <td>${f.metodo_pago}</td>
      <td>$${total.toLocaleString()}</td>
    `;

    tbody.appendChild(tr);
  });
}
