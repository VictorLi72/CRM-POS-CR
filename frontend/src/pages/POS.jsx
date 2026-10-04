import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api, { getPrinterName, getAutoPrint, getReceiptHeader } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';
import { buildReceiptHtml, buildFolioCode, descargarRecibo, elegirImpresion } from '../utils/receiptHtml';
import QRCode from 'qrcode';
import { BarcodeScanButton } from '../components/BarcodeScanner.jsx';

const REDONDEAR = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const DEBOUNCE_BUSQUEDA_MS = 150;

const PAYMENT_METHODS = [
  { value: 'efectivo', label: '💵 Efectivo', shortcut: 'F1' },
  { value: 'tarjeta', label: '💳 Tarjeta', shortcut: 'F2' },
  { value: 'sinpe', label: '📱 SINPE Móvil', shortcut: 'F3' },
  { value: 'fiado', label: '📒 Fiado', shortcut: 'F4' },
  { value: 'mixto', label: '💱 Pago Mixto', shortcut: 'F5' },
];

const MIXTO_METHODS = [
  { key: 'efectivo', label: '💵 Efectivo' },
  { key: 'tarjeta', label: '💳 Tarjeta' },
  { key: 'sinpe', label: '📱 SINPE' },
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
  const [mixtoAmounts, setMixtoAmounts] = useState({ efectivo: '', tarjeta: '', sinpe: '' });
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
      } else if (e.key === 'F5') {
        e.preventDefault();
        setPaymentMethod('mixto');
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

  async function handleCameraBarcode(code) {
    setScanValue(code);
    setScanError('');
    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code.trim())}`);
      addProductToCart(res.data);
    } catch {
      handleScanChange({ target: { value: code } });
    }
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

  function updateQuantity(productId, rawCantidad) {
    const line = cart.find((l) => l.producto.id === productId);
    const cantidad = line?.producto?.permite_fracciones ? rawCantidad : Math.round(rawCantidad);
    if (cantidad <= 0) {
      removeLine(productId);
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.producto.id === productId ? { ...l, cantidad } : l))
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
    setMixtoAmounts({ efectivo: '', tarjeta: '', sinpe: '' });
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

  const sumMixto = REDONDEAR(
    Object.values(mixtoAmounts).reduce((a, v) => a + (Number(v) || 0), 0)
  );
  const mixtoEfectivo = Number(mixtoAmounts.efectivo) || 0;
  const mixtoOtros = sumMixto - mixtoEfectivo;
  const mixtoFaltaParaEfectivo = Math.max(0, totals.total - mixtoOtros);
  const cambioMixto = mixtoEfectivo > mixtoFaltaParaEfectivo
    ? REDONDEAR(mixtoEfectivo - mixtoFaltaParaEfectivo)
    : 0;
  const mixtoFalta = Math.max(0, REDONDEAR(totals.total - sumMixto));

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
    if (paymentMethod === 'mixto' && sumMixto < totals.total) {
      setScanError('El total de pagos no cubre el monto de la venta');
      return;
    }
    setProcessing(true);
    setScanError('');
    try {
      const basePayload = {
        items: cart.map((line) => ({
          producto_id: line.producto.id,
          cantidad: line.cantidad,
          precio_unitario: line.producto.precio_efectivo,
          descuento: line.descuento,
        })),
        cliente_id: customerId || null,
      };

      let payload;
      if (paymentMethod === 'mixto') {
        const pagos = MIXTO_METHODS
          .map((m) => ({ metodo: m.key, monto: Number(mixtoAmounts[m.key]) || 0 }))
          .filter((p) => p.monto > 0);
        payload = { ...basePayload, pagos };
      } else {
        payload = {
          ...basePayload,
          metodo_pago: paymentMethod,
          monto_recibido: paymentMethod === 'efectivo' ? Number(amountTendered) || totals.total : undefined,
        };
      }

      const res = await api.post('/sales', payload);
      setLastSale(res.data);
      setCart([]);
      setSelectedProductId(null);
      setAmountTendered('');
      setMixtoAmounts({ efectivo: '', tarjeta: '', sinpe: '' });
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

          {/* Cliente: visible solo en móvil (en desktop va en el topbar) */}
          <div className="pos-cliente-mobile">
            <div className="pos-cliente-mobile-inner">
              <span style={{ fontSize: 15 }}>👤</span>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); loadCustomers(e.target.value); }}
                style={{ flex: 1, minWidth: 0 }}
              />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              >
                <option value="">Sin cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <form onSubmit={handleScanSubmit} style={{ position: 'relative' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Escanear código de barras o buscar producto</label>
                <div className="input-scan-wrapper">
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
                  <BarcodeScanButton onScan={handleCameraBarcode} />
                </div>
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
                            step={line.producto.permite_fracciones ? '0.5' : '1'}
                            min={line.producto.permite_fracciones ? '0.01' : '1'}
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
                  className={'payment-option' + (paymentMethod === m.value ? ' active' : '') + (m.value === 'mixto' ? ' payment-option-full' : '')}
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
            {paymentMethod === 'mixto' && (
              <div style={{ marginBottom: 10 }}>
                {MIXTO_METHODS.map((m) => (
                  <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, width: 100, flexShrink: 0 }}>{m.label}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={mixtoAmounts[m.key]}
                      onChange={(e) => setMixtoAmounts((prev) => ({ ...prev, [m.key]: e.target.value }))}
                      placeholder="0"
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
                {mixtoFalta > 0 && (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Falta: <strong style={{ color: 'var(--color-danger, #dc2626)' }}>{formatCurrency(mixtoFalta)}</strong>
                  </div>
                )}
                {cambioMixto > 0 && (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Vuelto efectivo: <strong>{formatCurrency(cambioMixto)}</strong>
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
              disabled={cart.length === 0 || processing || (paymentMethod === 'mixto' && mixtoFalta > 0)}
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
              F1-F5 pago · Enter/F9 cobrar · Esc cancelar
              <br />
              ↑↓ elegir producto · +/− cantidad · Supr quitar
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const METODO_LABELS_RECEIPT = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', sinpe: 'SINPE Móvil', fiado: 'Fiado', mixto: 'Mixto' };

function Receipt({ sale, cashier, onNewSale }) {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [errorImpresion, setErrorImpresion] = useState('');
  const imprimirRef = useRef(null);
  const hdr = getReceiptHeader();
  const fechaD = new Date((sale.creado_en || new Date().toISOString()).replace(' ', 'T'));
  const fechaStr = fechaD.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
  const horaStr = fechaD.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  const totalUnidades = sale.items.reduce((s, it) => s + it.cantidad, 0);

  async function imprimir() {
    setErrorImpresion('');
    setImprimiendo(true);
    try {
      const html = buildReceiptHtml(sale, cashier);
      if (window.electronAPI) {
        try {
          await window.electronAPI.imprimirTiquete(html, getPrinterName());
        } catch {
          descargarRecibo(html, sale.folio);
        }
      } else {
        const choice = await elegirImpresion(html, sale.folio);
        if (choice === 'print') {
          const win = window.open('', '_blank', 'width=420,height=650');
          if (!win) {
            descargarRecibo(html, sale.folio);
          } else {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 400);
          }
        } else if (choice === 'download') {
          descargarRecibo(html, sale.folio);
        }
      }
    } catch {
      setErrorImpresion('No se pudo procesar el tiquete.');
    } finally {
      setImprimiendo(false);
    }
  }

  useEffect(() => { imprimirRef.current = imprimir; });

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); imprimirRef.current?.(); }
      if (e.key === 'Escape') { e.preventDefault(); onNewSale(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNewSale]);

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>

      {/* Cabecera */}
      <div style={{ padding: '20px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>{hdr.nombre}</div>
            {hdr.telefono && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{hdr.telefono}</div>}
            {hdr.direccion && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{hdr.direccion}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Tiquete #{sale.folio}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Cajero: {cashier}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>
          {sale.items.length} {sale.items.length === 1 ? 'artículo' : 'artículos'} · Cant. total: {totalUnidades}
        </div>
      </div>

      <div style={{ borderTop: '2px solid var(--color-text)', margin: '0 20px' }} />

      {/* Ítems */}
      <div style={{ padding: '4px 20px' }}>
        {sale.items.map((it) => (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>{it.cantidad}x</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.producto_nombre}</div>
                {it.descuento > 0 && <div style={{ fontSize: 11, color: 'var(--color-danger)' }}>desc. {formatCurrency(it.descuento)}</div>}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>{formatCurrency(it.total)}</div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div style={{ padding: '12px 20px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
          <span>Subtotal:</span><span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
          <span>Total:</span><span>{formatCurrency(sale.total)}</span>
        </div>
        {sale.metodo_pago === 'mixto' && sale.pagos ? sale.pagos.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
            <span>{METODO_LABELS_RECEIPT[p.metodo] || p.metodo}:</span><span>{formatCurrency(p.monto)}</span>
          </div>
        )) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
            <span>{METODO_LABELS_RECEIPT[sale.metodo_pago] || sale.metodo_pago}:</span><span>{formatCurrency(sale.total)}</span>
          </div>
        )}
        {(sale.metodo_pago === 'efectivo' || sale.metodo_pago === 'mixto') && sale.vuelto > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
            <span>Vuelto:</span><span>{formatCurrency(sale.vuelto)}</span>
          </div>
        )}
      </div>

      {/* Pie */}
      <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--color-border)', marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{hdr.leyenda || '¡Gracias por su compra!'}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{fechaStr} · {horaStr}</div>
      </div>

      {errorImpresion && <div className="alert alert-danger" style={{ margin: '0 20px 12px' }}>{errorImpresion}</div>}

      {/* Acciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--color-border)' }}>
        <button onClick={imprimir} disabled={imprimiendo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '14px 8px', border: 'none', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', cursor: 'pointer', color: 'var(--color-text)' }}>
          <span style={{ fontSize: 22 }}>🖨️</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{imprimiendo ? 'Imprimiendo...' : 'Imprimir'}</span>
          <kbd style={{ fontSize: 10, opacity: 0.5, background: 'rgba(0,0,0,0.08)', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace' }}>Enter</kbd>
        </button>
        <button onClick={onNewSale} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '14px 8px', border: 'none', background: 'var(--color-primary)', cursor: 'pointer', color: '#fff' }}>
          <span style={{ fontSize: 22 }}>✚</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Nueva venta</span>
          <kbd style={{ fontSize: 10, opacity: 0.6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', color: '#fff' }}>Esc</kbd>
        </button>
      </div>
    </div>
  );
}
