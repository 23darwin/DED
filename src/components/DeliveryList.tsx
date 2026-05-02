import React, { useEffect, useState } from 'react';
import { db, auth, handleFirestoreError } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { Delivery, OperationType, DeliveryStatus } from '../types';
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Package, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeliveryListProps {
  onSelect: (delivery: Delivery) => void;
  onAdd: () => void;
}

export default function DeliveryList({ onSelect, onAdd }: DeliveryListProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DeliveryStatus | 'Toutes'>('Toutes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = 'deliveries';
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Delivery[];
      setDeliveries(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = d.displayId.toLowerCase().includes(search.toLowerCase()) || 
                         d.clientName.toLowerCase().includes(search.toLowerCase()) ||
                         d.deliveryQuarter.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'Toutes' || d.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status !== DeliveryStatus.DELIVERED).length,
    completed: deliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Chargement des courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
          <p className="text-xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 shadow-sm">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Actives</p>
          <p className="text-xl font-black text-orange-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Livrées</p>
          <p className="text-xl font-black text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Rechercher par ID, Nom, Quartier..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-orange-100 rounded-2xl outline-none focus:border-orange-500 transition-colors shadow-sm font-medium text-slate-700"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="pl-10 pr-8 py-3 bg-white border border-orange-100 rounded-2xl outline-none focus:border-orange-500 transition-colors shadow-sm appearance-none font-bold text-slate-600 text-xs uppercase"
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
            >
              <option value="Toutes">Tous les statuts</option>
              {Object.values(DeliveryStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={onAdd}
            className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-orange-100">
            <Package className="w-12 h-12 text-orange-100 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800">Aucune livraison trouvée</h3>
            <p className="text-slate-400 text-sm">Commencez par enregistrer un nouveau contrat.</p>
          </div>
        ) : (
          filteredDeliveries.map(delivery => (
            <div 
              key={delivery.id}
              onClick={() => onSelect(delivery)}
              className={`bg-white p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md cursor-pointer group flex items-center gap-4 ${
                delivery.status !== DeliveryStatus.DELIVERED ? 'border-orange-500 shadow-orange-900/5' : 'border-transparent hover:border-orange-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                delivery.status === DeliveryStatus.DELIVERED ? 'bg-slate-50 text-slate-400' : 'bg-orange-50 text-orange-600 border border-orange-100'
              }`}>
                {delivery.status === DeliveryStatus.DELIVERED ? <CheckCircle2 className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">#{delivery.displayId}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    delivery.status === DeliveryStatus.DELIVERED ? 'text-slate-400' : 'text-orange-600'
                  }`}>
                    {delivery.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-800 truncate leading-tight mb-1">{delivery.clientName}</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-medium truncate">{delivery.deliveryQuarter}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{format(new Date(delivery.timestamp), 'HH:mm')}</span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
