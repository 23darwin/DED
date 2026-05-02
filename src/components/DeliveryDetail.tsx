import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { db, auth, handleFirestoreError } from '../firebase/config';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Delivery, DeliveryStatus, OperationType } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Phone, 
  ChevronLeft, 
  Lock, 
  Image as ImageIcon,
  AlertTriangle,
  FileDown,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface DeliveryDetailProps {
  delivery: Delivery;
  onBack: () => void;
  onUpdate: () => void;
}

export default function DeliveryDetail({ delivery, onBack, onUpdate }: DeliveryDetailProps) {
  const sigPad = useRef<SignatureCanvas>(null);
  const [securityCode, setSecurityCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const isManager = auth.currentUser?.email === 'darwinjovian3@gmail.com';

  const sendWhatsAppCode = () => {
    const message = `Bonjour ${delivery.clientName}, ici DED (Dschang Express Delivery). Votre colis (${delivery.displayId}) est prêt. Quartier: ${delivery.deliveryQuarter}. CODE DE LIVRAISON: ${delivery.securityCode}. Ne le donnez qu'au coursier à l'arrivée du colis.`;
    const url = `https://wa.me/${delivery.whatsappNumber.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(249, 115, 22); // Orange Color
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DED - REÇU DE LIVRAISON', 15, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Identifiant Course: ${delivery.displayId}`, 15, 32);

    // Content
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFontSize(11);
    
    let y = 60;
    const addRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 80, y);
      y += 10;
    };

    addRow('Destinataire:', delivery.clientName);
    addRow('WhatsApp:', delivery.whatsappNumber);
    addRow('Quartier de Livraison:', delivery.deliveryQuarter);
    addRow('Agence de Transport:', delivery.transportAgency);
    addRow('Type de Colis:', delivery.serviceType);
    addRow('Frais de Course:', `${delivery.totalAmount} FCFA`);
    addRow('Statut Actuel:', delivery.status);
    addRow('Archivé le:', format(new Date(delivery.timestamp), 'PPPp', { locale: fr }));
    
    if (delivery.status === DeliveryStatus.DELIVERED) {
      const deliveredEntry = delivery.statusHistory.find(h => h.status === DeliveryStatus.DELIVERED);
      if (deliveredEntry) {
        addRow('Finalisé le:', format(new Date(deliveredEntry.timestamp), 'PPPp', { locale: fr }));
      }
    }

    // Signature
    if (delivery.clientSignature) {
      y += 15;
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.line(20, y, 190, y);
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURE CLIENT DE RÉCEPTION:', 20, y);
      y += 5;
      try {
        doc.addImage(delivery.clientSignature, 'PNG', 20, y, 50, 25);
      } catch (e) {
        console.error('Error adding signature', e);
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Dschang Express Delivery (DED) - Votre confiance, notre priorité.', 20, 285);
    doc.text(`Généré le ${format(new Date(), 'Pp', { locale: fr })}`, 150, 285);
    
    doc.save(`Recu-DED-${delivery.displayId}.pdf`);
  };

  const handleVerifyCode = () => {
    if (securityCode === delivery.securityCode) {
      setCodeError(false);
      setShowSignature(true);
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 2000);
    }
  };

  const handleComplete = async () => {
    if (!sigPad.current?.isEmpty()) {
      setLoading(true);
      const path = `deliveries/${delivery.id}`;
      try {
        const signatureData = sigPad.current?.getCanvas().toDataURL('image/png');
        const now = new Date().toISOString();
        const newStatus = DeliveryStatus.DELIVERED;
        
        await updateDoc(doc(db, 'deliveries', delivery.id), {
          clientSignature: signatureData,
          status: newStatus,
          statusHistory: arrayUnion({ status: newStatus, timestamp: now }),
          updatedAt: serverTimestamp(),
        });
        
        // Refresh local state or parent
        onUpdate();
        
        // Automatic PDF Download
        generatePDF();

        // Optional Final WhatsApp Notification
        const confirmMsg = `✅ CONFIRMATION DED: Votre colis ${delivery.displayId} a été livré avec succès par notre coursier. Merci de votre confiance!`;
        const waUrl = `https://wa.me/${delivery.whatsappNumber.replace(/\s+/g, '')}?text=${encodeURIComponent(confirmMsg)}`;
        
        setTimeout(() => {
          if (confirm('LIVRAISON RÉUSSIE ! Un reçu PDF a été généré. Souhaitez-vous envoyer la confirmation finale WhatsApp au client ?')) {
            window.open(waUrl, '_blank');
          }
        }, 500);

      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setLoading(false);
        setIsConfirming(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors font-black uppercase tracking-widest text-[10px]">
        <ChevronLeft className="w-4 h-4" />
        <span>Dashboard</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-100 overflow-hidden">
        {/* Banner */}
        <div className={`p-8 ${delivery.status === DeliveryStatus.DELIVERED ? 'bg-slate-800' : 'bg-orange-600'} text-white relative`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Détails de Livraison</p>
              <h2 className="text-3xl font-black tracking-tight">{delivery.displayId}</h2>
            </div>
            <div className="flex items-center gap-3">
              {delivery.status === DeliveryStatus.DELIVERED && (
                <button 
                  onClick={generatePDF}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 border border-white/10"
                  title="Télécharger Reçu PDF"
                >
                  <FileDown className="w-5 h-5" />
                  <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Reçu</span>
                </button>
              )}
              <div className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                delivery.status === DeliveryStatus.DELIVERED ? 'bg-slate-700 border-slate-600' : 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-700/20'
              }`}>
                {delivery.status}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Courier Verification Section */}
          <div className="bg-orange-50/50 border-2 border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100 shadow-sm overflow-hidden">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Coursier DED Certifié</p>
                <h3 className="text-xl font-black text-slate-800 leading-none">{delivery.courierName || 'Coursier Officiel'}</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase mt-2">DED ID: {delivery.courierId?.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 text-center sm:text-right">
              <span className="px-4 py-1.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-green-200">Identité Vérifiée</span>
              <p className="text-[10px] text-slate-400 font-bold italic">Ne confiez votre colis qu'à un agent badges DED.</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Heure d'Archivage</p>
                  <p className="text-slate-800 font-bold text-lg leading-tight">
                    {format(new Date(delivery.timestamp), 'PPPp', { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quartier (Dschang)</p>
                  <p className="text-slate-800 font-bold text-lg leading-tight">{delivery.deliveryQuarter}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100">
                  <Phone className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client WhatsApp</p>
                  <p className="text-slate-800 font-bold text-lg leading-tight">{delivery.clientName}</p>
                  <p className="text-xs font-bold text-orange-600">{delivery.whatsappNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agence</span>
                <span className="font-black text-slate-800">{delivery.transportAgency}</span>
              </div>
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                <span className="font-black text-slate-800">{delivery.serviceType}</span>
              </div>
              <div className="flex items-center justify-between p-5 bg-orange-50 rounded-2xl border-2 border-orange-100 shadow-inner">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Montant</span>
                <span className="font-black text-orange-700 text-lg">{delivery.totalAmount} FCFA</span>
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-400" />
                Bordereau Agence
              </p>
              {delivery.receiptPhoto ? (
                <div className="relative group overflow-hidden rounded-2xl border-2 border-slate-100 shadow-sm">
                  <img src={delivery.receiptPhoto} className="w-full h-48 object-cover transition-transform group-hover:scale-105" alt="Receipt" />
                  <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ) : (
                <div className="w-full h-48 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 text-xs font-bold uppercase tracking-widest">
                  Aucun Image
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-400" />
                État du Colis
              </p>
              {delivery.parcelStatusPhoto ? (
                <div className="relative group overflow-hidden rounded-2xl border-2 border-slate-100 shadow-sm">
                  <img src={delivery.parcelStatusPhoto} className="w-full h-48 object-cover transition-transform group-hover:scale-105" alt="Parcel" />
                  <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ) : (
                <div className="w-full h-48 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 text-xs font-bold uppercase tracking-widest">
                  Aucune Image
                </div>
              )}
            </div>
          </div>

          {/* Delivery Process */}
          {delivery.status !== DeliveryStatus.DELIVERED ? (
            <div className="pt-8 border-t-2 border-orange-50 space-y-8">
              {/* Manager Section: Send Code */}
              {isManager && (
                <div className="bg-slate-800 p-6 rounded-[2.5rem] border-2 border-slate-700 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">Espace Patron</p>
                      <h4 className="text-white font-black text-lg uppercase tracking-tight">Code de Sécurité</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black font-mono tracking-[0.2em] text-orange-500">{delivery.securityCode}</p>
                    </div>
                  </div>
                  <button 
                    onClick={sendWhatsAppCode}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-900/40 uppercase tracking-widest text-xs"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Envoyer le code au client (WhatsApp)
                  </button>
                </div>
              )}

              {!showSignature ? (
                <div className="max-w-xs mx-auto space-y-6 text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-600 border-2 border-orange-100 shadow-inner">
                    <Lock className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xl tracking-tight">Validation Sécurisée</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">Code Secret requis</p>
                  </div>
                  <input 
                    type="password"
                    maxLength={4}
                    placeholder="- - - -"
                    className={`w-full text-center py-6 bg-slate-50 border-2 rounded-2xl text-4xl font-mono tracking-[1em] outline-none transition-all shadow-inner ${
                      codeError ? 'border-red-500 bg-red-50 animate-shake' : 'border-slate-100 focus:border-orange-500'
                    }`}
                    value={securityCode}
                    onChange={e => setSecurityCode(e.target.value)}
                  />
                  {codeError && <p className="text-xs font-black text-red-500 uppercase tracking-widest animate-pulse">Code Incorrect !</p>}
                  <button 
                    onClick={handleVerifyCode}
                    className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
                  >
                    Vérifier
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-3 uppercase tracking-widest">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 border border-green-100">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      Signature Client
                    </h3>
                    <button 
                      onClick={() => sigPad.current?.clear()}
                      className="text-[10px] text-orange-600 font-black uppercase tracking-widest hover:underline px-3 py-1 bg-orange-50 rounded-lg border border-orange-100"
                    >
                      Effacer
                    </button>
                  </div>
                  <div className="border-2 border-slate-200 rounded-3xl bg-slate-50 overflow-hidden h-72 shadow-inner relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <span className="text-6xl font-black text-slate-900 rotate-[-12deg]">ZONE TACTILE</span>
                    </div>
                    <SignatureCanvas 
                      ref={sigPad}
                      penColor="black"
                      canvasProps={{ className: 'w-full h-full' }}
                    />
                  </div>
                  {!isConfirming ? (
                    <button 
                      onClick={() => {
                        if (!sigPad.current?.isEmpty()) {
                          setIsConfirming(true);
                        }
                      }}
                      className="w-full py-6 bg-orange-600 text-white rounded-2xl font-black text-xl hover:bg-orange-700 transition-all shadow-2xl shadow-orange-200 uppercase tracking-widest"
                    >
                      Confirmer Livraison
                    </button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="bg-slate-800 p-6 rounded-3xl text-center border-2 border-slate-700 shadow-2xl">
                        <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                        <h4 className="text-white font-black text-lg uppercase tracking-tight">Finaliser la Livraison ?</h4>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Cette action est irréversible et clôture le dossier.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setIsConfirming(false)}
                          className="py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all uppercase tracking-widest"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleComplete}
                          disabled={loading}
                          className="py-5 bg-green-600 text-white rounded-2xl font-black text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 uppercase tracking-widest"
                        >
                          {loading ? 'Traitement...' : 'Oui, Finaliser'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-8 border-t-2 border-slate-50 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 border-4 border-white shadow-xl shadow-green-100">
                  <CheckCircle2 className="w-14 h-14" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Livraison Archivée</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-tight mt-1">Soutenu par le Contrat de Confiance DED</p>
                </div>
                {delivery.clientSignature && (
                  <div className="w-full max-w-sm p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 text-left tracking-widest">Sceau de Signature</p>
                    <img src={delivery.clientSignature} className="h-32 mx-auto object-contain drop-shadow-sm" alt="Archived Signature" />
                  </div>
                )}

                {/* Status History Audit Trail */}
                <div className="w-full max-w-sm text-left space-y-3 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historique de la Course</p>
                  <div className="space-y-3">
                    {delivery.statusHistory?.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3 relative">
                        {idx !== delivery.statusHistory.length - 1 && (
                          <div className="absolute left-[7px] top-4 w-0.5 h-6 bg-slate-100" />
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          idx === 0 ? 'bg-orange-600 border-orange-200' : 'bg-slate-200 border-white'
                        }`} />
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 leading-none">{entry.status}</p>
                          <p className="text-[9px] text-slate-400 font-medium">
                            {format(new Date(entry.timestamp), 'p', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-4 max-w-sm bg-slate-800 p-5 rounded-3xl text-left border-2 border-slate-700 shadow-2xl shadow-slate-900/40">
                  <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed font-bold italic">
                    "La responsabilité de DED se limite à 24h après cette signature pour toute réclamation relative au magasinage ou à l'état du colis." — Article 4 du Contrat DED.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
