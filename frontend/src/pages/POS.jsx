import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api, { getPrinterName, getAutoPrint } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';
import { buildReceiptHtml } from '../utils/receiptHtml';

const REDONDEAR = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const DEBOUNCE_BUSQUEDA_MS = 150;

const PAYMENT_METHODS = [
  { value: 'efectivo', label: '💵 Efectivo', shortcut: 'F1' },
  { value: 'tarjeta', label: '💳 Tarjeta', shortcut: 'F2' },
  { value: 'sinpe', label: '📱 SINPE Móvil', shortcut: 'F3' },
  { value: 'fiado', label: '📒 Fiado', shortcut: 'F4' },
];

export default function POS() {
  const { user } = useAuth();
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [tabProducts, setTabProducts] = useState([]);
  const [cart, setCart] = useState([]); // { producto, cantidad, descuento }
  const [justAddedId, setJustAddedId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [discounts, setDiscounts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountTendered, setAmountTendered] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const scanInputRef = useRef(null);
  const debounceRef = useRef(null);
  const latestQueryRef = useRef('');
  const flashTimeoutRef = useRef(null);
  const cartRef = useRef(cart);
  const processingRef = useRef(processing);
  const selectedIdRef = useRef(selectedProductId);
  const handleCheckoutRef = useRef(() => {});
  const clearCartRef = useRef(() => {});
  const stepQuantityRef = useRef(() => {});
  const removeLineRef = useRef(() => {});

  useEffect(() => {
    scanInputRef.current?.focus();
    loadCustomers('');
    loadCategories();
    loadDiscounts();
  }, []);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    processingRef.current = processing;
  }, [processing]);

  useEffect(() => {
    selectedIdRef.current = selectedProductId;
  }, [selectedProductId]);

  // Atajos de teclado: F1-F4 eligen el método de pago, Enter/F9 cobra y Esc
  // cancela la venta. Enter se ignora mientras se escribe en cualquier campo,
  // porque el de escaneo ya usa Enter para agregar el producto y no queremos
  // disparar el cobro a la vez. Esc sí funciona con el foco en el campo de
  // escaneo (el estado normal entre un escaneo y otro), pero se ignora al
  // editar cantidad/descuento/monto recibido para no borrar el carrito sin
  // querer mientras se ajusta un valor.
  // Además: con un producto del carrito "seleccionado" (el último agregado,
  // o el que se haga clic), +/- suman o restan una unidad, ↑/↓ cambian cuál
  // está seleccionado y Supr/Backspace lo quita. Todo esto también se ignora
  // mientras se escribe en un campo, para no interferir con esa edición.
  useEffect(() => {
    function onKeyDown(e) {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName;
      const isFormField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const isScanInput = activeEl === scanInputRef.current;

      if (e.key === 'F1') {
        e.preventDefault();
        setPaymentMethod('efectivo');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setPaymentMethod('tarjeta');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setPaymentMethod('sinpe');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMethod('fiado');
      } else if (e.key === 'F9' || (e.key === 'Enter' && !isFormField)) {
        if (cartRef.current.length > 0 && !processingRef.current) {
          e.preventDefault();
          handleCheckoutRef.current();
        }
      } else if (e.key === 'Escape' && (!isFormField || isScanInput)) {
        if (cartRef.current.length > 0) clearCartRef.current();
      } else if ((e.key === '+' || e.key === '=') && (!isFormField || isScanInput)) {
        if (selectedIdRef.current != null) {
          e.preventDefault();
          stepQuantityRef.current(selectedIdRef.current, 1);
        }
      } else if (e.key === '-' && (!isFormField || isScanInput)) {
        if (selectedIdRef.current != null) {
          e.preventDefault();
          stepQuantityRef.current(selectedIdRef.current, -1);
        }
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && (!isFormField || isScanInput)) {
        if (cartRef.current.length > 0) {
          e.preventDefault();
          const ids = cartRef.current.map((l) => l.producto.id);
          const currentIdx = ids.indexOf(selectedIdRef.current);
          let nextIdx;
          if (currentIdx === -1) {
            nextIdx = e.key === 'ArrowDown' ? 0 : ids.length - 1;
          } else if (e.key === 'ArrowDown') {
            nextIdx = Math.min(currentIdx + 1, ids.length - 1);
          } else {
            nextIdx = Math.max(currentIdx - 1, 0);
          }
          setSelectedProductId(ids[nextIdx]);
        }
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        (!isFormField || (isScanInput && !scanInputRef.current.value))
      ) {
        // Backspace/Supr solo quitan el producto seleccionado si el campo de
        // escaneo está vacío; si el cajero está corrigiendo una búsqueda a
        // medio escribir, Backspace debe borrar texto como es normal.
        if (selectedIdRef.current != null) {
          e.preventDefault();
          removeLineRef.current(selectedIdRef.current);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    loadTabProducts(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadCustomers(search) {
    try {
      const res = await api.get('/customers', { params: { search } });
      setCustomers(res.data);
    } catch (err) {
      // silencioso: no bloquea el POS si falla la búsqueda de clientes
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data);
    } catch (err) {
      // silencioso: las categorías son un atajo de navegación, no algo crítico
    }
  }

  async function loadDiscounts() {
    try {
      const res = await api.get('/discounts');
      setDiscounts(res.data);
    } catch (err) {
      // silencioso: los descuentos predefinidos son un atajo, no algo crítico
    }
  }

  function aplicarDescuentoPreset(producto, cantidad, descuentoId) {
    const preset = discounts.find((d) => String(d.id) === descuentoId);
    if (!preset) return;
    const base = producto.precio_efectivo * cantidad;
    const monto = preset.tipo === 'porcentaje' ? REDONDEAR(base * (preset.valor / 100)) : preset.valor;
    updateDiscount(producto.id, monto);
  }

  async function loadTabProducts(tab) {
    try {
      const params = tab === 'quick' ? { quickAccess: true } : tab === 'all' ? {} : { categoryId: tab };
      const res = await api.get('/products', { params });
      setTabProducts(res.data);
    } catch (err) {
      setTabProducts([]);
    }
  }

  function addProductToCart(producto) {
    setCart((prev) => {
      const idx = prev.findIndex((line) => line.producto.id === producto.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
        return copy;
      }
      return [...prev, { producto, cantidad: 1, descuento: 0 }];
    });
    setScanValue('');
    setSuggestions([]);
    setScanError('');
    scanInputRef.current?.focus();

    setSelectedProductId(producto.id);
    setJustAddedId(producto.id);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setJustAddedId(null), 700);
  }

  async function handleScanSubmit(e) {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      addProductToCart(res.data);
    } catch (err) {
      setScanError(`No se encontró un producto con el código "${code}"`);
      setScanValue('');
    }
  }

  function handleScanChange(e) {
    const value = e.target.value;
    setScanValue(value);
    setScanError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      latestQueryRef.current = query;
      try {
        const res = await api.get('/products', { params: { search: query } });
        // Si el usuario ya escribió/escaneó algo más mientras la respuesta viajaba,
        // esta respuesta quedó vieja y no debe pisar las sugerencias más recientes.
        if (latestQueryRef.current === query) {
          setSuggestions(res.data.slice(0, 8));
        }
      } catch (err) {
        if (latestQueryRef.current === query) setSuggestions([]);
      }
    }, DEBOUNCE_BUSQUEDA_MS);
  }

  function handleScanBlur() {
    // Si el foco se fue a un lugar "de nada" (se hizo clic en el fondo, una celda,
    // etc.) lo devolvemos al campo de escaneo para que el cajero pueda seguir
    // escaneando sin tener que hacer clic ahí de nuevo. Si el foco fue a otro campo
    // real (cantidad, cliente, pago...) lo dejamos tranquilo.
    setTimeout(() => {
      if (document.activeElement === document.body) {
        scanInputRef.current?.focus();
      }
    }, 50);
  }

  function updateQuantity(productId, cantidad) {
    if (cantidad <= 0) {
      removeLine(productId);
      return;
    }
    setCart((prev) =>
      prev.map((line) => (line.producto.id === productId ? { ...line, cantidad } : line))
    );
  }

  function stepQuantity(productId, delta) {
    const line = cart.find((l) => l.producto.id === productId);
    if (!line) return;
    updateQuantity(productId, REDONDEAR(line.cantidad + delta));
  }

  function updateDiscount(productId, descuento) {
    setCart((prev) =>
      prev.map((line) =>
        line.producto.id === productId ? { ...line, descuento: Math.max(0, descuento) } : line
      )
    );
  }

  function removeLine(productId) {
    setCart((prev) => prev.filter((line) => line.producto.id !== productId));
    setSelectedProductId((prev) => (prev === productId ? null : prev));
  }

  function clearCart() {
    setCart([]);
    setSelectedProductId(null);
    setLastSale(null);
    setAmountTendered('');
    setCustomerId('');
    setPaymentMethod('efectivo');
  }

  const totals = cart.reduce(
    (acc, line) => {
      const lineTotal = Math.max(0, line.producto.precio_efectivo * line.cantidad - line.descuento);
      const sinIva = lineTotal / (1 + line.producto.tarifa_iva / 100);
      const iva = lineTotal - sinIva;
      acc.subtotal += sinIva;
      acc.iva += iva;
      acc.total += lineTotal;
      return acc;
    },
    { subtotal: 0, iva: 0, total: 0 }
  );
  totals.subtotal = REDONDEAR(totals.subtotal);
  totals.iva = REDONDEAR(totals.iva);
  totals.total = REDONDEAR(totals.total);

  const change =
    paymentMethod === 'efectivo' && amountTendered
      ? REDONDEAR(Number(amountTendered) - totals.total)
      : null;

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (paymentMethod === 'fiado' && !customerId) {
      setScanError('Seleccioná un cliente para venta fiada');
      return;
    }
    if (paymentMethod === 'efectivo' && amountTendered && Number(amountTendered) < totals.total) {
      setScanError('El monto recibido es menor al total');
      return;
    }
    setProcessing(true);
    setScanError('');
    try {
      const payload = {
        items: cart.map((line) => ({
          producto_id: line.producto.id,
          cantidad: line.cantidad,
          precio_unitario: line.producto.precio_efectivo,
          descuento: line.descuento,
        })),
        cliente_id: customerId || null,
        metodo_pago: paymentMethod,
        monto_recibido: paymentMethod === 'efectivo' ? Number(amountTendered) || totals.total : undefined,
      };
      const res = await api.post('/sales', payload);
      setLastSale(res.data);
      setCart([]);
      setSelectedProductId(null);
      setAmountTendered('');
    } catch (err) {
      setScanError(err.response?.data?.error || 'No se pudo procesar la venta');
    } finally {
      setProcessing(false);
    }
  }

  useEffect(() => {
    handleCheckoutRef.current = handleCheckout;
    clearCartRef.current = clearCart;
    stepQuantityRef.current = stepQuantity;
    removeLineRef.current = removeLine;
  });

  if (lastSale) {
    return (
      <Layout title="Punto de Venta">
        <Receipt sale={lastSale} cashier={user?.nombre_completo} onNewSale={clearCart} />
      </Layout>
    );
  }

  const tabs = [
    { key: 'all', label: 'Todos' },
    { key: 'quick', label: '⭐ Rápidos' },
    ...categories.map((c) => ({ key: String(c.id), label: c.nombre })),
  ];

  const clienteSeleccionado = customers.find((c) => String(c.id) === String(customerId));

  const topbarCliente = (
    <div className="topbar-customer">
      <span className="topbar-customer-label">👤</span>
      <input
        type="text"
        placeholder="Buscar cliente..."
        value={customerSearch}
        onChange={(e) => {
          setCustomerSearch(e.target.value);
          loadCustomers(e.target.value);
        }}
      />
      <select
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        title={clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin cliente (venta general)'}
      >
        <option value="">Sin cliente (venta general)</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre} {c.identificacion ? `(${c.identificacion})` : ''}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Layout title="Punto de Venta" topbarExtra={topbarCliente}>
      <div className="pos-layout">
        <div className="pos-main-col">
          <div className="card">
            <form onSubmit={handleScanSubmit} style={{ position: 'relative' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Escanear código de barras o buscar producto</label>
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanValue}
                  onChange={handleScanChange}
                  onBlur={handleScanBlur}
                  placeholder="Escanee con el lector o escriba el nombre..."
                  autoComplete="off"
                  style={{ fontSize: 16, padding: '12px 14px' }}
                />
              </div>
              {suggestions.length > 0 && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    marginTop: 4,
                    padding: 6,
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}
                >
                  {suggestions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addProductToCart(p)}
                      className="flex justify-between items-center"
                      style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 6 }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <span>{p.nombre}</span>
                      <span className="text-muted">
                        {p.precio_venta_original && (
                          <span style={{ textDecoration: 'line-through', marginRight: 4 }}>
                            {formatCurrency(p.precio_venta_original)}
                          </span>
                        )}
                        {formatCurrency(p.precio_efectivo)} · existencia {p.existencia}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </form>
            {scanError && <div className="alert alert-danger" style={{ marginTop: 12 }}>{scanError}</div>}
          </div>

          <div className="card pos-products-card">
            <div className="category-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={'category-tab' + (activeTab === tab.key ? ' active' : '')}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {tabProducts.length === 0 ? (
              <div className="empty-state">
                {activeTab === 'quick'
                  ? 'No hay productos marcados como acceso rápido. Marcalos desde Inventario.'
                  : 'No hay productos en esta categoría.'}
              </div>
            ) : (
              <div className="product-grid">
                {tabProducts.map((p) => (
                  <button key={p.id} type="button" className="product-tile" onClick={() => addProductToCart(p)}>
                    {p.existencia <= p.existencia_minima && (
                      <span className="badge badge-danger product-tile-badge">Bajo</span>
                    )}
                    {p.precio_venta_original && (
                      <span className="badge badge-success product-tile-badge" style={{ right: 'auto', left: 8 }}>
                        🏷️ Promo
                      </span>
                    )}
                    <span className="product-tile-name">{p.nombre}</span>
                    <span className="product-tile-price">
                      {p.precio_venta_original && (
                        <span className="text-muted" style={{ textDecoration: 'line-through', marginRight: 6, fontWeight: 400 }}>
                          {formatCurrency(p.precio_venta_original)}
                        </span>
                      )}
                      {formatCurrency(p.precio_efectivo)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pos-side-panel">
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: cart.length ? 10 : 0 }}>
              <h3 className="mt-0" style={{ margin: 0 }}>🛒 Carrito</h3>
              {cart.length > 0 && (
                <span className="text-muted">{cart.length} producto{cart.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {cart.length === 0 ? (
              <div className="empty-state">El carrito está vacío. Escaneá o tocá un producto para comenzar.</div>
            ) : (
              <div className="cart-list">
                {cart.map((line) => {
                  const lineTotal = Math.max(0, line.producto.precio_efectivo * line.cantidad - line.descuento);
                  return (
                    <div
                      key={line.producto.id}
                      className={
                        'cart-item' +
                        (justAddedId === line.producto.id ? ' cart-item-flash' : '') +
                        (selectedProductId === line.producto.id ? ' cart-item-selected' : '')
                      }
                      onClick={() => setSelectedProductId(line.producto.id)}
                    >
                      <div className="cart-item-top">
                        <span className="cart-item-name">{line.producto.nombre}</span>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => removeLine(line.producto.id)}
                          title="Quitar del carrito"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="cart-item-mid">
                        <div className="qty-stepper">
                          <button type="button" className="qty-btn" onClick={() => stepQuantity(line.producto.id, -1)}>
                            −
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={line.cantidad}
                            onChange={(e) => updateQuantity(line.producto.id, Number(e.target.value))}
                          />
                          <button type="button" className="qty-btn" onClick={() => stepQuantity(line.producto.id, 1)}>
                            +
                          </button>
                        </div>
                        <span className="cart-item-total">{formatCurrency(lineTotal)}</span>
                      </div>
                      <div className="cart-item-sub">
                        <span>
                          {line.producto.precio_venta_original && (
                            <span className="text-muted" style={{ textDecoration: 'line-through', marginRight: 4, fontWeight: 400, fontSize: '0.82em' }}>
                              {formatCurrency(line.producto.precio_venta_original)}
                            </span>
                          )}
                          {formatCurrency(line.producto.precio_efectivo)} c/u · IVA {line.producto.tarifa_iva}%
                        </span>
                        <label className="cart-item-discount" title="Descuento en colones">
                          🏷️
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={line.descuento}
                            onChange={(e) => updateDiscount(line.producto.id, Number(e.target.value))}
                          />
                        </label>
                      </div>
                      {discounts.length > 0 && (
                        <select
                          className="cart-item-discount-preset"
                          value=""
                          onChange={(e) => aplicarDescuentoPreset(line.producto, line.cantidad, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">🏷️ Aplicar descuento predefinido...</option>
                          {discounts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre} ({d.tipo === 'porcentaje' ? `${d.valor}%` : formatCurrency(d.valor)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mt-0">Totales</h3>
            <div className="flex justify-between" style={{ marginBottom: 6 }}>
              <span className="text-muted">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between" style={{ marginBottom: 6 }}>
              <span className="text-muted">IVA</span>
              <span>{formatCurrency(totals.iva)}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 20, fontWeight: 700 }}>
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="mt-0">Pago</h3>
            <div className="payment-options">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={'payment-option' + (paymentMethod === m.value ? ' active' : '')}
                  onClick={() => setPaymentMethod(m.value)}
                >
                  {m.label}
                  <span className="payment-option-key">{m.shortcut}</span>
                </button>
              ))}
            </div>
            {paymentMethod === 'efectivo' && (
              <div className="form-group">
                <label>Monto recibido</label>
                <input
                  type="number"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder={totals.total.toFixed(2)}
                />
                {change != null && (
                  <div className="text-muted" style={{ marginTop: 6 }}>
                    Vuelto: <strong>{formatCurrency(Math.max(0, change))}</strong>
                  </div>
                )}
              </div>
            )}
            {paymentMethod === 'fiado' && !customerId && (
              <div className="alert alert-warning">Debe seleccionar un cliente para venta fiada</div>
            )}
            <button
              className="btn"
              style={{ width: '100%', marginTop: 8, fontSize: 16, padding: '14px 16px' }}
              disabled={cart.length === 0 || processing}
              onClick={handleCheckout}
            >
              {processing ? 'Procesando...' : `Cobrar ${formatCurrency(totals.total)}`}
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Cancelar venta
            </button>
            <p className="text-muted keyboard-hint">
              F1-F4 pago · Enter/F9 cobrar · Esc cancelar
              <br />
              ↑↓ elegir producto · +/− cantidad · Supr quitar
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Receipt({ sale, cashier, onNewSale }) {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [errorImpresion, setErrorImpresion] = useState('');
  const tieneAPIImpresion = typeof window !== 'undefined' && !!window.electronAPI;
  const autoPrinted = useRef(false);

  async function imprimir() {
    setErrorImpresion('');
    setImprimiendo(true);
    try {
      const html = buildReceiptHtml(sale, cashier);
      await window.electronAPI.imprimirTiquete(html, getPrinterName());
    } catch (err) {
      setErrorImpresion('No se pudo imprimir. Revisá la impresora en Configuración.');
    } finally {
      setImprimiendo(false);
    }
  }

  useEffect(() => {
    if (autoPrinted.current) return;
    if (tieneAPIImpresion && getAutoPrint()) {
      autoPrinted.current = true;
      imprimir();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="text-center">
        <h2>Venta registrada</h2>
        <p className="text-muted">Tiquete #{sale.folio}</p>
      </div>
      <table>
        <tbody>
          {sale.items.map((it) => (
            <tr key={it.id}>
              <td>
                {it.producto_nombre}
                <div className="text-muted">
                  {it.cantidad} x {formatCurrency(it.precio_unitario)}
                  {it.descuento > 0 && <> · desc. {formatCurrency(it.descuento)}</>}
                </div>
              </td>
              <td className="text-right">{formatCurrency(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatCurrency(sale.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-muted">IVA</span><span>{formatCurrency(sale.iva_total)}</span></div>
        <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 18 }}>
          <span>Total</span><span>{formatCurrency(sale.total)}</span>
        </div>
        {sale.metodo_pago === 'efectivo' && (
          <div className="flex justify-between"><span className="text-muted">Vuelto</span><span>{formatCurrency(sale.vuelto)}</span></div>
        )}
        <div className="flex justify-between"><span className="text-muted">Pago</span><span>{sale.metodo_pago}</span></div>
        <div className="flex justify-between"><span className="text-muted">Cajero</span><span>{cashier}</span></div>
      </div>
      {errorImpresion && <div className="alert alert-danger" style={{ marginTop: 12 }}>{errorImpresion}</div>}
      {tieneAPIImpresion && (
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 20 }} onClick={imprimir} disabled={imprimiendo}>
          {imprimiendo ? 'Imprimiendo...' : '🖨️ Imprimir tiquete'}
        </button>
      )}
      <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={onNewSale}>
        Nueva venta
      </button>
    </div>
  );
}
