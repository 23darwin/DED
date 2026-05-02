import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LogOut, LogIn, Package2, ShieldCheck, BarChart3 } from 'lucide-react';

interface HeaderProps {
  onShowModalities?: () => void;
  onShowActivity?: () => void;
  brandName?: string;
}

export default function Header({ onShowModalities, onShowActivity, brandName }: HeaderProps) {
  const user = auth.currentUser;

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-orange-100 px-4 h-16 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
          <Package2 className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tight text-slate-800 leading-none">
            {brandName ? (
              <>
                <span className="text-orange-600 italic">{brandName}</span>
                <span className="text-[10px] text-slate-400 align-top ml-1">By DED</span>
              </>
            ) : (
              <>Dschang <span className="text-orange-600">Express</span></>
            )}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Delivery System</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {user && onShowActivity && (
          <button 
            onClick={onShowActivity}
            className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100"
            title="Activité Journalière"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        )}

        {onShowModalities && (
          <button 
            onClick={onShowModalities}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors group relative"
            title="Modalités & Sécurité"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        )}
        
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Coursier en service</p>
              <p className="text-sm font-bold text-slate-700">{user.displayName}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-black text-sm hover:bg-orange-700 transition-all shadow-md shadow-orange-200"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </button>
        )}
      </div>
    </header>
  );
}
