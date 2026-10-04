import { Pool } from "pg"

type NeonPool = Pool & {
  execute: (sql: string, params?: any[]) => Promise<[any[], { affectedRows: number }]>
}

declare global {
  // eslint-disable-next-line no-var
  var _neonPool: NeonPool | undefined
}

export function getPool(): NeonPool {
  if (!global._neonPool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada")
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    })
    ;(pool as NeonPool).execute = (sql: string, params: any[] = []) => execute(sql, params)
    global._neonPool = pool
  }
  return global._neonPool
}

function normalizeSql(sql: string, params: any[] = []) {
  let index = 0
  return {
    sql: sql.replace(/\?/g, () => `$${++index}`).replace(/\bUUID\(\)/gi, "gen_random_uuid()").replace(/`/g, '"'),
    params,
  }
}

export async function execute(sql: string, params: any[] = []): Promise<[any[], { affectedRows: number }]> {
  if (/^\s*SHOW\s+TABLES/i.test(sql)) {
    const result = await getPool().query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    return [result.rows, { affectedRows: result.rowCount ?? 0 }]
  }
  const normalized = normalizeSql(sql, params)
  const result = await getPool().query(normalized.sql, normalized.params)
  return [result.rows, { affectedRows: result.rowCount ?? 0 }]
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  return (await query<T>(sql, params))[0] || null
}

export async function insert(table: string, data: Record<string, any>): Promise<any> {
  const record = { id: data.id || crypto.randomUUID(), ...data }
  const columns = Object.keys(record)
  const values = Object.values(record)
  const fields = columns.map((column) => `"${column}"`).join(", ")
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ")
  const result = await getPool().query(`INSERT INTO "${table}" (${fields}) VALUES (${placeholders}) RETURNING *`, values)
  return result.rows[0]
}

export async function update(table: string, id: string, data: Record<string, any>): Promise<any> {
  const entries = Object.entries(data).filter(([column]) => column !== "updated_at")
  const values = entries.map(([, value]) => value)
  const assignments = entries.map(([column], index) => `"${column}" = $${index + 1}`)
  const result = await getPool().query(`UPDATE "${table}" SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`, [...values, id])
  return result.rows[0]
}

export async function remove(table: string, id: string): Promise<boolean> {
  const result = await getPool().query(`DELETE FROM "${table}" WHERE id = $1`, [id])
  return (result.rowCount ?? 0) > 0
}

export async function removeWhere(table: string, conditions: Record<string, any>): Promise<number> {
  const entries = Object.entries(conditions)
  const where = entries.map(([column], index) => `"${column}" = $${index + 1}`).join(" AND ")
  const result = await getPool().query(`DELETE FROM "${table}" WHERE ${where}`, entries.map(([, value]) => value))
  return result.rowCount ?? 0
}

export function createMySQLClient() { return { from: (table: string) => new QueryBuilder(table) } }

class QueryBuilder {
  private selectColumns = "*"
  private whereConditions: { column: string; operator: string; value: any }[] = []
  private orderByColumns: { column: string; ascending: boolean }[] = []
  private limitValue: number | null = null
  private offsetValue: number | null = null
  private operation: "select" | "insert" | "update" | "delete" = "select"
  private updateData: Record<string, any> | null = null
  private insertData: Record<string, any> | Record<string, any>[] | null = null

  constructor(private readonly table: string) {}
  select(columns = "*") { if (this.operation === "select") this.selectColumns = columns; return this }
  eq(column: string, value: any) { this.whereConditions.push({ column, operator: "=", value }); return this }
  neq(column: string, value: any) { this.whereConditions.push({ column, operator: "!=", value }); return this }
  gt(column: string, value: any) { this.whereConditions.push({ column, operator: ">", value }); return this }
  gte(column: string, value: any) { this.whereConditions.push({ column, operator: ">=", value }); return this }
  lt(column: string, value: any) { this.whereConditions.push({ column, operator: "<", value }); return this }
  lte(column: string, value: any) { this.whereConditions.push({ column, operator: "<=", value }); return this }
  order(column: string, options?: { ascending?: boolean }) { this.orderByColumns.push({ column, ascending: options?.ascending ?? true }); return this }
  limit(count: number) { this.limitValue = count; return this }
  offset(count: number) { this.offsetValue = count; return this }
  insert(data: Record<string, any> | Record<string, any>[]) { this.operation = "insert"; this.insertData = data; return this }
  update(data: Record<string, any>) { this.operation = "update"; this.updateData = data; return this }
  delete() { this.operation = "delete"; return this }

  private where() {
    const sql = this.whereConditions.length ? ` WHERE ${this.whereConditions.map((condition, index) => `${condition.column} ${condition.operator} $${index + 1}`).join(" AND ")}` : ""
    return { sql, params: this.whereConditions.map((condition) => condition.value) }
  }

  private async run(): Promise<{ data: any; error: any }> {
    try {
      if (this.operation === "select") {
        const where = this.where()
        const order = this.orderByColumns.length ? ` ORDER BY ${this.orderByColumns.map((item) => `${item.column} ${item.ascending ? "ASC" : "DESC"}`).join(", ")}` : ""
        const limit = this.limitValue === null ? "" : ` LIMIT ${this.limitValue}${this.offsetValue === null ? "" : ` OFFSET ${this.offsetValue}`}`
        const result = await getPool().query(`SELECT ${this.selectColumns} FROM ${this.table}${where.sql}${order}${limit}`, where.params)
        return { data: result.rows, error: null }
      }
      if (this.operation === "insert") {
        const records = Array.isArray(this.insertData) ? this.insertData : [this.insertData!]
        const inserted = []
        for (const record of records) inserted.push(await insert(this.table, record))
        return { data: Array.isArray(this.insertData) ? inserted : inserted[0], error: null }
      }
      const where = this.where()
      if (!where.params.length) return { data: null, error: new Error("A condição é obrigatória") }
      if (this.operation === "delete") {
        const result = await getPool().query(`DELETE FROM ${this.table}${where.sql} RETURNING *`, where.params)
        return { data: result.rows, error: null }
      }
      const entries = Object.entries(this.updateData || {}).filter(([column]) => column !== "updated_at")
      const values = entries.map(([, value]) => value)
      const assignments = entries.map(([column], index) => `${column} = $${index + 1}`)
      const shiftedWhere = where.sql.replace(/\$(\d+)/g, (_, value) => `$${Number(value) + values.length}`)
      const result = await getPool().query(`UPDATE ${this.table} SET ${assignments.join(", ")}, updated_at = NOW()${shiftedWhere} RETURNING *`, [...values, ...where.params])
      return { data: result.rows[0] ?? null, error: null }
    } catch (error) {
      console.error("[v0] Erro na consulta Neon:", error)
      return { data: null, error }
    }
  }

  then(resolve: (value: { data: any; error: any }) => void, reject?: (reason?: any) => void) { return this.run().then(resolve, reject) }
  async single() { if (this.operation === "select") this.limitValue = 1; const result = await this.run(); return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error } }
}

export const mysql_db = createMySQLClient()
export const db = mysql_db
export const pool = getPool
export const mysql = { getPool, query, insert, update, remove, removeWhere }
export const neon = mysql
export const provider = "neon"
export const dialect = "postgres"
