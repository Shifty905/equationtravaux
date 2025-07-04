import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppState } from '../context/AppContext';

interface SyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSync: Date | null;
  error: string | null;
}

export function useSharedDatabase() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSync: null,
    error: null
  });

  // Sauvegarder les données dans Supabase (mode partagé)
  const saveToDatabase = useCallback(async (state: AppState) => {
    try {
      setSyncStatus(prev => ({ ...prev, status: 'syncing', error: null }));

      console.log('🔄 Sauvegarde en ligne...', {
        projectsCount: state.projects.length,
        quotesCount: state.quotes.length,
        salesRepsCount: state.salesReps.length,
        companiesCount: state.companies.length
      });

      // Préparer les données pour la sauvegarde
      const backupData = {
        projects: state.projects,
        quotes: state.quotes,
        salesReps: state.salesReps,
        companies: state.companies,
        filters: state.filters,
        lastSaved: new Date().toISOString(),
        lastModified: state.lastModified?.toISOString() || new Date().toISOString()
      };

      // Vérifier si un backup existe
      const { data: existingBackup } = await supabase
        .from('shared_crm_data')
        .select('id')
        .eq('data_type', 'full_backup')
        .single();

      if (existingBackup) {
        // Mettre à jour
        const { error: updateError } = await supabase
          .from('shared_crm_data')
          .update({
            data: backupData,
            updated_at: new Date().toISOString()
          })
          .eq('data_type', 'full_backup');

        if (updateError) {
          console.error('Erreur mise à jour:', updateError);
          throw updateError;
        }
      } else {
        // Créer
        const { error: insertError } = await supabase
          .from('shared_crm_data')
          .insert({
            data_type: 'full_backup',
            data: backupData
          });

        if (insertError) {
          console.error('Erreur création:', insertError);
          throw insertError;
        }
      }

      const now = new Date();
      setSyncStatus({
        status: 'synced',
        lastSync: now,
        error: null
      });

      console.log('✅ Sauvegarde en ligne réussie');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde en ligne:', error);
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
      throw error;
    }
  }, []);

  // Charger les données depuis Supabase
  const loadFromDatabase = useCallback(async (): Promise<AppState | null> => {
    try {
      setSyncStatus(prev => ({ ...prev, status: 'syncing', error: null }));

      console.log('🔄 Chargement depuis la base de données en ligne...');

      const { data: backupData, error: backupError } = await supabase
        .from('shared_crm_data')
        .select('data')
        .eq('data_type', 'full_backup')
        .single();

      if (backupError && backupError.code !== 'PGRST116') {
        throw backupError;
      }

      if (backupData?.data) {
        console.log('📥 Données trouvées en ligne');
        const crmData = backupData.data;
        
        const state: AppState = {
          projects: crmData.projects?.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt)
          })) || [],
          quotes: crmData.quotes?.map((quote: any) => ({
            ...quote,
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt),
            billingDate: quote.billingDate ? new Date(quote.billingDate) : undefined,
            collectionDate: quote.collectionDate ? new Date(quote.collectionDate) : undefined,
            paymentDate: quote.paymentDate ? new Date(quote.paymentDate) : undefined,
          })) || [],
          salesReps: crmData.salesReps?.map((rep: any) => ({
            ...rep,
            createdAt: new Date(rep.createdAt)
          })) || [],
          companies: crmData.companies?.map((company: any) => ({
            ...company,
            createdAt: new Date(company.createdAt)
          })) || [],
          filters: crmData.filters || {
            dateRange: {
              start: new Date(new Date().getFullYear(), 0, 1),
              end: new Date()
            }
          },
          lastModified: crmData.lastModified ? new Date(crmData.lastModified) : new Date()
        };

        setSyncStatus({
          status: 'synced',
          lastSync: new Date(),
          error: null
        });

        console.log('✅ Données chargées depuis la base de données en ligne');
        return state;
      } else {
        console.log('ℹ️ Aucune donnée trouvée en ligne');
        setSyncStatus({
          status: 'synced',
          lastSync: new Date(),
          error: null
        });
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur chargement depuis la base de données:', error);
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
      return null;
    }
  }, []);

  // Test de connexion
  const testConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shared_crm_data')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Test de connexion échoué:', error);
        return false;
      }

      console.log('✅ Connexion base de données OK');
      return true;
    } catch (error) {
      console.error('❌ Erreur de test de connexion:', error);
      return false;
    }
  }, []);

  return {
    syncStatus,
    saveToDatabase,
    loadFromDatabase,
    testConnection
  };
}