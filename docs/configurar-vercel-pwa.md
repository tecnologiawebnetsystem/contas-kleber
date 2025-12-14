# Configurar PWA na Vercel

## Arquivos Necessários

Todos os arquivos já foram criados automaticamente:
- ✅ `public/manifest.json` - Configuração do PWA
- ✅ `app/layout.tsx` - Metadados e viewport
- ✅ `app/install-prompt.tsx` - Banner de instalação
- ✅ `public/icon-192.png` e `icon-512.png` - Ícones do app
- ✅ `vercel.json` - Configuração de cron job para notificações

## Deploy na Vercel

### 1. Publicar o Projeto
\`\`\`bash
# No terminal da v0, clique em "Publish" ou
# Use o botão "Deploy to Vercel" na interface
\`\`\`

### 2. Variáveis de Ambiente
Adicione estas variáveis no painel da Vercel:

**WhatsApp API (APIBrasil)**
- `WHATSAPP_API_TOKEN` - Token de autenticação
- `WHATSAPP_DEVICE_TOKEN` - Token do dispositivo

**Resend (E-mail)**
- `RESEND_API_KEY` - Chave da API Resend

**Supabase (Banco de Dados)**
- Já configuradas automaticamente pela integração

### 3. Ativar Cron Job (Notificações Automáticas)
O arquivo `vercel.json` já configura o cron job para rodar diariamente às 9h:

\`\`\`json
{
  "crons": [{
    "path": "/api/verificar-contas",
    "schedule": "0 9 * * *"
  }]
}
\`\`\`

**Importante:** Cron jobs só funcionam em planos **Pro** da Vercel. Se você tem o plano gratuito, as notificações precisarão ser enviadas manualmente pela página de configurações.

### 4. Configurar Domínio (Opcional)
- Adicione um domínio personalizado no painel da Vercel
- PWAs funcionam melhor com domínios próprios
- Exemplo: `contaskleber.com.br`

## Testando o PWA

### No Desktop (Chrome/Edge)
1. Abra DevTools (F12)
2. Vá em "Application" > "Manifest"
3. Verifique se todas as informações estão corretas
4. Clique em "Service Workers" para testar offline

### No Tablet Android
1. Acesse a URL do app no Chrome
2. Aguarde o banner de instalação aparecer
3. Clique em "Instalar Agora"
4. Teste o app instalado

### Teste Offline
1. Abra o app
2. Ative o modo avião no tablet
3. O app deve continuar funcionando
4. Dados são sincronizados quando a internet voltar

## Recursos do PWA

### Já Implementados
✅ Instalável na tela inicial do tablet
✅ Funciona offline (cache automático)
✅ Ícones e splash screens personalizados
✅ Banner de instalação elegante
✅ Otimizado para tablets Android
✅ Suporte a orientação portrait e landscape
✅ Tema claro e escuro
✅ Notificações por e-mail
✅ Envio de mensagens por WhatsApp

### Funcionalidades Principais
- Gerenciamento de contas (fixas e parceladas)
- Caixinha de economia com meta
- Crédito disponível
- Histórico de transações
- Compartilhamento via WhatsApp
- Notificações de vencimento (e-mail)
- Consulta de histórico
- Configurações personalizadas

## Monitoramento

### Vercel Analytics
O app já inclui Vercel Analytics para monitorar:
- Número de instalações
- Tempo de carregamento
- Erros em produção
- Uso por dispositivo

### Logs de Erro
Verifique erros no painel da Vercel:
1. Acesse o projeto na Vercel
2. Vá em "Logs" no menu lateral
3. Filtre por erros de API

## Suporte e Manutenção

### Atualizações
- Faça push no GitHub ou republique na Vercel
- O PWA atualiza automaticamente em 24h
- Usuários verão um banner de "Nova versão disponível"

### Backup
- Todos os dados estão no Supabase
- Configure backups automáticos no painel do Supabase
- Exporte dados regularmente via API

### Performance
- Next.js otimiza automaticamente o código
- Imagens são otimizadas
- Cache inteligente reduz tempo de carregamento

## Próximos Passos

1. ✅ Testar instalação no tablet
2. ✅ Configurar e-mail de notificações
3. ✅ Testar envio de WhatsApp
4. ✅ Adicionar variáveis de ambiente na Vercel
5. ✅ Fazer primeiro deploy
6. ✅ Instalar no tablet de teste
7. ✅ Treinar usuários finais

## Dicas Importantes

### Para Melhor Performance
- Use WiFi para primeira instalação (download dos assets)
- Abra o app online uma vez antes de usar offline
- Limpe o cache se houver problemas

### Para Usuários Finais
- Mostre como instalar (é simples!)
- Explique que funciona offline
- Ensine a atualizar quando solicitado

### Troubleshooting
**App não instala?**
- Verifique se está usando HTTPS
- Use Chrome ou Edge no Android
- Limpe o cache do navegador

**Banner não aparece?**
- Pode ter sido fechado antes
- Limpe localStorage: `localStorage.removeItem('installPromptClosed')`
- Recarregue a página

**Não funciona offline?**
- Aguarde alguns minutos após primeira visita
- Service worker precisa fazer cache
- Verifique conexão inicial
