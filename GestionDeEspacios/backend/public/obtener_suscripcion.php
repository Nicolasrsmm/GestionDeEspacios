<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id_suscripcion'])) {
    echo json_encode(['success' => false, 'message' => 'ID de suscripción no proporcionado']);
    exit;
}

$conn = getDBConnection();

$id_suscripcion = intval($data['id_suscripcion']);

// Unir suscripciones con planes para devolver la info del plan
$stmt = $conn->prepare("SELECT 
        s.id_suscripcion,
        p.id_plan,
        p.nombre_plan AS nombre_suscripcion,
        p.cantidad_espacios,
        p.precio,
        s.fecha_inicio,
        s.fecha_fin
    FROM suscripciones s
    JOIN planes p ON p.id_plan = s.id_plan
    WHERE s.id_suscripcion = ?");
$stmt->bind_param('i', $id_suscripcion);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $suscripcion = $result->fetch_assoc();
    $stmt->close();
    $conn->close();
    echo json_encode(['success' => true, 'suscripcion' => $suscripcion]);
} else {
    $stmt->close();
    $conn->close();
    echo json_encode(['success' => false, 'message' => 'Suscripción no encontrada']);
}
?>
