<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

// Función para generar token de sesión
function generarTokenSesion() {
    return bin2hex(random_bytes(32));
}

// Función para crear sesión
function crearSesion($conn, $tipo_usuario, $id_usuario) {
    $token = generarTokenSesion();
    
    $sql = "INSERT INTO Sesion (id_usuario, token_sesion) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('is', $id_usuario, $token);
    
    if ($stmt->execute()) {
        $id_sesion = $conn->insert_id;
        $stmt->close();
        return ['success' => true, 'token' => $token, 'id_sesion' => $id_sesion];
    } else {
        $stmt->close();
        return ['success' => false, 'message' => 'Error al crear sesión: ' . $conn->error];
    }
}

// Función para cerrar sesión (eliminar registro)
function cerrarSesion($conn, $token) {
    $stmt = $conn->prepare("DELETE FROM Sesion WHERE token_sesion = ?");
    $stmt->bind_param('s', $token);
    
    if ($stmt->execute()) {
        $affected_rows = $stmt->affected_rows;
        $stmt->close();
        if ($affected_rows > 0) {
            return ['success' => true, 'message' => 'Sesión eliminada correctamente'];
        } else {
            return ['success' => false, 'message' => 'No se encontró la sesión'];
        }
    } else {
        $stmt->close();
        return ['success' => false, 'message' => 'Error al cerrar sesión: ' . $conn->error];
    }
}

// Función para contar sesiones en tabla Sesion
function contarSesiones($conn) {
    $resTotal = $conn->query("SELECT COUNT(*) AS total FROM Sesion");
    $total = 0;
    if ($resTotal) { $row = $resTotal->fetch_assoc(); $total = intval($row['total'] ?? 0); }
    $resActivos = $conn->query("SELECT COUNT(DISTINCT id_usuario) AS activos FROM Sesion");
    $activos = 0;
    if ($resActivos) { $rowA = $resActivos->fetch_assoc(); $activos = intval($rowA['activos'] ?? 0); }
    return ['success' => true, 'total' => $total, 'activos' => $activos];
}

// Función para verificar sesión activa
function verificarSesion($conn, $token) {
    $stmt = $conn->prepare("
        SELECT 
            s.id_sesion, 
            s.id_usuario, 
            s.fecha_inicio,
            r.nombre_rol,
            ur.id_rol
        FROM Sesion s
        JOIN usuarios u ON s.id_usuario = u.id_usuario
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE s.token_sesion = ? 
        AND u.activo = 1 
        AND ur.estado = 'Activo'
    ");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $sesion = $result->fetch_assoc();
        $stmt->close();
        
        $sesion['tipo_usuario'] = strtolower($sesion['nombre_rol']);
        
        return ['success' => true, 'sesion' => $sesion];
    } else {
        $stmt->close();
        return ['success' => false, 'message' => 'Sesión no válida o expirada'];
    }
}

// Manejar diferentes métodos HTTP
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    // Crear nueva sesión
    if (isset($data['action']) && $data['action'] === 'crear') {
        $conn = getDBConnection();
        
        if (!isset($data['tipo_usuario']) || !isset($data['id_usuario'])) {
            echo json_encode(['success' => false, 'message' => 'Faltan parámetros requeridos']);
            exit;
        }
        
        $resultado = crearSesion($conn, $data['tipo_usuario'], $data['id_usuario']);
        echo json_encode($resultado);
        $conn->close();
        exit;
    }
    
    // Cerrar sesión
    if (isset($data['action']) && $data['action'] === 'cerrar') {
        $conn = getDBConnection();
        
        if (!isset($data['token'])) {
            echo json_encode(['success' => false, 'message' => 'Token de sesión requerido']);
            exit;
        }
        
        $resultado = cerrarSesion($conn, $data['token']);
        echo json_encode($resultado);
        $conn->close();
        exit;
    }

    // Contar sesiones (total y usuarios activos distintos)
    if (isset($data['action']) && $data['action'] === 'contar') {
        $conn = getDBConnection();
        $resultado = contarSesiones($conn);
        echo json_encode($resultado);
        $conn->close();
        exit;
    }
}

if ($method === 'GET') {
    // Verificar sesión
    if (isset($_GET['token'])) {
        $conn = getDBConnection();
        $resultado = verificarSesion($conn, $_GET['token']);
        echo json_encode($resultado);
        $conn->close();
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Método no soportado']);
exit;
?>