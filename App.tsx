import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { PersonnelPage } from './pages/Personnel';
import { InventoryPage } from './pages/Inventory';
import { CautelaPage } from './pages/Cautela';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { StorageService } from './services/storageService';
import { Armorer, AppSettings, Material, Personnel, Cautela, SystemLog } from './types';
import { Shield, UserCheck } from 'lucide-react';

const App: React.FC = () => {
  // Global State
  const [armorer, setArmorer] = useState<Armorer | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ institutionName: 'Polícia Militar', theme: 'light' });
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Init
  useEffect(() => {
    setMaterials(StorageService.getMaterials());
    setPersonnel(StorageService.getPersonnel());
    setCautelas(StorageService.getCautelas());
    setLogs(StorageService.getLogs());
    const savedSettings = StorageService.getSettings();
    setSettings(savedSettings);
    
    if (savedSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    }
  }, []);

  // Helpers
  const handleThemeToggle = () => {
      const newTheme = settings.theme === 'light' ? 'dark' : 'light';
      const newSettings = { ...settings, theme: newTheme };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
      
      if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  };

  const handleLog = (action: string, details: string) => {
      if (!armorer) return;
      StorageService.addLog(armorer.name, action, details);
      setLogs(StorageService.getLogs());
  };

  // Updates wrapper to persist data
  const updateMaterials = (data: Material[]) => {
      setMaterials(data);
      StorageService.saveMaterials(data);
  };
  
  const updatePersonnel = (data: Personnel[]) => {
      setPersonnel(data);
      StorageService.savePersonnel(data);
  };

  const updateCautelas = (data: Cautela[]) => {
      setCautelas(data);
      StorageService.saveCautelas(data);
  };

  const updateSettings = (data: AppSettings) => {
      setSettings(data);
      StorageService.saveSettings(data);
  };

  // Login Screen (Simple Mock)
  if (!armorer) {
      return (
          <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                  <div className={`w-24 h-24 mx-auto flex items-center justify-center mb-6 overflow-hidden ${settings.institutionLogo ? '' : 'bg-police-600 rounded-2xl text-white shadow-lg shadow-police-600/30'}`}>
                      {settings.institutionLogo ? (
                          <img src={settings.institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                           <Shield size={48} />
                      )}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{settings.institutionName}</h1>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">Controle de Material Bélico</p>
                  
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('name') as string;
                      const matricula = formData.get('matricula') as string;
                      if(name && matricula) {
                          setArmorer({ id: Date.now().toString(), name, matricula });
                          handleLog('Login', 'Armeiro acessou o sistema');
                      }
                  }} className="space-y-4 text-left">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Identificação do Armeiro</label>
                          <div className="relative">
                              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                              <input name="name" type="text" placeholder="Nome de Guerra" required className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                          <input name="matricula" type="text" placeholder="Matrícula Administrativa" required className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white" />
                      </div>
                      <button type="submit" className="w-full bg-police-600 hover:bg-police-700 text-white font-bold py-3 rounded-lg transition-colors mt-4">
                          Acessar Sistema
                      </button>
                  </form>
                  <p className="text-xs text-slate-400 mt-6">Sentinela v1.0 - Acesso Restrito</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col">
      <Header 
        armorer={armorer} 
        settings={settings} 
        onLogout={() => setArmorer(null)}
        toggleTheme={handleThemeToggle}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar 
            isOpen={isSidebarOpen} 
            currentView={currentView} 
            onChangeView={setCurrentView} 
        />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 p-0 md:p-2 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
            <div className="max-w-7xl mx-auto">
                {currentView === 'dashboard' && <Dashboard materials={materials} cautelas={cautelas} />}
                {currentView === 'personnel' && <PersonnelPage data={personnel} onUpdate={updatePersonnel} onLog={handleLog} armorerName={armorer.name} />}
                {currentView === 'inventory' && <InventoryPage data={materials} onUpdate={updateMaterials} onLog={handleLog} />}
                {currentView === 'cautela' && <CautelaPage materials={materials} personnel={personnel} cautelas={cautelas} armorer={armorer} onUpdateCautelas={updateCautelas} onUpdateMaterials={updateMaterials} onLog={handleLog} />}
                {currentView === 'reports' && <ReportsPage materials={materials} cautelas={cautelas} personnel={personnel} />}
                {currentView === 'settings' && <SettingsPage settings={settings} logs={logs} onSaveSettings={updateSettings} onRestore={() => window.location.reload()} />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;