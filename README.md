# CRM Super CR — Punto de Venta y Gestión para Supermercado

Sistema de escritorio para supermercados en Costa Rica: punto de venta con lector de
código de barras, inventario, clientes (CRM) con fiado, reportes/dashboard y usuarios
con varios niveles de acceso.

## Arquitectura

```
D:\CRM
├── backend/    Servidor central (Node.js + Express + SQLite). Corre en UNA sola PC del super.
└── frontend/   App de caja (Electron + React). Se instala en cada caja/PC y se conecta
                al backend por la red local (WiFi/cable, misma red del super).
```

Cada caja es un cliente liviano: no guarda su propia base de datos, todas las cajas leen
y escriben en el mismo servidor central, así el inventario y las ventas quedan sincronizados
en tiempo real entre todas las cajas y la administración.

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

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`). **Actualmente no está instalado
  en esta PC** — descargalo e instalalo desde nodejs.org antes de continuar.
- Windows 10/11.

## Instalación

### 1. Servidor central (una sola vez, en la PC que hará de "servidor")

```bash
cd D:/CRM/backend
npm install
npm run seed
npm start
```

Esto crea la base de datos SQLite en `backend/data/super.db`, con dos usuarios de prueba:

| Usuario  | Contraseña | Rol   |
|----------|-----------|-------|
| admin    | admin123  | Administrador |
| cajero1  | cajero123 | Cajero |

**Cambiá estas contraseñas desde la pantalla de Usuarios apenas entrés.**

El servidor queda escuchando en `http://0.0.0.0:4000`. Anotá la IP local de esta PC
(`ipconfig` en PowerShell, buscá "Dirección IPv4") — las demás cajas la van a necesitar.

Para que el servidor siga corriendo aunque cierres sesión, dejá esa PC encendida y la
ventana de `npm start` abierta (o configuralo luego como servicio de Windows).

### 2. Cada caja (incluida la primera PC si también va a vender)

```bash
cd D:/CRM/frontend
npm install
npm run dev
```

Al abrir la app por primera vez, si no encuentra el servidor, usá el enlace
**"Cambiar dirección del servidor"** en la pantalla de login y poné
`http://<IP-de-la-PC-servidor>:4000` (por ejemplo `http://192.168.1.10:4000`).

### 3. Lector de código de barras

Conectalo por USB: los lectores estándar funcionan como un teclado (envían los dígitos y
luego Enter), así que no necesitan instalación — simplemente escaneá con el cursor en el
campo de búsqueda del POS y el producto se agrega solo al carrito.

## Uso diario

1. La PC servidor debe estar encendida con `npm start` corriendo en `backend/`.
2. En cada caja, abrí la app (`npm run dev` en `frontend/`, o el instalador `.exe` una vez
   que se genere con `npm run dist`).
3. Iniciá sesión con tu usuario y contraseña.

## Generar el instalador de Windows (opcional, para no depender de `npm run dev`)

```bash
cd D:/CRM/frontend
npm run build
npm run dist
```

Esto genera un instalador `.exe` en `frontend/release/` que podés copiar a cada caja.

## Estructura del código

```
backend/src/
├── server.js           Arranque del servidor Express
├── db.js                Conexión SQLite + carga de schema.sql
├── schema.sql            Definición de tablas
├── seed.js               Datos iniciales (usuarios, categorías, productos demo)
├── middleware/auth.js     Verificación de JWT y control de roles
└── routes/
    ├── auth.js            Login
    ├── products.js        Productos, categorías, stock
    ├── customers.js       Clientes, fiado, abonos
    ├── sales.js           Ventas (POS), anulaciones
    ├── reports.js         Reportes y dashboard
    └── users.js           Gestión de usuarios (solo admin)

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

- Conectar facturación electrónica real con Hacienda (certificado + ATV).
- Impresión directa a impresora térmica de tiquetes (hoy el tiquete se muestra en pantalla).
- Respaldo automático de `backend/data/super.db` (copialo periódicamente a un USB o la nube).
