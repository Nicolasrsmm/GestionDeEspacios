<?php
// Habilitar reporte de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuración de la base de datos
$DB_CONFIG = array(
    'host' => 'localhost',
    'user' => 'root',
    'password' => '',
    'database' => 'gestiondeespacios'
);

// Función para establecer la conexión a la base de datos
function getDBConnection() {
    global $DB_CONFIG;
    $conn = new mysqli(
        $DB_CONFIG['host'],
        $DB_CONFIG['user'],
        $DB_CONFIG['password'],
        $DB_CONFIG['database']
    );
    if ($conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8');
    
    // Configurar zona horaria para Chile
    $conn->query("SET time_zone = '-03:00'");
    $conn->query("SET NAMES utf8");
    
    return $conn;
}
?> 