# Sistema de Funcionamento Offline

O sistema ContasKleber agora funciona completamente offline com sincronização automática!

## Como Funciona

### 1. Armazenamento Local (IndexedDB)

Todos os seus dados são salvos localmente no navegador usando IndexedDB:
- Contas a pagar
- Transações
- Saldo
- Caixinha
- Operações pendentes (fila de sincronização)

### 2. Service Worker

Um Service Worker cacheia todos os arquivos estáticos (HTML, CSS, JS, imagens) para que o app funcione sem internet:
- Primeira vez online: Baixa e cacheia todos os arquivos
- Depois offline: Carrega tudo do cache
- Atualiza automaticamente quando há novas versões

### 3. Sincronização Automática

Quando você faz alterações offline:
1. Dados são salvos localmente no IndexedDB
2. Operação é adicionada à fila de sincronização
3. Quando voltar online, todas as operações são enviadas ao Supabase automaticamente
4. Você recebe notificação quando a sincronização termina

## Uso no Tablet

### Primeira vez (online)
1. Abra o app no tablet conectado à internet
2. Faça login normalmente
3. Os dados serão carregados e salvos localmente
4. O app estará pronto para uso offline

### Trabalhando Offline
1. Abra o app sem internet
2. Todos os seus dados estarão disponíveis
3. Adicione, edite ou exclua contas normalmente
4. Um indicador "Offline" aparecerá na tela
5. Suas alterações serão salvas localmente

### Voltando Online
1. O app detecta automaticamente quando você se conecta
2. Um indicador "Sincronizando..." aparece
3. Todas as operações pendentes são enviadas ao servidor
4. Você recebe uma notificação de "Sincronizado com sucesso"
5. Pronto! Seus dados estão atualizados na nuvem

## Indicadores Visuais

### Offline
- Badge vermelho no canto inferior direito
- Ícone de WiFi cortado
- Mostra quantas operações estão pendentes

### Sincronizando
- Badge azul no canto inferior direito
- Ícone girando
- Mostra progresso da sincronização

### Online
- Nenhum indicador (tudo funcionando normalmente)

## Funcionalidades Offline

✅ **Funcionam Offline:**
- Visualizar todas as contas
- Adicionar novas contas
- Editar contas existentes
- Excluir contas
- Marcar contas como pagas
- Visualizar transações
- Consultar saldo e caixinha

❌ **Não Funcionam Offline:**
- Enviar e-mail de notificações
- Enviar mensagens via WhatsApp API
- Adicionar crédito ao saldo
- Sincronizar com outros dispositivos em tempo real

## Requisitos

- **Navegador moderno** com suporte a:
  - Service Workers
  - IndexedDB
  - Local Storage
- **Chrome/Edge**: Totalmente suportado
- **Safari**: Suportado (iOS 11.3+)
- **Firefox**: Totalmente suportado

## Instalação como App

1. Abra o site no navegador do tablet
2. Chrome/Edge: Clique no banner "Instalar App" ou menu > "Adicionar à tela inicial"
3. Safari: Compartilhar > "Adicionar à Tela Inicial"
4. O app agora aparece como ícone na tela inicial
5. Abre em tela cheia, sem barra do navegador

## Dicas de Uso

1. **Sempre abra online primeiro**: Na primeira vez, conecte à internet para baixar todos os dados
2. **Sincronize regularmente**: Mesmo trabalhando offline, conecte periodicamente para sincronizar
3. **Cuidado com múltiplos dispositivos**: Se usar em tablet e celular, sincronize antes de alternar
4. **Não limpe dados do navegador**: Isso apagará os dados offline
5. **Mantenha espaço livre**: O IndexedDB precisa de espaço de armazenamento

## Solução de Problemas

### "Dados não sincronizam"
- Verifique se está realmente online
- Tente recarregar a página (pull down to refresh)
- Verifique se há operações pendentes no indicador

### "App não funciona offline"
- Abra online pelo menos uma vez primeiro
- Verifique se o Service Worker está registrado (Console > Application > Service Workers)
- Limpe o cache e tente novamente

### "Dados foram perdidos"
- Nunca limpe dados do navegador sem estar online
- Faça backup regularmente conectando à internet
- Os dados na nuvem (Supabase) são o backup principal

## Estrutura Técnica

\`\`\`
lib/offline/
  └── storage.ts          # Sistema IndexedDB

hooks/
  └── use-offline.ts      # Hook de sincronização

components/
  └── offline-indicator.tsx  # Indicador visual

public/
  └── sw.js               # Service Worker

app/
  └── offline/
      └── page.tsx        # Página de fallback offline
\`\`\`

## Futuras Melhorias

- Background Sync API para sincronização em segundo plano
- Notificações push quando houver atualizações
- Conflito resolution para alterações simultâneas
- Compressão de dados para economizar espaço
- Export/import de dados para backup manual
