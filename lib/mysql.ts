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

type Operation = 'select' | 'insert' | 'update' | 'delete'

class QueryBuilder {
  private table: string
  private selectColumns: string = '*'
  private whereConditions: { column: string; operator: string; value: any }[] = []
  private orderByColumns: { column: string; ascending: boolean }[] = []
  private limitValue: number | null = null
  private offsetValue: number | null = null
  private operation: Operation = 'select'
  private updateData: Record<string, any> | null = null
  private insertData: Record<string, any> | Record<string, any>[] | null = null

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*') {
    // Só muda a operação para 'select' se ainda não foi definida outra operação
    // (ex: .insert({...}).select() não deve sobrescrever a operação de insert)
    if (this.operation === 'select') {
      this.selectColumns = columns
    }
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

  private async executeSelect(): Promise<{ data: any[] | null; error: any }> {
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

  private async executeInsert(): Promise<{ data: any; error: any }> {
    try {
      const pool = getPool()
      const records = Array.isArray(this.insertData) ? this.insertData : [this.insertData!]
      const insertedRecords: any[] = []

      for (const record of records) {
        // Remove campos gerados automaticamente pelo banco
        const { created_at, updated_at, ...cleanRecord } = record
        const id = cleanRecord.id || crypto.randomUUID()
        const dataWithId = { id, ...cleanRecord }
        const columns = Object.keys(dataWithId)
        const values = Object.values(dataWithId)
        const placeholders = columns.map(() => '?').join(', ')
        const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`
        await pool.execute(sql, values)
        const [rows] = await pool.execute(`SELECT * FROM ${this.table} WHERE id = ?`, [id])
        insertedRecords.push((rows as any[])[0])
      }

      return {
        data: Array.isArray(this.insertData) ? insertedRecords : insertedRecords[0],
        error: null,
      }
    } catch (error: any) {
      console.log('[v0] executeInsert ERROR table:', this.table, 'msg:', error?.message)
      return { data: null, error }
    }
  }

  private async executeUpdate(): Promise<{ data: any; error: any }> {
    try {
      const pool = getPool()
      const { sql: whereSQL, params: whereParams } = this.buildWhereClause()
      if (whereParams.length === 0) {
        return { data: null, error: new Error('Update requires at least one condition') }
      }
      const rawData = this.updateData!
      // Remove updated_at do objeto — é adicionado automaticamente pelo SQL
      const { updated_at, ...data } = rawData
      const columns = Object.keys(data)
      const values = Object.values(data)
      const setClause = columns.map((col) => `${col} = ?`).join(', ')
      const sql = `UPDATE ${this.table} SET ${setClause}, updated_at = NOW()${whereSQL}`
      await pool.execute(sql, [...values, ...whereParams])
      const [rows] = await pool.execute(`SELECT * FROM ${this.table}${whereSQL}`, whereParams)
      return { data: (rows as any[])[0] ?? null, error: null }
    } catch (error: any) {
      console.error('[v0] executeUpdate ERROR table:', this.table, 'msg:', error?.message)
      return { data: null, error }
    }
  }

  private async executeDelete(): Promise<{ data: any; error: any }> {
    try {
      const pool = getPool()
      const { sql: whereSQL, params } = this.buildWhereClause()
      const [rows] = await pool.execute(`SELECT * FROM ${this.table}${whereSQL}`, params)
      await pool.execute(`DELETE FROM ${this.table}${whereSQL}`, params)
      return { data: rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  private async executeOperation(): Promise<{ data: any; error: any }> {
    switch (this.operation) {
      case 'insert': return this.executeInsert()
      case 'update': return this.executeUpdate()
      case 'delete': return this.executeDelete()
      default: return this.executeSelect()
    }
  }

  // Compatibilidade com Supabase: permite await diretamente no QueryBuilder
  then(
    resolve: (value: { data: any; error: any }) => void,
    reject?: (reason?: any) => void
  ) {
    return this.executeOperation().then(resolve, reject)
  }

  async single(): Promise<{ data: any | null; error: any }> {
    // Para operações de insert/update/delete, executa a operação e retorna o primeiro item
    // Para select, limita a 1 resultado
    if (this.operation === 'select') {
      this.limitValue = 1
    }
    const result = await this.executeOperation()
    const data = Array.isArray(result.data) ? (result.data[0] ?? null) : (result.data ?? null)
    return { data, error: result.error }
  }

  // insert() é síncrono — agenda a operação e retorna this para encadeamento
  insert(data: Record<string, any> | Record<string, any>[]) {
    this.operation = 'insert'
    this.insertData = data
    return this
  }

  // update() é síncrono — agenda a operação e retorna this para encadeamento
  update(data: Record<string, any>) {
    this.operation = 'update'
    this.updateData = data
    return this
  }

  // delete() é síncrono — agenda a operação e retorna this para encadeamento
  delete() {
    this.operation = 'delete'
    return this
  }
}

// Exportar instância padrão
export const mysql_db = createMySQLClient()
