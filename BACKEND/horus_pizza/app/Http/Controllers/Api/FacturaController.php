<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Factura;
use App\Models\DetalleFactura;
use App\Models\Pedido;
use App\Models\Mesa;
use Illuminate\Http\Request;

class FacturaController extends Controller
{
    // Listar facturas (por si las necesitas)
    public function index()
    {
        return response()->json(
            Factura::with(['pedido.mesa', 'detalles'])
                ->orderBy('id_factura', 'desc')
                ->get()
        );
    }

    // Ver una factura específica
    public function show($id)
    {
        $factura = Factura::with(['pedido.mesa', 'detalles'])
            ->findOrFail($id);

        return response()->json($factura);
    }

    // Crear factura desde un pedido (pago realizado en caja)
    public function store(Request $request)
    {
        $request->validate([
            'id_pedido'   => 'required|exists:pedidos,id_pedido',
            'metodo_pago' => 'required|in:Efectivo,Tarjeta,Transferencia,Mixto',
        ]);

        $pedido = Pedido::with('detalles.platillo', 'mesa')->findOrFail($request->id_pedido);

        // Pedido debe estar listo o servido
        if (!in_array($pedido->estado, ['Listo', 'Servido'])) {
            return response()->json([
                'message' => 'El pedido debe estar "Listo" o "Servido" para facturar'
            ], 400);
        }

        // Evitar facturar dos veces el mismo pedido
        if (Factura::where('id_pedido', $pedido->id_pedido)->exists()) {
            return response()->json([
                'message' => 'Este pedido ya tiene una factura generada'
            ], 400);
        }

        // Calcular totales desde detalle_pedido
        $subtotal = $pedido->detalles->sum('subtotal');
        $tasaIva = 0.00; // 0.19 si quieres activar IVA
        $impuesto = $subtotal * $tasaIva;
        $total = $subtotal + $impuesto;

        // Crear factura - número basado en el ID auto-incremental para evitar duplicados
        $factura = Factura::create([
            'id_pedido'      => $pedido->id_pedido,
            'numero_factura' => 'FAC-TEMP',
            'id_cliente'     => null,
            'subtotal'       => $subtotal,
            'impuesto'       => $impuesto,
            'total'          => $total,
            'metodo_pago'    => $request->metodo_pago,
            'estado'         => 'Emitida',
            'estado_pago'    => 'Pagado',
        ]);
        $factura->numero_factura = 'FAC-' . str_pad($factura->id_factura, 6, '0', STR_PAD_LEFT);
        $factura->save();

        // Crear detalle_factura a partir de detalle_pedido
        foreach ($pedido->detalles as $item) {
            DetalleFactura::create([
                'id_factura'      => $factura->id_factura,
                'id_platillo'     => $item->platillo->id_platillo,
                'nombre_platillo' => $item->platillo->nombre,
                'cantidad'        => $item->cantidad,
                'precio_unitario' => $item->precio_unitario,
                'subtotal'        => $item->subtotal,
            ]);
        }

        // Actualizar pedido y liberar mesa
        $pedido->estado = 'Pagado';
        $pedido->save();

        if ($pedido->mesa) {
            $pedido->mesa->estado = 'Disponible';
            $pedido->mesa->save();
        }

        return response()->json([
            'message' => 'Factura creada y pago registrado correctamente',
            'factura' => $factura
        ], 201);
    }
}
