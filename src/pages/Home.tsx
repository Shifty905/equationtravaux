import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Building2, 
  FileText, 
  Users, 
  Calculator, 
  Building,
  TrendingUp,
  Euro,
  Target,
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getDashboardData } from '../utils/calculations';
import KPICard from '../components/KPICard';

export default function Home() {
  const { state } = useApp();
  
  const dashboardData = getDashboardData(state.quotes);
  
  // Calculs des KPIs principaux
  const totalRevenue = state.quotes.reduce((sum, quote) => sum + quote.amountHT, 0);
  const collectedRevenue = state.quotes
    .filter(quote => quote.status === 'collected')
    .reduce((sum, quote) => sum + quote.amountHT, 0);
  const pendingRevenue = state.quotes
    .filter(quote => quote.status === 'billed')
    .reduce((sum, quote) => sum + quote.amountHT, 0);
  
  const totalEquationCommissions = state.quotes
    .filter(quote => quote.status === 'collected')
    .reduce((sum, quote) => sum + quote.equationCommissionAmount, 0);
  
  const pendingCommissions = state.quotes
    .filter(quote => quote.paymentStatus === 'pending' && quote.status === 'collected')
    .reduce((sum, quote) => sum + quote.salesRepCommissionAmount, 0);

  // Alertes
  const overdueQuotes = state.quotes.filter(quote => {
    if (quote.status !== 'billed' || !quote.billingDate) return false;
    const daysSinceBilling = Math.floor((new Date().getTime() - quote.billingDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceBilling > 15;
  });

  const unpaidCommissions = state.quotes.filter(quote => 
    quote.paymentStatus === 'pending' && quote.status === 'collected'
  );

  // Données récentes
  const recentProjects = state.projects
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  const recentQuotes = state.quotes
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const navigationCards = [
    {
      title: 'Tableau de bord',
      description: 'Vue d\'ensemble et analytics',
      icon: BarChart3,
      href: '/dashboard',
      color: 'from-equation-navy to-equation-navy-dark',
      count: null
    },
    {
      title: 'Chantiers',
      description: 'Gestion des projets',
      icon: Building2,
      href: '/projects',
      color: 'from-equation-gold to-equation-gold-dark',
      count: state.projects.length
    },
    {
      title: 'Devis',
      description: 'Suivi des devis',
      icon: FileText,
      href: '/quotes',
      color: 'from-success-500 to-success-600',
      count: state.quotes.length
    },
    {
      title: 'Équipe',
      description: 'Chargés d\'affaires',
      icon: Users,
      href: '/team',
      color: 'from-secondary-500 to-secondary-600',
      count: state.salesReps.length
    },
    {
      title: 'Entreprises',
      description: 'Carnet d\'adresses',
      icon: Building,
      href: '/companies',
      color: 'from-primary-500 to-primary-600',
      count: state.companies.length
    },
    {
      title: 'Commissions',
      description: 'Gestion des paiements',
      icon: Calculator,
      href: '/commissions',
      color: 'from-warning-500 to-warning-600',
      count: unpaidCommissions.length
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header avec branding */}
      <div className="text-center py-12 bg-gradient-to-br from-equation-navy via-equation-navy-dark to-equation-navy rounded-3xl shadow-equation-xl text-equation-white">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-equation-gold rounded-2xl flex items-center justify-center shadow-lg">
            <Calculator className="h-10 w-10 text-equation-navy" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4">ÉQUATION TRAVAUX</h1>
        <p className="text-xl text-equation-gold mb-2">Système de Gestion CRM</p>
        <p className="text-equation-white/80 max-w-2xl mx-auto">
          Plateforme complète de gestion des chantiers, devis, équipes et commissions
        </p>
      </div>

      {/* Alertes importantes */}
      {(overdueQuotes.length > 0 || unpaidCommissions.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overdueQuotes.length > 0 && (
            <div className="bg-error-50 border border-error-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-error-600" />
                </div>
                <div>
                  <h3 className="font-bold text-error-800">Devis en retard</h3>
                  <p className="text-sm text-error-700">
                    {overdueQuotes.length} devis en retard d'encaissement {"(>15j)"}
                  </p>
                  <Link 
                    to="/quotes" 
                    className="text-sm font-semibold text-error-800 hover:underline flex items-center gap-1 mt-2"
                  >
                    Voir les devis <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {unpaidCommissions.length > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <h3 className="font-bold text-warning-800">Commissions en attente</h3>
                  <p className="text-sm text-warning-700">
                    {formatCurrency(pendingCommissions)} à payer à l'équipe
                  </p>
                  <Link 
                    to="/commissions" 
                    className="text-sm font-semibold text-warning-800 hover:underline flex items-center gap-1 mt-2"
                  >
                    Gérer les commissions <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="CA Total Signé"
          value={formatCurrency(totalRevenue)}
          icon={Euro}
          color="primary"
        />
        <KPICard
          title="CA Encaissé"
          value={formatCurrency(collectedRevenue)}
          icon={TrendingUp}
          color="success"
        />
        <KPICard
          title="Commissions ÉQUATION"
          value={formatCurrency(totalEquationCommissions)}
          icon={Award}
          color="secondary"
        />
        <KPICard
          title="Taux de conversion"
          value={`${state.quotes.length > 0 ? Math.round((state.quotes.filter(q => q.status === 'collected').length / state.quotes.length) * 100) : 0}%`}
          icon={Target}
          color="warning"
        />
      </div>

      {/* Navigation rapide */}
      <div>
        <h2 className="text-2xl font-bold text-equation-navy mb-6">Navigation rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="group relative overflow-hidden rounded-2xl shadow-equation hover:shadow-equation-lg transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className={`bg-gradient-to-br ${card.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <card.icon className="h-6 w-6" />
                  </div>
                  {card.count !== null && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-sm font-bold">{card.count}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-white/80 text-sm mb-4">{card.description}</p>
                <div className="flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                  Accéder <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Données récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projets récents */}
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-equation-navy">Projets récents</h3>
            <Link 
              to="/projects" 
              className="text-equation-gold hover:text-equation-gold-dark font-medium text-sm flex items-center gap-1"
            >
              Voir tous <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => {
                const salesRep = state.salesReps.find(s => s.id === project.salesRepId);
                const projectQuotes = state.quotes.filter(q => q.projectId === project.id);
                const totalAmount = projectQuotes.reduce((sum, q) => sum + q.amountHT, 0);
                
                return (
                  <div key={project.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-equation-navy">{project.name}</h4>
                        <p className="text-sm text-gray-600">{project.address}</p>
                        <p className="text-xs text-gray-500">CA: {salesRep?.name || 'Non assigné'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-equation-navy">{formatCurrency(totalAmount)}</p>
                        <p className="text-xs text-gray-500">{projectQuotes.length} devis</p>
                        <p className="text-xs text-gray-500">{formatDate(project.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucun projet créé</p>
              <Link 
                to="/projects" 
                className="text-equation-gold hover:text-equation-gold-dark font-medium text-sm"
              >
                Créer le premier projet
              </Link>
            </div>
          )}
        </div>

        {/* Devis récents */}
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-equation-navy">Devis récents</h3>
            <Link 
              to="/quotes" 
              className="text-equation-gold hover:text-equation-gold-dark font-medium text-sm flex items-center gap-1"
            >
              Voir tous <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {recentQuotes.length > 0 ? (
            <div className="space-y-3">
              {recentQuotes.map((quote) => {
                const project = state.projects.find(p => p.id === quote.projectId);
                
                return (
                  <div key={quote.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-equation-navy text-sm truncate">
                          {project?.name || 'Projet supprimé'}
                        </h4>
                        <p className="text-xs text-gray-600">{quote.companyName}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-bold text-equation-navy text-sm">
                          {formatCurrency(quote.amountHT)}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            quote.status === 'collected' ? 'bg-success-500' : 'bg-warning-500'
                          }`}></span>
                          <span className="text-xs text-gray-500">
                            {quote.status === 'collected' ? 'Encaissé' : 'Facturé'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucun devis créé</p>
              <Link 
                to="/quotes" 
                className="text-equation-gold hover:text-equation-gold-dark font-medium text-sm"
              >
                Créer le premier devis
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center py-8 border-t border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-equation-gold rounded-xl flex items-center justify-center">
            <Calculator className="h-6 w-6 text-equation-navy" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-equation-navy mb-2">ÉQUATION TRAVAUX CRM</h3>
        <p className="text-gray-600 mb-4">
          Plateforme de gestion complète pour le suivi des chantiers, devis et commissions
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <span>Version 1.0</span>
          <span>•</span>
          <span>Mode Partagé</span>
          <span>•</span>
          <span>Synchronisation Automatique</span>
        </div>
      </div>
    </div>
  );
}