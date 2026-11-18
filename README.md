# Horus Pizza POS

> **Versión beta.** Este repositorio muestra el estado actual del sistema y puede tener cambios importantes antes de la versión estable. Para implementarlo en tu negocio, solicitar una demostración o recibir soporte, escríbeme a **[maicolestivenchavarronope3@gmail.com](mailto:maicolestivenchavarronope3@gmail.com)**.

**Sistema punto de venta (POS) para pizzerías y restaurantes.** Organiza el servicio de principio a fin: el mesero toma el pedido en la mesa, la cocina lo recibe en su pantalla, la caja factura y cobra, y el administrador controla el menú, el personal y las ventas del día.

## Funciones

| Módulo | Qué permite |
|---|---|
| **Mesas** | Ver el estado de cada mesa y abrir o retomar su pedido activo. |
| **Toma de pedidos** | Menú con imágenes por categoría para agregar, editar o quitar productos del pedido. |
| **Cocina** | Pantalla con los pedidos pendientes y su estado (pendiente / listo). |
| **Caja** | Pedidos listos para cobrar, registro del pago con su método y generación de la factura. |
| **Administración** | Gestión de platillos, categorías, mesas, empleados y sus usuarios de acceso. |
| **Reportes** | Ventas del día, actualizadas automáticamente. |

**Acceso por roles:** cada usuario entra a su propia pantalla según su rol (mesero, cocinero, cajero o administrador), y las funciones de administración están protegidas por rol.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Backend | API REST en Laravel 12 (PHP 8.2) con autenticación por token |
| Base de datos | MySQL |
| Frontend | HTML, CSS y JavaScript |

## Estructura

```
BACKEND/   API en Laravel (controladores, modelos, rutas y middleware de roles)
FRONTEND/  Pantallas del sistema: login, mesas, pedidos, cocina, caja y administración
```

## Estado del proyecto

Beta funcional en desarrollo activo: las funciones principales están operativas y el sistema sigue en pruebas y mejoras.

## Implementación y soporte

¿Te interesa usar Horus Pizza POS en tu negocio? Escríbeme a **[maicolestivenchavarronope3@gmail.com](mailto:maicolestivenchavarronope3@gmail.com)** para:

- Instalación y configuración en tu local.
- Adaptación del menú, las mesas y los roles de tu equipo.
- Soporte técnico.
- Acceso a la versión estable cuando esté disponible.

## Licencia

El código de este repositorio se distribuye bajo la licencia GPL-3.0 (ver [`BACKEND/LICENSE`](BACKEND/LICENSE)). Los servicios de implementación, personalización y soporte se ofrecen por separado.
