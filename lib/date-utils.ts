export function getDataAtualBrasil(): Date {
  // Criar data no timezone de Brasília (UTC-3)
  const agora = new Date()
  const offsetBrasilia = -3 * 60 // UTC-3 em minutos
  const offsetLocal = agora.getTimezoneOffset()
  const diferencaMinutos = offsetLocal + offsetBrasilia

  const dataBrasil = new Date(agora.getTime() + diferencaMinutos * 60 * 1000)
  return dataBrasil
}

/**
 * Parseia uma string de data com segurança, evitando deslocamento de fuso horário.
 * Aceita tanto "YYYY-MM-DD" quanto ISO timestamps completos.
 */
export function parseDate(data: string | Date | null | undefined): Date | null {
  if (!data) return null
  if (data instanceof Date) return isNaN(data.getTime()) ? null : data
  const d = data.includes("T") ? new Date(data) : new Date(data + "T00:00:00")
  return isNaN(d.getTime()) ? null : d
}

export function formatarData(data: Date | string): string {
  if (!data) return "—"
  let d: Date
  if (typeof data === "string") {
    // Se já tem hora (ISO timestamp), parseia direto; senão adiciona T00:00:00 para evitar deslocamento de fuso
    d = data.includes("T") ? new Date(data) : new Date(data + "T00:00:00")
  } else {
    d = data
  }
  if (isNaN(d.getTime())) return "—"
  const dia = String(d.getDate()).padStart(2, "0")
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}
