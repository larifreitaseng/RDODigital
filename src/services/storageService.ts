import { Obra, Colaborador, Equipamento, RelatorioDiarioObra, UsuarioEquipe } from '../types';
import { INITIAL_OBRAS, INITIAL_COLABORADORES, INITIAL_EQUIPAMENTOS, INITIAL_RDOS, INITIAL_USUARIOS } from '../data/initialData';

const KEYS = {
  OBRAS: 'rdo_obras_v1',
  COLABORADORES: 'rdo_colaboradores_v1',
  EQUIPAMENTOS: 'rdo_equipamentos_v1',
  RDOS: 'rdo_relatorios_v1',
  USUARIOS: 'rdo_usuarios_v1',
  CURRENT_USER: 'rdo_current_user_v1'
};

// In-memory cache to guarantee instantaneous retrieval
let memoryRdosCache: RelatorioDiarioObra[] | null = null;
let isIndexedDbInitialized = false;

// Native IndexedDB Helper for permanent local storage without quota limits
const DB_NAME = 'RdoEngenhariaDB';
const DB_VERSION = 1;
const STORE_RDOS = 'rdos';
const STORE_OBRAS = 'obras';

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_RDOS)) {
          db.createObjectStore(STORE_RDOS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_OBRAS)) {
          db.createObjectStore(STORE_OBRAS, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB unavailable, using localStorage fallback');
        resolve(null);
      };
    } catch (e) {
      console.warn('Erro ao abrir IndexedDB:', e);
      resolve(null);
    }
  });
}

async function saveToIndexedDb<T extends { id: string }>(storeName: string, item: T): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function loadAllFromIndexedDb<T>(storeName: string): Promise<T[]> {
  const db = await openIndexedDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function deleteFromIndexedDb(storeName: string, id: string): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error(`Erro ao carregar chave ${key}:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Aviso de quota ao salvar chave ${key} no localStorage:`, err);
    // If quota exceeded, try trimming old/secondary items while keeping memory cache intact
  }
}

