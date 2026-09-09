import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency } from '../utils/format';

const EMPTY_PRODUCT = {
  id: null,
  codigo_barras: '',
  nombre: '',
  categoria_id: '',
  precio_costo: 0,
  precio_venta: 0,
  tarifa_iva: 13,
  codigo_cabys: '',
  unidad_medida: 'unidad',
  existencia: 0,
  existencia_minima: 5,
  acceso_rapido: false,
  permite_fracciones: false,
};

export default function Inventory() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ivaRates, setIvaRates] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ivaFilter, setIvaFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(!!location.state?.lowStockOnly);
  const [quickOnly, setQuickOnly] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState(null);

  useEffect(() => {
    loadCategories();
    loadIvaRates();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, ivaFilter, lowStockOnly, quickOnly]);

  async function loadProducts() {
    const res = await api.get('/products', {
      params: {
        search,
        categoryId: categoryFilter || undefined,
        tarifaIva: ivaFilter || undefined,
        lowStock: lowStockOnly || undefined,
        quickAccess: quickOnly || undefined,
      },
    });
    setProducts(res.data);
  }

  function limpiarFiltros() {
    setSearch('');
    setCategoryFilter('');
    setIvaFilter('');
    setLowStockOnly(false);
    setQuickOnly(false);
  }

  const hayFiltrosActivos = !!(search || categoryFilter || ivaFilter || lowStockOnly || quickOnly);

  async function loadCategories() {
    const res = await api.get('/products/categories');
    setCategories(res.data);
  }

  async function loadIvaRates() {
    const res = await api.get('/tax-rates');
    setIvaRates(res.data);
  }

  async function saveProduct(product) {
    setError('');
    try {
      if (product.id) {
        await api.put(`/products/${product.id}`, product);
      } else {
        await api.post('/products', product);
      }
      setModalProduct(null);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el producto');
    }
  }

  async function deleteProduct(id) {
    if (!confirm('¿Desactivar este producto? Podrá reactivarlo editándolo en la base de datos.')) return;
    await api.delete(`/products/${id}`);
    loadProducts();
  }

  async function createCategory() {
    if (!newCategory.trim()) return;
    try {
      await api.post('/products/categories', { nombre: newCategory.trim() });
      setNewCategory('');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la categoría');
    }
  }

  return (
    <Layout title="Inventario">
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="toolbar">
        <input
          className="toolbar-search"
          type="search"
          placeholder="Buscar por nombre o código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select value={ivaFilter} onChange={(e) => setIvaFilter(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="">Todas las tarifas</option>
          {ivaRates.map((r) => (
            <option key={r.id} value={r.porcentaje}>IVA {r.porcentaje}%</option>
          ))}
        </select>
        <label className="flex items-center gap-8">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Solo stock bajo
        </label>
        <label className="flex items-center gap-8">
          <input
            type="checkbox"
            checked={quickOnly}
            onChange={(e) => setQuickOnly(e.target.checked)}
          />
          Solo accesos rápidos
        </label>
        {hayFiltrosActivos && (
          <button className="btn btn-secondary btn-sm" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
        <div className="flex gap-8" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
            Categorías
          </button>
          <button className="btn" onClick={() => setModalProduct({ ...EMPTY_PRODUCT })}>
            + Nuevo producto
          </button>
        </div>
      </div>
      <p className="text-muted" style={{ marginTop: -8, marginBottom: 14, fontSize: 12 }}>
        {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
      </p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Costo</th>
              <th>Precio</th>
              <th>IVA</th>
              <th>Existencia</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="text-muted">{p.codigo_barras || '—'}</td>
                <td>
                  {p.nombre}
                  {p.acceso_rapido === 1 && <span className="badge badge-success" style={{ marginLeft: 6 }}>Rápido</span>}
                </td>
                <td>{p.categoria_nombre || '—'}</td>
                <td>{formatCurrency(p.precio_costo)}</td>
                <td>{formatCurrency(p.precio_venta)}</td>
                <td>{p.tarifa_iva}%</td>
                <td>
                  {p.existencia} {p.unidad_medida}
                  {p.existencia <= p.existencia_minima && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Bajo</span>}
                </td>
                <td>
                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => setModalProduct(p)}>
                      Editar
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setStockModalProduct(p)}>
                      Stock
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">No hay productos que coincidan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          categories={categories}
          ivaRates={ivaRates}
          onClose={() => setModalProduct(null)}
          onSave={saveProduct}
        />
      )}

      {stockModalProduct && (
        <StockModal
          product={stockModalProduct}
          onClose={() => setStockModalProduct(null)}
          onSaved={() => {
            setStockModalProduct(null);
            loadProducts();
          }}
        />
      )}

      {showCategoryModal && (
        <div className="modal-backdrop" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Categorías</h2>
            <div className="flex gap-8" style={{ marginBottom: 14 }}>
              <input
                type="text"
                placeholder="Nueva categoría..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button className="btn" onClick={createCategory}>Agregar</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {categories.map((c) => (
                <li key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  {c.nombre}
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function ProductModal({ product, categories, ivaRates, onClose, onSave }) {
  const [form, setForm] = useState(product);
  const [existingMatch, setExistingMatch] = useState(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [ventaTocada, setVentaTocada] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Sugiere el precio de venta como costo + IVA (margen 0%, el mínimo para no
  // perder plata) mientras se está creando un producto nuevo, mientras el
  // usuario no haya escrito ese campo a mano — si lo edita, dejamos de
  // pisárselo con el cálculo.
  useEffect(() => {
    if (form.id || ventaTocada) return;
    const costo = Number(form.precio_costo) || 0;
    const iva = Number(form.tarifa_iva) || 0;
    const sugerido = Math.round(costo * (1 + iva / 100) * 100) / 100;
    setForm((prev) => ({ ...prev, precio_venta: sugerido }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.precio_costo, form.tarifa_iva, form.id, ventaTocada]);

  // Mientras se crea un producto nuevo, busca en segundo plano si el código
  // de barras ya pertenece a otro producto, para avisar antes de intentar
  // guardar (y no chocar recién al mandar el formulario).
  useEffect(() => {
    if (form.id) return; // al editar, el código puede coincidir consigo mismo
    const codigo = (form.codigo_barras || '').trim();
    if (!codigo) {
      setExistingMatch(null);
      return;
    }
    setCheckingCode(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/barcode/${encodeURIComponent(codigo)}`);
        setExistingMatch(res.data);
      } catch {
        setExistingMatch(null);
      } finally {
        setCheckingCode(false);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.codigo_barras, form.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="form-group">
          <label>Código de barras</label>
          <input
            type="text"
            value={form.codigo_barras || ''}
            onChange={(e) => set('codigo_barras', e.target.value)}
            autoFocus
            placeholder="Escaneá o escribí el código..."
          />
          {checkingCode && <small className="text-muted">Buscando...</small>}
          {existingMatch && (
            <div className="alert alert-danger" style={{ marginTop: 8 }}>
              Ese código ya es de <strong>{existingMatch.nombre}</strong> (₡{existingMatch.precio_venta}).{' '}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setForm(existingMatch);
                  setExistingMatch(null);
                }}
              >
                Editar ese producto
              </button>
            </div>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre (opcional)</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Si lo dejás vacío, se usa el código de barras"
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select value={form.categoria_id || ''} onChange={(e) => set('categoria_id', e.target.value || null)}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Precio de costo</label>
            <input type="number" step="0.01" value={form.precio_costo} onChange={(e) => set('precio_costo', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Precio de venta (con IVA)</label>
            <input
              type="number"
              step="0.01"
              value={form.precio_venta}
              onChange={(e) => {
                setVentaTocada(true);
                set('precio_venta', Number(e.target.value));
              }}
            />
            {!form.id && !ventaTocada && (
              <small className="text-muted">Sugerido: costo + IVA (sin ganancia). Editalo para agregar margen.</small>
            )}
          </div>
          <div className="form-group">
            <label>IVA</label>
            <select value={form.tarifa_iva} onChange={(e) => set('tarifa_iva', Number(e.target.value))}>
              {ivaRates.map((r) => (
                <option key={r.id} value={r.porcentaje}>{r.porcentaje}%{r.nombre ? ` — ${r.nombre}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Unidad</label>
            <select value={form.unidad_medida} onChange={(e) => set('unidad_medida', e.target.value)}>
              <option value="unidad">Unidad</option>
              <option value="kg">Kilogramo</option>
              <option value="litro">Litro</option>
              <option value="paquete">Paquete</option>
            </select>
          </div>
          {!form.id && (
            <div className="form-group">
              <label>Stock inicial</label>
              <input type="number" step="0.001" value={form.existencia} onChange={(e) => set('existencia', Number(e.target.value))} />
            </div>
          )}
          <div className="form-group">
            <label>Stock mínimo (alerta)</label>
            <input type="number" step="0.001" value={form.existencia_minima} onChange={(e) => set('existencia_minima', Number(e.target.value))} />
          </div>
        </div>
        <div className="form-group">
          <label>Código CABYS (opcional, para factura electrónica)</label>
          <input type="text" value={form.codigo_cabys || ''} onChange={(e) => set('codigo_cabys', e.target.value)} placeholder="Ej: 1234567890123" />
        </div>
        <div className="form-group">
          <label className="flex items-center gap-8" style={{ fontWeight: 400, color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={!!form.acceso_rapido}
              onChange={(e) => set('acceso_rapido', e.target.checked)}
            />
            Mostrar en accesos rápidos del POS (para productos sin código de barras, ej. frutas, pan, bolsas)
          </label>
        </div>

        <div className="form-group">
          <label className="flex items-center gap-8" style={{ fontWeight: 400, color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={!!form.permite_fracciones}
              onChange={(e) => set('permite_fracciones', e.target.checked)}
            />
            Permite vender en fracciones (ej: 0.5 kg, 1.25 unidades)
          </label>
          {form.permite_fracciones && (
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4, marginLeft: 22 }}>
              En el POS el cajero podrá ingresar cantidades como 0.5 o 1.25 al agregar este producto al carrito.
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function StockModal({ product, onClose, onSaved }) {
  const [tipo, setTipo] = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    if (!cantidad) return;
    setError('');
    try {
      await api.post(`/products/${product.id}/stock`, { tipo, cantidad: Number(cantidad), referencia });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo ajustar el inventario');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Ajustar stock: {product.nombre}</h2>
        <p className="text-muted">Existencia actual: {product.existencia} {product.unidad_medida}</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-group">
          <label>Tipo de movimiento</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="entrada">Entrada (compra a proveedor)</option>
            <option value="salida">Salida (merma, daño)</option>
            <option value="ajuste">Ajuste (fijar cantidad exacta)</option>
          </select>
        </div>
        <div className="form-group">
          <label>{tipo === 'ajuste' ? 'Nueva cantidad exacta' : 'Cantidad'}</label>
          <input type="number" step="0.001" value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label>Referencia (opcional)</label>
          <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej: Factura proveedor #123" />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={submit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
