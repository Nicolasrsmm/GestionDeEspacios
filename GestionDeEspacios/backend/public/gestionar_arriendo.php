<?php
// Deshabilitar mostrar errores en pantalla para evitar HTML en JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once '../config/db_config.php';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de configuración: ' . $e->getMessage()
    ]);
    exit;
}

// Función para validar sesión
function validarSesion($token) {
    try {
        $conn = getDBConnection();
        
        $stmt = $conn->prepare("\n            SELECT \n                s.id_usuario AS sesion_id_usuario,\n                u.id_usuario, u.nombre, u.apellido, u.telefono, u.rut_numero, u.rut_dv,\n                u.id_region, u.id_ciudad, u.direccion, u.id_administrador_asociado,\n                c.correo_electronico,\n                r.nombre_rol\n            FROM Sesion s\n            JOIN usuarios u ON s.id_usuario = u.id_usuario\n            JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'\n            JOIN roles r ON ur.id_rol = r.id_rol\n            LEFT JOIN credenciales c ON c.id_usuario = u.id_usuario\n            WHERE s.token_sesion = ?\n        ");
        
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $usuario = $result->fetch_assoc();
            // Mantener compatibilidad: id_administrador para operaciones en nombre del admin
            $usuario['id_administrador'] = $usuario['id_administrador_asociado'] ?: $usuario['id_usuario'];
            $usuario['rol'] = $usuario['nombre_rol'];
            $stmt->close();
            $conn->close();
            return $usuario;
        }
        
        $stmt->close();
        $conn->close();
        return false;
    } catch (Exception $e) {
        return false;
    }
}

// Función para subir imagen
function subirImagen($archivo, $directorio, $prefijo) {
    $extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif'];
    $tamañoMaximo = 5 * 1024 * 1024; // 5MB
    
    if ($archivo['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'Error al subir la imagen'];
    }
    
    if ($archivo['size'] > $tamañoMaximo) {
        return ['success' => false, 'message' => 'La imagen es demasiado grande. Máximo 5MB'];
    }
    
    $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, $extensionesPermitidas)) {
        return ['success' => false, 'message' => 'Formato de imagen no válido. Solo JPG, PNG y GIF'];
    }
    
    $nombreArchivo = $prefijo . '_' . uniqid() . '.' . $extension;
    $rutaCompleta = $directorio . $nombreArchivo;
    
    if (!file_exists($directorio)) {
        mkdir($directorio, 0755, true);
    }
    
    if (move_uploaded_file($archivo['tmp_name'], $rutaCompleta)) {
        return ['success' => true, 'filename' => $nombreArchivo];
    } else {
        return ['success' => false, 'message' => 'Error al guardar la imagen'];
    }
}

// Función para verificar que la tabla existe
function verificarTablaArriendo($conn) {
    $result = $conn->query("SHOW TABLES LIKE 'publicararriendo'");
    return $result->num_rows > 0;
}

