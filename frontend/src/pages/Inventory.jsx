import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency } from '../utils/format';
import { BarcodeScanButton } from '../components/BarcodeScanner.jsx';

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
  const navigate = useNavigate();
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
  const [showShoppingList, setShowShoppingList] = useState(false);

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
        <div className="input-scan-wrapper toolbar-search">
          <input
            type="search"
            placeholder="Buscar por nombre o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          <BarcodeScanButton onScan={(val) => setSearch(val)} />
        </div>
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
          <button className="btn btn-secondary" onClick={() => setShowShoppingList(true)}>
            📋 Lista de compras
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

      {showShoppingList && (
        <ShoppingListModal
          allProducts={products}
          onClose={() => setShowShoppingList(false)}
          onCreateOrder={(items) => {
            setShowShoppingList(false);
            navigate('/purchase-orders', {
              state: {
                newOrder: true,
                items: items.map((it) => ({
                  productoNombre: it.nombre,
                  cantidad: String(it.cantidad),
                  precioUnitario: '',
                  nota: it.nota || '',
                })),
              },
            });
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
          <div className="input-scan-wrapper">
            <input
              type="text"
              value={form.codigo_barras || ''}
              onChange={(e) => set('codigo_barras', e.target.value)}
              autoFocus
              placeholder="Escaneá o escribí el código..."
            />
            <BarcodeScanButton onScan={(val) => set('codigo_barras', val)} />
          </div>
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

function ShoppingListModal({ allProducts, onClose, onCreateOrder }) {
  const lowStock = allProducts.filter((p) => Number(p.existencia) <= Number(p.existencia_minima));

  const [items, setItems] = useState(() =>
    lowStock.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      unidad: p.unidad_medida || 'unidad',
      existencia: Number(p.existencia),
      minimo: Number(p.existencia_minima),
      cantidad: Math.max(1, Math.ceil(Number(p.existencia_minima) - Number(p.existencia))),
      nota: '',
      esPersonalizado: false,
    }))
  );

  const [busqueda, setBusqueda] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('unidad');
  const [nuevaCantidad, setNuevaCantidad] = useState('1');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [localIp, setLocalIp] = useState(null);

  // Detecta la IP local via WebRTC para generar URL accesible desde el teléfono
  useEffect(() => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then((o) => pc.setLocalDescription(o));
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const m = /(\d{1,3}\.){3}\d{1,3}/.exec(e.candidate.candidate);
        if (m && !m[0].startsWith('127.') && !m[0].startsWith('169.254.')) {
          setLocalIp(m[0]);
          pc.close();
        }
      };
    } catch {
      // WebRTC no disponible
    }
  }, []);

  const addedIds = new Set(items.filter((it) => it.id).map((it) => it.id));
  const sugerencias = allProducts
    .filter((p) => !addedIds.has(p.id) && busqueda.trim() && p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .slice(0, 7);

  function addFromInventory(p) {
    setItems((prev) => [...prev, {
      id: p.id,
      nombre: p.nombre,
      unidad: p.unidad_medida || 'unidad',
      existencia: Number(p.existencia),
      minimo: Number(p.existencia_minima),
      cantidad: 1,
      nota: '',
      esPersonalizado: false,
    }]);
    setBusqueda('');
  }

  function updateItem(i, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function removeItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addCustom() {
    if (!nuevoNombre.trim()) return;
    setItems((prev) => [...prev, {
      id: null,
      nombre: nuevoNombre.trim(),
      unidad: nuevaUnidad,
      existencia: null,
      minimo: null,
      cantidad: Number(nuevaCantidad) || 1,
      nota: '',
      esPersonalizado: true,
    }]);
    setNuevoNombre('');
    setNuevaCantidad('1');
  }

  async function abrirQR() {
    const fecha = new Date().toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
    const compact = items.map((it) => ({
      n: it.nombre,
      c: it.cantidad,
      u: it.unidad,
      ...(it.nota ? { nota: it.nota } : {}),
    }));
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
    const host = localIp ? `${localIp}:${window.location.port || 5173}` : window.location.host;
    const url = `http://${host}/#/lista-compras?d=${encoded}&f=${encodeURIComponent(fecha)}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 260, margin: 2, errorCorrectionLevel: 'M' });
      setQrDataUrl(dataUrl);
      setShowQR(true);
    } catch (err) {
      console.error('Error generando QR:', err);
    }
  }

  function imprimir() {
    const fecha = new Date().toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const filas = items.map((it) => `
      <tr>
        <td>${it.nombre}</td>
        <td style="text-align:center">${it.cantidad} ${it.unidad}</td>
        <td>${it.existencia !== null ? `${it.existencia} / ${it.minimo}` : '—'}</td>
        <td>${it.nota || ''}</td>
        <td style="width:80px;border:1px solid #ccc">&nbsp;</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lista de compras</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; margin: 24px; } /* ignore-value overused-font Arial */
    h2 { margin: 0 0 4px; }
    .sub { color: #666; margin-bottom: 16px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; text-align: left; padding: 7px 10px; border-bottom: 2px solid #ccc; font-size: 11px; text-transform: uppercase; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #fafafa; }
  </style>
</head>
<body>
  <h2>Lista de compras</h2>
  <div class="sub">Generada el ${fecha} &mdash; ${items.length} ítems</div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cantidad a pedir</th>
        <th>Stock actual / mínimo</th>
        <th>Nota</th>
        <th>✓ Conseguido</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ width: 740, maxWidth: '96vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Lista de compras</h2>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {items.length === 0 ? 'Sin ítems — agregá desde inventario o escribí uno nuevo' : `${items.length} ítem${items.length !== 1 ? 's' : ''} en la lista`}
            </span>
          </div>
        </div>

        {/* Agregar section */}
        <div style={{
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: 14,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Agregar a la lista
          </div>

          {/* Buscar en inventario */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto del inventario..."
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            {busqueda.trim() && (
              <div style={{
                position: 'absolute', zIndex: 20, left: 0, right: 0,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', marginTop: 4, overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
              }}>
                {sugerencias.length === 0 ? (
                  <div className="text-muted" style={{ padding: '10px 14px', fontSize: 13 }}>
                    No se encontró en inventario. Usá el campo de abajo para agregarlo igual.
                  </div>
                ) : (
                  sugerencias.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addFromInventory(p)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        width: '100%', textAlign: 'left', padding: '9px 14px',
                        background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer', fontSize: 14, color: 'var(--color-text)',
                      }}
                    >
                      <span>{p.nombre}</span>
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        Stock: {p.existencia} {p.unidad_medida}
                        {Number(p.existencia) <= Number(p.existencia_minima) && (
                          <span className="badge badge-danger" style={{ marginLeft: 6 }}>Bajo</span>
                        )}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Ítem personalizado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 106px auto', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="O escribí un ítem nuevo (insumo, producto nuevo...)"
            />
            <input
              type="number"
              min="1"
              step="any"
              value={nuevaCantidad}
              onChange={(e) => setNuevaCantidad(e.target.value)}
              placeholder="Cant."
              style={{ textAlign: 'center' }}
            />
            <select value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)}>
              <option value="unidad">Unidad</option>
              <option value="kg">Kg</option>
              <option value="litro">Litro</option>
              <option value="paquete">Paquete</option>
              <option value="caja">Caja</option>
            </select>
            <button className="btn btn-sm" onClick={addCustom} disabled={!nuevoNombre.trim()}>+ Agregar</button>
          </div>
        </div>

        {/* La lista */}
        <div style={{ overflowY: 'auto', flex: 1, marginBottom: 14 }}>
          {items.length === 0 ? (
            <div className="alert alert-success">
              Todo el inventario está sobre el stock mínimo. Usá el buscador de arriba para agregar ítems.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th style={{ width: 120 }}>Cantidad</th>
                  <th style={{ width: 100 }}>Stock</th>
                  <th>Nota</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="text-muted" style={{ fontSize: 12, width: 32 }}>{idx + 1}</td>
                    <td>
                      <span>{it.nombre}</span>
                      {it.esPersonalizado && (
                        <span className="badge badge-accent" style={{ marginLeft: 6 }}>Extra</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-8 items-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.cantidad}
                          onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                          style={{ width: 60, padding: '5px 8px' }}
                        />
                        <span className="text-muted" style={{ fontSize: 12 }}>{it.unidad}</span>
                      </div>
                    </td>
                    <td className="text-muted" style={{ fontSize: 12 }}>
                      {it.existencia !== null ? `${it.existencia} / ${it.minimo}` : '—'}
                    </td>
                    <td>
                      <input
                        type="text"
                        value={it.nota}
                        onChange={(e) => updateItem(idx, 'nota', e.target.value)}
                        placeholder="Nota..."
                        style={{ padding: '5px 8px', fontSize: 12 }}
                      />
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => removeItem(idx)} title="Quitar">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          {items.length > 0 && (
            <button className="btn btn-secondary" onClick={imprimir}>🖨️ Imprimir</button>
          )}
          {items.length > 0 && (
            <button className="btn btn-secondary" onClick={abrirQR}>📱 QR teléfono</button>
          )}
          {items.length > 0 && (
            <button className="btn" onClick={() => onCreateOrder(items)}>
              🛒 Crear orden a proveedor
            </button>
          )}
        </div>

        {/* Sub-modal QR */}
        {showQR && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowQR(false)}
          >
            <div
              style={{
                background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
                maxWidth: 340, width: '90vw', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#0f1923' }}>
                Abrir lista en el teléfono
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                {localIp
                  ? <>Escaneá el QR con la cámara de tu teléfono.<br />El teléfono debe estar en el <strong>mismo WiFi</strong>.</>
                  : <>Escaneá el QR desde la <strong>misma computadora</strong> o compartí el enlace.</>
                }
              </div>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Lista de compras"
                  style={{ width: 220, height: 220, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
              )}
              <div style={{
                marginTop: 14, fontSize: 11, color: '#94a3b8',
                wordBreak: 'break-all', lineHeight: 1.5,
              }}>
                {localIp
                  ? `Red: ${localIp}:${window.location.port || 5173}`
                  : 'Detectá la IP local conectándote desde el teléfono'
                }
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 16, width: '100%' }}
                onClick={() => setShowQR(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
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
