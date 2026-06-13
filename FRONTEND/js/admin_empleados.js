// FRONTEND/js/admin_empleados.js

let empleado = null;
let sucursales = [];
let roles = [];
let empleados = [];
let modoEdicion = false;
let empleadoSeleccionadoUsuario = null;
let usuarioActualEmpleado = null;

function authHeaders(json = false) {
  const token = sessionStorage.getItem('token');
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  if (json) return { 'Content-Type': 'application/json', 'Accept': 'application/json', ...base };
  return { 'Accept': 'application/json', ...base };
}

document.addEventListener('DOMContentLoaded', () => {
  empleado = JSON.parse(sessionStorage.getItem('empleado'));

  document.getElementById('btnCerrarModalUsuario').addEventListener('click', cerrarModalUsuario);
  document.getElementById('formUsuarioEmpleado').addEventListener('submit', onSubmitUsuarioEmpleado);
  document.getElementById('btnEliminarUsuario').addEventListener('click', onEliminarUsuarioEmpleado);

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

  document.getElementById('formEmpleado').addEventListener('submit', onSubmitForm);
  document.getElementById('btnNuevo').addEventListener('click', resetFormulario);

  document.getElementById('filtroSucursal').addEventListener('change', renderEmpleados);
  document.getElementById('filtroRol').addEventListener('change', renderEmpleados);

  Promise.all([
    cargarSucursales(),
    cargarRoles()
  ]).then(() => {
    cargarEmpleados();
  });
});

async function cargarSucursales() {
  try {
    const res = await fetch(`${API_URL}/sucursales`, { headers: authHeaders() });
    if (!res.ok) return console.error('No se pudieron cargar las sucursales');

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

async function cargarRoles() {
  try {
    const res = await fetch(`${API_URL}/roles`, { headers: authHeaders() });
    if (!res.ok) return console.error('No se pudieron cargar los roles');

    roles = await res.json();

    const selectForm = document.getElementById('id_rol');
    selectForm.innerHTML = '';
    roles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id_rol;
      opt.textContent = r.nombre_rol;
      selectForm.appendChild(opt);
    });

    const filtro = document.getElementById('filtroRol');
    filtro.innerHTML = '<option value="">Todos</option>';
    roles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id_rol;
      opt.textContent = r.nombre_rol;
      filtro.appendChild(opt);
    });

  } catch (err) {
    console.error('Error cargando roles:', err);
  }
}

async function cargarEmpleados() {
  try {
    const res = await fetch(`${API_URL}/empleados`, { headers: authHeaders() });
    if (!res.ok) return console.error('No se pudieron cargar los empleados');

    empleados = await res.json();
    renderEmpleados();
  } catch (err) {
    console.error('Error cargando empleados:', err);
  }
}

function renderEmpleados() {
  const tbody = document.getElementById('tbodyEmpleados');
  tbody.innerHTML = '';

  const filtroSuc = document.getElementById('filtroSucursal').value;
  const filtroRol = document.getElementById('filtroRol').value;

  let lista = [...empleados];

  if (filtroSuc) {
    lista = lista.filter(e => String(e.id_sucursal) === String(filtroSuc));
  }
  if (filtroRol) {
    lista = lista.filter(e => String(e.id_rol) === String(filtroRol));
  }

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="9">No hay empleados registrados.</td></tr>';
    return;
  }

  lista.forEach(emp => {
    const tr = document.createElement('tr');

    const suc = emp.sucursal ?? sucursales.find(s => s.id_sucursal === emp.id_sucursal);
    const rol = emp.rol ?? roles.find(r => r.id_rol === emp.id_rol);

    const nombreSucursal = suc ? suc.nombre : `Sucursal #${emp.id_sucursal}`;
    const nombreRol = rol ? rol.nombre_rol : `Rol #${emp.id_rol}`;

    tr.innerHTML = `
      <td>${emp.id_empleado}</td>
      <td>${emp.nombre} ${emp.apellido}</td>
      <td>${emp.dni}</td>
      <td>${emp.telefono ?? '-'}</td>
      <td>${emp.correo ?? '-'}</td>
      <td>${nombreSucursal}</td>
      <td>${nombreRol}</td>
      <td>$${Number(emp.salario ?? 0).toLocaleString()}</td>
      <td>
        <button class="btn-accion btn-edit">Editar</button>
        <button class="btn-accion btn-user" style="background:#8e44ad;">Usuario</button>
        <button class="btn-accion" style="background:#c0392b;">Eliminar</button>
      </td>
    `;

    const btnEdit = tr.querySelector('.btn-edit');
    const btnUser = tr.querySelector('.btn-user');
    const btnDel  = tr.querySelector('button[style*="c0392b"]');

    btnEdit.addEventListener('click', () => cargarEnFormulario(emp));
    btnDel.addEventListener('click', () => eliminarEmpleado(emp.id_empleado));
    btnUser.addEventListener('click', () => abrirModalUsuario(emp));

    tbody.appendChild(tr);
  });
}

