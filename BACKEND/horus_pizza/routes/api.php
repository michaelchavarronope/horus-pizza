<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\Api\MesaController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\PedidoController;
use App\Http\Controllers\Api\DetallePedidoController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\FacturaController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\SucursalController;
use App\Http\Controllers\Api\EmpleadoController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\UsuarioEmpleadoController;

Route::prefix('v1')->group(function () {

    // Pública - máximo 5 intentos por minuto para proteger contra fuerza bruta
    Route::middleware('throttle:5,1')->post('/login', [LoginController::class, 'login']);

    // Rutas para todos los roles autenticados
    Route::middleware('api.token')->group(function () {

        Route::post('/logout', [LoginController::class, 'logout']);

        // Lectura de mesas y menú (meseros, cajeros, cocineros y admin)
        Route::get('/mesas', [MesaController::class, 'index']);
        Route::get('/mesas/{id_mesa}/pedido-activo', [PedidoController::class, 'pedidoActivoPorMesa']);

        Route::get('/menu', [MenuController::class, 'index']);
        Route::get('/menu/{id}', [MenuController::class, 'show']);

        Route::get('/categorias', [CategoriaController::class, 'index']);
        Route::get('/categorias/{id}', [CategoriaController::class, 'show']);

        // Pedidos (meseros, cocineros, cajeros y admin)
        Route::get('/pedidos', [PedidoController::class, 'index']);
        Route::post('/pedidos', [PedidoController::class, 'store']);
        Route::get('/pedidos/{id}', [PedidoController::class, 'show']);
        Route::put('/pedidos/{id}', [PedidoController::class, 'update']);
        Route::delete('/pedidos/{id}', [PedidoController::class, 'destroy']);
        Route::get('/pedidos/{id}/detalle-completo', [PedidoController::class, 'showCompleto']);

        Route::get('/pedidos-cocina', [PedidoController::class, 'pedidosCocina']);
        Route::get('/pedidos-caja', [PedidoController::class, 'pedidosParaCaja']);

        // Detalles de pedido
        Route::get('/detalles', [DetallePedidoController::class, 'index']);
        Route::post('/detalles', [DetallePedidoController::class, 'store']);
        Route::put('/detalles/{id}', [DetallePedidoController::class, 'update']);
        Route::delete('/detalles/{id}', [DetallePedidoController::class, 'destroy']);

        // Facturas (cajero y admin)
        Route::get('/facturas', [FacturaController::class, 'index']);
        Route::get('/facturas/{id}', [FacturaController::class, 'show']);
        Route::post('/facturas', [FacturaController::class, 'store']);
    });

    // Rutas exclusivas para administrador
    Route::middleware(['api.token', 'role:administrador'])->group(function () {

        Route::get('/admin/resumen', [AdminController::class, 'resumen']);

        Route::get('/sucursales', [SucursalController::class, 'index']);
        Route::get('/roles', [RolController::class, 'index']);

        // CRUD de mesas (solo escritura)
        Route::post('/mesas', [MesaController::class, 'store']);
        Route::put('/mesas/{id}', [MesaController::class, 'update']);
        Route::delete('/mesas/{id}', [MesaController::class, 'destroy']);

        // CRUD de menú (solo escritura)
        Route::post('/menu', [MenuController::class, 'store']);
        Route::put('/menu/{id}', [MenuController::class, 'update']);
        Route::delete('/menu/{id}', [MenuController::class, 'destroy']);

        // CRUD de categorías (solo escritura)
        Route::post('/categorias', [CategoriaController::class, 'store']);
        Route::put('/categorias/{id}', [CategoriaController::class, 'update']);
        Route::delete('/categorias/{id}', [CategoriaController::class, 'destroy']);

        // CRUD de empleados
        Route::get('/empleados', [EmpleadoController::class, 'index']);
        Route::post('/empleados', [EmpleadoController::class, 'store']);
        Route::get('/empleados/{id}', [EmpleadoController::class, 'show']);
        Route::put('/empleados/{id}', [EmpleadoController::class, 'update']);
        Route::delete('/empleados/{id}', [EmpleadoController::class, 'destroy']);

        Route::get('/empleados/{id}/usuario', [UsuarioEmpleadoController::class, 'show']);
        Route::post('/empleados/{id}/usuario', [UsuarioEmpleadoController::class, 'store']);
        Route::put('/empleados/{id}/usuario', [UsuarioEmpleadoController::class, 'update']);
        Route::delete('/empleados/{id}/usuario', [UsuarioEmpleadoController::class, 'destroy']);
    });
});