// Función para verificar límite de publicaciones
function verificarLimitePublicacion($conn, $id_administrador) {
    // Obtener plan de la suscripción del administrador
    $stmt = $conn->prepare("\n        SELECT p.cantidad_espacios, p.nombre_plan\n        FROM usuarios u\n        JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion\n        JOIN planes p ON p.id_plan = s.id_plan\n        WHERE u.id_usuario = ? AND u.activo = 1\n    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'Administrador no encontrado o sin suscripción'];
    }
    
    $suscripcion = $result->fetch_assoc();
    $limite_publicaciones = $suscripcion['cantidad_espacios']; // Mismo límite que espacios
    
    // Obtener contador actual
    $stmt = $conn->prepare("\n        SELECT total_publicaciones FROM contador_admin_espacios \n        WHERE id_usuario = ?\n    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $publicaciones_actuales = 0;
    if ($result->num_rows > 0) {
        $contador = $result->fetch_assoc();
        $publicaciones_actuales = $contador['total_publicaciones'];
    }
    
    $puede_crear = $publicaciones_actuales < $limite_publicaciones;
    $publicaciones_disponibles = $limite_publicaciones - $publicaciones_actuales;
    
    return [
        'success' => true,
        'puede_crear' => $puede_crear,
        'publicaciones_actuales' => $publicaciones_actuales,
        'limite_publicaciones' => $limite_publicaciones,
        'publicaciones_disponibles' => $publicaciones_disponibles,
        'suscripcion' => $suscripcion['nombre_plan']
    ];
}

// Función para incrementar contador de publicaciones
function incrementarContadorPublicacion($conn, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        // Verificar si existe el contador
        $stmt = $conn->prepare("SELECT total_publicaciones FROM contador_admin_espacios WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_administrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Actualizar contador existente
            $stmt = $conn->prepare("
                UPDATE contador_admin_espacios 
                SET total_publicaciones = total_publicaciones + 1 
                WHERE id_usuario = ?
            ");
            $stmt->bind_param('i', $id_administrador);
        } else {
            // Crear nuevo contador
            $stmt = $conn->prepare("
                INSERT INTO contador_admin_espacios (id_usuario, total_publicaciones) 
                VALUES (?, 1)
            ");
            $stmt->bind_param('i', $id_administrador);
        }
        
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar contador de publicaciones');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Contador de publicaciones incrementado'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al incrementar contador: ' . $e->getMessage()];
    }
}

// Función para publicar arriendo
function publicarArriendo($datos, $archivos) {
    try {
        $conn = getDBConnection();
        
        // Verificar que la tabla existe
        if (!verificarTablaArriendo($conn)) {
            throw new Exception("La tabla 'publicararriendo' no existe. Ejecuta el script SQL para crearla.");
        }
        
        // Verificar límites de suscripción antes de continuar
        $limite_check = verificarLimitePublicacion($conn, $datos['id_usuario']);
        if (!$limite_check['success']) {
            throw new Exception($limite_check['message']);
        }
        
        if (!$limite_check['puede_crear']) {
            throw new Exception("Has alcanzado el límite de publicaciones de tu suscripción '{$limite_check['suscripcion']}'. Publicaciones actuales: {$limite_check['publicaciones_actuales']}/{$limite_check['limite_publicaciones']}. Considera actualizar tu suscripción para crear más publicaciones.");
        }
        
        $conn->begin_transaction();
        
        // Validar datos requeridos
        $camposRequeridos = ['titulo', 'descripcion', 'region', 'ciudad', 'direccion', 'metros_cuadrados', 'tipo_espacio', 'precio_arriendo'];
        foreach ($camposRequeridos as $campo) {
            if (empty($datos[$campo])) {
                throw new Exception("El campo $campo es requerido");
            }
        }
        
        // Validar longitud de campos
        if (strlen($datos['titulo']) > 100) {
            throw new Exception("El título no puede exceder 100 caracteres");
        }
        
        if (strlen($datos['direccion']) > 255) {
            throw new Exception("La dirección no puede exceder 255 caracteres");
        }
        
        // Validar valores numéricos
        if (!is_numeric($datos['metros_cuadrados']) || $datos['metros_cuadrados'] <= 0) {
            throw new Exception("Los metros cuadrados deben ser un número positivo");
        }
        
        if (!is_numeric($datos['precio_arriendo']) || $datos['precio_arriendo'] <= 0) {
            throw new Exception("El precio de arriendo debe ser un número positivo");
        }
        
        // Validar tipo de espacio
        $tiposPermitidos = ['Oficina', 'Local Comercial', 'Sala de Reuniones', 'Consultorio', 'Depósito', 'Bodega', 'Estacionamiento', 'Otro'];
        if (!in_array($datos['tipo_espacio'], $tiposPermitidos)) {
            throw new Exception("Tipo de espacio no válido");
        }
        
        // Mapear región y ciudad por nombre a IDs (tolerante a acentos/caso)
        $id_region = null; $id_ciudad = null;
        $regionesRes = $conn->query("SELECT id_region, nombre_region FROM regiones");
        $needleRegion = _normalize_string($datos['region'] ?? '');
        while ($row = $regionesRes->fetch_assoc()) {
            if (_normalize_string($row['nombre_region']) === $needleRegion) { $id_region = (int)$row['id_region']; break; }
        }
        if (!$id_region) { throw new Exception("Región no válida: " . ($datos['region'] ?? '')); }

        $stmtC = $conn->prepare("SELECT id_ciudad, nombre_ciudad FROM ciudades WHERE id_region = ?");
        $stmtC->bind_param('i', $id_region);
        $stmtC->execute();
        $resC = $stmtC->get_result();
        $needleCiudad = _normalize_string($datos['ciudad'] ?? '');
        while ($row = $resC->fetch_assoc()) {
            if (_normalize_string($row['nombre_ciudad']) === $needleCiudad) { $id_ciudad = (int)$row['id_ciudad']; break; }
        }
        $stmtC->close();
        if (!$id_ciudad) { throw new Exception("Ciudad no válida para la región seleccionada: " . ($datos['ciudad'] ?? '')); }

        if ($id_region <= 0 || $id_ciudad <= 0) {
            throw new Exception("IDs de región/ciudad inválidos (" . $id_region . ", " . $id_ciudad . ")");
        }

        // Directorio para imágenes
        $directorioImagenes = '../uploads/arriendos/';
        
        // Preparar variables para bind_param
        $equipamiento = $datos['equipamiento'] ?? '';
        
        // Insertar publicación de arriendo (sin columnas de fotos)
        $stmt = $conn->prepare("\n            INSERT INTO publicararriendo (\n                id_usuario, titulo, descripcion, id_region, id_ciudad, direccion, \n                metros_cuadrados, tipo_espacio, equipamiento, \n                precio_arriendo, estado, fecha_publicacion\n            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Publicado', NOW())\n        ");
        
        $stmt->bind_param("issiisdssd",
            $datos['id_usuario'],
            $datos['titulo'],
            $datos['descripcion'],
            $id_region,
            $id_ciudad,
            $datos['direccion'],
            $datos['metros_cuadrados'],
            $datos['tipo_espacio'],
            $equipamiento,
            $datos['precio_arriendo']
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Error al insertar la publicación: " . $stmt->error);
        }
        
        $idPublicacion = $conn->insert_id;

        // Subir e insertar fotos en fotos_publicacion
        if (!empty($_FILES)) {
            $directorioImagenes = '../uploads/arriendos/';
            for ($i = 1; $i <= 5; $i++) {
                $campoFoto = "foto$i";
                if (isset($_FILES[$campoFoto]) && $_FILES[$campoFoto]['error'] === UPLOAD_ERR_OK) {
                    $resultado = subirImagen($_FILES[$campoFoto], $directorioImagenes, "arriendo");
                    if ($resultado['success']) {
                        $url = 'uploads/arriendos/' . $resultado['filename'];
                        $stmtFoto = $conn->prepare("INSERT INTO fotos_publicacion (id_publicacion, url_imagen) VALUES (?, ?)");
                        $stmtFoto->bind_param('is', $idPublicacion, $url);
                        if (!$stmtFoto->execute()) {
                            throw new Exception('Error al registrar foto: ' . $stmtFoto->error);
                        }
                        $stmtFoto->close();
                    } else {
                        throw new Exception($resultado['message']);
                    }
                }
            }
        }
        
        // Incrementar contador de publicaciones
        $contador_result = incrementarContadorPublicacion($conn, $datos['id_usuario']);
        if (!$contador_result['success']) {
            throw new Exception('Error al actualizar contador de publicaciones: ' . $contador_result['message']);
        }
        
        $conn->commit();
        $stmt->close();
        $conn->close();
        
        return [
            'success' => true,
            'message' => 'Arriendo publicado exitosamente',
            'id_publicacion' => $idPublicacion
        ];
        
    } catch (Exception $e) {
        if (isset($conn)) {
            $conn->rollback();
            $conn->close();
        }
        return [
            'success' => false,
            'message' => $e->getMessage()
        ];
    }
}

// Función para obtener publicaciones de arriendo
function obtenerPublicacionesArriendo($idUsuario, $token = null) {
    try {
        $conn = getDBConnection();
        
        // Si se proporciona token, verificar permisos de secretaria
        if ($token) {
            $usuario = validarSesion($token);
            if (!$usuario) {
                $conn->close();
                return ['success' => false, 'message' => 'Sesión no válida'];
            }
            
            // Si es secretaria, verificar que puede ver los arriendos de su administrador
            if ($usuario['rol'] === 'Secretaria') {
                if ($usuario['id_administrador'] != $idUsuario) {
                    $conn->close();
                    return ['success' => false, 'message' => 'No tienes permisos para ver estos arriendos'];
                }
            } elseif ($usuario['rol'] === 'Administrador') {
                // Si es administrador, verificar que es el propietario
                if ($usuario['id_usuario'] != $idUsuario) {
                    $conn->close();
                    return ['success' => false, 'message' => 'No tienes permisos para ver estos arriendos'];
                }
            }
        }
        
        $stmt = $conn->prepare("
            SELECT 
                p.id_publicacion, p.titulo, p.descripcion, r.nombre_region AS region, ciu.nombre_ciudad AS ciudad, p.direccion,
                p.metros_cuadrados, p.tipo_espacio, p.equipamiento, p.precio_arriendo,
                p.estado, p.fecha_publicacion, p.fecha_finalizacion,
                (SELECT GROUP_CONCAT(fp.url_imagen ORDER BY fp.id_foto ASC SEPARATOR '|') FROM fotos_publicacion fp WHERE fp.id_publicacion = p.id_publicacion) AS fotos
            FROM publicararriendo p
            LEFT JOIN regiones r ON p.id_region = r.id_region
            LEFT JOIN ciudades ciu ON p.id_ciudad = ciu.id_ciudad
            WHERE p.id_usuario = ? 
            ORDER BY p.fecha_publicacion DESC
        ");
        
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $publicaciones = [];
        while ($row = $result->fetch_assoc()) {
            $publicaciones[] = $row;
        }
        
        $stmt->close();
        $conn->close();
        
        return [
            'success' => true,
            'publicaciones' => $publicaciones
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error al obtener publicaciones: ' . $e->getMessage()
        ];
    }
}

// Función para eliminar publicación de arriendo
function eliminarPublicacionArriendo($idPublicacion, $idUsuario, $token = null) {
    try {
        $conn = getDBConnection();
        
        // Si se proporciona token, verificar permisos de secretaria
        if ($token) {
            $usuario = validarSesion($token);
            if (!$usuario) {
                throw new Exception("Sesión no válida");
            }
            
            // Si es secretaria, verificar que puede eliminar los arriendos de su administrador
            if ($usuario['rol'] === 'Secretaria') {
                if ($usuario['id_administrador'] != $idUsuario) {
                    throw new Exception("No tienes permisos para eliminar esta publicación");
                }
            } elseif ($usuario['rol'] === 'Administrador') {
                // Si es administrador, verificar que es el propietario
                if ($usuario['id_usuario'] != $idUsuario) {
                    throw new Exception("No tienes permisos para eliminar esta publicación");
                }
            }
        }
        
        // Verificar que la publicación pertenece al usuario especificado
        $stmtCheck = $conn->prepare("SELECT id_publicacion FROM publicararriendo WHERE id_publicacion = ? AND id_usuario = ?");
        $stmtCheck->bind_param("ii", $idPublicacion, $idUsuario);
        $stmtCheck->execute();
        $resultCheck = $stmtCheck->get_result();
        if ($resultCheck->num_rows === 0) {
            throw new Exception("Publicación no encontrada o no tienes permisos para eliminarla");
        }
        $stmtCheck->close();

        // Iniciar transacción para eliminar en cascada
        $conn->begin_transaction();
        
        try {
            // PRIMERO: Eliminar todas las calificaciones asociadas
            $stmtCalif = $conn->prepare("DELETE FROM calificacionespacio WHERE id_publicacion = ?");
            $stmtCalif->bind_param("i", $idPublicacion);
            $stmtCalif->execute();
            $stmtCalif->close();
            
            // SEGUNDO: Eliminar todos los mensajes de consulta asociados
            $stmtMensajes = $conn->prepare("DELETE FROM mensajesconsulta WHERE id_publicacion = ?");
            $stmtMensajes->bind_param("i", $idPublicacion);
            $stmtMensajes->execute();
            $stmtMensajes->close();
            
            // TERCERO: Obtener y eliminar archivos de imagen asociados (tabla fotos_publicacion)
            $stmtFotos = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_publicacion = ?");
            $stmtFotos->bind_param("i", $idPublicacion);
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
            $stmtDelFotos = $conn->prepare("DELETE FROM fotos_publicacion WHERE id_publicacion = ?");
            $stmtDelFotos->bind_param("i", $idPublicacion);
            $stmtDelFotos->execute();
            $stmtDelFotos->close();
            
            // QUINTO: Eliminar la publicación (ÚLTIMO - después de eliminar todas las relaciones)
            $stmt = $conn->prepare("DELETE FROM publicararriendo WHERE id_publicacion = ? AND id_usuario = ?");
            $stmt->bind_param("ii", $idPublicacion, $idUsuario);
            
            if (!$stmt->execute()) {
                throw new Exception("Error al eliminar la publicación: " . $stmt->error);
            }
            
            $stmt->close();
            
            // Confirmar transacción
            $conn->commit();
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            throw $e;
        }
        
        $conn->close();
        
        return [
            'success' => true,
            'message' => 'Publicación eliminada exitosamente'
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => $e->getMessage()
        ];
    }
}

// Utilidad: normalizar cadenas (minúsculas, sin acentos, espacios colapsados)
function _normalize_string($s) {
    $s = trim((string)$s);
    $s = mb_strtolower($s, 'UTF-8');
    // Eliminar acentos
    $s2 = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
    if ($s2 !== false) { $s = $s2; }
    // Quitar caracteres no alfanuméricos salvo espacio
    $s = preg_replace('/[^a-z0-9\s]/', '', $s);
    // Colapsar espacios
    $s = preg_replace('/\s+/', ' ', $s);
    return trim($s);
}

// Procesar la petición con manejo de errores global
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_POST['action'] ?? $_GET['action'] ?? '';

    if ($method === 'POST' && $action === 'publicar_arriendo') {
    // Validar token de sesión
    $token = $_POST['token'] ?? '';
    
    // Debug: Log del token recibido
    error_log("Token recibido: " . ($token ? 'Presente' : 'Ausente'));
    
    $usuario = validarSesion($token);
    
    if (!$usuario) {
        echo json_encode([
            'success' => false,
            'message' => 'Sesión no válida o expirada',
            'debug' => [
                'token_presente' => !empty($token),
                'token_length' => strlen($token),
                'token_preview' => substr($token, 0, 10) . '...'
            ]
        ]);
        exit;
    }
    
    // Obtener datos del formulario
    // Usar id_administrador para secretarias, id_usuario para administradores
    $idUsuario = $usuario['id_administrador'] ?? $usuario['id_usuario'];
    
    $datos = [
        'id_usuario' => $idUsuario,
        'titulo' => trim($_POST['titulo'] ?? ''),
        'descripcion' => trim($_POST['descripcion'] ?? ''),
        'region' => $_POST['region'] ?? '',
        'ciudad' => $_POST['ciudad'] ?? '',
        'direccion' => trim($_POST['direccion'] ?? ''),
        'metros_cuadrados' => floatval($_POST['metros_cuadrados'] ?? 0),
        'tipo_espacio' => $_POST['tipo_espacio'] ?? '',
        'equipamiento' => trim($_POST['equipamiento'] ?? ''),
        'precio_arriendo' => floatval($_POST['precio_arriendo'] ?? 0)
    ];
    
    
    $resultado = publicarArriendo($datos, $_FILES);
    echo json_encode($resultado);
    
} elseif ($method === 'GET' && $action === 'obtener_publicaciones') {
    // Validar token de sesión
    $token = $_GET['token'] ?? '';
    $usuario = validarSesion($token);
    
    if (!$usuario) {
        echo json_encode([
            'success' => false,
            'message' => 'Sesión no válida o expirada'
        ]);
        exit;
    }
    
    // Si se proporciona id_usuario, usarlo; si no, usar el del usuario logueado
    $idUsuario = $_GET['id_usuario'] ?? $usuario['id_usuario'];
    $resultado = obtenerPublicacionesArriendo($idUsuario, $token);
    echo json_encode($resultado);
    
} elseif ($method === 'POST' && $action === 'editar_arriendo') {
    // Validar token de sesión
    $token = $_POST['token'] ?? '';
    $usuario = validarSesion($token);
    
    if (!$usuario) {
        echo json_encode([
            'success' => false,
            'message' => 'Sesión no válida o expirada'
        ]);
        exit;
    }
    
    $datos = [
        'id_publicacion' => intval($_POST['id_publicacion'] ?? 0),
        'titulo' => trim($_POST['titulo'] ?? ''),
        'descripcion' => trim($_POST['descripcion'] ?? ''),
        'region' => $_POST['region'] ?? '',
        'ciudad' => $_POST['ciudad'] ?? '',
        'direccion' => trim($_POST['direccion'] ?? ''),
        'metros_cuadrados' => floatval($_POST['metros_cuadrados'] ?? 0),
        'tipo_espacio' => $_POST['tipo_espacio'] ?? '',
        'equipamiento' => trim($_POST['equipamiento'] ?? ''),
        'precio_arriendo' => floatval($_POST['precio_arriendo'] ?? 0)
    ];
    
    // Usar id_administrador para secretarias, id_usuario para administradores
    $idUsuario = $usuario['id_administrador'] ?? $usuario['id_usuario'];
    $resultado = editarPublicacionArriendo($datos, $_FILES, $idUsuario, $token);
    echo json_encode($resultado);
    
    } elseif ($method === 'GET' && $action === 'obtener_fotos') {
        // Validar token de sesión
        $token = $_GET['token'] ?? '';
        $usuario = validarSesion($token);
        
        if (!$usuario) {
            echo json_encode([
                'success' => false,
                'message' => 'Sesión no válida o expirada'
            ]);
            exit;
        }
        
        $idPublicacion = intval($_GET['id_publicacion'] ?? 0);
        $resultado = obtenerFotosPublicacion($idPublicacion, $token);
        echo json_encode($resultado);

    } elseif ($method === 'POST' && $action === 'eliminar_publicacion') {
    // Validar token de sesión
    $token = $_POST['token'] ?? '';
    $usuario = validarSesion($token);
    
    if (!$usuario) {
        echo json_encode([
            'success' => false,
            'message' => 'Sesión no válida o expirada'
        ]);
        exit;
    }
    
    $idPublicacion = intval($_POST['id'] ?? 0);
    // Usar id_administrador para secretarias, id_usuario para administradores
    $idUsuario = $usuario['id_administrador'] ?? $usuario['id_usuario'];
    $resultado = eliminarPublicacionArriendo($idPublicacion, $idUsuario, $token);
    echo json_encode($resultado);
    
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Acción no válida'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error interno: ' . $e->getMessage()
    ]);
} catch (Error $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fatal: ' . $e->getMessage()
    ]);
}

