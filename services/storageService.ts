import { Material, Personnel, Cautela, SystemLog, AppSettings, Armorer } from '../types';
import JSZip from 'jszip';

const KEYS = {
  MATERIALS: 'sentinela_materials',
  PERSONNEL: 'sentinela_personnel',
  CAUTELAS: 'sentinela_cautelas',
  LOGS: 'sentinela_logs',
  SETTINGS: 'sentinela_settings',
  ARMORER: 'sentinela_current_armorer'
};

// Generic Getter
const get = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return defaultValue;
  }
};

// Generic Setter
const set = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

// Data Access Objects
export const StorageService = {
  getMaterials: () => get<Material[]>(KEYS.MATERIALS, []),
  saveMaterials: (data: Material[]) => set(KEYS.MATERIALS, data),

  getPersonnel: () => get<Personnel[]>(KEYS.PERSONNEL, []),
  savePersonnel: (data: Personnel[]) => set(KEYS.PERSONNEL, data),

  getCautelas: () => get<Cautela[]>(KEYS.CAUTELAS, []),
  saveCautelas: (data: Cautela[]) => set(KEYS.CAUTELAS, data),

  getLogs: () => get<SystemLog[]>(KEYS.LOGS, []),
  saveLogs: (data: SystemLog[]) => set(KEYS.LOGS, data),

  getSettings: () => get<AppSettings>(KEYS.SETTINGS, {
    institutionName: 'Polícia Militar',
    theme: 'light',
    admins: []
  }),
  saveSettings: (data: AppSettings) => set(KEYS.SETTINGS, data),

  // Helpers for Logging
  addLog: (armorerName: string, action: string, details: string) => {
    const logs = StorageService.getLogs();
    const newLog: SystemLog = {
      id: Date.now().toString(),
      armorerName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    StorageService.saveLogs([newLog, ...logs]);
  },

  // Backup & Restore
  createBackup: async () => {
    const backupData = {
      materials: StorageService.getMaterials(),
      personnel: StorageService.getPersonnel(),
      cautelas: StorageService.getCautelas(),
      logs: StorageService.getLogs(),
      settings: StorageService.getSettings(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const jsonContent = JSON.stringify(backupData);
    
    try {
        const zip = new JSZip();
        zip.file("backup_sentinela.json", jsonContent);
        
        const blob = await zip.generateAsync({type: "blob"});
        const url = URL.createObjectURL(blob);
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", `backup_sentinela_${new Date().toISOString().split('T')[0]}.zip`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Error creating zip backup", e);
        // Fallback to JSON if zip fails
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `backup_sentinela_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
  },

  restoreBackup: (file: File, callback: (success: boolean) => void) => {
    const processJson = (jsonString: string) => {
        try {
            const json = JSON.parse(jsonString);
            if (json.version && json.materials) {
                StorageService.saveMaterials(json.materials);
                StorageService.savePersonnel(json.personnel);
                StorageService.saveCautelas(json.cautelas);
                StorageService.saveLogs(json.logs);
                StorageService.saveSettings(json.settings);
                callback(true);
            } else {
                callback(false);
            }
        } catch (e) {
            console.error(e);
            callback(false);
        }
    };

    if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        JSZip.loadAsync(file).then((zip) => {
            // Look for any json file in the zip
            const jsonFile = Object.keys(zip.files).find(name => name.endsWith('.json'));
            if (jsonFile) {
                return zip.file(jsonFile)?.async("string");
            }
            throw new Error("JSON file not found in ZIP");
        }).then((content) => {
            if (content) processJson(content);
            else callback(false);
        }).catch((e) => {
            console.error("Error reading zip", e);
            callback(false);
        });
    } else {
        // Standard JSON handling
        const reader = new FileReader();
        reader.onload = (event) => {
             if (event.target?.result) {
                 processJson(event.target.result as string);
             } else {
                 callback(false);
             }
        };
        reader.readAsText(file);
    }
  },

  exportCSV: (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))].join('\n');
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};