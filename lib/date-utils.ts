export function getDataAtualBrasil(): Date {
  // Criar data no timezone de Brasília (UTC-3)
  const agora = new Date()
  const offsetBrasilia = -3 * 60 // UTC-3 em minutos
  const offsetLocal = agora.getTimezoneOffset()
  const diferencaMinutos = offsetLocal + offsetBrasilia

  const dataBrasil = new Date(agora.getTime() + diferencaMinutos * 60 * 1000)
  return dataBrasil
}

export function formatarData(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data + "T00:00:00") : data
  const dia = String(d.getDate()).padStart(2, "0")
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}
