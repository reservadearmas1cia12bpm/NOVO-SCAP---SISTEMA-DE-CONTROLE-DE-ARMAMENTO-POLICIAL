export enum MaterialCategory {
  WEAPON = 'Armamento',
  VEST = 'Colete Balístico',
  RADIO = 'Rádio HT',
  CUFFS = 'Algemas',
  AMMO = 'Munição',
  MAGAZINE = 'Carregador'
}

export enum MaterialStatus {
  AVAILABLE = 'Disponível',
  CHECKED_OUT = 'Em Cautela',
  MAINTENANCE = 'Manutenção',
  LOST = 'Extraviado'
}

export interface Material {
  id: string;
  category: MaterialCategory;
  type: string; // e.g., "Pistola", "Fuzil"
  model: string;
  serialNumber: string; // Unique identifier
  manufacturer: string;
  condition: string; // "Novo", "Bom", "Regular"
  caliber?: string; // New field for Weapons/Ammo
  expiryDate?: string; // For Vests
  quantity?: number; // For Ammo (Stock level)
  status: MaterialStatus;
  notes?: string;
}

export interface Personnel {
  id: string;
  name: string;
  rank: string; // Posto/Graduação
  matricula: string;
  cpf: string;
  unit: string; // Companhia/Batalhão
  area: string; // Área de atuação
  phone: string;
  photoUrl?: string;
  active: boolean;
  notes?: string;
}

export interface CautelaItem {
  materialId: string;
  serialNumber: string; // Redundant but useful for quick display
  category: MaterialCategory;
  quantity: number; // Mostly for ammo/mags
}

export interface Cautela {
  id: string;
  personnelId: string;
  personnelName: string;
  armorerId: string;
  armorerName: string;
  items: CautelaItem[];
  timestampOut: string;
  timestampIn?: string; // If null/undefined, it's active
  status: 'OPEN' | 'CLOSED';
  notesOut?: string;
  notesIn?: string;
  area?: string; // Area of service for this specific cautela
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

export interface Armorer {
  id: string;
  name: string;
  matricula: string;
  role?: AdminRole;
}

export interface SystemLog {
  id: string;
  armorerName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Admin {
  id: string;
  name: string;
  matricula: string;
  role: AdminRole;
}

export interface AppSettings {
  institutionName: string;
  institutionLogo?: string;
  theme: 'light' | 'dark';
  admins?: Admin[];
}