import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, UserPlus, Globe, BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (e) {
        // If it's a first time sign in, maybe the user exists but permission is denied for some reason
        // Or it's a fresh account. We try to read it first to avoid overwriting.
      }

      if (!userSnap?.exists()) {
        try {
          await setDoc(userRef, {
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoURL,
            bio: '',
            isAdmin: result.user.email === 'HaqQuran@gmail.com',
            createdAt: serverTimestamp(),
          });
          toast.success('Welcome to HaqQuran! Account created.');
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${result.user.uid}`);
        }
      } else {
        toast.success(`Welcome back, ${result.user.displayName}!`);
      }

      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-[0.03] pointer-events-none">
         <Globe size={800} className="absolute -top-64 -left-64 text-emerald-900" />
         <BookOpen size={400} className="absolute -bottom-32 -right-32 text-emerald-900" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm">
          <div className="h-2 bg-emerald-600"></div>
          <CardHeader className="text-center space-y-4 p-8 pb-4">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
               <ShieldCheck size={32} className="text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black text-emerald-950 tracking-tighter italic">HaqQuran</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Verified Gateway</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-3">
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                  <LogIn size={20} className="text-blue-600" />
                  <div className="flex-1">
                     <h4 className="font-bold text-slate-900 text-xs text-left">Member Login</h4>
                     <p className="text-[10px] text-slate-500 text-left">Connect with your registered Google account</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                  <UserPlus size={20} className="text-emerald-600" />
                  <div className="flex-1">
                     <h4 className="font-bold text-slate-900 text-xs text-left">New Account</h4>
                     <p className="text-[10px] text-slate-500 text-left">Verified profile created automatically on sign in</p>
                  </div>
               </div>
            </div>

            <Button 
              className="w-full h-14 bg-emerald-950 text-white hover:bg-emerald-900 rounded-2xl text-lg font-bold gap-3 shadow-xl transition-all active:scale-95" 
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                   <Globe size={24} />
                </motion.div>
              ) : (
                <>
                  <Globe size={24} className="text-emerald-400" />
                  Continue with Google
                </>
              )}
            </Button>
          </CardContent>

          <CardFooter className="p-8 bg-slate-50/80 flex flex-col gap-4 text-center">
             <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest"><ShieldCheck size={10} /> Secure</div>
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest"><BookOpen size={10} /> Knowledge</div>
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest"><MessageCircle size={10} /> Community</div>
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed font-bold tracking-tight">
                HaqQuran uses Google verified accounts to ensure a safe, respectful, and authentic Islamic community for all members.
             </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
