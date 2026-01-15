<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

set_exception_handler(function($e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    exit;
});

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $errstr]);
    exit;
});

$data = $_POST;

if (!$data || count($data) === 0) {
    echo json_encode(['success' => false, 'message' => 'No se recibieron datos']);
    exit;
}

if (!isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
    exit;
}

try {
    $conn = getDBConnection();
    
    switch ($data['action']) {
        case 'obtener_clientes_calificables':
            echo json_encode(obtenerClientesCalificables($conn, $data['id_administrador']));
            break;
        case 'guardar_calificacion':
            echo json_encode(guardarCalificacion($conn, $data));
            break;
        case 'actualizar_calificacion':
            echo json_encode(actualizarCalificacion($conn, $data));
            break;
        case 'obtener_calificacion_por_id':
            echo json_encode(obtenerCalificacionPorId($conn, $data['id_calificacion'], $data['id_administrador']));
            break;
        case 'eliminar_calificacion':
            echo json_encode(eliminarCalificacion($conn, $data['id_calificacion'], $data['id_administrador']));
            break;
        case 'obtener_calificaciones':
            echo json_encode(obtenerCalificaciones($conn, $data['id_administrador']));
            break;
        case 'obtener_estadisticas':
            echo json_encode(obtenerEstadisticas($conn, $data['id_administrador']));
            break;
        case 'buscar_calificaciones_por_rut':
            echo json_encode(buscarCalificacionesPorRUT($conn, $data['rut'], $data['id_administrador']));
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}

/**
 * Obtener clientes que pueden ser calificados por el administrador
 */
function obtenerClientesCalificables($conn, $id_administrador) {
    $stmt = $conn->prepare("
        SELECT DISTINCT
            u.id_usuario,
            u.nombre,
            u.apellido,
            ge.nombre_espacio,
            aec.id_asignacion,
            cb.id_comportamiento as calificacion_existente,
            cb.calificacion as calificacion_anterior
        FROM asignacion_espacio_cliente aec
        JOIN usuarios u ON aec.id_usuario = u.id_usuario
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON ur.id_rol = r.id_rol AND r.nombre_rol = 'Cliente'
        JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
        LEFT JOIN comportamientocliente cb ON u.id_usuario = cb.id_usuario AND cb.id_administrador_calificador = ?
        WHERE ge.id_usuario = ?
        AND u.activo = 1
        ORDER BY u.nombre, u.apellido
    ");
    $stmt->bind_param('ii', $id_administrador, $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $clientes = [];
    while ($row = $result->fetch_assoc()) {
        $clientes[] = [
            'id_cliente' => $row['id_usuario'],
            'nombre' => $row['nombre'],
            'apellido' => $row['apellido'],
            'nombre_espacio' => $row['nombre_espacio'],
            'id_asignacion' => $row['id_asignacion'],
            'calificacion_existente' => $row['calificacion_existente'],
            'calificacion_anterior' => $row['calificacion_anterior']
        ];
    }
    
    return ['success' => true, 'clientes' => $clientes];
}

/**
 * Guardar calificación de un cliente
 */
function guardarCalificacion($conn, $data) {
    $conn->begin_transaction();
    
    try {
        // Validar datos requeridos (comentarios_adicionales es opcional)
        $camposRequeridos = ['id_administrador', 'id_cliente', 'descripcion', 'tipo_comportamiento', 'nivel_gravedad', 'calificacion'];
        foreach ($camposRequeridos as $campo) {
            if (empty($data[$campo])) {
                throw new Exception("El campo $campo es requerido");
            }
        }
        
        
        // Verificar que el cliente está asignado al administrador
        $stmt_check = $conn->prepare("
            SELECT aec.id_asignacion, ge.nombre_espacio
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_usuario = ? AND ge.id_usuario = ?
        ");
        $stmt_check->bind_param('ii', $data['id_cliente'], $data['id_administrador']);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows === 0) {
            throw new Exception('No tienes permisos para calificar a este cliente');
        }
        
        $asignacion = $result_check->fetch_assoc();
        $nombre_espacio = $asignacion['nombre_espacio'];
        
        
        // Siempre crear nueva calificación (permitir múltiples calificaciones)
        $stmt_insert = $conn->prepare("
            INSERT INTO comportamientocliente (
                id_usuario, descripcion, tipo_comportamiento, nivel_gravedad, 
                calificacion, id_administrador_calificador, 
                nombre_espacio_respaldo
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt_insert->bind_param('issiiis', 
            $data['id_cliente'],
            $data['descripcion'],
            $data['tipo_comportamiento'],
            $data['nivel_gravedad'],
            $data['calificacion'],
            $data['id_administrador'],
            $nombre_espacio
        );
        
        if (!$stmt_insert->execute()) {
            throw new Exception('Error al guardar la calificación');
        }
        
        $mensaje = 'Calificación guardada correctamente';
        
        $conn->commit();
        return ['success' => true, 'message' => $mensaje];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

/**
 * Obtener calificaciones del administrador
 */
function obtenerCalificaciones($conn, $id_administrador) {
    $stmt = $conn->prepare("
        SELECT 
            cb.id_comportamiento,
            u.nombre,
            u.apellido,
            cb.calificacion,
            cb.descripcion as comentario,
            cb.fecha_registro as fecha,
            cb.nombre_espacio_respaldo as espacio,
            cb.tipo_comportamiento,
            cb.nivel_gravedad
        FROM comportamientocliente cb
        JOIN usuarios u ON cb.id_usuario = u.id_usuario
        WHERE cb.id_administrador_calificador = ?
        ORDER BY cb.fecha_registro DESC
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $calificaciones = [];
    while ($row = $result->fetch_assoc()) {
        $calificaciones[] = [
            'id_comportamiento' => $row['id_comportamiento'],
            'cliente_nombre' => $row['nombre'],
            'cliente_apellido' => $row['apellido'],
            'calificacion' => $row['calificacion'],
            'comentario' => $row['comentario'],
            'fecha_registro' => $row['fecha'],
            'espacio' => $row['espacio'],
            'tipo_comportamiento' => $row['tipo_comportamiento'],
            'nivel_gravedad' => $row['nivel_gravedad']
        ];
    }
    
    return ['success' => true, 'calificaciones' => $calificaciones];
}

/**
 * Obtener estadísticas de calificaciones
 */
function obtenerEstadisticas($conn, $id_administrador) {
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_calificaciones,
            AVG(calificacion) as promedio,
            SUM(CASE WHEN calificacion = 5 THEN 1 ELSE 0 END) as calificaciones_5,
            SUM(CASE WHEN calificacion = 4 THEN 1 ELSE 0 END) as calificaciones_4,
            SUM(CASE WHEN calificacion = 3 THEN 1 ELSE 0 END) as calificaciones_3,
            SUM(CASE WHEN calificacion = 2 THEN 1 ELSE 0 END) as calificaciones_2,
            SUM(CASE WHEN calificacion = 1 THEN 1 ELSE 0 END) as calificaciones_1
        FROM comportamientocliente 
        WHERE id_administrador_calificador = ?
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return [
            'success' => true, 
            'estadisticas' => [
                'total_calificaciones' => 0,
                'promedio' => 0,
                'calificaciones_5' => 0,
                'calificaciones_4' => 0,
                'calificaciones_3' => 0,
                'calificaciones_2' => 0,
                'calificaciones_1' => 0
            ]
        ];
    }
    
    $stats = $result->fetch_assoc();
    
    return [
        'success' => true,
        'estadisticas' => [
            'total_calificaciones' => (int)$stats['total_calificaciones'],
            'promedio' => round($stats['promedio'], 1),
            'calificaciones_5' => (int)$stats['calificaciones_5'],
            'calificaciones_4' => (int)$stats['calificaciones_4'],
            'calificaciones_3' => (int)$stats['calificaciones_3'],
            'calificaciones_2' => (int)$stats['calificaciones_2'],
            'calificaciones_1' => (int)$stats['calificaciones_1']
        ]
    ];
}

/**
 * Actualizar calificación existente
 */
function actualizarCalificacion($conn, $data) {
    $conn->begin_transaction();
    
    try {
        // Validar datos requeridos
        $camposRequeridos = ['id_calificacion', 'id_administrador', 'id_cliente', 'descripcion', 'tipo_comportamiento', 'nivel_gravedad', 'calificacion'];
        foreach ($camposRequeridos as $campo) {
            if (empty($data[$campo])) {
                throw new Exception("El campo $campo es requerido");
            }
        }
        
        // Verificar que la calificación pertenece al administrador
        $stmt_check = $conn->prepare("
            SELECT id_comportamiento FROM comportamientocliente 
            WHERE id_comportamiento = ? AND id_administrador_calificador = ?
        ");
        $stmt_check->bind_param('ii', $data['id_calificacion'], $data['id_administrador']);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows === 0) {
            throw new Exception('No tienes permisos para editar esta calificación');
        }
        
        // Actualizar calificación
        $stmt_update = $conn->prepare("
            UPDATE comportamientocliente 
            SET descripcion = ?, 
                tipo_comportamiento = ?, 
                nivel_gravedad = ?, 
                calificacion = ?,
                fecha_registro = NOW()
            WHERE id_comportamiento = ? AND id_administrador_calificador = ?
        ");
        
        $stmt_update->bind_param('ssiiii', 
            $data['descripcion'],
            $data['tipo_comportamiento'],
            $data['nivel_gravedad'],
            $data['calificacion'],
            $data['id_calificacion'],
            $data['id_administrador']
        );
        
        if (!$stmt_update->execute()) {
            throw new Exception('Error al actualizar la calificación');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Calificación actualizada correctamente'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

/**
 * Obtener calificación por ID
 */
function obtenerCalificacionPorId($conn, $id_calificacion, $id_administrador) {
    error_log("DEBUG: obtenerCalificacionPorId - ID Calificación: $id_calificacion, ID Administrador: $id_administrador");
    
    $stmt = $conn->prepare("
        SELECT 
            cb.id_comportamiento,
            cb.id_usuario as id_cliente,
            u.nombre,
            u.apellido,
            cb.calificacion,
            cb.descripcion as comentario,
            cb.tipo_comportamiento,
            cb.nivel_gravedad
        FROM comportamientocliente cb
        JOIN usuarios u ON cb.id_usuario = u.id_usuario
        WHERE cb.id_comportamiento = ? AND cb.id_administrador_calificador = ?
    ");
    $stmt->bind_param('ii', $id_calificacion, $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        error_log("DEBUG: No se encontró calificación con ID: $id_calificacion para administrador: $id_administrador");
        return ['success' => false, 'message' => 'Calificación no encontrada'];
    }
    
    $calificacion = $result->fetch_assoc();
    
    return [
        'success' => true,
        'calificacion' => [
            'id_comportamiento' => $calificacion['id_comportamiento'],
            'id_cliente' => $calificacion['id_cliente'],
            'nombre' => $calificacion['nombre'],
            'apellido' => $calificacion['apellido'],
            'calificacion' => $calificacion['calificacion'],
            'comentario' => $calificacion['comentario'],
            'tipo_comportamiento' => $calificacion['tipo_comportamiento'],
            'nivel_gravedad' => $calificacion['nivel_gravedad']
        ]
    ];
}

/**
 * Eliminar calificación
 */
function eliminarCalificacion($conn, $id_calificacion, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        // Verificar que la calificación pertenece al administrador
        $stmt_check = $conn->prepare("
            SELECT id_comportamiento FROM comportamientocliente 
            WHERE id_comportamiento = ? AND id_administrador_calificador = ?
        ");
        $stmt_check->bind_param('ii', $id_calificacion, $id_administrador);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows === 0) {
            throw new Exception('No tienes permisos para eliminar esta calificación');
        }
        
        // Eliminar calificación
        $stmt_delete = $conn->prepare("
            DELETE FROM comportamientocliente 
            WHERE id_comportamiento = ? AND id_administrador_calificador = ?
        ");
        $stmt_delete->bind_param('ii', $id_calificacion, $id_administrador);
        
        if (!$stmt_delete->execute()) {
            throw new Exception('Error al eliminar la calificación');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Calificación eliminada correctamente'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

/**
 * Buscar calificaciones por RUT de cliente
 */
function buscarCalificacionesPorRUT($conn, $rut, $id_administrador) {
    try {
        // Limpiar el RUT (quitar puntos y guiones)
        $rutLimpio = str_replace(['.', '-'], '', $rut);
        
        // Separar número y dígito verificador
        $rut_numero = substr($rutLimpio, 0, -1);
        $rut_dv = substr($rutLimpio, -1);
        
        // Buscar cliente por RUT (usando rut_numero y rut_dv)
        $stmt_cliente = $conn->prepare("
            SELECT 
                u.id_usuario, 
                u.nombre, 
                u.apellido, 
                u.rut_numero, 
                u.rut_dv, 
                c.correo_electronico, 
                u.telefono
            FROM usuarios u
            LEFT JOIN credenciales c ON c.id_usuario = u.id_usuario
            JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
            JOIN roles r ON ur.id_rol = r.id_rol AND r.nombre_rol = 'Cliente'
            WHERE u.rut_numero = ? AND u.rut_dv = ? 
            AND u.activo = 1
        ");
        $stmt_cliente->bind_param('is', $rut_numero, $rut_dv);
        $stmt_cliente->execute();
        $result_cliente = $stmt_cliente->get_result();
        
        if ($result_cliente->num_rows === 0) {
            return ['success' => false, 'message' => 'No se encontró un cliente con ese RUT'];
        }
        
        $cliente_data = $result_cliente->fetch_assoc();
        $id_cliente = $cliente_data['id_usuario'];
        
        // Formatear RUT para mostrar
        $rut_formateado = number_format($cliente_data['rut_numero'], 0, '', '.') . '-' . $cliente_data['rut_dv'];
        
        // Preparar datos del cliente para el frontend
        $cliente = [
            'id_usuario' => $cliente_data['id_usuario'],
            'nombre' => $cliente_data['nombre'],
            'apellido' => $cliente_data['apellido'],
            'rut' => $rut_formateado,
            'email' => $cliente_data['correo_electronico'],
            'telefono' => $cliente_data['telefono']
        ];
        
        // Buscar todas las calificaciones del cliente (de cualquier administrador)
        $stmt_calificaciones = $conn->prepare("
            SELECT 
                cc.id_comportamiento,
                cc.calificacion,
                cc.descripcion,
                cc.tipo_comportamiento,
                cc.nivel_gravedad,
                cc.fecha_registro,
                cc.nombre_espacio_respaldo AS espacio,
                u_calificador.nombre AS calificador_nombre,
                u_calificador.apellido AS calificador_apellido,
                CASE 
                    WHEN cc.id_administrador_calificador = ? THEN 'Tú'
                    ELSE CONCAT(u_calificador.nombre, ' ', u_calificador.apellido)
                END AS calificado_por
            FROM comportamientocliente cc
            JOIN usuarios u_calificador ON cc.id_administrador_calificador = u_calificador.id_usuario
            WHERE cc.id_usuario = ?
            ORDER BY cc.fecha_registro DESC
        ");
        $stmt_calificaciones->bind_param('ii', $id_administrador, $id_cliente);
        $stmt_calificaciones->execute();
        $result_calificaciones = $stmt_calificaciones->get_result();
        
        $calificaciones = [];
        while ($row = $result_calificaciones->fetch_assoc()) {
            $calificaciones[] = $row;
        }
        
        return [
            'success' => true,
            'cliente' => $cliente,
            'calificaciones' => $calificaciones
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al buscar calificaciones: ' . $e->getMessage()];
    }
}
?>
