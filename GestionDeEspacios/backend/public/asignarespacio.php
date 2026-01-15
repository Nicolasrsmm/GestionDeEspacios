<?php
// Deshabilitar salida de errores para evitar HTML en la respuesta JSON
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar que el archivo de configuración existe
if (!file_exists('../config/db_config.php')) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de configuración: archivo db_config.php no encontrado'
    ]);
    exit();
}

require_once '../config/db_config.php';

// Extraer variables de configuración
$servername = $DB_CONFIG['host'];
$username = $DB_CONFIG['user'];
$password = $DB_CONFIG['password'];
$dbname = $DB_CONFIG['database'];

// Función para obtener espacios con equipamiento y horarios
function obtenerEspaciosCompletos($conn) {
    try {
        if (!isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'ID de administrador requerido'
            ];
        }
        
        $id_administrador = intval($_POST['id_administrador']);
        
        // Verificar que el usuario existe y tiene permisos (Administrador o Secretaria)
        $stmt_user = $conn->prepare("
            SELECT u.id_usuario, r.nombre_rol, u.id_administrador_asociado
            FROM usuarios u 
            JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
            JOIN roles r ON ur.id_rol = r.id_rol 
            WHERE u.id_usuario = ? AND r.nombre_rol IN ('Administrador', 'Secretaria') AND u.activo = 1 AND ur.estado = 'Activo'
        ");
        $stmt_user->bind_param("i", $id_administrador);
        $stmt_user->execute();
        $result_user = $stmt_user->get_result();
        
        if ($result_user->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Usuario no autorizado'
            ];
        }
        
        $user_data = $result_user->fetch_assoc();
        $user_role = $user_data['nombre_rol'];
        
        // Determinar el ID del administrador para filtrar espacios
        $id_admin_final = $id_administrador;
        if ($user_role === 'Secretaria') {
            $id_admin_final = $user_data['id_administrador_asociado'];
        }
        
        // Obtener espacios básicos
        $sql_espacios = "SELECT 
            ge.id_espacio,
            ge.nombre_espacio,
            ge.tipo_espacio,
            ge.metros_cuadrados,
            r.nombre_region,
            c.nombre_ciudad,
            ge.direccion,
            ge.ubicacion_interna,
            ge.disponible,
            ge.fecha_creacion,
            CASE 
                WHEN ge.disponible = 0 THEN 'No Disponible'
                WHEN ge.disponible = 1 THEN 'Disponible'
                WHEN ge.disponible = 2 THEN 'Sin Horarios Disponibles'
                ELSE 'Desconocido'
            END as estado_disponibilidad
        FROM gestiondeespacio ge
        LEFT JOIN regiones r ON ge.id_region = r.id_region
        LEFT JOIN ciudades c ON ge.id_ciudad = c.id_ciudad
        WHERE ge.id_usuario = ? 
        ORDER BY ge.fecha_creacion DESC";
        
        $stmt = $conn->prepare($sql_espacios);
        $stmt->bind_param("i", $id_admin_final);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $espacios = [];
        while ($row = $result->fetch_assoc()) {
            $id_espacio = $row['id_espacio'];
            
            // Obtener equipamiento del espacio
            $sql_equipamiento = "SELECT 
                nombre_equipamiento,
                cantidad,
                descripcion,
                estado
            FROM equipamiento 
            WHERE id_espacio = ?";
            
            $stmt_equipamiento = $conn->prepare($sql_equipamiento);
            $stmt_equipamiento->bind_param("i", $id_espacio);
            $stmt_equipamiento->execute();
            $result_equipamiento = $stmt_equipamiento->get_result();
            
            $equipamiento = [];
            while ($equipo = $result_equipamiento->fetch_assoc()) {
                $equipamiento[] = $equipo;
            }
            
            // Obtener fotos del espacio
            $sql_fotos = "SELECT url_imagen FROM fotos_publicacion WHERE id_espacio = ?";
            $stmt_fotos = $conn->prepare($sql_fotos);
            $stmt_fotos->bind_param("i", $id_espacio);
            $stmt_fotos->execute();
            $result_fotos = $stmt_fotos->get_result();
            
            $fotos = [];
            while ($foto = $result_fotos->fetch_assoc()) {
                $fotos[] = $foto['url_imagen'];
            }
            
            // Mantener compatibilidad con el frontend - asignar las primeras 5 fotos a foto1-foto5
            $row['foto1'] = isset($fotos[0]) ? $fotos[0] : null;
            $row['foto2'] = isset($fotos[1]) ? $fotos[1] : null;
            $row['foto3'] = isset($fotos[2]) ? $fotos[2] : null;
            $row['foto4'] = isset($fotos[3]) ? $fotos[3] : null;
            $row['foto5'] = isset($fotos[4]) ? $fotos[4] : null;
            
            // Obtener horarios del espacio
            $sql_horarios = "SELECT 
                id_horario,
                nombre_dia,
                hora_inicio,
                hora_fin,
                fecha_inicio,
                fecha_termino,
                descripcion
            FROM horario_espacios 
            WHERE id_espacio = ?";
            
            $stmt_horarios = $conn->prepare($sql_horarios);
            $stmt_horarios->bind_param("i", $id_espacio);
            $stmt_horarios->execute();
            $result_horarios = $stmt_horarios->get_result();
            
            $horarios = [];
            while ($horario = $result_horarios->fetch_assoc()) {
                $horarios[] = $horario;
            }
            
            // Obtener todas las asignaciones de clientes para este espacio
            $sql_asignaciones = "SELECT 
                aec.id_asignacion,
                aec.id_usuario,
                aec.id_horario,
                u.nombre as cliente_nombre,
                u.apellido as cliente_apellido,
                CONCAT(u.rut_numero, '-', u.rut_dv) as cliente_rut,
                u.telefono as cliente_telefono,
                c.correo_electronico as cliente_email,
                he.nombre_dia,
                he.hora_inicio,
                he.hora_fin,
                he.fecha_inicio,
                he.fecha_termino,
                he.descripcion as descripcion_horario
            FROM asignacion_espacio_cliente aec
            JOIN usuarios u ON aec.id_usuario = u.id_usuario
            JOIN credenciales c ON u.id_usuario = c.id_usuario
            LEFT JOIN horario_espacios he ON aec.id_horario = he.id_horario
            WHERE aec.id_espacio = ?";
            
            $stmt_asignaciones = $conn->prepare($sql_asignaciones);
            $stmt_asignaciones->bind_param("i", $id_espacio);
            $stmt_asignaciones->execute();
            $result_asignaciones = $stmt_asignaciones->get_result();
            
            $clientes_asignados = [];
            while ($asignacion = $result_asignaciones->fetch_assoc()) {
                // Construir objeto de horario asignado con datos reales de la base de datos
                $horario_cliente = null;
                if (!empty($asignacion['id_horario'])) {
                    $horario_cliente = [
                        'id_horario' => $asignacion['id_horario'],
                        'nombre_dia' => $asignacion['nombre_dia'],
                        'hora_inicio' => $asignacion['hora_inicio'],
                        'hora_fin' => $asignacion['hora_fin'],
                        'fecha_inicio' => $asignacion['fecha_inicio'],
                        'fecha_termino' => $asignacion['fecha_termino'],
                        'descripcion' => $asignacion['descripcion_horario']
                    ];
                }
                
                $clientes_asignados[] = [
                    'id_asignacion' => $asignacion['id_asignacion'],
                    'id_usuario' => $asignacion['id_usuario'],
                    'id_horario' => $asignacion['id_horario'],
                    'nombre' => $asignacion['cliente_nombre'],
                    'apellido' => $asignacion['cliente_apellido'],
                    'rut' => $asignacion['cliente_rut'],
                    'telefono' => $asignacion['cliente_telefono'],
                    'email' => $asignacion['cliente_email'],
                    'horario_asignado' => $horario_cliente
                ];
            }
            
            // Agregar equipamiento y horarios al espacio
            $row['equipamiento'] = $equipamiento;
            $row['horarios'] = $horarios;
            $row['clientes_asignados'] = $clientes_asignados;
            $row['esta_asignado'] = !empty($clientes_asignados);
            
            // Mantener compatibilidad con el código existente
            if (!empty($clientes_asignados)) {
                $row['cliente_asignado'] = $clientes_asignados[0]; // Primer cliente para compatibilidad
                $row['horario_asignado'] = $clientes_asignados[0]['horario_asignado'];
            }
            
            $espacios[] = $row;
        }
        
        return [
            'success' => true,
            'espacios' => $espacios
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al obtener espacios: ' . $e->getMessage()
        ];
    }
}

