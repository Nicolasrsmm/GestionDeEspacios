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

// Función para verificar límite de espacios
function verificarLimiteEspacio($conn, $id_administrador) {
    // Obtener suscripción del administrador
    $stmt = $conn->prepare("
        SELECT p.cantidad_espacios, p.nombre_plan
        FROM usuarios u
        JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
        JOIN planes p ON p.id_plan = s.id_plan
        WHERE u.id_usuario = ? AND u.activo = 1
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'Administrador no encontrado o sin suscripción'];
    }
    
    $suscripcion = $result->fetch_assoc();
    $limite_espacios = $suscripcion['cantidad_espacios'];
    
    // Obtener contador actual
    $stmt = $conn->prepare("
        SELECT total_espacios FROM contador_admin_espacios 
        WHERE id_usuario = ?
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $espacios_actuales = 0;
    if ($result->num_rows > 0) {
        $contador = $result->fetch_assoc();
        $espacios_actuales = $contador['total_espacios'];
    }
    
    $puede_crear = $espacios_actuales < $limite_espacios;
    $espacios_disponibles = $limite_espacios - $espacios_actuales;
    
    return [
        'success' => true,
        'puede_crear' => $puede_crear,
        'espacios_actuales' => $espacios_actuales,
        'limite_espacios' => $limite_espacios,
        'espacios_disponibles' => $espacios_disponibles,
        'suscripcion' => $suscripcion['nombre_plan']
    ];
}

