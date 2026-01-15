<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

// Función para manejar errores de MySQL específicamente
function handleMySQLError($error, $conn) {
    // Detectar errores de clave duplicada
    if (strpos($error, 'Duplicate entry') !== false) {
        if (strpos($error, 'for key \"nombre_usuario\"') !== false) {
            return ['success' => false, 'message' => 'El nombre de usuario ya existe'];
        } elseif (strpos($error, 'for key \"correo_electronico\"') !== false) {
            return ['success' => false, 'message' => 'El correo electrónico ya está registrado'];
        } else {
            return ['success' => false, 'message' => 'Los datos ingresados ya están registrados'];
        }
    }
    
    // Otros errores de MySQL
    return ['success' => false, 'message' => 'Error en la base de datos: ' . $error];
}

// Funciones de unicidad para la nueva estructura
function validarNombreUsuarioUnico($conn, $nombre_usuario) {
    $stmt = $conn->prepare("SELECT 1 FROM credenciales WHERE nombre_usuario = ? LIMIT 1");
    $stmt->bind_param('s', $nombre_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    $existe = $result && $result->num_rows > 0;
    $stmt->close();
    return !$existe;
}

function validarRutUnico($conn, $rut_numero, $rut_dv) {
    $stmt = $conn->prepare("SELECT 1 FROM usuarios WHERE rut_numero = ? AND rut_dv = ? LIMIT 1");
    $stmt->bind_param('is', $rut_numero, $rut_dv);
    $stmt->execute();
    $result = $stmt->get_result();
    $existe = $result && $result->num_rows > 0;
    $stmt->close();
    return !$existe;
}

function validarCorreoUnico($conn, $correo) {
    $stmt = $conn->prepare("SELECT 1 FROM credenciales WHERE correo_electronico = ? LIMIT 1");
    $stmt->bind_param('s', $correo);
    $stmt->execute();
    $result = $stmt->get_result();
    $existe = $result && $result->num_rows > 0;
    $stmt->close();
    return !$existe;
}

// Función para validar RUT chileno
function validarRutChileno($rut, $dv) {
    $rut = str_replace(['.', '-'], '', $rut);
    $dv = strtoupper($dv);
    
    if (!preg_match('/^\d{7,8}$/', $rut)) {
        return false;
    }
    
    if (!preg_match('/^[0-9K]$/', $dv)) {
        return false;
    }
    
    // Algoritmo de validación de RUT chileno
    $suma = 0;
    $multiplicador = 2;
    
    for ($i = strlen($rut) - 1; $i >= 0; $i--) {
        $suma += intval($rut[$i]) * $multiplicador;
        $multiplicador = $multiplicador == 7 ? 2 : $multiplicador + 1;
    }
    
    $resto = $suma % 11;
    $dv_calculado = 11 - $resto;
    
    if ($dv_calculado == 11) {
        $dv_calculado = '0';
    } elseif ($dv_calculado == 10) {
        $dv_calculado = 'K';
    } else {
        $dv_calculado = strval($dv_calculado);
    }
    
    return $dv === $dv_calculado;
}

// Función para obtener ID de rol por nombre
function obtenerIdRol($conn, $nombre_rol) {
    $stmt = $conn->prepare("SELECT id_rol FROM roles WHERE nombre_rol = ?");
    $stmt->bind_param('s', $nombre_rol);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $rol = $result->fetch_assoc();
        $stmt->close();
        return $rol['id_rol'];
    }
    
    $stmt->close();
    return null;
}

// Función para obtener ID de región por nombre
function obtenerIdRegion($conn, $nombre_region) {
    if (empty($nombre_region)) return null;
    
    $stmt = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
    $stmt->bind_param('s', $nombre_region);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $region = $result->fetch_assoc();
        $stmt->close();
        return $region['id_region'];
    }
    
    $stmt->close();
    return null;
}

// Función para obtener ID de ciudad por nombre y región
function obtenerIdCiudad($conn, $nombre_ciudad, $id_region) {
    if (empty($nombre_ciudad) || empty($id_region)) return null;
    
    $stmt = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
    $stmt->bind_param('si', $nombre_ciudad, $id_region);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $ciudad = $result->fetch_assoc();
        $stmt->close();
        return $ciudad['id_ciudad'];
    }
    
    $stmt->close();
    return null;
}

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

