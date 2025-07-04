import React, { useState } from 'react';
import { X, MapPin, User, Calendar, FileText, Euro, TrendingUp, Building, Edit, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency, calculateCommissions } from '../utils/calculations';
import StatusBadge from './StatusBadge';

interface ProjectDetailProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectDetail({ isOpen, onClose }: ProjectDetailProps) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  
  if (!isOpen || !state.selectedProject) return null;

  const project = state.selectedProject;
  const salesRep = state.salesReps.find(rep => rep.id === project.salesRepId);
  const projectQuotes = state.quotes.filter(quote => quote.projectId === project.id);

  // Calculs financiers
  const totalAmount = projectQuotes.reduce((sum, quote) => sum + quote.amountHT, 0);
  const totalEquationCommissions = projectQuotes.reduce((sum, quote) => sum + quote.equationCommissionAmount, 0);
  const totalSalesRepCommissions = projectQuotes.reduce((sum, quote) => sum + quote.salesRepCommissionAmount, 0);
  const collectedAmount = projectQuotes
    .filter(quote => quote.status === 'collected')
    .reduce((sum, quote) => sum + quote.amountHT, 0);
  const pendingCommissions = projectQuotes
    .filter(quote => quote.paymentStatus === 'pending' && quote.status === 'collected')
    .reduce((sum, quote) => sum + quote.salesRepCommissionAmount, 0);

  const handleEditProject = () => {
    // Cette fonction sera gérée par le composant parent
    onClose();
  };

  const handleCreateQuote = () => {
    // Fermer le modal et rediriger vers la page des devis avec le projet pré-sélectionné
    onClose();
    // Stocker l'ID du projet dans le localStorage pour le pré-sélectionner
    localStorage.setItem('preselected-project-id', project.id);
    navigate('/quotes?new=true');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-equation-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-equation-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-equation-navy/10 rounded-2xl flex items-center justify-center">
              <Building className="h-8 w-8 text-equation-navy" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-equation-navy">{project.name}</h2>
              <p className="text-gray-600 text-lg">Détail du chantier</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEditProject}
              className="flex items-center gap-2 px-4 py-2 border border-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold hover:text-equation-navy transition-all duration-200 font-medium"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </button>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Informations du chantier */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-equation-navy">Informations générales</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-equation-gold mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Adresse</p>
                    <p className="text-equation-navy font-medium">{project.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-equation-gold flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chargé d'affaires</p>
                    <p className="text-equation-navy font-medium">{salesRep?.name || 'Non assigné'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-equation-gold flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date de création</p>
                    <p className="text-equation-navy font-medium">{formatDate(project.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Récapitulatif financier */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-equation-navy">Récapitulatif financier</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-equation-navy/5 rounded-xl p-4 border border-equation-navy/10">
                  <p className="text-sm font-medium text-gray-600 mb-1">CA total</p>
                  <p className="text-2xl font-bold text-equation-navy">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-success-50 rounded-xl p-4 border border-success-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">CA encaissé</p>
                  <p className="text-2xl font-bold text-success-700">{formatCurrency(collectedAmount)}</p>
                </div>
                <div className="bg-equation-gold/10 rounded-xl p-4 border border-equation-gold/20">
                  <p className="text-sm font-medium text-gray-600 mb-1">Commission ÉQUATION</p>
                  <p className="text-xl font-bold text-equation-navy">{formatCurrency(totalEquationCommissions)}</p>
                </div>
                <div className={`rounded-xl p-4 border ${
                  pendingCommissions > 0 
                    ? 'bg-error-50 border-error-200' 
                    : 'bg-success-50 border-success-200'
                }`}>
                  <p className="text-sm font-medium text-gray-600 mb-1">À payer équipe</p>
                  <p className={`text-xl font-bold ${
                    pendingCommissions > 0 
                      ? 'text-error-700' 
                      : 'text-success-700'
                  }`}>
                    {formatCurrency(pendingCommissions)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Devis associés */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-equation-navy">Devis associés ({projectQuotes.length})</h3>
              <button
                onClick={handleCreateQuote}
                className="flex items-center gap-2 px-4 py-2 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-medium"
              >
                <Plus className="h-4 w-4" />
                Nouveau devis
              </button>
            </div>

            {projectQuotes.length > 0 ? (
              <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Entreprise
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Montant HT
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Commission ÉQUATION
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Commission CA
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Paiement
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date création
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-equation-white divide-y divide-gray-100">
                      {projectQuotes.map((quote) => (
                        <tr 
                          key={quote.id} 
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-equation-navy/10 rounded-lg flex items-center justify-center">
                                <Building className="h-5 w-5 text-equation-navy" />
                              </div>
                              <div className="text-sm font-semibold text-equation-navy">
                                {quote.companyName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-equation-navy">
                              {formatCurrency(quote.amountHT)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={quote.status} type="quote" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-equation-navy">
                              {formatCurrency(quote.equationCommissionAmount)}
                            </div>
                            <div className="text-xs text-equation-gold font-medium">{quote.equationCommissionRate}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-equation-navy">
                              {formatCurrency(quote.salesRepCommissionAmount)}
                            </div>
                            <div className="text-xs text-equation-gold font-medium">{quote.salesRepCommissionRate}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={quote.paymentStatus} type="payment" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(quote.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="w-16 h-16 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-equation-navy" />
                </div>
                <h4 className="text-lg font-bold text-equation-navy mb-2">Aucun devis</h4>
                <p className="text-gray-600 mb-6">Ce chantier n'a pas encore de devis associé</p>
                <button
                  onClick={handleCreateQuote}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Créer le premier devis
                </button>
              </div>
            )}
          </div>

          {/* Statistiques détaillées */}
          {projectQuotes.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-equation-navy">Statistiques détaillées</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-equation-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6 text-equation-navy" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Répartition des devis</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Facturés</span>
                      <span className="font-semibold text-equation-navy">
                        {projectQuotes.filter(q => q.status === 'billed').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Encaissés</span>
                      <span className="font-semibold text-success-600">
                        {projectQuotes.filter(q => q.status === 'collected').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-equation-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-equation-gold/20 rounded-xl flex items-center justify-center">
                      <Euro className="h-6 w-6 text-equation-navy" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Performance financière</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Montant moyen</span>
                      <span className="font-semibold text-equation-navy">
                        {formatCurrency(projectQuotes.length > 0 ? totalAmount / projectQuotes.length : 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taux d'encaissement</span>
                      <span className="font-semibold text-success-600">
                        {totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Commission moyenne</span>
                      <span className="font-semibold text-equation-gold">
                        {projectQuotes.length > 0 
                          ? Math.round(projectQuotes.reduce((sum, q) => sum + q.equationCommissionRate, 0) / projectQuotes.length * 10) / 10
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-equation-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Évolution</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Premier devis</span>
                      <span className="font-semibold text-equation-navy">
                        {projectQuotes.length > 0 
                          ? formatDate(new Date(Math.min(...projectQuotes.map(q => q.createdAt.getTime()))))
                          : '-'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dernier devis</span>
                      <span className="font-semibold text-equation-navy">
                        {projectQuotes.length > 0 
                          ? formatDate(new Date(Math.max(...projectQuotes.map(q => q.createdAt.getTime()))))
                          : '-'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Durée du projet</span>
                      <span className="font-semibold text-equation-navy">
                        {Math.ceil((Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24))} jours
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}