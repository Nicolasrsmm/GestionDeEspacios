<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

function handleError($message) {
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

// Listar planes disponibles
function obtenerPlanes($conn) {
    $stmt = $conn->prepare("SELECT id_plan, nombre_plan, precio, cantidad_espacios FROM planes ORDER BY precio ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    $planes = [];
    while ($row = $result->fetch_assoc()) { $planes[] = $row; }
    $stmt->close();
    return $planes;
}

// Crear o actualizar la suscripción activa de un administrador al plan indicado
function asignarPlanAAdministrador($conn, $id_administrador, $id_plan) {
    // Validar que el usuario sea Administrador activo
    $stmt = $conn->prepare("SELECT u.id_usuario FROM usuarios u
        JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON r.id_rol = ur.id_rol AND r.nombre_rol = 'Administrador'
        WHERE u.id_usuario = ? AND u.activo = 1");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute(); $res = $stmt->get_result();
    if ($res->num_rows === 0) { $stmt->close(); return ['success'=>false,'message'=>'Usuario no es Administrador activo']; }
    $stmt->close();

    // Validar plan
    $stmt = $conn->prepare("SELECT id_plan FROM planes WHERE id_plan = ?");
    $stmt->bind_param('i', $id_plan);
    $stmt->execute(); $res = $stmt->get_result();
    if ($res->num_rows === 0) { $stmt->close(); return ['success'=>false,'message'=>'Plan no válido']; }
    $stmt->close();

    // Crear nueva suscripción (vigencia simple: hoy a hoy+30 días)
    $fecha_inicio = date('Y-m-d');
    $fecha_fin = date('Y-m-d', strtotime('+30 days'));

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO suscripciones (id_usuario, id_plan, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('iiss', $id_administrador, $id_plan, $fecha_inicio, $fecha_fin);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al crear suscripción: ' . $err); }
        $id_suscripcion = $conn->insert_id; $stmt->close();

        // Enlazar suscripción actual al usuario
        $stmt = $conn->prepare("UPDATE usuarios SET id_suscripcion = ? WHERE id_usuario = ?");
        $stmt->bind_param('ii', $id_suscripcion, $id_administrador);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al actualizar usuario: ' . $err); }
        $stmt->close();

        $conn->commit();
        return ['success'=>true,'message'=>'Plan asignado correctamente','id_suscripcion'=>$id_suscripcion];
    } catch (Exception $e) {
        $conn->rollback();
        return ['success'=>false,'message'=>$e->getMessage()];
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'listar') {
        $conn = getDBConnection();
        $planes = obtenerPlanes($conn);
        $conn->close();
        // Mantener la clave "suscripciones" por compatibilidad del frontend, pero enviando planes
        echo json_encode(['success'=>true, 'suscripciones'=>array_map(function($p){
            return [
                'id_plan'=>$p['id_plan'],
                'nombre_plan'=>$p['nombre_plan'],
                'precio'=>$p['precio'],
                'cantidad_espacios'=>$p['cantidad_espacios']
            ];
        }, $planes)]);
        exit;
    }
}

if ($method === 'POST') {
    if (isset($data['action']) && $data['action'] === 'actualizar') {
        if (!isset($data['id_administrador']) || !isset($data['id_plan'])) {
            handleError('Faltan parámetros requeridos');
        }
        $conn = getDBConnection();
        $res = asignarPlanAAdministrador($conn, intval($data['id_administrador']), intval($data['id_plan']));
        $conn->close();
        echo json_encode($res);
        exit;
    }
}

echo json_encode(['success'=>false,'message'=>'Método no soportado']);
exit;
?>
