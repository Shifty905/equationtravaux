import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Mail, Phone, TrendingUp, Award, Target, X, Building, Euro, Calendar, Download, Filter, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SalesRep } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import StatusBadge from '../components/StatusBadge';

type DateFilter = 'current-month' | 'previous-month' | 'current-year' | 'custom';

export default function Team() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState<SalesRep | null>(null);
  const [showCommissionDetail, setShowCommissionDetail] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleEditSalesRep = (salesRep: SalesRep) => {
    setEditingSalesRep(salesRep);
    setFormData({
      name: salesRep.name,
      email: salesRep.email || '',
      phone: salesRep.phone || ''
    });
    setShowForm(true);
  };

  const handleShowCommissionDetail = (salesRep: SalesRep) => {
    setSelectedSalesRep(salesRep);
    setShowCommissionDetail(true);
  };

  const handleDeleteSalesRep = (salesRepId: string) => {
    const hasProjects = state.projects.some(p => p.salesRepId === salesRepId);
    if (hasProjects) {
      alert('Impossible de supprimer ce chargé d\'affaires car il a des chantiers assignés.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chargé d\'affaires ?')) {
      dispatch({ type: 'DELETE_SALES_REP', payload: salesRepId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    const salesRepData = {
      id: editingSalesRep?.id || Date.now().toString(),
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      createdAt: editingSalesRep?.createdAt || new Date()
    };

    if (editingSalesRep) {
      dispatch({ type: 'UPDATE_SALES_REP', payload: salesRepData });
    } else {
      dispatch({ type: 'ADD_SALES_REP', payload: salesRepData });
    }

    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSalesRep(null);
    setFormData({ name: '', email: '', phone: '' });
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateFilter) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'previous-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Dernier jour du mois précédent
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), 0, 1);
        endDate = customEndDate ? new Date(customEndDate) : now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  };

  const filterQuotesByDate = (quotes: any[]) => {
    const { startDate, endDate } = getDateRange();
    return quotes.filter(quote => {
      const quoteDate = new Date(quote.createdAt);
      return quoteDate >= startDate && quoteDate <= endDate;
    });
  };

  const getSalesRepStats = (salesRepId: string) => {
    const projects = state.projects.filter(p => p.salesRepId === salesRepId);
    const allQuotes = state.quotes.filter(q => {
      const project = state.projects.find(p => p.id === q.projectId);
      return project?.salesRepId === salesRepId;
    });
    
    // Appliquer le filtre de dates
    const quotes = filterQuotesByDate(allQuotes);
    
    const totalAmount = quotes.reduce((sum, q) => sum + q.amountHT, 0);
    const totalEquationCommissions = quotes.reduce((sum, q) => sum + q.equationCommissionAmount, 0);
    const totalSalesRepCommissions = quotes.reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
    const paidCommissions = quotes
      .filter(q => q.paymentStatus === 'paid')
      .reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
    
    return {
      projectsCount: projects.length,
      quotesCount: quotes.length,
      totalAmount,
      totalEquationCommissions,
      totalSalesRepCommissions,
      paidCommissions,
      pendingCommissions: totalSalesRepCommissions - paidCommissions
    };
  };

  const getSalesRepCommissionsByProject = (salesRepId: string) => {
    const projects = state.projects.filter(p => p.salesRepId === salesRepId);
    
    return projects.map(project => {
      const allProjectQuotes = state.quotes.filter(q => q.projectId === project.id);
      const projectQuotes = filterQuotesByDate(allProjectQuotes);
      
      const totalCommissions = projectQuotes.reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
      const paidCommissions = projectQuotes
        .filter(q => q.paymentStatus === 'paid')
        .reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
      const pendingCommissions = projectQuotes
        .filter(q => q.paymentStatus === 'pending' && q.status === 'collected')
        .reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
      
      return {
        project,
        quotes: projectQuotes,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        totalAmount: projectQuotes.reduce((sum, q) => sum + q.amountHT, 0)
      };
    });
  };

  const handleMarkAsPaid = (quoteId: string) => {
    const quote = state.quotes.find(q => q.id === quoteId);
    if (quote && quote.status === 'collected') {
      const updatedQuote = {
        ...quote,
        paymentStatus: 'paid' as const,
        paymentDate: new Date()
      };
      dispatch({ type: 'UPDATE_QUOTE', payload: updatedQuote });
    }
  };

  const handleCancelPayment = (quoteId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler ce paiement ? La commission repassera en statut "À payer".')) {
      const quote = state.quotes.find(q => q.id === quoteId);
      if (quote && quote.paymentStatus === 'paid') {
        const updatedQuote = {
          ...quote,
          paymentStatus: 'pending' as const,
          paymentDate: undefined
        };
        dispatch({ type: 'UPDATE_QUOTE', payload: updatedQuote });
      }
    }
  };

  const handleExportPDF = () => {
    if (!selectedSalesRep) return;
    
    // Créer le contenu HTML pour l'export
    const { startDate, endDate } = getDateRange();
    const stats = getSalesRepStats(selectedSalesRep.id);
    const projectsData = getSalesRepCommissionsByProject(selectedSalesRep.id);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport de commissions - ${selectedSalesRep.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #000630; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #EDBD35; padding-bottom: 20px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #000630; }
          .stat-label { font-size: 12px; color: #666; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .project-title { background-color: #000630; color: white; font-weight: bold; }
          .amount { font-weight: bold; }
          .pending { color: #dc2626; }
          .paid { color: #16a34a; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ÉQUATION TRAVAUX</h1>
          <h2>Rapport de commissions - ${selectedSalesRep.name}</h2>
          <p>Période : ${formatDate(startDate)} au ${formatDate(endDate)}</p>
          <p>Généré le ${formatDate(new Date())}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total des commissions ÉQUATION</div>
            <div class="stat-value">${formatCurrency(stats.totalEquationCommissions)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Déjà payé</div>
            <div class="stat-value paid">${formatCurrency(stats.paidCommissions)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">À payer</div>
            <div class="stat-value ${stats.pendingCommissions > 0 ? 'pending' : 'paid'}">${formatCurrency(stats.pendingCommissions)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Montant Travaux HT Signés</div>
            <div class="stat-value">${formatCurrency(stats.totalAmount)}</div>
          </div>
        </div>

        ${projectsData.map(projectData => `
          <h3 class="project-title" style="padding: 10px; margin: 20px 0 10px 0;">${projectData.project.name}</h3>
          <p><strong>Adresse :</strong> ${projectData.project.address}</p>
          <p><strong>Date de création :</strong> ${formatDate(projectData.project.createdAt)}</p>
          
          <table>
            <tr>
              <th>Montant Travaux HT Signés</th>
              <th>Commission totale</th>
              <th>Déjà payé</th>
              <th>À payer</th>
            </tr>
            <tr>
              <td class="amount">${formatCurrency(projectData.totalAmount)}</td>
              <td class="amount">${formatCurrency(projectData.totalCommissions)}</td>
              <td class="amount paid">${formatCurrency(projectData.paidCommissions)}</td>
              <td class="amount ${projectData.pendingCommissions > 0 ? 'pending' : 'paid'}">${formatCurrency(projectData.pendingCommissions)}</td>
            </tr>
          </table>

          ${projectData.quotes.length > 0 ? `
            <table>
              <tr>
                <th>Entreprise</th>
                <th>Montant HT</th>
                <th>Statut</th>
                <th>Commission</th>
                <th>Paiement</th>
                <th>Date</th>
              </tr>
              ${projectData.quotes.map(quote => `
                <tr>
                  <td>${quote.companyName}</td>
                  <td class="amount">${formatCurrency(quote.amountHT)}</td>
                  <td>${quote.status === 'billed' ? 'Facturé' : 'Encaissé'}</td>
                  <td class="amount">${formatCurrency(quote.salesRepCommissionAmount)} (${quote.salesRepCommissionRate}%)</td>
                  <td class="${quote.paymentStatus === 'paid' ? 'paid' : 'pending'}">${quote.paymentStatus === 'paid' ? 'Payé' : 'À payer'}</td>
                  <td>${formatDate(quote.createdAt)}</td>
                </tr>
              `).join('')}
            </table>
          ` : '<p><em>Aucun devis pour cette période</em></p>'}
        `).join('')}

        <div class="footer">
          <p>ÉQUATION TRAVAUX - Rapport généré automatiquement</p>
        </div>
      </body>
      </html>
    `;

    // Créer et télécharger le fichier
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions-${selectedSalesRep.name.replace(/\s+/g, '-')}-${formatDate(new Date()).replace(/\//g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'current-month':
        return 'Mois en cours';
      case 'previous-month':
        return 'Mois précédent';
      case 'current-year':
        return 'Année en cours';
      case 'custom':
        return 'Période personnalisée';
      default:
        return 'Mois en cours';
    }
  };

  // Calculer les statistiques globales avec les filtres appliqués
  const getGlobalStats = () => {
    const allQuotes = state.quotes;
    const filteredQuotes = filterQuotesByDate(allQuotes);
    
    const totalPending = filteredQuotes
      .filter(q => q.paymentStatus === 'pending' && q.status === 'collected')
      .reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
    
    const totalPaid = filteredQuotes
      .filter(q => q.paymentStatus === 'paid')
      .reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
    
    const totalCA = filteredQuotes.reduce((sum, q) => sum + q.amountHT, 0);
    
    return { totalPending, totalPaid, totalCA };
  };

  const globalStats = getGlobalStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-equation-navy mb-2">Équipe commerciale</h1>
          <p className="text-gray-600 text-lg">Gestion de l'équipe et suivi des performances</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation hover:shadow-equation-lg transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Nouveau chargé d'affaires
        </button>
      </div>

      {/* Filtres de période */}
      <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="h-6 w-6 text-equation-navy" />
          <h3 className="text-lg font-bold text-equation-navy">Filtres par période</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sélecteur de période */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-equation-navy">
              Période d'analyse
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 bg-gray-50 focus:bg-equation-white"
            >
              <option value="current-month">Mois en cours</option>
              <option value="previous-month">Mois précédent</option>
              <option value="current-year">Année en cours</option>
              <option value="custom">Période personnalisée</option>
            </select>
          </div>

          {/* Dates personnalisées */}
          {dateFilter === 'custom' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-equation-navy">
                  Date de début
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-equation-navy">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                />
              </div>
            </>
          )}

          {/* Indicateur de période active */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-equation-navy">
              Période analysée
            </label>
            <div className="px-4 py-3 bg-equation-navy/5 border border-equation-navy/10 rounded-xl">
              <div className="text-sm font-medium text-equation-navy">
                {getDateFilterLabel()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {(() => {
                  const { startDate, endDate } = getDateRange();
                  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats avec filtres appliqués */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Équipe active</p>
              <p className="text-3xl font-bold text-equation-navy">{state.salesReps.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total des chargés d'affaires</p>
            </div>
            <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">CA équipe</p>
              <p className="text-3xl font-bold text-equation-navy">
                {formatCurrency(globalStats.totalCA)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Période sélectionnée</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Commissions à payer</p>
              <p className="text-3xl font-bold text-warning-600">
                {formatCurrency(globalStats.totalPending)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Période sélectionnée</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Commissions payées</p>
              <p className="text-3xl font-bold text-success-600">
                {formatCurrency(globalStats.totalPaid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Période sélectionnée</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <Award className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Reps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.salesReps.map((salesRep, index) => {
          const stats = getSalesRepStats(salesRep.id);
          
          return (
            <div key={salesRep.id} className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6 hover:shadow-equation-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-equation-white font-bold text-lg ${
                    index === 0 ? 'bg-equation-navy' : 'bg-equation-gold text-equation-navy'
                  }`}>
                    {salesRep.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-bold text-equation-navy cursor-pointer hover:text-equation-gold transition-colors duration-200"
                      onClick={() => handleShowCommissionDetail(salesRep)}
                    >
                      {salesRep.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">Chargé d'affaires</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditSalesRep(salesRep)}
                    className="p-2 text-gray-400 hover:text-equation-gold hover:bg-equation-gold/10 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSalesRep(salesRep.id)}
                    className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {salesRep.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-3 text-equation-gold" />
                    {salesRep.email}
                  </div>
                )}
                {salesRep.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-equation-gold" />
                    {salesRep.phone}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-equation-navy/5 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">Chantiers</p>
                    <p className="text-xl font-bold text-equation-navy">{stats.projectsCount}</p>
                  </div>
                  <div className="text-center p-3 bg-equation-gold/10 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">Devis</p>
                    <p className="text-xl font-bold text-equation-navy">{stats.quotesCount}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Montant Travaux HT Signés</span>
                    <span className="font-bold text-equation-navy">
                      {formatCurrency(stats.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Commissions dues</span>
                    <span className="font-bold text-equation-gold">
                      {formatCurrency(stats.totalSalesRepCommissions)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">En attente</span>
                    <span className={`font-bold ${stats.pendingCommissions > 0 ? 'text-warning-600' : 'text-gray-400'}`}>
                      {formatCurrency(stats.pendingCommissions)}
                    </span>
                  </div>
                </div>
              </div>

              {stats.pendingCommissions > 0 && (
                <div className="mt-6 p-4 bg-warning-50 rounded-xl border border-warning-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-warning-500 rounded-full flex-shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-warning-800">
                        Commission en attente
                      </span>
                      <p className="text-xs text-warning-700 mt-1">
                        {formatCurrency(stats.pendingCommissions)} à verser
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {state.salesReps.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucun chargé d'affaires</h3>
          <p className="text-gray-600 mb-8 text-lg">Commencez par ajouter votre premier chargé d'affaires</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation"
          >
            <Plus className="h-5 w-5" />
            Nouveau chargé d'affaires
          </button>
        </div>
      )}

      {/* Sales Rep Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-equation-white rounded-2xl max-w-md w-full p-8 shadow-equation-xl">
            <h2 className="text-2xl font-bold text-equation-navy mb-6">
              {editingSalesRep ? 'Modifier le chargé d\'affaires' : 'Nouveau chargé d\'affaires'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="jean.dupont@equation-travaux.fr"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="06.12.34.56.78"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold"
                >
                  {editingSalesRep ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commission Detail Modal */}
      {showCommissionDetail && selectedSalesRep && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-equation-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-equation-xl">
            {/* Header avec filtres et export */}
            <div className="flex items-center justify-between p-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-equation-navy/10 rounded-2xl flex items-center justify-center">
                  <User className="h-8 w-8 text-equation-navy" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-equation-navy">{selectedSalesRep.name}</h2>
                  <p className="text-gray-600 text-lg">Détail des commissions par chantier</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Bouton Export PDF */}
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-medium"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>

                <button
                  onClick={() => setShowCommissionDetail(false)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Indicateur de période */}
              <div className="bg-equation-navy/5 rounded-xl p-4 border border-equation-navy/10">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-equation-navy" />
                  <div>
                    <p className="font-semibold text-equation-navy">Période sélectionnée : {getDateFilterLabel()}</p>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const { startDate, endDate } = getDateRange();
                        return `Du ${formatDate(startDate)} au ${formatDate(endDate)}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {(() => {
                  const stats = getSalesRepStats(selectedSalesRep.id);
                  return (
                    <>
                      <div className="bg-equation-gold/10 rounded-xl p-6 border border-equation-gold/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total des commissions ÉQUATION</p>
                            <p className="text-2xl font-bold text-equation-navy">{formatCurrency(stats.totalEquationCommissions)}</p>
                          </div>
                          <div className="w-12 h-12 bg-equation-gold/20 rounded-xl flex items-center justify-center">
                            <Euro className="h-6 w-6 text-equation-navy" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-success-50 rounded-xl p-6 border border-success-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Déjà payé</p>
                            <p className="text-2xl font-bold text-success-700">{formatCurrency(stats.paidCommissions)}</p>
                          </div>
                          <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-success-600" />
                          </div>
                        </div>
                      </div>
                      <div className={`rounded-xl p-6 border ${
                        stats.pendingCommissions > 0 
                          ? 'bg-error-50 border-error-200' 
                          : 'bg-success-50 border-success-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">À payer</p>
                            <p className={`text-2xl font-bold ${
                              stats.pendingCommissions > 0 
                                ? 'text-error-700' 
                                : 'text-success-700'
                            }`}>
                              {formatCurrency(stats.pendingCommissions)}
                            </p>
                          </div>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            stats.pendingCommissions > 0 
                              ? 'bg-error-100' 
                              : 'bg-success-100'
                          }`}>
                            <Target className={`h-6 w-6 ${
                              stats.pendingCommissions > 0 
                                ? 'text-error-600' 
                                : 'text-success-600'
                            }`} />
                          </div>
                        </div>
                      </div>
                      <div className="bg-equation-navy/5 rounded-xl p-6 border border-equation-navy/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Montant Travaux HT Signés</p>
                            <p className="text-2xl font-bold text-equation-navy">{formatCurrency(stats.totalAmount)}</p>
                          </div>
                          <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
                            <Building className="h-6 w-6 text-equation-navy" />
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Projects Detail */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-equation-navy">Détail par chantier</h3>
                
                {(() => {
                  const projectsData = getSalesRepCommissionsByProject(selectedSalesRep.id);
                  
                  if (projectsData.length === 0 || projectsData.every(p => p.quotes.length === 0)) {
                    return (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="w-16 h-16 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Building className="h-8 w-8 text-equation-navy" />
                        </div>
                        <h4 className="text-lg font-bold text-equation-navy mb-2">Aucune donnée</h4>
                        <p className="text-gray-600">Aucun devis trouvé pour la période sélectionnée</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {projectsData.filter(p => p.quotes.length > 0).map((projectData) => (
                        <div key={projectData.project.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
                                <Building className="h-6 w-6 text-equation-navy" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-equation-navy">{projectData.project.name}</h4>
                                <p className="text-sm text-gray-600">{projectData.project.address}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Créé le</p>
                              <p className="text-sm font-medium text-equation-navy">{formatDate(projectData.project.createdAt)}</p>
                            </div>
                          </div>

                          {/* Project Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-equation-white rounded-xl p-4 border border-gray-200">
                              <p className="text-xs text-gray-600 mb-1">Montant Travaux HT Signés</p>
                              <p className="text-lg font-bold text-equation-navy">{formatCurrency(projectData.totalAmount)}</p>
                            </div>
                            <div className="bg-equation-white rounded-xl p-4 border border-gray-200">
                              <p className="text-xs text-gray-600 mb-1">Commission totale</p>
                              <p className="text-lg font-bold text-equation-gold">{formatCurrency(projectData.totalCommissions)}</p>
                            </div>
                            <div className="bg-equation-white rounded-xl p-4 border border-gray-200">
                              <p className="text-xs text-gray-600 mb-1">Déjà payé</p>
                              <p className="text-lg font-bold text-success-600">{formatCurrency(projectData.paidCommissions)}</p>
                            </div>
                            <div className={`rounded-xl p-4 border ${
                              projectData.pendingCommissions > 0 
                                ? 'bg-error-50 border-error-200' 
                                : 'bg-success-50 border-success-200'
                            }`}>
                              <p className="text-xs text-gray-600 mb-1">À payer</p>
                              <p className={`text-lg font-bold ${
                                projectData.pendingCommissions > 0 
                                  ? 'text-error-700' 
                                  : 'text-success-700'
                              }`}>
                                {formatCurrency(projectData.pendingCommissions)}
                              </p>
                            </div>
                          </div>

                          {/* Quotes Detail */}
                          {projectData.quotes.length > 0 && (
                            <div className="bg-equation-white rounded-xl overflow-hidden border border-gray-200">
                              <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
                                <h5 className="font-semibold text-equation-navy">Devis associés ({projectData.quotes.length})</h5>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Entreprise
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Montant HT
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Statut
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Commission
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Paiement
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date
                                      </th>
                                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {projectData.quotes.map((quote) => (
                                      <tr key={quote.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-4 py-3 text-sm font-medium text-equation-navy">
                                          {quote.companyName}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-equation-navy">
                                          {formatCurrency(quote.amountHT)}
                                        </td>
                                        <td className="px-4 py-3">
                                          <StatusBadge status={quote.status} type="quote" />
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm font-semibold text-equation-navy">
                                            {formatCurrency(quote.salesRepCommissionAmount)}
                                          </div>
                                          <div className="text-xs text-equation-gold font-medium">
                                            {quote.salesRepCommissionRate}%
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex flex-col gap-1">
                                            <StatusBadge status={quote.paymentStatus} type="payment" />
                                            {quote.status === 'billed' && quote.paymentStatus === 'pending' && (
                                              <span className="text-xs text-gray-500 italic">
                                                Devis non encaissé
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                          {formatDate(quote.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            {quote.paymentStatus === 'pending' && quote.status === 'collected' ? (
                                              <button
                                                onClick={() => handleMarkAsPaid(quote.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-success-100 text-success-700 text-xs font-semibold rounded-lg hover:bg-success-200 transition-all duration-200 border border-success-200"
                                              >
                                                <CheckCircle className="h-3 w-3" />
                                                Payer
                                              </button>
                                            ) : quote.paymentStatus === 'paid' ? (
                                              <button
                                                onClick={() => handleCancelPayment(quote.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-error-100 text-error-700 text-xs font-semibold rounded-lg hover:bg-error-200 transition-all duration-200 border border-error-200"
                                              >
                                                <X className="h-3 w-3" />
                                                Annuler
                                              </button>
                                            ) : null}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}