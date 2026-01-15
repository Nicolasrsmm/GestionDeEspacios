<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function validarSesionPorToken($conn, $token) {
    $stmt = $conn->prepare("SELECT s.id_usuario FROM Sesion s WHERE s.token_sesion = ?");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        $stmt->close();
        return null;
    }
    $row = $result->fetch_assoc();
    $stmt->close();
    // Obtener todos los roles activos
    $stmt2 = $conn->prepare("SELECT r.nombre_rol FROM usuario_rol ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = ? AND ur.estado = 'Activo'");
    $stmt2->bind_param('i', $row['id_usuario']);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    $roles = [];
    while ($rol = $res2->fetch_assoc()) {
        $roles[] = $rol['nombre_rol'];
    }
    $stmt2->close();
    return ['id_usuario' => $row['id_usuario'], 'roles' => $roles];
}

try {
    $conn = getDBConnection();

    $token = $_GET['token'] ?? '';
    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Token requerido']);
        $conn->close();
        exit;
    }

    $sesion = validarSesionPorToken($conn, $token);
    if (!$sesion) {
        echo json_encode(['success' => false, 'message' => 'Sesión no válida o expirada']);
        $conn->close();
        exit;
    }

    // Solo clientes pueden ver espacios disponibles
    if (!in_array('Cliente', $sesion['roles'] ?? [])) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        $conn->close();
        exit;
    }

    // Verificar si es una petición para obtener imágenes o detalles
    $action = $_GET['action'] ?? 'listar';
    
    if ($action === 'obtener_detalles') {
        $id_espacio = intval($_GET['id_espacio'] ?? 0);
        
        if ($id_espacio <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de espacio inválido']);
            $conn->close();
            exit;
        }
        
        // Obtener detalles del espacio
        $stmt = $conn->prepare("
            SELECT 
                pa.id_publicacion, pa.titulo, pa.tipo_espacio, pa.metros_cuadrados,
                r.nombre_region AS region, c.nombre_ciudad AS ciudad, pa.direccion, 
                pa.equipamiento AS ubicacion_interna, pa.precio_arriendo AS precio,
                u_admin.nombre AS admin_nombre, u_admin.apellido AS admin_apellido,
                pa.descripcion
            FROM publicararriendo pa
            LEFT JOIN regiones r ON pa.id_region = r.id_region
            LEFT JOIN ciudades c ON pa.id_ciudad = c.id_ciudad
            JOIN usuarios u_admin ON pa.id_usuario = u_admin.id_usuario
            WHERE pa.id_publicacion = ? AND pa.estado = 'Publicado'
        ");
        $stmt->bind_param('i', $id_espacio);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Espacio no encontrado']);
            $stmt->close();
            $conn->close();
            exit;
        }
        
        $espacio = $result->fetch_assoc();
        $stmt->close();
        
        // Obtener la primera imagen del espacio
        $stmtImg = $conn->prepare("
            SELECT url_imagen 
            FROM fotos_publicacion 
            WHERE id_publicacion = ? 
            ORDER BY id_foto ASC 
            LIMIT 1
        ");
        $stmtImg->bind_param('i', $id_espacio);
        $stmtImg->execute();
        $resultImg = $stmtImg->get_result();
        
        if ($resultImg->num_rows > 0) {
            $imagen = $resultImg->fetch_assoc();
            $espacio['imagen'] = $imagen['url_imagen'];
            error_log("Debug: Imagen encontrada: " . $imagen['url_imagen']);
        } else {
            $espacio['imagen'] = null;
            error_log("Debug: No se encontró imagen para el espacio ID: " . $id_espacio);
        }
        $stmtImg->close();
        
        error_log("Debug: Espacio completo: " . json_encode($espacio));
        
        echo json_encode([
            'success' => true,
            'espacio' => $espacio
        ], JSON_UNESCAPED_UNICODE);
        
        $conn->close();
        exit;
    }
    
    if ($action === 'obtener_imagenes') {
        $id_espacio = intval($_GET['id_espacio'] ?? 0);
        
        if ($id_espacio <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de espacio inválido']);
            $conn->close();
            exit;
        }
        
        // Obtener imágenes del espacio
        $stmt = $conn->prepare("
            SELECT fp.url_imagen, pa.titulo 
            FROM fotos_publicacion fp 
            JOIN publicararriendo pa ON fp.id_publicacion = pa.id_publicacion 
            WHERE pa.id_publicacion = ? 
            ORDER BY fp.id_foto ASC
        ");
        $stmt->bind_param('i', $id_espacio);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $imagenes = [];
        $nombre_espacio = '';
        
        while ($row = $result->fetch_assoc()) {
            $imagenes[] = $row['url_imagen'];
            if (empty($nombre_espacio)) {
                $nombre_espacio = $row['titulo'];
            }
        }
        $stmt->close();
        
        echo json_encode([
            'success' => true,
            'imagenes' => $imagenes,
            'nombre_espacio' => $nombre_espacio
        ], JSON_UNESCAPED_UNICODE);
        
        $conn->close();
        exit;
    }

    // Obtener parámetros de filtro
    $region = $_GET['region'] ?? '';
    $ciudad = $_GET['ciudad'] ?? '';
    $tipo = $_GET['tipo'] ?? '';
    $metros = $_GET['metros'] ?? '';

    // Construir la consulta base - usar publicararriendo como tabla principal
    // Excluir espacios publicados por el usuario logueado
    $sql = "SELECT DISTINCT
                pa.id_publicacion, pa.titulo AS nombre_espacio, pa.tipo_espacio, pa.metros_cuadrados,
                r.nombre_region AS region, c.nombre_ciudad AS ciudad, pa.direccion, pa.equipamiento AS ubicacion_interna,
                u_admin.id_usuario AS id_administrador, u_admin.nombre AS admin_nombre, u_admin.apellido AS admin_apellido,
                pa.precio_arriendo, pa.descripcion
            FROM publicararriendo pa
            LEFT JOIN regiones r ON pa.id_region = r.id_region
            LEFT JOIN ciudades c ON pa.id_ciudad = c.id_ciudad
            JOIN usuarios u_admin ON pa.id_usuario = u_admin.id_usuario
            WHERE pa.estado = 'Publicado' AND pa.id_usuario != ?";

    // Agregar el ID del usuario logueado como primer parámetro
    $params = [$sesion['id_usuario']];
    $types = 'i';

    // Aplicar filtros
    if (!empty($region)) {
        $sql .= " AND pa.id_region = ?";
        $params[] = intval($region);
        $types .= 'i';
    }

    if (!empty($ciudad)) {
        $sql .= " AND pa.id_ciudad = ?";
        $params[] = intval($ciudad);
        $types .= 'i';
    }

    if (!empty($tipo)) {
        $sql .= " AND pa.tipo_espacio = ?";
        $params[] = $tipo;
        $types .= 's';
    }

    if (!empty($metros)) {
        switch ($metros) {
            case '0-50':
                $sql .= " AND pa.metros_cuadrados BETWEEN 0 AND 50";
                break;
            case '51-100':
                $sql .= " AND pa.metros_cuadrados BETWEEN 51 AND 100";
                break;
            case '101-200':
                $sql .= " AND pa.metros_cuadrados BETWEEN 101 AND 200";
                break;
            case '201+':
                $sql .= " AND pa.metros_cuadrados >= 201";
                break;
        }
    }

    $sql .= " ORDER BY pa.titulo ASC";

    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $espacios = [];
    while ($row = $result->fetch_assoc()) {
        // Obtener primera foto de la publicación
        $stmtF = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_publicacion = ? ORDER BY id_foto ASC LIMIT 1");
        $idPub = intval($row['id_publicacion']);
        $stmtF->bind_param('i', $idPub);
        $stmtF->execute();
        $resF = $stmtF->get_result();
        $row['foto1'] = $resF->num_rows ? $resF->fetch_assoc()['url_imagen'] : null;
        $stmtF->close();

        // Contar fotos de la publicación
        $stmtCnt = $conn->prepare("SELECT COUNT(*) AS total FROM fotos_publicacion WHERE id_publicacion = ?");
        $stmtCnt->bind_param('i', $idPub);
        $stmtCnt->execute();
        $resCnt = $stmtCnt->get_result();
        $row['num_fotos'] = $resCnt->num_rows ? intval($resCnt->fetch_assoc()['total']) : 0;
        $stmtCnt->close();

        // Agregar id_espacio para compatibilidad con el frontend
        $row['id_espacio'] = $row['id_publicacion'];

        $espacios[] = $row;
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'espacios' => $espacios
    ]);

    $conn->close();
    exit;

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    exit;
}
?>
