// FRONTEND/js/admin_menu.js

let empleado = null;
let categorias = [];
let platillos = [];
let modoEdicion = false;

function authHeaders(form = false) {
  const token = sessionStorage.getItem('token');
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  if (form) return { Accept: 'application/json', ...base };
  return { 'Content-Type': 'application/json', 'Accept': 'application/json', ...base };
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

  document.getElementById('formPlatillo').addEventListener('submit', onSubmitForm);
  document.getElementById('btnNuevo').addEventListener('click', resetFormulario);

  document.getElementById('imagen').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const img = document.getElementById('previewImg');
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        img.src = ev.target.result;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      img.src = '';
      img.style.display = 'none';
    }
  });

  cargarCategorias();
  cargarPlatillos();
});

async function cargarCategorias() {
  try {
    const res = await fetch(`${API_URL}/categorias`, { headers: authHeaders() });
    if (!res.ok) {
      console.error('No se pudieron cargar las categorías');
      return;
    }

    categorias = await res.json();
    const select = document.getElementById('id_categoria');
    select.innerHTML = '';

    categorias.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id_categoria;
      opt.textContent = cat.nombre_categoria;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error('Error cargando categorías:', err);
  }
}

async function cargarPlatillos() {
  try {
    const res = await fetch(`${API_URL}/menu`, { headers: authHeaders() });
    if (!res.ok) {
      console.error('No se pudieron cargar los platillos');
      return;
    }

    platillos = await res.json();
    renderPlatillos();
  } catch (err) {
    console.error('Error cargando platillos:', err);
  }
}

function renderPlatillos() {
  const tbody = document.getElementById('tbodyPlatillos');
  tbody.innerHTML = '';

  if (!platillos.length) {
    tbody.innerHTML = '<tr><td colspan="7">No hay platillos registrados.</td></tr>';
    return;
  }

  platillos.forEach(p => {
    const tr = document.createElement('tr');

    const categoria = categorias.find(c => c.id_categoria === p.id_categoria);
    const nombreCategoria = categoria ? categoria.nombre_categoria : p.id_categoria;

    let imagenSrc = '';
    if (p.imagen) {
      imagenSrc = p.imagen.startsWith('http')
        ? p.imagen
        : `http://127.0.0.1:8000/${p.imagen}`;
    }

    tr.innerHTML = `
      <td>${p.id_platillo}</td>
      <td>
        ${imagenSrc
          ? `<img src="${imagenSrc}" alt="${p.nombre}">`
          : '<span style="font-size:11px;color:#999;">Sin imagen</span>'
        }
      </td>
      <td>${p.nombre}</td>
      <td>${nombreCategoria}</td>
      <td>$${Number(p.precio).toLocaleString()}</td>
      <td>${p.tiempo_preparacion ?? '-'}</td>
      <td>
        <button class="btn-accion btn-edit">Editar</button>
        <button class="btn-accion" style="background:#c0392b;" >Eliminar</button>
      </td>
    `;

    const [btnEdit, btnDel] = tr.querySelectorAll('.btn-accion');

    btnEdit.addEventListener('click', () => cargarEnFormulario(p));
    btnDel.addEventListener('click', () => eliminarPlatillo(p.id_platillo));

    tbody.appendChild(tr);
  });
}

function cargarEnFormulario(p) {
  modoEdicion = true;
  document.getElementById('formTitulo').textContent = 'Editar platillo';

  document.getElementById('platilloId').value = p.id_platillo;
  document.getElementById('nombre').value = p.nombre;
  document.getElementById('descripcion').value = p.descripcion ?? '';
  document.getElementById('precio').value = p.precio;
  document.getElementById('tiempo_preparacion').value = p.tiempo_preparacion ?? '';

  const selectCat = document.getElementById('id_categoria');
  selectCat.value = p.id_categoria;

  const img = document.getElementById('previewImg');
  if (p.imagen) {
    let imagenSrc = '';
    if (p.imagen.startsWith('http')) {
      imagenSrc = p.imagen;
    } else {
      imagenSrc = `http://127.0.0.1:8000/${p.imagen}`;
    }
    img.src = imagenSrc;
    img.style.display = 'block';
  } else {
    img.src = '';
    img.style.display = 'none';
  }

  document.getElementById('imagen').value = '';
}

function resetFormulario() {
  modoEdicion = false;
  document.getElementById('formTitulo').textContent = 'Crear platillo';
  document.getElementById('platilloId').value = '';
  document.getElementById('formPlatillo').reset();
  const img = document.getElementById('previewImg');
  img.src = '';
  img.style.display = 'none';
}

async function onSubmitForm(e) {
  e.preventDefault();

  const id = document.getElementById('platilloId').value;
  const formEl = document.getElementById('formPlatillo');
  const formData = new FormData(formEl);

  const url = id ? `${API_URL}/menu/${id}` : `${API_URL}/menu`;
  const method = id ? 'POST' : 'POST';

  if (id) {
    formData.append('_method', 'PUT');
  }

  try {
    const res = await fetch(url, {
      method,
      headers: authHeaders(true),
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Error al guardar el platillo');
      console.error('Errores:', data);
      return;
    }

    alert(id ? 'Platillo actualizado correctamente' : 'Platillo creado correctamente');

    await cargarPlatillos();
    resetFormulario();

  } catch (err) {
    console.error('Error guardando platillo:', err);
    alert('Error al guardar el platillo');
  }
}

async function eliminarPlatillo(id) {
  if (!confirm('¿Seguro que deseas eliminar este platillo?')) return;

  try {
    const res = await fetch(`${API_URL}/menu/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'No se pudo eliminar el platillo');
      return;
    }

    alert('Platillo eliminado correctamente');
    await cargarPlatillos();

    const formId = document.getElementById('platilloId').value;
    if (formId && Number(formId) === id) {
      resetFormulario();
    }

  } catch (err) {
    console.error('Error eliminando platillo:', err);
    alert('Error al eliminar el platillo');
  }
}
