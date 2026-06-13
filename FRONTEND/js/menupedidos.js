// FRONTEND/js/menupedidos.js

let pedidoActual = null;
let pedidoData = null;

function authHeaders(json = false) {
  const token = sessionStorage.getItem('token');
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  if (json) return { 'Content-Type': 'application/json', Accept: 'application/json', ...base };
  return { Accept: 'application/json', ...base };
}

document.addEventListener('DOMContentLoaded', async () => {
  pedidoActual = JSON.parse(sessionStorage.getItem('pedido_actual'));

  if (!pedidoActual) {
    alert('No hay pedido seleccionado');
    window.location.href = './mesas.html';
    return;
  }

  document.getElementById('tituloPedido').textContent =
    `Mesa ${pedidoActual.numero_mesa} - Pedido #${pedidoActual.id_pedido}`;

  document.getElementById('btnEnviar').addEventListener('click', enviarACocina);
  document.getElementById('btnCancelar').addEventListener('click', cancelarPedido);

  await cargarPedido();
});

async function cargarPedido() {
  try {
    const res = await fetch(`${API_URL}/pedidos/${pedidoActual.id_pedido}/detalle-completo`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      console.error('Error al cargar el pedido');
      return;
    }

    const pedido = await res.json();
    pedidoData = pedido;

    const lista = document.getElementById('listaPedido');
    lista.innerHTML = '';

    (pedido.detalles || []).forEach(det => {
      const li = document.createElement('li');
      li.classList.add('item-detalle');

      li.innerHTML = `
        <div class="item-detalle-info">
          <div class="item-detalle-nombre">${det.platillo.nombre}</div>
          <div class="item-detalle-cantidad">Cantidad: ${det.cantidad}</div>
          <div class="item-precio">$${det.subtotal}</div>
        </div>
        <div class="item-detalle-acciones">
          <button class="btn-mini btn-mas">+1</button>
          <button class="btn-mini btn-menos">-1</button>
          <button class="btn-mini rojo btn-eliminar">Eliminar</button>
        </div>
      `;

      const btnMas = li.querySelector('.btn-mas');
      const btnMenos = li.querySelector('.btn-menos');
      const btnDel = li.querySelector('.btn-eliminar');

      btnMas.addEventListener('click', () =>
        cambiarCantidad(det.id_detalle, det.cantidad + 1)
      );

      btnMenos.addEventListener('click', () => {
        if (det.cantidad - 1 <= 0) {
          eliminarDetalle(det.id_detalle);
        } else {
          cambiarCantidad(det.id_detalle, det.cantidad - 1);
        }
      });

      btnDel.addEventListener('click', () => eliminarDetalle(det.id_detalle));

      lista.appendChild(li);
    });

    document.getElementById('totalPedido').textContent = Number(pedido.total ?? 0).toLocaleString();
    actualizarBotonEnviar(pedido.estado);

  } catch (err) {
    console.error('Error cargando pedido', err);
  }
}

function actualizarBotonEnviar(estado) {
  const btn = document.getElementById('btnEnviar');

  if (estado === 'Pendiente') {
    btn.disabled = false;
    btn.textContent = 'Enviar a cocina';
  } else if (estado === 'En preparación') {
    btn.disabled = true;
    btn.textContent = 'En preparación...';
  } else if (estado === 'Listo') {
    btn.disabled = true;
    btn.textContent = 'Pedido listo';
  } else if (estado === 'Pagado') {
    btn.disabled = true;
    btn.textContent = 'Pedido pagado';
  } else {
    btn.disabled = true;
    btn.textContent = estado;
  }
}

async function cambiarCantidad(idDetalle, nuevaCantidad) {
  try {
    const res = await fetch(`${API_URL}/detalles/${idDetalle}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ cantidad: nuevaCantidad })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.message || 'No se pudo actualizar la cantidad');
      return;
    }
    await cargarPedido();
  } catch (err) {
    console.error('Error cambiando cantidad', err);
    alert('Error al cambiar la cantidad');
  }
}

async function eliminarDetalle(idDetalle) {
  try {
    const res = await fetch(`${API_URL}/detalles/${idDetalle}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.message || 'No se pudo eliminar el ítem');
      return;
    }
    await cargarPedido();
  } catch (err) {
    console.error('Error eliminando detalle', err);
    alert('Error al eliminar el ítem');
  }
}

async function enviarACocina() {
  try {
    const res = await fetch(`${API_URL}/pedidos/${pedidoActual.id_pedido}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ estado: 'En preparación' })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.message || 'No se pudo enviar el pedido a cocina');
      return;
    }

    alert('Pedido enviado a cocina.');
    await cargarPedido();

  } catch (err) {
    console.error('Error enviando a cocina', err);
    alert('Error al enviar el pedido a cocina');
  }
}

async function cancelarPedido() {
  if (!confirm('¿Seguro que deseas cancelar este pedido?')) return;

  try {
    const res = await fetch(`${API_URL}/pedidos/${pedidoActual.id_pedido}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || 'No se pudo cancelar el pedido');
      return;
    }

    sessionStorage.removeItem('pedido_actual');
    sessionStorage.removeItem('mesaSeleccionada');

    alert('Pedido cancelado y mesa liberada.');
    window.location.href = './mesas.html';

  } catch (err) {
    console.error('Error cancelando pedido', err);
    alert('Error al cancelar el pedido');
  }
}

function irMesas() {
  window.location.href = './mesas.html';
}
function irMenu() {
  window.location.href = './menu.html';
}
