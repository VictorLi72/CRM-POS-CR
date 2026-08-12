import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';

const REDONDEAR = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function POS() {
  const { user } = useAuth();
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cart, setCart] = useState([]); // { producto, cantidad, descuento }
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountTendered, setAmountTendered] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const scanInputRef = useRef(null);

  useEffect(() => {
    scanInputRef.current?.focus();
    loadCustomers('');
  }, []);

  async function loadCustomers(search) {
    try {
      const res = await api.get('/customers', { params: { search } });
      setCustomers(res.data);
    } catch (err) {
      // silencioso: no bloquea el POS si falla la búsqueda de clientes
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

  async function handleScanChange(e) {
    const value = e.target.value;
    setScanValue(value);
    setScanError('');
    if (value.trim().length >= 2) {
      try {
        const res = await api.get('/products', { params: { search: value.trim() } });
        setSuggestions(res.data.slice(0, 8));
      } catch (err) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }

  function updateQuantity(productId, cantidad) {
    setCart((prev) =>
      prev.map((line) =>
        line.producto.id === productId ? { ...line, cantidad: Math.max(0.001, cantidad) } : line
      )
    );
  }

  function removeLine(productId) {
    setCart((prev) => prev.filter((line) => line.producto.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setLastSale(null);
    setAmountTendered('');
    setCustomerId('');
    setPaymentMethod('efectivo');
  }

  const totals = cart.reduce(
    (acc, line) => {
      const lineTotal = line.producto.precio_venta * line.cantidad - line.descuento;
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
          precio_unitario: line.producto.precio_venta,
          descuento: line.descuento,
        })),
        cliente_id: customerId || null,
        metodo_pago: paymentMethod,
        monto_recibido: paymentMethod === 'efectivo' ? Number(amountTendered) || totals.total : undefined,
      };
      const res = await api.post('/sales', payload);
      setLastSale(res.data);
      setCart([]);
      setAmountTendered('');
    } catch (err) {
      setScanError(err.response?.data?.error || 'No se pudo procesar la venta');
    } finally {
      setProcessing(false);
    }
  }

  if (lastSale) {
    return (
      <Layout title="Punto de Venta">
        <Receipt sale={lastSale} cashier={user?.nombre_completo} onNewSale={clearCart} />
      </Layout>
    );
  }

  return (
    <Layout title="Punto de Venta">
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="card">
            <form onSubmit={handleScanSubmit} style={{ position: 'relative' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Escanear código de barras o buscar producto</label>
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanValue}
                  onChange={handleScanChange}
                  placeholder="Escanee con el lector o escriba el nombre..."
                  autoComplete="off"
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
                      <span className="text-muted">{formatCurrency(p.precio_venta)} · existencia {p.existencia}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
            {scanError && <div className="alert alert-danger" style={{ marginTop: 12 }}>{scanError}</div>}
          </div>

          <div className="card">
            {cart.length === 0 ? (
              <div className="empty-state">El carrito está vacío. Escaneá un producto para comenzar.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cant.</th>
                    <th>IVA</th>
                    <th className="text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((line) => {
                    const lineTotal = line.producto.precio_venta * line.cantidad - line.descuento;
                    return (
                      <tr key={line.producto.id}>
                        <td>{line.producto.nombre}</td>
                        <td>{formatCurrency(line.producto.precio_venta)}</td>
                        <td style={{ width: 90 }}>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={line.cantidad}
                            onChange={(e) => updateQuantity(line.producto.id, Number(e.target.value))}
                          />
                        </td>
                        <td>{line.producto.tarifa_iva}%</td>
                        <td className="text-right">{formatCurrency(lineTotal)}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => removeLine(line.producto.id)}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="mt-0">Cliente</h3>
            <input
              type="text"
              placeholder="Buscar cliente (opcional)..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                loadCustomers(e.target.value);
              }}
              style={{ marginBottom: 8 }}
            />
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Sin cliente (venta general)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.identificacion ? `(${c.identificacion})` : ''}
                </option>
              ))}
            </select>
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
            <div className="form-group">
              <label>Método de pago</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="sinpe">SINPE Móvil</option>
                <option value="fiado">Fiado (crédito)</option>
              </select>
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
              style={{ width: '100%', marginTop: 8 }}
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
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Receipt({ sale, cashier, onNewSale }) {
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
      <button className="btn" style={{ width: '100%', marginTop: 20 }} onClick={onNewSale}>
        Nueva venta
      </button>
    </div>
  );
}
