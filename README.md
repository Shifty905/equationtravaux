# ÉQUATION TRAVAUX - CRM

Application de gestion CRM pour ÉQUATION TRAVAUX avec système de chantiers, devis, équipe commerciale et commissions.

## 🚀 Fonctionnalités

- **Gestion des Chantiers** : Création et suivi des projets
- **Système de Devis** : Facturation et encaissement
- **Équipe Commerciale** : Gestion des chargés d'affaires
- **Entreprises** : Carnet d'adresses centralisé
- **Commissions** : Calcul et suivi des paiements
- **Tableaux de Bord** : Analytics et graphiques
- **Mode Partagé** : Base de données accessible à tous

## 🛠️ Technologies

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS
- **Base de données** : Supabase
- **Graphiques** : Recharts
- **Icons** : Lucide React
- **Déploiement** : Netlify

## 📦 Installation

```bash
# Cloner le repository
git clone <repository-url>
cd equation-travaux-crm

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build
```

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

### Base de données Supabase

L'application utilise une table `shared_crm_data` pour stocker les données en mode partagé.

## 🎨 Design

L'application utilise la palette de couleurs ÉQUATION TRAVAUX :
- **Bleu Marine** : `#000630` - Couleur principale
- **Jaune Doré** : `#EDBD35` - Couleur secondaire
- **Interface moderne** avec animations et micro-interactions

## 📱 Responsive

Compatible avec tous les appareils :
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔄 Mode Partagé

L'application fonctionne en mode partagé :
- Aucune authentification requise
- Données partagées entre tous les utilisateurs
- Synchronisation automatique en temps réel
- Sauvegarde automatique dans Supabase

## 📊 Structure des Données

- **Chantiers** : Projets avec adresse et chargé d'affaires
- **Devis** : Montants, statuts, commissions
- **Équipe** : Chargés d'affaires avec performances
- **Entreprises** : Carnet d'adresses avec statistiques

## 🚀 Déploiement

L'application est configurée pour un déploiement automatique sur Netlify.

## 📄 Licence

© 2024 ÉQUATION TRAVAUX - Tous droits réservés