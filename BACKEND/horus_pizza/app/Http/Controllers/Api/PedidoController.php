<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Mesa;
use Illuminate\Http\Request;


class PedidoController extends Controller
{
    // �o" LISTAR TODOS LOS PEDIDOS
    public function index()
    {
        return response()->json(Pedido::all());
    }

    // �o" MOSTRAR UN PEDIDO POR ID
    public function show($id)
    {
        $pedido = Pedido::findOrFail($id);
        return response()->json($pedido);
    }


  
    // �o" Pedido con mesa, empleado y detalles (con platillos)
    public function showCompleto($id)
    {
        $pedido = Pedido::with([
            'mesa',
            'empleado',
            'detalles.platillo'
        ])->findOrFail($id);

        return response()->json($pedido);
    }
    

    // �o" Obtener pedido activo de una mesa
public function pedidoActivoPorMesa($idMesa)
{
    $pedido = Pedido::where('id_mesa', $idMesa)
        ->whereIn('estado', ['Pendiente', 'En preparación', 'Listo', 'Servido'])
        ->orderByDesc('fecha_pedido')
        ->first();

    if (!$pedido) {
        return response()->json([
            'message' => 'No hay pedido activo para esta mesa'
        ], 404);
    }

    return response()->json($pedido);
}



    // �o" CREAR PEDIDO
   public function store(Request $request)
{
    $validated = $request->validate([
        'id_mesa'     => 'required|integer|exists:mesas,id_mesa',
        'id_empleado' => 'required|integer|exists:empleados,id_empleado',
    ]);

    // �o. Verificar que no haya un pedido activo en esa mesa
    $existeActivo = Pedido::where('id_mesa', $validated['id_mesa'])
        ->whereIn('estado', ['Pendiente', 'En preparación', 'Listo', 'Servido'])
        ->exists();

    if ($existeActivo) {
        return response()->json([
            'message' => 'La mesa ya tiene un pedido activo'
        ], 400);
    }

    // �?O YA NO TOCAMOS EL ESTADO DE LA MESA AQU�?

    $mesa = Mesa::find($validated['id_mesa']);
    if ($mesa) {
        $mesa->estado = 'Ocupada';
        $mesa->save();
    }

    $pedido = Pedido::create([
        'id_mesa'     => $validated['id_mesa'],
        'id_empleado' => $validated['id_empleado'],
        'estado'      => 'Pendiente',
        'total'       => 0
    ]);

    return response()->json([
        'message' => 'Pedido creado correctamente',
        'pedido'  => $pedido
    ], 201);
}


    // �o" ACTUALIZAR PEDIDO
    public function update(Request $request, $id)
{
    $pedido = Pedido::findOrFail($id);

    $validated = $request->validate([
        'id_mesa'     => 'sometimes|integer|exists:mesas,id_mesa',
        'id_empleado' => 'sometimes|integer|exists:empleados,id_empleado',
        'estado'      => 'sometimes|string',
        'total'       => 'sometimes|numeric'
    ]);

    // �Y"? Cambio de mesa (si lo usas)
    if ($request->has('id_mesa')) {
        $mesaAnterior = Mesa::find($pedido->id_mesa);
        if ($mesaAnterior) {
            $mesaAnterior->estado = 'Disponible';
            $mesaAnterior->save();
        }

        $mesaNueva = Mesa::find($validated['id_mesa']);

        $tieneActivo = Pedido::where('id_mesa', $validated['id_mesa'])
            ->where('id_pedido', '!=', $pedido->id_pedido)
        ->whereIn('estado', ['Pendiente', 'En preparación', 'Listo', 'Servido'])
        ->exists();

        if ($tieneActivo) {
            return response()->json(['message' => 'La nueva mesa ya tiene un pedido activo'], 400);
        }

        if ($mesaNueva) {
            $mesaNueva->estado = 'Ocupada';
            $mesaNueva->save();
        }
    }

    // �o. Si cambia el estado del pedido, actualizamos el estado de la mesa
    if (isset($validated['estado'])) {
        $mesa = Mesa::find($pedido->id_mesa);

        if ($mesa) {
            if (in_array($validated['estado'], ['En preparación', 'Listo', 'Servido'])) {
                // Cuando ya estǭ en cocina / listo / servido
                $mesa->estado = 'Ocupada';
            } elseif ($validated['estado'] === 'Pagado') {
                // Cuando ya se pag�� (Caja)
                $mesa->estado = 'Disponible';
            } elseif ($validated['estado'] === 'Pendiente') {
                // Si quieres, puede seguir como Disponible mientras solo estǭ tomando el pedido
                $mesa->estado = 'Disponible';
            }

            $mesa->save();
        }
    }

    $pedido->update($validated);

    return response()->json([
        'message' => 'Pedido actualizado correctamente',
        'pedido'  => $pedido
    ]);
}


    // �o" ELIMINAR PEDIDO
    public function destroy($id)
    {
        $pedido = Pedido::findOrFail($id);

        // Liberar mesa
        $mesa = Mesa::find($pedido->id_mesa);
        if ($mesa) {
            $mesa->estado = 'Disponible';
            $mesa->save();
        }

        // Eliminar pedido
        $pedido->delete();

        return response()->json(['message' => 'Pedido eliminado correctamente']);
    }

    // �Y'��??�Y?� Pedidos para cocina: Pendientes o En preparación
public function pedidosCocina()
{
    $pedidos = Pedido::with([
            'mesa',
            'empleado',
            'detalles.platillo'
        ])
        ->whereIn('estado', ['Pendiente', 'En preparación'])
        // �o. Solo pedidos que tengan al menos un detalle
        ->whereHas('detalles')
        ->orderBy('fecha_pedido', 'asc')
        ->get();

    return response()->json($pedidos);
}


public function pedidosParaCaja()
{
    // Pedidos que ya pasaron por cocina y estǭn listos para cobrar
    $pedidos = Pedido::with([
            'mesa',
            'empleado',
            'detalles.platillo'
        ])
        ->where('estado', 'Listo')
        ->whereHas('detalles') // solo con cosas pedidas
        ->orderBy('fecha_pedido', 'asc')
        ->get();

    return response()->json($pedidos);
}

}