// Función para eliminar un espacio completo
function eliminarEspacioCompleto($conn) {
    try {
        if (!isset($_POST['id_espacio']) || !isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'ID de espacio y administrador requeridos'
            ];
        }
        
        $id_espacio = intval($_POST['id_espacio']);
        $id_administrador = intval($_POST['id_administrador']);
        
        // Verificar que el espacio pertenece al administrador
        $stmt_check = $conn->prepare("SELECT id_espacio FROM gestiondeespacio WHERE id_espacio = ? AND id_usuario = ?");
        $stmt_check->bind_param("ii", $id_espacio, $id_administrador);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Espacio no encontrado o no tienes permisos para eliminarlo'
            ];
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // 1. PRIMERO: Eliminar mensajes de todas las asignaciones del espacio
            $stmt_delete_mensajes = $conn->prepare("
                DELETE ma FROM mensajesasignacion ma 
                INNER JOIN asignacion_espacio_cliente aec ON ma.id_asignacion = aec.id_asignacion 
                WHERE aec.id_espacio = ?
            ");
            $stmt_delete_mensajes->bind_param("i", $id_espacio);
            $stmt_delete_mensajes->execute();
            
            // 2. SEGUNDO: Eliminar reportes de todas las asignaciones del espacio
            $stmt_delete_reportes = $conn->prepare("
                DELETE er FROM envioreportes er 
                INNER JOIN asignacion_espacio_cliente aec ON er.id_asignacion = aec.id_asignacion 
                WHERE aec.id_espacio = ?
            ");
            $stmt_delete_reportes->bind_param("i", $id_espacio);
            $stmt_delete_reportes->execute();
            
            // 3. TERCERO: Eliminar solicitudes de cambio de horario de todas las asignaciones del espacio
            $stmt_delete_solicitudes = $conn->prepare("
                DELETE sch FROM solicitud_cambio_horario sch 
                INNER JOIN asignacion_espacio_cliente aec ON sch.id_asignacion = aec.id_asignacion 
                WHERE aec.id_espacio = ?
            ");
            $stmt_delete_solicitudes->bind_param("i", $id_espacio);
            $stmt_delete_solicitudes->execute();
            
            // 4. CUARTO: Eliminar asignaciones de clientes
            $stmt_asignaciones = $conn->prepare("DELETE FROM asignacion_espacio_cliente WHERE id_espacio = ?");
            $stmt_asignaciones->bind_param("i", $id_espacio);
            $stmt_asignaciones->execute();
            
            // 5. QUINTO: Eliminar equipamiento
            $stmt_equipamiento = $conn->prepare("DELETE FROM equipamiento WHERE id_espacio = ?");
            $stmt_equipamiento->bind_param("i", $id_espacio);
            $stmt_equipamiento->execute();
            
            // 6. SEXTO: Eliminar horarios
            $stmt_horarios = $conn->prepare("DELETE FROM horario_espacios WHERE id_espacio = ?");
            $stmt_horarios->bind_param("i", $id_espacio);
            $stmt_horarios->execute();

            // 7. SÉPTIMO: Eliminar fotos (archivos físicos y registros)
            $fotos_actuales = [];
            $stmt_fotos_actuales = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_espacio = ?");
            $stmt_fotos_actuales->bind_param("i", $id_espacio);
            $stmt_fotos_actuales->execute();
            $result_fotos_actuales = $stmt_fotos_actuales->get_result();
            while ($foto = $result_fotos_actuales->fetch_assoc()) {
                $fotos_actuales[] = $foto['url_imagen'];
            }
            if (!empty($fotos_actuales)) {
                foreach ($fotos_actuales as $foto_url) {
                    $ruta_archivo = '../../' . $foto_url;
                    if (file_exists($ruta_archivo)) {
                        @unlink($ruta_archivo);
                    }
                }
                $stmt_delete_fotos = $conn->prepare("DELETE FROM fotos_publicacion WHERE id_espacio = ?");
                $stmt_delete_fotos->bind_param("i", $id_espacio);
                $stmt_delete_fotos->execute();
            }
            
            // 8. OCTAVO: Eliminar espacio (ÚLTIMO - después de eliminar todas las relaciones)
            $stmt_espacio = $conn->prepare("DELETE FROM gestiondeespacio WHERE id_espacio = ? AND id_usuario = ?");
            $stmt_espacio->bind_param("ii", $id_espacio, $id_administrador);
            $stmt_espacio->execute();
            
            // Confirmar transacción
            $conn->commit();
            
            return [
                'success' => true,
                'message' => 'Espacio eliminado correctamente'
            ];
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al eliminar espacio: ' . $e->getMessage()
        ];
    }
}

// Función para obtener clientes
function obtenerClientes($conn) {
    try {
        $sql = "SELECT 
            u.id_usuario,
            CONCAT(u.rut_numero, '-', u.rut_dv) as rut,
            u.nombre,
            u.apellido,
            u.telefono,
            c.correo_electronico
        FROM usuarios u
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        JOIN roles r ON ur.id_rol = r.id_rol
        JOIN credenciales c ON u.id_usuario = c.id_usuario
        WHERE r.nombre_rol = 'Cliente' AND u.activo = 1 AND ur.estado = 'Activo'
        ORDER BY u.nombre, u.apellido";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            throw new Exception('Error en la consulta: ' . $conn->error);
        }
        
        $clientes = [];
        while ($row = $result->fetch_assoc()) {
            $clientes[] = $row;
        }
        
        return [
            'success' => true,
            'clientes' => $clientes
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al obtener clientes: ' . $e->getMessage()
        ];
    }
}

