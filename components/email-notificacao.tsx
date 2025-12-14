import type { Conta } from "@/types/conta"

interface EmailNotificacaoProps {
  contas: Conta[]
  tipo: "vencimento" | "atrasada"
}

export function EmailNotificacao({ contas, tipo }: EmailNotificacaoProps) {
  const hoje = new Date()
  const titulo = tipo === "vencimento" ? "⚠ Contas Próximas do Vencimento" : "🚨 Contas Atrasadas"
  const corTitulo = tipo === "vencimento" ? "#f59e0b" : "#ef4444"
  const corFundo = tipo === "vencimento" ? "#fef3c7" : "#fee2e2"
  const corBorda = tipo === "vencimento" ? "#f59e0b" : "#ef4444"
  const mensagem =
    tipo === "vencimento"
      ? "As seguintes contas vencem nos próximos 3 dias. Não esqueça de providenciar o pagamento!"
      : "Atenção! As seguintes contas estão atrasadas e precisam ser pagas com urgência:"

  const totalValor = contas.reduce((acc, conta) => acc + conta.valor, 0)

  return (
    <html>
      <body
        style={{
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          margin: 0,
          padding: 0,
          backgroundColor: "#f5f7fa",
        }}
      >
        <div style={{ maxWidth: "650px", margin: "0 auto", padding: "30px 20px" }}>
          {/* Header */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px 12px 0 0",
              padding: "30px",
              borderBottom: `4px solid ${corBorda}`,
            }}
          >
            <h1 style={{ color: corTitulo, margin: 0, fontSize: "28px", fontWeight: "700" }}>{titulo}</h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0 0 0" }}>
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Content */}
          <div style={{ backgroundColor: "#ffffff", padding: "30px" }}>
            <p style={{ color: "#334155", fontSize: "16px", lineHeight: "1.6", margin: "0 0 24px 0" }}>{mensagem}</p>

            {/* Alert Box */}
            <div
              style={{
                backgroundColor: corFundo,
                borderLeft: `5px solid ${corBorda}`,
                borderRadius: "6px",
                padding: "20px",
                marginBottom: "30px",
              }}
            >
              <p style={{ margin: 0, color: "#1e293b", fontWeight: "600", fontSize: "16px" }}>
                {contas.length} conta{contas.length !== 1 ? "s" : ""}{" "}
                {tipo === "vencimento" ? "vencendo em breve" : "atrasada"}
                {contas.length !== 1 ? "s" : ""}
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#475569", fontSize: "20px", fontWeight: "700" }}>
                Total: R$ {totalValor.toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: "30px" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "2px solid #e2e8f0",
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    Conta
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "2px solid #e2e8f0",
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    Categoria
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "right",
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "2px solid #e2e8f0",
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    Valor
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "right",
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "2px solid #e2e8f0",
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    Vencimento
                  </th>
                </tr>
              </thead>
              <tbody>
                {contas.map((conta, index) => {
                  const diasParaVencimento = conta.vencimento - hoje.getDate()
                  return (
                    <tr key={conta.id || index}>
                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #f1f5f9",
                          color: "#1e293b",
                          fontSize: "15px",
                          fontWeight: "500",
                        }}
                      >
                        {conta.nome}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #f1f5f9",
                          color: "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        {conta.categoria}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #f1f5f9",
                          color: "#1e293b",
                          fontSize: "16px",
                          fontWeight: "700",
                          textAlign: "right",
                        }}
                      >
                        R$ {conta.valor.toFixed(2).replace(".", ",")}
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                        <div style={{ color: "#1e293b", fontSize: "15px", fontWeight: "500" }}>
                          Dia {conta.vencimento}
                        </div>
                        {diasParaVencimento > 0 && (
                          <div style={{ color: "#f59e0b", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
                            Em {diasParaVencimento} dia{diasParaVencimento !== 1 ? "s" : ""}
                          </div>
                        )}
                        {diasParaVencimento <= 0 && (
                          <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
                            {Math.abs(diasParaVencimento)} dia{Math.abs(diasParaVencimento) !== 1 ? "s" : ""}{" "}
                            {diasParaVencimento === 0 ? "HOJE" : "atrasado"}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Call to Action */}
            <div
              style={{
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <p style={{ color: "#ffffff", fontSize: "15px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
                Acesse o sistema para gerenciar suas contas
              </p>
              <a
                href="https://seu-app.vercel.app"
                style={{
                  display: "inline-block",
                  backgroundColor: corBorda,
                  color: "#ffffff",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "15px",
                }}
              >
                Acessar Sistema
              </a>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6", margin: 0, textAlign: "center" }}>
              💡 Dica: Configure pagamento automático para evitar atrasos
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "0 0 12px 12px",
              padding: "20px 30px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: "1.6", margin: 0, textAlign: "center" }}>
              Este é um e-mail automático do sistema Contas a Pagar
              <br />
              Para alterar as configurações de notificação, acesse o painel de configurações
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
