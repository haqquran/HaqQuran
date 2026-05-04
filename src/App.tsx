/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/src/components/ui/sonner';
import { Helmet } from 'react-helmet-async';
import Layout from '@/src/components/Layout';
import Home from '@/src/pages/Home';
import Quran from '@/src/pages/Quran';
import Hadith from '@/src/pages/Hadith';
import Community from '@/src/pages/Community';
import Learning from '@/src/pages/Learning';
import Prayer from '@/src/pages/Prayer';
import Profile from '@/src/pages/Profile';
import Auth from '@/src/pages/Auth';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';

import Admin from '@/src/pages/Admin';
import { db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          setIsAdmin(userDoc.data()?.isAdmin || u.email === 'HaqQuran@gmail.com');
        } catch (error) {
          // If it fails, maybe the user doc doesn't exist yet (first sign in)
          // or insufficient permissions. We still allow them through if they are the bootstrap admin.
          setIsAdmin(u.email === 'HaqQuran@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-full mb-4"></div>
          <p className="text-emerald-900 font-medium">HaqQuran</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Helmet>
        <title>HaqQuran - Authentic Islamic Knowledge Sharing</title>
        <meta name="description" content="Read Quran, Hadith, get prayer times and join our Islamic community on HaqQuran." />
      </Helmet>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route element={<Layout user={user} isAdmin={isAdmin} />}>
          <Route path="/" element={<Home />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/hadith" element={<Hadith />} />
          <Route path="/community" element={<Community isAdmin={isAdmin} />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/prayer" element={<Prayer />} />
          <Route path="/profile" element={<Profile />} />
          {isAdmin && <Route path="/admin" element={<Admin />} />}
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
