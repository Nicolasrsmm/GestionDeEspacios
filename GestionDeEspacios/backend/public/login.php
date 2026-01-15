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

if (empty($data['identificador']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos']);
    exit;
}

$identificador = trim($data['identificador']);
$password = $data['password'];
$conn = getDBConnection();

// Buscar usuario por nombre de usuario o correo electrónico
$stmt = $conn->prepare("
        SELECT 
            u.id_usuario,
            u.rut_numero,
            u.rut_dv,
            u.nombre,
            u.apellido,
            u.telefono,
            u.id_region,
            u.id_ciudad,
            u.direccion,
            u.id_suscripcion,
            u.id_administrador_asociado,
            c.nombre_usuario,
            c.correo_electronico,
            c.contrasena_hash,
            r.nombre_rol,
            reg.nombre_region,
            ciu.nombre_ciudad
        FROM usuarios u
        JOIN credenciales c ON u.id_usuario = c.id_usuario
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        JOIN roles r ON ur.id_rol = r.id_rol
        LEFT JOIN regiones reg ON u.id_region = reg.id_region
        LEFT JOIN ciudades ciu ON u.id_ciudad = ciu.id_ciudad
    WHERE (c.nombre_usuario = ? OR c.correo_electronico = ?) 
    AND u.activo = 1 
    AND ur.estado = 'Activo'
");
$stmt->bind_param('ss', $identificador, $identificador);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $usuarios = $result->fetch_all(MYSQLI_ASSOC);
    
    // Verificar contraseña con el primer usuario (todos tienen la misma contraseña)
    $usuario = $usuarios[0];
    
    // Verificar contraseña
    if (password_verify($password, $usuario['contrasena_hash'])) {
        // Obtener roles únicos del usuario
        $roles = array_unique(array_column($usuarios, 'nombre_rol'));
        
        // Si tiene múltiples roles, devolver información para selección
        if (count($roles) > 1) {
            // Construir RUT completo
            $rut_completo = $usuario['rut_numero'] . '-' . $usuario['rut_dv'];
            
            echo json_encode([
                'success' => true,
                'message' => 'Usuario con múltiples roles detectado',
                'multiple_roles' => true,
                'roles' => $roles,
                'usuario' => [
                    'id_usuario' => $usuario['id_usuario'],
                    'nombre_usuario' => $usuario['nombre_usuario'],
                    'nombre' => $usuario['nombre'],
                    'apellido' => $usuario['apellido'],
                    'rut' => $rut_completo,
                    'correo_electronico' => $usuario['correo_electronico'],
                    'telefono' => $usuario['telefono'],
                    'region' => $usuario['nombre_region'],
                    'ciudad' => $usuario['nombre_ciudad'],
                    'direccion' => $usuario['direccion'],
                    'id_suscripcion' => $usuario['id_suscripcion'],
                    'id_administrador' => $usuario['id_administrador_asociado'] ?? $usuario['id_usuario']
                ]
            ]);
        } else {
            // Usuario con un solo rol - proceder normalmente
            $rol = $roles[0];
            
            // Crear sesión
            $sesion_data = [
                'action' => 'crear',
                'tipo_usuario' => strtolower($rol),
                'id_usuario' => $usuario['id_usuario']
            ];
            
            $sesion_response = file_get_contents('http://localhost/GestionDeEspacios/backend/public/sesion.php', false, stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($sesion_data)
                ]
            ]));
            
            $sesion_result = json_decode($sesion_response, true);
            
            // Determinar URL de redirección según el rol
            $redirect_url = '';
            switch ($rol) {
                case 'AdminSistema':
                    $redirect_url = '../frontend/admin.html';
                    break;
                case 'Administrador':
                    $redirect_url = '../frontend/administrador.html';
                    break;
                case 'Colaboradores':
                    $redirect_url = '../frontend/colaborador.html';
                    break;
                case 'Cliente':
                    $redirect_url = '../frontend/cliente.html';
                    break;
                default:
                    $redirect_url = '../frontend/index.html';
            }
            
            // Construir RUT completo
            $rut_completo = $usuario['rut_numero'] . '-' . $usuario['rut_dv'];
            
            echo json_encode([
                'success' => true,
                'message' => 'Login exitoso',
                'tipo_usuario' => strtolower($rol),
                'redirect_url' => $redirect_url,
                'token_sesion' => $sesion_result['token'] ?? null,
                'usuario' => [
                    'id_usuario' => $usuario['id_usuario'],
                    'nombre_usuario' => $usuario['nombre_usuario'],
                    'nombre' => $usuario['nombre'],
                    'apellido' => $usuario['apellido'],
                    'rut' => $rut_completo,
                    'correo_electronico' => $usuario['correo_electronico'],
                    'telefono' => $usuario['telefono'],
                    'region' => $usuario['nombre_region'],
                    'ciudad' => $usuario['nombre_ciudad'],
                    'direccion' => $usuario['direccion'],
                    'id_suscripcion' => $usuario['id_suscripcion'],
                    'rol' => $rol,
                    'id_administrador' => $usuario['id_administrador_asociado'] ?? $usuario['id_usuario']
                ]
            ]);
        }
        $stmt->close();
        $conn->close();
        exit;
    }
}

$stmt->close();
$conn->close();

echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
exit;
?>