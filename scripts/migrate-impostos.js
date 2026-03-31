import mysql from 'mysql2/promise'

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'contas_kleber',
    waitForConnections: true,
    connectionLimit: 10,
  })

  try {
    console.log('Criando tabela impostos_descontos...')
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS impostos_descontos (
        id VARCHAR(36) NOT NULL,
        nome VARCHAR(100) NOT NULL,
        tipo ENUM('imposto', 'desconto') NOT NULL,
        aplicavel_a ENUM('PJ', 'CLT', 'Ambos') NOT NULL,
        valor_padrao DECIMAL(10,2) DEFAULT 0,
        tipo_valor ENUM('percentual', 'fixo') DEFAULT 'percentual',
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `)

    // Verificar se já existem registros
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM impostos_descontos')
    if (rows[0].count === 0) {
      console.log('Inserindo impostos PJ padrão...')
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'IRPJ', 'imposto', 'PJ', 4.80, 'percentual', TRUE)`)
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'CSLL', 'imposto', 'PJ', 2.88, 'percentual', TRUE)`)
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'COFINS', 'imposto', 'PJ', 3.00, 'percentual', TRUE)`)
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'PIS', 'imposto', 'PJ', 0.65, 'percentual', TRUE)`)

      console.log('Inserindo descontos CLT padrão...')
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'INSS', 'desconto', 'CLT', 14.00, 'percentual', TRUE)`)
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'IRRF', 'desconto', 'CLT', 0.00, 'percentual', TRUE)`)
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'Plano de Saúde', 'desconto', 'CLT', 0.00, 'fixo', TRUE)`)
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'Vale Refeição/Alimentação', 'desconto', 'CLT', 0.00, 'fixo', TRUE)`)
      await pool.execute(`INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES (UUID(), 'Outros Descontos', 'desconto', 'CLT', 0.00, 'fixo', TRUE)`)
    }

    console.log('Criando tabela lancamentos_mensais...')
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lancamentos_mensais (
        id VARCHAR(36) NOT NULL,
        consultoria_id VARCHAR(36) NOT NULL,
        mes_referencia DATE NOT NULL,
        salario_bruto DECIMAL(12,2) NOT NULL,
        salario_liquido DECIMAL(12,2),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (consultoria_id) REFERENCES consultorias(id) ON DELETE CASCADE,
        UNIQUE KEY unique_consultoria_mes (consultoria_id, mes_referencia)
      )
    `)

    console.log('Criando tabela lancamento_itens...')
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lancamento_itens (
        id VARCHAR(36) NOT NULL,
        lancamento_id VARCHAR(36) NOT NULL,
        nome VARCHAR(100) NOT NULL,
        tipo ENUM('imposto', 'desconto') NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        percentual DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (lancamento_id) REFERENCES lancamentos_mensais(id) ON DELETE CASCADE
      )
    `)

    console.log('Migração concluída com sucesso!')
  } catch (error) {
    console.error('Erro na migração:', error)
  } finally {
    await pool.end()
  }
}

migrate()
