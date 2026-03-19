import { NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql'

export async function GET() {
  try {
    const pool = getPool()
    
    // Testa a conexão com uma query simples
    const [rows] = await pool.execute('SELECT 1 as connected, NOW() as server_time')
    
    // Lista as tabelas do banco
    const [tables] = await pool.execute('SHOW TABLES')
    
    return NextResponse.json({
      success: true,
      message: 'Conexão com o banco de dados estabelecida com sucesso!',
      connection: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
      },
      serverTime: (rows as any[])[0]?.server_time,
      tables: (tables as any[]).map((t: any) => Object.values(t)[0]),
    })
  } catch (error: any) {
    console.error('Erro ao conectar com o banco:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao conectar com o banco de dados',
      error: error.message,
      code: error.code,
      connection: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
      },
    }, { status: 500 })
  }
}
