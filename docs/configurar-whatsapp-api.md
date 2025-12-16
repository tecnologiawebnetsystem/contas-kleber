# Configurar API WhatsApp (APIBrasil)

Este guia explica como configurar a integração com a API WhatsApp da APIBrasil para enviar mensagens diretamente do sistema.

## Pré-requisitos

Você precisa ter uma conta ativa na APIBrasil: https://apibrasil.io/

## Passo 1: Obter as Credenciais

1. Acesse o painel da APIBrasil: https://gateway.apibrasil.io/
2. Faça login com sua conta
3. Anote o **Token de Autorização** (JWT Token)
4. Anote o **Device Token** do seu dispositivo WhatsApp conectado

## Passo 2: Adicionar Variáveis de Ambiente na Vercel

1. Acesse seu projeto na Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
WHATSAPP_API_TOKEN=seu_token_jwt_aqui
WHATSAPP_DEVICE_TOKEN=seu_device_token_aqui
```

4. Clique em **Save**

## Passo 3: Fazer Novo Deploy

Após adicionar as variáveis de ambiente, faça um novo deploy do projeto para que as alterações tenham efeito.

## Como Usar

1. Na página principal, ao lado de cada conta **paga**, você verá um botão verde de compartilhar
2. Clique no botão para abrir o modal de envio
3. Digite o número do WhatsApp (apenas DDD + número, sem o +55)
4. A mensagem já vem pré-preenchida com as informações da conta
5. Clique em **Enviar WhatsApp**

## Formato do Número

- ✅ Correto: `(31) 99435-9434` ou `31994359434`
- ❌ Errado: `+55 31 99435-9434` ou `5531994359434`

O sistema adiciona automaticamente o código do Brasil (+55).

## Limitações

- Você só pode enviar mensagens para números que já iniciaram conversa com seu WhatsApp Business
- O dispositivo WhatsApp deve estar conectado e online
- Consulte os limites do seu plano na APIBrasil

## Troubleshooting

Se aparecer erro ao enviar:
1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Confirme que o Device Token está ativo no painel da APIBrasil
3. Verifique se o número de destino está no formato correto
4. Consulte os logs no painel da Vercel em **Deployments** → **Functions**
