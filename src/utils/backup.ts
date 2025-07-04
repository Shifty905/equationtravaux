import { AppState } from '../context/AppContext';

export interface BackupData {
  version: string;
  timestamp: Date;
  data: {
    projects: AppState['projects'];
    quotes: AppState['quotes'];
    salesReps: AppState['salesReps'];
    companies: AppState['companies'];
  };
}

export function createBackup(state: AppState): BackupData {
  return {
    version: '1.0.0',
    timestamp: new Date(),
    data: {
      projects: state.projects,
      quotes: state.quotes,
      salesReps: state.salesReps,
      companies: state.companies,
    }
  };
}

export function downloadBackup(backupData: BackupData): void {
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `equation-travaux-backup-${timestamp}.json`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function validateBackupData(data: any): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  if (!data.version || !data.timestamp || !data.data) return false;
  if (!data.data.projects || !Array.isArray(data.data.projects)) return false;
  if (!data.data.quotes || !Array.isArray(data.data.quotes)) return false;
  if (!data.data.salesReps || !Array.isArray(data.data.salesReps)) return false;
  if (!data.data.companies || !Array.isArray(data.data.companies)) return false;
  
  return true;
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const data = JSON.parse(jsonString);
        
        if (!validateBackupData(data)) {
          reject(new Error('Format de sauvegarde invalide'));
          return;
        }
        
        // Convert date strings back to Date objects
        data.timestamp = new Date(data.timestamp);
        data.data.projects = data.data.projects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }));
        data.data.quotes = data.data.quotes.map((quote: any) => ({
          ...quote,
          createdAt: new Date(quote.createdAt),
          updatedAt: new Date(quote.updatedAt),
          billingDate: quote.billingDate ? new Date(quote.billingDate) : undefined,
          collectionDate: quote.collectionDate ? new Date(quote.collectionDate) : undefined,
          paymentDate: quote.paymentDate ? new Date(quote.paymentDate) : undefined,
        }));
        data.data.salesReps = data.data.salesReps.map((rep: any) => ({
          ...rep,
          createdAt: new Date(rep.createdAt)
        }));
        data.data.companies = data.data.companies.map((company: any) => ({
          ...company,
          createdAt: new Date(company.createdAt)
        }));
        
        resolve(data);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier de sauvegarde'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsText(file);
  });
}