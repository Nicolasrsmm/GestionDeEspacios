<?php
declare(strict_types=1);

date_default_timezone_set('America/Santiago');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Verificar que el archivo de configuración existe
if (!file_exists('../config/webpay_config.php')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Error de configuración: archivo webpay_config.php no encontrado'
    ]);
    exit();
}

require_once '../config/webpay_config.php';

// Autoload de Composer
$autoloadPath = __DIR__ . '/../../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Error: No se encontró vendor/autoload.php. Ejecuta: composer install'
    ]);
    exit();
}

require_once $autoloadPath;

use GuzzleHttp\Client;

// Obtener datos del POST (soporta tanto JSON como form-data)
$data = $_POST;
if (empty($data)) {
    $data = json_decode(file_get_contents('php://input'), true);
}

if (!isset($data['id_plan']) || !isset($data['id_usuario'])) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Parámetros inválidos']);
    exit();
}

$idPlan = (int)$data['id_plan'];
$idUsuario = (int)$data['id_usuario'];

// Obtener información del plan desde la base de datos
require_once '../config/db_config.php';

$servername = $DB_CONFIG['host'];
$username = $DB_CONFIG['user'];
$password = $DB_CONFIG['password'];
$dbname = $DB_CONFIG['database'];

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]);
    exit();
}

$conn->set_charset('utf8mb4');

// Obtener el plan
$stmt = $conn->prepare("SELECT id_plan, nombre_plan, precio FROM planes WHERE id_plan = ?");
$stmt->bind_param('i', $idPlan);
$stmt->execute();
$result = $stmt->get_result();
$plan = $result->fetch_assoc();
$stmt->close();

if (!$plan) {
    $conn->close();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
    exit();
}

$amount = (int)$plan['precio'];
$planNombre = $plan['nombre_plan'];

$conn->close();

// Generar orden de compra única
$buyOrder  = 'ORD-' . date('YmdHis') . '-' . random_int(1000, 9999);
$sessionId = 'SES-' . bin2hex(random_bytes(6));

// Construir URL de retorno con parámetros
$config = require '../config/webpay_config.php';
$scheme  = (!empty($config['force_https']) ? 'https' : ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http'));
$baseUrl = $scheme . '://' . $_SERVER['HTTP_HOST'] . '/GestionDeEspacios/backend/public';
$returnUrl = $baseUrl . '/confirmar_pago.php?usuario=' . $idUsuario . '&plan=' . $idPlan;

$environment = strtolower((string)($config['environment'] ?? 'integration'));
$commerceCode = (string)($config['commerce_code'] ?? '');
$apiKey       = (string)($config['api_key'] ?? '');

if ($environment === 'production' && ($commerceCode === '' || $apiKey === '')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Faltan credenciales de producción']);
    exit();
}

$baseRest = $environment === 'production' ? (string)$config['rest_base_production'] : (string)$config['rest_base_integration'];
$endpoint = rtrim($baseRest, '/') . '/rswebpaytransaction/api/webpay/v1.0/transactions';

try {
    $client = new Client(['timeout' => 15]);
    $resp = $client->post($endpoint, [
        'headers' => [
            'Content-Type'       => 'application/json',
            'Tbk-Api-Key-Id'     => $commerceCode,
            'Tbk-Api-Key-Secret' => $apiKey,
        ],
        'json' => [
            'buy_order'  => $buyOrder,
            'session_id' => $sessionId,
            'amount'     => $amount,
            'return_url' => $returnUrl,
        ],
        'http_errors' => true,
    ]);

    $responseData = json_decode((string)$resp->getBody(), true);
    
    if (!is_array($responseData) || empty($responseData['token']) || empty($responseData['url'])) {
        throw new RuntimeException('Respuesta inválida desde Webpay REST');
    }

    // En lugar de devolver JSON, generamos un HTML que redirige automáticamente
    $url   = (string)$responseData['url'];
    $token = (string)$responseData['token'];
    ?>
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Redirigiendo...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #0a0a0a;
          overflow: hidden;
        }
      </style>
    </head>
    <body onload="document.forms[0].submit();">
      <form method="post" action="<?php echo htmlspecialchars($url, ENT_QUOTES, 'UTF-8'); ?>">
        <input type="hidden" name="token_ws" value="<?php echo htmlspecialchars($token, ENT_QUOTES, 'UTF-8'); ?>" />
        <noscript>
          <button type="submit" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:12px 24px;background:#3498db;color:white;border:none;border-radius:6px;cursor:pointer;font-size:16px;">
            Continuar a Webpay
          </button>
        </noscript>
      </form>
    </body>
    </html>
    <?php

} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Error iniciando transacción Webpay: ' . $e->getMessage()
    ]);
}

