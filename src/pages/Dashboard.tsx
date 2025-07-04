import React, { useState } from 'react';
import { BarChart3, TrendingUp, Euro, Users, Calendar, FileText, Building2, Target, Award, Clock, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Activity, Zap, Star, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getDashboardData } from '../utils/calculations';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

export default function Dashboard() {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  const dashboardData = getDashboardData(state.quotes);
  
  // Calculs pour les KPIs
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

  // Données pour les graphiques
  const monthlyData = React.useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthQuotes = state.quotes.filter(quote => {
        const quoteDate = new Date(quote.createdAt);
        return quoteDate.getFullYear() === currentYear && quoteDate.getMonth() === index;
      });
      
      return {
        month,
        revenue: monthQuotes.reduce((sum, quote) => sum + quote.amountHT, 0),
        collected: monthQuotes.filter(q => q.status === 'collected').reduce((sum, quote) => sum + quote.amountHT, 0),
        commissions: monthQuotes.reduce((sum, quote) => sum + quote.equationCommissionAmount, 0)
      };
    });
  }, [state.quotes]);

  const statusData = [
    { name: 'Encaissé', value: collectedRevenue, color: '#22c55e' },
    { name: 'Facturé', value: pendingRevenue, color: '#EDBD35' }
  ];

  const salesRepPerformance = React.useMemo(() => {
    return state.salesReps.map(rep => {
      const repProjects = state.projects.filter(p => p.salesRepId === rep.id);
      const repQuotes = state.quotes.filter(q => {
        const project = state.projects.find(p => p.id === q.projectId);
        return project?.salesRepId === rep.id;
      });
      
      const totalRevenue = repQuotes.reduce((sum, quote) => sum + quote.amountHT, 0);
      const commissions = repQuotes.reduce((sum, quote) => sum + quote.salesRepCommissionAmount, 0);
      
      return {
        name: rep.name,
        revenue: totalRevenue,
        commissions,
        projects: repProjects.length,
        quotes: repQuotes.length
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [state.salesReps, state.projects, state.quotes]);

  // Alertes et notifications
  const overdueQuotes = state.quotes.filter(quote => {
    if (quote.status !== 'billed' || !quote.billingDate) return false;
    const daysSinceBilling = Math.floor((new Date().getTime() - quote.billingDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceBilling > 15;
  });

  const unpaidCommissions = state.quotes.filter(quote => 
    quote.paymentStatus === 'pending' && quote.status === 'collected'
  );

  return (
    <div className="space-y-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header avec design moderne */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-equation-navy via-equation-navy-dark to-equation-navy rounded-3xl transform rotate-1"></div>
        <div className="relative bg-gradient-to-r from-equation-navy to-equation-navy-dark rounded-3xl p-8 text-white shadow-equation-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 bg-equation-gold rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                  <BarChart3 className="h-10 w-10 text-equation-navy" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Tableau de Bord</h1>
                <p className="text-equation-gold text-lg font-medium">
                  Vue d'ensemble de votre activité • {new Date().toLocaleDateString('fr-FR')}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-equation-white/80">
                  <span className="flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    Base synchronisée
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    Temps réel
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-equation-gold">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-equation-white/80">CA Total Signé</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-xs bg-success-500/20 text-success-300 px-2 py-1 rounded-full">
                  <ArrowUp className="h-3 w-3" />
                  +{state.quotes.length} devis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes avec design amélioré */}
      {(overdueQuotes.length > 0 || unpaidCommissions.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overdueQuotes.length > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-error-500/10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-error-500 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-error-800 text-lg">Devis en retard</h3>
                  <p className="text-error-700">
                    {overdueQuotes.length} devis en retard d'encaissement {"(>15j)"}
                  </p>
                  <p className="text-error-600 font-semibold text-sm mt-1">
                    Montant: {formatCurrency(overdueQuotes.reduce((sum, q) => sum + q.amountHT, 0))}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {unpaidCommissions.length > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning-500/10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-warning-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-warning-800 text-lg">Commissions en attente</h3>
                  <p className="text-warning-700">
                    {formatCurrency(pendingCommissions)} à payer à l'équipe
                  </p>
                  <p className="text-warning-600 font-semibold text-sm mt-1">
                    {unpaidCommissions.length} commission{unpaidCommissions.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards avec design amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card spéciale pour le CA total avec design premium */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-equation-navy via-equation-navy-dark to-equation-navy rounded-2xl transform rotate-1"></div>
          <div className="relative bg-gradient-to-br from-equation-navy to-equation-navy-dark rounded-2xl shadow-equation-xl p-6 text-equation-white hover:shadow-equation-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-equation-gold text-sm font-medium mb-1">CA Total Signé</p>
                <p className="text-3xl font-bold mb-2">{formatCurrency(totalRevenue)}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs bg-equation-gold/20 text-equation-gold px-2 py-1 rounded-full">
                    {totalRevenue > 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3" />
                        {Math.round((collectedRevenue / totalRevenue) * 100)}% encaissé
                      </>
                    ) : (
                      'Aucun CA'
                    )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-equation-gold/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Euro className="h-8 w-8 text-equation-gold" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-equation-gold text-sm font-medium">Non encaissé</p>
              <p className="text-xl font-bold text-equation-gold">{formatCurrency(pendingRevenue)}</p>
            </div>
          </div>
        </div>

        <KPICard
          title="Commissions ÉQUATION"
          value={formatCurrency(totalEquationCommissions)}
          icon={TrendingUp}
          color="secondary"
        />
        
        <KPICard
          title="Chantiers actifs"
          value={state.projects.length}
          icon={Building2}
          color="primary"
        />
        
        <KPICard
          title="Devis en cours"
          value={state.quotes.filter(q => q.status === 'billed').length}
          icon={FileText}
          color="warning"
        />
      </div>

      {/* Graphiques avec design amélioré */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Évolution mensuelle */}
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6 hover:shadow-equation-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-equation-navy flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-equation-gold" />
                Évolution mensuelle
              </h3>
              <p className="text-gray-600 text-sm">Performance commerciale {new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-equation-navy rounded-full"></div>
                <span className="text-gray-600">CA total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-equation-gold rounded-full"></div>
                <span className="text-gray-600">CA encaissé</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000}k€`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelStyle={{ color: '#000630' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="revenue" fill="#000630" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" fill="#EDBD35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par statut */}
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6 hover:shadow-equation-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-equation-navy flex items-center gap-2">
                <Target className="h-5 w-5 text-equation-gold" />
                Répartition du CA
              </h3>
              <p className="text-gray-600 text-sm">Statuts des encaissements</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance de l'équipe avec design amélioré */}
      <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 overflow-hidden hover:shadow-equation-lg transition-all duration-300">
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-equation-navy/5 via-transparent to-equation-gold/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-equation-navy" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-equation-navy">Performance de l'équipe</h3>
              <p className="text-gray-600">Classement par chiffre d'affaires</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {salesRepPerformance.length > 0 ? (
            <div className="space-y-4">
              {salesRepPerformance.map((rep, index) => (
                <div key={rep.name} className={`relative overflow-hidden flex items-center justify-between p-6 rounded-xl transition-all duration-200 hover:scale-105 ${
                  index === 0 
                    ? 'bg-gradient-to-r from-equation-gold/20 via-equation-gold/10 to-transparent border-2 border-equation-gold/30' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  {index === 0 && (
                    <div className="absolute top-2 right-2">
                      <div className="w-8 h-8 bg-equation-gold rounded-full flex items-center justify-center">
                        <Award className="h-4 w-4 text-equation-navy" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-equation-gold to-equation-gold-dark text-equation-navy' : 'bg-equation-navy'
                      }`}>
                        {rep.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {index < 3 && (
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-equation-gold text-equation-navy' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          'bg-amber-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-equation-navy text-lg">{rep.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {rep.projects} chantier{rep.projects > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {rep.quotes} devis
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-equation-navy text-xl">{formatCurrency(rep.revenue)}</p>
                    <p className="text-sm text-equation-gold font-medium">
                      {formatCurrency(rep.commissions)} commission
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-equation-navy" />
              </div>
              <h4 className="text-lg font-bold text-equation-navy mb-2">Aucun chargé d'affaires</h4>
              <p className="text-gray-600">Ajoutez des chargés d'affaires pour voir leurs performances</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques rapides avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-2xl shadow-equation border border-success-200 p-6 hover:shadow-equation-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-success-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-success-800 text-lg">Taux de conversion</h4>
              <p className="text-sm text-success-700">Devis facturés → encaissés</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-success-600">
              {state.quotes.length > 0 
                ? Math.round((state.quotes.filter(q => q.status === 'collected').length / state.quotes.length) * 100)
                : 0
              }%
            </p>
            <p className="text-success-700 text-sm font-medium">
              {state.quotes.filter(q => q.status === 'collected').length} / {state.quotes.length} devis
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-equation-gold/20 to-equation-gold/30 rounded-2xl shadow-equation border border-equation-gold/40 p-6 hover:shadow-equation-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-equation-gold rounded-xl flex items-center justify-center shadow-lg">
              <Target className="h-7 w-7 text-equation-navy" />
            </div>
            <div>
              <h4 className="font-bold text-equation-navy text-lg">Devis moyen</h4>
              <p className="text-sm text-gray-700">Montant moyen par devis</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-equation-navy">
              {formatCurrency(state.quotes.length > 0 ? totalRevenue / state.quotes.length : 0)}
            </p>
            <p className="text-equation-navy text-sm font-medium">
              Moyenne globale
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-equation-navy/10 to-equation-navy/20 rounded-2xl shadow-equation border border-equation-navy/30 p-6 hover:shadow-equation-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-equation-navy rounded-xl flex items-center justify-center shadow-lg">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-equation-navy text-lg">Commission moyenne</h4>
              <p className="text-sm text-gray-700">Taux moyen ÉQUATION</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-equation-navy">
              {state.quotes.length > 0 
                ? (state.quotes.reduce((sum, q) => sum + q.equationCommissionRate, 0) / state.quotes.length).toFixed(1)
                : 0
              }%
            </p>
            <p className="text-equation-navy text-sm font-medium">
              Taux standard: 5%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}