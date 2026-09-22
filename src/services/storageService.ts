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
    console.error(`Erro ao salvar chave ${key}:`, err);
  }
}

export const StorageService = {
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
  },
  deleteObra(id: string): void {
    const obras = this.getObras().filter(o => o.id !== id);
    setStored(KEYS.OBRAS, obras);
    // Also delete associated RDOs
    const rdos = this.getRdos().filter(r => r.obraId !== id);
    setStored(KEYS.RDOS, rdos);
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
    return getStored<RelatorioDiarioObra[]>(KEYS.RDOS, INITIAL_RDOS);
  },
  getRdosByObra(obraId: string): RelatorioDiarioObra[] {
    return this.getRdos().filter(r => r.obraId === obraId);
  },
  saveRdo(rdo: RelatorioDiarioObra): void {
    const list = this.getRdos();
    const idx = list.findIndex(r => r.id === rdo.id);
    if (idx >= 0) {
      list[idx] = { ...rdo, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...rdo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setStored(KEYS.RDOS, list);
  },
  deleteRdo(id: string): void {
    const list = this.getRdos().filter(r => r.id !== id);
    setStored(KEYS.RDOS, list);
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
    return users[0] || null;
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
  setRdosLocal(rdos: RelatorioDiarioObra[]): void {
    setStored(KEYS.RDOS, rdos);
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
