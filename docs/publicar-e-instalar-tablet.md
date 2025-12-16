# 📱 Guia Completo: Publicar na Vercel e Instalar no Tablet

## Parte 1: Publicar na Vercel

### Opção A: Publicar direto da v0 (Mais Fácil)

1. **Na v0**, clique no botão **"Publish"** no canto superior direito
2. Selecione seu projeto Vercel ou crie um novo
3. Aguarde o deploy (leva cerca de 2-3 minutos)
4. Copie a URL do projeto (ex: `contaskleber.vercel.app`)

### Opção B: Publicar via GitHub

1. Baixe o código da v0 (botão "Download ZIP")
2. Faça upload para um repositório GitHub
3. Acesse [vercel.com](https://vercel.com)
4. Clique em "Add New Project"
5. Importe seu repositório do GitHub
6. Configure as variáveis de ambiente (veja abaixo)
7. Clique em "Deploy"

### Configurar Variáveis de Ambiente na Vercel

Vá em **Settings > Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_supabase
RESEND_API_KEY=sua_chave_resend
WHATSAPP_API_TOKEN=seu_token_apibrasil
WHATSAPP_DEVICE_TOKEN=seu_device_token_apibrasil
```

---

## Parte 2: Instalar PWA no Tablet Android

### Passo a Passo com Imagens

**1. Abra o Chrome no seu tablet Android**
   - Acesse a URL do seu app (ex: `contaskleber.vercel.app`)

**2. Aguarde o banner de instalação aparecer**
   - Um banner verde aparecerá na parte inferior da tela
   - Texto: "Instalar Financeiro Gonçalves"

**3. Clique em "Instalar Agora"**
   - O Chrome perguntará se você quer adicionar à tela inicial
   - Confirme clicando em "Adicionar" ou "Instalar"

**4. Pronto!**
   - O ícone aparecerá na tela inicial do tablet
   - Abra como qualquer outro aplicativo
   - Funciona em tela cheia, sem barra do navegador

### Se o banner não aparecer:

**Método Manual:**

1. Abra o app no Chrome
2. Toque no menu (⋮) no canto superior direito
3. Selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**
4. Confirme a instalação
5. O ícone aparecerá na tela inicial

---

## Parte 3: Testar Funcionalidade Offline

1. **Abra o app instalado** no tablet
2. Use normalmente (adicione/edite contas)
3. **Ative o modo avião** ou desconecte o Wi-Fi
4. Continue usando o app normalmente
5. Quando voltar online, os dados sincronizam automaticamente

Você verá um indicador visual:
- 🔴 "Offline" - sem internet
- 🟡 "Sincronizando..." - enviando dados
- 🟢 "Online" - tudo sincronizado

---

## Parte 4: Configurar Notificações Automáticas

### Email (Resend)

Já configurado! Vá em **Configurações** no app e:
1. Ative "Notificações por E-mail"
2. Digite seu email (use o mesmo cadastrado no Resend)
3. Clique em "Enviar E-mail de Teste"
4. Verifique se recebeu

### WhatsApp (API Brasil)

Já configurado! Vá em **Configurações** no app e:
1. Ative "Notificações por WhatsApp"
2. Adicione números no formato: 5512992207444
3. Salve as configurações

### Cron Job (Notificações Diárias)

Na Vercel, o cron job já está configurado no `vercel.json`:
- Executa **todos os dias às 9h da manhã**
- Verifica contas próximas ao vencimento (3 dias)
- Verifica contas atrasadas
- Envia notificações por email e WhatsApp

**Não precisa fazer nada!** Após o deploy, já funciona automaticamente.

---

## Parte 5: Atualizações Automáticas

Quando você fizer alterações e fizer novo deploy na Vercel:

1. O tablet detecta automaticamente a nova versão
2. Na próxima vez que abrir o app, atualiza sozinho
3. Não precisa reinstalar ou fazer nada manualmente

---

## Solução de Problemas

### "Banner de instalação não aparece"
- Certifique-se que está usando **Chrome** (não Firefox/Safari)
- Limpe o cache do navegador
- Use o método manual (menu ⋮ > Adicionar à tela inicial)

### "Modo offline não funciona"
- Certifique-se que instalou como PWA (não apenas salvou como favorito)
- Feche e abra o app novamente
- Verifique se o Service Worker está registrado

### "Notificações não chegam"
- Verifique se as variáveis de ambiente estão corretas na Vercel
- Para email: use o mesmo email cadastrado no Resend (plano gratuito)
- Para WhatsApp: verifique se o token da API Brasil está válido

### "App não atualiza"
- Feche completamente o app
- Abra novamente (detecta nova versão)
- Se persistir, desinstale e reinstale

---

## Checklist Final

✅ Publicado na Vercel  
✅ Variáveis de ambiente configuradas  
✅ App instalado no tablet  
✅ Testado offline  
✅ Notificações por email funcionando  
✅ Notificações por WhatsApp funcionando  
✅ Cron job ativo (9h da manhã)  

**Seu app está pronto para uso profissional!** 🎉
