// FRONTEND/js/admin.js

let empleado = null;

function authHeaders() {
  const token = sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

document.addEventListener("DOMContentLoaded", () => {
  empleado = JSON.parse(sessionStorage.getItem("empleado"));

  if (!empleado) {
    window.location.href = "./login.html";
    return;
  }

  const rol = empleado.nombre_rol?.toLowerCase();
  if (rol !== "administrador") {
    alert("No tienes permiso para ver esta pantalla.");
    window.location.href = "./login.html";
    return;
  }

  const nombreEl = document.getElementById("adminNombre");
  if (nombreEl) {
    nombreEl.textContent = `${empleado.nombre} ${empleado.apellido} (${empleado.nombre_rol})`;
  }

  document.getElementById("navResumen")?.addEventListener("click", () => {});
  document.getElementById("navReportes")?.addEventListener("click", () => {
    window.location.href = "./admin_reportes.html";
  });
  document.getElementById("navMesas")?.addEventListener("click", () => {
    window.location.href = "./admin_mesas.html";
  });
  document.getElementById("navMenu")?.addEventListener("click", () => {
    window.location.href = "./admin_menu.html";
  });
  document.getElementById("navCategorias")?.addEventListener("click", () => {
    window.location.href = "./admin_categorias.html";
  });
  document.getElementById("navEmpleados")?.addEventListener("click", () => {
    window.location.href = "./admin_empleados.html";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    logoutAndRedirect();
  });

  document.getElementById("btnVerReportes")?.addEventListener("click", () => {
    window.location.href = "./admin_reportes.html";
  });
  document.getElementById("btnVerCocina")?.addEventListener("click", () => {
    window.location.href = "./cocina.html";
  });
  document.getElementById("btnVerCaja")?.addEventListener("click", () => {
    window.location.href = "./caja.html";
  });
  document.getElementById("btnEstadoMesas")?.addEventListener("click", () => {
    window.location.href = "./admin_mesas.html";
  });

  cargarResumenAdmin();
  setInterval(cargarResumenAdmin, 30000);
});

async function cargarResumenAdmin() {
  try {
    const res = await fetch(`${API_URL}/admin/resumen`, { headers: { ...authHeaders() } });
    if (!res.ok) {
      console.error("Error al obtener resumen admin");
      return;
    }

    const data = await res.json();
    renderResumen(data);

  } catch (error) {
    console.error("Error cargando resumen admin:", error);
  }
}

function renderResumen(data) {
  const ventasDia = Number(data.ventas_dia ?? 0);
  const ventasAyer = Number(data.ventas_ayer ?? 0);
  let variacion = data.ventas_variacion;

  if (variacion === undefined || variacion === null) {
    if (ventasAyer > 0) {
      variacion = ((ventasDia - ventasAyer) / ventasAyer) * 100;
    } else {
      variacion = 0;
    }
  }

  const cardVentas = document.getElementById("cardVentasDia");
  if (cardVentas) {
    cardVentas.textContent = "$" + ventasDia.toLocaleString();
  }

  const comparacion = document.getElementById("cardVentasComparacion");
  if (comparacion) {
    if (ventasAyer === 0 && ventasDia > 0) {
      comparacion.textContent = "Primer día con ventas";
      comparacion.style.color = "#16a34a";
    } else if (ventasAyer === 0 && ventasDia === 0) {
      comparacion.textContent = "Sin datos";
      comparacion.style.color = "#6b7280";
    } else {
      const signo = variacion >= 0 ? "+" : "";
      comparacion.textContent = `${signo}${variacion.toFixed(1)}% vs ayer`;
      comparacion.style.color = variacion >= 0 ? "#16a34a" : "#dc2626";
    }
  }

  const facturasDia = Number(data.facturas_dia ?? 0);
  const cardFacturas = document.getElementById("cardFacturasDia");
  if (cardFacturas) {
    cardFacturas.textContent = facturasDia.toString();
  }

  const pedidosActivos = Number(data.pedidos_activos ?? 0);
  const cardPedidos = document.getElementById("cardPedidosDia");
  if (cardPedidos) {
    cardPedidos.textContent = pedidosActivos.toString();
  }

  const ocupadas = Number(data.mesas_ocupadas ?? 0);
  const libres = Number(data.mesas_disponibles ?? 0);
  const reservadas = Number(data.mesas_reservadas ?? 0);

  const cardOcupadas = document.getElementById("cardMesasOcupadas");
  if (cardOcupadas) {
    cardOcupadas.textContent = ocupadas.toString();
  }

  const cardLibres = document.getElementById("cardMesasDisponibles");
  if (cardLibres) {
    cardLibres.textContent = libres.toString();
  }

  const cardReservadas = document.getElementById("cardMesasReservadas");
  if (cardReservadas) {
    cardReservadas.textContent = reservadas.toString();
  }

  const resumenMesas = document.getElementById("cardMesasResumen");
  if (resumenMesas) {
    resumenMesas.textContent =
      `${ocupadas} ocupadas • ${libres} libres • ${reservadas} reservadas`;
  }
}
