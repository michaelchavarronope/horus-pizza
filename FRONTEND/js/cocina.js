// FRONTEND/js/cocina.js

let empleado = null;

function authHeaders(json = false) {
  const token = sessionStorage.getItem('token');
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  if (json) return { 'Content-Type': 'application/json', Accept: 'application/json', ...base };
  return { Accept: 'application/json', ...base };
}

document.addEventListener('DOMContentLoaded', () => {
  empleado = JSON.parse(sessionStorage.getItem('empleado'));

  if (!empleado) {
    window.location.href = './login.html';
    return;
  }

  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  const userRoleEl = document.querySelector('.user-role');
  if (userNameEl) {
    userNameEl.textContent = `${empleado.nombre ?? ''} ${empleado.apellido ?? ''}`.trim() || 'Cocinero';
  }
  if (userAvatarEl) {
    const inicial = (empleado.nombre?.[0] || empleado.usuario?.[0] || 'C').toUpperCase();
    userAvatarEl.textContent = inicial;
  }
  if (userRoleEl) {
    userRoleEl.textContent = empleado.nombre_rol || 'Cocina';
  }

  const rol = empleado.nombre_rol?.toLowerCase();
  if (rol !== 'cocinero') {
    alert('No tienes permiso para ver esta pantalla.');
    window.location.href = './login.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    logoutAndRedirect();
  });

  cargarPedidosCocina();
  setInterval(cargarPedidosCocina, 10000);
});

async function cargarPedidosCocina() {
  try {
    const res = await fetch(`${API_URL}/pedidos-cocina`, { headers: authHeaders() });
    if (!res.ok) {
      console.error('No se pudieron cargar los pedidos de cocina');
      return;
    }

    const pedidos = await res.json();
    renderPedidos(pedidos);
  } catch (err) {
    console.error('Error cargando pedidos de cocina:', err);
  }
}

function renderPedidos(pedidos) {
  const cont = document.getElementById('listaPedidos');
  cont.innerHTML = '';

  if (!pedidos.length) {
    cont.innerHTML = '<p>No hay pedidos pendientes</p>';
    return;
  }

  pedidos.forEach(p => {
    const card = document.createElement('article');
    card.classList.add('pedido-card');

    const estadoClase =
      p.estado === 'Pendiente' ? 'estado-pendiente' : 'estado-preparacion';

    const fecha = p.fecha_pedido ?? '';

    card.innerHTML = `
      <div class="pedido-header">
        <div class="pedido-mesa">Mesa ${p.mesa?.numero_mesa ?? p.id_mesa}</div>
        <span class="pedido-estado ${estadoClase}">
          ${p.estado}
        </span>
      </div>

      <div class="pedido-info">
        <div>Mesero: ${p.empleado?.nombre ?? ''} ${p.empleado?.apellido ?? ''}</div>
        <div>Hora: ${fecha}</div>
      </div>

      <ul class="pedido-items">
        ${ (p.detalles || []).map(det => `
          <li>
            <span>${det.cantidad} x ${det.platillo?.nombre ?? 'Producto ' + det.id_platillo}</span>
            <span>$${Number(det.subtotal).toLocaleString()}</span>
          </li>
        `).join('') }
      </ul>

      <div class="pedido-actions">
        ${p.estado === 'Pendiente' ? `
          <button class="btn-action btn-tomar">Tomar pedido</button>
        ` : `
          <button class="btn-action btn-tomar" disabled>En preparación</button>
        `}
        <button class="btn-action btn-listo">Marcar listo</button>
      </div>
    `;

    const btnTomar = card.querySelector('.btn-tomar');
    const btnListo = card.querySelector('.btn-listo');

    if (btnTomar && !btnTomar.disabled) {
      btnTomar.addEventListener('click', () => actualizarEstadoPedido(p.id_pedido, 'En preparación'));
    }

    btnListo.addEventListener('click', () => actualizarEstadoPedido(p.id_pedido, 'Listo'));

    cont.appendChild(card);
  });
}

async function actualizarEstadoPedido(idPedido, nuevoEstado) {
  try {
    const res = await fetch(`${API_URL}/pedidos/${idPedido}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.message || 'No se pudo actualizar el estado del pedido');
      return;
    }

    cargarPedidosCocina();
  } catch (err) {
    console.error('Error actualizando estado del pedido:', err);
    alert('Error al cambiar estado del pedido');
  }
}
