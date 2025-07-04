/*
  # Création de la table pour les données CRM partagées

  1. Nouvelle Table
    - `shared_crm_data` - Données CRM partagées (sans authentification)

  2. Sécurité
    - Pas de RLS (Row Level Security)
    - Accès libre en lecture/écriture pour tous
*/

-- Table des données CRM partagées (sans authentification)
CREATE TABLE IF NOT EXISTS shared_crm_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type text NOT NULL CHECK (data_type IN ('projects', 'quotes', 'sales_reps', 'companies', 'full_backup')),
  data jsonb NOT NULL,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pas de RLS - accès libre pour tous
-- Cette table est accessible sans authentification

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_shared_crm_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
CREATE TRIGGER update_shared_crm_data_updated_at 
  BEFORE UPDATE ON shared_crm_data 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_shared_crm_data_updated_at();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shared_crm_data_type ON shared_crm_data(data_type);

-- Insertion d'un enregistrement par défaut pour 'full_backup' si aucun n'existe
INSERT INTO shared_crm_data (data_type, data)
SELECT 'full_backup', '{
  "projects": [],
  "quotes": [],
  "salesReps": [],
  "companies": [],
  "filters": {
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-12-31T23:59:59.999Z"
    }
  },
  "lastSaved": "2024-01-01T00:00:00.000Z",
  "lastModified": "2024-01-01T00:00:00.000Z"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM shared_crm_data WHERE data_type = 'full_backup'
);