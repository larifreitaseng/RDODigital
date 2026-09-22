import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Obra, RelatorioDiarioObra, Colaborador, Equipamento, UsuarioEquipe } from '../types';
import { 
  INITIAL_OBRAS, 
  INITIAL_COLABORADORES, 
  INITIAL_EQUIPAMENTOS, 
  INITIAL_RDOS, 
  INITIAL_USUARIOS 
} from '../data/initialData';

// Helper to remove undefined properties before sending to Firestore
function sanitizePayload<T>(obj: T): any {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

export const FirebaseService = {
  // Check and seed initial collections if empty
  async seedInitialDataIfEmpty() {
    try {
      const obrasSnapshot = await getDocs(collection(db, 'obras'));
      if (obrasSnapshot.empty) {
        console.log('Firebase: Inicializando dados padrão na nuvem...');
        // Seed Obras
        for (const obra of INITIAL_OBRAS) {
          await setDoc(doc(db, 'obras', obra.id), sanitizePayload(obra));
        }
        // Seed Colaboradores
        for (const colab of INITIAL_COLABORADORES) {
          await setDoc(doc(db, 'colaboradores', colab.id), sanitizePayload(colab));
        }
        // Seed Equipamentos
        for (const eq of INITIAL_EQUIPAMENTOS) {
          await setDoc(doc(db, 'equipamentos', eq.id), sanitizePayload(eq));
        }
        // Seed RDOs
        for (const rdo of INITIAL_RDOS) {
          await setDoc(doc(db, 'rdos', rdo.id), sanitizePayload(rdo));
        }
        // Seed Usuarios
        for (const user of INITIAL_USUARIOS) {
          await setDoc(doc(db, 'usuarios', user.id), sanitizePayload(user));
        }
        console.log('Firebase: Dados iniciais sincronizados com sucesso no Firestore.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed');
    }
  },

  // Real-time Subscriptions with mandatory error handling
  subscribeAll(callbacks: {
    onObras: (obras: Obra[]) => void;
    onRdos: (rdos: RelatorioDiarioObra[]) => void;
    onColaboradores: (colaboradores: Colaborador[]) => void;
    onEquipamentos: (equipamentos: Equipamento[]) => void;
    onUsuarios: (usuarios: UsuarioEquipe[]) => void;
    onReady: () => void;
  }) {
    let loadedCount = 0;
    const checkReady = () => {
      loadedCount++;
      if (loadedCount >= 5) {
        callbacks.onReady();
      }
    };

    const unsubObras = onSnapshot(
      collection(db, 'obras'),
      (snapshot) => {
        const items = snapshot.docs.map(d => d.data() as Obra);
        callbacks.onObras(items);
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'obras');
      }
    );

    const unsubRdos = onSnapshot(
      collection(db, 'rdos'),
      (snapshot) => {
        const items = snapshot.docs.map(d => d.data() as RelatorioDiarioObra);
        callbacks.onRdos(items);
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'rdos');
      }
    );

    const unsubColab = onSnapshot(
      collection(db, 'colaboradores'),
      (snapshot) => {
        const items = snapshot.docs.map(d => d.data() as Colaborador);
        callbacks.onColaboradores(items);
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'colaboradores');
      }
    );

    const unsubEq = onSnapshot(
      collection(db, 'equipamentos'),
      (snapshot) => {
        const items = snapshot.docs.map(d => d.data() as Equipamento);
        callbacks.onEquipamentos(items);
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'equipamentos');
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'usuarios'),
      (snapshot) => {
        const items = snapshot.docs.map(d => d.data() as UsuarioEquipe);
        callbacks.onUsuarios(items);
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'usuarios');
      }
    );

    return () => {
      unsubObras();
      unsubRdos();
      unsubColab();
      unsubEq();
      unsubUsers();
    };
  },

  // OBRAS CRUD
  async saveObra(obra: Obra): Promise<void> {
    const path = `obras/${obra.id}`;
    try {
      await setDoc(doc(db, 'obras', obra.id), sanitizePayload(obra));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteObra(id: string): Promise<void> {
    const path = `obras/${id}`;
    try {
      await deleteDoc(doc(db, 'obras', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // RDOS CRUD
  async saveRdo(rdo: RelatorioDiarioObra): Promise<void> {
    const path = `rdos/${rdo.id}`;
    try {
      await setDoc(doc(db, 'rdos', rdo.id), sanitizePayload(rdo));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteRdo(id: string): Promise<void> {
    const path = `rdos/${id}`;
    try {
      await deleteDoc(doc(db, 'rdos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // COLABORADORES CRUD
  async saveColaborador(colaborador: Colaborador): Promise<void> {
    const path = `colaboradores/${colaborador.id}`;
    try {
      await setDoc(doc(db, 'colaboradores', colaborador.id), sanitizePayload(colaborador));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteColaborador(id: string): Promise<void> {
    const path = `colaboradores/${id}`;
    try {
      await deleteDoc(doc(db, 'colaboradores', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // EQUIPAMENTOS CRUD
  async saveEquipamento(equipamento: Equipamento): Promise<void> {
    const path = `equipamentos/${equipamento.id}`;
    try {
      await setDoc(doc(db, 'equipamentos', equipamento.id), sanitizePayload(equipamento));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteEquipamento(id: string): Promise<void> {
    const path = `equipamentos/${id}`;
    try {
      await deleteDoc(doc(db, 'equipamentos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // USUARIOS CRUD
  async saveUsuario(usuario: UsuarioEquipe): Promise<void> {
    const path = `usuarios/${usuario.id}`;
    try {
      await setDoc(doc(db, 'usuarios', usuario.id), sanitizePayload(usuario));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteUsuario(id: string): Promise<void> {
    const path = `usuarios/${id}`;
    try {
      await deleteDoc(doc(db, 'usuarios', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
