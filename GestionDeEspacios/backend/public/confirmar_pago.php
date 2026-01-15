<?php
declare(strict_types=1);

date_default_timezone_set('America/Santiago');

header('Content-Type: text/html; charset=utf-8');

$token = $_POST['token_ws'] ?? null;

if (!$token) {
    // Si no hay token (pago cancelado), redirigir inmediatamente al panel
    header('Location: /GestionDeEspacios/frontend/administrador.html');
    exit;
}

// Obtener id_usuario e id_plan de los parámetros GET
$idUsuario = isset($_GET['usuario']) ? (int)$_GET['usuario'] : 0;
$idPlan = isset($_GET['plan']) ? (int)$_GET['plan'] : 0;

if ($idUsuario <= 0 || $idPlan <= 0) {
    header('Location: /GestionDeEspacios/frontend/administrador.html');
    exit;
}

// Verificar autoload
$autoloadPath = __DIR__ . '/../../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo 'Falta vendor/autoload.php (instala transbank/transbank-sdk con Composer).';
    exit;
}

require_once $autoloadPath;

$config = require '../config/webpay_config.php';

use GuzzleHttp\Client;

$environment = strtolower((string)($config['environment'] ?? 'integration'));
$commerceCode = (string)($config['commerce_code'] ?? '');
$apiKey       = (string)($config['api_key'] ?? '');

if ($environment === 'production' && ($commerceCode === '' || $apiKey === '')) {
    http_response_code(500);
    echo 'Faltan credenciales de producción en webpay_config.php';
    exit;
}

$baseRest = $environment === 'production' ? (string)$config['rest_base_production'] : (string)$config['rest_base_integration'];
$endpoint = rtrim($baseRest, '/') . '/rswebpaytransaction/api/webpay/v1.0/transactions/' . rawurlencode($token);

