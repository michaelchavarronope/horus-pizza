<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $login = $request->attributes->get('login_user');

        if (!$login) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $empleado = DB::table('Empleados')
            ->join('Roles', 'Empleados.id_rol', '=', 'Roles.id_rol')
            ->where('Empleados.id_empleado', $login->id_empleado)
            ->first();

        if (!$empleado || !in_array(strtolower($empleado->nombre_rol), array_map('strtolower', $roles))) {
            return response()->json(['message' => 'Acceso denegado. Rol insuficiente.'], 403);
        }

        return $next($request);
    }
}
