package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.CategoriaRequest;
import com.crmsuper.pos.dto.MovimientoResponse;
import com.crmsuper.pos.dto.ProductoRequest;
import com.crmsuper.pos.dto.ProductoResponse;
import com.crmsuper.pos.dto.StockAdjustRequest;
import com.crmsuper.pos.model.Categoria;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    List<Categoria> listarCategorias();
    Categoria crearCategoria(CategoriaRequest request, AuthenticatedUser usuario);
    void eliminarCategoria(Long id, AuthenticatedUser usuario);

    List<ProductoResponse> listar(String search, Boolean lowStock, Long categoryId, Boolean quickAccess, BigDecimal tarifaIva);
    ProductoResponse obtenerPorBarcode(String barcode);
    ProductoResponse obtenerPorId(Long id);
    ProductoResponse crear(ProductoRequest request, AuthenticatedUser usuario);
    ProductoResponse actualizar(Long id, ProductoRequest request, AuthenticatedUser usuario);
    void eliminar(Long id, AuthenticatedUser usuario);
    ProductoResponse ajustarStock(Long id, StockAdjustRequest request, AuthenticatedUser usuario);
    List<MovimientoResponse> movimientos(Long productoId);
}
