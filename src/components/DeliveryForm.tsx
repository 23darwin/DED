import React, { useState } from 'react';
import { db, auth, handleFirestoreError } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  TransportAgency, 
  ServiceType, 
  DeliveryStatus, 
  OperationType 
} from '../types';
import { Camera, MapPin, Send, Package, Phone, User, Hash, Banknote, X } from 'lucide-react';

interface DeliveryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ImagePickerProps {
  label: string;
  image: string | null;
  onImageSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  id: string;
}

function ImagePicker({ label, image, onImageSelected, onClear, id }: ImagePickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div 
        className={`relative h-48 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
          image ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/30'
        }`}
        onClick={() => !image && document.getElementById(id)?.click()}
      >
        {image ? (
          <div className="relative w-full h-full animate-in fade-in zoom-in duration-300">
            <img src={image} className="h-full w-full object-cover rounded-[1.8rem]" alt={label} />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="p-3 bg-red-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all sm:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-orange-500 group-hover:scale-110 transition-all shadow-sm">
              <Camera className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-orange-600">Ouvrir l'Appareil</span>
              <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Photo Directe ou Galerie</p>
            </div>
          </div>
        )}
        <input 
          id={id}
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          onChange={onImageSelected}
        />
      </div>
    </div>
  );
}

export default function DeliveryForm({ onSuccess, onCancel }: DeliveryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    whatsappNumber: '',
    transportAgency: TransportAgency.MENOUA,
    deliveryQuarter: '',
    serviceType: ServiceType.COLIS,
    totalAmount: 500,
    notes: '',
    securityCode: Math.floor(1000 + Math.random() * 9000).toString(),
  });

  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [parcelPhoto, setParcelPhoto] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 800;

          if (width > height) {
            if (width > maxDimension) {
              height *= maxDimension / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width *= maxDimension / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG for smaller size (Firestore limit is 1MB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setter(dataUrl);
          
          // Reset input so same file can be selected again
          e.target.value = '';
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = (type: 'receipt' | 'parcel') => {
    if (type === 'receipt') {
      setReceiptPhoto(null);
      const input = document.getElementById('receipt-input') as HTMLInputElement;
      if (input) input.value = '';
    } else {
      setParcelPhoto(null);
      const input = document.getElementById('parcel-input') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    const path = 'deliveries';
    try {
      // Mock unique ID generation for DED
      const displayId = `DED-${Date.now().toString().slice(-4)}`;
      
      const now = new Date().toISOString();
      const status = DeliveryStatus.PENDING;
      
      await addDoc(collection(db, path), {
        ...formData,
        displayId,
        timestamp: now,
        createdAt: serverTimestamp(),
        receiptPhoto,
        parcelStatusPhoto: parcelPhoto,
        status,
        statusHistory: [{ status, timestamp: now }],
        createdBy: auth.currentUser.uid,
        courierId: auth.currentUser.uid,
        courierName: auth.currentUser.displayName || 'Coursier Officiel',
        courierPhone: '', // Would be fetched from profile in a real app
      });
      
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <Package className="w-6 h-6" />
            </div>
            Nouveau Contrat
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nom du Client</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <input
                  required
                  type="text"
                  placeholder="Ex: M. Junior"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <input
                  required
                  type="tel"
                  placeholder="6xx xxx xxx"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location & Agency */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agence de Transport</label>
              <select
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-slate-700 appearance-none"
                value={formData.transportAgency}
                onChange={e => setFormData({ ...formData, transportAgency: e.target.value as TransportAgency })}
              >
                {Object.values(TransportAgency).map(agency => (
                  <option key={agency} value={agency}>{agency}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quartier (Dschang)</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <input
                  required
                  type="text"
                  placeholder="Ex: Cité U, Foto, Keleng"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                  value={formData.deliveryQuarter}
                  onChange={e => setFormData({ ...formData, deliveryQuarter: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type de Service</label>
              <select
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-slate-700 appearance-none"
                value={formData.serviceType}
                onChange={e => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
              >
                {Object.values(ServiceType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Montant Total (FCFA)</label>
              <div className="relative">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <input
                  type="number"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                  value={formData.totalAmount || ''}
                  onChange={e => setFormData({ ...formData, totalAmount: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                />
              </div>
            </div>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ImagePicker 
            id="receipt-input"
            label="Bordereau Agence"
            image={receiptPhoto}
            onImageSelected={e => handleFileChange(e, setReceiptPhoto)}
            onClear={() => clearPhoto('receipt')}
          />

          <ImagePicker 
            id="parcel-input"
            label="État du Colis"
            image={parcelPhoto}
            onImageSelected={e => handleFileChange(e, setParcelPhoto)}
            onClear={() => clearPhoto('parcel')}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observations</label>
          <textarea
            placeholder="Notes sur l'état du colis..."
            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-slate-700 h-28 resize-none"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all uppercase tracking-widest"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-5 bg-orange-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xl shadow-orange-200 uppercase tracking-widest"
        >
          {loading ? 'Archivage...' : (
            <>
              <Send className="w-5 h-5" />
              CONFIRMER
            </>
          )}
        </button>
      </div>
    </form>
  );
}
