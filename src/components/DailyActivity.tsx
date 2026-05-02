import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Delivery, DeliveryStatus } from '../types';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Banknote,
  ChevronLeft,
  Calendar
} from 'lucide-react';

interface DailyActivityProps {
  onBack: () => void;
}

export default function DailyActivity({ onBack }: DailyActivityProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCount: 0,
    deliveredCount: 0,
    pendingCount: 0,
    totalRevenue: 0,
    deliveries: [] as Delivery[]
  });

  useEffect(() => {
    const fetchDailyStats = async () => {
      if (!auth.currentUser) return;
      
      setLoading(true);
      try {
        const deliveriesRef = collection(db, 'deliveries');
        const q = query(
          deliveriesRef, 
          where('createdBy', '==', auth.currentUser.uid)
        );
        
        const snapshot = await getDocs(q);
        const allDeliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
        
        const today = new Date();
        const todayDeliveries = allDeliveries.filter(d => {
          const date = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.timestamp);
          return isSameDay(date, today);
        });

        const delivered = todayDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED);
        const pending = todayDeliveries.filter(d => d.status !== DeliveryStatus.DELIVERED);
        const revenue = delivered.reduce((acc, d) => acc + (d.totalAmount || 0), 0);

        setStats({
          totalCount: todayDeliveries.length,
          deliveredCount: delivered.length,
          pendingCount: pending.length,
          totalRevenue: revenue,
          deliveries: todayDeliveries
        });
      } catch (error) {
        console.error("Error fetching daily stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Calcul des performances...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Retour</span>
        </button>
        <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-orange-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Aujourd'hui, {format(new Date(), 'dd MMMM', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-orange-900/5 border border-orange-50 space-y-3">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Courses</p>
            <p className="text-2xl font-black text-slate-800 leading-none mt-1">{stats.totalCount}</p>
          </div>
          <p className="text-[9px] font-bold text-orange-600 uppercase tracking-tight">Active aujourd'hui</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-[2rem] shadow-2xl space-y-3">
          <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Livrées</p>
            <p className="text-2xl font-black text-white leading-none mt-1">{stats.deliveredCount}</p>
          </div>
          <p className="text-[9px] font-bold text-green-400 uppercase tracking-tight">Succès Garanti</p>
        </div>

        <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-orange-900/5 border border-orange-50 space-y-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En Attente</p>
            <p className="text-2xl font-black text-slate-800 leading-none mt-1">{stats.pendingCount}</p>
          </div>
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">À finaliser</p>
        </div>

        <div className="bg-orange-600 p-5 rounded-[2rem] shadow-xl shadow-orange-200 space-y-3">
          <div className="w-10 h-10 bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Chiffre d'Affaires</p>
            <p className="text-2xl font-black text-white leading-none mt-1">{stats.totalRevenue.toLocaleString()} <span className="text-xs">FCFA</span></p>
          </div>
          <p className="text-[9px] font-bold text-white/80 uppercase tracking-tight">Collecté</p>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-600" />
          Journal d'Activité
        </h3>
        
        {stats.deliveries.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 text-xs font-medium italic">Aucune activité enregistrée aujourd'hui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    delivery.status === DeliveryStatus.DELIVERED ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 leading-none">{delivery.displayId}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{delivery.clientName} • {delivery.deliveryQuarter}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-800">{delivery.totalAmount} FCFA</p>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {delivery.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 text-center space-y-2">
        <p className="text-white font-black text-sm uppercase tracking-tight">Besoin d'un rapport détaillé ?</p>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          Les rapports hebdomadaires sont générés automatiquement chaque dimanche soir.
        </p>
      </div>
    </div>
  );
}
