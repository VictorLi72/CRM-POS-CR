// Carga datos iniciales: usuario admin, categorías y productos de ejemplo.
// Ejecutar una sola vez: npm run seed
const bcrypt = require('bcryptjs');
const db = require('./db');

function seed() {
  const totalUsuarios = db.prepare('SELECT COUNT(*) AS c FROM usuarios').get().c;
  if (totalUsuarios === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      `INSERT INTO usuarios (usuario, contrasena_hash, nombre_completo, rol) VALUES (?, ?, ?, ?)`
    ).run('admin', hash, 'Administrador', 'administrador');

    const cajeroHash = bcrypt.hashSync('cajero123', 10);
    db.prepare(
      `INSERT INTO usuarios (usuario, contrasena_hash, nombre_completo, rol) VALUES (?, ?, ?, ?)`
    ).run('cajero1', cajeroHash, 'Cajero de Prueba', 'cajero');

    console.log('Usuarios creados: admin/admin123 (administrador), cajero1/cajero123 (cajero)');
  } else {
    console.log('Ya existen usuarios, se omite creación de usuarios.');
  }

  const totalCategorias = db.prepare('SELECT COUNT(*) AS c FROM categorias').get().c;
  if (totalCategorias === 0) {
    const categorias = ['Abarrotes', 'Frutas y Verduras', 'Lácteos', 'Carnes', 'Bebidas', 'Limpieza', 'Panadería', 'Canasta Básica'];
    const insertarCategoria = db.prepare('INSERT INTO categorias (nombre) VALUES (?)');
    const idsCategorias = {};
    for (const nombre of categorias) {
      const info = insertarCategoria.run(nombre);
      idsCategorias[nombre] = info.lastInsertRowid;
    }

    const productos = [
      { codigo_barras: '7441000000012', nombre: 'Arroz Tio Pelon 1kg', categoria: 'Canasta Básica', costo: 650, precio: 850, iva: 1, existencia: 120 },
      { codigo_barras: '7441000000029', nombre: 'Frijol Negro 900g', categoria: 'Canasta Básica', costo: 900, precio: 1150, iva: 1, existencia: 80 },
      { codigo_barras: '7441000000036', nombre: 'Leche Dos Pinos 1L', categoria: 'Lácteos', costo: 620, precio: 780, iva: 1, existencia: 60 },
      { codigo_barras: '7441000000043', nombre: 'Pan Bimbo Blanco', categoria: 'Panadería', costo: 1100, precio: 1450, iva: 1, existencia: 40 },
      { codigo_barras: '7441000000050', nombre: 'Coca-Cola 2L', categoria: 'Bebidas', costo: 1200, precio: 1650, iva: 13, existencia: 90 },
      { codigo_barras: '7441000000067', nombre: 'Detergente Xedex 1kg', categoria: 'Limpieza', costo: 1800, precio: 2400, iva: 13, existencia: 35 },
      { codigo_barras: '7441000000074', nombre: 'Banano (kg)', categoria: 'Frutas y Verduras', costo: 350, precio: 500, iva: 1, existencia: 100, unidad_medida: 'kg' },
      { codigo_barras: '7441000000081', nombre: 'Tomate (kg)', categoria: 'Frutas y Verduras', costo: 500, precio: 750, iva: 1, existencia: 70, unidad_medida: 'kg' },
      { codigo_barras: '7441000000098', nombre: 'Pechuga de Pollo (kg)', categoria: 'Carnes', costo: 2200, precio: 2900, iva: 1, existencia: 45, unidad_medida: 'kg' },
      { codigo_barras: '7441000000104', nombre: 'Huevos (cartón x30)', categoria: 'Canasta Básica', costo: 2400, precio: 2950, iva: 1, existencia: 25 },
    ];
    const insertarProducto = db.prepare(`
      INSERT INTO productos (codigo_barras, nombre, categoria_id, precio_costo, precio_venta, tarifa_iva, unidad_medida, existencia, existencia_minima)
      VALUES (@codigo_barras, @nombre, @categoria_id, @costo, @precio, @iva, @unidad_medida, @existencia, @existencia_minima)
    `);
    for (const p of productos) {
      insertarProducto.run({
        codigo_barras: p.codigo_barras,
        nombre: p.nombre,
        categoria_id: idsCategorias[p.categoria],
        costo: p.costo,
        precio: p.precio,
        iva: p.iva,
        unidad_medida: p.unidad_medida || 'unidad',
        existencia: p.existencia,
        existencia_minima: 10,
      });
    }
    console.log(`Categorías (${categorias.length}) y productos (${productos.length}) de ejemplo creados.`);
  } else {
    console.log('Ya existen categorías, se omite creación de datos de ejemplo.');
  }

  const totalClientes = db.prepare('SELECT COUNT(*) AS c FROM clientes').get().c;
  if (totalClientes === 0) {
    db.prepare(
      `INSERT INTO clientes (nombre, identificacion, telefono, limite_credito) VALUES (?, ?, ?, ?)`
    ).run('Cliente General', null, null, 0);
    console.log('Cliente genérico creado.');
  }
}

seed();
console.log('Seed completo.');
