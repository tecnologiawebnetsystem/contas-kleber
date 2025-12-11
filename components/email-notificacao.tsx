import type { Conta } from "@/types/conta"

interface EmailNotificacaoProps {
  contas: Conta[]
  tipo: "vencimento" | "atrasada"
}

export function EmailNotificacao({ contas, tipo }: EmailNotificacaoProps) {
  const hoje = new Date()
  const titulo = tipo === "vencimento" ? "Contas Próximas do Vencimento" : "Contas Atrasadas"
  const corTitulo = tipo === "vencimento" ? "#f59e0b" : "#ef4444"
  const mensagem =
    tipo === "vencimento" ? "As seguintes contas vencem nos próximos 3 dias:" : "As seguintes contas estão atrasadas:"

  return (
    <html>
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0, padding: 0, backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "30px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h1 style={{ color: corTitulo, margin: "0 0 20px 0", fontSize: "24px" }}>{titulo}</h1>
            <p style={{ color: "#333333", fontSize: "16px", lineHeight: "1.5", marginBottom: "20px" }}>Olá!</p>
            <p style={{ color: "#333333", fontSize: "16px", lineHeight: "1.5", marginBottom: "20px" }}>{mensagem}</p>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9f9f9" }}>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e0e0e0", color: "#666" }}>
                    Conta
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e0e0e0", color: "#666" }}>
                    Valor
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e0e0e0", color: "#666" }}>
                    Vencimento
                  </th>
                </tr>
              </thead>
              <tbody>
                {contas.map((conta) => {
                  const diasParaVencimento = conta.vencimento - hoje.getDate()
                  return (
                    <tr key={conta.id}>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e0e0e0", color: "#333" }}>
                        {conta.nome}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #e0e0e0",
                          color: "#333",
                          fontWeight: "bold",
                        }}
                      >
                        R$ {conta.valor.toFixed(2)}
                      </td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e0e0e0", color: "#333" }}>
                        Dia {conta.vencimento}
                        {diasParaVencimento > 0 && (
                          <span style={{ color: "#f59e0b", fontSize: "12px", marginLeft: "8px" }}>
                            ({diasParaVencimento} dia{diasParaVencimento !== 1 ? "s" : ""})
                          </span>
                        )}
                        {diasParaVencimento < 0 && (
                          <span style={{ color: "#ef4444", fontSize: "12px", marginLeft: "8px" }}>
                            ({Math.abs(diasParaVencimento)} dia{Math.abs(diasParaVencimento) !== 1 ? "s" : ""} atrasado)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <p style={{ color: "#666666", fontSize: "14px", lineHeight: "1.5", marginTop: "30px" }}>
              Não esqueça de realizar o pagamento dentro do prazo.
            </p>

            <p
              style={{
                color: "#999999",
                fontSize: "12px",
                lineHeight: "1.5",
                marginTop: "30px",
                borderTop: "1px solid #e0e0e0",
                paddingTop: "20px",
              }}
            >
              Este é um e-mail automático do sistema Contas a Pagar.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