// Función para obtener fotos de una publicación
function obtenerFotosPublicacion($idPublicacion, $token = null) {
    try {
        $conn = getDBConnection();
        // Validar sesión si se envía token
        $usuarioSesion = null;
        if ($token) {
            $usuarioSesion = validarSesion($token);
            if (!$usuarioSesion) {
                $conn->close();
                return ['success' => false, 'message' => 'Sesión no válida'];
            }
        }

        // Verificar que la publicación existe y obtener su propietario
        $stmt = $conn->prepare("SELECT id_usuario FROM publicararriendo WHERE id_publicacion = ?");
        $stmt->bind_param('i', $idPublicacion);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0) {
            $stmt->close();
            $conn->close();
            return ['success' => false, 'message' => 'Publicación no encontrada'];
        }
        $rowPub = $res->fetch_assoc();
        $stmt->close();

        // Autorización: Admin dueño o Secretaria de ese Admin
        if ($usuarioSesion) {
            $propietario = (int)$rowPub['id_usuario'];
            $rol = $usuarioSesion['rol'] ?? '';
            $idSesion = (int)($usuarioSesion['id_usuario'] ?? 0);
            $idAdminAsociado = (int)($usuarioSesion['id_administrador'] ?? 0);
            $permitido = false;
            if ($rol === 'Administrador' && $idSesion === $propietario) {
                $permitido = true;
            }
            if ($rol === 'Secretaria' && $idAdminAsociado === $propietario) {
                $permitido = true;
            }
            if (!$permitido) {
                $conn->close();
                return ['success' => false, 'message' => 'No tienes permisos para ver estas fotos'];
            }
        }

        // Obtener fotos
        $stmtF = $conn->prepare("SELECT id_foto, url_imagen FROM fotos_publicacion WHERE id_publicacion = ? ORDER BY id_foto ASC");
        $stmtF->bind_param('i', $idPublicacion);
        $stmtF->execute();
        $resF = $stmtF->get_result();
        $fotos = [];
        while ($row = $resF->fetch_assoc()) { $fotos[] = $row; }
        $stmtF->close();
        $conn->close();
        return ['success' => true, 'fotos' => $fotos];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al obtener fotos: ' . $e->getMessage()];
    }
}
// Función para editar publicación de arriendo
function editarPublicacionArriendo($datos, $archivos, $idUsuario, $token = null) {
    try {
        $conn = getDBConnection();
        
        // Verificar que la tabla existe
        if (!verificarTablaArriendo($conn)) {
            throw new Exception("La tabla 'publicararriendo' no existe. Ejecuta el script SQL para crearla.");
        }
        
        $conn->begin_transaction();
        
        // Validar datos requeridos
        $camposRequeridos = ['id_publicacion', 'titulo', 'descripcion', 'region', 'ciudad', 'direccion', 'metros_cuadrados', 'tipo_espacio', 'precio_arriendo'];
        foreach ($camposRequeridos as $campo) {
            if (empty($datos[$campo])) {
                throw new Exception("El campo $campo es requerido");
            }
        }
        
        // Si se proporciona token, verificar permisos de secretaria
        if ($token) {
            $usuario = validarSesion($token);
            if (!$usuario) {
                throw new Exception("Sesión no válida");
            }
            
            // Si es secretaria, verificar que puede editar los arriendos de su administrador
            if ($usuario['rol'] === 'Secretaria') {
                if ($usuario['id_administrador'] != $idUsuario) {
                    throw new Exception("No tienes permisos para editar esta publicación");
                }
            } elseif ($usuario['rol'] === 'Administrador') {
                // Si es administrador, verificar que es el propietario
                if ($usuario['id_usuario'] != $idUsuario) {
                    throw new Exception("No tienes permisos para editar esta publicación");
                }
            }
        }
        
        // Verificar que la publicación pertenece al usuario especificado
        $stmt = $conn->prepare("SELECT id_publicacion FROM publicararriendo WHERE id_publicacion = ? AND id_usuario = ?");
        $stmt->bind_param("ii", $datos['id_publicacion'], $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("No tienes permisos para editar esta publicación");
        }
        
        // Validar longitud de campos
        if (strlen($datos['titulo']) > 100) {
            throw new Exception("El título no puede exceder 100 caracteres");
        }
        
        if (strlen($datos['direccion']) > 255) {
            throw new Exception("La dirección no puede exceder 255 caracteres");
        }
        
        // Validar valores numéricos
        if (!is_numeric($datos['metros_cuadrados']) || $datos['metros_cuadrados'] <= 0) {
            throw new Exception("Los metros cuadrados deben ser un número positivo");
        }
        
        if (!is_numeric($datos['precio_arriendo']) || $datos['precio_arriendo'] <= 0) {
            throw new Exception("El precio de arriendo debe ser un número positivo");
        }
        
        // Validar tipo de espacio
        $tiposPermitidos = ['Oficina', 'Local Comercial', 'Sala de Reuniones', 'Consultorio', 'Depósito', 'Bodega', 'Estacionamiento', 'Otro'];
        if (!in_array($datos['tipo_espacio'], $tiposPermitidos)) {
            throw new Exception("Tipo de espacio no válido");
        }
        
        // Directorio para imágenes
        $directorioImagenes = '../uploads/arriendos/';
        
        // Obtener fotos actuales
        $stmt = $conn->prepare("SELECT id_foto, url_imagen FROM fotos_publicacion WHERE id_publicacion = ? ORDER BY id_foto ASC");
        $stmt->bind_param("i", $datos['id_publicacion']);
        $stmt->execute();
        $fotosActualesRes = $stmt->get_result();
        $fotosActuales = [];
        while ($row = $fotosActualesRes->fetch_assoc()) { $fotosActuales[] = $row; }
        $stmt->close();

        // Procesar eliminación de fotos por slot si se indica (remove_foto1..remove_foto5)
        if (!empty($fotosActuales)) {
            for ($i = 1; $i <= 5; $i++) {
                $campoRemove = "remove_foto$i";
                if (isset($_POST[$campoRemove]) && $_POST[$campoRemove] === 'true') {
                    $idx = $i - 1;
                    if (isset($fotosActuales[$idx])) {
                        $fotoRow = $fotosActuales[$idx];
                        // Eliminar archivo físico
                        $ruta = '../' . $fotoRow['url_imagen'];
                        if ($fotoRow['url_imagen'] && file_exists($ruta)) { @unlink($ruta); }
                        // Eliminar fila específica
                        $stmtDel = $conn->prepare("DELETE FROM fotos_publicacion WHERE id_foto = ?");
                        $stmtDel->bind_param('i', $fotoRow['id_foto']);
                        if (!$stmtDel->execute()) { throw new Exception('Error eliminando foto: ' . $stmtDel->error); }
                        $stmtDel->close();
                    }
                }
            }
        }

        // Subir nuevas imágenes si existen e insertarlas
        $directorioImagenes = '../uploads/arriendos/';
        for ($i = 1; $i <= 5; $i++) {
            $campoFoto = "foto$i";
            if (isset($archivos[$campoFoto]) && $archivos[$campoFoto]['error'] === UPLOAD_ERR_OK) {
                $resultado = subirImagen($archivos[$campoFoto], $directorioImagenes, "arriendo");
                if ($resultado['success']) {
                    $url = 'uploads/arriendos/' . $resultado['filename'];
                    $stmtFoto = $conn->prepare("INSERT INTO fotos_publicacion (id_publicacion, url_imagen) VALUES (?, ?)");
                    $stmtFoto->bind_param('is', $datos['id_publicacion'], $url);
                    if (!$stmtFoto->execute()) { throw new Exception('Error al registrar foto: ' . $stmtFoto->error); }
                    $stmtFoto->close();
                } else {
                    throw new Exception($resultado['message']);
                }
            }
        }

        // Preparar variables para bind_param
        $equipamiento = $datos['equipamiento'] ?? '';
        
        // Mapear región y ciudad por nombre a IDs (tolerante a acentos/caso)
        $id_region = null; $id_ciudad = null;
        $regionesRes = $conn->query("SELECT id_region, nombre_region FROM regiones");
        $needleRegion = _normalize_string($datos['region'] ?? '');
        while ($row = $regionesRes->fetch_assoc()) {
            if (_normalize_string($row['nombre_region']) === $needleRegion) { $id_region = (int)$row['id_region']; break; }
        }
        if (!$id_region) { error_log('[EditarArriendo] Región no válida (normalize): ' . ($datos['region'] ?? '')); throw new Exception("Región no válida: " . ($datos['region'] ?? '')); }
        error_log('[EditarArriendo] Región mapeada OK (normalize): ' . $datos['region'] . ' -> id_region=' . $id_region);

        $stmtC = $conn->prepare("SELECT id_ciudad, nombre_ciudad FROM ciudades WHERE id_region = ?");
        $stmtC->bind_param('i', $id_region);
        $stmtC->execute();
        $resC = $stmtC->get_result();
        $needleCiudad = _normalize_string($datos['ciudad'] ?? '');
        while ($row = $resC->fetch_assoc()) {
            if (_normalize_string($row['nombre_ciudad']) === $needleCiudad) { $id_ciudad = (int)$row['id_ciudad']; break; }
        }
        $stmtC->close();
        if (!$id_ciudad) { error_log('[EditarArriendo] Ciudad no válida (normalize): ' . ($datos['ciudad'] ?? '') . ' para id_region=' . $id_region); throw new Exception("Ciudad no válida para la región seleccionada: " . ($datos['ciudad'] ?? '')); }
        error_log('[EditarArriendo] Ciudad mapeada OK (normalize): ' . $datos['ciudad'] . ' -> id_ciudad=' . $id_ciudad);

        // Actualizar publicación de arriendo (sin columnas de fotos)
        $stmt = $conn->prepare("\n            UPDATE publicararriendo SET \n                titulo = ?, descripcion = ?, id_region = ?, id_ciudad = ?, direccion = ?, \n                metros_cuadrados = ?, tipo_espacio = ?, equipamiento = ?, \n                precio_arriendo = ?\n            WHERE id_publicacion = ? AND id_usuario = ?\n        ");
        
        $stmt->bind_param("ssiisdssdii",
            $datos['titulo'],
            $datos['descripcion'],
            $id_region,
            $id_ciudad,
            $datos['direccion'],
            $datos['metros_cuadrados'],
            $datos['tipo_espacio'],
            $equipamiento,
            $datos['precio_arriendo'],
            $datos['id_publicacion'],
            $idUsuario
        );
        
        if (!$stmt->execute()) {
            error_log('[EditarArriendo] Error execute UPDATE: ' . $stmt->error);
            throw new Exception("Error al actualizar la publicación: " . $stmt->error);
        }
        
        $conn->commit();
        $stmt->close();
        $conn->close();
        
        return [
            'success' => true,
            'message' => 'Publicación actualizada exitosamente'
        ];
        
    } catch (Exception $e) {
        if (isset($conn)) {
            $conn->rollback();
            $conn->close();
        }
        
        return [
            'success' => false,
            'message' => 'Error al actualizar la publicación: ' . $e->getMessage(),
            'debug' => [
                'region_input' => $datos['region'] ?? null,
                'ciudad_input' => $datos['ciudad'] ?? null,
                'id_region_resuelto' => $id_region ?? null,
                'id_ciudad_resuelto' => $id_ciudad ?? null,
                'id_publicacion' => $datos['id_publicacion'] ?? null,
                'id_usuario' => $idUsuario ?? null
            ]
        ];
    }
}
?>
