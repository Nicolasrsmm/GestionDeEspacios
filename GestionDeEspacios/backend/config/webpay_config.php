<?php
declare(strict_types=1);

// Configuración de Webpay Plus
return [
    // production | integration
    'environment' => 'integration',

    // Credenciales de INTEGRACIÓN oficiales Webpay Plus REST
    'commerce_code' => '597055555532',
    'api_key'       => '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',

    // Opcional: si prefieres forzar HTTPs
    'force_https'   => false,

    // Endpoints base API REST
    'rest_base_integration' => 'https://webpay3gint.transbank.cl',
    'rest_base_production'  => 'https://webpay3g.transbank.cl',
];

