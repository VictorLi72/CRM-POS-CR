package com.crmsuper.pos.seed;

import com.crmsuper.pos.model.Categoria;
import com.crmsuper.pos.model.Cliente;
import com.crmsuper.pos.model.Descuento;
import com.crmsuper.pos.model.FolioCounter;
import com.crmsuper.pos.model.Producto;
import com.crmsuper.pos.model.TarifaIva;
import com.crmsuper.pos.model.Usuario;
import com.crmsuper.pos.model.enums.Rol;
import com.crmsuper.pos.model.enums.TipoDescuento;
import com.crmsuper.pos.repository.CategoriaRepository;
import com.crmsuper.pos.repository.ClienteRepository;
import com.crmsuper.pos.repository.DescuentoRepository;
import com.crmsuper.pos.repository.FolioCounterRepository;
import com.crmsuper.pos.repository.ProductoRepository;
import com.crmsuper.pos.repository.TarifaIvaRepository;
import com.crmsuper.pos.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Carga datos iniciales (usuarios, categorías, productos, tarifas de IVA,
 * descuentos y un cliente genérico) la primera vez que arranca el backend
 * contra una base vacía. Equivalente a backend/src/seed.js del backend
 * anterior; cada paso es idempotente (no repite datos si ya existen), igual
 * que antes.
 *
 * <p>Se puede desactivar con {@code app.seed.enabled=false} (por ejemplo en
 * producción, una vez que ya se administran usuarios/productos reales).</p>
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final TarifaIvaRepository tarifaIvaRepository;
    private final DescuentoRepository descuentoRepository;
    private final ClienteRepository clienteRepository;
    private final FolioCounterRepository folioCounterRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UsuarioRepository usuarioRepository,
            CategoriaRepository categoriaRepository,
            ProductoRepository productoRepository,
            TarifaIvaRepository tarifaIvaRepository,
            DescuentoRepository descuentoRepository,
            ClienteRepository clienteRepository,
            FolioCounterRepository folioCounterRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.tarifaIvaRepository = tarifaIvaRepository;
        this.descuentoRepository = descuentoRepository;
        this.clienteRepository = clienteRepository;
        this.folioCounterRepository = folioCounterRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedFolioCounter();
        seedUsuarios();
        Map<String, Categoria> categorias = seedCategorias();
        seedProductos(categorias);
        seedTarifasIva();
        seedDescuentos();
        seedClienteGenerico();
        log.info("Seed completo.");
    }

    private void seedFolioCounter() {
        if (folioCounterRepository.existsById(1L)) return;
        folioCounterRepository.save(new FolioCounter(1L, 0L));
    }

    private void seedUsuarios() {
        if (usuarioRepository.count() > 0) {
            log.info("Ya existen usuarios, se omite creación de usuarios.");
            return;
        }
        usuarioRepository.save(Usuario.builder()
                .usuario("admin")
                .contrasenaHash(passwordEncoder.encode("admin123"))
                .nombreCompleto("Administrador")
                .rol(Rol.administrador)
                .activo(true)
                .build());
        usuarioRepository.save(Usuario.builder()
                .usuario("cajero1")
                .contrasenaHash(passwordEncoder.encode("cajero123"))
                .nombreCompleto("Cajero de Prueba")
                .rol(Rol.cajero)
                .activo(true)
                .build());
        log.info("Usuarios creados: admin/admin123 (administrador), cajero1/cajero123 (cajero)");
    }

    private Map<String, Categoria> seedCategorias() {
        if (categoriaRepository.count() > 0) {
            log.info("Ya existen categorías, se omite creación de datos de ejemplo.");
            Map<String, Categoria> existentes = new LinkedHashMap<>();
            categoriaRepository.findAll().forEach(c -> existentes.put(c.getNombre(), c));
            return existentes;
        }
        String[] nombres = {
                "Abarrotes", "Frutas y Verduras", "Lácteos", "Carnes", "Bebidas",
                "Limpieza", "Panadería", "Canasta Básica"
        };
        Map<String, Categoria> creadas = new LinkedHashMap<>();
        for (String nombre : nombres) {
            creadas.put(nombre, categoriaRepository.save(Categoria.builder().nombre(nombre).build()));
        }
        return creadas;
    }

    private void seedProductos(Map<String, Categoria> categorias) {
        if (productoRepository.count() > 0) return;

        record ProductoSeed(String codigoBarras, String nombre, String categoria, long costo, long precio,
                             int iva, double existencia, String unidad) {
        }

        ProductoSeed[] productos = {
                new ProductoSeed("7441000000012", "Arroz Tio Pelon 1kg", "Canasta Básica", 650, 850, 1, 120, "unidad"),
                new ProductoSeed("7441000000029", "Frijol Negro 900g", "Canasta Básica", 900, 1150, 1, 80, "unidad"),
                new ProductoSeed("7441000000036", "Leche Dos Pinos 1L", "Lácteos", 620, 780, 1, 60, "unidad"),
                new ProductoSeed("7441000000043", "Pan Bimbo Blanco", "Panadería", 1100, 1450, 1, 40, "unidad"),
                new ProductoSeed("7441000000050", "Coca-Cola 2L", "Bebidas", 1200, 1650, 13, 90, "unidad"),
                new ProductoSeed("7441000000067", "Detergente Xedex 1kg", "Limpieza", 1800, 2400, 13, 35, "unidad"),
                new ProductoSeed("7441000000074", "Banano (kg)", "Frutas y Verduras", 350, 500, 1, 100, "kg"),
                new ProductoSeed("7441000000081", "Tomate (kg)", "Frutas y Verduras", 500, 750, 1, 70, "kg"),
                new ProductoSeed("7441000000098", "Pechuga de Pollo (kg)", "Carnes", 2200, 2900, 1, 45, "kg"),
                new ProductoSeed("7441000000104", "Huevos (cartón x30)", "Canasta Básica", 2400, 2950, 1, 25, "unidad"),
        };

        for (ProductoSeed p : productos) {
            productoRepository.save(Producto.builder()
                    .codigoBarras(p.codigoBarras())
                    .nombre(p.nombre())
                    .categoria(categorias.get(p.categoria()))
                    .precioCosto(BigDecimal.valueOf(p.costo()))
                    .precioVenta(BigDecimal.valueOf(p.precio()))
                    .tarifaIva(BigDecimal.valueOf(p.iva()))
                    .unidadMedida(p.unidad())
                    .existencia(BigDecimal.valueOf(p.existencia()))
                    .existenciaMinima(BigDecimal.TEN)
                    .accesoRapido(false)
                    .activo(true)
                    .build());
        }
        log.info("Categorías ({}) y productos ({}) de ejemplo creados.", categorias.size(), productos.length);
    }

    private void seedTarifasIva() {
        if (tarifaIvaRepository.count() > 0) {
            log.info("Ya existen tarifas de IVA, se omite creación.");
            return;
        }
        record TarifaSeed(int porcentaje, String nombre) {
        }
        TarifaSeed[] tarifas = {
                new TarifaSeed(0, "Exento / Canasta básica"),
                new TarifaSeed(1, "Tarifa reducida 1%"),
                new TarifaSeed(2, "Tarifa reducida 2%"),
                new TarifaSeed(4, "Tarifa reducida 4%"),
                new TarifaSeed(13, "Tarifa general"),
        };
        for (TarifaSeed t : tarifas) {
            tarifaIvaRepository.save(TarifaIva.builder()
                    .porcentaje(BigDecimal.valueOf(t.porcentaje()))
                    .nombre(t.nombre())
                    .activo(true)
                    .build());
        }
        log.info("Tarifas de IVA ({}) creadas.", tarifas.length);
    }

    private void seedDescuentos() {
        if (descuentoRepository.count() > 0) {
            log.info("Ya existen descuentos, se omite creación.");
            return;
        }
        record DescuentoSeed(String nombre, int valor) {
        }
        DescuentoSeed[] descuentos = {
                new DescuentoSeed("Empleado", 10),
                new DescuentoSeed("Tercera edad", 5),
                new DescuentoSeed("Liquidación", 20),
        };
        for (DescuentoSeed d : descuentos) {
            descuentoRepository.save(Descuento.builder()
                    .nombre(d.nombre())
                    .tipo(TipoDescuento.porcentaje)
                    .valor(BigDecimal.valueOf(d.valor()))
                    .activo(true)
                    .build());
        }
        log.info("Descuentos ({}) de ejemplo creados.", descuentos.length);
    }

    private void seedClienteGenerico() {
        if (clienteRepository.count() > 0) return;
        clienteRepository.save(Cliente.builder()
                .nombre("Cliente General")
                .limiteCredito(BigDecimal.ZERO)
                .saldoCredito(BigDecimal.ZERO)
                .puntosLealtad(0)
                .activo(true)
                .build());
        log.info("Cliente genérico creado.");
    }
}
