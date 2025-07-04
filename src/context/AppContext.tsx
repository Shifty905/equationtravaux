import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Project, Quote, SalesRep, Company, FilterOptions } from '../types';
import { BackupData } from '../utils/backup';
import { useSharedDatabase } from '../hooks/useSharedDatabase';

interface AppState {
  projects: Project[];
  quotes: Quote[];
  salesReps: SalesRep[];
  companies: Company[];
  filters: FilterOptions;
  selectedProject?: Project;
  selectedQuote?: Quote;
  lastModified: Date;
}

type AppAction =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_QUOTE'; payload: Quote }
  | { type: 'UPDATE_QUOTE'; payload: Quote }
  | { type: 'DELETE_QUOTE'; payload: string }
  | { type: 'ADD_SALES_REP'; payload: SalesRep }
  | { type: 'UPDATE_SALES_REP'; payload: SalesRep }
  | { type: 'DELETE_SALES_REP'; payload: string }
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'UPDATE_COMPANY'; payload: Company }
  | { type: 'DELETE_COMPANY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<FilterOptions> }
  | { type: 'SELECT_PROJECT'; payload: Project | undefined }
  | { type: 'SELECT_QUOTE'; payload: Quote | undefined }
  | { type: 'RESTORE_BACKUP'; payload: BackupData }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'LOAD_FROM_DATABASE'; payload: AppState }
  | { type: 'FORCE_SAVE' };

const initialState: AppState = {
  projects: [],
  quotes: [],
  salesReps: [],
  companies: [],
  filters: {
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date()
    }
  },
  lastModified: new Date()
};

function appReducer(state: AppState, action: AppAction): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'LOAD_FROM_DATABASE':
      return action.payload;
      
    case 'ADD_PROJECT':
      newState = {
        ...state,
        projects: [...state.projects, action.payload],
        lastModified: new Date()
      };
      break;
      
    case 'UPDATE_PROJECT':
      newState = {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        lastModified: new Date()
      };
      break;
      
    case 'DELETE_PROJECT':
      newState = {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        quotes: state.quotes.filter(q => q.projectId !== action.payload),
        lastModified: new Date()
      };
      break;
      
    case 'ADD_QUOTE':
      newState = {
        ...state,
        quotes: [...state.quotes, action.payload],
        lastModified: new Date()
      };
      break;
      
    case 'UPDATE_QUOTE':
      newState = {
        ...state,
        quotes: state.quotes.map(q => 
          q.id === action.payload.id ? action.payload : q
        ),
        lastModified: new Date()
      };
      break;
      
    case 'DELETE_QUOTE':
      newState = {
        ...state,
        quotes: state.quotes.filter(q => q.id !== action.payload),
        lastModified: new Date()
      };
      break;
      
    case 'ADD_SALES_REP':
      newState = {
        ...state,
        salesReps: [...state.salesReps, action.payload],
        lastModified: new Date()
      };
      break;
      
    case 'UPDATE_SALES_REP':
      newState = {
        ...state,
        salesReps: state.salesReps.map(s => 
          s.id === action.payload.id ? action.payload : s
        ),
        lastModified: new Date()
      };
      break;
      
    case 'DELETE_SALES_REP':
      newState = {
        ...state,
        salesReps: state.salesReps.filter(s => s.id !== action.payload),
        lastModified: new Date()
      };
      break;
      
    case 'ADD_COMPANY':
      newState = {
        ...state,
        companies: [...state.companies, action.payload],
        lastModified: new Date()
      };
      break;
      
    case 'UPDATE_COMPANY':
      newState = {
        ...state,
        companies: state.companies.map(c => 
          c.id === action.payload.id ? action.payload : c
        ),
        lastModified: new Date()
      };
      break;
      
    case 'DELETE_COMPANY':
      newState = {
        ...state,
        companies: state.companies.filter(c => c.id !== action.payload),
        lastModified: new Date()
      };
      break;
      
    case 'SET_FILTERS':
      newState = {
        ...state,
        filters: { ...state.filters, ...action.payload },
        lastModified: new Date()
      };
      break;
      
    case 'SELECT_PROJECT':
      return {
        ...state,
        selectedProject: action.payload
      };
      
    case 'SELECT_QUOTE':
      return {
        ...state,
        selectedQuote: action.payload
      };
      
    case 'RESTORE_BACKUP':
      newState = {
        ...state,
        projects: action.payload.data.projects,
        quotes: action.payload.data.quotes,
        salesReps: action.payload.data.salesReps,
        companies: action.payload.data.companies,
        lastModified: new Date()
      };
      break;
      
    case 'CLEAR_ALL_DATA':
      newState = {
        ...state,
        projects: [],
        quotes: [],
        salesReps: [],
        companies: [],
        selectedProject: undefined,
        selectedQuote: undefined,
        lastModified: new Date()
      };
      break;

    case 'FORCE_SAVE':
      return state;
      
    default:
      return state;
  }

  return newState;
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveToDatabase: (state: AppState) => Promise<void>;
  forceSave: () => void;
  syncStatus: any;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { saveToDatabase, loadFromDatabase, testConnection, syncStatus } = useSharedDatabase();

  // Fonction pour forcer une sauvegarde
  const forceSave = () => {
    dispatch({ type: 'FORCE_SAVE' });
    saveToDatabase(state);
  };

  // Charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Chargement des données au démarrage...');
      
      // Tester la connexion
      const isConnected = await testConnection();
      if (!isConnected) {
        console.error('❌ Impossible de se connecter à la base de données');
        return;
      }
      
      // Charger depuis la base de données
      try {
        const databaseState = await loadFromDatabase();
        if (databaseState && (
          databaseState.projects.length > 0 || 
          databaseState.quotes.length > 0 || 
          databaseState.salesReps.length > 0 || 
          databaseState.companies.length > 0
        )) {
          console.log('✅ Données chargées depuis la base de données');
          dispatch({ type: 'LOAD_FROM_DATABASE', payload: databaseState });
        } else {
          console.log('ℹ️ Aucune donnée trouvée dans la base de données');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
      }
    };

    loadData();
  }, [loadFromDatabase, testConnection]);

  // Sauvegarde automatique après chaque modification (debounced)
  useEffect(() => {
    if (state.projects.length > 0 || state.quotes.length > 0 || state.salesReps.length > 0 || state.companies.length > 0) {
      console.log('🔄 Déclenchement de la sauvegarde automatique...');
      const timeoutId = setTimeout(async () => {
        try {
          await saveToDatabase(state);
          console.log('✅ Sauvegarde automatique réussie');
        } catch (error) {
          console.error('❌ Erreur sauvegarde automatique:', error);
        }
      }, 2000); // Debounce de 2 secondes

      return () => clearTimeout(timeoutId);
    }
  }, [state.lastModified, saveToDatabase]);

  // Sauvegarde avant fermeture de la page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      console.log('💾 Sauvegarde avant fermeture...');
      try {
        await saveToDatabase(state);
      } catch (error) {
        console.warn('⚠️ Impossible de sauvegarder avant fermeture:', error);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('👁️ Page cachée, sauvegarde préventive...');
        try {
          await saveToDatabase(state);
        } catch (error) {
          console.warn('⚠️ Erreur sauvegarde préventive:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, saveToDatabase]);

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      saveToDatabase, 
      forceSave,
      syncStatus 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export type { AppState };