// Función para obtener un espacio específico por ID
function obtenerEspacioPorId($conn) {
    try {
        if (!isset($_POST['id_espacio']) || !isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'ID de espacio y administrador requeridos'
            ];
        }
        
        $id_espacio = intval($_POST['id_espacio']);
        $id_administrador = intval($_POST['id_administrador']);
        
        // Obtener datos del espacio
        $sql_espacio = "SELECT 
            ge.id_espacio,
            ge.nombre_espacio,
            ge.tipo_espacio,
            ge.metros_cuadrados,
            r.nombre_region,
            c.nombre_ciudad,
            ge.direccion,
            ge.ubicacion_interna,
            ge.disponible,
            ge.fecha_creacion
        FROM gestiondeespacio ge
        LEFT JOIN regiones r ON ge.id_region = r.id_region
        LEFT JOIN ciudades c ON ge.id_ciudad = c.id_ciudad
        WHERE ge.id_espacio = ? AND ge.id_usuario = ?";
        
        $stmt = $conn->prepare($sql_espacio);
        $stmt->bind_param("ii", $id_espacio, $id_administrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Espacio no encontrado'
            ];
        }
        
        $espacio = $result->fetch_assoc();
        
            // Obtener equipamiento del espacio (incluye tipo si existe)
        $sql_equipamiento = "SELECT 
            e.id_equipamiento,
            e.nombre_equipamiento,
            e.cantidad,
            e.descripcion,
            e.estado,
            (SELECT te.nombre_tipo FROM tipo_equipamiento te 
                WHERE te.id_equipamiento = e.id_equipamiento AND (te.fecha_fin IS NULL)
                ORDER BY te.fecha_inicio DESC, te.id_tipo_equipamiento DESC LIMIT 1) AS tipo,
            (SELECT te.descripcion FROM tipo_equipamiento te 
                WHERE te.id_equipamiento = e.id_equipamiento AND (te.fecha_fin IS NULL)
                ORDER BY te.fecha_inicio DESC, te.id_tipo_equipamiento DESC LIMIT 1) AS descripcion_tipo
        FROM equipamiento e
        WHERE e.id_espacio = ?";
            // Obtener equipamiento del espacio (incluye tipo si existe)
        $sql_equipamiento = "SELECT 
            e.id_equipamiento,
            e.nombre_equipamiento,
            e.cantidad,
            e.descripcion,
            e.estado,
            (SELECT te.nombre_tipo FROM tipo_equipamiento te 
                WHERE te.id_equipamiento = e.id_equipamiento AND (te.fecha_fin IS NULL)
                ORDER BY te.fecha_inicio DESC, te.id_tipo_equipamiento DESC LIMIT 1) AS tipo,
            (SELECT te.descripcion FROM tipo_equipamiento te 
                WHERE te.id_equipamiento = e.id_equipamiento AND (te.fecha_fin IS NULL)
                ORDER BY te.fecha_inicio DESC, te.id_tipo_equipamiento DESC LIMIT 1) AS descripcion_tipo
        FROM equipamiento e
        WHERE e.id_espacio = ?";
        
        $stmt_equipamiento = $conn->prepare($sql_equipamiento);
        $stmt_equipamiento->bind_param("i", $id_espacio);
        $stmt_equipamiento->execute();
        $result_equipamiento = $stmt_equipamiento->get_result();
        
        $equipamiento = [];
        while ($equipo = $result_equipamiento->fetch_assoc()) {
            $equipamiento[] = $equipo;
        }
        
        // Obtener fotos del espacio
        $sql_fotos = "SELECT url_imagen FROM fotos_publicacion WHERE id_espacio = ?";
        $stmt_fotos = $conn->prepare($sql_fotos);
        $stmt_fotos->bind_param("i", $id_espacio);
        $stmt_fotos->execute();
        $result_fotos = $stmt_fotos->get_result();
        
        $fotos = [];
        while ($foto = $result_fotos->fetch_assoc()) {
            $fotos[] = $foto['url_imagen'];
        }
        
        // Mantener compatibilidad con el frontend - asignar las primeras 5 fotos a foto1-foto5
        $espacio['foto1'] = isset($fotos[0]) ? $fotos[0] : null;
        $espacio['foto2'] = isset($fotos[1]) ? $fotos[1] : null;
        $espacio['foto3'] = isset($fotos[2]) ? $fotos[2] : null;
        $espacio['foto4'] = isset($fotos[3]) ? $fotos[3] : null;
        $espacio['foto5'] = isset($fotos[4]) ? $fotos[4] : null;
        
        // Obtener horarios del espacio
        $sql_horarios = "SELECT 
            id_horario,
            nombre_dia,
            hora_inicio,
            hora_fin,
            fecha_inicio,
            fecha_termino,
            descripcion
        FROM horario_espacios 
        WHERE id_espacio = ?";
        
        $stmt_horarios = $conn->prepare($sql_horarios);
        $stmt_horarios->bind_param("i", $id_espacio);
        $stmt_horarios->execute();
        $result_horarios = $stmt_horarios->get_result();
        
        $horarios = [];
        while ($horario = $result_horarios->fetch_assoc()) {
            $horarios[] = $horario;
        }
        
        // Obtener todas las asignaciones de clientes para este espacio
        $sql_asignaciones = "SELECT 
            aec.id_asignacion,
            aec.id_usuario,
            aec.id_horario,
            u.nombre as cliente_nombre,
            u.apellido as cliente_apellido,
            CONCAT(u.rut_numero, '-', u.rut_dv) as cliente_rut,
            u.telefono as cliente_telefono,
            c.correo_electronico as cliente_email,
            he.nombre_dia,
            he.hora_inicio,
            he.hora_fin,
            he.fecha_inicio,
            he.fecha_termino,
            he.descripcion as descripcion_horario
        FROM asignacion_espacio_cliente aec
        JOIN usuarios u ON aec.id_usuario = u.id_usuario
        JOIN credenciales c ON u.id_usuario = c.id_usuario
        LEFT JOIN horario_espacios he ON aec.id_horario = he.id_horario
        WHERE aec.id_espacio = ?";
        
        $stmt_asignaciones = $conn->prepare($sql_asignaciones);
        $stmt_asignaciones->bind_param("i", $id_espacio);
        $stmt_asignaciones->execute();
        $result_asignaciones = $stmt_asignaciones->get_result();
        
        $clientes_asignados = [];
        while ($asignacion = $result_asignaciones->fetch_assoc()) {
                // Construir objeto de horario asignado con datos reales de la base de datos
                $horario_cliente = null;
                if (!empty($asignacion['id_horario'])) {
                    $horario_cliente = [
                        'id_horario' => $asignacion['id_horario'],
                        'nombre_dia' => $asignacion['nombre_dia'],
                        'hora_inicio' => $asignacion['hora_inicio'],
                        'hora_fin' => $asignacion['hora_fin'],
                        'fecha_inicio' => $asignacion['fecha_inicio'],
                        'fecha_termino' => $asignacion['fecha_termino'],
                        'descripcion' => $asignacion['descripcion_horario']
                    ];
                }
            
            $clientes_asignados[] = [
                'id_asignacion' => $asignacion['id_asignacion'],
                'id_usuario' => $asignacion['id_usuario'],
                'id_horario' => $asignacion['id_horario'],
                'nombre' => $asignacion['cliente_nombre'],
                'apellido' => $asignacion['cliente_apellido'],
                'rut' => $asignacion['cliente_rut'],
                'telefono' => $asignacion['cliente_telefono'],
                'email' => $asignacion['cliente_email'],
                'horario_asignado' => $horario_cliente
            ];
        }
        
        // Agregar equipamiento, horarios y asignaciones al espacio
        $espacio['equipamiento'] = $equipamiento;
        $espacio['horarios'] = $horarios;
        $espacio['clientes_asignados'] = $clientes_asignados;
        $espacio['esta_asignado'] = !empty($clientes_asignados);
        
        // Maintain compatibility with existing code
        if (!empty($clientes_asignados)) {
            $espacio['cliente_asignado'] = $clientes_asignados[0]; // First client for compatibility
            $espacio['horario_asignado'] = $clientes_asignados[0]['horario_asignado'];
        }
        
        return [
            'success' => true,
            'espacio' => $espacio
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al obtener espacio: ' . $e->getMessage()
        ];
    }
}

