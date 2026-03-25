// Redirecionado para MySQL — sem dependência do Supabase
import { createMySQLClient } from "@/lib/mysql"

export function createClient() {
  return createMySQLClient()
}
