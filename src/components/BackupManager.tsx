import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, X, Database, FileText, Cloud, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createBackup, downloadBackup, parseBackupFile, BackupData } from '../utils/backup';
import { formatDate } from '../utils/calculations';

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackupManager({ isOpen, onClose }: BackupManagerProps) {
  const { state, dispatch, saveToDatabase, syncStatus } = useApp();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [backupPreview, setBackupPreview] = useState<BackupData | null>(null);
  const [isForceLoading, setIsForceLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const backup = createBackup(state);
    downloadBackup(backup);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);
    setBackupPreview(null);

    try {
      const backupData = await parseBackupFile(file);
      setBackupPreview(backupData);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!backupPreview) return;

    dispatch({ type: 'RESTORE_BACKUP', payload: backupPreview });
    
    // Sauvegarder aussi dans la base de données
    try {
      await saveToDatabase({
        projects: backupPreview.data.projects,
        quotes: backupPreview.data.quotes,
        salesReps: backupPreview.data.salesReps,
        companies: backupPreview.data.companies,
        filters: state.filters,
        lastModified: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde après import:', error);
    }
    
    setImportSuccess(true);
    setBackupPreview(null);
    
    setTimeout(() => {
      setImportSuccess(false);
      onClose();
    }, 2000);
  };

  const handleClearData = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action supprimera les données pour tous les utilisateurs et est irréversible.')) {
      dispatch({ type: 'CLEAR_ALL_DATA' });
      
      // Sauvegarder les données vides dans la base de données
      try {
        await saveToDatabase({
          projects: [],
          quotes: [],
          salesReps: [],
          companies: [],
          filters: state.filters,
          lastModified: new Date()
        });
      } catch (error) {
        console.error('Erreur lors de la suppression des données:', error);
      }
    }
  };

  const handleForceSync = async () => {
    try {
      await saveToDatabase(state);
    } catch (error) {
      console.error('Erreur lors de la synchronisation forcée:', error);
    }
  };

  const resetImport = () => {
    setBackupPreview(null);
    setImportError(null);
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-equation-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-equation-xl">
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6 text-equation-navy" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-equation-navy">Gestion des sauvegardes</h2>
              <p className="text-gray-600">Base de données en ligne partagée</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Online Database Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-equation-navy" />
              <h3 className="text-lg font-bold text-equation-navy">Base de données en ligne</h3>
            </div>
            <div className={`rounded-xl p-6 border ${
              syncStatus.status === 'synced' 
                ? 'bg-success-50 border-success-200' 
                : syncStatus.status === 'error'
                  ? 'bg-error-50 border-error-200'
                  : 'bg-equation-gold/10 border-equation-gold/20'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  syncStatus.status === 'synced' 
                    ? 'bg-success-100' 
                    : syncStatus.status === 'error'
                      ? 'bg-error-100'
                      : 'bg-equation-gold/20'
                }`}>
                  <Cloud className={`h-6 w-6 ${
                    syncStatus.status === 'synced' 
                      ? 'text-success-600' 
                      : syncStatus.status === 'error'
                        ? 'text-error-600'
                        : 'text-equation-navy'
                  }`} />
                </div>
                <div>
                  <p className={`font-semibold ${
                    syncStatus.status === 'synced' 
                      ? 'text-success-800' 
                      : syncStatus.status === 'error'
                        ? 'text-error-800'
                        : 'text-equation-navy'
                  }`}>
                    {syncStatus.status === 'synced' ? 'Synchronisé avec la base de données' :
                     syncStatus.status === 'error' ? 'Erreur de synchronisation' :
                     syncStatus.status === 'syncing' ? 'Synchronisation en cours...' :
                     'En attente de synchronisation'}
                  </p>
                  <p className={`text-sm ${
                    syncStatus.status === 'synced' 
                      ? 'text-success-700' 
                      : syncStatus.status === 'error'
                        ? 'text-error-700'
                        : 'text-gray-600'
                  }`}>
                    {syncStatus.status === 'error' && syncStatus.error 
                      ? syncStatus.error
                      : 'Toutes les données sont automatiquement sauvegardées en ligne et accessibles à tous les utilisateurs'
                    }
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className={`rounded-lg p-3 text-center ${
                  syncStatus.status === 'synced' 
                    ? 'bg-success-100' 
                    : syncStatus.status === 'error'
                      ? 'bg-error-100'
                      : 'bg-equation-gold/20'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className={`h-4 w-4 ${
                      syncStatus.status === 'synced' 
                        ? 'text-success-600' 
                        : syncStatus.status === 'error'
                          ? 'text-error-600'
                          : 'text-equation-navy'
                    }`} />
                    <span className={`text-xs font-medium ${
                      syncStatus.status === 'synced' 
                        ? 'text-success-700' 
                        : syncStatus.status === 'error'
                          ? 'text-error-700'
                          : 'text-equation-navy'
                    }`}>
                      Dernière synchronisation
                    </span>
                  </div>
                  <p className={`text-sm font-bold ${
                    syncStatus.status === 'synced' 
                      ? 'text-success-800' 
                      : syncStatus.status === 'error'
                        ? 'text-error-800'
                        : 'text-equation-navy'
                  }`}>
                    {syncStatus.lastSync 
                      ? formatDate(syncStatus.lastSync) + ' à ' + syncStatus.lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      : 'Jamais'
                    }
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${
                  syncStatus.status === 'synced' 
                    ? 'bg-success-100' 
                    : syncStatus.status === 'error'
                      ? 'bg-error-100'
                      : 'bg-equation-gold/20'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FileText className={`h-4 w-4 ${
                      syncStatus.status === 'synced' 
                        ? 'text-success-600' 
                        : syncStatus.status === 'error'
                          ? 'text-error-600'
                          : 'text-equation-navy'
                    }`} />
                    <span className={`text-xs font-medium ${
                      syncStatus.status === 'synced' 
                        ? 'text-success-700' 
                        : syncStatus.status === 'error'
                          ? 'text-error-700'
                          : 'text-equation-navy'
                    }`}>
                      Statut
                    </span>
                  </div>
                  <p className={`text-sm font-bold ${
                    syncStatus.status === 'synced' 
                      ? 'text-success-800' 
                      : syncStatus.status === 'error'
                        ? 'text-error-800'
                        : 'text-equation-navy'
                  }`}>
                    {syncStatus.status === 'synced' ? 'En ligne' :
                     syncStatus.status === 'error' ? 'Erreur' :
                     syncStatus.status === 'syncing' ? 'En cours...' :
                     'En attente'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleForceSync}
                  disabled={syncStatus.status === 'syncing'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-equation-navy text-equation-white rounded-xl hover:bg-equation-navy-dark transition-all duration-200 font-medium disabled:opacity-50"
                >
                  <Cloud className="h-4 w-4" />
                  Forcer la synchronisation
                </button>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-equation-gold" />
              <h3 className="text-lg font-bold text-equation-navy">Exporter les données</h3>
            </div>
            <div className="bg-equation-navy/5 rounded-xl p-6 border border-equation-navy/10">
              <p className="text-gray-600 mb-4">
                Créez une sauvegarde complète de toutes vos données (chantiers, devis, équipe, entreprises).
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-equation-navy">{state.projects.length}</p>
                  <p className="text-xs text-gray-600">Chantiers</p>
                </div>
                <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-equation-navy">{state.quotes.length}</p>
                  <p className="text-xs text-gray-600">Devis</p>
                </div>
                <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-equation-navy">{state.salesReps.length}</p>
                  <p className="text-xs text-gray-600">Chargés d'affaires</p>
                </div>
                <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-equation-navy">{state.companies.length}</p>
                  <p className="text-xs text-gray-600">Entreprises</p>
                </div>
              </div>
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold"
              >
                <Download className="h-5 w-5" />
                Télécharger la sauvegarde
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-equation-navy" />
              <h3 className="text-lg font-bold text-equation-navy">Importer une sauvegarde</h3>
            </div>
            
            {!backupPreview && !importSuccess && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-4 p-4 bg-warning-50 rounded-lg border border-warning-200 mb-4">
                  <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
                  <p className="text-sm text-warning-800">
                    <strong>Attention :</strong> L'import remplacera toutes les données actuelles pour tous les utilisateurs. 
                    Cette action est visible immédiatement par tous.
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-equation-navy hover:text-equation-navy transition-all duration-200 font-medium disabled:opacity-50"
                >
                  <Upload className="h-5 w-5" />
                  {isImporting ? 'Lecture du fichier...' : 'Sélectionner un fichier de sauvegarde'}
                </button>
                
                {importError && (
                  <div className="mt-4 p-4 bg-error-50 rounded-lg border border-error-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-error-600" />
                      <p className="text-sm font-semibold text-error-800">Erreur d'import</p>
                    </div>
                    <p className="text-sm text-error-700 mt-1">{importError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Backup Preview */}
            {backupPreview && !importSuccess && (
              <div className="bg-equation-navy/5 rounded-xl p-6 border border-equation-navy/10">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-equation-navy" />
                  <h4 className="font-bold text-equation-navy">Aperçu de la sauvegarde</h4>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Version :</span>
                    <span className="font-medium text-equation-navy">{backupPreview.version}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date de création :</span>
                    <span className="font-medium text-equation-navy">
                      {formatDate(backupPreview.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-equation-navy">{backupPreview.data.projects.length}</p>
                    <p className="text-xs text-gray-600">Chantiers</p>
                  </div>
                  <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-equation-navy">{backupPreview.data.quotes.length}</p>
                    <p className="text-xs text-gray-600">Devis</p>
                  </div>
                  <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-equation-navy">{backupPreview.data.salesReps.length}</p>
                    <p className="text-xs text-gray-600">Chargés d'affaires</p>
                  </div>
                  <div className="text-center p-3 bg-equation-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-equation-navy">{backupPreview.data.companies.length}</p>
                    <p className="text-xs text-gray-600">Entreprises</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={resetImport}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="flex-1 px-6 py-3 bg-equation-navy text-equation-white rounded-xl hover:bg-equation-navy-dark transition-all duration-200 font-semibold"
                  >
                    Confirmer l'import
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {importSuccess && (
              <div className="bg-success-50 rounded-xl p-6 border border-success-200">
                <div className="flex items-center gap-3 text-success-800">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <p className="font-bold">Import réussi !</p>
                    <p className="text-sm">
                      Les données ont été restaurées avec succès et synchronisées en ligne pour tous les utilisateurs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-error-600" />
              <h3 className="text-lg font-bold text-error-600">Zone de danger</h3>
            </div>
            <div className="bg-error-50 rounded-xl p-6 border border-error-200">
              <p className="text-error-800 mb-4">
                <strong>Supprimer toutes les données :</strong> Cette action supprimera définitivement 
                tous les chantiers et devis pour tous les utilisateurs. Cette action est irréversible.
              </p>
              <button
                onClick={handleClearData}
                className="px-6 py-3 bg-error-600 text-error-50 rounded-xl hover:bg-error-700 transition-all duration-200 font-semibold"
              >
                Supprimer toutes les données
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-equation-navy/5 rounded-xl p-6 border border-equation-navy/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cloud className="h-6 w-6 text-equation-navy" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-equation-navy mb-2">Base de données en ligne partagée</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• <strong>Accessible à tous :</strong> Toutes les données sont partagées entre tous les visiteurs</p>
                  <p>• <strong>Synchronisation temps réel :</strong> Les modifications sont automatiquement synchronisées</p>
                  <p>• <strong>Pas d'authentification :</strong> Aucune connexion requise pour utiliser l'application</p>
                  <p>• <strong>Sauvegarde automatique :</strong> Toutes les modifications sont sauvegardées en ligne</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}