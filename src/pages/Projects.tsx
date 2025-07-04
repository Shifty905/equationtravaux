import React, { useState } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin, User, Calendar, Eye, FileText, Euro, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Project } from '../types';
import FilterBar from '../components/FilterBar';
import ProjectDetail from '../components/ProjectDetail';
import { formatDate, formatCurrency } from '../utils/calculations';

export default function Projects() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSalesRepId, setSelectedSalesRepId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    salesRepId: ''
  });

  // Fonction pour filtrer les projets
  const getFilteredProjects = () => {
    let filteredProjects = [...state.projects];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.address.toLowerCase().includes(query) ||
        (state.salesReps.find(s => s.id === project.salesRepId)?.name.toLowerCase().includes(query))
      );
    }

    // Filtre par chargé d'affaires
    if (selectedSalesRepId) {
      filteredProjects = filteredProjects.filter(project => 
        project.salesRepId === selectedSalesRepId
      );
    }

    // Filtre par date
    if (startDate) {
      const start = new Date(startDate);
      filteredProjects = filteredProjects.filter(project => 
        project.createdAt >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Fin de journée
      filteredProjects = filteredProjects.filter(project => 
        project.createdAt <= end
      );
    }

    return filteredProjects;
  };

  const filteredProjects = getFilteredProjects();

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      address: project.address,
      salesRepId: project.salesRepId
    });
    setShowForm(true);
  };

  const handleDeleteProject = (projectId: string) => {
    const hasQuotes = state.quotes.some(q => q.projectId === projectId);
    if (hasQuotes) {
      alert('Impossible de supprimer ce chantier car il contient des devis.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chantier ?')) {
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    }
  };

  const handleViewProject = (project: Project) => {
    dispatch({ type: 'SELECT_PROJECT', payload: project });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const projectData: Project = {
      id: editingProject?.id || Date.now().toString(),
      name: formData.name.trim(),
      address: formData.address.trim(),
      salesRepId: formData.salesRepId || '',
      createdAt: editingProject?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingProject) {
      dispatch({ type: 'UPDATE_PROJECT', payload: projectData });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: projectData });
    }

    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({ name: '', address: '', salesRepId: '' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSalesRepId('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchQuery || selectedSalesRepId || startDate || endDate;

  // Calculer les statistiques pour chaque projet
  const getProjectStats = (projectId: string) => {
    const projectQuotes = state.quotes.filter(q => q.projectId === projectId);
    const totalAmount = projectQuotes.reduce((sum, q) => sum + q.amountHT, 0);
    const collectedAmount = projectQuotes
      .filter(q => q.status === 'collected')
      .reduce((sum, q) => sum + q.amountHT, 0);
    const pendingAmount = projectQuotes
      .filter(q => q.status === 'billed')
      .reduce((sum, q) => sum + q.amountHT, 0);
    const equationCommissions = projectQuotes
      .reduce((sum, q) => sum + q.equationCommissionAmount, 0);
    
    return {
      quotesCount: projectQuotes.length,
      totalAmount,
      collectedAmount,
      pendingAmount,
      equationCommissions,
      conversionRate: projectQuotes.length > 0 ? (projectQuotes.filter(q => q.status === 'collected').length / projectQuotes.length) * 100 : 0
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-equation-navy mb-2">Chantiers</h1>
          <p className="text-gray-600 text-lg">Gestion des projets et chantiers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation hover:shadow-equation-lg transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Nouveau chantier
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
        placeholder="Rechercher un chantier..."
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
                ({filteredProjects.length} résultat{filteredProjects.length > 1 ? 's' : ''})
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
              <p className="text-sm font-medium text-gray-600 mb-1">Total chantiers</p>
              <p className="text-3xl font-bold text-equation-navy">{filteredProjects.length}</p>
              {hasActiveFilters && (
                <p className="text-xs text-gray-500 mt-1">sur {state.projects.length} total</p>
              )}
            </div>
            <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">CA total</p>
              <p className="text-3xl font-bold text-equation-navy">
                {formatCurrency(filteredProjects.reduce((sum, project) => {
                  const stats = getProjectStats(project.id);
                  return sum + stats.totalAmount;
                }, 0))}
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
                {formatCurrency(filteredProjects.reduce((sum, project) => {
                  const stats = getProjectStats(project.id);
                  return sum + stats.equationCommissions;
                }, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-equation-gold/20 rounded-xl flex items-center justify-center">
              <Calculator className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Chantiers avec CA</p>
              <p className="text-3xl font-bold text-equation-navy">
                {state.projects.filter(p => 
                  state.quotes.some(q => q.projectId === p.id)
                ).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Avec au moins un devis</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => {
          const salesRep = state.salesReps.find(rep => rep.id === project.salesRepId);
          const stats = getProjectStats(project.id);
          
          return (
            <div key={project.id} className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6 hover:shadow-equation-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-equation-navy/10 rounded-xl flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-equation-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-equation-navy mb-1 truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Créé le {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleViewProject(project)}
                    className="p-2 text-gray-400 hover:text-equation-gold hover:bg-equation-gold/10 rounded-lg transition-all duration-200"
                    title="Voir détails"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditProject(project)}
                    className="p-2 text-gray-400 hover:text-equation-gold hover:bg-equation-gold/10 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-3 text-equation-gold flex-shrink-0 mt-0.5" />
                  <span className="break-words">{project.address}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-3 text-equation-gold flex-shrink-0" />
                  <span>{salesRep?.name || 'Aucun CA assigné'}</span>
                </div>
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
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">CA encaissé</span>
                    <span className="font-bold text-success-600">
                      {formatCurrency(stats.collectedAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">En attente</span>
                    <span className="font-bold text-warning-600">
                      {formatCurrency(stats.pendingAmount)}
                    </span>
                  </div>
                  {stats.quotesCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Taux conversion</span>
                      <span className="font-bold text-equation-navy">
                        {Math.round(stats.conversionRate)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {stats.quotesCount === 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 italic">Aucun devis enregistré</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State - Filtered */}
      {filteredProjects.length === 0 && state.projects.length > 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucun chantier trouvé</h3>
          <p className="text-gray-600 mb-8 text-lg">Aucun chantier ne correspond aux filtres appliqués</p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-6 py-3 border border-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold hover:text-equation-navy transition-all duration-200 font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Empty State - No projects at all */}
      {state.projects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucun chantier</h3>
          <p className="text-gray-600 mb-8 text-lg">Commencez par créer votre premier chantier</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation"
          >
            <Plus className="h-5 w-5" />
            Nouveau chantier
          </button>
        </div>
      )}

      {/* Project Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-equation-white rounded-2xl max-w-md w-full p-8 shadow-equation-xl">
            <h2 className="text-2xl font-bold text-equation-navy mb-6">
              {editingProject ? 'Modifier le chantier' : 'Nouveau chantier'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Nom du chantier *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="Rénovation Maison Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Adresse *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-equation-navy mb-2">
                  Chargé d'affaires
                </label>
                <select 
                  value={formData.salesRepId}
                  onChange={(e) => setFormData({ ...formData, salesRepId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200"
                >
                  <option value="">Sélectionner un CA...</option>
                  {state.salesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
                {state.salesReps.length === 0 && (
                  <p className="text-sm text-warning-600 mt-1">
                    Aucun chargé d'affaires disponible. Créez-en un d'abord.
                  </p>
                )}
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
                  {editingProject ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      <ProjectDetail 
        isOpen={!!state.selectedProject} 
        onClose={() => dispatch({ type: 'SELECT_PROJECT', payload: undefined })} 
      />

      {/* Information Banner */}
      <div className="bg-equation-navy/5 rounded-2xl p-6 border border-equation-navy/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-equation-navy" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-equation-navy mb-2">Gestion des chantiers</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Organisation centralisée</strong> : Tous vos chantiers regroupés en un seul endroit</p>
              <p>• <strong>Suivi automatique</strong> : CA, commissions et performances calculés automatiquement</p>
              <p>• <strong>Liaisons intelligentes</strong> : Impossible de supprimer un chantier avec des devis associés</p>
              <p>• <strong>Recherche avancée</strong> : Filtrez par nom, adresse, chargé d'affaires ou période</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}