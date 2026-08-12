const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'super.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// CREATE TABLE IF NOT EXISTS no agrega columnas nuevas a una tabla que ya existía
// de una versión anterior del esquema, así que las columnas agregadas después del
// primer lanzamiento se migran acá a mano (evita tener que borrar datos reales).
function agregarColumnaSiFalta(tabla, columna, definicion) {
  const columnas = db.prepare(`PRAGMA table_info(${tabla})`).all();
  const existe = columnas.some((c) => c.name === columna);
  if (!existe) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  }
}

agregarColumnaSiFalta('productos', 'acceso_rapido', "INTEGER NOT NULL DEFAULT 0");

// node:sqlite no trae un helper de transacciones como better-sqlite3; se agrega uno
// con la misma firma (db.transaction(fn) devuelve una función que corre en BEGIN/COMMIT)
// para no tener que tocar las rutas que ya usan ese patrón.
db.transaction = function transaction(fn) {
  return function (...args) {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch (_) {
        // no había transacción activa que revertir
      }
      throw err;
    }
  };
};

module.exports = db;
