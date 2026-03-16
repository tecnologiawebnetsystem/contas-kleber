import { createMySQLClient } from '../mysql'

// Função para criar cliente MySQL no servidor
// Compatível com a assinatura do createClient do Supabase
export async function createClient() {
  return createMySQLClient()
}

// Exportar também de forma síncrona para usos simples
export const db = createMySQLClient()
