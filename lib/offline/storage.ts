// Sistema de armazenamento local com IndexedDB para funcionar offline

interface OfflineOperation {
  id: string
  type: "insert" | "update" | "delete"
  table: string
  data: any
  timestamp: number
}

class OfflineStorage {
  private dbName = "ContasKleberDB"
  private version = 2
  private db: IDBDatabase | null = null

  async init() {
    if (typeof window === "undefined") return

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store para contas
        if (!db.objectStoreNames.contains("contas")) {
          const contasStore = db.createObjectStore("contas", { keyPath: "id" })
          contasStore.createIndex("data_gasto", "data_gasto", { unique: false })
        }

        // Store para transações
        if (!db.objectStoreNames.contains("transacoes")) {
          const transacoesStore = db.createObjectStore("transacoes", { keyPath: "id" })
          transacoesStore.createIndex("created_at", "created_at", { unique: false })
        }

        // Store para saldo
        if (!db.objectStoreNames.contains("saldo")) {
          db.createObjectStore("saldo", { keyPath: "id" })
        }

        // Store para caixinha
        if (!db.objectStoreNames.contains("caixinha")) {
          db.createObjectStore("caixinha", { keyPath: "id" })
        }

        // Store para operações pendentes (fila de sincronização)
        if (!db.objectStoreNames.contains("pending_operations")) {
          const pendingStore = db.createObjectStore("pending_operations", {
            keyPath: "id",
            autoIncrement: true,
          })
          pendingStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Store para pagamentos do carro
        if (!db.objectStoreNames.contains("pagamentos_carro")) {
          const carroStore = db.createObjectStore("pagamentos_carro", { keyPath: "id" })
          carroStore.createIndex("data_pagamento", "data_pagamento", { unique: false })
        }
      }
    })
  }

  // Salvar contas localmente
  async saveContas(contas: any[]) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["contas"], "readwrite")
    const store = transaction.objectStore("contas")

    // Limpar dados antigos
    await store.clear()

    // Adicionar novos
    for (const conta of contas) {
      await store.put(conta)
    }
  }

  // Buscar contas localmente
  async getContas(): Promise<any[]> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["contas"], "readonly")
    const store = transaction.objectStore("contas")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Salvar transações localmente
  async saveTransacoes(transacoes: any[]) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["transacoes"], "readwrite")
    const store = transaction.objectStore("transacoes")

    await store.clear()
    for (const transacao of transacoes) {
      await store.put(transacao)
    }
  }

  // Buscar transações localmente
  async getTransacoes(): Promise<any[]> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["transacoes"], "readonly")
    const store = transaction.objectStore("transacoes")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Salvar saldo localmente
  async saveSaldo(saldo: number) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["saldo"], "readwrite")
    const store = transaction.objectStore("saldo")
    await store.put({ id: "current", valor: saldo })
  }

  // Buscar saldo localmente
  async getSaldo(): Promise<number> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["saldo"], "readonly")
    const store = transaction.objectStore("saldo")

    return new Promise((resolve, reject) => {
      const request = store.get("current")
      request.onsuccess = () => resolve(request.result?.valor || 0)
      request.onerror = () => reject(request.error)
    })
  }

  // Salvar caixinha localmente
  async saveCaixinha(caixinha: any) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["caixinha"], "readwrite")
    const store = transaction.objectStore("caixinha")
    await store.put({ id: "current", ...caixinha })
  }

  // Buscar caixinha localmente
  async getCaixinha(): Promise<any | null> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["caixinha"], "readonly")
    const store = transaction.objectStore("caixinha")

    return new Promise((resolve, reject) => {
      const request = store.get("current")
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          const { id, ...caixinha } = result
          resolve(caixinha)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Adicionar operação pendente
  async addPendingOperation(operation: Omit<OfflineOperation, "id" | "timestamp">) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pending_operations"], "readwrite")
    const store = transaction.objectStore("pending_operations")

    const pendingOp: Omit<OfflineOperation, "id"> = {
      ...operation,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const request = store.add(pendingOp)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Buscar operações pendentes
  async getPendingOperations(): Promise<OfflineOperation[]> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pending_operations"], "readonly")
    const store = transaction.objectStore("pending_operations")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Remover operação pendente
  async removePendingOperation(id: string) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pending_operations"], "readwrite")
    const store = transaction.objectStore("pending_operations")
    await store.delete(id)
  }

  // Limpar todas as operações pendentes
  async clearPendingOperations() {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pending_operations"], "readwrite")
    const store = transaction.objectStore("pending_operations")
    await store.clear()
  }

  // Salvar pagamentos do carro localmente
  async savePagamentosCarro(pagamentos: any[]) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pagamentos_carro"], "readwrite")
    const store = transaction.objectStore("pagamentos_carro")

    await store.clear()
    for (const pagamento of pagamentos) {
      await store.put(pagamento)
    }
  }

  // Buscar pagamentos do carro localmente
  async getPagamentosCarro(): Promise<any[]> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pagamentos_carro"], "readonly")
    const store = transaction.objectStore("pagamentos_carro")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Adicionar pagamento do carro localmente (para uso offline)
  async addPagamentoCarro(pagamento: any) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pagamentos_carro"], "readwrite")
    const store = transaction.objectStore("pagamentos_carro")

    return new Promise((resolve, reject) => {
      const request = store.add(pagamento)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Remover pagamento do carro localmente
  async removePagamentoCarro(id: string) {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction(["pagamentos_carro"], "readwrite")
    const store = transaction.objectStore("pagamentos_carro")
    await store.delete(id)
  }
}

export const offlineStorage = new OfflineStorage()
