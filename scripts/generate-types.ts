import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the Supabase URL and anon key from the environment
const supabaseUrl = 'https://thowunoqksuyixbdqlur.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRob3d1bm9xa3N1eWl4YmRxbHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDkzNjMsImV4cCI6MjA1ODA4NTM2M30.a6BWGaIFcB2OBc5ux2bRBXaY0KQsSPfpgUHKtW5Xrs8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateTypes() {
  try {
    // Get the database schema
    const { data: tables, error: tablesError } = await supabase.from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    if (tablesError) throw tablesError;
    
    let output = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {`;

    for (const table of tables || []) {
      const tableName = table.table_name;
      
      // Get columns for each table
      const { data: columns, error: columnsError } = await supabase.from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (columnsError) throw columnsError;
      
      output += `
      ${tableName}: {
        Row: {`;
      
      for (const column of columns || []) {
        let tsType = 'unknown';
        
        // Map PostgreSQL types to TypeScript types
        switch (column.data_type) {
          case 'integer':
          case 'numeric':
          case 'bigint':
          case 'smallint':
          case 'decimal':
          case 'real':
          case 'double precision':
            tsType = 'number';
            break;
          case 'character varying':
          case 'text':
          case 'character':
          case 'uuid':
            tsType = 'string';
            break;
          case 'boolean':
            tsType = 'boolean';
            break;
          case 'json':
          case 'jsonb':
            tsType = 'Json';
            break;
          case 'timestamp with time zone':
          case 'timestamp without time zone':
          case 'date':
            tsType = 'string';
            break;
          default:
            tsType = 'unknown';
        }
        
        const isNullable = column.is_nullable === 'YES' ? ' | null' : '';
        output += `
          ${column.column_name}: ${tsType}${isNullable}`;
      }
      
      output += `
        }
        Insert: {`;
      
      for (const column of columns || []) {
        let tsType = 'unknown';
        
        // Map PostgreSQL types to TypeScript types
        switch (column.data_type) {
          case 'integer':
          case 'numeric':
          case 'bigint':
          case 'smallint':
          case 'decimal':
          case 'real':
          case 'double precision':
            tsType = 'number';
            break;
          case 'character varying':
          case 'text':
          case 'character':
          case 'uuid':
            tsType = 'string';
            break;
          case 'boolean':
            tsType = 'boolean';
            break;
          case 'json':
          case 'jsonb':
            tsType = 'Json';
            break;
          case 'timestamp with time zone':
          case 'timestamp without time zone':
          case 'date':
            tsType = 'string';
            break;
          default:
            tsType = 'unknown';
        }
        
        const isNullable = column.is_nullable === 'YES' ? ' | null' : '';
        const isNullableInsert = !column.column_default && column.is_nullable === 'YES' ? '?' : '';
        output += `
          ${column.column_name}${isNullableInsert}: ${tsType}${isNullable}`;
      }
      
      output += `
        }
        Update: {`;
      
      for (const column of columns || []) {
        let tsType = 'unknown';
        
        // Map PostgreSQL types to TypeScript types
        switch (column.data_type) {
          case 'integer':
          case 'numeric':
          case 'bigint':
          case 'smallint':
          case 'decimal':
          case 'real':
          case 'double precision':
            tsType = 'number';
            break;
          case 'character varying':
          case 'text':
          case 'character':
          case 'uuid':
            tsType = 'string';
            break;
          case 'boolean':
            tsType = 'boolean';
            break;
          case 'json':
          case 'jsonb':
            tsType = 'Json';
            break;
          case 'timestamp with time zone':
          case 'timestamp without time zone':
          case 'date':
            tsType = 'string';
            break;
          default:
            tsType = 'unknown';
        }
        
        const isNullable = column.is_nullable === 'YES' ? ' | null' : '';
        output += `
          ${column.column_name}?: ${tsType}${isNullable}`;
      }
      
      output += `
        }
      }`;
    }

    output += `
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type InferredRowType<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']`;

    // Write the output to a file
    fs.writeFileSync(path.join(process.cwd(), 'types', 'supabase.ts'), output);
    console.log('Types generated successfully!');
  } catch (error) {
    console.error('Error generating types:', error);
  }
}

generateTypes();