// Función para recalcular la disponibilidad de un espacio
function recalcularDisponibilidad($conn, $id_espacio) {
    try {
        // Verificar cuántos horarios tiene el espacio
        $stmt_horarios = $conn->prepare("SELECT COUNT(*) as total_horarios FROM horario_espacios WHERE id_espacio = ?");
        $stmt_horarios->bind_param("i", $id_espacio);
        $stmt_horarios->execute();
        $result_horarios = $stmt_horarios->get_result();
        $total_horarios = $result_horarios->fetch_assoc()['total_horarios'];
        
        // Verificar cuántas asignaciones tiene el espacio
        $stmt_asignaciones = $conn->prepare("SELECT COUNT(*) as total_asignaciones FROM asignacion_espacio_cliente WHERE id_espacio = ?");
        $stmt_asignaciones->bind_param("i", $id_espacio);
        $stmt_asignaciones->execute();
        $result_asignaciones = $stmt_asignaciones->get_result();
        $total_asignaciones = $result_asignaciones->fetch_assoc()['total_asignaciones'];
        
        // Determinar el nuevo estado de disponibilidad
        $nuevo_estado = 1; // Disponible por defecto
        
        if ($total_horarios > 0) {
            // Si tiene horarios definidos
            if ($total_asignaciones >= $total_horarios) {
                // Si todas las asignaciones posibles están ocupadas
                $nuevo_estado = 2; // Sin Horarios Disponibles
            } else {
                // Si aún quedan horarios disponibles
                $nuevo_estado = 1; // Disponible
            }
        } else {
            // Si no tiene horarios definidos, verificar si tiene asignaciones
            if ($total_asignaciones > 0) {
                $nuevo_estado = 2; // Sin Horarios Disponibles
            } else {
                $nuevo_estado = 1; // Disponible
            }
        }
        
        // Actualizar el estado de disponibilidad del espacio
        $stmt_update = $conn->prepare("UPDATE gestiondeespacio SET disponible = ? WHERE id_espacio = ?");
        $stmt_update->bind_param("ii", $nuevo_estado, $id_espacio);
        $stmt_update->execute();
        
        return $nuevo_estado;
        
    } catch (Exception $e) {
        throw new Exception('Error al recalcular disponibilidad: ' . $e->getMessage());
    }
}

