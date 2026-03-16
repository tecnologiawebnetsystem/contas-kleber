import mysql from 'mysql2/promise'

// Pool de conexões MySQL
let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'contas_kleber',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    })
  }
  return pool
}

// Helper para executar queries
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const pool = getPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}

// Helper para executar queries que retornam um único resultado
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, params)
  return results[0] || null
}

// Helper para inserir dados e retornar o registro inserido
export async function insert(
  table: string,
  data: Record<string, any>
): Promise<any> {
  const pool = getPool()
  const id = crypto.randomUUID()
  const dataWithId = { id, ...data }
  
  const columns = Object.keys(dataWithId)
  const values = Object.values(dataWithId)
  const placeholders = columns.map(() => '?').join(', ')
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
  await pool.execute(sql, values)
  
  // Retornar o registro inserido
  const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id])
  return (rows as any[])[0]
}

// Helper para atualizar dados
export async function update(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<any> {
  const pool = getPool()
  
  const columns = Object.keys(data)
  const values = Object.values(data)
  const setClause = columns.map(col => `${col} = ?`).join(', ')
  
  const sql = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = ?`
  await pool.execute(sql, [...values, id])
  
  // Retornar o registro atualizado
  const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id])
  return (rows as any[])[0]
}

// Helper para deletar dados
export async function remove(table: string, id: string): Promise<boolean> {
  const pool = getPool()
  const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id])
  return (result as any).affectedRows > 0
}

// Helper para deletar com condição
export async function removeWhere(
  table: string,
  conditions: Record<string, any>
): Promise<number> {
  const pool = getPool()
  
  const columns = Object.keys(conditions)
  const values = Object.values(conditions)
  const whereClause = columns.map(col => `${col} = ?`).join(' AND ')
  
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`
  const [result] = await pool.execute(sql, values)
  return (result as any).affectedRows
}

// Objeto compatível com API do Supabase para facilitar migração
export function createMySQLClient() {
  return {
    from: (table: string) => new QueryBuilder(table),
  }
}

class QueryBuilder {
  private table: string
  private selectColumns: string = '*'
  private whereConditions: { column: string; operator: string; value: any }[] = []
  private orderByColumns: { column: string; ascending: boolean }[] = []
  private limitValue: number | null = null
  private offsetValue: number | null = null

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*') {
    this.selectColumns = columns
    return this
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '=', value })
    return this
  }

  neq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '!=', value })
    return this
  }

  gt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>', value })
    return this
  }

  gte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>=', value })
    return this
  }

  lt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<', value })
    return this
  }

  lte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<=', value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByColumns.push({
      column,
      ascending: options?.ascending ?? true,
    })
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  offset(count: number) {
    this.offsetValue = count
    return this
  }

  private buildWhereClause(): { sql: string; params: any[] } {
    if (this.whereConditions.length === 0) {
      return { sql: '', params: [] }
    }
    const conditions = this.whereConditions.map(
      (c) => `${c.column} ${c.operator} ?`
    )
    return {
      sql: ' WHERE ' + conditions.join(' AND '),
      params: this.whereConditions.map((c) => c.value),
    }
  }

  private buildOrderClause(): string {
    if (this.orderByColumns.length === 0) return ''
    const orders = this.orderByColumns.map(
      (o) => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`
    )
    return ' ORDER BY ' + orders.join(', ')
  }

  private buildLimitClause(): string {
    if (this.limitValue === null) return ''
    let clause = ` LIMIT ${this.limitValue}`
    if (this.offsetValue !== null) {
      clause += ` OFFSET ${this.offsetValue}`
    }
    return clause
  }

  async execute(): Promise<{ data: any[] | null; error: any }> {
    try {
      const pool = getPool()
      const { sql: whereSQL, params } = this.buildWhereClause()
      const orderSQL = this.buildOrderClause()
      const limitSQL = this.buildLimitClause()

      const sql = `SELECT ${this.selectColumns} FROM ${this.table}${whereSQL}${orderSQL}${limitSQL}`
      const [rows] = await pool.execute(sql, params)
      return { data: rows as any[], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Alias para execute - compatibilidade com Supabase
  async then(resolve: (value: { data: any[] | null; error: any }) => void) {
    const result = await this.execute()
    resolve(result)
  }

  async single(): Promise<{ data: any | null; error: any }> {
    this.limitValue = 1
    const result = await this.execute()
    return {
      data: result.data?.[0] || null,
      error: result.error,
    }
  }

  async insert(data: Record<string, any> | Record<string, any>[]): Promise<{ data: any; error: any }> {
    try {
      const pool = getPool()
      const records = Array.isArray(data) ? data : [data]
      const insertedRecords: any[] = []

      for (const record of records) {
        const id = record.id || crypto.randomUUID()
        const dataWithId = { id, ...record }

        const columns = Object.keys(dataWithId)
        const values = Object.values(dataWithId)
        const placeholders = columns.map(() => '?').join(', ')

        const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`
        await pool.execute(sql, values)

        const [rows] = await pool.execute(
          `SELECT * FROM ${this.table} WHERE id = ?`,
          [id]
        )
        insertedRecords.push((rows as any[])[0])
      }

      return {
        data: Array.isArray(data) ? insertedRecords : insertedRecords[0],
        error: null,
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update(data: Record<string, any>): Promise<{ data: any; error: any }> {
    try {
      const pool = getPool()
      const { sql: whereSQL, params: whereParams } = this.buildWhereClause()

      if (whereParams.length === 0) {
        return { data: null, error: new Error('Update requires at least one condition') }
      }

      const columns = Object.keys(data)
      const values = Object.values(data)
      const setClause = columns.map((col) => `${col} = ?`).join(', ')

      const sql = `UPDATE ${this.table} SET ${setClause}, updated_at = NOW()${whereSQL}`
      await pool.execute(sql, [...values, ...whereParams])

      // Buscar registros atualizados
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.table}${whereSQL}`,
        whereParams
      )
      return { data: rows as any[], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async delete(): Promise<{ data: any; error: any }> {
    try {
      const pool = getPool()
      const { sql: whereSQL, params } = this.buildWhereClause()

      // Buscar registros antes de deletar
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.table}${whereSQL}`,
        params
      )

      const sql = `DELETE FROM ${this.table}${whereSQL}`
      await pool.execute(sql, params)

      return { data: rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Exportar instância padrão
export const mysql_db = createMySQLClient()
