import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nativeDriverPackage = ["pg", "native"].join("-");

function isNamedParameters(value) {
  return value != null
    && typeof value === "object"
    && !Array.isArray(value)
    && !Buffer.isBuffer(value)
    && !(value instanceof Date);
}

function rewriteDialect(sql) {
  let rewritten = String(sql)
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, "INSERT INTO")
    .replace(/\bCOLLATE\s+NOCASE\b/gi, "")
    .replace(/\binstr\s*\(/gi, "strpos(")
    .replace(/\bLIKE\b/gi, "ILIKE")
    .replace(/SUM\(\s*([\w.]+)\s*=\s*'([^']*)'\s*\)/gi, "SUM(CASE WHEN $1='$2' THEN 1 ELSE 0 END)")
    .replace(/\bAS\s+([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g, 'AS "$1"');

  if (/\bINSERT\s+INTO\s+article_revisions\b/i.test(rewritten)
      && /\bagency_update\b/i.test(rewritten)
      && !/\bON\s+CONFLICT\b/i.test(rewritten)) {
    rewritten = `${rewritten.trim().replace(/;$/, "")} ON CONFLICT (article_id,version) DO NOTHING`;
  }

  return rewritten;
}

export function compilePostgresQuery(sql, parameters = []) {
  const named = parameters.length === 1 && isNamedParameters(parameters[0]) ? parameters[0] : null;
  const positional = named ? [] : parameters;
  const namedIndexes = new Map();
  const values = [];
  const source = rewriteDialect(sql);
  let output = "";
  let quote = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      output += character;
      if (character === quote) {
        if (source[index + 1] === quote) {
          output += source[index + 1];
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      output += character;
      continue;
    }

    if (character === "?" && !named) {
      values.push(positional[values.length]);
      output += `$${values.length}`;
      continue;
    }

    if (character === "@" && named) {
      const match = source.slice(index + 1).match(/^([A-Za-z_][A-Za-z0-9_]*)/);
      if (match) {
        const name = match[1];
        let parameterIndex = namedIndexes.get(name);
        if (!parameterIndex) {
          if (!Object.prototype.hasOwnProperty.call(named, name)) throw new Error(`Eksik PostgreSQL parametresi: ${name}`);
          values.push(named[name]);
          parameterIndex = values.length;
          namedIndexes.set(name, parameterIndex);
        }
        output += `$${parameterIndex}`;
        index += name.length;
        continue;
      }
    }

    output += character;
  }

  if (!named && values.length !== positional.length) {
    throw new Error(`PostgreSQL parametre sayısı uyuşmuyor: sorgu=${values.length}, değer=${positional.length}`);
  }

  return { sql: output, values };
}

function withMutationResult(sql) {
  const statement = sql.trim().replace(/;$/, "");
  if (/\bRETURNING\b/i.test(statement)) return statement;
  if (/^\s*INSERT\b/i.test(statement)) return `${statement} RETURNING *`;
  if (/^\s*(UPDATE|DELETE)\b/i.test(statement)) return `${statement} RETURNING 1 AS __changed`;
  return statement;
}

function createTypeParser() {
  const pg = require("pg");
  return {
    getTypeParser(oid, format) {
      if (oid === 20) {
        return (value) => {
          const parsed = Number(value);
          return Number.isSafeInteger(parsed) ? parsed : value;
        };
      }
      return pg.types.getTypeParser(oid, format);
    },
  };
}

class PostgresStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  all(...parameters) {
    const query = compilePostgresQuery(this.sql, parameters);
    return this.database.query(query.sql, query.values);
  }

  get(...parameters) {
    return this.all(...parameters)[0];
  }

  run(...parameters) {
    const query = compilePostgresQuery(this.sql, parameters);
    const rows = this.database.query(withMutationResult(query.sql), query.values);
    return {
      changes: rows.length,
      lastInsertRowid: rows[0]?.id == null ? 0 : Number(rows[0].id),
    };
  }
}

export class PostgresDatabase {
  constructor(connectionString) {
    let Client;
    try {
      // Paket adı çalışma anında kurulur; böylece SQLite geliştirme paketi,
      // macOS'ta kurulu olmayan isteğe bağlı libpq sürücüsünü yüklemeye çalışmaz.
      Client = Reflect.apply(require, undefined, [nativeDriverPackage]);
    } catch (error) {
      throw new Error("PostgreSQL çalışma sürücüsü bulunamadı. Sunucuda pg-native kurulmalıdır.", { cause: error });
    }
    this.Client = Client;
    this.connectionString = connectionString;
    this.typeParser = createTypeParser();
    this.client = this.connect();
    this.depth = 0;
    this.query("SET application_name='kozatv-web'; SET statement_timeout='10s'; SET lock_timeout='5s'");
    const schema = this.query("SELECT to_regclass('public.articles') AS articles")[0];
    if (!schema?.articles) throw new Error("PostgreSQL şeması hazır değil; önce SQLite → PostgreSQL aktarımı çalıştırılmalıdır.");
  }

  connect() {
    const client = new this.Client({ types: this.typeParser });
    client.connectSync(this.connectionString);
    return client;
  }

  query(sql, values) {
    try {
      return this.client.querySync(sql, values);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const connectionFailure = /server closed the connection|connection.*(?:closed|lost|failed)|no connection to the server|terminating connection/i.test(message);
      if (!connectionFailure || this.depth > 0) throw error;
      try { this.client.end(); } catch { /* Kopmuş bağlantı zaten kapalı olabilir. */ }
      this.client = this.connect();
      this.client.querySync("SET application_name='kozatv-web'; SET statement_timeout='10s'; SET lock_timeout='5s'");
      return this.client.querySync(sql, values);
    }
  }

  prepare(sql) {
    return new PostgresStatement(this, sql);
  }

  exec(sql) {
    this.query(rewriteDialect(sql));
    return this;
  }

  pragma() {
    return undefined;
  }

  function() {
    return this;
  }

  transaction(callback) {
    return (...arguments_) => {
      const nested = this.depth > 0;
      const savepoint = `koza_sp_${this.depth + 1}`;
      this.query(nested ? `SAVEPOINT ${savepoint}` : "BEGIN");
      this.depth += 1;
      try {
        const result = callback(...arguments_);
        this.depth -= 1;
        this.query(nested ? `RELEASE SAVEPOINT ${savepoint}` : "COMMIT");
        return result;
      } catch (error) {
        this.depth -= 1;
        this.query(nested ? `ROLLBACK TO SAVEPOINT ${savepoint}` : "ROLLBACK");
        throw error;
      }
    };
  }

  close() {
    this.client.end();
  }
}

export function createPostgresDatabase(connectionString = process.env.KOZA_DATABASE_URL) {
  if (!connectionString) throw new Error("KOZA_DATABASE_URL tanımlı değil.");
  return new PostgresDatabase(connectionString);
}