export const StorageService = {
  /**
   * Initializes IndexedDB background sync on app launch
   */
  async initAsyncStorage(onLoaded?: (rdos: RelatorioDiarioObra[]) => void): Promise<RelatorioDiarioObra[]> {
    if (isIndexedDbInitialized && memoryRdosCache) {
      return memoryRdosCache;
    }
    try {
      const dbRdos = await loadAllFromIndexedDb<RelatorioDiarioObra>(STORE_RDOS);
      const localRdos = getStored<RelatorioDiarioObra[]>(KEYS.RDOS, INITIAL_RDOS);
      
      // Merge IndexedDB and LocalStorage, taking newest version of each
      const mergedMap = new Map<string, RelatorioDiarioObra>();
      for (const r of localRdos) mergedMap.set(r.id, r);
      for (const r of dbRdos) {
        const existing = mergedMap.get(r.id);
        if (!existing || (r.updatedAt && (!existing.updatedAt || r.updatedAt >= existing.updatedAt))) {
          mergedMap.set(r.id, r);
        }
      }

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => (b.numero || 0) - (a.numero || 0));
      memoryRdosCache = mergedList;
      isIndexedDbInitialized = true;

      // Ensure localStorage has updated copy
      setStored(KEYS.RDOS, mergedList);

      if (onLoaded) {
        onLoaded(mergedList);
      }
      return mergedList;
    } catch (e) {
      console.warn('Erro ao inicializar IndexedDB:', e);
      return this.getRdos();
    }
  },

  // OBRAS
  getObras(): Obra[] {
    return getStored<Obra[]>(KEYS.OBRAS, INITIAL_OBRAS);
  },
  saveObra(obra: Obra): void {
    const obras = this.getObras();
    const index = obras.findIndex(o => o.id === obra.id);
    if (index >= 0) {
      obras[index] = obra;
    } else {
      obras.unshift(obra);
    }
    setStored(KEYS.OBRAS, obras);
    saveToIndexedDb(STORE_OBRAS, obra).catch(() => {});
  },
  deleteObra(id: string): void {
    const obras = this.getObras().filter(o => o.id !== id);
    setStored(KEYS.OBRAS, obras);
    deleteFromIndexedDb(STORE_OBRAS, id).catch(() => {});
    // Also delete associated RDOs
    const rdos = this.getRdos().filter(r => r.obraId !== id);
    this.setRdosLocal(rdos);
  },

  // COLABORADORES
  getColaboradores(): Colaborador[] {
    return getStored<Colaborador[]>(KEYS.COLABORADORES, INITIAL_COLABORADORES);
  },
  saveColaborador(colaborador: Colaborador): void {
    const list = this.getColaboradores();
    const idx = list.findIndex(c => c.id === colaborador.id);
    if (idx >= 0) {
      list[idx] = colaborador;
    } else {
      list.push(colaborador);
    }
    setStored(KEYS.COLABORADORES, list);
  },
  deleteColaborador(id: string): void {
    const list = this.getColaboradores().filter(c => c.id !== id);
    setStored(KEYS.COLABORADORES, list);
  },

  // EQUIPAMENTOS
  getEquipamentos(): Equipamento[] {
    return getStored<Equipamento[]>(KEYS.EQUIPAMENTOS, INITIAL_EQUIPAMENTOS);
  },
  saveEquipamento(equipamento: Equipamento): void {
    const list = this.getEquipamentos();
    const idx = list.findIndex(e => e.id === equipamento.id);
    if (idx >= 0) {
      list[idx] = equipamento;
    } else {
      list.push(equipamento);
    }
    setStored(KEYS.EQUIPAMENTOS, list);
  },
  deleteEquipamento(id: string): void {
    const list = this.getEquipamentos().filter(e => e.id !== id);
    setStored(KEYS.EQUIPAMENTOS, list);
  },

  // RELATÓRIOS DIÁRIOS DE OBRA (RDO)
  getRdos(): RelatorioDiarioObra[] {
    if (memoryRdosCache && memoryRdosCache.length > 0) {
      return memoryRdosCache;
    }
    const list = getStored<RelatorioDiarioObra[]>(KEYS.RDOS, INITIAL_RDOS);
    memoryRdosCache = list;
    return list;
  },
  getRdosByObra(obraId: string): RelatorioDiarioObra[] {
    return this.getRdos().filter(r => r.obraId === obraId);
  },
  saveRdo(rdo: RelatorioDiarioObra): void {
    const list = [...this.getRdos()];
    const nowIso = new Date().toISOString();
    const rdoWithTimestamps: RelatorioDiarioObra = {
      ...rdo,
      createdAt: rdo.createdAt || nowIso,
      updatedAt: nowIso
    };

    const idx = list.findIndex(r => r.id === rdo.id);
    if (idx >= 0) {
      list[idx] = rdoWithTimestamps;
    } else {
      list.unshift(rdoWithTimestamps);
    }

    // 1. Update memory cache immediately
    memoryRdosCache = list;

    // 2. Persist to localStorage
    setStored(KEYS.RDOS, list);

    // 3. Persist to IndexedDB asynchronously (guarantees persistence even if photos are large)
    saveToIndexedDb(STORE_RDOS, rdoWithTimestamps).catch(e => console.warn('Erro ao salvar RDO no IndexedDB:', e));
  },
  deleteRdo(id: string): void {
    const list = this.getRdos().filter(r => r.id !== id);
    memoryRdosCache = list;
    setStored(KEYS.RDOS, list);
    deleteFromIndexedDb(STORE_RDOS, id).catch(() => {});
  },
  getNextNumeroRdo(obraId: string): number {
    const rdos = this.getRdosByObra(obraId);
    if (rdos.length === 0) return 1;
    const maxNum = Math.max(...rdos.map(r => r.numero || 0));
    return maxNum + 1;
  },

  // USUÁRIOS E CONTROLE DE ACESSOS (LOGINS DA EQUIPE)
  isLoggedOut(): boolean {
    try {
      return localStorage.getItem('rdo_logged_out_flag') === 'true';
    } catch {
      return false;
    }
  },
  setLoggedOut(loggedOut: boolean): void {
    try {
      if (loggedOut) {
        localStorage.setItem('rdo_logged_out_flag', 'true');
        localStorage.removeItem(KEYS.CURRENT_USER);
      } else {
        localStorage.removeItem('rdo_logged_out_flag');
      }
    } catch (e) {
      console.warn('Erro ao atualizar flag de logout:', e);
    }
  },
  getUsuarios(): UsuarioEquipe[] {
    const list = getStored<UsuarioEquipe[]>(KEYS.USUARIOS, INITIAL_USUARIOS);
    let hasChanges = false;
    const sanitized = list.map(u => {
      // Ensure passwords are never stored as literal bullets '••••••••'
      if (!u.senha || u.senha === '••••••••') {
        hasChanges = true;
        return { ...u, senha: '123456' };
      }
      return u;
    });

    if (hasChanges) {
      setStored(KEYS.USUARIOS, sanitized);
    }
    return sanitized;
  },
  saveUsuario(usuario: UsuarioEquipe): void {
    const list = this.getUsuarios();
    const idx = list.findIndex(u => u.id === usuario.id);
    if (idx >= 0) {
      list[idx] = usuario;
    } else {
      list.unshift(usuario);
    }
    setStored(KEYS.USUARIOS, list);

    // Se estiver atualizando o usuário ativo atual
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === usuario.id) {
      this.setCurrentUser(usuario);
    }
  },
  deleteUsuario(id: string): void {
    const list = this.getUsuarios().filter(u => u.id !== id);
    setStored(KEYS.USUARIOS, list);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      if (list.length > 0) {
        this.setCurrentUser(list[0]);
      } else {
        this.setCurrentUser(null);
      }
    }
  },
  getCurrentUser(): UsuarioEquipe | null {
    if (this.isLoggedOut()) {
      return null;
    }
    const users = this.getUsuarios();
    const stored = getStored<UsuarioEquipe | null>(KEYS.CURRENT_USER, null);
    if (stored) {
      const match = users.find(u => u.id === stored.id);
      if (match) return match;
    }
    // Shared link / new session starts strictly in Visitor Mode (null)
    return null;
  },
  setCurrentUser(user: UsuarioEquipe | null): void {
    if (!user) {
      this.setLoggedOut(true);
    } else {
      this.setLoggedOut(false);
      setStored(KEYS.CURRENT_USER, user);
    }
  },

  // Local cache setters for synchronization
  setObrasLocal(obras: Obra[]): void {
    setStored(KEYS.OBRAS, obras);
  },
  setColaboradoresLocal(colaboradores: Colaborador[]): void {
    setStored(KEYS.COLABORADORES, colaboradores);
  },
  setEquipamentosLocal(equipamentos: Equipamento[]): void {
    setStored(KEYS.EQUIPAMENTOS, equipamentos);
  },

  /**
   * Smart merge when Firestore updates:
   * Merges incoming Firestore RDOS with any locally created RDOS that haven't synced yet.
   * NEVER loses a locally authored RDO!
   */
  setRdosLocal(incomingRdos: RelatorioDiarioObra[]): RelatorioDiarioObra[] {
    const currentLocal = this.getRdos();
    const mergedMap = new Map<string, RelatorioDiarioObra>();

    // Add all current local items first
    for (const r of currentLocal) {
      mergedMap.set(r.id, r);
    }

    // Merge incoming Firestore items
    for (const remote of incomingRdos) {
      const local = mergedMap.get(remote.id);
      if (!local) {
        mergedMap.set(remote.id, remote);
      } else {
        // If remote has newer or equal updatedAt, take remote; otherwise preserve local
        if (!local.updatedAt || (remote.updatedAt && remote.updatedAt >= local.updatedAt)) {
          mergedMap.set(remote.id, remote);
        }
      }
    }

    const mergedList = Array.from(mergedMap.values()).sort((a, b) => (b.numero || 0) - (a.numero || 0));
    memoryRdosCache = mergedList;
    setStored(KEYS.RDOS, mergedList);

    // Save all to IndexedDB in background
    for (const r of mergedList) {
      saveToIndexedDb(STORE_RDOS, r).catch(() => {});
    }

    return mergedList;
  },

  setUsuariosLocal(usuarios: UsuarioEquipe[]): void {
    setStored(KEYS.USUARIOS, usuarios);
  },

  resetToDefaults(): void {
    localStorage.removeItem(KEYS.OBRAS);
    localStorage.removeItem(KEYS.COLABORADORES);
    localStorage.removeItem(KEYS.EQUIPAMENTOS);
    localStorage.removeItem(KEYS.RDOS);
    localStorage.removeItem(KEYS.USUARIOS);
    localStorage.removeItem(KEYS.CURRENT_USER);
    window.location.reload();
  }
};
