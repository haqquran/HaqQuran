import { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  MessageCircle, 
  Activity, 
  TrendingUp, 
  ShieldCheck,
  Search,
  Trash2,
  ShieldAlert,
  ShieldCheck as ShieldIcon,
  Filter,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { db, handleFirestoreError, OperationType, auth } from '@/src/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { Badge } from '@/src/components/ui/badge';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

export default function Admin() {
  const [stats, setStats] = useState({
    usersCount: 0,
    postsCount: 0,
    activeToday: 0
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const postsSnap = await getDocs(collection(db, 'posts'));
      
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const postsData = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setAllUsers(usersData);
      setAllPosts(postsData);
      setStats({
        usersCount: usersSnap.size,
        postsCount: postsSnap.size,
        activeToday: Math.floor(usersSnap.size * 0.4) 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'admin_data');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setAllUsers(prev => prev.filter(u => u.id !== userId));
        toast.success('User deleted');
      } catch (e) {
        toast.error('Failed to delete user');
      }
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isAdmin: !currentStatus });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: !currentStatus } : u));
      toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'}`);
    } catch (e) {
      toast.error('Permission denied');
    }
  };

  const deletePost = async (postId: string) => {
    if (confirm('Delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        setAllPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post removed');
      } catch (e) {
        toast.error('Failed to remove post');
      }
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.displayName?.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-emerald-950 tracking-tight flex items-center gap-3">
             <ShieldCheck size={40} className="text-emerald-600" /> Control Tower
          </h2>
          <p className="text-slate-500 font-medium">Platform-wide management and moderation.</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2 rounded-full border-slate-200">
           <Activity size={16} /> Refresh Metrics
        </Button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Users, label: 'Verified Mominin', value: stats.usersCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: FileText, label: 'Feed Content', value: stats.postsCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: TrendingUp, label: 'Active Sessions', value: stats.activeToday, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm relative overflow-hidden group">
            <CardContent className="p-8">
              <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full ${stat.bg} group-hover:scale-110 transition-transform flex items-center justify-center`}>
                 <stat.icon size={64} className={`opacity-10 ${stat.color}`} />
              </div>
              <div className="relative z-10 space-y-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                 <p className="text-5xl font-black tracking-tighter text-slate-900">{stat.value}</p>
                 <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-2">
                    <TrendingUp size={12} /> Standard Growth Rate
                 </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-full w-full max-w-md">
          <TabsTrigger value="users" className="rounded-full flex-1 gap-2">
            <Users size={16} /> User Management
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-full flex-1 gap-2">
            <FileText size={16} /> Content Moderation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-slate-100 shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between p-6">
              <CardTitle className="text-lg flex items-center gap-2 italic">
                 <Users size={20} className="text-slate-400" /> Member List ({filteredUsers.length})
              </CardTitle>
              <div className="relative w-64">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <Input 
                   className="h-10 pl-10 text-sm bg-white border-slate-200 rounded-full" 
                   placeholder="Search name or email..." 
                   value={searchUser}
                   onChange={e => setSearchUser(e.target.value)}
                 />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-slate-50">
                  {filteredUsers.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">No members found matching your search.</div>
                  ) : filteredUsers.map((user) => (
                    <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 overflow-hidden ring-4 ring-white shadow-sm">
                            {user.photoURL ? <img src={user.photoURL} alt="" /> : user.displayName?.[0]}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{user.displayName || 'Anonymous User'}</p>
                              {user.isAdmin && <Badge className="bg-emerald-600 text-[10px] uppercase font-black tracking-widest">Admin</Badge>}
                            </div>
                            <p className="text-xs text-slate-500">{user.email}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => toggleAdmin(user.id, user.isAdmin)}
                           className={user.isAdmin ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}
                         >
                            {user.isAdmin ? <ShieldAlert size={16} className="mr-2" /> : <ShieldIcon size={16} className="mr-2" />}
                            {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           disabled={user.id === auth.currentUser?.uid}
                           onClick={() => deleteUser(user.id)}
                           className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                         >
                            <Trash2 size={18} />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card className="border-slate-100 shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg">Recent Feed Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-slate-50">
                     {allPosts.map((post) => (
                       <div key={post.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-4 justify-between group">
                          <div className="flex gap-4 flex-1">
                             <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                                <img src={post.userPhoto} alt="" />
                             </div>
                             <div className="space-y-1">
                                <p className="text-sm font-bold">{post.userName}</p>
                                <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                                <div className="flex gap-2 pt-1">
                                   <Badge variant="outline" className="text-[10px]">{post.likesCount} Likes</Badge>
                                   <Badge variant="outline" className="text-[10px]">{post.commentsCount} Comments</Badge>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600">
                                <Eye size={18} />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => deletePost(post.id)}
                               className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                             >
                                <Trash2 size={18} />
                             </Button>
                          </div>
                       </div>
                     ))}
                  </div>
               </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