// Función para actualizar un espacio
function actualizarEspacio($conn) {
    try {
        if (!isset($_POST['action']) || $_POST['action'] !== 'actualizar_espacio') {
            return [
                'success' => false,
                'message' => 'Acción no válida'
            ];
        }
        
        // Verificar campos obligatorios
        $campos_obligatorios = [
            'id_espacio',
            'id_administrador',
            'nombre_espacio',
            'tipo_espacio',
            'metros_cuadrados',
            'direccion'
        ];
        
        foreach ($campos_obligatorios as $campo) {
            if (!isset($_POST[$campo]) || empty(trim($_POST[$campo]))) {
                return [
                    'success' => false,
                    'message' => "El campo {$campo} es obligatorio"
                ];
            }
        }
        
        // Validar metros cuadrados
        $metros_cuadrados = floatval($_POST['metros_cuadrados']);
        if ($metros_cuadrados <= 0) {
            return [
                'success' => false,
                'message' => 'Los metros cuadrados deben ser mayor a 0'
            ];
        }
        
        // Preparar datos
        $id_espacio = intval($_POST['id_espacio']);
        $id_administrador = intval($_POST['id_administrador']);
        $nombre_espacio = trim($_POST['nombre_espacio']);
        $tipo_espacio = trim($_POST['tipo_espacio']);
        $direccion = trim($_POST['direccion']);
        $ubicacion_interna = isset($_POST['ubicacion_interna']) ? trim($_POST['ubicacion_interna']) : null;
        $disponible = isset($_POST['disponible']) && $_POST['disponible'] === '1' ? 1 : 0;
        
        // Obtener IDs de región y ciudad si se proporcionan
        $id_region = null;
        $id_ciudad = null;
        
        if (!empty($_POST['region'])) {
            $stmt_region = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
            $stmt_region->bind_param("s", $_POST['region']);
            $stmt_region->execute();
            $result_region = $stmt_region->get_result();
            if ($result_region->num_rows > 0) {
                $id_region = $result_region->fetch_assoc()['id_region'];
                
                if (!empty($_POST['ciudad'])) {
                    $stmt_ciudad = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
                    $stmt_ciudad->bind_param("si", $_POST['ciudad'], $id_region);
                    $stmt_ciudad->execute();
                    $result_ciudad = $stmt_ciudad->get_result();
                    if ($result_ciudad->num_rows > 0) {
                        $id_ciudad = $result_ciudad->fetch_assoc()['id_ciudad'];
                    }
                }
            }
        }
        
        // Verificar que el espacio pertenece al administrador
        $stmt_check = $conn->prepare("SELECT id_espacio FROM gestiondeespacio WHERE id_espacio = ? AND id_usuario = ?");
        $stmt_check->bind_param("ii", $id_espacio, $id_administrador);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Espacio no encontrado o no tienes permisos para editarlo'
            ];
        }
        
        // Verificar que no existe otro espacio con el mismo nombre para este administrador
        $stmt_duplicate = $conn->prepare("SELECT id_espacio FROM gestiondeespacio WHERE nombre_espacio = ? AND id_usuario = ? AND id_espacio != ?");
        $stmt_duplicate->bind_param("sii", $nombre_espacio, $id_administrador, $id_espacio);
        $stmt_duplicate->execute();
        $result_duplicate = $stmt_duplicate->get_result();
        
        if ($result_duplicate->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'Ya existe otro espacio con ese nombre para este administrador'
            ];
        }
        
        // Procesar archivos de fotos nuevas si existen
        $fotos = [];
        
        // Procesar todas las fotos subidas (sin nombres específicos)
        foreach ($_FILES as $field_name => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                // Validar tipo de archivo
                $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($file['type'], $allowed_types)) {
                    return [
                        'success' => false,
                        'message' => 'Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'
                    ];
                }
                
                // Validar tamaño (máximo 5MB)
                if ($file['size'] > 5 * 1024 * 1024) {
                    return [
                        'success' => false,
                        'message' => 'El archivo de imagen es demasiado grande (máximo 5MB)'
                    ];
                }
                
                // Generar nombre único para cada archivo
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $timestamp = microtime(true);
                $random = mt_rand(1000, 9999);
                $nombre_archivo = 'foto_' . uniqid() . '_' . $timestamp . '_' . $random . '.' . $extension;
                $ruta_destino = '../../frontend/styles/images/' . $nombre_archivo;
                
                // Crear directorio si no existe
                $directorio = dirname($ruta_destino);
                if (!is_dir($directorio)) {
                    mkdir($directorio, 0755, true);
                }
                
                // Mover archivo
                if (move_uploaded_file($file['tmp_name'], $ruta_destino)) {
                    $url_imagen = 'frontend/styles/images/' . $nombre_archivo;
                    $fotos[] = $url_imagen;
                } else {
                    return [
                        'success' => false,
                        'message' => 'Error al subir el archivo de imagen'
                    ];
                }
            }
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Actualizar espacio en la base de datos
            $sql = "UPDATE gestiondeespacio SET 
                nombre_espacio = ?, 
                tipo_espacio = ?, 
                metros_cuadrados = ?, 
                id_region = ?, 
                id_ciudad = ?, 
                direccion = ?, 
                ubicacion_interna = ?, 
                disponible = ?";
            
            // Asegurar NULL reales para region/ciudad cuando no se proporcionan
            $id_region_param = isset($id_region) ? $id_region : null;
            $id_ciudad_param = isset($id_ciudad) ? $id_ciudad : null;

            $params = [$nombre_espacio, $tipo_espacio, $metros_cuadrados, $id_region_param, $id_ciudad_param, $direccion, $ubicacion_interna, $disponible, $id_espacio, $id_administrador];
            // Tipos: s,s,d,i,i,s,s,i,i,i — pero para NULL en enteros se usa 'i' con valor null y mysqlnd lo trata como NULL
            $types = "ssdiissiii";
            
            $sql .= " WHERE id_espacio = ? AND id_usuario = ?";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            
            // Obtener las rutas actuales de las fotos ANTES de actualizar (siempre)
            $fotos_actuales = [];
            $stmt_fotos_actuales = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_espacio = ?");
            $stmt_fotos_actuales->bind_param("i", $id_espacio);
            $stmt_fotos_actuales->execute();
            $result_fotos_actuales = $stmt_fotos_actuales->get_result();
            while ($foto = $result_fotos_actuales->fetch_assoc()) {
                $fotos_actuales[] = $foto['url_imagen'];
            }
            
            if (!$stmt->execute()) {
                throw new Exception('Error al actualizar el espacio: ' . $stmt->error);
            }
            
            // Eliminar selectivamente fotos marcadas desde el frontend (eliminar_foto1..5)
            $fotos_a_eliminar = [];
            for ($i = 1; $i <= 5; $i++) {
                $campo = 'eliminar_foto' . $i;
                if (isset($_POST[$campo]) && $_POST[$campo] !== '0' && $_POST[$campo] !== '') {
                    // Si viene una URL, usarla directamente; si viene '1', usamos la posición
                    if ($_POST[$campo] !== '1') {
                        $fotos_a_eliminar[] = $_POST[$campo];
                    } else {
                        $index = $i - 1; // posiciones 0..4
                        if (isset($fotos_actuales[$index])) {
                            $fotos_a_eliminar[] = $fotos_actuales[$index];
                        }
                    }
                }
            }
            if (!empty($fotos_a_eliminar)) {
                foreach ($fotos_a_eliminar as $foto_url) {
                    $ruta_archivo = '../../' . $foto_url;
                    if (file_exists($ruta_archivo)) {
                        @unlink($ruta_archivo);
                    }
                    $stmt_del = $conn->prepare("DELETE FROM fotos_publicacion WHERE id_espacio = ? AND url_imagen = ?");
                    $stmt_del->bind_param("is", $id_espacio, $foto_url);
                    $stmt_del->execute();
                }
            }
            
            // Insertar nuevas fotos si se subieron
            if (!empty($fotos)) {
                $sql_foto = "INSERT INTO fotos_publicacion (id_espacio, url_imagen) VALUES (?, ?)";
                $stmt_foto = $conn->prepare($sql_foto);
                
                foreach ($fotos as $url_imagen) {
                    $stmt_foto->bind_param("is", $id_espacio, $url_imagen);
                    if (!$stmt_foto->execute()) {
                        throw new Exception('Error al registrar foto: ' . $stmt_foto->error);
                    }
                }
                $stmt_foto->close();
            }
            
            // Procesar equipamiento si existe
            if (isset($_POST['equipamiento']) && !empty($_POST['equipamiento'])) {
                // Eliminar equipamiento existente
                $stmt_delete_equipamiento = $conn->prepare("DELETE FROM equipamiento WHERE id_espacio = ?");
                $stmt_delete_equipamiento->bind_param("i", $id_espacio);
                $stmt_delete_equipamiento->execute();
                
                $equipamiento_data = json_decode($_POST['equipamiento'], true);
                
                if (is_array($equipamiento_data)) {
                    // 1) Insertar equipamiento base
                    $sql_equipamiento = "INSERT INTO equipamiento (id_espacio, nombre_equipamiento, cantidad, descripcion, estado) VALUES (?, ?, ?, ?, ?)";
                    $stmt_equipamiento = $conn->prepare($sql_equipamiento);
                    
                    // 2) Preparar inserción de tipo de equipamiento
                    $sql_tipo = "INSERT INTO tipo_equipamiento (id_equipamiento, nombre_tipo, descripcion) VALUES (?, ?, ?)";
                    $stmt_tipo = $conn->prepare($sql_tipo);

                    foreach ($equipamiento_data as $equipo) {
                        if (!empty($equipo['nombre']) && !empty($equipo['cantidad'])) {
                            $descripcion = $equipo['descripcion'] ?? '';
                            $estado = $equipo['estado'] ?? 'Disponible';
                            $tipo = isset($equipo['tipo']) ? trim((string)$equipo['tipo']) : '';
                            $descripcion_tipo = isset($equipo['descripcion_tipo']) ? trim((string)$equipo['descripcion_tipo']) : '';

                            $stmt_equipamiento->bind_param(
                                "isiss",
                                $id_espacio,
                                $equipo['nombre'],
                                $equipo['cantidad'],
                                $descripcion,
                                $estado
                            );

                            if (!$stmt_equipamiento->execute()) {
                                throw new Exception('Error al actualizar equipamiento: ' . $stmt_equipamiento->error);
                            }

                            // 3) Insertar tipo_equipamiento si se proporcionó
                            if ($tipo !== '' || $descripcion_tipo !== '') {
                                $nuevo_id_equipamiento = $conn->insert_id;
                                $stmt_tipo->bind_param(
                                    "iss",
                                    $nuevo_id_equipamiento,
                                    $tipo,
                                    $descripcion_tipo
                                );
                                if (!$stmt_tipo->execute()) {
                                    throw new Exception('Error al registrar tipo de equipamiento: ' . $stmt_tipo->error);
                                }
                            }
                        }
                    }
                }
            }
            
            // Procesar horarios si existen
            if (isset($_POST['horarios']) && !empty($_POST['horarios'])) {
                $horarios_data = json_decode($_POST['horarios'], true);
                
                if (is_array($horarios_data)) {
                    // Obtener IDs de horarios existentes
                    $stmt_get_existing = $conn->prepare("SELECT id_horario FROM horario_espacios WHERE id_espacio = ?");
                    $stmt_get_existing->bind_param("i", $id_espacio);
                    $stmt_get_existing->execute();
                    $result_existing = $stmt_get_existing->get_result();
                    
                    $existing_horarios = [];
                    while ($row = $result_existing->fetch_assoc()) {
                        $existing_horarios[] = $row['id_horario'];
                    }
                    
                    // Obtener IDs de horarios nuevos (asumiendo que vienen con id_horario si son actualizaciones)
                    $new_horario_ids = [];
                    foreach ($horarios_data as $horario) {
                        if (isset($horario['id_horario']) && !empty($horario['id_horario'])) {
                            $new_horario_ids[] = intval($horario['id_horario']);
                        }
                    }
                    
                    // Identificar horarios a eliminar (existentes que no están en los nuevos)
                    $horarios_to_delete = array_diff($existing_horarios, $new_horario_ids);
                    
                    // Eliminar asignaciones que usan horarios que se van a eliminar
                    if (!empty($horarios_to_delete)) {
                        $placeholders = str_repeat('?,', count($horarios_to_delete) - 1) . '?';
                        
                        // PRIMERO: Eliminar mensajes de las asignaciones que se van a eliminar
                        $stmt_delete_mensajes = $conn->prepare("
                            DELETE ma FROM mensajesasignacion ma 
                            INNER JOIN asignacion_espacio_cliente aec ON ma.id_asignacion = aec.id_asignacion 
                            WHERE aec.id_horario IN ($placeholders)
                        ");
                        $stmt_delete_mensajes->bind_param(str_repeat('i', count($horarios_to_delete)), ...$horarios_to_delete);
                        $stmt_delete_mensajes->execute();
                        
                        // SEGUNDO: Eliminar reportes de las asignaciones que se van a eliminar
                        $stmt_delete_reportes = $conn->prepare("
                            DELETE er FROM envioreportes er 
                            INNER JOIN asignacion_espacio_cliente aec ON er.id_asignacion = aec.id_asignacion 
                            WHERE aec.id_horario IN ($placeholders)
                        ");
                        $stmt_delete_reportes->bind_param(str_repeat('i', count($horarios_to_delete)), ...$horarios_to_delete);
                        $stmt_delete_reportes->execute();
                        
                        // TERCERO: Eliminar solicitudes de cambio de horario de las asignaciones que se van a eliminar
                        $stmt_delete_solicitudes = $conn->prepare("
                            DELETE sch FROM solicitud_cambio_horario sch 
                            INNER JOIN asignacion_espacio_cliente aec ON sch.id_asignacion = aec.id_asignacion 
                            WHERE aec.id_horario IN ($placeholders)
                        ");
                        $stmt_delete_solicitudes->bind_param(str_repeat('i', count($horarios_to_delete)), ...$horarios_to_delete);
                        $stmt_delete_solicitudes->execute();
                        
                        // CUARTO: Eliminar las asignaciones
                        $stmt_delete_assignments = $conn->prepare("DELETE FROM asignacion_espacio_cliente WHERE id_horario IN ($placeholders)");
                        $stmt_delete_assignments->bind_param(str_repeat('i', count($horarios_to_delete)), ...$horarios_to_delete);
                        $stmt_delete_assignments->execute();
                        
                        // Ahora eliminar los horarios
                        $stmt_delete_horarios = $conn->prepare("DELETE FROM horario_espacios WHERE id_horario IN ($placeholders)");
                        $stmt_delete_horarios->bind_param(str_repeat('i', count($horarios_to_delete)), ...$horarios_to_delete);
                        $stmt_delete_horarios->execute();
                    }
                    
                    // Procesar horarios (actualizar existentes o insertar nuevos)
                    foreach ($horarios_data as $horario) {
                        if (!empty($horario['nombre_dia']) && !empty($horario['hora_inicio']) && !empty($horario['hora_fin']) && !empty($horario['fecha_inicio']) && !empty($horario['fecha_termino'])) {
                            $descripcion_horario = $horario['descripcion'] ?? '';
                            
                            if (isset($horario['id_horario']) && !empty($horario['id_horario']) && in_array(intval($horario['id_horario']), $existing_horarios)) {
                                // Actualizar horario existente
                                $sql_update_horario = "UPDATE horario_espacios SET nombre_dia = ?, hora_inicio = ?, hora_fin = ?, fecha_inicio = ?, fecha_termino = ?, descripcion = ? WHERE id_horario = ?";
                                $stmt_update_horario = $conn->prepare($sql_update_horario);
                                $stmt_update_horario->bind_param(
                                    "ssssssi",
                                    $horario['nombre_dia'],
                                    $horario['hora_inicio'],
                                    $horario['hora_fin'],
                                    $horario['fecha_inicio'],
                                    $horario['fecha_termino'],
                                    $descripcion_horario,
                                    $horario['id_horario']
                                );
                                
                                if (!$stmt_update_horario->execute()) {
                                    throw new Exception('Error al actualizar horario: ' . $stmt_update_horario->error);
                                }
                            } else {
                                // Insertar nuevo horario
                                $sql_horario = "INSERT INTO horario_espacios (id_espacio, nombre_dia, hora_inicio, hora_fin, fecha_inicio, fecha_termino, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)";
                                $stmt_horario = $conn->prepare($sql_horario);
                                $stmt_horario->bind_param(
                                    "issssss",
                                    $id_espacio,
                                    $horario['nombre_dia'],
                                    $horario['hora_inicio'],
                                    $horario['hora_fin'],
                                    $horario['fecha_inicio'],
                                    $horario['fecha_termino'],
                                    $descripcion_horario
                                );
                                
                                if (!$stmt_horario->execute()) {
                                    throw new Exception('Error al insertar horario: ' . $stmt_horario->error);
                                }
                            }
                        }
                    }
                }
            }
            
            // Recalcular disponibilidad basada en horarios y asignaciones
            $nuevo_estado_disponibilidad = recalcularDisponibilidad($conn, $id_espacio);
            
            // Confirmar transacción
            $conn->commit();
            
            $mensaje = 'Espacio actualizado correctamente';
            if ($nuevo_estado_disponibilidad == 2) {
                $mensaje .= '. El espacio ahora está marcado como "Sin Horarios Disponibles"';
            } elseif ($nuevo_estado_disponibilidad == 1) {
                $mensaje .= '. El espacio está disponible para asignaciones';
            }
            
            return [
                'success' => true,
                'message' => $mensaje,
                'nuevo_estado_disponibilidad' => $nuevo_estado_disponibilidad
            ];
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error interno del servidor: ' . $e->getMessage()
        ];
    }
}

