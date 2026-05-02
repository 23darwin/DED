import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Zap, FileText, X, User } from 'lucide-react';

interface ModalitiesProps {
  onClose: () => void;
}

export default function Modalities({ onClose }: ModalitiesProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-orange-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-orange-600 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Contrat de Confiance</h2>
              <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">Sécurité & Engagement DED</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scroll-smooth">
          {/* Mission */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              C'est quoi DED ?
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              <span className="text-orange-600 font-black italic">Dschang Express Delivery (DED)</span> est un middleware de logistique sécurisé. 
              Nous ne sommes pas de simples coursiers : nous sommes le <span className="font-bold text-slate-800">tiers de confiance</span> entre les agences de transport et les clients finaux. 
              Notre rôle est de garantir que votre colis arrive à destination sans "disparition" inexpliquée.
            </p>
          </section>

          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-orange-50 rounded-3xl border-2 border-orange-100 space-y-2">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Code Secret Unique</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">
                Chaque contrat génère un code secret. Sans ce code, la livraison ne peut être validée. C'est votre signature numérique.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-2">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Archivage Systématique</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">
                Photos du bordereau et de l'état du colis lors du ramassage. Zéro papier perdu, tout est synchronisé sur nos serveurs.
              </p>
            </div>
          </div>

          {/* Privacy & Rules */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Modalités & Responsabilité
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-tight leading-relaxed">
                  Responsabilité Limitée : La responsabilité de DED cesse 24h après la signature de réception.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-tight leading-relaxed">
                  Intégrité des Données : Vos numéros ne sont utilisés que pour le suivi logistique. Pas de publicité, pas de revente.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-tight leading-relaxed">
                  Protection : Le système est protégé par Firebase Security et Google Auth. Seuls les coursiers enregistrés ont accès à l'interface.
                </p>
              </div>
            </div>
          </section>

          {/* DED Team */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Équipe de Confiance (Vérification)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              Seuls ces agents sont habilités à transporter vos colis sous le label DED. Vérifiez toujours le Badge RFID.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Junior DED', id: 'DED-AG-01', phone: '6xx xxx xxx' },
                { name: 'Arnaud DED', id: 'DED-AG-02', phone: '6xx xxx xxx' }
              ].map((agent) => (
                <div key={agent.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase">{agent.name}</p>
                    <p className="text-[9px] font-bold text-orange-600">IDBadge: {agent.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button 
            onClick={onClose}
            className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-lg hover:bg-orange-700 shadow-xl shadow-orange-200 transition-all uppercase tracking-[0.2em]"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}
