import { createMySQLClient } from '../mysql'

// Função para criar cliente MySQL no cliente (browser)
// Nota: MySQL não roda no browser, mas mantemos para compatibilidade
// As chamadas devem ser feitas via API routes
export function createClient() {
  return createMySQLClient()
}
