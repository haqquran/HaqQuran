import { useEffect, useState, memo } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  Send,
  MoreVertical,
  Sparkles,
  Trash2,
  Edit3,
  AlertTriangle,
  Flag,
  Share,
  Users,
  Smile,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/src/components/ui/card';
import { Button as UIButton } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/src/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment,
  limit,
  deleteDoc,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/src/components/ui/badge';
import { ScrollArea } from '@/src/components/ui/scroll-area';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  imageUrl?: string;
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  reportCount?: number;
  createdAt: any;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: any;
}

export default function Community({ isAdmin }: { isAdmin: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  
  // Post Interaction States
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const generateHashtags = async () => {
    if (!newPostContent) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 relevant Islamic hashtags for this post: "${newPostContent}"`,
      });
      const tags = response.text?.match(/#\w+/g) || [];
      setSuggestedHashtags(tags);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePost = async () => {
    if (!auth.currentUser) return toast.error('Please sign in to post');
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const postData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Muslim Brother/Sister',
        userPhoto: auth.currentUser.photoURL || '',
        content: newPostContent,
        hashtags: suggestedHashtags,
        likesCount: 0,
        commentsCount: 0,
        reportCount: 0,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'posts'), postData);
      setNewPostContent('');
      setSuggestedHashtags([]);
      setShowCreateDialog(false);
      toast.success('Wisdom shared with the Ummah!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'posts');
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'posts', editingPost.id), {
        content: editingPost.content,
        updatedAt: serverTimestamp()
      });
      toast.success('Post updated');
      setEditingPost(null);
    } catch (e) {
      toast.error('Failed to update post');
    }
  };

  const likePost = async (postId: string) => {
    if (!auth.currentUser) return toast.error('Sign in to interaction');
    const userId = auth.currentUser.uid;
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    
    try {
      const likeDoc = await getDoc(likeRef);
      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(doc(db, 'posts', postId), { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, { userId, createdAt: serverTimestamp() });
        await updateDoc(doc(db, 'posts', postId), { likesCount: increment(1) });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `posts/${postId}/likes/${userId}`);
    }
  };

  const reportPost = async (postId: string) => {
    if (!auth.currentUser) return toast.error('Sign in to report');
    if (confirm('Report this post for review?')) {
      try {
        await setDoc(doc(db, 'posts', postId, 'reports', auth.currentUser.uid), {
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'posts', postId), { reportCount: increment(1) });
        toast.success('Post reported. Admins will review it.');
      } catch (e) {
        toast.error('Already reported or failed');
      }
    }
  };

  const deletePost = async (postId: string) => {
    if (confirm('Delete this post permanently?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        toast.success('Post removed');
      } catch (e) {
        toast.error('Failed to remove post');
      }
    }
  };

  const loadComments = (postId: string) => {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
  };

  useEffect(() => {
    if (selectedPostForComments) {
      const unsubscribe = loadComments(selectedPostForComments.id);
      return () => unsubscribe();
    }
  }, [selectedPostForComments]);

  const handleAddComment = async () => {
    if (!selectedPostForComments || !newComment.trim() || !auth.currentUser) return;
    setIsCommenting(true);
    try {
      await addDoc(collection(db, 'posts', selectedPostForComments.id, 'comments'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || '',
        content: newComment,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'posts', selectedPostForComments.id), {
        commentsCount: increment(1)
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (e) {
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async (post: Post) => {
    const shareUrl = window.location.origin + `/community?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HaqQuran Community Post',
          text: post.content,
          url: shareUrl
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-2xl mx-auto pb-40 min-h-screen bg-slate-50/30">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-emerald-950 italic tracking-tighter">Community</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users size={12} /> Spiritual Connection
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <UIButton className="bg-emerald-600 hover:bg-emerald-500 rounded-2xl h-12 px-6 shadow-xl shadow-emerald-600/20 font-bold transition-all active:scale-95">
              <Plus size={20} className="mr-2" /> Share Refection
            </UIButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden">
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic text-emerald-950">Broadcast Light</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12 border-2 border-emerald-50">
                    <AvatarImage src={auth.currentUser?.photoURL || ''} />
                    <AvatarFallback>{auth.currentUser?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <Textarea 
                      placeholder="What spiritual insight did you gain today?" 
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[160px] resize-none border-none focus-visible:ring-0 text-xl font-medium p-0"
                    />
                    
                    <AnimatePresence>
                      {suggestedHashtags.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-wrap gap-2"
                        >
                           {suggestedHashtags.map(tag => (
                             <Badge key={tag} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 font-bold">
                               {tag}
                             </Badge>
                           ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex gap-1">
                        <UIButton variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600 rounded-full h-10 w-10">
                          <ImageIcon size={20} />
                        </UIButton>
                        <UIButton 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600 hover:bg-emerald-50 rounded-full h-10 w-10"
                          onClick={generateHashtags}
                          disabled={!newPostContent}
                        >
                          <Sparkles size={20} />
                        </UIButton>
                      </div>
                      <UIButton 
                        onClick={handleCreatePost} 
                        disabled={isPosting || !newPostContent.trim()}
                        className="bg-emerald-950 hover:bg-emerald-900 rounded-xl px-8 h-12 font-bold shadow-xl"
                      >
                        {isPosting ? 'Broadcasting...' : 'Share Now'}
                      </UIButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="space-y-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-64 border-none shadow-sm rounded-[2rem] bg-white" />
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <Users size={64} className="mx-auto text-slate-100 mb-6" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The feed is silent...</p>
            <UIButton variant="link" onClick={() => setShowCreateDialog(true)} className="text-emerald-600 mt-4 text-lg font-bold italic">Be the first to share light</UIButton>
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white group hover:scale-[1.01] transition-all">
                  <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-emerald-50 ring-4 ring-emerald-50/20">
                        <AvatarImage src={post.userPhoto} />
                        <AvatarFallback>{post.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-black text-slate-900 italic tracking-tight">{post.userName}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                          {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate()) : 'just now'} • Verfied
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <UIButton variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-600 rounded-full">
                          <MoreVertical size={20} />
                        </UIButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-slate-50 shadow-xl p-2 min-w-[160px]">
                        {post.userId === auth.currentUser?.uid ? (
                          <>
                            <DropdownMenuItem onClick={() => setEditingPost(post)} className="rounded-xl font-bold gap-2 text-slate-600">
                               <Edit3 size={16} /> Edit Legacy
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deletePost(post.id)} className="rounded-xl font-bold gap-2 text-rose-500">
                               <Trash2 size={16} /> Delete Forever
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => reportPost(post.id)} className="rounded-xl font-bold gap-2 text-amber-600">
                             <Flag size={16} /> Report Content
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleShare(post)} className="rounded-xl font-bold gap-2 text-slate-600">
                           <Share size={16} /> Share Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <p className="text-xl text-slate-800 font-medium leading-[1.6] whitespace-pre-wrap">{post.content}</p>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.map(tag => (
                          <Badge key={tag} className="bg-emerald-50 text-emerald-700 border-none font-bold uppercase text-[9px] tracking-widest px-3">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="pt-8 flex items-center justify-between border-t border-slate-50">
                      <div className="flex gap-2">
                        <UIButton 
                          variant="ghost" 
                          onClick={() => likePost(post.id)}
                          className="h-12 px-6 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-3 transition-all"
                        >
                          <Heart size={22} className={post.likesCount > 0 ? "fill-rose-500 text-rose-500" : ""} /> 
                          {post.likesCount || 0}
                        </UIButton>
                        <UIButton 
                          variant="ghost" 
                          onClick={() => setSelectedPostForComments(post)}
                          className="h-12 px-6 rounded-2xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold gap-3 transition-all"
                        >
                          <MessageCircle size={22} /> {post.commentsCount || 0}
                        </UIButton>
                      </div>
                      <UIButton 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleShare(post)}
                        className="h-12 w-12 rounded-2xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      >
                        <Share2 size={22} />
                      </UIButton>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Post Editor Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
         <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8">
            <DialogHeader>
               <DialogTitle className="text-2xl font-black italic">Refine Reflection</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <Textarea 
                value={editingPost?.content || ''}
                onChange={e => setEditingPost(p => p ? ({ ...p, content: e.target.value }) : null)}
                className="min-h-[200px] border-none focus-visible:ring-0 text-xl font-medium p-0"
               />
            </div>
            <DialogFooter>
               <UIButton variant="ghost" onClick={() => setEditingPost(null)} className="rounded-xl font-bold">Discard</UIButton>
               <UIButton onClick={handleUpdatePost} className="bg-emerald-950 rounded-xl px-8 font-bold">Update Legacy</UIButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Comments Drawer/Dialog */}
      <Dialog open={!!selectedPostForComments} onOpenChange={(open) => !open && setSelectedPostForComments(null)}>
         <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black italic">Ummah Dialogue</DialogTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Constructive & Respectful</p>
                  </div>
               </div>
               <UIButton variant="ghost" size="icon" onClick={() => setSelectedPostForComments(null)}><X /></UIButton>
            </div>

            <ScrollArea className="flex-1 p-8">
               <div className="space-y-8">
                  {comments.length === 0 ? (
                    <div className="text-center py-20 grayscale opacity-40">
                       <Smile size={64} className="mx-auto mb-4" />
                       <p className="font-bold uppercase tracking-widest text-[10px]">No voices joined this dialogue yet</p>
                    </div>
                  ) : (
                    comments.map((comment, i) => (
                      <motion.div 
                        key={comment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4"
                      >
                         <Avatar className="w-10 h-10 border border-slate-100">
                            <AvatarImage src={comment.userPhoto} />
                            <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                               <h5 className="font-bold text-slate-900 text-sm italic">{comment.userName}</h5>
                               <span className="text-[9px] font-bold text-slate-300 uppercase">
                                 {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate()) : '...'}
                               </span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none">
                               <p className="text-sm text-slate-700 leading-relaxed font-medium">{comment.content}</p>
                            </div>
                         </div>
                      </motion.div>
                    ))
                  )}
               </div>
            </ScrollArea>

            <div className="p-8 bg-white border-t border-slate-50 shadow-2xl">
               <div className="flex gap-3">
                  <Input 
                    placeholder="Add your contribution..." 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="flex-1 h-14 rounded-2xl border-slate-100 focus-visible:ring-emerald-600 font-medium"
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  />
                  <UIButton 
                    onClick={handleAddComment}
                    disabled={isCommenting || !newComment.trim()}
                    className="h-14 w-14 rounded-2xl bg-emerald-950 text-white shadow-xl shadow-emerald-950/20 transition-all active:scale-90"
                  >
                     {isCommenting ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                  </UIButton>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

