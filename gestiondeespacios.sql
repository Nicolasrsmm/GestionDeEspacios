-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-01-2026 a las 16:55:40
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gestiondeespacios`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_espacio_cliente`
--

CREATE TABLE `asignacion_espacio_cliente` (
  `id_asignacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_espacio` int(11) NOT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp(),
  `id_horario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificacionadministrador`
--

CREATE TABLE `calificacionadministrador` (
  `id_calificacion` int(11) NOT NULL,
  `id_usuario_cliente` int(11) NOT NULL,
  `id_usuario_admin` int(11) NOT NULL,
  `puntuacion` tinyint(4) DEFAULT NULL CHECK (`puntuacion` between 1 and 5),
  `comentario` text DEFAULT NULL,
  `fecha_calificacion` datetime DEFAULT current_timestamp(),
  `promedio_calificacion` decimal(3,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificacionespacio`
--

CREATE TABLE `calificacionespacio` (
  `id_calificacion` int(11) NOT NULL,
  `id_usuario_cliente` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `puntuacion` tinyint(4) DEFAULT NULL CHECK (`puntuacion` between 1 and 5),
  `comentario` text DEFAULT NULL,
  `fecha_calificacion` datetime DEFAULT current_timestamp(),
  `promedio_calificacion` decimal(3,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciudades`
--

CREATE TABLE `ciudades` (
  `id_ciudad` int(11) NOT NULL,
  `id_region` int(11) NOT NULL,
  `nombre_ciudad` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ciudades`
--

INSERT INTO `ciudades` (`id_ciudad`, `id_region`, `nombre_ciudad`) VALUES
(1, 1, 'Arica'),
(2, 1, 'Camarones'),
(3, 1, 'Putre'),
(4, 1, 'General Lagos'),
(5, 2, 'Iquique'),
(6, 2, 'Alto Hospicio'),
(7, 2, 'Pozo Almonte'),
(8, 2, 'Camiña'),
(9, 2, 'Colchane'),
(10, 2, 'Huara'),
(11, 2, 'Pica'),
(12, 3, 'Antofagasta'),
(13, 3, 'Mejillones'),
(14, 3, 'Sierra Gorda'),
(15, 3, 'Taltal'),
(16, 3, 'Calama'),
(17, 3, 'Ollagüe'),
(18, 3, 'San Pedro de Atacama'),
(19, 3, 'Tocopilla'),
(20, 3, 'María Elena'),
(21, 4, 'Copiapó'),
(22, 4, 'Caldera'),
(23, 4, 'Tierra Amarilla'),
(24, 4, 'Chañaral'),
(25, 4, 'Diego de Almagro'),
(26, 4, 'Vallenar'),
(27, 4, 'Alto del Carmen'),
(28, 4, 'Freirina'),
(29, 4, 'Huasco'),
(30, 5, 'La Serena'),
(31, 5, 'Coquimbo'),
(32, 5, 'Andacollo'),
(33, 5, 'La Higuera'),
(34, 5, 'Paihuano'),
(35, 5, 'Vicuña'),
(36, 5, 'Illapel'),
(37, 5, 'Canela'),
(38, 5, 'Los Vilos'),
(39, 5, 'Salamanca'),
(40, 5, 'Ovalle'),
(41, 5, 'Combarbalá'),
(42, 5, 'Monte Patria'),
(43, 5, 'Punitaqui'),
(44, 5, 'Río Hurtado'),
(45, 6, 'Valparaíso'),
(46, 6, 'Casablanca'),
(47, 6, 'Concón'),
(48, 6, 'Juan Fernández'),
(49, 6, 'Puchuncaví'),
(50, 6, 'Quintero'),
(51, 6, 'Viña del Mar'),
(52, 6, 'Isla de Pascua'),
(53, 6, 'Los Andes'),
(54, 6, 'Calle Larga'),
(55, 6, 'Rinconada'),
(56, 6, 'San Esteban'),
(57, 6, 'La Ligua'),
(58, 6, 'Cabildo'),
(59, 6, 'Papudo'),
(60, 6, 'Petorca'),
(61, 6, 'Zapallar'),
(62, 6, 'Quillota'),
(63, 6, 'Calera'),
(64, 6, 'Hijuelas'),
(65, 6, 'La Cruz'),
(66, 6, 'San Antonio'),
(67, 6, 'Algarrobo'),
(68, 6, 'Cartagena'),
(69, 6, 'El Quisco'),
(70, 6, 'El Tabo'),
(71, 6, 'Santo Domingo'),
(72, 6, 'San Felipe'),
(73, 6, 'Catemu'),
(74, 6, 'Llay Llay'),
(75, 6, 'Panquehue'),
(76, 6, 'Putaendo'),
(77, 6, 'Santa María'),
(78, 7, 'Cerrillos'),
(79, 7, 'Cerro Navia'),
(80, 7, 'Conchalí'),
(81, 7, 'El Bosque'),
(82, 7, 'Estación Central'),
(83, 7, 'Huechuraba'),
(84, 7, 'Independencia'),
(85, 7, 'La Cisterna'),
(86, 7, 'La Florida'),
(87, 7, 'La Granja'),
(88, 7, 'La Pintana'),
(89, 7, 'La Reina'),
(90, 7, 'Las Condes'),
(91, 7, 'Lo Barnechea'),
(92, 7, 'Lo Espejo'),
(93, 7, 'Lo Prado'),
(94, 7, 'Macul'),
(95, 7, 'Maipú'),
(96, 7, 'Ñuñoa'),
(97, 7, 'Pedro Aguirre Cerda'),
(98, 7, 'Peñalolén'),
(99, 7, 'Providencia'),
(100, 7, 'Pudahuel'),
(101, 7, 'Quilicura'),
(102, 7, 'Quinta Normal'),
(103, 7, 'Recoleta'),
(104, 7, 'Renca'),
(105, 7, 'San Joaquín'),
(106, 7, 'San Miguel'),
(107, 7, 'San Ramón'),
(108, 7, 'Vitacura'),
(109, 7, 'Pirque'),
(110, 7, 'Puente Alto'),
(111, 7, 'San José de Maipo'),
(112, 7, 'Colina'),
(113, 7, 'Lampa'),
(114, 7, 'Tiltil'),
(115, 8, 'Rancagua'),
(116, 8, 'Codegua'),
(117, 8, 'Coinco'),
(118, 8, 'Coltauco'),
(119, 8, 'Doñihue'),
(120, 8, 'Graneros'),
(121, 8, 'Las Cabras'),
(122, 8, 'Machalí'),
(123, 8, 'Malloa'),
(124, 8, 'Mostazal'),
(125, 8, 'Olivar'),
(126, 8, 'Peumo'),
(127, 8, 'Pichidegua'),
(128, 8, 'Quinta de Tilcoco'),
(129, 8, 'Rengo'),
(130, 8, 'Requínoa'),
(131, 8, 'San Vicente'),
(132, 8, 'La Estrella'),
(133, 8, 'Litueche'),
(134, 8, 'Lolol'),
(135, 8, 'Marchihue'),
(136, 8, 'Navidad'),
(137, 8, 'Paredones'),
(138, 8, 'San Fernando'),
(139, 8, 'Chépica'),
(140, 8, 'Chimbarongo'),
(141, 8, 'Nancagua'),
(142, 8, 'Palmilla'),
(143, 8, 'Peralillo'),
(144, 8, 'Placilla'),
(145, 8, 'Pumanque'),
(146, 8, 'Santa Cruz'),
(147, 9, 'Talca'),
(148, 9, 'Constitución'),
(149, 9, 'Curepto'),
(150, 9, 'Empedrado'),
(151, 9, 'Maule'),
(152, 9, 'Pelarco'),
(153, 9, 'Pencahue'),
(154, 9, 'Río Claro'),
(155, 9, 'San Clemente'),
(156, 9, 'San Rafael'),
(157, 9, 'Cauquenes'),
(158, 9, 'Chanco'),
(159, 9, 'Pelluhue'),
(160, 9, 'Curicó'),
(161, 9, 'Hualañé'),
(162, 9, 'Licantén'),
(163, 9, 'Molina'),
(164, 9, 'Rauco'),
(165, 9, 'Romeral'),
(166, 9, 'Sagrada Familia'),
(167, 9, 'Teno'),
(168, 9, 'Vichuquén'),
(169, 9, 'Linares'),
(170, 9, 'Colbún'),
(171, 9, 'Longaví'),
(172, 9, 'Parral'),
(173, 9, 'Retiro'),
(174, 9, 'San Javier'),
(175, 9, 'Villa Alegre'),
(176, 9, 'Yerbas Buenas'),
(177, 10, 'Chillán'),
(178, 10, 'Chillán Viejo'),
(179, 10, 'Bulnes'),
(180, 10, 'Cobquecura'),
(181, 10, 'Coelemu'),
(182, 10, 'Coihueco'),
(183, 10, 'El Carmen'),
(184, 10, 'Ninhue'),
(185, 10, 'Pemuco'),
(186, 10, 'Pinto'),
(187, 10, 'Quillón'),
(188, 10, 'San Ignacio'),
(189, 10, 'Yungay'),
(190, 11, 'Concepción'),
(191, 11, 'Coronel'),
(192, 11, 'Chiguayante'),
(193, 11, 'Florida'),
(194, 11, 'Hualpén'),
(195, 11, 'Hualqui'),
(196, 11, 'Lota'),
(197, 11, 'Penco'),
(198, 11, 'San Pedro de la Paz'),
(199, 11, 'Santa Juana'),
(200, 11, 'Talcahuano'),
(201, 11, 'Tomé'),
(202, 11, 'Hualqui'),
(203, 11, 'Lebu'),
(204, 11, 'Arauco'),
(205, 11, 'Cañete'),
(206, 11, 'Contulmo'),
(207, 11, 'Curanilahue'),
(208, 11, 'Los Álamos'),
(209, 11, 'Tirúa'),
(210, 12, 'Temuco'),
(211, 12, 'Carahue'),
(212, 12, 'Cunco'),
(213, 12, 'Curarrehue'),
(214, 12, 'Freire'),
(215, 12, 'Galvarino'),
(216, 12, 'Gorbea'),
(217, 12, 'Lautaro'),
(218, 12, 'Loncoche'),
(219, 12, 'Melipeuco'),
(220, 12, 'Nueva Imperial'),
(221, 12, 'Padre Las Casas'),
(222, 12, 'Perquenco'),
(223, 12, 'Pitrufquén'),
(224, 12, 'Pucón'),
(225, 12, 'Saavedra'),
(226, 12, 'Teodoro Schmidt'),
(227, 12, 'Toltén'),
(228, 12, 'Vilcún'),
(229, 12, 'Villarrica'),
(230, 13, 'Valdivia'),
(231, 13, 'Corral'),
(232, 13, 'Lanco'),
(233, 13, 'Los Lagos'),
(234, 13, 'Máfil'),
(235, 13, 'Mariquina'),
(236, 13, 'Paillaco'),
(237, 13, 'Panguipulli'),
(238, 13, 'La Unión'),
(239, 13, 'Futrono'),
(240, 13, 'Río Bueno'),
(241, 14, 'Puerto Montt'),
(242, 14, 'Calbuco'),
(243, 14, 'Cochamó'),
(244, 14, 'Fresia'),
(245, 14, 'Frutillar'),
(246, 14, 'Los Muermos'),
(247, 14, 'Llanquihue'),
(248, 14, 'Maullín'),
(249, 14, 'Puerto Varas'),
(250, 14, 'Castro'),
(251, 14, 'Ancud'),
(252, 14, 'Chonchi'),
(253, 14, 'Curaco de Vélez'),
(254, 14, 'Dalcahue'),
(255, 14, 'Puqueldón'),
(256, 14, 'Queilén'),
(257, 14, 'Quellón'),
(258, 14, 'Quemchi'),
(259, 14, 'Quinchao'),
(260, 14, 'Osorno'),
(261, 14, 'Puerto Octay'),
(262, 14, 'Purranque'),
(263, 14, 'Puyehue'),
(264, 14, 'Río Negro'),
(265, 14, 'San Pablo'),
(266, 14, 'Chaitén'),
(267, 14, 'Futaleufú'),
(268, 14, 'Hualaihué'),
(269, 14, 'Palena'),
(270, 15, 'Coyhaique'),
(271, 15, 'Lago Verde'),
(272, 15, 'Aysén'),
(273, 15, 'Cisnes'),
(274, 15, 'Guaitecas'),
(275, 15, 'Cochrane'),
(276, 15, 'O\'Higgins'),
(277, 15, 'Tortel'),
(278, 15, 'Chile Chico'),
(279, 15, 'Río Ibáñez'),
(280, 16, 'Punta Arenas'),
(281, 16, 'Puerto Natales'),
(282, 16, 'Torres del Paine'),
(283, 16, 'Porvenir'),
(284, 16, 'Primavera'),
(285, 16, 'Timaukel'),
(286, 16, 'Cabo de Hornos'),
(287, 16, 'Antártica');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comportamientocliente`
--

CREATE TABLE `comportamientocliente` (
  `id_comportamiento` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `descripcion` text NOT NULL,
  `tipo_comportamiento` varchar(50) NOT NULL,
  `nivel_gravedad` tinyint(4) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `calificacion` int(11) DEFAULT NULL CHECK (`calificacion` >= 1 and `calificacion` <= 5),
  `id_administrador_calificador` int(11) DEFAULT NULL,
  `nombre_espacio_respaldo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contador_admin_espacios`
--

CREATE TABLE `contador_admin_espacios` (
  `id_usuario` int(11) NOT NULL,
  `total_espacios` int(11) DEFAULT 0,
  `total_publicaciones` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `contador_admin_espacios`
--

INSERT INTO `contador_admin_espacios` (`id_usuario`, `total_espacios`, `total_publicaciones`) VALUES
(35, 2, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `credenciales`
--

CREATE TABLE `credenciales` (
  `id_credencial` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `correo_electronico` varchar(100) NOT NULL,
  `contrasena_hash` varchar(255) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_expiracion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `credenciales`
--

INSERT INTO `credenciales` (`id_credencial`, `id_usuario`, `nombre_usuario`, `correo_electronico`, `contrasena_hash`, `fecha_creacion`, `fecha_expiracion`) VALUES
(27, 28, 'admin', 'adminsistem@tuempresa.com', '$argon2id$v=19$m=65536,t=3,p=4$wvk+MYsF8Pjy2BgZ9WZHxA$iqktPdigPGLApAbR3+jxDnBsNpF3JuxkLF7gSjWGhBE', '2025-11-10 17:59:19', NULL),
(33, 34, 'nicolas', 'nicolas.gota454@gmail.com', '$argon2id$v=19$m=65536,t=4,p=1$QjROM2NLd2FMbG1JTVNlYw$D77+wRdLU/SBZXRrqIAeWXYIgvfKNzNKaMl5QTlSdH4', '2025-12-15 19:20:32', NULL),
(34, 35, 'luis', 'nicolas.sanmartin1@virginiogomez.cl', '$argon2id$v=19$m=65536,t=4,p=1$Wm9LREdQQUNTaVU3YTJBQg$A+T8G06blgmYmc7lGagchb+EGMOS8lxrMnYQRu55PUU', '2025-12-15 19:23:02', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `envioreportes`
--

CREATE TABLE `envioreportes` (
  `id_reporte` int(11) NOT NULL,
  `id_asignacion` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `contenido` text NOT NULL,
  `estado` enum('Enviado','Revisado','Resuelto') DEFAULT 'Enviado',
  `respuesta_admin` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_respuesta` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipamiento`
--

CREATE TABLE `equipamiento` (
  `id_equipamiento` int(11) NOT NULL,
  `id_espacio` int(11) NOT NULL,
  `nombre_equipamiento` varchar(100) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'Disponible',
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fotos_publicacion`
--

CREATE TABLE `fotos_publicacion` (
  `id_foto` int(11) NOT NULL,
  `id_espacio` int(11) DEFAULT NULL,
  `id_publicacion` int(11) DEFAULT NULL,
  `url_imagen` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `fotos_publicacion`
--

INSERT INTO `fotos_publicacion` (`id_foto`, `id_espacio`, `id_publicacion`, `url_imagen`) VALUES
(101, 26, NULL, 'frontend/styles/images/foto1_69651b1f02db4_1768233759.0117_2760.jpg'),
(102, 26, NULL, 'frontend/styles/images/foto2_69651b1f030d5_1768233759.0125_7411.jpg'),
(103, 26, NULL, 'frontend/styles/images/foto3_69651b1f03218_1768233759.0128_9218.jpg');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gestiondeespacio`
--

CREATE TABLE `gestiondeespacio` (
  `id_espacio` int(11) NOT NULL,
  `nombre_espacio` varchar(100) NOT NULL,
  `tipo_espacio` varchar(50) NOT NULL,
  `metros_cuadrados` decimal(10,2) NOT NULL,
  `id_region` int(11) NOT NULL,
  `id_ciudad` int(11) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `ubicacion_interna` varchar(100) DEFAULT NULL,
  `disponible` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `id_usuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `gestiondeespacio`
--

INSERT INTO `gestiondeespacio` (`id_espacio`, `nombre_espacio`, `tipo_espacio`, `metros_cuadrados`, `id_region`, `id_ciudad`, `direccion`, `ubicacion_interna`, `disponible`, `fecha_creacion`, `id_usuario`) VALUES
(26, 'Oficina 1', 'Oficina', 2000.00, 1, 1, 'los nogales 55', 'piso 22', 1, '2026-01-12 13:02:39', 35);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horario_espacios`
--

CREATE TABLE `horario_espacios` (
  `id_horario` int(11) NOT NULL,
  `id_espacio` int(11) NOT NULL,
  `nombre_dia` varchar(50) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_termino` date NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajesasignacion`
--

CREATE TABLE `mensajesasignacion` (
  `id_mensaje` int(11) NOT NULL,
  `id_asignacion` int(11) NOT NULL,
  `id_emisor` int(11) NOT NULL,
  `id_receptor` int(11) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` datetime DEFAULT current_timestamp(),
  `leido` tinyint(4) DEFAULT 0,
  `borrado_admin` tinyint(4) DEFAULT 0,
  `borrado_cliente` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajesconsulta`
--

CREATE TABLE `mensajesconsulta` (
  `id_mensaje` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `id_emisor` int(11) NOT NULL,
  `id_receptor` int(11) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` datetime DEFAULT current_timestamp(),
  `leido` tinyint(4) DEFAULT 0,
  `borrado_admin` tinyint(4) DEFAULT 0,
  `borrado_cliente` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodos_pago`
--

CREATE TABLE `metodos_pago` (
  `id_metodo_pago` int(11) NOT NULL,
  `metodo_pago` varchar(50) NOT NULL,
  `proveedor` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `metodos_pago`
--

INSERT INTO `metodos_pago` (`id_metodo_pago`, `metodo_pago`, `proveedor`) VALUES
(26, 'VD', 'Transbank');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL,
  `id_suscripcion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_plan` int(11) NOT NULL,
  `id_metodo_pago` int(11) NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `cantidad_cuotas` int(11) DEFAULT 1,
  `monto_por_cuota` decimal(10,2) GENERATED ALWAYS AS (`monto_total` / `cantidad_cuotas`) STORED,
  `fecha_pago` datetime DEFAULT current_timestamp(),
  `estado` enum('pendiente','completado','fallido','reembolsado') DEFAULT 'completado',
  `transaccion_id` varchar(100) DEFAULT NULL,
  `token_pago` varchar(255) DEFAULT NULL,
  `buy_order` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `planes`
--

CREATE TABLE `planes` (
  `id_plan` int(11) NOT NULL,
  `nombre_plan` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `cantidad_espacios` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `planes`
--

INSERT INTO `planes` (`id_plan`, `nombre_plan`, `precio`, `cantidad_espacios`) VALUES
(1, 'Básica', 0.00, 5),
(2, 'Estándar', 20000.00, 12),
(3, 'Premium', 35000.00, 25),
(4, 'Corporativa', 50000.00, 50);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicararriendo`
--

CREATE TABLE `publicararriendo` (
  `id_publicacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `id_region` int(11) NOT NULL,
  `id_ciudad` int(11) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `metros_cuadrados` decimal(10,2) NOT NULL,
  `tipo_espacio` varchar(50) NOT NULL,
  `equipamiento` text DEFAULT NULL,
  `precio_arriendo` decimal(10,2) NOT NULL,
  `estado` enum('Publicado','Reservado','Finalizado') DEFAULT 'Publicado',
  `fecha_publicacion` datetime DEFAULT current_timestamp(),
  `fecha_finalizacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `regiones`
--

CREATE TABLE `regiones` (
  `id_region` int(11) NOT NULL,
  `nombre_region` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `regiones`
--

INSERT INTO `regiones` (`id_region`, `nombre_region`) VALUES
(3, 'Región de Antofagasta'),
(1, 'Región de Arica y Parinacota'),
(4, 'Región de Atacama'),
(15, 'Región de Aysén del General Carlos Ibáñez del Campo'),
(5, 'Región de Coquimbo'),
(12, 'Región de La Araucanía'),
(14, 'Región de Los Lagos'),
(13, 'Región de Los Ríos'),
(16, 'Región de Magallanes y de la Antártica Chilena'),
(10, 'Región de Ñuble'),
(2, 'Región de Tarapacá'),
(6, 'Región de Valparaíso'),
(11, 'Región del Biobío'),
(8, 'Región del Libertador General Bernardo O\'Higgins'),
(9, 'Región del Maule'),
(7, 'Región Metropolitana de Santiago');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` enum('AdminSistema','Administrador','Colaboradores','Cliente') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'AdminSistema'),
(2, 'Administrador'),
(3, 'Colaboradores'),
(4, 'Cliente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesion`
--

CREATE TABLE `sesion` (
  `id_sesion` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `token_sesion` varchar(255) NOT NULL,
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL,
  `ultima_accion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sesion`
--

INSERT INTO `sesion` (`id_sesion`, `id_usuario`, `token_sesion`, `fecha_inicio`, `fecha_fin`, `ultima_accion`) VALUES
(161, 28, 'a64481c440324116e5ba2d2944d54ef458952b88f73aa7fbe1ae4eab6ab9f476', '2025-12-15 19:11:52', NULL, NULL),
(162, 28, '2e8e33415f529a802163cd1f7b619b34b24530d44e89544f6920701b5aaed1fd', '2025-12-15 19:18:13', NULL, NULL),
(164, 34, 'ec92ff0e40be8b78527e1d7e5c3b37b0907abf1bd3018bcdf00bc0e338f9e44f', '2025-12-15 19:24:04', NULL, NULL),
(165, 35, 'b74ffbe087fd44e744f146f432c2a8592416c4e342d1a3696f5660b142b3a266', '2025-12-15 19:24:25', NULL, NULL),
(175, 28, 'ebe75a7d25bf56a7458472fe6f676cac91c6f8d4db237fa15ced430e9da238f2', '2025-12-17 09:27:39', NULL, NULL),
(176, 35, '324467cb19bfa3130574f85fa895e5359d4cf827498c95ffaba554a0fbb8898d', '2025-12-17 09:27:48', NULL, NULL),
(177, 28, '9be0fa043a91e7d605484e3bebcccf548f3b6cd0fcef7510d6ba34a817ca60d3', '2026-01-12 12:59:11', NULL, NULL),
(178, 34, 'ec61dda72e3e1b1d200e780d17a74db8355528442b42672414219b31d1b9864a', '2026-01-12 13:01:18', NULL, NULL),
(179, 35, '3aa02d4fdb85d379bc5f90131bd9be832961cf2130dba2da8653fd07f7c18950', '2026-01-12 13:01:40', NULL, NULL),
(181, 35, 'a87af1147bfd6480819bb05391333de0e77b25e1d3117750f6122b6f9a976a00', '2026-01-12 14:58:01', NULL, NULL),
(185, 35, '86a37aeb9fb8c32fe724ca3eb4793fd071c27efe0477e24b16943c3b193bab00', '2026-01-15 12:55:11', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_cambio_horario`
--

CREATE TABLE `solicitud_cambio_horario` (
  `id_solicitud` int(11) NOT NULL,
  `id_asignacion` int(11) NOT NULL,
  `id_usuario_admin` int(11) NOT NULL,
  `fecha_solicitada` date NOT NULL,
  `motivo` text NOT NULL,
  `estado_admin` enum('Pendiente','Aprobado','Rechazado') DEFAULT 'Pendiente',
  `respuesta_admin` text DEFAULT NULL,
  `fecha_respuesta_admin` datetime DEFAULT NULL,
  `fecha_solicitud` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `suscripciones`
--

CREATE TABLE `suscripciones` (
  `id_suscripcion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_plan` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `suscripciones`
--

INSERT INTO `suscripciones` (`id_suscripcion`, `id_usuario`, `id_plan`, `fecha_inicio`, `fecha_fin`) VALUES
(19, 35, 1, '2025-12-15', '2026-01-14'),
(20, 35, 1, '2025-12-15', '2026-01-14'),
(21, 35, 1, '2026-01-12', '2026-02-11'),
(22, 35, 1, '2026-01-15', '2026-02-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_equipamiento`
--

CREATE TABLE `tipo_equipamiento` (
  `id_tipo_equipamiento` int(11) NOT NULL,
  `id_equipamiento` int(11) NOT NULL,
  `nombre_tipo` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `rut_numero` int(11) NOT NULL,
  `rut_dv` char(1) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `id_region` int(11) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `id_suscripcion` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `id_administrador_asociado` int(11) DEFAULT NULL,
  `id_ciudad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `rut_numero`, `rut_dv`, `nombre`, `apellido`, `telefono`, `id_region`, `direccion`, `id_suscripcion`, `activo`, `fecha_creacion`, `id_administrador_asociado`, `id_ciudad`) VALUES
(28, 11111111, '1', 'Admin', 'Sistema', '+56900000000', 1, 'Oficina central', NULL, 1, '2025-11-10 17:59:18', NULL, 2),
(34, 12968319, '8', 'nicolas', 'san Martin', '978681309', 11, 'los perales 55', NULL, 1, '2025-12-15 19:20:32', NULL, 201),
(35, 19509823, '9', 'luis', 'castillo', '978681309', 11, 'los perales 55', 22, 1, '2025-12-15 19:23:02', NULL, 190);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_rol`
--

CREATE TABLE `usuario_rol` (
  `id_usuariorol` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `estado` enum('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_rol`
--

INSERT INTO `usuario_rol` (`id_usuariorol`, `id_usuario`, `id_rol`, `fecha_creacion`, `fecha_actualizacion`, `estado`) VALUES
(37, 28, 1, '2025-11-26 20:17:52', '2025-11-26 20:17:52', 'Activo'),
(43, 34, 4, '2025-12-15 19:20:32', '2025-12-15 19:20:32', 'Activo'),
(44, 35, 2, '2025-12-15 19:23:02', '2025-12-15 19:23:02', 'Activo');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asignacion_espacio_cliente`
--
ALTER TABLE `asignacion_espacio_cliente`
  ADD PRIMARY KEY (`id_asignacion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_espacio` (`id_espacio`),
  ADD KEY `id_horario` (`id_horario`);

--
-- Indices de la tabla `calificacionadministrador`
--
ALTER TABLE `calificacionadministrador`
  ADD PRIMARY KEY (`id_calificacion`),
  ADD KEY `id_usuario_cliente` (`id_usuario_cliente`),
  ADD KEY `id_usuario_admin` (`id_usuario_admin`);

--
-- Indices de la tabla `calificacionespacio`
--
ALTER TABLE `calificacionespacio`
  ADD PRIMARY KEY (`id_calificacion`),
  ADD KEY `id_usuario_cliente` (`id_usuario_cliente`),
  ADD KEY `id_publicacion` (`id_publicacion`);

--
-- Indices de la tabla `ciudades`
--
ALTER TABLE `ciudades`
  ADD PRIMARY KEY (`id_ciudad`),
  ADD KEY `id_region` (`id_region`);

--
-- Indices de la tabla `comportamientocliente`
--
ALTER TABLE `comportamientocliente`
  ADD PRIMARY KEY (`id_comportamiento`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_administrador_calificador` (`id_administrador_calificador`);

--
-- Indices de la tabla `contador_admin_espacios`
--
ALTER TABLE `contador_admin_espacios`
  ADD PRIMARY KEY (`id_usuario`);

--
-- Indices de la tabla `credenciales`
--
ALTER TABLE `credenciales`
  ADD PRIMARY KEY (`id_credencial`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`),
  ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`);

--
-- Indices de la tabla `envioreportes`
--
ALTER TABLE `envioreportes`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `id_asignacion` (`id_asignacion`);

--
-- Indices de la tabla `equipamiento`
--
ALTER TABLE `equipamiento`
  ADD PRIMARY KEY (`id_equipamiento`),
  ADD KEY `id_espacio` (`id_espacio`);

--
-- Indices de la tabla `fotos_publicacion`
--
ALTER TABLE `fotos_publicacion`
  ADD PRIMARY KEY (`id_foto`),
  ADD KEY `id_espacio` (`id_espacio`),
  ADD KEY `id_publicacion` (`id_publicacion`);

--
-- Indices de la tabla `gestiondeespacio`
--
ALTER TABLE `gestiondeespacio`
  ADD PRIMARY KEY (`id_espacio`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_region` (`id_region`),
  ADD KEY `fk_gde_ciudad` (`id_ciudad`);

--
-- Indices de la tabla `horario_espacios`
--
ALTER TABLE `horario_espacios`
  ADD PRIMARY KEY (`id_horario`),
  ADD KEY `id_espacio` (`id_espacio`);

--
-- Indices de la tabla `mensajesasignacion`
--
ALTER TABLE `mensajesasignacion`
  ADD PRIMARY KEY (`id_mensaje`),
  ADD KEY `id_asignacion` (`id_asignacion`),
  ADD KEY `id_emisor` (`id_emisor`),
  ADD KEY `id_receptor` (`id_receptor`);

--
-- Indices de la tabla `mensajesconsulta`
--
ALTER TABLE `mensajesconsulta`
  ADD PRIMARY KEY (`id_mensaje`),
  ADD KEY `id_publicacion` (`id_publicacion`),
  ADD KEY `id_emisor` (`id_emisor`),
  ADD KEY `id_receptor` (`id_receptor`);

--
-- Indices de la tabla `metodos_pago`
--
ALTER TABLE `metodos_pago`
  ADD PRIMARY KEY (`id_metodo_pago`),
  ADD UNIQUE KEY `metodo_pago` (`metodo_pago`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD UNIQUE KEY `transaccion_id` (`transaccion_id`),
  ADD UNIQUE KEY `token_pago` (`token_pago`),
  ADD KEY `id_suscripcion` (`id_suscripcion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_plan` (`id_plan`),
  ADD KEY `id_metodo_pago` (`id_metodo_pago`);

--
-- Indices de la tabla `planes`
--
ALTER TABLE `planes`
  ADD PRIMARY KEY (`id_plan`);

--
-- Indices de la tabla `publicararriendo`
--
ALTER TABLE `publicararriendo`
  ADD PRIMARY KEY (`id_publicacion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_region` (`id_region`),
  ADD KEY `fk_publicararriendo_ciudad` (`id_ciudad`);

--
-- Indices de la tabla `regiones`
--
ALTER TABLE `regiones`
  ADD PRIMARY KEY (`id_region`),
  ADD UNIQUE KEY `nombre_region` (`nombre_region`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre_rol` (`nombre_rol`),
  ADD UNIQUE KEY `nombre_rol_2` (`nombre_rol`);

--
-- Indices de la tabla `sesion`
--
ALTER TABLE `sesion`
  ADD PRIMARY KEY (`id_sesion`),
  ADD UNIQUE KEY `token_sesion` (`token_sesion`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `solicitud_cambio_horario`
--
ALTER TABLE `solicitud_cambio_horario`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `id_asignacion` (`id_asignacion`),
  ADD KEY `id_usuario_admin` (`id_usuario_admin`);

--
-- Indices de la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  ADD PRIMARY KEY (`id_suscripcion`),
  ADD KEY `id_plan` (`id_plan`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `tipo_equipamiento`
--
ALTER TABLE `tipo_equipamiento`
  ADD PRIMARY KEY (`id_tipo_equipamiento`),
  ADD KEY `id_equipamiento` (`id_equipamiento`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD KEY `fk_usuarios_suscripciones` (`id_suscripcion`),
  ADD KEY `fk_usuarios_administrador_asociado` (`id_administrador_asociado`),
  ADD KEY `fk_usuarios_region` (`id_region`),
  ADD KEY `fk_usuarios_ciudad` (`id_ciudad`);

--
-- Indices de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  ADD PRIMARY KEY (`id_usuariorol`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asignacion_espacio_cliente`
--
ALTER TABLE `asignacion_espacio_cliente`
  MODIFY `id_asignacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `calificacionadministrador`
--
ALTER TABLE `calificacionadministrador`
  MODIFY `id_calificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `calificacionespacio`
--
ALTER TABLE `calificacionespacio`
  MODIFY `id_calificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `ciudades`
--
ALTER TABLE `ciudades`
  MODIFY `id_ciudad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=288;

--
-- AUTO_INCREMENT de la tabla `comportamientocliente`
--
ALTER TABLE `comportamientocliente`
  MODIFY `id_comportamiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `credenciales`
--
ALTER TABLE `credenciales`
  MODIFY `id_credencial` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `envioreportes`
--
ALTER TABLE `envioreportes`
  MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `equipamiento`
--
ALTER TABLE `equipamiento`
  MODIFY `id_equipamiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `fotos_publicacion`
--
ALTER TABLE `fotos_publicacion`
  MODIFY `id_foto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT de la tabla `gestiondeespacio`
--
ALTER TABLE `gestiondeespacio`
  MODIFY `id_espacio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `horario_espacios`
--
ALTER TABLE `horario_espacios`
  MODIFY `id_horario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `mensajesasignacion`
--
ALTER TABLE `mensajesasignacion`
  MODIFY `id_mensaje` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `mensajesconsulta`
--
ALTER TABLE `mensajesconsulta`
  MODIFY `id_mensaje` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de la tabla `metodos_pago`
--
ALTER TABLE `metodos_pago`
  MODIFY `id_metodo_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `planes`
--
ALTER TABLE `planes`
  MODIFY `id_plan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `publicararriendo`
--
ALTER TABLE `publicararriendo`
  MODIFY `id_publicacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `regiones`
--
ALTER TABLE `regiones`
  MODIFY `id_region` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `sesion`
--
ALTER TABLE `sesion`
  MODIFY `id_sesion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=186;

--
-- AUTO_INCREMENT de la tabla `solicitud_cambio_horario`
--
ALTER TABLE `solicitud_cambio_horario`
  MODIFY `id_solicitud` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  MODIFY `id_suscripcion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `tipo_equipamiento`
--
ALTER TABLE `tipo_equipamiento`
  MODIFY `id_tipo_equipamiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  MODIFY `id_usuariorol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asignacion_espacio_cliente`
--
ALTER TABLE `asignacion_espacio_cliente`
  ADD CONSTRAINT `asignacion_espacio_cliente_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `asignacion_espacio_cliente_ibfk_2` FOREIGN KEY (`id_espacio`) REFERENCES `gestiondeespacio` (`id_espacio`),
  ADD CONSTRAINT `asignacion_espacio_cliente_ibfk_3` FOREIGN KEY (`id_horario`) REFERENCES `horario_espacios` (`id_horario`);

--
-- Filtros para la tabla `calificacionadministrador`
--
ALTER TABLE `calificacionadministrador`
  ADD CONSTRAINT `calificacionadministrador_ibfk_1` FOREIGN KEY (`id_usuario_cliente`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `calificacionadministrador_ibfk_2` FOREIGN KEY (`id_usuario_admin`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `calificacionespacio`
--
ALTER TABLE `calificacionespacio`
  ADD CONSTRAINT `calificacionespacio_ibfk_1` FOREIGN KEY (`id_usuario_cliente`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `calificacionespacio_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicararriendo` (`id_publicacion`);

--
-- Filtros para la tabla `ciudades`
--
ALTER TABLE `ciudades`
  ADD CONSTRAINT `ciudades_ibfk_1` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`) ON DELETE CASCADE;

--
-- Filtros para la tabla `comportamientocliente`
--
ALTER TABLE `comportamientocliente`
  ADD CONSTRAINT `comportamientocliente_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `comportamientocliente_ibfk_2` FOREIGN KEY (`id_administrador_calificador`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `contador_admin_espacios`
--
ALTER TABLE `contador_admin_espacios`
  ADD CONSTRAINT `contador_admin_espacios_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `credenciales`
--
ALTER TABLE `credenciales`
  ADD CONSTRAINT `credenciales_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `envioreportes`
--
ALTER TABLE `envioreportes`
  ADD CONSTRAINT `envioreportes_ibfk_1` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion_espacio_cliente` (`id_asignacion`);

--
-- Filtros para la tabla `equipamiento`
--
ALTER TABLE `equipamiento`
  ADD CONSTRAINT `equipamiento_ibfk_1` FOREIGN KEY (`id_espacio`) REFERENCES `gestiondeespacio` (`id_espacio`) ON DELETE CASCADE;

--
-- Filtros para la tabla `fotos_publicacion`
--
ALTER TABLE `fotos_publicacion`
  ADD CONSTRAINT `fotos_publicacion_ibfk_1` FOREIGN KEY (`id_espacio`) REFERENCES `gestiondeespacio` (`id_espacio`) ON DELETE CASCADE,
  ADD CONSTRAINT `fotos_publicacion_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicararriendo` (`id_publicacion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `gestiondeespacio`
--
ALTER TABLE `gestiondeespacio`
  ADD CONSTRAINT `fk_gde_ciudad` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`),
  ADD CONSTRAINT `gestiondeespacio_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `gestiondeespacio_ibfk_3` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`);

--
-- Filtros para la tabla `horario_espacios`
--
ALTER TABLE `horario_espacios`
  ADD CONSTRAINT `horario_espacios_ibfk_1` FOREIGN KEY (`id_espacio`) REFERENCES `gestiondeespacio` (`id_espacio`) ON DELETE CASCADE;

--
-- Filtros para la tabla `mensajesasignacion`
--
ALTER TABLE `mensajesasignacion`
  ADD CONSTRAINT `mensajesasignacion_ibfk_1` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion_espacio_cliente` (`id_asignacion`),
  ADD CONSTRAINT `mensajesasignacion_ibfk_2` FOREIGN KEY (`id_emisor`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `mensajesasignacion_ibfk_3` FOREIGN KEY (`id_receptor`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `mensajesconsulta`
--
ALTER TABLE `mensajesconsulta`
  ADD CONSTRAINT `mensajesconsulta_ibfk_1` FOREIGN KEY (`id_publicacion`) REFERENCES `publicararriendo` (`id_publicacion`),
  ADD CONSTRAINT `mensajesconsulta_ibfk_2` FOREIGN KEY (`id_emisor`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `mensajesconsulta_ibfk_3` FOREIGN KEY (`id_receptor`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`id_suscripcion`) REFERENCES `suscripciones` (`id_suscripcion`),
  ADD CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`id_plan`) REFERENCES `planes` (`id_plan`),
  ADD CONSTRAINT `pagos_ibfk_4` FOREIGN KEY (`id_metodo_pago`) REFERENCES `metodos_pago` (`id_metodo_pago`);

--
-- Filtros para la tabla `publicararriendo`
--
ALTER TABLE `publicararriendo`
  ADD CONSTRAINT `fk_publicararriendo_ciudad` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`),
  ADD CONSTRAINT `publicararriendo_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `publicararriendo_ibfk_2` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`);

--
-- Filtros para la tabla `sesion`
--
ALTER TABLE `sesion`
  ADD CONSTRAINT `sesion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `solicitud_cambio_horario`
--
ALTER TABLE `solicitud_cambio_horario`
  ADD CONSTRAINT `solicitud_cambio_horario_ibfk_1` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion_espacio_cliente` (`id_asignacion`),
  ADD CONSTRAINT `solicitud_cambio_horario_ibfk_2` FOREIGN KEY (`id_usuario_admin`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  ADD CONSTRAINT `suscripciones_ibfk_1` FOREIGN KEY (`id_plan`) REFERENCES `planes` (`id_plan`),
  ADD CONSTRAINT `suscripciones_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `tipo_equipamiento`
--
ALTER TABLE `tipo_equipamiento`
  ADD CONSTRAINT `tipo_equipamiento_ibfk_1` FOREIGN KEY (`id_equipamiento`) REFERENCES `equipamiento` (`id_equipamiento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_administrador_asociado` FOREIGN KEY (`id_administrador_asociado`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_usuarios_ciudad` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`),
  ADD CONSTRAINT `fk_usuarios_region` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`),
  ADD CONSTRAINT `fk_usuarios_suscripciones` FOREIGN KEY (`id_suscripcion`) REFERENCES `suscripciones` (`id_suscripcion`),
  ADD CONSTRAINT `usuarios_ibfk_3` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`),
  ADD CONSTRAINT `usuarios_ibfk_4` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`);

--
-- Filtros para la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  ADD CONSTRAINT `usuario_rol_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_rol_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
