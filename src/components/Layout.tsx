import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  FileText, 
  BarChart3, 
  Users, 
  Calculator,
  Database,
  Building,
  Menu,
  X
} from 'lucide-react';
import clsx from 'clsx';
import BackupManager from './BackupManager';
import AutoSaveIndicator from './AutoSaveIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: BarChart3 },
  { name: 'Chantiers', href: '/projects', icon: Building2 },
  { name: 'Devis', href: '/quotes', icon: FileText },
  { name: 'Équipe', href: '/team', icon: Users },
  { name: 'Entreprises', href: '/companies', icon: Building },
  { name: 'Commissions', href: '/commissions', icon: Calculator },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-equation-navy text-equation-white rounded-xl shadow-lg hover:bg-equation-navy-dark transition-all duration-200"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-equation-navy shadow-equation-xl transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center px-6 border-b border-equation-navy-light">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-equation-gold rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-equation-navy" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-equation-white">ÉQUATION</h1>
              <p className="text-sm text-equation-gold">TRAVAUX</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-equation-gold text-equation-navy shadow-lg transform scale-105'
                        : 'text-equation-white hover:bg-equation-navy-light hover:text-equation-gold hover:transform hover:scale-105'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Settings Section */}
          <div className="mt-8 pt-8 border-t border-equation-navy-light">
            <button
              onClick={() => {
                setShowBackupManager(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-equation-white hover:bg-equation-navy-light hover:text-equation-gold hover:transform hover:scale-105"
            >
              <Database className="mr-3 h-5 w-5" />
              Sauvegardes
            </button>
          </div>
        </nav>

        {/* Auto-save indicator */}
        <div className="absolute bottom-20 left-0 right-0 px-4">
          <div className="bg-equation-navy-light rounded-lg p-3 border border-equation-gold/20">
            <AutoSaveIndicator />
          </div>
        </div>

        {/* Footer du sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-equation-navy-light rounded-lg p-3 border border-equation-gold/20">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-equation-gold rounded-full flex items-center justify-center">
                <span className="text-equation-navy font-bold text-xs">ET</span>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-equation-white">CRM v1.0</p>
                <p className="text-xs text-equation-gold">2024 - Mode Partagé</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </main>
      </div>

      {/* Backup Manager Modal */}
      <BackupManager 
        isOpen={showBackupManager} 
        onClose={() => setShowBackupManager(false)} 
      />
    </div>
  );
}