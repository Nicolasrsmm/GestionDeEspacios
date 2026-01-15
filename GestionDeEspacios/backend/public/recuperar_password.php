<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

set_exception_handler(function($e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    exit;
});

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $errstr]);
    exit;
});

$data = $_POST;

if (!$data || count($data) === 0) {
    echo json_encode(['success' => false, 'message' => 'No se recibieron datos']);
    exit;
}

if (empty($data['correo'])) {
    echo json_encode(['success' => false, 'message' => 'Correo o usuario requerido']);
    exit;
}

$identificador = trim($data['correo']);
$conn = getDBConnection();

// Buscar usuario por nombre de usuario o correo electrónico
$stmt = $conn->prepare("
    SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        c.correo_electronico,
        c.nombre_usuario
    FROM usuarios u
    JOIN credenciales c ON u.id_usuario = c.id_usuario
    WHERE (c.nombre_usuario = ? OR c.correo_electronico = ?) 
    AND u.activo = 1
");
$stmt->bind_param('ss', $identificador, $identificador);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    $conn->close();
    // Validar que el correo existe
    echo json_encode(['success' => false, 'message' => 'No se encontró ningún usuario con ese correo o nombre de usuario']);
    exit;
}

$usuario = $result->fetch_assoc();
$stmt->close();
$conn->close();

// Generar token único para el enlace de recuperación
$token = bin2hex(random_bytes(32));

// Crear el enlace de recuperación
$scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$baseUrl = $scheme . '://' . $host . '/GestionDeEspacios/frontend';
$resetLink = $baseUrl . '/resetear_password.html?token=' . $token . '&id=' . $usuario['id_usuario'];

// Enviar correo electrónico usando PHPMailer en segundo plano
require __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Preparar respuesta inmediata
echo json_encode(['success' => true, 'message' => 'Correo de recuperación enviado. Revisa tu bandeja de entrada.']);

// Si estamos usando FastCGI, enviar respuesta inmediatamente y continuar procesamiento en segundo plano
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

// Continuar con el envío del correo en segundo plano
$mail = new PHPMailer(true);

try {
    // Configuración del servidor SMTP
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'nicolas.sanmartin1@virginiogomez.cl';
    $mail->Password = 'qtpvixgdzvryaynf';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    // Configurar charset UTF-8 para caracteres especiales
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'quoted-printable';

    // Remitente y destinatario (codificar nombres con caracteres especiales)
    $mail->setFrom('nicolas.sanmartin1@virginiogomez.cl', mb_encode_mimeheader('NEXTFLOW - Recuperación de Contraseña', 'UTF-8', 'Q'));
    $mail->addAddress($usuario['correo_electronico'], mb_encode_mimeheader($usuario['nombre'] . ' ' . $usuario['apellido'], 'UTF-8', 'Q'));

    // Contenido del correo
    $mail->isHTML(true);
    // Codificar el Subject correctamente para caracteres especiales
    $mail->Subject = mb_encode_mimeheader('Recuperación de Contraseña - NEXTFLOW', 'UTF-8', 'Q');
    
    $mail->Body = '
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 10px;
            }
            .header {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .header h1 {
                margin: 0;
                color: #333;
                font-size: 24px;
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .button {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #333;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
                <p>Hola <strong>' . htmlspecialchars($usuario['nombre'] . ' ' . $usuario['apellido'], ENT_QUOTES, 'UTF-8') . '</strong>,</p>
                
                <p>Recibimos una solicitud para restablecer tu contraseña en NEXTFLOW.</p>
                
                <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
                
                <div style="text-align: center;">
                    <a href="' . htmlspecialchars($resetLink, ENT_QUOTES, 'UTF-8') . '" class="button">Restablecer Contraseña</a>
                </div>
                
                <p>O copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                    ' . htmlspecialchars($resetLink, ENT_QUOTES, 'UTF-8') . '
                </p>
                
                <p style="color: #e74c3c; font-weight: bold;">⚠️ Importante: Este enlace expirará en 1 hora por seguridad.</p>
                
                <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
                <p>© NEXTFLOW - Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>
    ';

    $mail->send();
    
} catch (Exception $e) {
    error_log("Error al enviar correo de recuperación: " . $mail->ErrorInfo);
}

exit;