function cargarEnFormulario(emp) {
  modoEdicion = true;
  document.getElementById('formTitulo').textContent = 'Editar empleado';

  document.getElementById('empleadoId').value = emp.id_empleado;
  document.getElementById('nombre').value = emp.nombre;
  document.getElementById('apellido').value = emp.apellido;
  document.getElementById('dni').value = emp.dni;
  document.getElementById('telefono').value = emp.telefono ?? '';
  document.getElementById('correo').value = emp.correo ?? '';
  document.getElementById('id_sucursal').value = emp.id_sucursal;
  document.getElementById('id_rol').value = emp.id_rol;
  document.getElementById('fecha_contratacion').value = emp.fecha_contratacion ?? '';
  document.getElementById('salario').value = emp.salario ?? 0;

  limpiarMensajeError();
}

function resetFormulario() {
  modoEdicion = false;
  document.getElementById('formTitulo').textContent = 'Crear empleado';
  document.getElementById('empleadoId').value = '';
  document.getElementById('formEmpleado').reset();
  limpiarMensajeError();

  if (sucursales.length) {
    document.getElementById('id_sucursal').value = sucursales[0].id_sucursal;
  }
  if (roles.length) {
    document.getElementById('id_rol').value = roles[0].id_rol;
  }
}

function limpiarMensajeError() {
  document.getElementById('mensajeError').textContent = '';
}

async function onSubmitForm(e) {
  e.preventDefault();
  limpiarMensajeError();

  const id = document.getElementById('empleadoId').value;

  const payload = {
    id_sucursal: Number(document.getElementById('id_sucursal').value),
    id_rol: Number(document.getElementById('id_rol').value),
    nombre: document.getElementById('nombre').value.trim(),
    apellido: document.getElementById('apellido').value.trim(),
    dni: document.getElementById('dni').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    correo: document.getElementById('correo').value.trim() || null,
    fecha_contratacion: document.getElementById('fecha_contratacion').value,
    salario: Number(document.getElementById('salario').value),
  };

  if (!payload.nombre || !payload.apellido || !payload.dni || !payload.fecha_contratacion) {
    mostrarError('Por favor, completa los campos obligatorios.');
    return;
  }

  const url = id ? `${API_URL}/empleados/${id}` : `${API_URL}/empleados`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.errors) {
        const firstKey = Object.keys(data.errors)[0];
        mostrarError(data.errors[firstKey].join(', '));
      } else {
        mostrarError(data.message || 'Error al guardar el empleado');
      }
      return;
    }

    alert(id ? 'Empleado actualizado correctamente' : 'Empleado creado correctamente');

    await cargarEmpleados();
    resetFormulario();

  } catch (err) {
    console.error('Error guardando empleado:', err);
    mostrarError('Error al guardar el empleado');
  }
}