// Función para eliminar una asignación
function eliminarAsignacion($conn) {
    try {
        if (!isset($_POST['id_asignacion']) || !isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'ID de asignación y administrador requeridos'
            ];
        }
        
        $id_asignacion = intval($_POST['id_asignacion']);
        $id_administrador = intval($_POST['id_administrador']);
        
        // Verificar que la asignación existe y pertenece a un espacio del administrador
        $stmt_check = $conn->prepare("
            SELECT aec.id_asignacion, aec.id_espacio, ge.id_usuario 
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_asignacion = ? AND ge.id_usuario = ?
        ");
        $stmt_check->bind_param("ii", $id_asignacion, $id_administrador);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Asignación no encontrada o no tienes permisos para eliminarla'
            ];
        }
        
        $asignacion = $result_check->fetch_assoc();
        $id_espacio = $asignacion['id_espacio'];
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // PRIMERO: Eliminar todos los mensajes asociados a esta asignación
            $stmt_delete_mensajes = $conn->prepare("DELETE FROM mensajesasignacion WHERE id_asignacion = ?");
            $stmt_delete_mensajes->bind_param("i", $id_asignacion);
            
            if (!$stmt_delete_mensajes->execute()) {
                throw new Exception('Error al eliminar mensajes de la asignación');
            }
            
            // SEGUNDO: Eliminar reportes asociados a esta asignación
            $stmt_delete_reportes = $conn->prepare("DELETE FROM envioreportes WHERE id_asignacion = ?");
            $stmt_delete_reportes->bind_param("i", $id_asignacion);
            
            if (!$stmt_delete_reportes->execute()) {
                throw new Exception('Error al eliminar reportes de la asignación');
            }
            
            // TERCERO: Eliminar solicitudes de cambio de horario asociadas a esta asignación
            $stmt_delete_solicitudes = $conn->prepare("DELETE FROM solicitud_cambio_horario WHERE id_asignacion = ?");
            $stmt_delete_solicitudes->bind_param("i", $id_asignacion);
            
            if (!$stmt_delete_solicitudes->execute()) {
                throw new Exception('Error al eliminar solicitudes de cambio de horario de la asignación');
            }
            
            // CUARTO: Eliminar la asignación
            $stmt_delete = $conn->prepare("DELETE FROM asignacion_espacio_cliente WHERE id_asignacion = ?");
            $stmt_delete->bind_param("i", $id_asignacion);
            
            if (!$stmt_delete->execute()) {
                throw new Exception('Error al eliminar la asignación');
            }
            
            // Recalcular disponibilidad del espacio
            $nuevo_estado_disponibilidad = recalcularDisponibilidad($conn, $id_espacio);
            
            // Confirmar transacción
            $conn->commit();
            
            $mensaje = 'Asignación eliminada correctamente';
            if ($nuevo_estado_disponibilidad == 1) {
                $mensaje .= '. El espacio ahora está disponible para nuevas asignaciones';
            }
            
            return [
                'success' => true,
                'message' => $mensaje,
                'nuevo_estado_disponibilidad' => $nuevo_estado_disponibilidad
            ];
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al eliminar asignación: ' . $e->getMessage()
        ];
    }
}

