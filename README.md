# 🌐 **Gestión de Espacios – NextFlow** 🌐

¡Bienvenido a Gestión de Espacios – NextFlow! 🚀
Esta plataforma web permite administrar y arrendar espacios físicos de forma eficiente, integrando control de usuarios, gestión de reservas y pagos en línea con Webpay (Transbank) 💳.
Está diseñada para empresas, instituciones y organizaciones que necesitan una gestión centralizada y ordenad 🔥
``
---

## 🟢 **Para visualizar el video del software este debe ser descargado ya que github no tiene repoductor de video**

**Paso1:** Seleccionar el direcotiro dodne se encuentran los videos.

<img width="1917" height="520" alt="GestionEspacios1" src="https://github.com/user-attachments/assets/55f4da45-7ad5-4416-9cae-e3d615c963f4" />


**Paso2:** Seleccionar el unico video que existe.

<img width="1917" height="632" alt="Espacios22" src="https://github.com/user-attachments/assets/49d8e44e-8342-4bdb-8b32-e6adfc41668c" />


**Paso3:** Descargar el video existente.

<img width="1917" height="528" alt="Espacios3" src="https://github.com/user-attachments/assets/6d353e8c-299e-45fd-8727-f344a410a978" />





---


## 📜 **Descripción General**

Gestión de Espacios – NextFlow es un sistema web orientado a la administración integral de espacios físicos.
Permite controlar la disponibilidad, gestionar arriendos, administrar usuarios y roles, además de generar reportes y estadísticas que apoyan la toma de decisiones 📊.

---

## ✨ **Características Principales**
1.Autenticación y control de roles

2.Gestión de espacios y arriendos

3.Pagos en línea con Webpay (Transbank)

4.Sistema de mensajería interna

5.Reportes y estadísticas
   
6.Calificaciones y suscripciones

---


## 🛠️ **Requisitos del Sistema**
1.Antes de comenzar, asegúrate de contar con lo siguiente:
2.XAMPP 7.4 o superior
3.PHP 7.4+MySQL / MariaDB
5.Composer
👉 https://getcomposer.org


---

# 📥 **Instalación**

## 📂 **Clonar Repositorio**

1.Clona el proyecto desde GitHub:
git clone https://github.com/Nicolasrsmm/GestionDeEspacios.git

2.Luego, mueve el proyecto a la carpeta de XAMPP:
C:\xampp\htdocs\GestionDeEspacios

## ▶️ **Iniciar Servicios**

Desde el Panel de Control de XAMPP, inicia:

1.Apache

2.MySQL

3.Instalar Dependencias

4.Abre PowerShell o CMD, navega al proyecto y ejecuta:

    4.1cd C:\xampp\htdocs\GestionDeEspacios
    4.2composer install
Esto instalará las dependencias necesarias como Webpay SDK, PHPMailer y librerías adicionales ⚙️.


## 🗄️ **Configuración de Base de Datos**

1.Ubica el archivo incluido en el repositorio:

    1.1 gestiondeespacios.sql
  
2.Accede a phpMyAdmin:

    2.2 http://localhost/phpmyadmin
  
3.Crea una nueva base de datos:

    3.Nombre: gestiondeespacios

4.Importa la base de datos:

    4.1 Selecciona la base de datos gestiondeespacios
  
  
5.Ve a la pestaña Importar

    5.1 Selecciona el archivo gestiondeespacios.sql
  
Ejecuta la importación

###  🔁 ***Alternativamente, puedes importar desde consola:**
mysql -u root -p gestiondeespacios < backend/sql/gestiondeespacios.sql
📌 El archivo gestiondeespacios.sql contiene la estructura completa y los datos iniciales necesarios para el correcto funcionamiento del sistema.


---

##  🌐 **Acceso a la Aplicación**

1.Abre el sistema desde tu navegador:
http://localhost/GestionDeEspacios/frontend/login.html

##  👥 **Roles del Sistema**

### 👑 **Admin Sistema**
1.Control total del sistema

2.Gestión de usuarios y configuraciones generales

### 🧑‍💼 **Administrador**
1.Gestión de espacios y arriendos

2.Gestión de clientes y colaboradores

3.Generación de reportes


### 👤 **Cliente**
1.Visualización de espacios disponibles

2.Solicitud y gestión de arriendos

3.Calificaciones

### 🤝**Colaborador**

1.Gestión de espacios asignados

2.Visualización de solicitudes

##  🔑**Usuarios de Prueba**

###  👑 **Admin Sistema**
    1. Usuario: admin

    2.Contraseña: admin123

### 🧑‍💼**Administrador**
    1.Usuario: luis

    2.Contraseña: luis12345678

### 👤 **Cliente**
    1.Usuario: nicolas

    2.Contraseña: nicolas123

##  🗂️ ** Estructura del Proyecto **
GestionDeEspacios/
├── backend/        Backend PHP (API REST)

├── frontend/       Interfaz de usuario

├── vendor/         Dependencias (Composer)

├── composer.json

└── README.md

