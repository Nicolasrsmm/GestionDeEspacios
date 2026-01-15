<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db_config.php';
// Nota: NO incluir sesion.php porque ejecuta lógica y puede responder/terminar el script.
// Implementamos una verificación local de sesión equivalente.

$conn = null;

function verificarSesionLocal(mysqli $conn, string $token): array {
    $sql = "SELECT 
                s.id_sesion,
                s.id_usuario,
                s.fecha_inicio
            FROM Sesion s
            WHERE s.token_sesion = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return ['success' => false, 'message' => 'Error de servidor'];
    }
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows > 0) {
        $sesion = $res->fetch_assoc();
        $stmt->close();
        // Resolver todos los roles activos
        $stmt2 = $conn->prepare("SELECT r.nombre_rol FROM usuario_rol ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = ? AND ur.estado = 'Activo'");
        $stmt2->bind_param('i', $sesion['id_usuario']);
        $stmt2->execute();
        $res2 = $stmt2->get_result();
        $roles = [];
        while ($rol = $res2->fetch_assoc()) {
            $roles[] = $rol['nombre_rol'];
        }
        $stmt2->close();
        $sesion['roles'] = $roles;
        return ['success' => true, 'sesion' => $sesion];
    }
    $stmt->close();
    return ['success' => false, 'message' => 'Sesión no válida o expirada'];
}

try {
    $conn = getDBConnection();
    if ($conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    error_log('[envioreportes] method=' . $method . ' content-type=' . $ct);
    // Si llega con método extraño pero hay POST data, tratar como POST
    if ($method !== 'POST' && !empty($_POST)) {
        error_log('[envioreportes] forcing method POST due to non-empty $_POST');
        $method = 'POST';
    }

    if ($method === 'POST') {
        // Aceptar JSON o form-url-encoded
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $token = '';
        $titulo = '';
        $contenido = '';
        $id_asignacion = 0;

        if (stripos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true) ?: [];
            $token = $data['token'] ?? '';
            $titulo = trim($data['titulo'] ?? '');
            $contenido = trim($data['contenido'] ?? '');
            $id_asignacion = intval($data['id_asignacion'] ?? 0);
        } else {
            $token = $_POST['token'] ?? '';
            $titulo = trim($_POST['titulo'] ?? '');
            $contenido = trim($_POST['contenido'] ?? '');
            $id_asignacion = intval($_POST['id_asignacion'] ?? 0);
            error_log('[envioreportes] $_POST keys: ' . implode(',', array_keys($_POST)));
        }

        if (!$token) {
            echo json_encode(['success' => false, 'message' => 'Token requerido']);
            exit;
        }

        $sesion = verificarSesionLocal($conn, $token);
        if (!$sesion['success']) {
            echo json_encode(['success' => false, 'message' => $sesion['message']]);
            exit;
        }

        $id_cliente = intval($sesion['sesion']['id_usuario']);

        if ($id_asignacion <= 0 || $titulo === '' || $contenido === '') {
            echo json_encode(['success' => false, 'message' => 'Faltan datos: asignación, título y contenido son obligatorios']);
            exit;
        }

        // Verificar que la asignación pertenezca al cliente y obtener info básica
        $sqlVerif = "SELECT a.id_asignacion, a.id_espacio
                      FROM asignacion_espacio_cliente a
                      WHERE a.id_asignacion = ? AND a.id_usuario = ?";
        $stmtV = $conn->prepare($sqlVerif);
        $stmtV->bind_param('ii', $id_asignacion, $id_cliente);
        $stmtV->execute();
        $resV = $stmtV->get_result();
        if ($resV->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'No autorizado para reportar esta asignación']);
            exit;
        }
        $stmtV->close();

        // Insertar reporte
        $sqlIns = "INSERT INTO envioreportes (id_asignacion, titulo, contenido) VALUES (?, ?, ?)";
        $stmtI = $conn->prepare($sqlIns);
        $stmtI->bind_param('iss', $id_asignacion, $titulo, $contenido);
        if (!$stmtI->execute()) {
            echo json_encode(['success' => false, 'message' => 'No se pudo enviar el reporte']);
            exit;
        }
        $nuevoId = $stmtI->insert_id;
        $stmtI->close();

        echo json_encode(['success' => true, 'message' => 'Reporte enviado correctamente', 'id_reporte' => $nuevoId]);
        exit;
    }

    if ($method === 'GET' || $method === 'HEAD') {
        // Listar reportes del cliente autenticado (opcional)
        $token = $_GET['token'] ?? '';
        if (!$token) {
            echo json_encode(['success' => false, 'message' => 'Token requerido']);
            exit;
        }
        $sesion = verificarSesionLocal($conn, $token);
        if (!$sesion['success']) {
            echo json_encode(['success' => false, 'message' => $sesion['message']]);
            exit;
        }
        $id_cliente = intval($sesion['sesion']['id_usuario']);

        $sql = "SELECT r.id_reporte, r.id_asignacion, r.titulo, r.contenido, r.estado, r.respuesta_admin, r.fecha_creacion, r.fecha_respuesta,
                       e.id_espacio, ge.nombre_espacio
                FROM envioreportes r
                JOIN asignacion_espacio_cliente e ON e.id_asignacion = r.id_asignacion
                LEFT JOIN gestiondeespacio ge ON ge.id_espacio = e.id_espacio
                WHERE e.id_usuario = ?
                ORDER BY r.fecha_creacion DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $id_cliente);
        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        while ($row = $res->fetch_assoc()) {
            $rows[] = $row;
        }
        $stmt->close();

        echo json_encode(['success' => true, 'reportes' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Método no soportado', 'method' => $method]);
} catch (Exception $ex) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor', 'error' => $ex->getMessage()]);
} finally {
    if ($conn) { $conn->close(); }
}
?>