// Función para obtener horarios disponibles de un espacio
function obtenerHorariosDisponibles($conn) {
    try {
        if (!isset($_POST['id_espacio']) || !isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'ID de espacio y administrador requeridos'
            ];
        }
        
        $id_espacio = intval($_POST['id_espacio']);
        $id_administrador = intval($_POST['id_administrador']);
        
        // Verificar que el espacio pertenece al administrador
        $stmt_check = $conn->prepare("SELECT id_espacio FROM gestiondeespacio WHERE id_espacio = ? AND id_usuario = ?");
        $stmt_check->bind_param("ii", $id_espacio, $id_administrador);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Espacio no encontrado o no tienes permisos'
            ];
        }
        
        // Obtener todos los horarios del espacio
        $sql_horarios = "SELECT 
            id_horario,
            nombre_dia,
            hora_inicio,
            hora_fin,
            fecha_inicio,
            fecha_termino,
            descripcion
        FROM horario_espacios 
        WHERE id_espacio = ?";
        
        $stmt_horarios = $conn->prepare($sql_horarios);
        $stmt_horarios->bind_param("i", $id_espacio);
        $stmt_horarios->execute();
        $result_horarios = $stmt_horarios->get_result();
        
        $todos_horarios = [];
        while ($horario = $result_horarios->fetch_assoc()) {
            $todos_horarios[] = $horario;
        }
        
        // Obtener horarios específicos que están asignados
        $sql_asignaciones = "SELECT id_horario FROM asignacion_espacio_cliente WHERE id_espacio = ?";
        $stmt_asignaciones = $conn->prepare($sql_asignaciones);
        $stmt_asignaciones->bind_param("i", $id_espacio);
        $stmt_asignaciones->execute();
        $result_asignaciones = $stmt_asignaciones->get_result();
        
        $horarios_asignados_ids = [];
        while ($asignacion = $result_asignaciones->fetch_assoc()) {
            $horarios_asignados_ids[] = $asignacion['id_horario'];
        }
        
        // Si no hay horarios definidos, no hay nada que asignar
        if (empty($todos_horarios)) {
            $horarios_disponibles = [];
            $horarios_asignados = [];
        } else {
            // Separar horarios disponibles de los asignados
            $horarios_disponibles = [];
            $horarios_asignados = [];
            
            foreach ($todos_horarios as $horario) {
                if (in_array($horario['id_horario'], $horarios_asignados_ids)) {
                    $horarios_asignados[] = $horario;
                } else {
                    $horarios_disponibles[] = $horario;
                }
            }
        }
        
        
        return [
            'success' => true,
            'horarios_disponibles' => $horarios_disponibles,
            'horarios_asignados' => $horarios_asignados,
            'total_horarios' => count($todos_horarios),
            'horarios_asignados_count' => count($horarios_asignados),
            'horarios_disponibles_count' => count($horarios_disponibles)
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al obtener horarios disponibles: ' . $e->getMessage()
        ];
    }
}

// Función para asignar un espacio a un cliente
function asignarEspacio($conn) {
    try {
        if (!isset($_POST['id_espacio']) || !isset($_POST['id_cliente']) || !isset($_POST['id_horario'])) {
            return [
                'success' => false,
                'message' => 'ID de espacio, cliente y horario requeridos'
            ];
        }
        
        $id_espacio = intval($_POST['id_espacio']);
        $id_cliente = intval($_POST['id_cliente']);
        $id_horario = intval($_POST['id_horario']);
        
        // Verificar que el espacio existe y está disponible
        $stmt_espacio = $conn->prepare("SELECT id_espacio, disponible FROM gestiondeespacio WHERE id_espacio = ?");
        $stmt_espacio->bind_param("i", $id_espacio);
        $stmt_espacio->execute();
        $result_espacio = $stmt_espacio->get_result();
        
        if ($result_espacio->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Espacio no encontrado'
            ];
        }
        
        $espacio = $result_espacio->fetch_assoc();
        if (!$espacio['disponible']) {
            return [
                'success' => false,
                'message' => 'El espacio no está disponible'
            ];
        }
        
        // Verificar que el cliente existe
        $stmt_cliente = $conn->prepare("SELECT id_usuario FROM usuarios WHERE id_usuario = ?");
        $stmt_cliente->bind_param("i", $id_cliente);
        $stmt_cliente->execute();
        $result_cliente = $stmt_cliente->get_result();
        
        if ($result_cliente->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Cliente no encontrado'
            ];
        }
        
        // Verificar que el horario existe y pertenece al espacio
        $stmt_horario = $conn->prepare("SELECT id_horario FROM horario_espacios WHERE id_horario = ? AND id_espacio = ?");
        $stmt_horario->bind_param("ii", $id_horario, $id_espacio);
        $stmt_horario->execute();
        $result_horario = $stmt_horario->get_result();
        
        if ($result_horario->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Horario no encontrado o no pertenece a este espacio'
            ];
        }
        
        // Verificar que el horario no esté ya asignado a otro cliente
        $stmt_asignacion = $conn->prepare("SELECT id_asignacion FROM asignacion_espacio_cliente WHERE id_horario = ?");
        $stmt_asignacion->bind_param("i", $id_horario);
        $stmt_asignacion->execute();
        $result_asignacion = $stmt_asignacion->get_result();
        
        if ($result_asignacion->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'Este horario ya está asignado a otro cliente'
            ];
        }
        
        // Verificar que el cliente no tenga ya asignado este espacio en el mismo horario específico
        $stmt_cliente_espacio = $conn->prepare("SELECT id_asignacion FROM asignacion_espacio_cliente WHERE id_espacio = ? AND id_usuario = ? AND id_horario = ?");
        $stmt_cliente_espacio->bind_param("iii", $id_espacio, $id_cliente, $id_horario);
        $stmt_cliente_espacio->execute();
        $result_cliente_espacio = $stmt_cliente_espacio->get_result();
        
        if ($result_cliente_espacio->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'Este cliente ya tiene asignado este espacio en este horario específico'
            ];
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Asignar el espacio con el horario específico
            $stmt_insert = $conn->prepare("INSERT INTO asignacion_espacio_cliente (id_usuario, id_espacio, id_horario) VALUES (?, ?, ?)");
            $stmt_insert->bind_param("iii", $id_cliente, $id_espacio, $id_horario);
            
            if (!$stmt_insert->execute()) {
                throw new Exception('Error al asignar el espacio');
            }
            
            // Verificar cuántos horarios tiene el espacio
            $stmt_horarios = $conn->prepare("SELECT COUNT(*) as total_horarios FROM horario_espacios WHERE id_espacio = ?");
            $stmt_horarios->bind_param("i", $id_espacio);
            $stmt_horarios->execute();
            $result_horarios = $stmt_horarios->get_result();
            $total_horarios = $result_horarios->fetch_assoc()['total_horarios'];
            
            // Verificar cuántas asignaciones tiene el espacio
            $stmt_asignaciones = $conn->prepare("SELECT COUNT(*) as total_asignaciones FROM asignacion_espacio_cliente WHERE id_espacio = ?");
            $stmt_asignaciones->bind_param("i", $id_espacio);
            $stmt_asignaciones->execute();
            $result_asignaciones = $stmt_asignaciones->get_result();
            $total_asignaciones = $result_asignaciones->fetch_assoc()['total_asignaciones'];
            
            // Determinar el nuevo estado de disponibilidad
            $nuevo_estado = 1; // Disponible por defecto
            
            if ($total_horarios > 0) {
                // Si tiene horarios definidos
                if ($total_asignaciones >= $total_horarios) {
                    // Si todas las asignaciones posibles están ocupadas
                    $nuevo_estado = 2; // No disponible
                } else {
                    // Si aún quedan horarios disponibles
                    $nuevo_estado = 1; // Disponible
                }
            } else {
                // Si no tiene horarios definidos, marcar como no disponible después de la asignación
                $nuevo_estado = 2; // No disponible
            }
            
            // Actualizar el estado de disponibilidad del espacio
            $stmt_update = $conn->prepare("UPDATE gestiondeespacio SET disponible = ? WHERE id_espacio = ?");
            $stmt_update->bind_param("ii", $nuevo_estado, $id_espacio);
            $stmt_update->execute();
            
            $conn->commit();
            
            return [
                'success' => true,
                'message' => 'Espacio asignado correctamente al horario seleccionado'
            ];
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al asignar espacio: ' . $e->getMessage()
        ];
    }
}

