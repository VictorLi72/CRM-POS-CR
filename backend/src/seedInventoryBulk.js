// Carga ~50 productos de ejemplo por categoría para tener volumen real con el
// que probar la interfaz (paginación visual, scroll de la cuadrícula, stock
// bajo, accesos rápidos, etc). Se puede correr varias veces sin duplicar: usa
// INSERT OR IGNORE sobre el código de barras (columna UNIQUE).
// Ejecutar: npm run seed:bulk
const db = require('./db');

const CODIGO_PREFIJO = '77';

function randomPrecio(min, max) {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / 5) * 5;
}

function randomEntero(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// { nombre: 'Abarrotes', iva: 13, unidad: 'unidad', rango: [costoMin, costoMax como % del precio no aplica], precio: [min,max], items: [...] }
const CATEGORIAS = [
  {
    nombre: 'Abarrotes',
    iva: 13,
    unidad: 'unidad',
    precio: [500, 3500],
    items: [
      'Aceite vegetal Numar 500ml', 'Aceite vegetal Numar 1L', 'Aceite de canola Vive 1L',
      'Aceite de oliva Carbonell 500ml', 'Aceite en spray Pam 200g', 'Azúcar blanca CIISA 1kg',
      'Azúcar blanca CIISA 2kg', 'Azúcar morena 1kg', 'Azúcar impalpable 500g',
      'Endulzante Stevia 100 sobres', 'Café molido Café Rey 400g', 'Café molido Café Britt 340g',
      'Café molido 1820 400g', 'Café en grano Volio 500g', 'Café descafeinado 200g',
      'Espagueti Roma 400g', 'Coditos Roma 400g', 'Tallarín Roma 400g', 'Lasaña Roma 250g',
      'Fideos cabello de ángel 200g', 'Salsa de tomate Naturas 400g', 'Mayonesa Kraft 445g',
      'Mostaza French\'s 226g', 'Salsa inglesa Lizano 280ml', 'Salsa Lizano 400ml',
      'Atún Sardimar en agua 140g', 'Atún Sardimar en aceite 140g', 'Sardinas Sardimar 155g',
      'Maíz dulce enlatado 400g', 'Chícharos enlatados 400g', 'Avena Quaker 400g',
      'Cereal Corn Flakes 500g', 'Cereal Zucaritas 400g', 'Granola casera 500g',
      'Avena en hojuelas 800g', 'Harina de trigo Sinaí 1kg', 'Harina de maíz Maseca 1kg',
      'Harina leudante 1kg', 'Polenta 500g', 'Harina integral 1kg', 'Galletas soda Cristal 250g',
      'Galletas María 200g', 'Galletas de chocolate Chiky 180g', 'Galletas integrales 200g',
      'Galletas rellenas Duplex 168g', 'Consomé de pollo Maggi 200g', 'Vinagre blanco 500ml',
      'Gelatina de fresa 170g', 'Maicena 200g', 'Sopa instantánea Maruchan 85g',
    ],
  },
  {
    nombre: 'Frutas y Verduras',
    iva: 1,
    unidad: 'kg',
    precio: [300, 1200],
    unidadesEspeciales: {
      'Culantro (manojo)': 'unidad', 'Lechuga americana': 'unidad', 'Lechuga romana': 'unidad',
      'Repollo verde': 'unidad', 'Repollo morado': 'unidad',
    },
    items: [
      'Banano', 'Manzana roja', 'Manzana verde', 'Naranja', 'Mandarina', 'Piña', 'Papaya',
      'Sandía', 'Melón', 'Mango', 'Uva verde', 'Uva roja', 'Fresa', 'Aguacate Hass',
      'Aguacate criollo', 'Limón mesino', 'Limón dulce', 'Plátano maduro', 'Plátano verde',
      'Pera', 'Durazno', 'Guayaba', 'Maracuyá', 'Granadilla', 'Zapote', 'Nance', 'Marañón',
      'Carambola', 'Tomate de ensalada', 'Tomate pera', 'Cebolla blanca', 'Cebolla morada',
      'Papa blanca', 'Papa criolla', 'Zanahoria', 'Chayote', 'Culantro (manojo)',
      'Lechuga americana', 'Lechuga romana', 'Repollo verde', 'Repollo morado', 'Ayote sazón',
      'Ayote tierno', 'Yuca', 'Camote', 'Pepino', 'Chile dulce', 'Brócoli', 'Coliflor', 'Vainica',
    ],
  },
  {
    nombre: 'Lácteos',
    iva: 1,
    unidad: 'unidad',
    precio: [500, 3000],
    items: [
      'Leche entera Dos Pinos 1L', 'Leche entera Dos Pinos 2L', 'Leche descremada Dos Pinos 1L',
      'Leche semidescremada Dos Pinos 1L', 'Leche deslactosada Dos Pinos 1L',
      'Leche condensada Dos Pinos 397g', 'Leche evaporada Dos Pinos 410g', 'Leche en polvo Nido 400g',
      'Leche en polvo Nido 800g', 'Leche de soya Ades 1L', 'Yogurt natural Dos Pinos 1L',
      'Yogurt fresa Dos Pinos 150g', 'Yogurt mora Dos Pinos 150g', 'Yogurt griego Dos Pinos 150g',
      'Yogurt sin azúcar Dos Pinos 1L', 'Yogurt para beber Yoplait 200ml', 'Queso fresco Dos Pinos 400g',
      'Queso mozzarella Dos Pinos 400g', 'Queso crema Philadelphia 200g', 'Queso amarillo tajado 250g',
      'Queso Turrialba 500g', 'Queso palmito 400g', 'Queso Monterrey Dos Pinos 400g',
      'Queso parmesano rallado 100g', 'Natilla Dos Pinos 500g', 'Natilla light Dos Pinos 500g',
      'Mantequilla Dos Pinos 226g', 'Margarina Delicia 500g', 'Crema dulce Dos Pinos 200ml',
      'Crema agria Dos Pinos 200ml', 'Batido de chocolate Dos Pinos 1L', 'Batido de fresa Dos Pinos 1L',
      'Batido de vainilla Dos Pinos 1L', 'Flan de vainilla Dos Pinos 100g', 'Gelatina con leche Dos Pinos 100g',
      'Arroz con leche envasado 150g', 'Requesón 300g', 'Queso cottage 250g',
      'Leche achocolatada Dos Pinos 250ml', 'Leche achocolatada Dos Pinos 1L', 'Yogurt griego natural 500g',
      'Queso Gouda 300g', 'Queso Edam 300g', 'Queso crema untable 150g', 'Mantequilla sin sal 226g',
      'Crema batida en aerosol 250g', 'Leche maternizada etapa 1 400g', 'Leche maternizada etapa 2 400g',
      'Bebida láctea fermentada Yakult x5', 'Queso ricotta 250g',
    ],
  },
  {
    nombre: 'Carnes',
    iva: 1,
    unidad: 'kg',
    precio: [1500, 6000],
    unidadesEspeciales: {
      'Salchicha tipo Viena (paquete)': 'unidad', 'Salchicha alemana (paquete)': 'unidad',
      'Bacon ahumado (paquete)': 'unidad', 'Nuggets de pollo (paquete 500g)': 'unidad',
    },
    items: [
      'Pechuga de pollo', 'Muslo de pollo', 'Alitas de pollo', 'Pollo entero', 'Menudos de pollo',
      'Carne molida de res', 'Lomito de res', 'Bistec de res', 'Costilla de res', 'Posta de res',
      'Filete mignon', 'Arrachera', 'Costilla de cerdo', 'Chuleta de cerdo', 'Lomo de cerdo',
      'Pierna de cerdo', 'Chicharrón', 'Chorizo criollo', 'Salchichón ahumado', 'Mortadela',
      'Jamón de pierna', 'Jamón de pavo', 'Tocineta', 'Salchicha tipo Viena (paquete)',
      'Salchicha alemana (paquete)', 'Filete de tilapia', 'Filete de corvina', 'Filete de salmón',
      'Camarones medianos', 'Camarones jumbo', 'Atún fresco', 'Pulpo', 'Carne para sopa',
      'Carne para asar', 'Carne en cubos', 'Pechuga de pavo', 'Pavo entero', 'Conejo',
      'Hígado de res', 'Lengua de res', 'Cecina', 'Bacon ahumado (paquete)', 'Longaniza', 'Butifarra',
      'Carne de cerdo molida', 'Codillo de cerdo', 'Costillas BBQ marinadas', 'Milanesa de res',
      'Milanesa de pollo', 'Nuggets de pollo (paquete 500g)',
    ],
  },
  {
    nombre: 'Bebidas',
    iva: 13,
    unidad: 'unidad',
    precio: [400, 6000],
    items: [
      'Coca-Cola 355ml', 'Coca-Cola 600ml', 'Coca-Cola 1.5L', 'Coca-Cola 2L', 'Coca-Cola 3L',
      'Coca-Cola Zero 600ml', 'Pepsi 355ml', 'Pepsi 600ml', 'Pepsi 2L', 'Fanta naranja 600ml',
      'Fanta uva 600ml', 'Sprite 600ml', 'Sprite 2L', 'Agua Cristal 600ml', 'Agua Cristal 1L',
      'Agua con gas Alpina 355ml', 'Jugo Del Valle naranja 1L', 'Jugo Del Valle manzana 1L',
      'Jugo Del Valle mango 1L', 'Néctar Tampico tropical 1L', 'Té frío Lipton limón 500ml',
      'Té frío Lipton durazno 500ml', 'Cerveza Imperial lata 355ml', 'Cerveza Imperial six-pack',
      'Cerveza Pilsen lata 355ml', 'Cerveza Bavaria six-pack', 'Cerveza Heineken botella',
      'Vino tinto de mesa 750ml', 'Vino blanco de mesa 750ml', 'Café frío embotellado 300ml',
      'Bebida energizante Monster 473ml', 'Bebida energizante Speed Max 250ml',
      'Isotónico Gatorade azul 600ml', 'Isotónico Gatorade naranja 600ml', 'Leche de soya Ades chocolate 1L',
      'Refresco natural de horchata 500ml', 'Refresco natural de cas 500ml', 'Chicha de piña 500ml',
      'Agua de pipa embotellada 500ml', 'Bebida de avena y canela 500ml', 'Cerveza artesanal IPA 355ml',
      'Sidra de manzana 750ml', 'Ron Centenario 750ml', 'Guaro Cacique 750ml', 'Whisky escocés 750ml',
      'Vodka Absolut 750ml', 'Malta Kola Campeón 355ml', 'Bebida achocolatada Toddy 200ml',
      'Agua tónica Schweppes 355ml', 'Ginger ale 355ml',
    ],
  },
  {
    nombre: 'Limpieza',
    iva: 13,
    unidad: 'unidad',
    precio: [800, 4000],
    items: [
      'Detergente en polvo Xedex 1kg', 'Detergente en polvo Xedex 2kg', 'Detergente líquido Ariel 1L',
      'Jabón de lavar en barra Jabonesa', 'Suavizante de telas Suavitel 1L', 'Cloro Cloro Mango 1L',
      'Cloro Cloro Mango 3.7L', 'Desinfectante Fabuloso lavanda 1L', 'Desinfectante Fabuloso pino 1L',
      'Limpiador multiusos Mr. Músculo 500ml', 'Limpiavidrios Windex 500ml', 'Jabón de baño Palmolive',
      'Jabón de baño Protex', 'Shampoo Head & Shoulders 400ml', 'Shampoo Sedal 400ml',
      'Acondicionador Sedal 400ml', 'Papel higiénico Scott x4', 'Papel higiénico Scott x12',
      'Papel higiénico Elite x4', 'Servilletas Kimberly 100 unidades', 'Toallas de cocina Scott x2',
      'Esponjas de cocina x3', 'Estropajo metálico x2', 'Bolsas de basura grandes x10',
      'Bolsas de basura medianas x20', 'Lava platos Axion 750ml', 'Lava platos en pasta 500g',
      'Ambientador Glade aerosol', 'Ambientador Glade repuesto', 'Insecticida Baygon aerosol',
      'Repelente de insectos Off', 'Pasta dental Colgate 90g', 'Pasta dental Colgate Total 150g',
      'Cepillo de dientes x2', 'Enjuague bucal Listerine 500ml', 'Desodorante Rexona hombre',
      'Desodorante Rexona mujer', 'Papel aluminio 30m', 'Film plástico transparente 30m',
      'Guantes de hule x1 par', 'Escoba plástica', 'Recogedor plástico', 'Trapeador de piso',
      'Cubeta plástica 10L', 'Cera para pisos 1L', 'Blanqueador en polvo 500g',
      'Toallitas desinfectantes x40', 'Alcohol en gel 250ml', 'Alcohol antiséptico 500ml',
      'Jabón líquido de manos 250ml',
    ],
  },
  {
    nombre: 'Panadería',
    iva: 4,
    unidad: 'unidad',
    precio: [300, 3000],
    items: [
      'Pan cuadrado blanco Bimbo 600g', 'Pan cuadrado integral Bimbo 600g', 'Pan sin cáscara Bimbo 500g',
      'Pan baguette artesanal', 'Pan francés (unidad)', 'Pan de hot dog x6', 'Pan de hamburguesa x6',
      'Pan dulce - bollo de canela', 'Pan dulce - quesadilla', 'Pan dulce - empanada de piña',
      'Pan dulce - empanada de manzana', 'Pan integral Musmanni 500g', 'Pan de centeno 500g',
      'Pan de ajo congelado', 'Tortillas de maíz x10', 'Tortillas de harina x10',
      'Torta de chocolate (porción)', 'Torta tres leches (porción)', 'Torta de vainilla (porción)',
      'Cheesecake (porción)', 'Galletas de mantequilla artesanales', 'Donas glaseadas x6',
      'Donas de chocolate x6', 'Croissant de mantequilla', 'Croissant de jamón y queso',
      'Pan de piña', 'Pan de coco', 'Mollete relleno de queso', 'Mollete relleno de jalea',
      'Rosquillas caseras', 'Churros rellenos x4', 'Pan integral de semillas 500g', 'Pan brioche 400g',
      'Pan pita x6', 'Pan de molde con avena 500g', 'Bizcocho casero', 'Queque seco (porción)',
      'Queque de naranja (porción)', 'Empanada de carne', 'Empanada de pollo', 'Empanada de frijol',
      'Pan chorreado (porción)', 'Alfajores x6', 'Palmeras de hojaldre x4', 'Pan de yuca x6',
      'Pan de queso x6', 'Baguette de ajo', 'Pan artesanal de masa madre', 'Tarta de manzana (porción)',
      'Muffin de arándanos',
    ],
  },
  {
    nombre: 'Canasta Básica',
    iva: 0,
    unidad: 'unidad',
    precio: [400, 3000],
    unidadesEspeciales: {
      'Tomate (kg)': 'kg', 'Cebolla (kg)': 'kg', 'Papa (kg)': 'kg', 'Plátano (kg)': 'kg',
      'Banano (kg)': 'kg', 'Naranja (kg)': 'kg', 'Pollo entero (kg)': 'kg',
      'Carne de res para sopa (kg)': 'kg', 'Yuca (kg)': 'kg', 'Ayote (kg)': 'kg',
      'Chayote (kg)': 'kg', 'Zanahoria (kg)': 'kg', 'Repollo (unidad)': 'unidad', 'Lechuga (unidad)': 'unidad',
    },
    items: [
      'Arroz Tío Pelón 1kg', 'Arroz Tío Pelón 2kg', 'Arroz integral 1kg', 'Frijol negro 900g',
      'Frijol rojo 900g', 'Frijol blanco 900g', 'Azúcar blanca 1kg', 'Sal fina 500g', 'Sal en grano 1kg',
      'Aceite vegetal 900ml', 'Huevos cartón x30', 'Huevos cartón x15', 'Leche entera 1L',
      'Pan cuadrado 550g', 'Harina de trigo 1kg', 'Harina de maíz 1kg', 'Pastas alimenticias 400g',
      'Avena en hojuelas 400g', 'Café molido 250g', 'Tomate (kg)', 'Cebolla (kg)', 'Papa (kg)',
      'Plátano (kg)', 'Banano (kg)', 'Naranja (kg)', 'Pollo entero (kg)', 'Carne de res para sopa (kg)',
      'Queso fresco 400g', 'Natilla 250g', 'Margarina 250g', 'Atún en lata 140g', 'Sardinas en lata 155g',
      'Consomé de pollo 200g', 'Jabón de lavar barra', 'Papel higiénico x4', 'Detergente en polvo 500g',
      'Fósforos x10 cajas', 'Velas x6', 'Yuca (kg)', 'Ayote (kg)', 'Chayote (kg)', 'Zanahoria (kg)',
      'Repollo (unidad)', 'Lechuga (unidad)', 'Manteca vegetal 500g', 'Vinagre blanco 500ml',
      'Chocolate en polvo 400g', 'Galletas soda 250g', 'Leche en polvo 400g', 'Frijol molido enlatado 400g',
    ],
  },
];

function seedInventoryBulk() {
  const categoriaIds = {};
  for (const cat of CATEGORIAS) {
    let row = db.prepare('SELECT id FROM categorias WHERE nombre = ?').get(cat.nombre);
    if (!row) {
      const info = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run(cat.nombre);
      row = { id: info.lastInsertRowid };
    }
    categoriaIds[cat.nombre] = row.id;
  }

  const insertar = db.prepare(`
    INSERT OR IGNORE INTO productos
      (codigo_barras, nombre, categoria_id, precio_costo, precio_venta, tarifa_iva, unidad_medida, existencia, existencia_minima, acceso_rapido)
    VALUES (@codigo_barras, @nombre, @categoria_id, @costo, @precio, @iva, @unidad_medida, @existencia, @existencia_minima, @acceso_rapido)
  `);

  let contador = 0;
  let insertados = 0;
  const tx = db.transaction(() => {
    for (const cat of CATEGORIAS) {
      cat.items.forEach((nombre, idx) => {
        contador += 1;
        const codigo_barras = CODIGO_PREFIJO + String(contador).padStart(11, '0');
        const precio = randomPrecio(cat.precio[0], cat.precio[1]);
        const costo = Math.round(precio * (0.6 + Math.random() * 0.15));
        const existenciaMinima = randomEntero(5, 15);
        // ~1 de cada 12 productos queda con stock bajo, para poder probar
        // la campana de notificaciones y el filtro "solo stock bajo".
        const stockBajo = contador % 12 === 0;
        const existencia = stockBajo
          ? randomEntero(0, Math.max(0, existenciaMinima - 1))
          : randomEntero(existenciaMinima + 5, existenciaMinima + 140);
        const unidad_medida = (cat.unidadesEspeciales && cat.unidadesEspeciales[nombre]) || cat.unidad;

        const info = insertar.run({
          codigo_barras,
          nombre,
          categoria_id: categoriaIds[cat.nombre],
          costo,
          precio,
          iva: cat.iva,
          unidad_medida,
          existencia,
          existencia_minima: existenciaMinima,
          acceso_rapido: idx === 0 ? 1 : 0,
        });
        if (info.changes > 0) insertados += 1;
      });
    }
  });
  tx();

  console.log(`Listo: ${insertados} productos nuevos insertados de ${contador} intentados (los repetidos se omiten).`);
}

seedInventoryBulk();
