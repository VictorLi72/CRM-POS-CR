# CRM Super CR — Punto de Venta y Gestión para Supermercado

![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white)
![Licencia](https://img.shields.io/badge/uso-privado-lightgrey)

## ⬇️ Descarga rápida (instalar en otra caja)

> Solo para instalar la **app de caja** en una PC adicional.
> El servidor central (backend + MySQL) sigue corriendo en la PC principal.

**[→ Descargar última versión (Releases)](https://github.com/VictorLi72/CRM-POS-CR/releases/latest)**

1. Descargá el archivo `CRM-Super-CR-Caja.rar`
2. Extraelo y ejecutá el instalador `.exe` que está adentro
3. Al abrir la app, tocá **"Cambiar dirección del servidor"** en el login
4. Poné la IP de la PC principal, por ejemplo: `http://192.168.1.10:4000`
5. Iniciá sesión con tu usuario y contraseña

> **¿Cómo saber la IP de la PC principal?**
> Abrí PowerShell y escribí `ipconfig` — buscá "Dirección IPv4" en la sección de tu red.

---

Sistema de escritorio para supermercados en Costa Rica: punto de venta con lector de
código de barras, inventario, clientes (CRM) con fiado, pedidos, devoluciones,
órdenes de compra a proveedores, reportes/dashboard y usuarios con varios niveles de acceso.

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
└── frontend/   App de caja (Electron + React + Vite). Se instala en cada caja/PC y se
                conecta al backend por la red local (WiFi/cable, misma red del súper).
```

Cada caja es un cliente liviano: no guarda su propia base de datos, todas las cajas leen
y escriben en el mismo servidor central, así el inventario y las ventas quedan sincronizados
en tiempo real entre todas las cajas y la administración.

## Funciones incluidas

### Punto de venta (POS)
- Entrada por lector de código de barras (funciona como teclado, sin drivers) o búsqueda por nombre
- Escaneo con cámara integrada (BarcodeScanner con jsQR)
- Carrito con cantidades editables, cálculo automático de IVA por línea y descuentos
- Métodos de pago: efectivo (con vuelto), tarjeta, SINPE Móvil, fiado y mixto (varios métodos)
- Tiquete moderno al finalizar con diseño de dos columnas, totales y código de barras
- Impresión directa a impresora térmica Epson TM-T20II (80 mm) o cualquier impresora via diálogo del sistema
- En modo web: elige entre imprimir (diálogo del SO) o descargar el archivo HTML
- Auto-impresión configurable al completar la venta

### Inventario
- Productos con categorías, precio de costo/venta, tarifa de IVA (13/4/2/1/0 %), código CABYS
- Control de stock con alertas de stock bajo (campana en topbar con conteo en tiempo real)
- Registro de movimientos: entradas, salidas, ajustes manuales
- **Lista de compras automática**: genera la lista de productos con stock bajo o agotado,
  imprimible o visible en el teléfono via QR

### Pedidos
- Módulo de pedidos para clientes: crear, ver detalle, cambiar estado
- Integrado con inventario y clientes existentes

### Órdenes de compra y proveedores
- Gestión de proveedores (nombre, contacto, teléfono, email)
- Órdenes de compra a proveedores con líneas de productos, estado (pendiente/recibida/cancelada)
- Al recibir una orden, ajusta automáticamente el stock del inventario

### Devoluciones
- Devoluciones de venta con detalle de ítems y motivo
- Anular una venta completa desde el historial (registra la anulación sin borrar el registro)

### Historial de ventas
- Búsqueda por folio, fecha, cajero y método de pago
- Ver detalle completo de cada venta
- Reimprimir tiquete (mismo diseño moderno que el tiquete original)
- Indicador visual de ventas con devolución o anuladas

### CRM de clientes
- Ficha de cliente, historial de compras, cuentas fiadas con límite de crédito
- Registro de abonos, puntos de lealtad automáticos (1 punto por cada ₡1 000)

### Cierre de caja (arqueo)
- Apertura/cierre de turno por cajero
- Resumen de ventas por método de pago
- Efectivo esperado vs. contado, diferencia

### Reportes y dashboard
- Ventas de hoy/mes, ventas por día (gráfico), top productos
- Ventas por categoría, ventas por cajero, margen de ganancia

### Configuración
- Encabezado del tiquete (nombre del negocio, cédula, teléfono, dirección, leyenda)
- Opciones de impresión: código de barras, folio, cajero, subtotal, IVA, unidades
- Selección de impresora (modo Electron), auto-impresión, impresora predeterminada
- IVA por tarifa, descuentos automáticos
- Gestión de usuarios con niveles de acceso (administrador / supervisor / cajero)
- Dirección del servidor configurable desde login (para cajas adicionales)

### Accesibilidad
- Panel de accesibilidad en el topbar (ícono de persona): abierto con un clic
- **Tema**: claro, oscuro o automático (sigue la preferencia del sistema operativo)
- **Tamaño de texto**: 4 niveles (S / M / L / XL) via zoom proporcional
- **Alto contraste**: refuerza bordes y texto secundario
- **Animaciones**: apagar para reducir movimiento
- Preferencias guardadas en `localStorage`, se aplican al instante y persisten entre sesiones
- La pantalla de login siempre se muestra en modo claro independientemente del tema activo

### Acceso móvil
- QR desde el módulo de inventario para ver la lista de compras en el teléfono sin instalar nada

---

### Sobre la factura electrónica (Hacienda / ATV)

El sistema ya guarda todo lo necesario para facturación electrónica de Costa Rica
(código CABYS por producto, desglose de IVA por línea y por tarifa), pero **no** está
conectado al Administrador Tributario Virtual (ATV) de Hacienda — eso quedó fuera del
alcance por ahora. Para conectarlo más adelante se necesita: certificado digital de firma
(.p12), usuario/clave del ATV, y armar el XML según el formato v4.3 vigente de Hacienda.
Es un módulo que se puede agregar después sin rehacer el resto del sistema.

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| [JDK](https://adoptium.net/) | 17 o superior | Compilar y correr el backend |
| [Maven](https://maven.apache.org/download.cgi) | 3.9 o superior | Compilar el backend |
| [MySQL](https://dev.mysql.com/downloads/mysql/) | 8.0 o superior | Base de datos central |
| [Node.js](https://nodejs.org) | 18 o superior | Frontend (Electron + React + Vite) |
| Windows | 10/11 | — |

## Instalación

### 1. Base de datos (una sola vez, en la PC que hará de "servidor")

Con MySQL instalado y corriendo, creá la base y un usuario dedicado:

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

Configurá la conexión con variables de entorno:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/crm_super_pos?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:SPRING_DATASOURCE_USERNAME = "crm_super"
$env:SPRING_DATASOURCE_PASSWORD = "CAMBIA-ESTA-CONTRASENA"
$env:APP_JWT_SECRET = "cambia-este-secreto-en-produccion"
```

Arrancá el servidor:

```bash
mvn spring-boot:run
```

En el primer arranque Spring Boot crea todas las tablas automáticamente y siembra datos de
prueba: dos usuarios, categorías, productos demo, tarifas de IVA y descuentos.

| Usuario  | Contraseña | Rol   |
|----------|-----------|-------|
| admin    | admin123  | Administrador |
| cajero1  | cajero123 | Cajero |

**Cambiá estas contraseñas desde la pantalla de Usuarios apenas entrés.**

El servidor queda escuchando en `http://0.0.0.0:4000`. Anotá la IP local de esta PC
(`ipconfig` en PowerShell, buscá "Dirección IPv4") — las demás cajas la van a necesitar.

### 3. Cada caja (incluida la PC servidor si también va a vender)

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
luego Enter) sin instalación — escaneá con el cursor en el campo de búsqueda del POS.
También podés usar la cámara integrada con el botón de cámara en el POS.

### 5. Impresora térmica (opcional)

Compatible con cualquier impresora de 80 mm. Probada con Epson TM-T20II.
- **Modo Electron (app instalada)**: seleccioná la impresora en Configuración → Impresora.
- **Modo web**: al imprimir aparece un diálogo para elegir entre el diálogo del sistema o descargar el HTML.

## Uso diario

1. La PC servidor debe estar encendida con el backend Java corriendo.
2. En cada caja, abrí la app (`npm run dev` o el `.exe` instalado).
3. Iniciá sesión con tu usuario y contraseña.
4. El cajero accede al POS; supervisor y administrador tienen acceso a inventario, reportes y más.

## Generar el instalador de Windows

```bash
cd D:/CRM-POS-CR/frontend
npm run build
npm run dist
```

Genera un instalador `.exe` en `frontend/release/` que podés copiar a cada caja.

## Estructura del código

```
backend/src/main/java/com/crmsuper/pos/
├── PosBackendApplication.java   Arranque de Spring Boot
├── config/                      Seguridad, CORS, Jackson (JSON en snake_case)
├── security/                    JWT: emisión, verificación, filtro de autenticación
├── model/                       Entidades JPA + enums de dominio
├── repository/                  Interfaces Spring Data JPA
├── dto/                         Objetos de request/response de la API
├── service/ y service/impl/     Lógica de negocio (interfaz + implementación)
└── controller/                  Controladores REST por área:
                                   auth, products, customers, sales, reports, users,
                                   turnos, tax-rates, discounts, pedidos, proveedores,
                                   ordenes-compra, devoluciones, health

frontend/src/
├── api/client.js              Cliente HTTP (axios), IP configurable, helpers de opciones
├── context/AuthContext.jsx    Sesión del usuario (JWT, rol, nombre)
├── utils/
│   ├── receiptHtml.js         Generador de HTML del tiquete + barcode Code128 + diálogo de impresión
│   ├── a11y.js                Preferencias de accesibilidad (tema, fuente, contraste, movimiento)
│   └── format.js              Formateo de moneda y fechas en español CR
├── components/
│   ├── Layout.jsx             Shell principal: sidebar, topbar, AccessibilityButton, LowStockBell
│   ├── Icons.jsx              Librería de íconos SVG (Lucide-style, sin dependencia externa)
│   └── BarcodeScanner.jsx     Escáner por cámara (jsQR)
├── styles/
│   ├── variables.css          Tokens de diseño + dark mode + accesibilidad (zoom, contraste, motion)
│   ├── base.css               Reset y estilos base
│   ├── layout.css             Shell, sidebar, topbar, modales
│   ├── components.css         Componentes reutilizables (cards, badges, tablas, forms, alertas)
│   ├── pos.css                Estilos específicos del POS y métodos de pago
│   ├── dashboard.css          Gráficos y métricas del dashboard
│   └── utils.css              Clases utilitarias y responsive
└── pages/
    ├── Login.jsx              Pantalla de login (siempre en modo claro)
    ├── POS.jsx                Punto de venta + Receipt post-venta
    ├── Inventory.jsx          Inventario + lista de compras + QR móvil
    ├── Customers.jsx          Clientes / CRM
    ├── Orders.jsx             Pedidos
    ├── PurchaseOrders.jsx     Órdenes de compra y proveedores
    ├── Returns.jsx            Devoluciones
    ├── SalesHistory.jsx       Historial de ventas + reimprimir + anular
    ├── CashRegister.jsx       Cierre de caja / arqueo
    ├── Reports.jsx            Reportes y dashboard
    ├── Promotions.jsx         Promociones
    ├── TaxDiscounts.jsx       IVA y descuentos
    ├── Users.jsx              Usuarios (administrador)
    ├── MobileAccess.jsx       Acceso móvil / QR
    └── Settings.jsx           Configuración de tiquete, impresora y servidor
```

## Próximos pasos sugeridos

- Conectar facturación electrónica real con Hacienda (certificado .p12 + ATV + XML v4.3).
- Respaldo automático de la base de datos MySQL (`mysqldump` programado, copiado a USB o la nube).
- Empaquetar el backend como servicio de Windows para que arranque solo con la PC (NSSM/WinSW).
- App móvil nativa o PWA para supervisores que necesiten ver reportes desde el teléfono.
