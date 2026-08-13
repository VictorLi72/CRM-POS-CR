import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency, formatDateOnly } from '../utils/format';
import { crearLibroEstilado, FORMATO_COLONES, FORMATO_ENTERO, FORMATO_CANTIDAD } from '../utils/excelExport';

const COLORS = ['#1e6f5c', '#2563eb', '#b8860b', '#d64545', '#6b7686', '#17594a', '#7c3aed', '#0891b2'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function Reports() {
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byCashier, setByCashier] = useState([]);

  useEffect(() => {
    api.get('/reports/summary').then((res) => setSummary(res.data));
  }, []);

  useEffect(() => {
    const params = { from, to: `${to} 23:59:59` };
    api.get('/reports/sales-by-day', { params }).then((res) => setByDay(res.data));
    api.get('/reports/sales-by-product', { params: { ...params, limit: 8 } }).then((res) => setByProduct(res.data));
    api.get('/reports/sales-by-category', { params }).then((res) => setByCategory(res.data));
    api.get('/reports/sales-by-cashier', { params }).then((res) => setByCashier(res.data));
  }, [from, to]);

  function exportarExcel() {
    const periodo = `Período: ${formatDateOnly(from)} — ${formatDateOnly(to)}`;
    const libro = crearLibroEstilado();

    if (summary) {
      libro.agregarHoja(
        'Resumen',
        `Resumen general — ${periodo}`,
        ['Indicador', 'Valor'],
        [
          ['Ventas de hoy', `${formatCurrency(summary.ventas_hoy.total)} (${summary.ventas_hoy.cantidad} tiquetes)`],
          ['Ventas del mes', `${formatCurrency(summary.ventas_mes.total)} (${summary.ventas_mes.cantidad} tiquetes)`],
          ['Productos con stock bajo', String(summary.productos_stock_bajo)],
          ['Fiado pendiente', formatCurrency(summary.fiado_pendiente_total)],
        ]
      );
    }

    libro.agregarHoja(
      'Ventas por día',
      `Ventas por día — ${periodo}`,
      ['Día', 'Total', 'Tiquetes'],
      byDay.map((d) => [formatDateOnly(d.dia), d.total, d.cantidad]),
      [null, FORMATO_COLONES, FORMATO_ENTERO]
    );
    libro.agregarHoja(
      'Top productos',
      `Top productos — ${periodo}`,
      ['Producto', 'Cantidad', 'Ingreso'],
      byProduct.map((p) => [p.producto_nombre, p.cantidad, p.ingreso]),
      [null, FORMATO_CANTIDAD, FORMATO_COLONES]
    );
    libro.agregarHoja(
      'Ventas por categoría',
      `Ventas por categoría — ${periodo}`,
      ['Categoría', 'Cantidad', 'Ingreso'],
      byCategory.map((c) => [c.categoria, c.cantidad, c.ingreso]),
      [null, FORMATO_CANTIDAD, FORMATO_COLONES]
    );
    libro.agregarHoja(
      'Ventas por cajero',
      `Ventas por cajero — ${periodo}`,
      ['Cajero', 'Tiquetes', 'Total'],
      byCashier.map((c) => [c.cajero_nombre, c.cantidad, c.ingreso]),
      [null, FORMATO_ENTERO, FORMATO_COLONES]
    );

    libro.descargar(`reporte-ventas_${from}_a_${to}.xlsx`);
  }

  return (
    <Layout title="Reportes">
      {summary && (
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">Ventas de hoy</div>
            <div className="stat-value">{formatCurrency(summary.ventas_hoy.total)}</div>
            <div className="stat-sub">{summary.ventas_hoy.cantidad} tiquetes</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ventas del mes</div>
            <div className="stat-value">{formatCurrency(summary.ventas_mes.total)}</div>
            <div className="stat-sub">{summary.ventas_mes.cantidad} tiquetes</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Productos con stock bajo</div>
            <div className="stat-value">{summary.productos_stock_bajo}</div>
            <div className="stat-sub">Revisar inventario</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fiado pendiente</div>
            <div className="stat-value">{formatCurrency(summary.fiado_pendiente_total)}</div>
            <div className="stat-sub">Por cobrar a clientes</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="flex gap-8 items-center">
          <label className="text-muted">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <label className="text-muted">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={exportarExcel}>📥 Exportar a Excel</button>
      </div>

      <div className="card">
        <h3 className="mt-0">Ventas por día</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
            <XAxis dataKey="dia" tickFormatter={formatDateOnly} fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={formatDateOnly} />
            <Line type="monotone" dataKey="total" stroke="#1e6f5c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="mt-0">Top productos por ingreso</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byProduct} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="producto_nombre" width={140} fontSize={11} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="ingreso" fill="#1e6f5c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mt-0">Ventas por categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byCategory} dataKey="ingreso" nameKey="categoria" outerRadius={100} label={(d) => d.categoria}>
                {byCategory.map((entry, idx) => (
                  <Cell key={entry.categoria} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="mt-0">Ventas por cajero</h3>
        <table>
          <thead>
            <tr><th>Cajero</th><th>Tiquetes</th><th className="text-right">Total vendido</th></tr>
          </thead>
          <tbody>
            {byCashier.map((c) => (
              <tr key={c.cajero_nombre}>
                <td>{c.cajero_nombre}</td>
                <td>{c.cantidad}</td>
                <td className="text-right">{formatCurrency(c.ingreso)}</td>
              </tr>
            ))}
            {byCashier.length === 0 && <tr><td colSpan={3} className="empty-state">Sin datos en el período.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
