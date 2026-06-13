// FRONTEND/js/admin_mesas.js

let empleado = null;
let sucursales = [];
let mesas = [];
let modoEdicion = false;

function authHeaders(json = false) {
  const token = sessionStorage.getItem('token');
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  if (json) return { 'Content-Type': 'application/json', 'Accept': 'application/json', ...base };
  return { 'Accept': 'application/json', ...base };
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

  document.getElementById('logoutBtn').addEventListener('click', () => {
    logoutAndRedirect();
  });

  document.getElementById('btnVolver').addEventListener('click', () => {
    window.location.href = './admin.html';
  });

  document.getElementById('formMesa').addEventListener('submit', onSubmitForm);
  document.getElementById('btnNuevo').addEventListener('click', resetFormulario);

  document.getElementById('filtroSucursal').addEventListener('change', renderMesas);

  cargarSucursales().then(() => {
    cargarMesas();
  });
});

async function cargarSucursales() {
  try {
    const res = await fetch(`${API_URL}/sucursales`, { headers: authHeaders() });
    if (!res.ok) {
      console.error('No se pudieron cargar las sucursales');
      return;
    }

    sucursales = await res.json();

    const selectForm = document.getElementById('id_sucursal');
    selectForm.innerHTML = '';
    sucursales.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id_sucursal;
      opt.textContent = s.nombre;
      selectForm.appendChild(opt);
    });

    const filtro = document.getElementById('filtroSucursal');
    filtro.innerHTML = '<option value="">Todas</option>';
    sucursales.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id_sucursal;
      opt.textContent = s.nombre;
      filtro.appendChild(opt);
    });

  } catch (err) {
    console.error('Error cargando sucursales:', err);
  }
}

async function cargarMesas() {
  try {
    const res = await fetch(`${API_URL}/mesas`, { headers: authHeaders() });
    if (!res.ok) {
      console.error('No se pudieron cargar las mesas');
      return;
    }

    mesas = await res.json();
    renderMesas();
  } catch (err) {
    console.error('Error cargando mesas:', err);
  }
}

function renderMesas() {
  const tbody = document.getElementById('tbodyMesas');
  tbody.innerHTML = '';

  const filtroId = document.getElementById('filtroSucursal').value;

  const lista = filtroId
    ? mesas.filter(m => String(m.id_sucursal) === String(filtroId))
    : mesas;

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6">No hay mesas registradas.</td></tr>';
    return;
  }

  lista.forEach(m => {
    const tr = document.createElement('tr');

    const sucursal = sucursales.find(s => s.id_sucursal === m.id_sucursal);
    const nombreSucursal = sucursal ? sucursal.nombre : `Sucursal #${m.id_sucursal}`;

    tr.innerHTML = `
      <td>${m.id_mesa}</td>
      <td>${nombreSucursal}</td>
      <td>${m.numero_mesa}</td>
      <td>${m.capacidad}</td>
      <td>${m.estado}</td>
      <td>
        <button class="btn-accion btn-edit">Editar</button>
        <button class="btn-accion" style="background:#c0392b;">Eliminar</button>
      </td>
    `;

    const [btnEdit, btnDel] = tr.querySelectorAll('.btn-accion');

    btnEdit.addEventListener('click', () => cargarEnFormulario(m));
    btnDel.addEventListener('click', () => eliminarMesa(m.id_mesa));

    tbody.appendChild(tr);
  });
}

function cargarEnFormulario(m) {
  modoEdicion = true;
  document.getElementById('formTitulo').textContent = 'Editar mesa';

  document.getElementById('mesaId').value = m.id_mesa;
  document.getElementById('id_sucursal').value = m.id_sucursal;
  document.getElementById('numero_mesa').value = m.numero_mesa;
  document.getElementById('capacidad').value = m.capacidad;
  document.getElementById('estado').value = m.estado;

  limpiarMensajeError();
}

function resetFormulario() {
  modoEdicion = false;
  document.getElementById('formTitulo').textContent = 'Crear mesa';
  document.getElementById('mesaId').value = '';
  document.getElementById('formMesa').reset();
  limpiarMensajeError();

  if (sucursales.length) {
    document.getElementById('id_sucursal').value = sucursales[0].id_sucursal;
  }
}

function limpiarMensajeError() {
  const msg = document.getElementById('mensajeError');
  msg.textContent = '';
}

async function onSubmitForm(e) {
  e.preventDefault();
  limpiarMensajeError();

  const id = document.getElementById('mesaId').value;
  const payload = {
    id_sucursal: Number(document.getElementById('id_sucursal').value),
    numero_mesa: Number(document.getElementById('numero_mesa').value),
    capacidad: Number(document.getElementById('capacidad').value),
    estado: document.getElementById('estado').value,
  };

  if (!payload.id_sucursal || !payload.numero_mesa || !payload.capacidad) {
    mostrarError('Todos los campos son obligatorios.');
    return;
  }

  const url = id
    ? `${API_URL}/mesas/${id}`
    : `${API_URL}/mesas`;

  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarError(data.message || 'Error al guardar la mesa');
      console.error('Errores:', data);
      return;
    }

    alert(id ? 'Mesa actualizada correctamente' : 'Mesa creada correctamente');

    await cargarMesas();
    resetFormulario();

  } catch (err) {
    console.error('Error guardando mesa:', err);
    mostrarError('Error al guardar la mesa');
  }
}

async function eliminarMesa(id) {
  if (!confirm('¿Seguro que deseas eliminar esta mesa?')) return;

  try {
    const res = await fetch(`${API_URL}/mesas/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'No se pudo eliminar la mesa');
      return;
    }

    alert('Mesa eliminada correctamente');
    await cargarMesas();

    const formId = document.getElementById('mesaId').value;
    if (formId && Number(formId) === id) {
      resetFormulario();
    }

  } catch (err) {
    console.error('Error eliminando mesa:', err);
    alert('Error al eliminar la mesa');
  }
}

function mostrarError(texto) {
  const msg = document.getElementById('mensajeError');
  msg.textContent = texto;
}
