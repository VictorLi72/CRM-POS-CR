# CRM Super CR — Punto de Venta y Gestión para Supermercado

![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white)
![Licencia](https://img.shields.io/badge/uso-privado-lightgrey)

Sistema de escritorio para supermercados en Costa Rica: punto de venta con lector de
código de barras, inventario, clientes (CRM) con fiado, reportes/dashboard y usuarios
con varios niveles de acceso.

## Índice

- [Arquitectura](#arquitectura)
- [Funciones incluidas](#funciones-incluidas)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso diario](#uso-diario)
- [Estructura del código](#estructura-del-código)
- [Próximos pasos sugeridos](#próximos-pasos-sugeridos)

## Arquitectura

```
D:\CRM-POS-CR
├── backend/    Servidor central (Java 17 + Spring Boot + MySQL), arquitectura MVC en capas
│               (Controller → Service → Repository → Model). Corre en UNA sola PC del súper.
└── frontend/   App de caja (Electron + React). Se instala en cada caja/PC y se conecta
                al backend por la red local (WiFi/cable, misma red del súper).
```

Cada caja es un cliente liviano: no guarda su propia base de datos, todas las cajas leen
y escriben en el mismo servidor central, así el inventario y las ventas quedan sincronizados
en tiempo real entre todas las cajas y la administración.

El contrato HTTP (rutas, verbos, formas de las respuestas JSON) se mantiene igual al
que tenía la versión anterior del backend, así que el frontend actual sigue funcionando
sin cambios apuntando a este backend.

## Funciones incluidas

- **Punto de venta (POS)**: entrada por lector de código de barras (funciona como teclado,
  no necesita drivers especiales) o búsqueda por nombre, carrito, cálculo automático de IVA
  por línea, pagos en efectivo (con vuelto)/tarjeta/SINPE Móvil/fiado, tiquete al finalizar.
- **Inventario**: productos con categorías, precio de costo/venta, tarifa de IVA (13/4/2/1/0%),
  código CABYS (para factura electrónica futura), control de stock con alertas de stock bajo,
  y registro de movimientos (entradas, salidas, ajustes).
- **CRM de clientes**: ficha de cliente, historial de compras, cuentas fiadas con límite de
  crédito, registro de abonos, puntos de lealtad automáticos (1 punto por cada ₡1000).
- **Reportes y dashboard**: ventas de hoy/mes, ventas por día (gráfico), top productos,
  ventas por categoría, ventas por cajero, margen de ganancia.
- **Cierre de caja (arqueo)**: apertura/cierre de turno por cajero, resumen de ventas por
  método de pago, efectivo esperado vs. contado, diferencia.
- **Usuarios con niveles de acceso**:
  - **Cajero**: solo POS y clientes.
  - **Supervisor**: + inventario y reportes.
  - **Administrador**: acceso total, incluida la gestión de usuarios.

### Sobre la factura electrónica (Hacienda / ATV)

El sistema ya guarda todo lo necesario para facturación electrónica de Costa Rica
(código CABYS por producto, desglose de IVA por línea y por tarifa), pero **no** está
conectado al Administrador Tributario Virtual (ATV) de Hacienda — eso quedó fuera del
alcance por ahora, tal como se definió al iniciar el proyecto. Para conectarlo de verdad
más adelante se necesita: certificado digital de firma (.p12), usuario/clave del ATV, y
armar el XML según el formato v4.3 vigente de Hacienda — es un módulo que se puede agregar
después sin rehacer el resto del sistema.

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| [JDK](https://adoptium.net/) | 17 o superior | Compilar y correr el backend |
| [Maven](https://maven.apache.org/download.cgi) | 3.9 o superior | Compilar el backend (o usá `mvnw` si se agrega el wrapper) |
| [MySQL](https://dev.mysql.com/downloads/mysql/) | 8.0 o superior | Base de datos central |
| [Node.js](https://nodejs.org) | 18 o superior | Solo para el frontend (Electron + React) |
| Windows | 10/11 | — |

## Instalación

### 1. Base de datos (una sola vez, en la PC que hará de "servidor")

Con MySQL instalado y corriendo, creá la base y (opcionalmente) un usuario dedicado:

```sql
CREATE DATABASE IF NOT EXISTS crm_super_pos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'crm_super'@'%' IDENTIFIED BY 'CAMBIA-ESTA-CONTRASENA';
GRANT ALL PRIVILEGES ON crm_super_pos.* TO 'crm_super'@'%';
FLUSH PRIVILEGES;
```

### 2. Servidor central (backend Java)

```bash
cd D:/CRM-POS-CR/backend
```

Configurá la conexión a la base con variables de entorno (ajustá usuario/contraseña a lo
que hayas creado arriba):

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/crm_super_pos?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:SPRING_DATASOURCE_USERNAME = "crm_super"
$env:SPRING_DATASOURCE_PASSWORD = "CAMBIA-ESTA-CONTRASENA"
$env:APP_JWT_SECRET = "cambia-este-secreto-en-produccion"
```

Y arrancá el servidor:

```bash
mvn spring-boot:run
```

En el primer arranque, Spring Boot crea todas las tablas automáticamente (no hace falta
correr ningún script de esquema) y siembra datos de prueba: dos usuarios, categorías,
productos demo, tarifas de IVA y descuentos.

| Usuario  | Contraseña | Rol   |
|----------|-----------|-------|
| admin    | admin123  | Administrador |
| cajero1  | cajero123 | Cajero |

**Cambiá estas contraseñas desde la pantalla de Usuarios apenas entrés.**

El servidor queda escuchando en `http://0.0.0.0:4000`. Anotá la IP local de esta PC
(`ipconfig` en PowerShell, buscá "Dirección IPv4") — las demás cajas la van a necesitar.

Para que el servidor siga corriendo aunque cierres sesión, dejá esa PC encendida con el
proceso corriendo (o empaquetalo como servicio de Windows con `mvn package` + un runner
tipo NSSM/WinSW).

### 3. Cada caja (incluida la primera PC si también va a vender)

```bash
cd D:/CRM-POS-CR/frontend
npm install
npm run dev
```

Al abrir la app por primera vez, si no encuentra el servidor, usá el enlace
**"Cambiar dirección del servidor"** en la pantalla de login y poné
`http://<IP-de-la-PC-servidor>:4000` (por ejemplo `http://192.168.1.10:4000`).

### 4. Lector de código de barras

Conectalo por USB: los lectores estándar funcionan como un teclado (envían los dígitos y
luego Enter), así que no necesitan instalación — simplemente escaneá con el cursor en el
campo de búsqueda del POS y el producto se agrega solo al carrito.

## Uso diario

1. La PC servidor debe estar encendida con el backend Java corriendo (`mvn spring-boot:run`,
   o el `.jar` empaquetado con `java -jar target/pos-backend.jar`).
2. En cada caja, abrí la app (`npm run dev` en `frontend/`, o el instalador `.exe` una vez
   que se genere con `npm run dist`).
3. Iniciá sesión con tu usuario y contraseña.

## Generar el instalador de Windows (opcional, para no depender de `npm run dev`)

```bash
cd D:/CRM-POS-CR/frontend
npm run build
npm run dist
```

Esto genera un instalador `.exe` en `frontend/release/` que podés copiar a cada caja.

## Estructura del código

```
backend/src/main/java/com/crmsuper/pos/
├── PosBackendApplication.java  Arranque de Spring Boot
├── config/                     Seguridad, CORS, Jackson (JSON en snake_case)
├── security/                   JWT: emisión, verificación, filtro de autenticación
├── model/                      Entidades JPA (una por tabla) + enums de dominio
├── repository/                 Interfaces Spring Data JPA
├── dto/                        Objetos de request/response de la API
├── service/ y service/impl/    Lógica de negocio (interfaz + implementación por área)
├── controller/                 Controladores REST (@RestController), un archivo por área:
│                                auth, products, customers, sales, reports, users,
│                                turnos (cierre de caja), tax-rates, discounts
├── exception/                  Manejo centralizado de errores → {"error": "..."}
└── seed/                       Datos iniciales de prueba (equivalente al seed.js anterior)

frontend/src/
├── api/client.js          Cliente HTTP (axios) con IP de servidor configurable
├── context/AuthContext.jsx  Sesión del usuario
├── components/            Layout, sidebar, rutas protegidas por rol
└── pages/
    ├── Login.jsx
    ├── POS.jsx             Punto de venta
    ├── Inventory.jsx       Inventario
    ├── Customers.jsx       Clientes / CRM
    ├── Reports.jsx         Reportes / dashboard
    ├── Users.jsx           Usuarios (admin)
    └── Settings.jsx        IP del servidor
```

## Próximos pasos sugeridos

- Definir el rumbo del frontend (mantenerlo como está, o migrarlo también).
- Conectar facturación electrónica real con Hacienda (certificado + ATV).
- Impresión directa a impresora térmica de tiquetes (hoy el tiquete se muestra en pantalla).
- Respaldo automático de la base de datos MySQL (`mysqldump` programado, copiado a USB o la nube).
- Empaquetar el backend como servicio de Windows para que arranque solo con la PC.
