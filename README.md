# CRM Super CR — Punto de Venta y Gestión para Supermercado

![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)
![H2](https://img.shields.io/badge/H2-embebida-1e6f5c?logo=databricks&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white)
![Licencia](https://img.shields.io/badge/uso-privado-lightgrey)

## ⬇️ Descarga rápida

**[→ Descargar CRM-Super-CR.zip (Releases)](https://github.com/VictorLi72/CRM-POS-CR/releases/latest)**

El ZIP incluye todo lo necesario. Extraelo y seguí los pasos según lo que necesitás:

### PC Servidor (una sola vez)

> Requisito único: [Java 17+](https://adoptium.net/) instalado.
> No se necesita MySQL ni ninguna base de datos externa — los datos se guardan localmente en un archivo.

1. Copiá la carpeta `servidor/` a la PC que hará de servidor
2. Doble clic en `servidor/iniciar-servidor.bat` — el servidor arranca en el puerto 4000
3. Anotá la IP de esta PC (`ipconfig` → "Dirección IPv4"), la van a necesitar las cajas
4. Dejá esa ventana abierta mientras el negocio esté en operación

### PC Caja (cada caja del negocio)

> No necesita Java ni nada adicional — solo Windows.

1. Doble clic en `caja/CRM Super Setup 1.0.1.exe` → se instala automáticamente
2. Abrí la app → en la pantalla de login tocá **"Cambiar dirección del servidor"** → poné `http://192.168.X.X:4000` (la IP del paso anterior)
3. Iniciá sesión — ¡listo!

| Usuario  | Contraseña | Rol           |
|----------|------------|---------------|
| admin    | admin123   | Administrador |
| cajero1  | cajero123  | Cajero        |

**Cambiá estas contraseñas desde Usuarios apenas entrés por primera vez.**

---

Sistema de escritorio para supermercados en Costa Rica: punto de venta con lector de
código de barras, inventario, clientes (CRM) con fiado, pedidos, devoluciones,
órdenes de compra a proveedores, reportes/dashboard y usuarios con varios niveles de acceso.

## Índice

- [Arquitectura](#arquitectura)
- [Funciones incluidas](#funciones-incluidas)
- [Requisitos para desarrollo](#requisitos-para-desarrollo)
- [Instalación para desarrollo](#instalación-para-desarrollo)
- [Uso diario](#uso-diario)
- [Estructura del código](#estructura-del-código)
- [Próximos pasos sugeridos](#próximos-pasos-sugeridos)

## Arquitectura

```
D:\CRM-POS-CR
├── backend/    Servidor central (Java 17 + Spring Boot + H2 embebida), arquitectura MVC en capas
│               (Controller → Service → Repository → Model). Corre en UNA sola PC del súper.
│               Los datos se guardan en ./datos/crm_db.mv.db junto al JAR — sin instalar nada.
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

### Acceso móvil
- QR desde Configuración → Acceso desde teléfono para ver el inventario desde el navegador del celular
- Detecta la IP de la PC automáticamente; también se puede ingresar manualmente

---

### Sobre la factura electrónica (Hacienda / ATV)

El sistema ya guarda todo lo necesario para facturación electrónica de Costa Rica
(código CABYS por producto, desglose de IVA por línea y por tarifa), pero **no** está
conectado al Administrador Tributario Virtual (ATV) de Hacienda — eso quedó fuera del
alcance por ahora. Para conectarlo más adelante se necesita: certificado digital de firma
(.p12), usuario/clave del ATV, y armar el XML según el formato v4.3 vigente de Hacienda.
Es un módulo que se puede agregar después sin rehacer el resto del sistema.

## Requisitos para desarrollo

| Herramienta | Versión        | Para qué                              |
|-------------|----------------|---------------------------------------|
| [JDK](https://adoptium.net/) | 17 o superior | Compilar y correr el backend |
| [Maven](https://maven.apache.org/download.cgi) | 3.9 o superior | Compilar el backend |
| [Node.js](https://nodejs.org) | 18 o superior  | Frontend (Electron + React + Vite)    |
| Windows     | 10/11          | —                                     |

> Para **usar** el sistema (no desarrollar) solo se necesita Java 17 en la PC servidor.
> Las PCs caja no necesitan nada adicional.

## Instalación para desarrollo

### 1. Servidor central (backend Java)

```bash
cd D:/CRM-POS-CR/backend
mvn spring-boot:run
```

En el primer arranque Spring Boot crea todas las tablas automáticamente con H2 y siembra
datos de prueba: dos usuarios, categorías, productos demo, tarifas de IVA y descuentos.
Los datos quedan en `backend/datos/crm_db.mv.db`.

| Usuario  | Contraseña | Rol           |
|----------|------------|---------------|
| admin    | admin123   | Administrador |
| cajero1  | cajero123  | Cajero        |

**Cambiá estas contraseñas desde la pantalla de Usuarios apenas entrés.**

El servidor queda escuchando en `http://0.0.0.0:4000`. Anotá la IP local de esta PC
(`ipconfig` en PowerShell, buscá "Dirección IPv4") — las demás cajas la van a necesitar.

### 2. Cada caja (incluida la PC servidor si también va a vender)

```bash
cd D:/CRM-POS-CR/frontend
npm install
npm run dev
```

Al abrir la app por primera vez, si no encuentra el servidor, usá el enlace
**"Cambiar dirección del servidor"** en la pantalla de login y poné
`http://<IP-de-la-PC-servidor>:4000` (por ejemplo `http://192.168.1.10:4000`).

### 3. Lector de código de barras

Conectalo por USB: los lectores estándar funcionan como un teclado (envían los dígitos y
luego Enter) sin instalación — escaneá con el cursor en el campo de búsqueda del POS.
También podés usar la cámara integrada con el botón de cámara en el POS.

### 4. Impresora térmica (opcional)

Compatible con cualquier impresora de 80 mm. Probada con Epson TM-T20II.
- **Modo Electron (app instalada)**: seleccioná la impresora en Configuración → Impresora.
- **Modo web**: al imprimir aparece un diálogo para elegir entre el diálogo del sistema o descargar el HTML.

## Generar el instalador de Windows

```bash
cd D:/CRM-POS-CR/frontend
npm run dist
```

Genera un instalador `.exe` en `../release/` que podés copiar a cada caja.

Para recompilar el backend:

```bash
cd D:/CRM-POS-CR/backend
mvn clean package -DskipTests -DskipFrontend=true
```

El JAR queda en `backend/target/pos-backend.jar`.

## Uso diario

1. La PC servidor debe estar encendida con `iniciar-servidor.bat` corriendo.
2. En cada caja, abrí la app instalada.
3. Iniciá sesión con tu usuario y contraseña.
4. El cajero accede al POS; supervisor y administrador tienen acceso a inventario, reportes y más.

## Respaldo de datos

Los datos están en un único archivo: `servidor/datos/crm_db.mv.db`.
Para hacer un respaldo, simplemente copiá ese archivo a un USB o la nube mientras el servidor **no** está corriendo.

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
- Respaldo automático programado del archivo `crm_db.mv.db` a USB o la nube.
- Empaquetar el backend como servicio de Windows para que arranque solo con la PC (NSSM/WinSW).
- App móvil nativa o PWA para supervisores que necesiten ver reportes desde el teléfono.
