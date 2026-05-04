import { 
  User, 
  Settings, 
  LogOut, 
  Bookmark, 
  FileText, 
  Heart, 
  MessageCircle, 
  Edit2, 
  Globe, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Facebook,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Share2
} from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { auth, db } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/src/components/ui/badge';
import { ScrollArea } from '@/src/components/ui/scroll-area';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile States
  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    firstName: '',
    lastName: '',
    subtitle: '',
    bio: '',
    coverURL: '',
    photoURL: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      website: ''
    }
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      if (!userDoc.empty) {
        const data = userDoc.docs[0].data();
        setProfileData(data);
        setEditForm({
          displayName: data.displayName || user.displayName || '',
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          subtitle: data.subtitle || '',
          bio: data.bio || '',
          coverURL: data.coverURL || '',
          photoURL: data.photoURL || user.photoURL || '',
          socialLinks: data.socialLinks || {
            twitter: '',
            instagram: '',
            facebook: '',
            linkedin: '',
            website: ''
          }
        });
      }

      const postQuery = query(
        collection(db, 'posts'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const postSnap = await getDocs(postQuery);
      setUserPosts(postSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...editForm
      });
      setProfileData(prev => ({ ...prev, ...editForm }));
      toast.success('Profile updated successfully');
      setShowEditDialog(false);
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (e) {
      toast.error('Failed to sign out');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="relative h-[300px] w-full group overflow-hidden bg-emerald-950">
        <AnimatePresence>
          {profileData?.coverURL ? (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={profileData.coverURL} 
              alt="Cover" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 opacity-80" />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-6 right-6 flex gap-2">
           <Button 
            variant="secondary" 
            size="sm" 
            className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-emerald-950 font-bold border-none"
            onClick={() => setShowEditDialog(true)}
           >
             <ImageIcon size={16} className="mr-2" /> Change Cover
           </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Profile Card */}
          <aside className="lg:w-80 space-y-6">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur-xl">
              <CardContent className="p-8 text-center space-y-6">
                <div className="relative mx-auto w-40 h-40 group">
                  <div className="w-full h-full rounded-[2rem] border-8 border-white shadow-2xl overflow-hidden bg-emerald-50">
                    <img src={profileData?.photoURL || user.photoURL || ''} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2 size={18} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">
                    {profileData?.displayName || 'Ummah Member'}
                  </h2>
                  <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">
                    @{profileData?.username || 'user'}
                  </p>
                  {profileData?.subtitle && (
                    <p className="text-slate-400 text-xs font-bold leading-tight pt-2">{profileData.subtitle}</p>
                  )}
                </div>

                {profileData?.bio && (
                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl italic">
                    "{profileData.bio}"
                  </p>
                )}

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                   {profileData?.socialLinks?.twitter && (
                     <a href={`https://twitter.com/${profileData.socialLinks.twitter}`} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-50 transition-all">
                       <Twitter size={18} />
                     </a>
                   )}
                   {profileData?.socialLinks?.instagram && (
                     <a href={`https://instagram.com/${profileData.socialLinks.instagram}`} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                       <Instagram size={18} />
                     </a>
                   )}
                   {profileData?.socialLinks?.website && (
                     <a href={profileData.socialLinks.website} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                       <Globe size={18} />
                     </a>
                   )}
                </div>

                <div className="pt-6 border-t border-slate-50 space-y-3">
                   <Button 
                    onClick={() => setShowEditDialog(true)}
                    className="w-full h-12 bg-emerald-950 text-white rounded-2xl font-bold shadow-xl shadow-emerald-950/20 hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     <Edit2 size={16} className="mr-2" /> Edit Identity
                   </Button>
                   <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="w-full h-12 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                   >
                     <LogOut size={16} className="mr-2" /> End Session
                   </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-950 text-white overflow-hidden">
               <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                        <Calendar size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Joined On</p>
                        <p className="text-sm font-bold">{new Date(user.metadata.creationTime || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                     </div>
                  </div>
                  <div className="h-px bg-white/10" />
                  <p className="text-[10px] font-bold text-slate-400 text-center italic">Verified Momin Gateway Participant</p>
               </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Wisdom Shared', value: userPosts.length, icon: FileText, color: 'emerald' },
                 { label: 'Light Likes', value: userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0), icon: Heart, color: 'rose' },
                 { label: 'Followers', value: '1.2K', icon: User, color: 'blue' },
                 { label: 'Level', value: '12', icon: Settings, color: 'amber' }
               ].map(stat => (
                 <motion.div 
                  key={stat.label}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-50 text-center space-y-2"
                 >
                    <div className={`mx-auto w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                       <stat.icon size={20} />
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            <Tabs defaultValue="activity" className="space-y-6">
               <TabsList className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 h-16 w-full flex justify-start gap-2">
                  <TabsTrigger value="activity" className="rounded-2xl px-8 h-12 gap-2 text-sm font-bold data-[state=active]:bg-emerald-950 data-[state=active]:text-white transition-all">
                     <FileText size={16} /> Heart Contributions
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="rounded-2xl px-8 h-12 gap-2 text-sm font-bold data-[state=active]:bg-emerald-950 data-[state=active]:text-white transition-all">
                     <Bookmark size={16} /> Guarded Verses
                  </TabsTrigger>
               </TabsList>

               <TabsContent value="activity" className="space-y-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                       <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tracing footsteps...</p>
                    </div>
                  ) : userPosts.length > 0 ? (
                    userPosts.map((post, i) => (
                      <motion.div 
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                         <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden group">
                            <CardContent className="p-8 space-y-6">
                               <div className="flex items-center justify-between">
                                  <Badge className="bg-slate-50 text-slate-500 border-none font-bold uppercase tracking-widest text-[9px] px-3">
                                     {new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}
                                  </Badge>
                                  <div className="flex gap-2">
                                     <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:text-emerald-600"><Share2 size={16} /></Button>
                                  </div>
                               </div>
                               <p className="text-lg text-slate-800 leading-relaxed font-medium">{post.content}</p>
                               <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400"><Heart size={16} /> {post.likesCount || 0}</span>
                                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400"><MessageCircle size={16} /> {post.commentsCount || 0}</span>
                               </div>
                            </CardContent>
                         </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100">
                       <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <FileText size={40} className="text-slate-200" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900">Silent Spirit</h3>
                       <p className="text-slate-500 mt-2 max-w-xs mx-auto">Your journey of sharing hasn't started yet. Let your voice reach the Ummah.</p>
                       <Button onClick={() => navigate('/community')} className="mt-8 rounded-full bg-emerald-600 px-8">Join Community</Button>
                    </div>
                  )}
               </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 rounded-[2.5rem] overflow-hidden">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-8 space-y-8 pb-12">
               <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic text-emerald-950">Refine Identity</DialogTitle>
                  <p className="text-slate-500 font-medium">How should the Ummah recognize you?</p>
               </DialogHeader>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Display Name</label>
                     <Input 
                      value={editForm.displayName} 
                      onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))}
                      className="rounded-2xl h-12 border-slate-100 focus-visible:ring-emerald-600"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Username</label>
                     <Input 
                      value={editForm.username} 
                      onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                      className="rounded-2xl h-12 border-slate-100 focus-visible:ring-emerald-600"
                      placeholder="@username"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">First Name</label>
                     <Input 
                      value={editForm.firstName} 
                      onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                      className="rounded-2xl h-12 border-slate-100 focus-visible:ring-emerald-600"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Last Name</label>
                     <Input 
                      value={editForm.lastName} 
                      onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                      className="rounded-2xl h-12 border-slate-100 focus-visible:ring-emerald-600"
                     />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Catchy Subtitle</label>
                     <Input 
                      value={editForm.subtitle} 
                      onChange={e => setEditForm(p => ({ ...p, subtitle: e.target.value }))}
                      className="rounded-2xl h-12 border-slate-100 focus-visible:ring-emerald-600"
                      placeholder="e.g. Seeker of Knowledge • Software Engineer"
                     />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Depth of Character (Bio)</label>
                     <Textarea 
                      value={editForm.bio} 
                      onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                      className="rounded-2xl min-h-[120px] border-slate-100 focus-visible:ring-emerald-600 p-4"
                      placeholder="Share your spiritual journey..."
                     />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Custom Image Manifestation (URLs)</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          placeholder="Profile Picture URL" 
                          value={editForm.photoURL}
                          onChange={e => setEditForm(p => ({ ...p, photoURL: e.target.value }))}
                          className="rounded-2xl h-12 border-slate-100"
                        />
                        <Input 
                          placeholder="Cover Image URL" 
                          value={editForm.coverURL}
                          onChange={e => setEditForm(p => ({ ...p, coverURL: e.target.value }))}
                          className="rounded-2xl h-12 border-slate-100"
                        />
                     </div>
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
                     <h4 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Connective Gateways (Social)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                           <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <Input 
                            placeholder="Twitter Handle" 
                            className="pl-12 rounded-2xl h-12 border-slate-100" 
                            value={editForm.socialLinks.twitter}
                            onChange={e => setEditForm(p => ({ ...p, socialLinks: { ...p.socialLinks, twitter: e.target.value } }))}
                           />
                        </div>
                        <div className="relative">
                           <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <Input 
                            placeholder="Instagram Handle" 
                            className="pl-12 rounded-2xl h-12 border-slate-100" 
                            value={editForm.socialLinks.instagram}
                            onChange={e => setEditForm(p => ({ ...p, socialLinks: { ...p.socialLinks, instagram: e.target.value } }))}
                           />
                        </div>
                        <div className="relative">
                           <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <Input 
                            placeholder="Personal Website" 
                            className="pl-12 rounded-2xl h-12 border-slate-100" 
                            value={editForm.socialLinks.website}
                            onChange={e => setEditForm(p => ({ ...p, socialLinks: { ...p.socialLinks, website: e.target.value } }))}
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </ScrollArea>
          <div className="p-6 bg-slate-50 flex justify-end gap-3 rounded-b-[2.5rem]">
             <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="rounded-xl font-bold">Cancel</Button>
             <Button 
               onClick={handleUpdateProfile} 
               disabled={isUpdating}
               className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 font-bold shadow-lg shadow-emerald-600/20"
             >
                {isUpdating ? 'Sealing...' : 'Finalize Profile'}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

