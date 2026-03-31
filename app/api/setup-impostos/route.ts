import { getPool } from "@/lib/mysql"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const pool = getPool()

    // Criar tabela de tipos de impostos e descontos
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS impostos_descontos (
        id VARCHAR(36) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        tipo_aplicacao ENUM('PJ', 'CLT', 'AMBOS') NOT NULL DEFAULT 'AMBOS',
        tipo_calculo ENUM('PERCENTUAL', 'VALOR_FIXO') NOT NULL DEFAULT 'PERCENTUAL',
        valor_padrao DECIMAL(10, 4) NOT NULL DEFAULT 0,
        descricao VARCHAR(255),
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de lançamentos mensais
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lancamentos_mensais (
        id VARCHAR(36) PRIMARY KEY,
        consultoria_id VARCHAR(36) NOT NULL,
        mes_referencia DATE NOT NULL,
        valor_bruto DECIMAL(12, 2) NOT NULL,
        valor_liquido DECIMAL(12, 2) NOT NULL,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (consultoria_id) REFERENCES consultorias(id) ON DELETE CASCADE,
        UNIQUE KEY uk_consultoria_mes (consultoria_id, mes_referencia)
      )
    `)

    // Criar tabela de itens do lançamento
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lancamento_itens (
        id VARCHAR(36) PRIMARY KEY,
        lancamento_id VARCHAR(36) NOT NULL,
        imposto_desconto_id VARCHAR(36) NOT NULL,
        tipo_calculo ENUM('PERCENTUAL', 'VALOR_FIXO') NOT NULL,
        valor_base DECIMAL(12, 2) NOT NULL,
        percentual DECIMAL(10, 4),
        valor_calculado DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lancamento_id) REFERENCES lancamentos_mensais(id) ON DELETE CASCADE,
        FOREIGN KEY (imposto_desconto_id) REFERENCES impostos_descontos(id) ON DELETE RESTRICT
      )
    `)

    // Verificar se já existem registros padrão
    const [existingRows] = await pool.execute("SELECT COUNT(*) as count FROM impostos_descontos")
    const count = (existingRows as any[])[0]?.count || 0

    if (count === 0) {
      // Inserir impostos padrão PJ
      await pool.execute(`
        INSERT INTO impostos_descontos (id, nome, tipo_aplicacao, tipo_calculo, valor_padrao, descricao) VALUES
          (UUID(), 'IRPJ', 'PJ', 'PERCENTUAL', 4.8000, 'Imposto de Renda Pessoa Jurídica'),
          (UUID(), 'CSLL', 'PJ', 'PERCENTUAL', 2.8800, 'Contribuição Social sobre o Lucro Líquido'),
          (UUID(), 'COFINS', 'PJ', 'PERCENTUAL', 3.0000, 'Contribuição para o Financiamento da Seguridade Social'),
          (UUID(), 'PIS', 'PJ', 'PERCENTUAL', 0.6500, 'Programa de Integração Social')
      `)

      // Inserir descontos padrão CLT
      await pool.execute(`
        INSERT INTO impostos_descontos (id, nome, tipo_aplicacao, tipo_calculo, valor_padrao, descricao) VALUES
          (UUID(), 'INSS', 'CLT', 'PERCENTUAL', 14.0000, 'Contribuição Previdenciária'),
          (UUID(), 'IRRF', 'CLT', 'PERCENTUAL', 0.0000, 'Imposto de Renda Retido na Fonte'),
          (UUID(), 'Plano de Saúde', 'CLT', 'VALOR_FIXO', 0.0000, 'Desconto do convênio médico'),
          (UUID(), 'Vale Refeição', 'CLT', 'VALOR_FIXO', 0.0000, 'Desconto do Vale Refeição/Alimentação')
      `)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Tabelas criadas com sucesso",
      registrosPadrao: count === 0 ? "Inseridos" : "Já existiam"
    })
  } catch (error: any) {
    console.error("[v0] Erro ao criar tabelas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
