<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

set_exception_handler(function($e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    exit;
});

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $errstr]);
    exit;
});

try {
    $conn = getDBConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'regiones';
        
        switch ($action) {
            case 'regiones':
                // Obtener todas las regiones
                $stmt = $conn->prepare("SELECT id_region, nombre_region FROM regiones ORDER BY nombre_region");
                $stmt->execute();
                $result = $stmt->get_result();
                
                $regiones = [];
                while ($row = $result->fetch_assoc()) {
                    $regiones[] = $row;
                }
                
                echo json_encode([
                    'success' => true,
                    'regiones' => $regiones
                ]);
                break;
                
            case 'ciudades':
                // Obtener ciudades por región
                if (!isset($_GET['id_region'])) {
                    echo json_encode(['success' => false, 'message' => 'ID de región requerido']);
                    exit;
                }
                
                $id_region = intval($_GET['id_region']);
                $stmt = $conn->prepare("SELECT id_ciudad, nombre_ciudad FROM ciudades WHERE id_region = ? ORDER BY nombre_ciudad");
                $stmt->bind_param('i', $id_region);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $ciudades = [];
                while ($row = $result->fetch_assoc()) {
                    $ciudades[] = $row;
                }
                
                echo json_encode([
                    'success' => true,
                    'ciudades' => $ciudades
                ]);
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Acción no válida']);
                break;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>