// Función para actualizar el horario de una asignación
function actualizarAsignacion($conn) {
    try {
        if (!isset($_POST['id_asignacion']) || !isset($_POST['id_horario']) || !isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'ID de asignación, horario y administrador requeridos'
            ];
        }

        $id_asignacion = intval($_POST['id_asignacion']);
        $id_horario = intval($_POST['id_horario']);
        $id_administrador = intval($_POST['id_administrador']);

        // Verificar que la asignación existe y pertenece a un espacio del administrador
        $stmt_check = $conn->prepare("\n            SELECT aec.id_asignacion, aec.id_espacio, aec.id_usuario, ge.id_usuario\n            FROM asignacion_espacio_cliente aec\n            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio\n            WHERE aec.id_asignacion = ? AND ge.id_usuario = ?\n        ");
        $stmt_check->bind_param("ii", $id_asignacion, $id_administrador);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();

        if ($result_check->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Asignación no encontrada o no tienes permisos para actualizarla'
            ];
        }

        $asignacion = $result_check->fetch_assoc();
        $id_espacio = intval($asignacion['id_espacio']);
        $id_usuario = intval($asignacion['id_usuario']);

        // Verificar que el nuevo horario existe y pertenece al espacio
        $stmt_horario = $conn->prepare("SELECT id_horario FROM horario_espacios WHERE id_horario = ? AND id_espacio = ?");
        $stmt_horario->bind_param("ii", $id_horario, $id_espacio);
        $stmt_horario->execute();
        $result_horario = $stmt_horario->get_result();

        if ($result_horario->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Horario no encontrado o no pertenece a este espacio'
            ];
        }

        // Verificar que el horario no esté ya asignado a otro cliente
        $stmt_ocupado = $conn->prepare("SELECT id_asignacion FROM asignacion_espacio_cliente WHERE id_horario = ? AND id_asignacion != ?");
        $stmt_ocupado->bind_param("ii", $id_horario, $id_asignacion);
        $stmt_ocupado->execute();
        $result_ocupado = $stmt_ocupado->get_result();

        if ($result_ocupado->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'El horario seleccionado ya está asignado a otro cliente'
            ];
        }

        // Verificar que el cliente no tenga ya asignado este espacio en el mismo horario específico (excluyendo la asignación actual)
        $stmt_cliente_espacio = $conn->prepare("SELECT id_asignacion FROM asignacion_espacio_cliente WHERE id_espacio = ? AND id_usuario = ? AND id_horario = ? AND id_asignacion != ?");
        $stmt_cliente_espacio->bind_param("iiii", $id_espacio, $id_usuario, $id_horario, $id_asignacion);
        $stmt_cliente_espacio->execute();
        $result_cliente_espacio = $stmt_cliente_espacio->get_result();

        if ($result_cliente_espacio->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'Este cliente ya tiene asignado este espacio en este horario específico'
            ];
        }

        // Actualizar la asignación y recalcular disponibilidad del espacio
        $conn->begin_transaction();
        try {
            $stmt_update = $conn->prepare("UPDATE asignacion_espacio_cliente SET id_horario = ? WHERE id_asignacion = ?");
            $stmt_update->bind_param("ii", $id_horario, $id_asignacion);
            if (!$stmt_update->execute()) {
                throw new Exception('Error al actualizar la asignación');
            }

            // Recalcular disponibilidad del espacio
            recalcularDisponibilidad($conn, $id_espacio);

            $conn->commit();
            return [
                'success' => true,
                'message' => 'Asignación actualizada correctamente'
            ];
        } catch (Exception $e) {
            $conn->rollback();
            return [
                'success' => false,
                'message' => 'Error al actualizar la asignación'
            ];
        }

    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al actualizar asignación: ' . $e->getMessage()
        ];
    }
}

// Función para intercambiar horarios entre dos asignaciones del mismo espacio
function intercambiarHorarios($conn) {
    try {
        if (!isset($_POST['id_asignacion_1']) || !isset($_POST['id_asignacion_2']) || !isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'IDs de asignaciones y administrador requeridos'
            ];
        }

        $id_asignacion_1 = intval($_POST['id_asignacion_1']);
        $id_asignacion_2 = intval($_POST['id_asignacion_2']);
        $id_administrador = intval($_POST['id_administrador']);

        if ($id_asignacion_1 === $id_asignacion_2) {
            return [
                'success' => false,
                'message' => 'Las asignaciones deben ser distintas para intercambiar horarios'
            ];
        }

        // Verificar ambas asignaciones y que pertenecen al mismo espacio y administrador
        $stmt_check = $conn->prepare("\n            SELECT aec.id_asignacion, aec.id_espacio, aec.id_horario, ge.id_usuario\n            FROM asignacion_espacio_cliente aec\n            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio\n            WHERE aec.id_asignacion IN (?, ?)\n        ");
        $stmt_check->bind_param("ii", $id_asignacion_1, $id_asignacion_2);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();

        if ($result_check->num_rows !== 2) {
            return [
                'success' => false,
                'message' => 'Una o ambas asignaciones no existen'
            ];
        }

        $row1 = $result_check->fetch_assoc();
        $row2 = $result_check->fetch_assoc();

        // Asegurar que ambas pertenecen al mismo administrador y espacio
        if (intval($row1['id_usuario']) !== $id_administrador || intval($row2['id_usuario']) !== $id_administrador) {
            return [
                'success' => false,
                'message' => 'No tienes permisos para estas asignaciones'
            ];
        }
        if (intval($row1['id_espacio']) !== intval($row2['id_espacio'])) {
            return [
                'success' => false,
                'message' => 'Las asignaciones no pertenecen al mismo espacio'
            ];
        }

        $id_espacio = intval($row1['id_espacio']);
        $h1 = intval($row1['id_horario']);
        $h2 = intval($row2['id_horario']);

        // Iniciar transacción para intercambio atómico
        $conn->begin_transaction();
        try {
            $stmt_u1 = $conn->prepare("UPDATE asignacion_espacio_cliente SET id_horario = ? WHERE id_asignacion = ?");
            $stmt_u1->bind_param("ii", $h2, $id_asignacion_1);
            if (!$stmt_u1->execute()) {
                throw new Exception('Error al actualizar primera asignación');
            }

            $stmt_u2 = $conn->prepare("UPDATE asignacion_espacio_cliente SET id_horario = ? WHERE id_asignacion = ?");
            $stmt_u2->bind_param("ii", $h1, $id_asignacion_2);
            if (!$stmt_u2->execute()) {
                throw new Exception('Error al actualizar segunda asignación');
            }

            // Recalcular disponibilidad del espacio después del intercambio
            recalcularDisponibilidad($conn, $id_espacio);

            $conn->commit();

            return [
                'success' => true,
                'message' => 'Horarios intercambiados correctamente'
            ];
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }

    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al intercambiar horarios: ' . $e->getMessage()
        ];
    }
}

// Procesar la petición
try {
    // Verificar que las variables de configuración estén definidas
    if (!isset($servername) || !isset($username) || !isset($password) || !isset($dbname)) {
        throw new Exception("Variables de configuración de base de datos no definidas");
    }
    
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Error de conexión a la base de datos: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8");
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'obtener_espacios_completos':
                $result = obtenerEspaciosCompletos($conn);
                break;
                
            case 'eliminar_espacio_completo':
                $result = eliminarEspacioCompleto($conn);
                break;
                
            case 'asignar_espacio':
                $result = asignarEspacio($conn);
                break;
                
            case 'obtener_clientes':
                $result = obtenerClientes($conn);
                break;
                
            case 'obtener_espacio_por_id':
                $result = obtenerEspacioPorId($conn);
                break;
                
            case 'actualizar_espacio':
                $result = actualizarEspacio($conn);
                break;
                
            case 'eliminar_asignacion':
                $result = eliminarAsignacion($conn);
                break;
                
            case 'obtener_horarios_disponibles':
                $result = obtenerHorariosDisponibles($conn);
                break;
            case 'actualizar_asignacion':
                $result = actualizarAsignacion($conn);
                break;
            case 'intercambiar_horarios':
                $result = intercambiarHorarios($conn);
                break;
                
            default:
                $result = [
                    'success' => false,
                    'message' => 'Acción no válida'
                ];
                break;
        }
        
        // Asegurar que solo se envíe JSON
        ob_clean();
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        
    } else {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Método no permitido'
        ]);
    }
    
} catch (Exception $e) {
    ob_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
