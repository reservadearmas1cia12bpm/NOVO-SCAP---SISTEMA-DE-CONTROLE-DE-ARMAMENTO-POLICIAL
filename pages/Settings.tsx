import React, { useRef, useState } from 'react';
import { AppSettings, SystemLog, Armorer } from '../types';
import { StorageService } from '../services/storageService';
import { Save, Upload, Download, Database, Shield, Users, Trash2, Plus, Image as ImageIcon, Lock } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  logs: SystemLog[];
  onSaveSettings: (s: AppSettings) => void;
  onRestore: () => void;
  currentUser: Armorer | null;
}

export const SettingsPage: React.FC<SettingsProps> = ({ settings, logs, onSaveSettings, onRestore, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [instName, setInstName] = useState(settings.institutionName);
  const [instLogo, setInstLogo] = useState(settings.institutionLogo || '');
  
  // Admin Management State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminMatricula, setNewAdminMatricula] = useState('');

  const handleSave = () => {
    onSaveSettings({ 
        ...settings, 
        institutionName: instName,
        institutionLogo: instLogo
    });
    alert('Configurações salvas!');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          StorageService.restoreBackup(e.target.files[0], (success) => {
              if (success) {
                  alert('Backup restaurado com sucesso! O sistema será recarregado.');
                  window.location.reload();
              } else {
                  alert('Falha ao restaurar backup. Arquivo inválido.');
              }
          });
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setInstLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAddAdmin = () => {
    if (!newAdminName || !newAdminMatricula) {
        alert('Preencha nome e matrícula.');
        return;
    }
    
    const newAdmin = {
        id: Date.now().toString(),
        name: newAdminName,
        matricula: newAdminMatricula,
        role: 'ADMIN' as const // Default role for subsequent admins
    };
    
    const updatedAdmins = [...(settings.admins || []), newAdmin];
    onSaveSettings({ ...settings, admins: updatedAdmins });
    setNewAdminName('');
    setNewAdminMatricula('');
  };

  const handleRemoveAdmin = (id: string) => {
      if (id === currentUser?.id) {
          alert("Você não pode remover a si mesmo.");
          return;
      }
      
      if(confirm('Remover este administrador?')) {
          const updatedAdmins = (settings.admins || []).filter(a => a.id !== id);
          onSaveSettings({ ...settings, admins: updatedAdmins });
      }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h2>

      {/* Identidade Visual */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Shield size={20} /> Identidade Visual
          </h3>
          <div className="max-w-md space-y-6">
              {/* Logo Selection */}
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logotipo da Instituição</label>
                  <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                          {instLogo ? (
                              <img src={instLogo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                          ) : (
                              <ImageIcon size={32} className="text-slate-300" />
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                          <button 
                              onClick={() => logoInputRef.current?.click()}
                              className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                          >
                              Carregar Imagem
                          </button>
                          {instLogo && (
                              <button 
                                  onClick={() => setInstLogo('')}
                                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-left"
                              >
                                  Remover Logo
                              </button>
                          )}
                          <input 
                              type="file" 
                              ref={logoInputRef} 
                              onChange={handleLogoUpload} 
                              className="hidden" 
                              accept="image/*"
                          />
                      </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Instituição</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                  />
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 bg-police-600 text-white px-4 py-2 rounded-lg hover:bg-police-700 font-medium">
                  <Save size={18} /> Salvar Alterações
              </button>
          </div>
      </div>

      {/* Gestão de Administradores - RESTRICTED TO SUPER ADMIN */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Users size={20} /> Gerenciar Administradores
          </h3>

          {!isSuperAdmin && (
              <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                  <Lock className="text-slate-400 mb-2" size={32} />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Acesso Restrito</p>
                  <p className="text-sm text-slate-500">Apenas o Super Administrador pode gerenciar usuários.</p>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-3">Novo Administrador</h4>
                  <div className="space-y-3">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome Completo / Posto</label>
                          <input 
                              type="text" 
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white"
                              placeholder="Ex: Cap João Silva"
                              value={newAdminName}
                              onChange={(e) => setNewAdminName(e.target.value)}
                              disabled={!isSuperAdmin}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Matrícula / Login</label>
                          <input 
                              type="text" 
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white"
                              placeholder="Ex: 123456-0"
                              value={newAdminMatricula}
                              onChange={(e) => setNewAdminMatricula(e.target.value)}
                              disabled={!isSuperAdmin}
                          />
                      </div>
                      <button 
                        onClick={handleAddAdmin}
                        disabled={!isSuperAdmin}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm disabled:opacity-50"
                      >
                          <Plus size={16} /> Adicionar Administrador
                      </button>
                  </div>
              </div>
              
              <div>
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-3">Administradores Cadastrados</h4>
                  {(!settings.admins || settings.admins.length === 0) ? (
                      <p className="text-sm text-slate-400 italic">Nenhum administrador cadastrado.</p>
                  ) : (
                      <div className="space-y-2">
                          {settings.admins.map(admin => (
                              <div key={admin.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <p className="text-sm font-bold text-slate-800 dark:text-white">{admin.name}</p>
                                          {admin.role === 'SUPER_ADMIN' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">SUPER</span>}
                                      </div>
                                      <p className="text-xs text-slate-500">{admin.matricula}</p>
                                  </div>
                                  {admin.role !== 'SUPER_ADMIN' && (
                                    <button 
                                        onClick={() => handleRemoveAdmin(admin.id)}
                                        disabled={!isSuperAdmin}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Backup e Segurança */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Database size={20} /> Backup e Restauração
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <button 
                onClick={() => StorageService.createBackup()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors gap-3 text-slate-600 dark:text-slate-300"
              >
                  <Download size={32} className="text-police-600" />
                  <span className="font-medium">Fazer Backup (ZIP)</span>
                  <span className="text-xs text-center text-slate-500">Baixa um arquivo compactado .zip com todos os dados do sistema.</span>
              </button>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors gap-3 text-slate-600 dark:text-slate-300"
              >
                  <Upload size={32} className="text-amber-600" />
                  <span className="font-medium">Restaurar Backup</span>
                  <span className="text-xs text-center text-slate-500">Carregue um arquivo .zip ou .json para restaurar os dados.</span>
                  <input type="file" ref={fileInputRef} onChange={handleRestore} className="hidden" accept=".zip,.rar,.json" />
              </div>
          </div>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Logs de Auditoria (Recentes)</h3>
          <div className="overflow-y-auto max-h-60 border rounded-lg border-slate-100 dark:border-slate-700">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                      <tr>
                          <th className="px-4 py-2">Data/Hora</th>
                          <th className="px-4 py-2">Armeiro</th>
                          <th className="px-4 py-2">Ação</th>
                          <th className="px-4 py-2">Detalhes</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {logs.slice(0, 20).map((log) => (
                          <tr key={log.id}>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap font-medium">{log.armorerName}</td>
                              <td className="px-4 py-2">{log.action}</td>
                              <td className="px-4 py-2 truncate max-w-xs">{log.details}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};