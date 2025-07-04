import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, Euro, TrendingUp, Building, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Quote, Company } from '../types';
import FilterBar from '../components/FilterBar';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatCurrency, calculateCommissions } from '../utils/calculations';

export default function Quotes() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSalesRepId, setSelectedSalesRepId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    projectId: '',
    companyName: '',
    amountHT: '',
    status: 'billed' as const,
    equationCommissionRate: '5',
    salesRepCommissionRate: '40',
    notes: '',
    createdAt: ''
  });
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Check if we should open the form automatically and pre-select project
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('new') === 'true') {
      setShowForm(true);
      
      // Check if there's a pre-selected project
      const preselectedProjectId = localStorage.getItem('preselected-project-id');
      if (preselectedProjectId) {
        setFormData(prev => ({ ...prev, projectId: preselectedProjectId }));
        localStorage.removeItem('preselected-project-id'); // Clean up
      }
      
      // Clean the URL
      navigate('/quotes', { replace: true });
    }
  }, [location, navigate]);

  // Fonction pour filtrer les devis
  const getFilteredQuotes = () => {
    let filteredQuotes = [...state.quotes];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredQuotes = filteredQuotes.filter(quote => {
        const project = state.projects.find(p => p.id === quote.projectId);
        const salesRep = state.salesReps.find(s => s.id === project?.salesRepId);
        
        return quote.companyName.toLowerCase().includes(query) ||
               (project?.name.toLowerCase().includes(query)) ||
               (salesRep?.name.toLowerCase().includes(query));
      });
    }

    // Filtre par chargé d'affaires
    if (selectedSalesRepId) {
      filteredQuotes = filteredQuotes.filter(quote => {
        const project = state.projects.find(p => p.id === quote.projectId);
        return project?.salesRepId === selectedSalesRepId;
      });
    }

    // Filtre par date
    if (startDate) {
      const start = new Date(startDate);
      filteredQuotes = filteredQuotes.filter(quote => 
        quote.createdAt >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Fin de journée
      filteredQuotes = filteredQuotes.filter(quote => 
        quote.createdAt <= end
      );
    }

    return filteredQuotes;
  };

  const filteredQuotes = getFilteredQuotes();

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      projectId: quote.projectId,
      companyName: quote.companyName,
      amountHT: quote.amountHT.toString(),
      status: quote.status,
      equationCommissionRate: quote.equationCommissionRate.toString(),
      salesRepCommissionRate: quote.salesRepCommissionRate.toString(),
      notes: quote.notes || '',
      createdAt: quote.createdAt.toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      dispatch({ type: 'DELETE_QUOTE', payload: quoteId });
    }
  };

  const handleCreateNewCompany = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCompanyData.name.trim()) {
      alert('Le nom de l\'entreprise est obligatoire');
      return;
    }

    // Check if company already exists
    const existingCompany = state.companies.find(
      company => company.name.toLowerCase() === newCompanyData.name.trim().toLowerCase()
    );

    if (existingCompany) {
      alert('Cette entreprise existe déjà');
      return;
    }

    const companyData: Company = {
      id: Date.now().toString(),
      name: newCompanyData.name.trim(),
      email: newCompanyData.email.trim() || undefined,
      phone: newCompanyData.phone.trim() || undefined,
      address: newCompanyData.address.trim() || undefined,
      createdAt: new Date()
    };

    // Add company to database
    dispatch({ type: 'ADD_COMPANY', payload: companyData });

    // Set the new company as selected in the quote form
    setFormData({ ...formData, companyName: companyData.name });

    // Reset and close the new company form
    setNewCompanyData({ name: '', email: '', phone: '', address: '' });
    setShowNewCompanyForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.companyName.trim() || !formData.amountHT) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amountHT = parseFloat(formData.amountHT);
    const equationRate = parseFloat(formData.equationCommissionRate);
    const salesRepRate = parseFloat(formData.salesRepCommissionRate);

    if (isNaN(amountHT) || amountHT <= 0) {
      alert('Le montant HT doit être un nombre positif');
      return;
    }

    // Validation de la date
    let createdAtDate = new Date();
    if (formData.createdAt) {
      createdAtDate = new Date(formData.createdAt);
      if (isNaN(createdAtDate.getTime())) {
        alert('La date saisie n\'est pas valide');
        return;
      }
    }

    const { equationAmount, salesRepAmount } = calculateCommissions(amountHT, equationRate, salesRepRate);

    const quoteData: Quote = {
      id: editingQuote?.id || Date.now().toString(),
      projectId: formData.projectId,
      companyName: formData.companyName.trim(),
      amountHT,
      status: formData.status,
      billingDate: formData.status === 'billed' ? createdAtDate : editingQuote?.billingDate,
      collectionDate: formData.status === 'collected' ? createdAtDate : editingQuote?.collectionDate,
      paymentDate: editingQuote?.paymentDate,
      equationCommissionRate: equationRate,
      salesRepCommissionRate: salesRepRate,
      equationCommissionAmount: equationAmount,
      salesRepCommissionAmount: salesRepAmount,
      paymentStatus: editingQuote?.paymentStatus || 'pending',
      notes: formData.notes.trim() || undefined,
      createdAt: createdAtDate,
      updatedAt: new Date()
    };

    if (editingQuote) {
      dispatch({ type: 'UPDATE_QUOTE', payload: quoteData });
    } else {
      dispatch({ type: 'ADD_QUOTE', payload: quoteData });
    }

    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingQuote(null);
    setShowNewCompanyForm(false);
    setFormData({
      projectId: '',
      companyName: '',
      amountHT: '',
      status: 'billed',
      equationCommissionRate: '5',
      salesRepCommissionRate: '40',
      notes: '',
      createdAt: ''
    });
    setNewCompanyData({ name: '', email: '', phone: '', address: '' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSalesRepId('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchQuery || selectedSalesRepId || startDate || endDate;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-equation-navy mb-2">Devis</h1>
          <p className="text-gray-600 text-lg">Gestion des devis et suivi des commissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation hover:shadow-equation-lg transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Nouveau devis
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        onSearch={setSearchQuery}
        onSalesRepFilter={setSelectedSalesRepId}
        onDateRangeFilter={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        placeholder="Rechercher un devis..."
        searchValue={searchQuery}
        selectedSalesRepId={selectedSalesRepId}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="bg-equation-navy/5 rounded-xl p-4 border border-equation-navy/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Filtres actifs :</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-equation-gold/20 text-equation-navy rounded-lg text-xs font-medium">
                  Recherche: "{searchQuery}"
                </span>
              )}
              {selectedSalesRepId && (
                <span className="px-2 py-1 bg-equation-gold/20 text-equation-navy rounded-lg text-xs font-medium">
                  CA: {state.salesReps.find(r => r.id === selectedSalesRepId)?.name}
                </span>
              )}
              {(startDate || endDate) && (
                <span className="px-2 py-1 bg-equation-gold/20 text-equation-navy rounded-lg text-xs font-medium">
                  Période: {startDate || '...'} → {endDate || '...'}
                </span>
              )}
              <span className="text-xs text-gray-500">
                ({filteredQuotes.length} résultat{filteredQuotes.length > 1 ? 's' : ''})
              </span>
            </div>
            <button
              onClick={resetFilters}
              className="text-sm text-equation-gold hover:text-equation-gold-dark font-medium"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total devis</p>
              <p className="text-3xl font-bold text-equation-navy">{filteredQuotes.length}</p>
              {hasActiveFilters && (
                <p className="text-xs text-gray-500 mt-1">sur {state.quotes.length} total</p>
              )}
            </div>
            <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Montant total</p>
              <p className="text-3xl font-bold text-equation-navy">
                {formatCurrency(filteredQuotes.reduce((sum, q) => sum + q.amountHT, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <Euro className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Commissions ÉQUATION</p>
              <p className="text-3xl font-bold text-equation-navy">
                {formatCurrency(filteredQuotes.reduce((sum, q) => sum + q.equationCommissionAmount, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-equation-gold/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En attente de paiement</p>
              <p className="text-3xl font-bold text-warning-600">
                {filteredQuotes.filter(q => q.paymentStatus === 'pending' && q.status === 'collected').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Devis encaissés uniquement</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-equation-navy/5">
          <h3 className="text-xl font-bold text-equation-navy">Liste des devis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chantier / Entreprise
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
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-equation-white divide-y divide-gray-100">
              {filteredQuotes.map((quote) => {
                const project = state.projects.find(p => p.id === quote.projectId);
                const salesRep = state.salesReps.find(s => s.id === project?.salesRepId);

                return (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-equation-navy">
                          {project?.name || 'Projet supprimé'}
                        </div>
                        <div className="text-sm text-gray-600">{quote.companyName}</div>
                        <div className="text-xs text-gray-500">{salesRep?.name}</div>
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
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={quote.paymentStatus} type="payment" />
                        {quote.status === 'billed' && quote.paymentStatus === 'pending' && (
                          <span className="text-xs text-gray-500 italic">
                            Devis non encaissé
                          </span>
                        )}
                      </div>
                      {quote.paymentDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(quote.paymentDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="text-equation-gold hover:text-equation-gold-dark p-2 rounded-lg hover:bg-equation-gold/10 transition-all duration-200"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="text-error-600 hover:text-error-700 p-2 rounded-lg hover:bg-error-50 transition-all duration-200"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State - Filtered */}
      {filteredQuotes.length === 0 && state.quotes.length > 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucun devis trouvé</h3>
          <p className="text-gray-600 mb-8 text-lg">Aucun devis ne correspond aux filtres appliqués</p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-6 py-3 border border-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold hover:text-equation-navy transition-all duration-200 font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Empty State - No quotes at all */}
      {state.quotes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucun devis</h3>
          <p className="text-gray-600 mb-8 text-lg">Créez votre premier devis pour commencer</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation"
          >
            <Plus className="h-5 w-5" />
            Nouveau devis
          </button>
        </div>
      )}

      {/* Information Banner */}
      <div className="bg-equation-navy/5 rounded-2xl p-6 border border-equation-navy/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-equation-navy" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-equation-navy mb-2">Statuts des devis</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Facturé :</strong> Le devis a été facturé au client mais pas encore encaissé</p>
              <p>• <strong>Encaissé :</strong> Le paiement a été reçu et encaissé</p>
              <p>• <strong>Important :</strong> Les commissions ne peuvent être payées que si le devis est "Encaissé"</p>
              <p>• <strong>Date du devis :</strong> Vous pouvez modifier la date de création lors de l'édition</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-equation-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-equation-xl">
            <h2 className="text-2xl font-bold text-equation-navy mb-8">
              {editingQuote ? 'Modifier le devis' : 'Nouveau devis'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-equation-navy mb-2">
                    Chantier *
                  </label>
                  <select 
                    required
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  >
                    <option value="">Sélectionner un chantier...</option>
                    {state.projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                  {state.projects.length === 0 && (
                    <p className="text-sm text-warning-600 mt-1">
                      Aucun chantier disponible. Créez-en un d'abord.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-equation-navy mb-2">
                    Entreprise *
                  </label>
                  <div className="space-y-3">
                    <select 
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                    >
                      <option value="">Sélectionner une entreprise...</option>
                      {state.companies.map(company => (
                        <option key={company.id} value={company.name}>{company.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCompanyForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold/5 transition-all duration-200 font-medium"
                    >
                      <Building className="h-4 w-4" />
                      Créer une nouvelle entreprise
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-equation-navy mb-2">
                    Montant HT (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amountHT}
                    onChange={(e) => setFormData({ ...formData, amountHT: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                    placeholder="15000.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-equation-navy mb-2">
                    Statut
                  </label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  >
                    <option value="billed">Facturé</option>
                    <option value="collected">Encaissé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-equation-navy mb-2">
                    Commission ÉQUATION (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.equationCommissionRate}
                    onChange={(e) => setFormData({ ...formData, equationCommissionRate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-equation-navy mb-2">
                    Commission CA (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.salesRepCommissionRate}
                    onChange={(e) => setFormData({ ...formData, salesRepCommissionRate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                    placeholder="40.0"
                  />
                </div>
              </div>

              {/* Nouveau champ pour la date */}
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Date du devis
                </label>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-equation-gold" />
                  <input
                    type="date"
                    value={formData.createdAt}
                    onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {editingQuote 
                    ? 'Modifiez la date si nécessaire. Laissez vide pour conserver la date actuelle.'
                    : 'Laissez vide pour utiliser la date d\'aujourd\'hui.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Notes internes
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="Notes ou commentaires..."
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
                  {editingQuote ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Company Form Modal */}
      {showNewCompanyForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-equation-white rounded-2xl max-w-md w-full p-8 shadow-equation-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-equation-navy">Nouvelle entreprise</h3>
              <button
                onClick={() => setShowNewCompanyForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyData.name}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="Artisan Bâtiment Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newCompanyData.email}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="contact@entreprise.fr"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newCompanyData.phone}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="01.23.45.67.89"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Adresse
                </label>
                <textarea
                  rows={3}
                  value={newCompanyData.address}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="123 Rue de la Construction, 75001 Paris"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCompanyForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold"
                >
                  Créer et sélectionner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}