// Función para incrementar contador de espacios
function incrementarContadorEspacio($conn, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        // Verificar si existe el contador
        $stmt = $conn->prepare("SELECT total_espacios FROM contador_admin_espacios WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_administrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Actualizar contador existente
            $stmt = $conn->prepare("
                UPDATE contador_admin_espacios 
                SET total_espacios = total_espacios + 1 
                WHERE id_usuario = ?
            ");
            $stmt->bind_param('i', $id_administrador);
        } else {
            // Crear nuevo contador
            $stmt = $conn->prepare("
                INSERT INTO contador_admin_espacios (id_usuario, total_espacios) 
                VALUES (?, 1)
            ");
            $stmt->bind_param('i', $id_administrador);
        }
        
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar contador de espacios');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Contador de espacios incrementado'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al incrementar contador: ' . $e->getMessage()];
    }
}

// Función para manejar el registro de espacios
function registrarEspacio($conn) {
    try {
        // Verificar que se recibieron los datos necesarios
        if (!isset($_POST['action']) || $_POST['action'] !== 'registrar_espacio') {
            return [
                'success' => false,
                'message' => 'Acción no válida'
            ];
        }
        
        // Verificar campos obligatorios
        $campos_obligatorios = [
            'id_administrador',
            'nombre_espacio',
            'tipo_espacio',
            'metros_cuadrados',
            'ciudad',
            'region',
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
        $id_administrador = intval($_POST['id_administrador']);
        $nombre_espacio = trim($_POST['nombre_espacio']);
        $tipo_espacio = trim($_POST['tipo_espacio']);
        $metros_cuadrados = floatval($_POST['metros_cuadrados']);
        $region = trim($_POST['region']);
        $ciudad = trim($_POST['ciudad']);
        $direccion = trim($_POST['direccion']);
        $ubicacion_interna = isset($_POST['ubicacion_interna']) ? trim($_POST['ubicacion_interna']) : null;
        $disponible = isset($_POST['disponible']) && $_POST['disponible'] === '1' ? 1 : 0;
        
        // Obtener IDs de región y ciudad
        $id_region = null;
        $id_ciudad = null;
        
        if (!empty($region)) {
            $stmt_region = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
            $stmt_region->bind_param("s", $region);
            $stmt_region->execute();
            $result_region = $stmt_region->get_result();
            if ($result_region->num_rows > 0) {
                $id_region = $result_region->fetch_assoc()['id_region'];
            }
        }
        
        if (!empty($ciudad) && $id_region) {
            $stmt_ciudad = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
            $stmt_ciudad->bind_param("si", $ciudad, $id_region);
            $stmt_ciudad->execute();
            $result_ciudad = $stmt_ciudad->get_result();
            if ($result_ciudad->num_rows > 0) {
                $id_ciudad = $result_ciudad->fetch_assoc()['id_ciudad'];
            }
        }
        
        // Verificar que el usuario existe y tiene permisos (Administrador o Secretaria)
        $stmt_user = $conn->prepare("
            SELECT u.id_usuario, r.nombre_rol
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
                'message' => 'Usuario no autorizado para registrar espacios'
            ];
        }
        
        // Verificar límites de suscripción antes de continuar
        $limite_check = verificarLimiteEspacio($conn, $id_administrador);
        if (!$limite_check['success']) {
            return $limite_check;
        }
        
        if (!$limite_check['puede_crear']) {
            return [
                'success' => false,
                'message' => "Has alcanzado el límite de espacios de tu suscripción '{$limite_check['suscripcion']}'. Espacios actuales: {$limite_check['espacios_actuales']}/{$limite_check['limite_espacios']}. Considera actualizar tu suscripción para crear más espacios."
            ];
        }
        
        $user_data = $result_user->fetch_assoc();
        $user_role = $user_data['nombre_rol'];
        
        // Si es una secretaria, usar su administrador asociado
        $id_administrador_final = $id_administrador;
        if ($user_role === 'Secretaria') {
            // Obtener el administrador asociado de la secretaria
            $stmt_admin = $conn->prepare("
                SELECT u.id_administrador_asociado 
                FROM usuarios u
                JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
                JOIN roles r ON ur.id_rol = r.id_rol
                WHERE u.id_usuario = ? AND r.nombre_rol = 'Secretaria' AND ur.estado = 'Activo'
            ");
            $stmt_admin->bind_param("i", $id_administrador);
            $stmt_admin->execute();
            $result_admin = $stmt_admin->get_result();
            
            if ($result_admin->num_rows === 0) {
                return [
                    'success' => false,
                    'message' => 'Secretaria no tiene administrador asociado'
                ];
            }
            
            $admin_data = $result_admin->fetch_assoc();
            $id_administrador_final = $admin_data['id_administrador_asociado'];
            
            if (!$id_administrador_final) {
                return [
                    'success' => false,
                    'message' => 'Secretaria no tiene administrador asociado'
                ];
            }
        }
        
        // Verificar que no existe un espacio con el mismo nombre para este administrador
        $stmt_duplicate = $conn->prepare("SELECT id_espacio FROM gestiondeespacio WHERE nombre_espacio = ? AND id_usuario = ?");
        $stmt_duplicate->bind_param("si", $nombre_espacio, $id_administrador_final);
        $stmt_duplicate->execute();
        $result_duplicate = $stmt_duplicate->get_result();
        
        if ($result_duplicate->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'Ya existe un espacio con ese nombre para este administrador'
            ];
        }
        
        // Procesar archivos de fotos
        $fotos = [];
        $foto_campos = ['foto1', 'foto2', 'foto3', 'foto4', 'foto5'];
        
        foreach ($foto_campos as $foto_campo) {
            if (isset($_FILES[$foto_campo]) && $_FILES[$foto_campo]['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES[$foto_campo];
                
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
                
                // Generar nombre único para cada archivo individualmente
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $timestamp = microtime(true); // Usar microtime para mayor precisión
                $random = mt_rand(1000, 9999); // Número aleatorio adicional
                $nombre_archivo = $foto_campo . '_' . uniqid() . '_' . $timestamp . '_' . $random . '.' . $extension;
                $ruta_destino = '../../frontend/styles/images/' . $nombre_archivo;
                
                // Crear directorio si no existe
                $directorio = dirname($ruta_destino);
                if (!is_dir($directorio)) {
                    mkdir($directorio, 0755, true);
                }
                
                // Mover archivo
                if (move_uploaded_file($file['tmp_name'], $ruta_destino)) {
                    // Generar URL completa para la imagen
                    $url_imagen = 'frontend/styles/images/' . $nombre_archivo;
                    $fotos[] = $url_imagen; // Cambio: ahora es un array simple para la nueva tabla
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
            // Insertar espacio en la base de datos
            $sql = "INSERT INTO gestiondeespacio (
                nombre_espacio, 
                tipo_espacio, 
                metros_cuadrados, 
                id_region,
                id_ciudad,
                direccion, 
                ubicacion_interna, 
                disponible, 
                id_usuario
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param(
                "ssdiisssi",
                $nombre_espacio,
                $tipo_espacio,
                $metros_cuadrados,
                $id_region,
                $id_ciudad,
                $direccion,
                $ubicacion_interna,
                $disponible,
                $id_administrador_final
            );
            
            if (!$stmt->execute()) {
                throw new Exception('Error al registrar el espacio: ' . $stmt->error);
            }
            
            $id_espacio = $conn->insert_id;
            
            // Insertar fotos en la tabla fotos_publicacion
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
                $equipamiento_data = json_decode($_POST['equipamiento'], true);
                
                if (is_array($equipamiento_data)) {
                    $sql_equipamiento = "INSERT INTO equipamiento (id_espacio, nombre_equipamiento, cantidad, descripcion, estado) VALUES (?, ?, ?, ?, ?)";
                    $stmt_equipamiento = $conn->prepare($sql_equipamiento);
                    
                    foreach ($equipamiento_data as $equipo) {
                        if (!empty($equipo['nombre']) && !empty($equipo['cantidad'])) {
                            // Preparar variables para bind_param
                            $descripcion = $equipo['descripcion'] ?? '';
                            $estado = $equipo['estado'] ?? 'Disponible';
                            
                            $stmt_equipamiento->bind_param(
                                "isiss",
                                $id_espacio,
                                $equipo['nombre'],
                                $equipo['cantidad'],
                                $descripcion,
                                $estado
                            );
                            
                            if (!$stmt_equipamiento->execute()) {
                                throw new Exception('Error al registrar equipamiento: ' . $stmt_equipamiento->error);
                            }
                            
                            $id_equipamiento = $conn->insert_id;
                            
                            // Insertar tipo de equipamiento si existe
                            if (!empty($equipo['tipo'])) {
                                $sql_tipo = "INSERT INTO tipo_equipamiento (id_equipamiento, nombre_tipo, descripcion) VALUES (?, ?, ?)";
                                $stmt_tipo = $conn->prepare($sql_tipo);
                                $descripcion_tipo = $equipo['descripcion_tipo'] ?? '';
                                
                                $stmt_tipo->bind_param("iss", $id_equipamiento, $equipo['tipo'], $descripcion_tipo);
                                
                                if (!$stmt_tipo->execute()) {
                                    throw new Exception('Error al registrar tipo de equipamiento: ' . $stmt_tipo->error);
                                }
                                $stmt_tipo->close();
                            }
                        }
                    }
                    $stmt_equipamiento->close();
                }
            }
            
            // Procesar horarios si existen
            if (isset($_POST['horarios']) && !empty($_POST['horarios'])) {
                $horarios_data = json_decode($_POST['horarios'], true);
                
                // Debug: Log de horarios recibidos
                error_log("Horarios recibidos: " . var_export($horarios_data, true));
                
                if (is_array($horarios_data)) {
                    $sql_horario = "INSERT INTO horario_espacios (id_espacio, nombre_dia, hora_inicio, hora_fin, fecha_inicio, fecha_termino, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)";
                    $stmt_horario = $conn->prepare($sql_horario);
                    
                    foreach ($horarios_data as $horario) {
                        // Debug: Log de cada horario
                        error_log("Procesando horario: " . var_export($horario, true));
                        
                        if (!empty($horario['nombre_dia']) && !empty($horario['hora_inicio']) && !empty($horario['hora_fin']) && !empty($horario['fecha_inicio']) && !empty($horario['fecha_termino'])) {
                            // Preparar variables para bind_param
                            $descripcion_horario = $horario['descripcion'] ?? '';
                            
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
                                throw new Exception('Error al registrar horario: ' . $stmt_horario->error);
                            }
                            
                            error_log("Horario insertado exitosamente");
                        } else {
                            error_log("Horario no cumple validaciones - campos vacíos");
                        }
                    }
                    $stmt_horario->close();
                } else {
                    error_log("Horarios no es un array válido");
                }
            } else {
                error_log("No se recibieron horarios o están vacíos");
            }
            
            // Incrementar contador de espacios
            $contador_result = incrementarContadorEspacio($conn, $id_administrador_final);
            if (!$contador_result['success']) {
                throw new Exception('Error al actualizar contador de espacios: ' . $contador_result['message']);
            }
            
            // Confirmar transacción
            $conn->commit();
            
            return [
                'success' => true,
                'message' => 'Espacio, equipamiento y horarios registrados correctamente',
                'id_espacio' => $id_espacio
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

// Función para obtener espacios de un administrador
function obtenerEspacios($conn) {
    try {
        if (!isset($_POST['id_administrador'])) {
            return [
                'success' => false,
                'message' => 'ID de administrador requerido'
            ];
        }
        
        $id_administrador = intval($_POST['id_administrador']);
        
        $sql = "SELECT 
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
        WHERE ge.id_usuario = ? 
        ORDER BY ge.fecha_creacion DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_administrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $espacios = [];
        while ($row = $result->fetch_assoc()) {
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

// Función para decrementar contador de espacios
function decrementarContadorEspacio($conn, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        $stmt = $conn->prepare("
            UPDATE contador_admin_espacios 
            SET total_espacios = GREATEST(total_espacios - 1, 0) 
            WHERE id_usuario = ?
        ");
        $stmt->bind_param('i', $id_administrador);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al decrementar contador de espacios');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Contador de espacios decrementado'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al decrementar contador: ' . $e->getMessage()];
    }
}

// Función para eliminar un espacio
function eliminarEspacio($conn) {
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
            // Eliminar espacio (las foreign keys CASCADE eliminarán automáticamente fotos, equipamiento y horarios)
            $stmt_delete = $conn->prepare("DELETE FROM gestiondeespacio WHERE id_espacio = ? AND id_usuario = ?");
            $stmt_delete->bind_param("ii", $id_espacio, $id_administrador);
            
            if (!$stmt_delete->execute()) {
                throw new Exception('Error al eliminar el espacio');
            }
            
            // Decrementar contador de espacios
            $contador_result = decrementarContadorEspacio($conn, $id_administrador);
            if (!$contador_result['success']) {
                throw new Exception('Error al actualizar contador de espacios: ' . $contador_result['message']);
            }
            
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
            case 'registrar_espacio':
                $result = registrarEspacio($conn);
                break;
                
            case 'actualizar_espacio':
                try {
                    if (!isset($_POST['id_espacio'])) { throw new Exception('ID de espacio requerido'); }
                    if (!isset($_POST['id_administrador'])) { throw new Exception('ID de administrador requerido'); }
                    $id_espacio = intval($_POST['id_espacio']);
                    $id_administrador = intval($_POST['id_administrador']);
                    $nombre_espacio = isset($_POST['nombre_espacio']) ? trim($_POST['nombre_espacio']) : '';
                    $tipo_espacio = isset($_POST['tipo_espacio']) ? trim($_POST['tipo_espacio']) : '';
                    $metros_cuadrados = isset($_POST['metros_cuadrados']) ? floatval($_POST['metros_cuadrados']) : 0;
                    $regionNombre = isset($_POST['region']) ? trim($_POST['region']) : '';
                    $ciudadNombre = isset($_POST['ciudad']) ? trim($_POST['ciudad']) : '';
                    $direccion = isset($_POST['direccion']) ? trim($_POST['direccion']) : '';
                    $ubicacion_interna = isset($_POST['ubicacion_interna']) ? trim($_POST['ubicacion_interna']) : null;
                    if ($nombre_espacio==='') throw new Exception('Nombre de espacio requerido');
                    if ($tipo_espacio==='') throw new Exception('Tipo de espacio requerido');
                    if ($metros_cuadrados<=0) throw new Exception('Metros cuadrados inválidos');
                    if ($regionNombre==='') throw new Exception('Región requerida');
                    if ($ciudadNombre==='') throw new Exception('Ciudad requerida');
                    if ($direccion==='') throw new Exception('Dirección requerida');
                    // Verificar que el espacio pertenece al administrador
                    $stmt_check = $conn->prepare('SELECT id_espacio FROM gestiondeespacio WHERE id_espacio = ? AND id_usuario = ?');
                    $stmt_check->bind_param('ii', $id_espacio, $id_administrador); $stmt_check->execute(); $rs_check = $stmt_check->get_result();
                    if (!$rs_check || $rs_check->num_rows===0) { $stmt_check->close(); throw new Exception('Espacio no encontrado o sin permisos'); }
                    $stmt_check->close();
                    // Resolver IDs de región/ciudad
                    $id_region = null; $id_ciudad = null;
                    $stmt = $conn->prepare('SELECT id_region FROM regiones WHERE nombre_region = ?');
                    $stmt->bind_param('s', $regionNombre); $stmt->execute(); $rs = $stmt->get_result();
                    if ($rs && $rs->num_rows>0){ $id_region = intval($rs->fetch_assoc()['id_region']); } $stmt->close();
                    if (!$id_region) throw new Exception('Región no válida');
                    $stmt = $conn->prepare('SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?');
                    $stmt->bind_param('si', $ciudadNombre, $id_region); $stmt->execute(); $rs = $stmt->get_result();
                    if ($rs && $rs->num_rows>0){ $id_ciudad = intval($rs->fetch_assoc()['id_ciudad']); } $stmt->close();
                    if (!$id_ciudad) throw new Exception('Ciudad no válida');
                    // Actualizar espacio
                    $stmt = $conn->prepare('UPDATE gestiondeespacio SET nombre_espacio=?, tipo_espacio=?, metros_cuadrados=?, id_region=?, id_ciudad=?, direccion=?, ubicacion_interna=? WHERE id_espacio=?');
                    $stmt->bind_param('ssdiissi', $nombre_espacio, $tipo_espacio, $metros_cuadrados, $id_region, $id_ciudad, $direccion, $ubicacion_interna, $id_espacio);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al actualizar espacio: '.$err); }
                    $stmt->close();
                    $result = ['success'=>true,'message'=>'Espacio actualizado correctamente'];
                } catch (Exception $e) {
                    $result = ['success'=>false,'message'=>$e->getMessage()];
                }
                break;
                
            case 'obtener_espacios':
                $result = obtenerEspacios($conn);
                break;

            case 'obtener_espacios_sistema':
                // Listar todos los espacios del sistema (sin filtrar por administrador)
                try {
                    $sql = "SELECT 
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
                        u_owner.id_usuario AS id_usuario_propietario,
                        u_owner.nombre AS propietario_nombre,
                        u_owner.apellido AS propietario_apellido,
                        COUNT(DISTINCT aec.id_asignacion) AS total_asignaciones
                    FROM gestiondeespacio ge
                    LEFT JOIN regiones r ON ge.id_region = r.id_region
                    LEFT JOIN ciudades c ON ge.id_ciudad = c.id_ciudad
                    LEFT JOIN usuarios u_owner ON ge.id_usuario = u_owner.id_usuario
                    LEFT JOIN asignacion_espacio_cliente aec ON ge.id_espacio = aec.id_espacio
                    GROUP BY ge.id_espacio, ge.nombre_espacio, ge.tipo_espacio, ge.metros_cuadrados, 
                             r.nombre_region, c.nombre_ciudad, ge.direccion, ge.ubicacion_interna, 
                             ge.disponible, ge.fecha_creacion, u_owner.id_usuario, u_owner.nombre, u_owner.apellido
                    ORDER BY ge.fecha_creacion DESC";
                    $res = $conn->query($sql);
                    if (!$res) { throw new Exception('Error en la consulta: ' . $conn->error); }
                    $espacios = [];
                    while ($row = $res->fetch_assoc()) { $espacios[] = $row; }
                    $result = ['success'=>true, 'espacios'=>$espacios];
                } catch (Exception $e) {
                    $result = ['success'=>false, 'message'=>'Error al obtener espacios: '.$e->getMessage()];
                }
                break;

            case 'obtener_publicaciones_sistema':
                // Listar todas las publicaciones de arriendo del sistema
                try {
                    $sql = "SELECT 
                        pa.id_publicacion,
                        pa.id_usuario,
                        pa.titulo,
                        pa.tipo_espacio,
                        pa.metros_cuadrados,
                        pa.direccion,
                        pa.precio_arriendo,
                        pa.estado,
                        pa.fecha_publicacion,
                        r.nombre_region,
                        c.nombre_ciudad,
                        u_owner.nombre AS propietario_nombre,
                        u_owner.apellido AS propietario_apellido
                    FROM publicararriendo pa
                    LEFT JOIN regiones r ON pa.id_region = r.id_region
                    LEFT JOIN ciudades c ON pa.id_ciudad = c.id_ciudad
                    LEFT JOIN usuarios u_owner ON pa.id_usuario = u_owner.id_usuario
                    ORDER BY pa.fecha_publicacion DESC";
                    $res = $conn->query($sql);
                    if (!$res) { throw new Exception('Error en la consulta: ' . $conn->error); }
                    $publicaciones = [];
                    while ($row = $res->fetch_assoc()) { $publicaciones[] = $row; }
                    $result = ['success'=>true, 'publicaciones'=>$publicaciones];
                } catch (Exception $e) {
                    $result = ['success'=>false, 'message'=>'Error al obtener publicaciones: '.$e->getMessage()];
                }
                break;

            case 'obtener_espacio_sistema_por_id':
                try {
                    if (!isset($_POST['id_espacio'])) { $result = ['success'=>false,'message'=>'ID de espacio requerido']; break; }
                    $id_espacio = intval($_POST['id_espacio']);
                    $stmt = $conn->prepare("SELECT 
                        ge.id_espacio,
                        ge.nombre_espacio,
                        ge.tipo_espacio,
                        ge.metros_cuadrados,
                        ge.id_region,
                        r.nombre_region,
                        ge.id_ciudad,
                        c.nombre_ciudad,
                        ge.direccion,
                        ge.ubicacion_interna,
                        ge.disponible,
                        ge.fecha_creacion,
                        u_owner.id_usuario AS id_usuario_propietario,
                        u_owner.nombre AS propietario_nombre,
                        u_owner.apellido AS propietario_apellido
                    FROM gestiondeespacio ge
                    LEFT JOIN regiones r ON ge.id_region = r.id_region
                    LEFT JOIN ciudades c ON ge.id_ciudad = c.id_ciudad
                    LEFT JOIN usuarios u_owner ON ge.id_usuario = u_owner.id_usuario
                    WHERE ge.id_espacio = ?");
                    $stmt->bind_param('i', $id_espacio);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    if ($res && $res->num_rows>0) {
                        $espacio = $res->fetch_assoc();
                        $stmt->close();
                        $result = ['success'=>true,'espacio'=>$espacio];
                    } else {
                        $stmt->close();
                        $result = ['success'=>false,'message'=>'Espacio no encontrado'];
                    }
                } catch (Exception $e) {
                    $result = ['success'=>false,'message'=>'Error al obtener espacio: '.$e->getMessage()];
                }
                break;

            case 'obtener_publicacion':
                try {
                    if (!isset($_POST['id_publicacion'])) {
                        $result = ['success'=>false,'message'=>'ID de publicación requerido'];
                        break;
                    }
                    $id_publicacion = intval($_POST['id_publicacion']);
                    $stmt = $conn->prepare("SELECT 
                        pa.id_publicacion,
                        pa.id_usuario,
                        pa.titulo,
                        pa.descripcion,
                        pa.id_region,
                        r.nombre_region,
                        pa.id_ciudad,
                        c.nombre_ciudad,
                        pa.direccion,
                        pa.metros_cuadrados,
                        pa.tipo_espacio,
                        pa.equipamiento,
                        pa.precio_arriendo,
                        pa.estado,
                        u_owner.nombre AS propietario_nombre,
                        u_owner.apellido AS propietario_apellido
                    FROM publicararriendo pa
                    LEFT JOIN regiones r ON pa.id_region = r.id_region
                    LEFT JOIN ciudades c ON pa.id_ciudad = c.id_ciudad
                    LEFT JOIN usuarios u_owner ON pa.id_usuario = u_owner.id_usuario
                    WHERE pa.id_publicacion = ?");
                    $stmt->bind_param('i', $id_publicacion);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    if ($res && $res->num_rows > 0){
                        $pub = $res->fetch_assoc();
                        $stmt->close();
                        $result = ['success'=>true,'publicacion'=>$pub];
                    } else {
                        $stmt->close();
                        $result = ['success'=>false,'message'=>'Publicación no encontrada'];
                    }
                } catch (Exception $e) {
                    $result = ['success'=>false,'message'=>'Error al obtener publicación: '.$e->getMessage()];
                }
                break;

            case 'actualizar_publicacion':
                try {
                    // Validaciones mínimas
                    if (!isset($_POST['id_publicacion'])) { throw new Exception('ID de publicación requerido'); }
                    $id_publicacion = intval($_POST['id_publicacion']);
                    $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : '';
                    $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                    $tipo_espacio = isset($_POST['tipo_espacio']) ? trim($_POST['tipo_espacio']) : '';
                    $metros_cuadrados = isset($_POST['metros_cuadrados']) ? floatval($_POST['metros_cuadrados']) : 0;
                    $regionNombre = isset($_POST['region']) ? trim($_POST['region']) : '';
                    $ciudadNombre = isset($_POST['ciudad']) ? trim($_POST['ciudad']) : '';
                    $direccion = isset($_POST['direccion']) ? trim($_POST['direccion']) : '';
                    $precio_arriendo = isset($_POST['precio_arriendo']) ? floatval($_POST['precio_arriendo']) : 0;
                    $estado = isset($_POST['estado']) ? trim($_POST['estado']) : 'Publicado';
                    $equipamiento = isset($_POST['equipamiento']) ? trim($_POST['equipamiento']) : null;

                    if ($titulo==='') throw new Exception('Título requerido');
                    if ($descripcion==='') throw new Exception('Descripción requerida');
                    if ($tipo_espacio==='') throw new Exception('Tipo de espacio requerido');
                    if ($metros_cuadrados<=0) throw new Exception('Metros cuadrados inválidos');
                    if ($regionNombre==='') throw new Exception('Región requerida');
                    if ($ciudadNombre==='') throw new Exception('Ciudad requerida');
                    if ($direccion==='') throw new Exception('Dirección requerida');
                    if ($precio_arriendo<=0) throw new Exception('Precio inválido');

                    // Resolver IDs de región/ciudad
                    $id_region = null; $id_ciudad = null;
                    $stmt = $conn->prepare('SELECT id_region FROM regiones WHERE nombre_region = ?');
                    $stmt->bind_param('s', $regionNombre); $stmt->execute(); $rs = $stmt->get_result();
                    if ($rs && $rs->num_rows>0){ $id_region = intval($rs->fetch_assoc()['id_region']); } $stmt->close();
                    if (!$id_region) throw new Exception('Región no válida');
                    $stmt = $conn->prepare('SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?');
                    $stmt->bind_param('si', $ciudadNombre, $id_region); $stmt->execute(); $rs = $stmt->get_result();
                    if ($rs && $rs->num_rows>0){ $id_ciudad = intval($rs->fetch_assoc()['id_ciudad']); } $stmt->close();
                    if (!$id_ciudad) throw new Exception('Ciudad no válida');

                    $stmt = $conn->prepare('UPDATE publicararriendo SET titulo=?, descripcion=?, id_region=?, id_ciudad=?, direccion=?, metros_cuadrados=?, tipo_espacio=?, equipamiento=?, precio_arriendo=?, estado=? WHERE id_publicacion=?');
                    $stmt->bind_param('ssissdssdsi', $titulo, $descripcion, $id_region, $id_ciudad, $direccion, $metros_cuadrados, $tipo_espacio, $equipamiento, $precio_arriendo, $estado, $id_publicacion);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al actualizar publicación: '.$err); }
                    $stmt->close();
                    $result = ['success'=>true,'message'=>'Publicación actualizada correctamente'];
                } catch (Exception $e) {
                    $result = ['success'=>false,'message'=>$e->getMessage()];
                }
                break;
                
            case 'eliminar_espacio':
                $result = eliminarEspacio($conn);
                break;

            case 'eliminar_publicacion':
                try {
                    if (!isset($_POST['id_publicacion'])) {
                        $result = ['success'=>false,'message'=>'ID de publicación requerido'];
                        break;
                    }
                    $id_publicacion = intval($_POST['id_publicacion']);
                    
                    // Iniciar transacción para eliminar en cascada
                    $conn->begin_transaction();
                    
                    try {
                        // PRIMERO: Eliminar todas las calificaciones asociadas
                        $stmtCalif = $conn->prepare('DELETE FROM calificacionespacio WHERE id_publicacion = ?');
                        $stmtCalif->bind_param('i', $id_publicacion);
                        $stmtCalif->execute();
                        $stmtCalif->close();
                        
                        // SEGUNDO: Eliminar todos los mensajes de consulta asociados
                        $stmtMensajes = $conn->prepare('DELETE FROM mensajesconsulta WHERE id_publicacion = ?');
                        $stmtMensajes->bind_param('i', $id_publicacion);
                        $stmtMensajes->execute();
                        $stmtMensajes->close();
                        
                        // TERCERO: Obtener y eliminar archivos de imagen asociados
                        $stmtFotos = $conn->prepare('SELECT url_imagen FROM fotos_publicacion WHERE id_publicacion = ?');
                        $stmtFotos->bind_param('i', $id_publicacion);
                        $stmtFotos->execute();
                        $resultFotos = $stmtFotos->get_result();
                        $directorioBase = '../';
                        while ($row = $resultFotos->fetch_assoc()) {
                            $ruta = $directorioBase . $row['url_imagen'];
                            if ($row['url_imagen'] && file_exists($ruta)) {
                                @unlink($ruta);
                            }
                        }
                        $stmtFotos->close();
                        
                        // CUARTO: Eliminar registros de fotos de la base de datos
                        $stmtDelFotos = $conn->prepare('DELETE FROM fotos_publicacion WHERE id_publicacion = ?');
                        $stmtDelFotos->bind_param('i', $id_publicacion);
                        $stmtDelFotos->execute();
                        $stmtDelFotos->close();
                        
                        // QUINTO: Eliminar la publicación (ÚLTIMO - después de eliminar todas las relaciones)
                        $stmt = $conn->prepare('DELETE FROM publicararriendo WHERE id_publicacion = ?');
                        $stmt->bind_param('i', $id_publicacion);
                        if (!$stmt->execute()) { throw new Exception('Error al eliminar publicación'); }
                        $af = $stmt->affected_rows; $stmt->close();
                        
                        // Confirmar transacción
                        $conn->commit();
                        
                        if ($af>0) $result = ['success'=>true,'message'=>'Publicación eliminada correctamente'];
                        else $result = ['success'=>false,'message'=>'Publicación no encontrada'];
                    } catch (Exception $e) {
                        // Revertir transacción en caso de error
                        $conn->rollback();
                        throw $e;
                    }
                } catch (Exception $e) {
                    $result = ['success'=>false,'message'=>'Error al eliminar publicación: '.$e->getMessage()];
                }
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