if (!isset($data['tipo_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No se especificó el tipo de usuario']);
    exit;
}

$tipo_usuario = $data['tipo_usuario'];
$conn = getDBConnection();

// Validar campos comunes
$required = ['nombre_usuario', 'contrasena', 'rut', 'digito_verificador', 'nombre', 'apellido', 'correo_electronico'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        echo json_encode(['success' => false, 'message' => "Falta el campo: $field"]);
        exit;
    }
}

// Validaciones comunes
$password = $data['contrasena'];
if (
    strlen($password) < 8 ||
    !preg_match('/[A-Z]/', $password) ||
    !preg_match('/[^a-zA-Z0-9]/', $password)
) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial.']);
    exit;
}

if (!filter_var($data['correo_electronico'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Correo electrónico inválido.']);
    exit;
}

// Validar teléfono solo si se proporciona
if (!empty($data['telefono']) && !preg_match('/^9\d{8}$/', $data['telefono'])) {
    echo json_encode(['success' => false, 'message' => 'El teléfono debe comenzar con 9 y tener 9 dígitos.']);
    exit;
}

// Validar RUT chileno
if (!validarRutChileno($data['rut'], $data['digito_verificador'])) {
    echo json_encode(['success' => false, 'message' => 'El RUT ingresado no es válido.']);
    exit;
}

// Validar unicidad de nombre_usuario
if (!validarNombreUsuarioUnico($conn, $data['nombre_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'El nombre de usuario ya existe en el sistema']);
    $conn->close();
    exit;
}

// Validar unicidad de RUT
$rut_numero = intval($data['rut']);
$rut_dv = strtoupper($data['digito_verificador']);
if (!validarRutUnico($conn, $rut_numero, $rut_dv)) {
    echo json_encode(['success' => false, 'message' => 'El RUT ya está registrado en el sistema']);
    $conn->close();
    exit;
}

// Validar unicidad de correo electrónico
if (!validarCorreoUnico($conn, $data['correo_electronico'])) {
    echo json_encode(['success' => false, 'message' => 'El correo electrónico ya está registrado en el sistema']);
    $conn->close();
    exit;
}

// Obtener ID del rol
$nombre_rol = '';

// Normalizar y mapear tipos comunes enviados desde el frontend
$tipo_usuario_raw = $tipo_usuario ?? '';
error_log("Registrar usuario - tipo_usuario recibido: " . var_export($tipo_usuario_raw, true));
$tipo_norm = strtolower(trim($tipo_usuario_raw));

$map = [
    'administrador'   => 'Administrador',
    'admin'           => 'Administrador',
    'administradores' => 'Administrador',
    'cliente'         => 'Cliente',
    'clientes'        => 'Cliente',
    'colaborador'     => 'Colaborador',
    'colaboradores'   => 'Colaborador'
];

$canonical = [
    'administrador'   => 'administrador',
    'admin'           => 'administrador',
    'administradores' => 'administrador',
    'cliente'         => 'cliente',
    'clientes'        => 'cliente',
    'colaborador'     => 'colaborador',
    'colaboradores'   => 'colaborador'
];

if (isset($map[$tipo_norm])) {
    $nombre_rol = $map[$tipo_norm];
    // normalizar $tipo_usuario para uso posterior (ej. creación de suscripción)
    $tipo_usuario = $canonical[$tipo_norm];
} else {
    // Si no se seleccionó ningún tipo en el formulario, enviar mensaje claro al usuario
    if ($tipo_norm === '' || $tipo_usuario_raw === null) {
        echo json_encode(['success' => false, 'message' => 'Seleccione un tipo de usuario']);
    } else {
        error_log("Registrar usuario - tipo_usuario no soportado: " . var_export($tipo_usuario_raw, true));
        echo json_encode(['success' => false, 'message' => 'Tipo de usuario no soportado']);
    }
    $conn->close();
    exit;
}

$id_rol = obtenerIdRol($conn, $nombre_rol);
if (!$id_rol) {
    echo json_encode(['success' => false, 'message' => 'Error: Rol no encontrado']);
    $conn->close();
    exit;
}
// Hash de la contraseña
$contrasena_hash = password_hash($data['contrasena'], PASSWORD_ARGON2ID);

// Preparar datos opcionales
$id_region = null;
$id_ciudad = null;
$direccion = isset($data['direccion']) && $data['direccion'] !== '' ? $data['direccion'] : null;
$telefono = !empty($data['telefono']) ? $data['telefono'] : null;

// Debug: Log de la dirección recibida
error_log("Dirección recibida en registro: " . var_export($data['direccion'], true));
error_log("Dirección procesada: " . var_export($direccion, true));

// Obtener ID de región si se proporciona
if (!empty($data['region'])) {
    $id_region = obtenerIdRegion($conn, $data['region']);
    
    // Obtener ID de ciudad si se proporciona región y ciudad
    if ($id_region && !empty($data['ciudad'])) {
        $id_ciudad = obtenerIdCiudad($conn, $data['ciudad'], $id_region);
    }
}

$plan_por_defecto_admin = 1; // Básica

// Iniciar transacción
$conn->begin_transaction();

try {
    // Insertar usuario (id_suscripcion NULL, se enlaza más tarde si aplica)
    $stmt_usuario = $conn->prepare("
        INSERT INTO usuarios (
            rut_numero, rut_dv, nombre, apellido, telefono, id_region, id_ciudad, direccion, id_suscripcion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ");
    
    $stmt_usuario->bind_param(
        'issssiis',
        $rut_numero,
        $rut_dv,
        $data['nombre'],
        $data['apellido'],
        $telefono,
        $id_region,
        $id_ciudad,
        $direccion
    );
    
    if (!$stmt_usuario->execute()) {
        throw new Exception('Error al registrar usuario: ' . $stmt_usuario->error);
    }
    
    $id_usuario = $conn->insert_id;
    $stmt_usuario->close();
    
    // Insertar credenciales
    $stmt_credencial = $conn->prepare("
        INSERT INTO credenciales (id_usuario, nombre_usuario, correo_electronico, contrasena_hash) VALUES (?, ?, ?, ?)
    ");
    
    $stmt_credencial->bind_param('isss', $id_usuario, $data['nombre_usuario'], $data['correo_electronico'], $contrasena_hash);
    
    if (!$stmt_credencial->execute()) {
        throw new Exception('Error al registrar credenciales: ' . $stmt_credencial->error);
    }
    
    $stmt_credencial->close();
    
    // Insertar relación usuario-rol
    $stmt_rol = $conn->prepare("
        INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)
    ");
    
    $stmt_rol->bind_param('ii', $id_usuario, $id_rol);
    
    if (!$stmt_rol->execute()) {
        throw new Exception('Error al asignar rol: ' . $stmt_rol->error);
    }
    
    $stmt_rol->close();

    // Si es administrador: crear suscripción con plan por defecto y enlazar
    if ($tipo_usuario === 'administrador') {
        $fecha_inicio = date('Y-m-d');
        $fecha_fin = date('Y-m-d', strtotime('+30 days'));
        $stmt_sus = $conn->prepare("INSERT INTO suscripciones (id_usuario, id_plan, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)");
        $stmt_sus->bind_param('iiss', $id_usuario, $plan_por_defecto_admin, $fecha_inicio, $fecha_fin);
        if (!$stmt_sus->execute()) { $err = $stmt_sus->error; $stmt_sus->close(); throw new Exception('Error al crear suscripción: ' . $err); }
        $id_suscripcion_new = $conn->insert_id; $stmt_sus->close();
        $stmt_upd = $conn->prepare("UPDATE usuarios SET id_suscripcion = ? WHERE id_usuario = ?");
        $stmt_upd->bind_param('ii', $id_suscripcion_new, $id_usuario);
        if (!$stmt_upd->execute()) { $err = $stmt_upd->error; $stmt_upd->close(); throw new Exception('Error al enlazar suscripción al usuario: ' . $err); }
        $stmt_upd->close();
    }
    
    // Confirmar transacción
    $conn->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => ucfirst($tipo_usuario) . ' registrado correctamente', 
        'tipo_usuario' => $tipo_usuario
    ]);
    
} catch (Exception $e) {
    // Revertir transacción
    $conn->rollback();
    
    $result = handleMySQLError($e->getMessage(), $conn);
    echo json_encode($result);
}

$conn->close();
exit;
?>