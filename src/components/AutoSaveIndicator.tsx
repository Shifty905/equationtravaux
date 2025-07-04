import React, { useState, useEffect } from 'react';
import { CheckCircle, Cloud, AlertCircle, Loader, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AutoSaveIndicatorProps {
  className?: string;
}

export default function AutoSaveIndicator({ className = '' }: AutoSaveIndicatorProps) {
  const { syncStatus } = useApp();

  const getMainIcon = () => {
    if (syncStatus.status === 'syncing') {
      return <Loader className="h-4 w-4 text-equation-gold animate-spin" />;
    }

    if (syncStatus.status === 'error') {
      return <AlertCircle className="h-4 w-4 text-error-600" />;
    }

    if (syncStatus.status === 'synced') {
      return <Cloud className="h-4 w-4 text-success-600" />;
    }

    return <Database className="h-4 w-4 text-equation-navy" />;
  };

  const getMainText = () => {
    if (syncStatus.status === 'syncing') {
      return 'Synchronisation...';
    }

    if (syncStatus.status === 'error') {
      return 'Erreur de sync';
    }

    if (syncStatus.status === 'synced') {
      return 'Base synchronisée';
    }

    return 'Base de données';
  };

  const getMainColor = () => {
    if (syncStatus.status === 'syncing') {
      return 'text-equation-gold';
    }

    if (syncStatus.status === 'error') {
      return 'text-error-600';
    }

    if (syncStatus.status === 'synced') {
      return 'text-success-600';
    }

    return 'text-equation-navy';
  };

  const getSubText = () => {
    if (syncStatus.status === 'synced' && syncStatus.lastSync) {
      const timeDiff = Math.floor((new Date().getTime() - syncStatus.lastSync.getTime()) / 1000);
      if (timeDiff < 60) {
        return 'À l\'instant';
      } else if (timeDiff < 3600) {
        return `Il y a ${Math.floor(timeDiff / 60)}min`;
      } else {
        return syncStatus.lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
    }

    if (syncStatus.status === 'error') {
      return 'Connexion interrompue';
    }

    return 'Mode partagé en ligne';
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-3">
        {getMainIcon()}
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium ${getMainColor()}`}>
            {getMainText()}
          </div>
          <div className="text-xs text-equation-gold/70 truncate">
            {getSubText()}
          </div>
        </div>
      </div>
    </div>
  );
}