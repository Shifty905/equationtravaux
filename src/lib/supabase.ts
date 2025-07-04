import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  throw new Error('Variables d\'environnement Supabase manquantes');
}

console.log('✅ Configuration Supabase OK - Mode Partagé');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      shared_crm_data: {
        Row: {
          id: string;
          data_type: 'projects' | 'quotes' | 'sales_reps' | 'companies' | 'full_backup';
          data: any;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          data_type: 'projects' | 'quotes' | 'sales_reps' | 'companies' | 'full_backup';
          data: any;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          data_type?: 'projects' | 'quotes' | 'sales_reps' | 'companies' | 'full_backup';
          data?: any;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}