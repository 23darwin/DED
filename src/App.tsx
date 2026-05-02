/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import Header from './components/Header';
import DeliveryList from './components/DeliveryList';
import DeliveryForm from './components/DeliveryForm';
import DeliveryDetail from './components/DeliveryDetail';
import DailyActivity from './components/DailyActivity';
import Modalities from './components/Modalities';
import { Delivery } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Package2, ShieldCheck, Zap } from 'lucide-react';

enum View {
  DASHBOARD,
  FORM,
  DETAIL,
  DAILY_ACTIVITY
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showModalities, setShowModalities] = useState(false);
  const [region] = useState({ name: 'West', brand: 'LÉKIA', meaning: 'Réussite' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setCurrentView(View.DETAIL);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-200 animate-bounce">
            <Package2 className="text-white w-10 h-10" />
          </div>
          <div className="text-center">
            <h1 className="font-black text-slate-800 text-2xl tracking-tight">
              {region.brand} <span className="text-orange-600">by DED</span>
            </h1>
            <p className="text-sm text-orange-600 font-bold uppercase tracking-widest animate-pulse">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col">
        <Header onShowModalities={() => setShowModalities(true)} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl shadow-orange-900/10 border border-orange-100 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2 text-orange-600 border-2 border-orange-100">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Accès Sécurisé</h1>
              <p className="text-slate-500 leading-relaxed font-medium">
                Bienvenue sur l'interface <span className="text-orange-600 font-bold">{region.brand} by DED</span>.
                Gérez vos contrats de livraison en toute confiance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 pt-4">
              <div 
                onClick={() => setShowModalities(true)}
                className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl text-left border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <Zap className="w-8 h-8 text-orange-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Zéro Papier Perdu</p>
                  <p className="text-xs text-orange-700/60 font-medium">Archivage automatique et systématique.</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
              Dschang Express Delivery © 2026
            </p>
          </div>
        </main>
        {showModalities && <Modalities onClose={() => setShowModalities(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col font-sans">
      <Header 
        onShowModalities={() => setShowModalities(true)} 
        onShowActivity={() => setCurrentView(View.DAILY_ACTIVITY)}
        brandName={region.brand}
      />
      
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 pb-20">
        <AnimatePresence mode="wait">
          {currentView === View.DASHBOARD && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DeliveryList 
                onSelect={handleSelectDelivery}
                onAdd={() => setCurrentView(View.FORM)}
              />
            </motion.div>
          )}

          {currentView === View.FORM && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DeliveryForm 
                onSuccess={() => setCurrentView(View.DASHBOARD)}
                onCancel={() => setCurrentView(View.DASHBOARD)}
              />
            </motion.div>
          )}

          {currentView === View.DETAIL && selectedDelivery && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <DeliveryDetail 
                delivery={selectedDelivery}
                onBack={() => {
                  setCurrentView(View.DASHBOARD);
                  setSelectedDelivery(null);
                }}
                onUpdate={() => {
                   setCurrentView(View.DASHBOARD);
                   setSelectedDelivery(null);
                }}
              />
            </motion.div>
          )}

          {currentView === View.DAILY_ACTIVITY && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DailyActivity 
                onBack={() => setCurrentView(View.DASHBOARD)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Add FAB on Dashboard */}
      {currentView === View.DASHBOARD && (
        <button
          onClick={() => setCurrentView(View.FORM)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-2xl shadow-xl shadow-orange-300 flex items-center justify-center hover:bg-orange-700 transition-all hover:scale-105 active:scale-95 z-50 md:hidden"
        >
          <Zap className="w-6 h-6 fill-current" />
        </button>
      )}

      {showModalities && <Modalities onClose={() => setShowModalities(false)} />}
    </div>
  );
}
