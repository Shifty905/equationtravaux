import React, { useState } from 'react';
import { Calendar, Euro, Clock, CheckCircle, AlertTriangle, Download, TrendingUp, X, FileText, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/calculations';
import StatusBadge from '../components/StatusBadge';

export default function Commissions() {
  const { state, dispatch } = useApp();
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSalesRepId, setSelectedSalesRepId] = useState('');

  const getCommissionData = () => {
    const allCommissions = state.quotes.map(quote => {
      const project = state.projects.find(p => p.id === quote.projectId);
      const salesRep = state.salesReps.find(s => s.id === project?.salesRepId);
      
      return {
        id: quote.id,
        projectName: project?.name || 'Projet supprimé',
        companyName: quote.companyName,
        salesRepName: salesRep?.name || 'Non assigné',
        salesRepId: project?.salesRepId || '',
        amountHT: quote.amountHT,
        equationCommission: quote.equationCommissionAmount,
        salesRepCommission: quote.salesRepCommissionAmount,
        status: quote.status,
        paymentStatus: quote.paymentStatus,
        billingDate: quote.billingDate,
        collectionDate: quote.collectionDate,
        paymentDate: quote.paymentDate,
        quote,
        canBePaid: quote.status === 'collected' // Seuls les devis encaissés peuvent être payés
      };
    });

    // Appliquer les filtres
    let filteredCommissions = allCommissions;

    // Filtre par onglet
    switch (selectedTab) {
      case 'pending':
        filteredCommissions = filteredCommissions.filter(c => c.paymentStatus === 'pending' && c.canBePaid);
        break;
      case 'paid':
        filteredCommissions = filteredCommissions.filter(c => c.paymentStatus === 'paid');
        break;
      default:
        // 'all' - pas de filtre supplémentaire
        break;
    }

    // Filtre par chargé d'affaires
    if (selectedSalesRepId) {
      filteredCommissions = filteredCommissions.filter(c => c.salesRepId === selectedSalesRepId);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredCommissions = filteredCommissions.filter(c => 
        c.projectName.toLowerCase().includes(query) ||
        c.companyName.toLowerCase().includes(query) ||
        c.salesRepName.toLowerCase().includes(query)
      );
    }

    return filteredCommissions;
  };

  const commissionData = getCommissionData();
  
  // Seules les commissions des devis encaissés peuvent être comptées comme "à payer"
  const totalPending = state.quotes
    .filter(q => q.paymentStatus === 'pending' && q.status === 'collected')
    .reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
  
  const totalPaid = state.quotes
    .filter(q => q.paymentStatus === 'paid')
    .reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);
  
  const totalEquationCommissions = state.quotes
    .filter(q => q.status === 'collected')
    .reduce((sum, q) => sum + q.equationCommissionAmount, 0);

  // Commissions en retard (devis encaissés depuis plus de 15 jours mais pas encore payées)
  const overdueCommissions = state.quotes.filter(q => {
    if (q.paymentStatus === 'paid' || q.status !== 'collected') return false;
    if (!q.collectionDate) return false;
    
    const daysSinceCollection = Math.floor((new Date().getTime() - q.collectionDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCollection > 15; // Changé de 30 à 15 jours
  });

  const totalOverdue = overdueCommissions.reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);

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

  const getOverdueQuotesForPeriod = () => {
    // Obtenir les devis en retard d'encaissement (facturés depuis plus de 15 jours)
    return state.quotes.filter(quote => {
      if (quote.status !== 'billed' || !quote.billingDate) return false;
      const daysSinceBilling = Math.floor((new Date().getTime() - quote.billingDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBilling > 15;
    });
  };

  const getOverdueDataBySalesRep = () => {
    const overdueQuotes = getOverdueQuotesForPeriod();
    const salesRepData = new Map();

    overdueQuotes.forEach(quote => {
      const project = state.projects.find(p => p.id === quote.projectId);
      const salesRep = state.salesReps.find(s => s.id === project?.salesRepId);
      
      if (!salesRep) return;

      const daysSinceBilling = Math.floor((new Date().getTime() - quote.billingDate!.getTime()) / (1000 * 60 * 60 * 24));
      
      if (!salesRepData.has(salesRep.id)) {
        salesRepData.set(salesRep.id, {
          salesRep,
          quotes: [],
          totalAmount: 0,
          totalEquationCommission: 0,
          totalSalesRepCommission: 0,
          totalDays: 0
        });
      }

      const data = salesRepData.get(salesRep.id);
      data.quotes.push({
        ...quote,
        project,
        daysSinceBilling
      });
      data.totalAmount += quote.amountHT;
      data.totalEquationCommission += quote.equationCommissionAmount;
      data.totalSalesRepCommission += quote.salesRepCommissionAmount;
      data.totalDays += daysSinceBilling;
    });

    return Array.from(salesRepData.values()).map(data => ({
      ...data,
      averageDays: Math.round(data.totalDays / data.quotes.length)
    }));
  };

  const getRetardSeverity = (days: number) => {
    if (days <= 30) return { label: 'Modéré', color: '#f59e0b', bgColor: '#fef3c7' }; // Jaune
    if (days <= 45) return { label: 'Important', color: '#f97316', bgColor: '#fed7aa' }; // Orange
    return { label: 'Critique', color: '#dc2626', bgColor: '#fecaca' }; // Rouge
  };

  const handleExportPDF = () => {
    const overdueQuotes = getOverdueQuotesForPeriod();
    const salesRepOverdueData = getOverdueDataBySalesRep();
    
    // Statistiques globales
    const totalOverdueAmount = overdueQuotes.reduce((sum, q) => sum + q.amountHT, 0);
    const totalOverdueEquationCommission = overdueQuotes.reduce((sum, q) => sum + q.equationCommissionAmount, 0);
    const totalOverdueSalesRepCommission = overdueQuotes.reduce((sum, q) => sum + q.salesRepCommissionAmount, 0);

    // Filtres actifs pour l'affichage
    const activeFilters = [];
    if (selectedTab !== 'all') {
      activeFilters.push(`Statut: ${selectedTab === 'pending' ? 'En attente' : 'Payées'}`);
    }
    if (selectedSalesRepId) {
      const selectedSalesRep = state.salesReps.find(s => s.id === selectedSalesRepId);
      activeFilters.push(`Chargé d'affaires: ${selectedSalesRep?.name}`);
    }
    if (searchQuery.trim()) {
      activeFilters.push(`Recherche: "${searchQuery}"`);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport de Commissions - ÉQUATION TRAVAUX</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #000630; 
            background: #f8fafc;
          }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          
          /* Header avec dégradé */
          .header {
            background: linear-gradient(135deg, #000630 0%, #1a1f5c 100%);
            color: white;
            padding: 40px 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 20px 25px -5px rgba(0, 6, 48, 0.1);
          }
          .header h1 { 
            font-size: 2.5rem; 
            font-weight: 800; 
            margin-bottom: 10px;
            color: #EDBD35;
          }
          .header h2 { 
            font-size: 1.8rem; 
            font-weight: 600; 
            margin-bottom: 15px;
          }
          .header-info { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-top: 20px;
            flex-wrap: wrap;
            gap: 15px;
          }
          .header-info div { 
            background: rgba(237, 189, 53, 0.2); 
            padding: 10px 20px; 
            border-radius: 12px; 
            border: 1px solid rgba(237, 189, 53, 0.3);
          }

          /* Bannière d'alerte */
          .alert-banner {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 25px 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.2);
          }
          .alert-icon {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          /* Cards statistiques */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
          }
          .stat-card {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            transition: transform 0.2s;
          }
          .stat-card:hover { transform: translateY(-2px); }
          .stat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
          }
          .stat-icon {
            width: 60px;
            height: 60px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          .stat-value {
            font-size: 2.2rem;
            font-weight: 800;
            color: #000630;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 0.9rem;
            color: #6b7280;
            font-weight: 500;
          }

          /* Sections par chargé d'affaires */
          .sales-rep-section {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          .sales-rep-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f3f4f6;
          }
          .avatar {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            font-weight: 800;
            color: white;
            background: linear-gradient(135deg, #000630 0%, #EDBD35 100%);
            box-shadow: 0 8px 16px rgba(0, 6, 48, 0.2);
          }
          .sales-rep-info h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #000630;
            margin-bottom: 5px;
          }
          .sales-rep-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
          }
          .mini-stat {
            background: #f8fafc;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          .mini-stat-value {
            font-size: 1.3rem;
            font-weight: 700;
            color: #000630;
          }
          .mini-stat-label {
            font-size: 0.8rem;
            color: #6b7280;
            margin-top: 2px;
          }

          /* Tableaux */
          .table-container {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #f8fafc;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 15px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 0.9rem;
          }
          tr:nth-child(even) { background: #f9fafb; }
          tr:hover { background: #f3f4f6; }

          /* Badges */
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .badge-billed { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
          .badge-collected { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
          .badge-pending { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
          .badge-paid { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }

          /* Badges de retard */
          .retard-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          /* Mise en évidence des montants */
          .amount { font-weight: 700; color: #000630; }
          .commission { font-weight: 700; color: #EDBD35; }
          .commission-blocked { font-weight: 700; color: #dc2626; }

          /* Footer */
          .footer {
            margin-top: 50px;
            padding: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
            border-radius: 15px;
            text-align: center;
            border: 1px solid #d1d5db;
          }
          .footer h3 {
            color: #000630;
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .footer p {
            color: #6b7280;
            font-size: 0.9rem;
          }

          /* Filtres actifs */
          .filters-section {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .filters-title {
            font-weight: 700;
            color: #0c4a6e;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .filter-tag {
            display: inline-block;
            background: #0ea5e9;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-right: 10px;
            margin-bottom: 5px;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .container { padding: 15px; }
            .header { padding: 25px 20px; }
            .header h1 { font-size: 2rem; }
            .header h2 { font-size: 1.4rem; }
            .stats-grid { grid-template-columns: 1fr; }
            .sales-rep-stats { grid-template-columns: 1fr; }
            .header-info { flex-direction: column; align-items: stretch; }
            table { font-size: 0.8rem; }
            th, td { padding: 10px 8px; }
          }

          /* Styles d'impression */
          @media print {
            body { background: white; }
            .container { max-width: none; padding: 0; }
            .stat-card, .sales-rep-section, .table-container { 
              box-shadow: none; 
              border: 1px solid #e5e7eb; 
            }
            .header { 
              background: #000630 !important; 
              -webkit-print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>ÉQUATION TRAVAUX</h1>
            <h2>Rapport de Commissions</h2>
            <div class="header-info">
              <div>
                <strong>Date de génération:</strong><br>
                ${formatDate(new Date())} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div>
                <strong>Période analysée:</strong><br>
                Données complètes de la base
              </div>
              <div>
                <strong>Total commissions:</strong><br>
                ${commissionData.length} commission${commissionData.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          ${activeFilters.length > 0 ? `
          <!-- Filtres actifs -->
          <div class="filters-section">
            <div class="filters-title">
              🔍 Filtres appliqués
            </div>
            <div>
              ${activeFilters.map(filter => `<span class="filter-tag">${filter}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          ${overdueQuotes.length > 0 ? `
          <!-- Bannière d'alerte pour les retards d'encaissement -->
          <div class="alert-banner">
            <div class="alert-icon">⚠️</div>
            <div>
              <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 5px;">
                Alerte : Devis en retard d'encaissement
              </h3>
              <p style="font-size: 1rem; opacity: 0.9;">
                ${overdueQuotes.length} devis facturé${overdueQuotes.length > 1 ? 's' : ''} depuis plus de 15 jours - 
                Montant total : ${formatCurrency(totalOverdueAmount)} - 
                Commissions bloquées : ${formatCurrency(totalOverdueSalesRepCommission)}
              </p>
            </div>
          </div>
          ` : ''}

          <!-- Statistiques globales -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-header">
                <div>
                  <div class="stat-value">${commissionData.length}</div>
                  <div class="stat-label">Total des commissions</div>
                </div>
                <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">📊</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-header">
                <div>
                  <div class="stat-value">${formatCurrency(commissionData.reduce((sum, c) => sum + c.equationCommission, 0))}</div>
                  <div class="stat-label">Commissions ÉQUATION</div>
                </div>
                <div class="stat-icon" style="background: #fef3c7; color: #92400e;">💰</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-header">
                <div>
                  <div class="stat-value">${formatCurrency(commissionData.filter(c => c.paymentStatus === 'pending' && c.canBePaid).reduce((sum, c) => sum + c.salesRepCommission, 0))}</div>
                  <div class="stat-label">À payer équipe</div>
                </div>
                <div class="stat-icon" style="background: #fef2f2; color: #dc2626;">⏰</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-header">
                <div>
                  <div class="stat-value">${formatCurrency(commissionData.filter(c => c.paymentStatus === 'paid').reduce((sum, c) => sum + c.salesRepCommission, 0))}</div>
                  <div class="stat-label">Déjà payé</div>
                </div>
                <div class="stat-icon" style="background: #f0fdf4; color: #16a34a;">✅</div>
              </div>
            </div>
          </div>

          ${overdueQuotes.length > 0 ? `
          <!-- Section des retards d'encaissement -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 1.8rem; font-weight: 700; color: #dc2626; margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
              🚨 Devis en retard d'encaissement (${overdueQuotes.length})
            </h2>
            
            ${salesRepOverdueData.length > 0 ? salesRepOverdueData.map(data => {
              const { salesRep, quotes, totalAmount, totalEquationCommission, totalSalesRepCommission, averageDays } = data;
              return `
              <div class="sales-rep-section" style="border-left: 4px solid #dc2626;">
                <div class="sales-rep-header">
                  <div class="avatar">${salesRep.name.split(' ').map(n => n[0]).join('')}</div>
                  <div class="sales-rep-info">
                    <h3>${salesRep.name}</h3>
                    <p style="color: #6b7280; font-weight: 500;">Chargé d'affaires</p>
                  </div>
                </div>
                
                <div class="sales-rep-stats">
                  <div class="mini-stat" style="background: #fef2f2; border-color: #fecaca;">
                    <div class="mini-stat-value" style="color: #dc2626;">${formatCurrency(totalEquationCommission)}</div>
                    <div class="mini-stat-label">Commission ÉQUATION bloquée</div>
                  </div>
                  <div class="mini-stat" style="background: #fef2f2; border-color: #fecaca;">
                    <div class="mini-stat-value" style="color: #dc2626;">${formatCurrency(totalSalesRepCommission)}</div>
                    <div class="mini-stat-label">Commission CA bloquée</div>
                  </div>
                  <div class="mini-stat" style="background: #fef2f2; border-color: #fecaca;">
                    <div class="mini-stat-value" style="color: #dc2626;">${averageDays} jours</div>
                    <div class="mini-stat-label">Retard moyen</div>
                  </div>
                  <div class="mini-stat" style="background: #fef2f2; border-color: #fecaca;">
                    <div class="mini-stat-value" style="color: #dc2626;">${quotes.length}</div>
                    <div class="mini-stat-label">Devis en retard</div>
                  </div>
                </div>

                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Chantier / Entreprise</th>
                        <th>Montant HT</th>
                        <th>Date facturation</th>
                        <th>Retard</th>
                        <th>Commission bloquée</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${quotes.map(quote => {
                        const severity = getRetardSeverity(quote.daysSinceBilling);
                        return `
                        <tr>
                          <td>
                            <div style="font-weight: 600; color: #000630; margin-bottom: 2px;">${quote.project?.name || 'Projet supprimé'}</div>
                            <div style="font-size: 0.8rem; color: #6b7280;">${quote.companyName}</div>
                          </td>
                          <td><span class="amount">${formatCurrency(quote.amountHT)}</span></td>
                          <td>${quote.billingDate ? formatDate(quote.billingDate) : 'Non définie'}</td>
                          <td>
                            <span class="retard-badge" style="background: ${severity.bgColor}; color: ${severity.color};">
                              ${quote.daysSinceBilling} jours - ${severity.label}
                            </span>
                          </td>
                          <td><span class="commission-blocked">${formatCurrency(quote.salesRepCommissionAmount)}</span></td>
                          <td><span class="badge badge-billed">Facturé</span></td>
                        </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              `;
            }).join('') : ''}
          </div>
          ` : ''}

          <!-- Tableau principal des commissions -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 1.8rem; font-weight: 700; color: #000630; margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
              📋 Détail des commissions (${commissionData.length})
            </h2>
            
            ${commissionData.length > 0 ? `
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Chantier / Entreprise</th>
                    <th>Chargé d'affaires</th>
                    <th>Montant HT</th>
                    <th>Commission ÉQUATION</th>
                    <th>Commission CA</th>
                    <th>Statut devis</th>
                    <th>Paiement</th>
                    <th>Date création</th>
                  </tr>
                </thead>
                <tbody>
                  ${commissionData.map(commission => `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: #000630; margin-bottom: 2px;">${commission.projectName}</div>
                      <div style="font-size: 0.8rem; color: #6b7280;">${commission.companyName}</div>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #000630, #EDBD35); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.8rem;">
                          ${commission.salesRepName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style="font-weight: 600; color: #000630;">${commission.salesRepName}</span>
                      </div>
                    </td>
                    <td><span class="amount">${formatCurrency(commission.amountHT)}</span></td>
                    <td>
                      <div><span class="commission">${formatCurrency(commission.equationCommission)}</span></div>
                      <div style="font-size: 0.75rem; color: #EDBD35; font-weight: 600;">${commission.quote.equationCommissionRate}%</div>
                    </td>
                    <td>
                      <div><span class="commission">${formatCurrency(commission.salesRepCommission)}</span></div>
                      <div style="font-size: 0.75rem; color: #EDBD35; font-weight: 600;">${commission.quote.salesRepCommissionRate}%</div>
                    </td>
                    <td>
                      <span class="badge badge-${commission.status}">
                        ${commission.status === 'billed' ? 'Facturé' : 'Encaissé'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span class="badge badge-${commission.paymentStatus}">
                          ${commission.paymentStatus === 'pending' ? 'À payer' : 'Payé'}
                        </span>
                      </div>
                      ${!commission.canBePaid && commission.paymentStatus === 'pending' ? 
                        '<div style="font-size: 0.7rem; color: #6b7280; font-style: italic; margin-top: 2px;">Devis non encaissé</div>' : ''
                      }
                      ${commission.paymentDate ? 
                        `<div style="font-size: 0.75rem; color: #6b7280; margin-top: 2px;">${formatDate(commission.paymentDate)}</div>` : ''
                      }
                    </td>
                    <td style="font-size: 0.85rem; color: #6b7280;">${formatDate(commission.quote.createdAt)}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : `
            <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 15px; border: 1px solid #e5e7eb;">
              <div style="font-size: 3rem; margin-bottom: 20px;">📊</div>
              <h3 style="font-size: 1.5rem; font-weight: 700; color: #000630; margin-bottom: 10px;">Aucune commission</h3>
              <p style="color: #6b7280; font-size: 1rem;">
                ${selectedTab === 'pending' ? 'Aucune commission en attente de paiement' : 
                  selectedTab === 'paid' ? 'Aucune commission payée' : 
                  'Aucune commission trouvée avec les filtres appliqués'}
              </p>
            </div>
            `}
          </div>

          <!-- Footer -->
          <div class="footer">
            <h3>ÉQUATION TRAVAUX</h3>
            <p>Rapport généré automatiquement le ${formatDate(new Date())} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p style="margin-top: 5px;">CRM - Gestion des commissions et suivi des paiements</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Créer et télécharger le fichier
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Nom de fichier avec filtres
    let filename = `commissions-${formatDate(new Date()).replace(/\//g, '-')}`;
    if (selectedTab !== 'all') {
      filename += `-${selectedTab}`;
    }
    if (selectedSalesRepId) {
      const selectedSalesRep = state.salesReps.find(s => s.id === selectedSalesRepId);
      filename += `-${selectedSalesRep?.name.replace(/\s+/g, '-')}`;
    }
    filename += '.html';
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-equation-navy mb-2">Gestion des commissions</h1>
          <p className="text-gray-600 text-lg">Suivi des paiements et encaissements</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 border border-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold hover:text-equation-navy transition-all duration-200 font-medium"
          >
            <Download className="h-5 w-5" />
            Exporter
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-equation-gold text-equation-navy rounded-xl hover:bg-equation-gold-dark transition-all duration-200 font-semibold shadow-equation">
            <CheckCircle className="h-5 w-5" />
            Paiement groupé
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Commissions ÉQUATION</p>
              <p className="text-3xl font-bold text-equation-navy">
                {formatCurrency(totalEquationCommissions)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Devis encaissés uniquement</p>
            </div>
            <div className="w-12 h-12 bg-equation-gold/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-equation-navy" />
            </div>
          </div>
        </div>
        
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">À payer équipe</p>
              <p className="text-3xl font-bold text-warning-600">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Devis encaissés uniquement</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Déjà payé</p>
              <p className="text-3xl font-bold text-success-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{"En retard (>15j)"}</p>
              <p className="text-3xl font-bold text-error-600">{overdueCommissions.length}</p>
              <p className="text-xs text-error-600 font-medium mt-1">
                {formatCurrency(totalOverdue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-error-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une commission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 bg-gray-50 focus:bg-equation-white text-sm sm:text-base"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 flex-1">
              <Calendar className="h-5 w-5 text-equation-navy flex-shrink-0" />
              <div className="flex items-center gap-2 w-full">
                <input
                  type="date"
                  className="border border-gray-200 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 text-xs sm:text-sm flex-1 min-w-0"
                />
                <span className="text-gray-500 font-medium text-xs sm:text-sm">à</span>
                <input
                  type="date"
                  className="border border-gray-200 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 text-xs sm:text-sm flex-1 min-w-0"
                />
              </div>
            </div>

            {/* Sales Rep Filter */}
            <select 
              value={selectedSalesRepId}
              onChange={(e) => setSelectedSalesRepId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 sm:px-4 py-3 focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 bg-gray-50 focus:bg-equation-white text-sm sm:text-base min-w-0 sm:min-w-[200px]"
            >
              <option value="">Tous les CA</option>
              {state.salesReps.map(rep => (
                <option key={rep.id} value={rep.id}>{rep.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'Toutes', count: state.quotes.length },
            { 
              key: 'pending', 
              label: 'En attente', 
              count: state.quotes.filter(q => q.paymentStatus === 'pending' && q.status === 'collected').length 
            },
            { key: 'paid', label: 'Payées', count: state.quotes.filter(q => q.paymentStatus === 'paid').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                selectedTab === tab.key
                  ? 'border-equation-gold text-equation-navy'
                  : 'border-transparent text-gray-500 hover:text-equation-navy hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 py-1 px-3 rounded-full text-xs bg-gray-100 text-gray-900 font-medium">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Commissions Table */}
      <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chantier / Devis
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chargé d'affaires
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Montant HT
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Commission ÉQUATION
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Commission CA
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut devis
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-equation-white divide-y divide-gray-100">
              {commissionData.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-equation-navy">
                        {commission.projectName}
                      </div>
                      <div className="text-sm text-gray-600">{commission.companyName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-equation-navy/10 rounded-xl flex items-center justify-center mr-3">
                        <span className="text-equation-navy font-bold text-xs">
                          {commission.salesRepName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-equation-navy">
                        {commission.salesRepName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-equation-navy">
                    {formatCurrency(commission.amountHT)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-equation-navy">
                      {formatCurrency(commission.equationCommission)}
                    </div>
                    <div className="text-xs text-equation-gold font-medium">
                      {commission.quote.equationCommissionRate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-equation-navy">
                      {formatCurrency(commission.salesRepCommission)}
                    </div>
                    <div className="text-xs text-equation-gold font-medium">
                      {commission.quote.salesRepCommissionRate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={commission.status} type="quote" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={commission.paymentStatus} type="payment" />
                      {!commission.canBePaid && commission.paymentStatus === 'pending' && (
                        <span className="text-xs text-gray-500 italic">
                          Devis non encaissé
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                    {commission.billingDate && (
                      <div className="mb-1">Facturé: {formatDate(commission.billingDate)}</div>
                    )}
                    {commission.collectionDate && (
                      <div className="mb-1">Encaissé: {formatDate(commission.collectionDate)}</div>
                    )}
                    {commission.paymentDate && (
                      <div>Payé: {formatDate(commission.paymentDate)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {commission.paymentStatus === 'pending' && commission.canBePaid ? (
                        <button
                          onClick={() => handleMarkAsPaid(commission.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-success-100 text-success-700 text-xs font-semibold rounded-xl hover:bg-success-200 transition-all duration-200 border border-success-200"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Marquer payé
                        </button>
                      ) : commission.paymentStatus === 'pending' && !commission.canBePaid ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 text-xs font-semibold rounded-xl border border-gray-200 cursor-not-allowed">
                          <Clock className="h-3 w-3" />
                          En attente d'encaissement
                        </div>
                      ) : commission.paymentStatus === 'paid' ? (
                        <button
                          onClick={() => handleCancelPayment(commission.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-error-100 text-error-700 text-xs font-semibold rounded-xl hover:bg-error-200 transition-all duration-200 border border-error-200"
                        >
                          <X className="h-3 w-3" />
                          Annuler paiement
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

      {/* Empty State */}
      {commissionData.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-equation-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Euro className="h-12 w-12 text-equation-navy" />
          </div>
          <h3 className="text-2xl font-bold text-equation-navy mb-3">Aucune commission</h3>
          <p className="text-gray-600 text-lg">
            {selectedTab === 'pending' ? 'Aucune commission en attente de paiement' : 
             selectedTab === 'paid' ? 'Aucune commission payée' : 
             'Aucune commission enregistrée'}
          </p>
        </div>
      )}

      {/* Information Banner */}
      <div className="bg-equation-navy/5 rounded-2xl p-6 border border-equation-navy/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-equation-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-equation-navy" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-equation-navy mb-2">Règles de paiement des commissions</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Les commissions ne peuvent être payées que si le devis est "Encaissé"</strong></p>
              <p>• Les devis en statut "Facturé" ne génèrent pas de commission payable</p>
              <p>• Les commissions en retard correspondent aux devis encaissés depuis plus de 15 jours</p>
              <p>• Le montant "À payer équipe" ne comptabilise que les devis effectivement encaissés</p>
              <p>• <strong>Vous pouvez annuler un paiement pour le remettre en statut "À payer"</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}