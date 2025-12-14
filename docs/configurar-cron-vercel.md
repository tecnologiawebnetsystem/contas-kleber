# Como Configurar Notificações Automáticas na Vercel

Este guia explica como configurar o cron job (tarefa agendada) na Vercel para enviar notificações automáticas de contas próximas ao vencimento e contas atrasadas.

## O que é Cron Job?

Um cron job é uma tarefa agendada que executa automaticamente em intervalos específicos. No nosso caso, vamos configurar para verificar as contas e enviar e-mails todos os dias.

## Passo a Passo

### 1. Criar arquivo vercel.json

Na raiz do projeto, crie ou edite o arquivo `vercel.json` com o seguinte conteúdo:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/verificar-contas",
      "schedule": "0 9 * * *"
    }
  ]
}
\`\`\`

### 2. Entender a configuração do schedule

O formato é: `minuto hora dia mês dia-da-semana`

**Exemplos de configuração:**

- `"0 9 * * *"` - Todos os dias às 9h da manhã
- `"0 9,18 * * *"` - Todos os dias às 9h e 18h
- `"0 9 * * 1-5"` - Segunda a sexta às 9h
- `"30 8 * * *"` - Todos os dias às 8h30

**Recomendação:** Use `"0 9 * * *"` para enviar notificações todos os dias às 9h da manhã.

### 3. Deploy na Vercel

Após criar o arquivo `vercel.json`, faça o deploy do projeto:

\`\`\`bash
git add vercel.json
git commit -m "Adiciona cron job para notificações"
git push
\`\`\`

Ou use o Vercel CLI:

\`\`\`bash
vercel --prod
\`\`\`

### 4. Verificar se o cron está ativo

1. Acesse o dashboard da Vercel
2. Selecione seu projeto
3. Vá em **Settings** → **Crons**
4. Você verá o cron job configurado e seu status

### 5. Configurar variáveis de ambiente

Certifique-se de que a variável `RESEND_API_KEY` está configurada:

1. No dashboard da Vercel, vá em **Settings** → **Environment Variables**
2. Adicione `RESEND_API_KEY` com sua chave da API do Resend
3. Marque para todos os ambientes (Production, Preview, Development)

### 6. Testar manualmente

Você pode testar o endpoint manualmente antes do cron executar:

\`\`\`bash
curl -X POST https://seu-app.vercel.app/api/verificar-contas \
  -H "Content-Type: application/json"
\`\`\`

Ou use o botão "Enviar E-mail de Teste" na página de Configurações do sistema.

## Importante

- **Plano gratuito da Vercel:** Cron jobs funcionam no plano gratuito, mas há limites de execução
- **Plano gratuito do Resend:** No modo gratuito, e-mails só podem ser enviados para o e-mail cadastrado na conta
- **Verificar domínio:** Para enviar e-mails para qualquer destinatário, verifique um domínio em [resend.com/domains](https://resend.com/domains)

## Monitoramento

Para ver os logs de execução do cron:

1. Vá no dashboard da Vercel
2. Selecione seu projeto
3. Vá em **Deployments** → clique no deployment mais recente
4. Clique em **Functions** → selecione `api/verificar-contas`
5. Veja os logs de execução

## Troubleshooting

### Cron não está executando

- Verifique se o arquivo `vercel.json` está na raiz do projeto
- Confirme que o deploy foi feito com sucesso
- Aguarde alguns minutos após o deploy

### E-mails não estão sendo enviados

- Verifique se `RESEND_API_KEY` está configurada
- Confirme que as notificações estão ativadas em Configurações
- Verifique se o e-mail de destino é o mesmo cadastrado no Resend (plano gratuito)
- Veja os logs para identificar erros específicos
