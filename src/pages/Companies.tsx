import React, { useState } from 'react';
import { Plus, Edit, Trash2, Building, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Company } from '../types';
import FilterBar from '../components/FilterBar';
import { formatDate } from '../utils/calculations';

export default function Companies() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Fonction pour filtrer les entreprises
  const getFilteredCompanies = () => {
    let filteredCompanies = [...state.companies];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredCompanies = filteredCompanies.filter(company => 
        company.name.toLowerCase().includes(query) ||
        (company.email && company.email.toLowerCase().includes(query)) ||
        (company.phone && company.phone.toLowerCase().includes(query)) ||
        (company.address && company.address.toLowerCase().includes(query))
      );
    }

    // Filtre par date
    if (startDate) {
      const start = new Date(startDate);
      filteredCompanies = filteredCompanies.filter(company => 
        company.createdAt >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Fin de journée
      filteredCompanies = filteredCompanies.filter(company => 
        company.createdAt <= end
      );
    }

    return filteredCompanies;
  };

  const filteredCompanies = getFilteredCompanies();

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || ''
    });
    setShowForm(true);
  };

  const handleDeleteCompany = (companyId: string) => {
    const companyToDelete = state.companies.find(c => c.id === companyId);
    if (!companyToDelete) return;

    // Vérifier si l'entreprise est utilisée dans des devis
    const hasQuotes = state.quotes.some(q => q.companyName === companyToDelete.name);
    
    if (hasQuotes) {
      alert('Impossible de supprimer cette entreprise car elle est utilisée dans des devis.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      dispatch({ type: 'DELETE_COMPANY', payload: companyId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Le nom de l\'entreprise est obligatoire');
      return;
    }

    // Vérifier si une entreprise avec le même nom existe déjà
    const existingCompany = state.companies.find(
      company => company.name.toLowerCase() === formData.name.trim().toLowerCase() && 
                 company.id !== editingCompany?.id
    );

    if (existingCompany) {
      alert('Une entreprise avec ce nom existe déjà');
      return;
    }

    const companyData: Company = {
      id: editingCompany?.id || Date.now().toString(),
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      createdAt: editingCompany?.createdAt || new Date()
    };

    if (editingCompany) {
      dispatch({ type: 'UPDATE_COMPANY', payload: companyData });
    } else {
      dispatch({ type: 'ADD_COMPANY', payload: companyData });
    }

    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchQuery || startDate || endDate;

  // Obtenir les statistiques d'utilisation des entreprises
  const getCompanyStats = (companyName: string) => {
    const quotes = state.quotes.filter(q => q.companyName === companyName);
    const totalAmount = quotes.reduce((sum, q) => sum + q.amountHT, 0);
    const lastQuoteDate = quotes.length > 0 
      ? new Date(Math.max(...quotes.map(q => q.createdAt.getTime())))
      : null;
    
    return {
      quotesCount: quotes.length,
      totalAmount,
      lastQuoteDate
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-equation-navy mb-2">Entreprises</h1>
          <p className="text-gray-600 text-lg">Gestion du carnet d'adresses des entreprises</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation hover:shadow-equation-lg transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Nouvelle entreprise
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        onSearch={setSearchQuery}
        onDateRangeFilter={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        placeholder="Rechercher une entreprise..."
        searchValue={searchQuery}
        startDate={startDate}
        endDate={endDate}
        showSalesRepFilter={false}
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
              {(startDate || endDate) && (
                <span className="px-2 py-1 bg-equation-gold/20 text-equation-navy rounded-lg text-xs font-medium">
                  Période: {startDate || '...'} → {endDate || '...'}
                </span>
              )}
              <span className="text-xs text-gray-500">
                ({filteredCompanies.length} résultat{filteredCompanies.length > 1 ? 's' : ''})
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total entreprises</p>
              <p className="text-3xl font-bold text-equation-navy">{filteredCompanies.length}</p>
              {hasActiveFilters && (
                <p className="text-xs text-gray-500 mt-1">sur {state.companies.length} total</p>
              )}
            </div>
            <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Entreprises actives</p>
              <p className="text-3xl font-bold text-success-600">
                {state.companies.filter(c => 
                  state.quotes.some(q => q.companyName === c.name)
                ).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Avec au moins un devis</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Nouvelles ce mois</p>
              <p className="text-3xl font-bold text-equation-gold">
                {state.companies.filter(c => {
                  const now = new Date();
                  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  return c.createdAt >= startOfMonth;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-equation-gold/20 rounded-xl flex items-center justify-center">
              <Plus className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCompanies.map((company) => {
          const stats = getCompanyStats(company.name);
          
          return (
            <div key={company.id} className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6 hover:shadow-equation-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-equation-navy/10 rounded-xl flex items-center justify-center">
                    <Building className="h-7 w-7 text-equation-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-equation-navy mb-1 truncate">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Créée le {formatDate(company.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditCompany(company)}
                    className="p-2 text-gray-400 hover:text-equation-gold hover:bg-equation-gold/10 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(company.id)}
                    className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {company.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-3 text-equation-gold flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-equation-gold flex-shrink-0" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-3 text-equation-gold flex-shrink-0 mt-0.5" />
                    <span className="break-words">{company.address}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-equation-navy/5 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">Devis</p>
                    <p className="text-xl font-bold text-equation-navy">{stats.quotesCount}</p>
                  </div>
                  <div className="text-center p-3 bg-equation-gold/10 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">CA total</p>
                    <p className="text-lg font-bold text-equation-navy">
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR',
                        notation: stats.totalAmount > 999999 ? 'compact' : 'standard',
                        maximumFractionDigits: 0
                      }).format(stats.totalAmount)}
                    </p>
                  </div>
                </div>
                
                {stats.lastQuoteDate && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Dernier devis</p>
                    <p className="text-sm font-medium text-equation-navy">
                      {formatDate(stats.lastQuoteDate)}
                    </p>
                  </div>
                )}

                {stats.quotesCount === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 italic">Aucun devis enregistré</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State - Filtered */}
      {filteredCompanies.length === 0 && state.companies.length > 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucune entreprise trouvée</h3>
          <p className="text-gray-600 mb-8 text-lg">Aucune entreprise ne correspond aux filtres appliqués</p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-6 py-3 border border-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold hover:text-equation-navy transition-all duration-200 font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Empty State - No companies at all */}
      {state.companies.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucune entreprise</h3>
          <p className="text-gray-600 mb-8 text-lg">Commencez par ajouter votre première entreprise</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation"
          >
            <Plus className="h-5 w-5" />
            Nouvelle entreprise
          </button>
        </div>
      )}

      {/* Company Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-equation-white rounded-2xl max-w-md w-full p-8 shadow-equation-xl">
            <h2 className="text-2xl font-bold text-equation-navy mb-6">
              {editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="123 Rue de la Construction, 75001 Paris"
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
                  {editingCompany ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information Banner */}
      <div className="bg-equation-navy/5 rounded-2xl p-6 border border-equation-navy/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building className="h-6 w-6 text-equation-navy" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-equation-navy mb-2">Gestion des entreprises</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Carnet d'adresses centralisé</strong> : Toutes vos entreprises partenaires en un seul endroit</p>
              <p>• <strong>Suivi automatique</strong> : Nombre de devis et chiffre d'affaires par entreprise</p>
              <p>• <strong>Protection des données</strong> : Impossible de supprimer une entreprise utilisée dans des devis</p>
              <p>• <strong>Recherche avancée</strong> : Filtrez par nom, email, téléphone ou adresse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}