async function eliminarEmpleado(id) {
  if (!confirm('¿Seguro que deseas eliminar este empleado?')) return;

  try {
    const res = await fetch(`${API_URL}/empleados/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'No se pudo eliminar el empleado');
      return;
    }

    alert('Empleado eliminado correctamente');
    await cargarEmpleados();

    const formId = document.getElementById('empleadoId').value;
    if (formId && Number(formId) === id) {
      resetFormulario();
    }

  } catch (err) {
    console.error('Error eliminando empleado:', err);
    alert('Error al eliminar el empleado');
  }
}

function mostrarError(texto) {
  document.getElementById('mensajeError').textContent = texto;
}

function abrirModalUsuario(emp) {
  empleadoSeleccionadoUsuario = emp;
  usuarioActualEmpleado = null;
  limpiarErrorUsuario();

  const modal = document.getElementById('modalUsuario');
  const titulo = document.getElementById('modalUsuarioTitulo');
  const info = document.getElementById('modalUsuarioInfo');
  const inputUsuario = document.getElementById('usuarioEmpleado');
  const inputPassword = document.getElementById('passwordEmpleado');
  const btnEliminar = document.getElementById('btnEliminarUsuario');

  titulo.textContent = `Usuario de ${emp.nombre} ${emp.apellido}`;
  info.textContent = `Configura el usuario de acceso al sistema para este empleado.`;

  inputUsuario.value = '';
  inputPassword.value = '';

  btnEliminar.style.display = 'none';

  fetch(`${API_URL}/empleados/${emp.id_empleado}/usuario`, { headers: authHeaders() })
    .then(res => res.json())
    .then(data => {
      if (data && data.usuario) {
        usuarioActualEmpleado = data;
        inputUsuario.value = data.usuario;
        info.textContent = `Este empleado ya tiene usuario asignado. Puedes cambiar el nombre de usuario o resetear la contraseña.`;
        btnEliminar.style.display = 'inline-block';
      }
    })
    .catch(err => {
      console.error('Error cargando usuario de empleado:', err);
    })
    .finally(() => {
      modal.classList.remove('oculto');
    });
}

function cerrarModalUsuario() {
  const modal = document.getElementById('modalUsuario');
  modal.classList.add('oculto');
  empleadoSeleccionadoUsuario = null;
  usuarioActualEmpleado = null;
  limpiarErrorUsuario();
}

function limpiarErrorUsuario() {
  document.getElementById('mensajeErrorUsuario').textContent = '';
}

function mostrarErrorUsuario(msg) {
  document.getElementById('mensajeErrorUsuario').textContent = msg;
}

async function onSubmitUsuarioEmpleado(e) {
  e.preventDefault();
  limpiarErrorUsuario();

  if (!empleadoSeleccionadoUsuario) {
    mostrarErrorUsuario('No hay empleado seleccionado.');
    return;
  }

  const empId = empleadoSeleccionadoUsuario.id_empleado;
  const usuario = document.getElementById('usuarioEmpleado').value.trim();
  const password = document.getElementById('passwordEmpleado').value.trim();

  if (!usuario) {
    mostrarErrorUsuario('El usuario es obligatorio.');
    return;
  }

  if (!usuarioActualEmpleado) {
    if (!password) {
      mostrarErrorUsuario('La contraseña es obligatoria al crear un usuario.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/empleados/${empId}/usuario`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors?.usuario) {
          mostrarErrorUsuario(data.errors.usuario.join(', '));
        } else if (data.errors?.password) {
          mostrarErrorUsuario(data.errors.password.join(', '));
        } else {
          mostrarErrorUsuario(data.message || 'Error al crear usuario');
        }
        return;
      }

      alert('Usuario creado correctamente');
      cerrarModalUsuario();

    } catch (err) {
      console.error('Error creando usuario:', err);
      mostrarErrorUsuario('Error al crear usuario');
    }

    return;
  }

  const payload = { usuario };
  if (password) {
    payload.password = password;
  }

  try {
    const res = await fetch(`${API_URL}/empleados/${empId}/usuario`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.errors?.usuario) {
        mostrarErrorUsuario(data.errors.usuario.join(', '));
      } else if (data.errors?.password) {
        mostrarErrorUsuario(data.errors.password.join(', '));
      } else {
        mostrarErrorUsuario(data.message || 'Error al actualizar usuario');
      }
      return;
    }

    alert('Usuario actualizado correctamente');
    cerrarModalUsuario();

  } catch (err) {
    console.error('Error actualizando usuario:', err);
    mostrarErrorUsuario('Error al actualizar usuario');
  }
}

async function onEliminarUsuarioEmpleado() {
  limpiarErrorUsuario();

  if (!empleadoSeleccionadoUsuario) {
    mostrarErrorUsuario('No hay empleado seleccionado.');
    return;
  }

  if (!usuarioActualEmpleado) {
    mostrarErrorUsuario('Este empleado no tiene usuario asignado.');
    return;
  }

  if (!confirm('¿Seguro que deseas eliminar el usuario de este empleado?')) return;

  const empId = empleadoSeleccionadoUsuario.id_empleado;

  try {
    const res = await fetch(`${API_URL}/empleados/${empId}/usuario`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarErrorUsuario(data.message || 'No se pudo eliminar el usuario');
      return;
    }

    alert('Usuario eliminado correctamente');
    cerrarModalUsuario();

  } catch (err) {
    console.error('Error eliminando usuario:', err);
    mostrarErrorUsuario('Error al eliminar el usuario');
  }
}