try {
    $client = new Client(['timeout' => 15]);
    $resp = $client->put($endpoint, [
        'headers' => [
            'Content-Type'       => 'application/json',
            'Tbk-Api-Key-Id'     => $commerceCode,
            'Tbk-Api-Key-Secret' => $apiKey,
        ],
        'http_errors' => true,
    ]);

    $data = json_decode((string)$resp->getBody(), true);
    
    if (!is_array($data)) {
        throw new RuntimeException('Respuesta inválida en commit REST');
    }

    $status            = $data['status']              ?? null;
    $amount            = $data['amount']              ?? null;
    $buyOrder          = $data['buy_order']           ?? '';
    $authorizationCode = $data['authorization_code']  ?? '';
    $paymentType       = $data['payment_type_code']   ?? '';
    $installments      = $data['installments_number'] ?? 0;
    $cardDetail        = $data['card_detail']         ?? null;

    // Variable para tracking del procesamiento
    $procesoBDExitoso = false;
    $errorBD = null;
    $conexionCerrada = false;
    
    // Si el pago fue aprobado, actualizar la suscripción y registrar el pago
    if ($status === 'AUTHORIZED') {
        error_log('Pago AUTHORIZED recibido - Usuario: ' . $idUsuario . ', Plan: ' . $idPlan . ', Monto: ' . $amount);
        
        require_once '../config/db_config.php';
        
        $conn = getDBConnection();
        $monto = (float)$amount;
        
        try {
            $conn->begin_transaction();
            error_log('Transacción iniciada');
            
            // 0. Verificar si el pago ya existe (evitar duplicados)
            // Solo verificar por token_pago porque es único por transacción de Webpay
            // El authorization_code puede repetirse en ambiente de integración de Transbank
            error_log('PASO 0: Verificando si el pago ya existe - token: ' . substr($token, 0, 30));
            $stmt_check = $conn->prepare("SELECT id_pago, id_suscripcion FROM pagos WHERE token_pago = ?");
            $stmt_check->bind_param('s', $token);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();
            $pago_existente = $result_check->fetch_assoc();
            $stmt_check->close();
            
            if ($pago_existente) {
                error_log('ADVERTENCIA: El pago ya existe en la base de datos - id_pago: ' . $pago_existente['id_pago'] . ', id_suscripcion: ' . $pago_existente['id_suscripcion']);
                error_log('Este pago probablemente ya fue procesado, saltando todo el procesamiento');
                // Hacer rollback silencioso
                $conn->rollback();
                $conn->close();
                $conexionCerrada = true;
                error_log('Transacción cancelada - pago duplicado');
                $procesoBDExitoso = true; // Ya fue procesado exitosamente antes
                $errorBD = null; // No hay error, solo duplicado
            } else {
                error_log('PASO 0 OK: Pago nuevo confirmado, continuando con procesamiento');
            
            // 1. Crear nueva suscripción
            $fecha_inicio = date('Y-m-d');
            $fecha_fin = date('Y-m-d', strtotime('+30 days'));
            error_log('PASO 1: Insertando suscripción - Usuario: ' . $idUsuario . ', Plan: ' . $idPlan . ', Fechas: ' . $fecha_inicio . ' -> ' . $fecha_fin);
            $stmt_sus = $conn->prepare("INSERT INTO suscripciones (id_usuario, id_plan, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)");
            $stmt_sus->bind_param('iiss', $idUsuario, $idPlan, $fecha_inicio, $fecha_fin);
            if (!$stmt_sus->execute()) {
                error_log('ERROR PASO 1: Error al crear suscripción: ' . $stmt_sus->error);
                throw new Exception('Error al crear suscripción: ' . $stmt_sus->error);
            }
            $idSuscripcion = $conn->insert_id;
            $stmt_sus->close();
            error_log('PASO 1 OK: Suscripción creada con ID: ' . $idSuscripcion);
            
            // 2. Actualizar usuario con la nueva suscripción
            error_log('PASO 2: Actualizando usuario ' . $idUsuario . ' con suscripción ' . $idSuscripcion);
            $stmt_upd_user = $conn->prepare("UPDATE usuarios SET id_suscripcion = ? WHERE id_usuario = ?");
            $stmt_upd_user->bind_param('ii', $idSuscripcion, $idUsuario);
            if (!$stmt_upd_user->execute()) {
                error_log('ERROR PASO 2: Error al actualizar usuario: ' . $stmt_upd_user->error);
                throw new Exception('Error al actualizar usuario: ' . $stmt_upd_user->error);
            }
            $stmt_upd_user->close();
            error_log('PASO 2 OK: Usuario actualizado correctamente');
            
            // 3. Obtener id_metodo_pago usando el payment_type_code (VD, VN, VC, MC, etc.)
            $paymentTypeCode = !empty($paymentType) ? $paymentType : 'VN'; // Default a Tarjeta de Crédito si no viene
            error_log('PASO 3: Buscando método de pago con código: ' . $paymentTypeCode);
            $stmt_metodo = $conn->prepare("SELECT id_metodo_pago FROM metodos_pago WHERE metodo_pago = ?");
            $stmt_metodo->bind_param('s', $paymentTypeCode);
            $stmt_metodo->execute();
            $result_metodo = $stmt_metodo->get_result();
            $metodo = $result_metodo->fetch_assoc();
            $stmt_metodo->close();
            
            // Si no encuentra el tipo de tarjeta, insertarlo
            if (!$metodo) {
                error_log('PASO 3A: Método de pago no encontrado, insertando: ' . $paymentTypeCode);
                $proveedor = 'Transbank';
                $stmt_ins = $conn->prepare("INSERT INTO metodos_pago (metodo_pago, proveedor) VALUES (?, ?)");
                $stmt_ins->bind_param('ss', $paymentTypeCode, $proveedor);
                if (!$stmt_ins->execute()) {
                    error_log('ERROR PASO 3A: Error al insertar método de pago: ' . $stmt_ins->error);
                    throw new Exception('Error al insertar método de pago: ' . $stmt_ins->error);
                }
                $idMetodoPago = $conn->insert_id;
                $stmt_ins->close();
                error_log('PASO 3A OK: Método de pago insertado con ID: ' . $idMetodoPago);
            } else {
                $idMetodoPago = $metodo['id_metodo_pago'];
                error_log('PASO 3B OK: Método de pago encontrado con ID: ' . $idMetodoPago);
            }
            
            // 4. Registrar el pago
            $cantidad_cuotas = $installments > 0 ? $installments : 1;
            
            // Crear transaccion_id único: combinar authorization_code + buy_order para evitar duplicados
            // en ambiente de integración de Transbank que repite el mismo authorization_code
            $transaccionIdUnico = !empty($authorizationCode) ? ($buyOrder . '-' . $authorizationCode) : ($buyOrder . '-' . substr($token, 0, 10));
            
            error_log('PASO 4: Insertando pago en tabla pagos');
            error_log('  - id_suscripcion: ' . $idSuscripcion);
            error_log('  - id_usuario: ' . $idUsuario);
            error_log('  - id_plan: ' . $idPlan);
            error_log('  - id_metodo_pago: ' . $idMetodoPago);
            error_log('  - monto_total: ' . $monto);
            error_log('  - cantidad_cuotas: ' . $cantidad_cuotas);
            error_log('  - transaccion_id: ' . $transaccionIdUnico);
            error_log('  - token_pago: ' . substr($token, 0, 30) . '...');
            error_log('  - buy_order: ' . $buyOrder);
            $stmt_pago = $conn->prepare("INSERT INTO pagos (id_suscripcion, id_usuario, id_plan, id_metodo_pago, monto_total, cantidad_cuotas, estado, transaccion_id, token_pago, buy_order) VALUES (?, ?, ?, ?, ?, ?, 'completado', ?, ?, ?)");
            $stmt_pago->bind_param('iiiiiisss', $idSuscripcion, $idUsuario, $idPlan, $idMetodoPago, $monto, $cantidad_cuotas, $transaccionIdUnico, $token, $buyOrder);
            if (!$stmt_pago->execute()) {
                error_log('ERROR PASO 4: Error al registrar pago: ' . $stmt_pago->error);
                throw new Exception('Error al registrar pago: ' . $stmt_pago->error);
            }
            $idPago = $conn->insert_id;
            $stmt_pago->close();
            error_log('PASO 4 OK: Pago insertado con ID: ' . $idPago);
            
            // Log antes del commit
            error_log('PASO 5: Intentando commit - Usuario: ' . $idUsuario . ', Plan: ' . $idPlan . ', Suscripción: ' . $idSuscripcion . ', Pago: ' . $idPago);
            
            if (!$conn->commit()) {
                error_log('ERROR PASO 5: Error al hacer commit: ' . $conn->error);
                throw new Exception('Error al hacer commit: ' . $conn->error);
            }
            
            // Log de éxito
            error_log('========================================');
            error_log('PAGO PROCESADO EXITOSAMENTE');
            error_log('Usuario: ' . $idUsuario);
            error_log('Plan: ' . $idPlan);
            error_log('Suscripción ID: ' . $idSuscripcion);
            error_log('Pago ID: ' . $idPago);
            error_log('========================================');
            
            $procesoBDExitoso = true;
            }
            
        } catch (Exception $e) {
            if (isset($conn)) {
                try {
                    $conn->rollback();
                } catch (Exception $rollbackEx) {
                    // Si ya se hizo rollback o no hay transacción, ignorar
                }
            }
            // Log del error
            error_log('Error al procesar pago: ' . $e->getMessage());
            error_log('StackTrace: ' . $e->getTraceAsString());
            $errorBD = $e->getMessage();
        }
        
        if (isset($conn) && !$conexionCerrada) {
            $conn->close();
        }
    }

    ?>
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Resultado del Pago</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/png" sizes="512x512" href="/GestionDeEspacios/frontend/images/NextFlow_Logo_blanco.png">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <script>
        // Inicializar tema ANTES de que se cargue el CSS para evitar flash
        (function() {
          try {
            const savedTheme = localStorage.getItem('theme');
            const theme = savedTheme === 'light' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
          } catch(e) {
            // Si hay error (por ejemplo, en modo privado), usar tema oscuro por defecto
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        })();
      </script>
      <style>
        /* Variables de tema - Tema Oscuro (por defecto) */
        :root,
        [data-theme="dark"] {
          --primary-color: #2c3e50;
          --secondary-color: #3498db;
          --accent-color: #e74c3c;
          --text-color: #e0e0e0;
          --white: #fff;
          --light-gray: #f5f5f5;
          --border-radius: 8px;
          --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          
          /* Colores específicos del tema oscuro */
          --bg-primary: #1a1a1a;
          --bg-secondary: #2d2d2d;
          --bg-card: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          --bg-gradient: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
          --card-border: #333;
          --text-primary: #e0e0e0;
          --text-secondary: #ffffff;
          --input-bg: #1a1a1a;
          --input-border: #333;
          --input-text: #ffffff;
          --accent-gold: #ffd700;
          --status-success: #27ae60;
          --status-error: #e74c3c;
          --border-color: #333;
          --border-color-light: #444;
        }

        /* Variables de tema - Tema Claro */
        [data-theme="light"] {
          --primary-color: #2c3e50;
          --secondary-color: #3498db;
          --accent-color: #e74c3c;
          --text-color: #2c3e50;
          --white: #fff;
          --light-gray: #f8f9fa;
          --border-radius: 8px;
          --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          
          /* Colores específicos del tema claro */
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-card: linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e8f0f8 100%);
          --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
          --card-border: #e2e8f0;
          --text-primary: #1e293b;
          --text-secondary: #334155;
          --input-bg: #ffffff;
          --input-border: #cbd5e1;
          --input-text: #1e293b;
          --accent-gold: #f59e0b;
          --status-success: #27ae60;
          --status-error: #e74c3c;
          --border-color: #e2e8f0;
          --border-color-light: #cbd5e1;
          --light-text: #64748b;
        }

        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          min-height: 100vh; 
          background: var(--bg-gradient);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          transition: background 0.3s ease, color 0.3s ease;
        }
        
        .payment-result-container {
          max-width: 700px;
          width: 100%;
          background: var(--bg-card);
          border-radius: 16px;
          box-shadow: var(--box-shadow);
          border: 2px solid var(--card-border);
          position: relative;
          overflow: hidden;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        
        .payment-result-container::before {
          content: '';
          position: absolute;
          top: 0; 
          left: 0; 
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent-gold), #ffed4e, var(--accent-gold));
          z-index: 1;
        }
        
        .payment-result-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 2px solid var(--border-color);
          text-align: center;
          transition: border-color 0.3s ease;
        }
        
        .payment-result-header h1 {
          color: var(--accent-gold);
          font-size: 1.8rem;
          margin: 0 0 0.5rem;
          transition: color 0.3s ease;
        }
        
        .payment-result-body {
          padding: 2rem;
        }
        
        .status-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color-light);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        
        .status-icon {
          font-size: 4rem;
          margin-bottom: 0.5rem;
        }
        
        .status-icon.ok { 
          color: var(--status-success); 
        }
        
        .status-icon.fail { 
          color: var(--status-error); 
        }
        
        .status-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .status-title.ok { 
          color: var(--status-success); 
        }
        
        .status-title.fail { 
          color: var(--status-error); 
        }
        
        .status-detail {
          margin-top: 1rem;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }
        
        .details-list {
          list-style: none;
          padding: 0;
        }
        
        .details-list li {
          background: var(--bg-card);
          border: 1px solid var(--border-color-light);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        
        .details-list li strong {
          color: var(--accent-gold);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.3s ease;
        }
        
        .details-list li strong i {
          font-size: 1.1em;
          color: var(--secondary-color);
        }
        
        .details-list li span {
          color: var(--text-primary);
          font-weight: 500;
          text-align: right;
          transition: color 0.3s ease;
        }
        
        .payment-code {
          background: var(--input-bg);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          color: var(--accent-gold);
          border: 1px solid var(--input-border);
          transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }
        
        .success-message {
          background: linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(39, 174, 96, 0.05));
          border: 1px solid rgba(39, 174, 96, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1.5rem;
          text-align: center;
          color: var(--status-success);
        }
        
        .btn-container {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .btn-return {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, var(--accent-gold), #ffed4e);
          color: var(--bg-primary);
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          transition: all 0.3s;
        }
        
        .btn-return:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
        }
        
        [data-theme="light"] .btn-return {
          color: #1a1a1a;
        }
        
        @media (max-width: 768px) {
          .payment-result-container { 
            margin: 0; 
            border-radius: 0; 
          }
          .payment-result-body { 
            padding: 1.5rem; 
          }
          .details-list li { 
            flex-direction: column; 
            align-items: flex-start; 
            gap: 0.5rem; 
          }
          .details-list li span { 
            text-align: left; 
            width: 100%; 
          }
        }
      </style>
    </head>
    <body>
      <div class="payment-result-container">
        <div class="payment-result-header">
          <h1>Resultado del Pago</h1>
        </div>
        <div class="payment-result-body">
          <?php if ($status === 'AUTHORIZED'): ?>
            <div class="status-box">
              <div class="status-icon ok">✓</div>
              <p class="status-title ok">Pago Aprobado</p>
            </div>
            <ul class="details-list">
              <li>
                <strong><i class="fas fa-receipt"></i> Orden:</strong>
                <span class="payment-code"><?php echo htmlspecialchars($buyOrder, ENT_QUOTES, 'UTF-8'); ?></span>
              </li>
              <li>
                <strong><i class="fas fa-dollar-sign"></i> Monto:</strong>
                <span>$<?php echo number_format((float)$amount, 0, ',', '.'); ?> CLP</span>
              </li>
              <li>
                <strong><i class="fas fa-key"></i> Código de autorización:</strong>
                <span><?php echo htmlspecialchars((string)$authorizationCode, ENT_QUOTES, 'UTF-8'); ?></span>
              </li>
              <li>
                <strong><i class="fas fa-credit-card"></i> Tipo de pago:</strong>
                <span><?php echo htmlspecialchars((string)$paymentType, ENT_QUOTES, 'UTF-8'); ?></span>
              </li>
              <li>
                <strong><i class="fas fa-calendar"></i> Cuotas:</strong>
                <span><?php echo (int)$installments; ?></span>
              </li>
              <?php if ($cardDetail && isset($cardDetail['card_number'])): ?>
                <li>
                  <strong><i class="fas fa-id-card"></i> Tarjeta:</strong>
                  <span>**** **** **** <?php echo htmlspecialchars((string)$cardDetail['card_number'], ENT_QUOTES, 'UTF-8'); ?></span>
                </li>
              <?php endif; ?>
              <li>
                <strong><i class="fas fa-barcode"></i> Token de pago:</strong>
                <span class="payment-code" style="font-size: 0.85em;"><?php echo htmlspecialchars((string)$token, ENT_QUOTES, 'UTF-8'); ?></span>
              </li>
            </ul>
            <div class="success-message">
              <i class="fas fa-check-circle"></i> Tu suscripción ha sido actualizada exitosamente.
            </div>
          <?php else: ?>
            <div class="status-box">
              <div class="status-icon fail">✗</div>
              <p class="status-title fail">Pago Rechazado</p>
              <p class="status-detail">
                <strong>Estado:</strong> <?php echo htmlspecialchars((string)$status, ENT_QUOTES, 'UTF-8'); ?>
              </p>
            </div>
          <?php endif; ?>

          <div class="btn-container">
            <a href="/GestionDeEspacios/frontend/administrador.html" class="btn-return">
              <i class="fas fa-arrow-left"></i> Volver al panel
            </a>
          </div>
        </div>
      </div>
      <script>
        console.log('==================== DATOS DEL PAGO ====================');
        console.log('Status:', '<?php echo addslashes((string)$status); ?>');
        console.log('Usuario ID:', <?php echo $idUsuario; ?>);
        console.log('Plan ID:', <?php echo $idPlan; ?>);
        console.log('Monto:', <?php echo (float)$amount; ?>);
        console.log('Orden de compra:', '<?php echo addslashes($buyOrder); ?>');
        console.log('Código autorización:', '<?php echo addslashes((string)$authorizationCode); ?>');
        console.log('Tipo de pago:', '<?php echo addslashes((string)$paymentType); ?>');
        console.log('Cuotas:', <?php echo (int)$installments; ?>);
        console.log('Token:', '<?php echo addslashes(substr((string)$token, 0, 50)); ?>...');
        console.log('========================================================');
        console.log('==================== ESTADO BASE DE DATOS ====================');
        console.log('Proceso BD Exitoso:', <?php echo $procesoBDExitoso ? 'true' : 'false'; ?>);
        <?php if ($errorBD): ?>
        console.error('Error BD:', '<?php echo addslashes($errorBD); ?>');
        <?php endif; ?>
        console.log('========================================================');
      </script>
    </body>
    </html>
    <?php
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Error confirmando transacción: ' . $e->getMessage();
}

