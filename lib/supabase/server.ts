// Redirecionado para MySQL — sem dependência do Supabase
import { createMySQLClient } from "@/lib/mysql"

export async function createClient() {
  return createMySQLClient()
}
