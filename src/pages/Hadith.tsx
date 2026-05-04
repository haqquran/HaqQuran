import { 
  Search, 
  BookOpen, 
  Quote, 
  ChevronRight, 
  Loader2, 
  Library, 
  ChevronLeft,
  Settings2,
  Copy,
  Share2,
  Bookmark,
  Sparkles,
  Eye,
  EyeOff,
  Type,
  ExternalLink,
  BookMarked,
  Info,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import { Slider } from "@/src/components/ui/slider";
import { Switch } from "@/src/components/ui/switch";
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface HadithItem {
  hadithNumber: string;
  hadithArabic: string;
  hadithEnglish: string;
  bookName: string;
  hadithGrade?: string;
  status?: string;
}

export default function Hadith() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<HadithItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showBookInfo, setShowBookInfo] = useState<{name: string, info: string} | null>(null);

  // Pagination helper
  const fetchHadiths = async (bookSlug: string, pageNum = 1, append = false) => {
    setLoading(true);
    setSelectedBook(bookSlug);
    setPage(pageNum);
    try {
      let url = `https://hadith-api.com/api/hadiths?book=${bookSlug}&paginate=20&page=${pageNum}&apiKey=$2y$10$f9T7j7N9W3N0X7f4Z2y1O2k1g1i1j1l1m1n1o1p1q1r1s1t1u1v1w`;
      if (filterSahihOnly) url += '&status=Sahih';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const newHadiths = data.hadiths.data;
        setResults(append ? [...results, ...newHadiths] : newHadiths);
        setHasMore(data.hadiths.next_page_url !== null);
      }
    } catch (e) {
      toast.error('Could not fetch Hadiths');
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomHadith = async () => {
    setLoading(true);
    try {
       const res = await fetch(`https://hadith-api.com/api/hadiths?paginate=1&apiKey=$2y$10$f9T7j7N9W3N0X7f4Z2y1O2k1g1i1j1l1m1n1o1p1q1r1s1t1u1v1w`);
       if (res.ok) {
         const data = await res.json();
         setResults(data.hadiths.data);
         setSelectedBook('Random Wisdom');
         setHasMore(false);
       }
    } catch (e) {
       toast.error('Failed to get random hadith');
    } finally {
       setLoading(false);
    }
  };

  // Settings states
  const [arabicFontSize, setArabicFontSize] = useState(24);
  const [englishFontSize, setEnglishFontSize] = useState(16);
  const [showArabic, setShowArabic] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [readingTheme, setReadingTheme] = useState<'classic' | 'modern' | 'dusk'>('modern');
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [filterSahihOnly, setFilterSahihOnly] = useState(false);
  
  // Session Footprints
  const [sessionHistory, setSessionHistory] = useState<HadithItem[]>([]);
  
  // AI Insight states
  const [selectedHadithForInsight, setSelectedHadithForInsight] = useState<HadithItem | null>(null);
  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('hadith-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setArabicFontSize(parsed.arabicFontSize || 24);
      setEnglishFontSize(parsed.englishFontSize || 16);
      setShowArabic(parsed.showArabic !== false);
      setShowEnglish(parsed.showEnglish !== false);
    }
  }, []);

  const saveSettings = (newSettings: any) => {
    localStorage.setItem('hadith-settings', JSON.stringify({
      arabicFontSize,
      englishFontSize,
      showArabic,
      showEnglish,
      ...newSettings
    }));
  };

  const generateInsight = async (hadith: HadithItem) => {
    setSelectedHadithForInsight(hadith);
    setAiInsight('');
    setIsAiLoading(true);
    
    // Add to footprints
    if (!sessionHistory.find(h => h.hadithNumber === hadith.hadithNumber)) {
      setSessionHistory(prev => [hadith, ...prev].slice(0, 10));
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Provide a scholarly explanation and context for this Hadith from ${hadith.bookName}. 
      Arabic: ${hadith.hadithArabic}
      English: ${hadith.hadithEnglish}
      
      Focus on basic lessons, context, and practical application. Keep it respectful and concise.`;
      
      const result = await model.generateContent(prompt);
      setAiInsight(result.response.text());
    } catch (e) {
      toast.error('Failed to generate scholarly insight');
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleBookmark = async (hadith: HadithItem) => {
    if (!auth.currentUser) return toast.error('Please sign in to bookmark Hadiths');
    const bookmarkId = `hadith_${hadith.hadithNumber}_${hadith.bookName.replace(/\s+/g, '_')}`;
    const ref = doc(db, 'users', auth.currentUser.uid, 'bookmarks', bookmarkId);
    
    try {
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        await deleteDoc(ref);
        toast.success('Removed from bookmarks');
      } else {
        await setDoc(ref, {
          type: 'hadith',
          data: hadith,
          createdAt: serverTimestamp()
        });
        toast.success('Added to bookmarks');
      }
    } catch (e) {
      toast.error('Failed to update bookmark');
    }
  };

  const copyHadith = (hadith: HadithItem) => {
    const text = `Hadith #${hadith.hadithNumber} - ${hadith.bookName}\n\n${hadith.hadithArabic}\n\n${hadith.hadithEnglish}\n\nShared via HaqQuran`;
    navigator.clipboard.writeText(text);
    toast.success('Hadith copied to clipboard');
  };

  const printHadith = (hadith: HadithItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Hadith #${hadith.hadithNumber} - HaqQuran</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #022c22; line-height: 1.6; }
            .arabic { font-size: 28px; text-align: right; direction: rtl; margin-bottom: 30px; border-bottom: 2px solid #f0fdf4; padding-bottom: 20px; }
            .english { font-size: 18px; font-style: italic; color: #475569; border-left: 4px solid #10b981; padding-left: 20px; }
            .meta { margin-top: 40px; font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
            .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="meta">${hadith.bookName} - Narration #${hadith.hadithNumber}</div>
          <p class="arabic">${hadith.hadithArabic}</p>
          <p class="english">${hadith.hadithEnglish}</p>
          <div class="footer">Documented and Shared via HaqQuran.com</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareHadith = async (hadith: HadithItem) => {
    const text = `Hadith #${hadith.hadithNumber} - ${hadith.bookName}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hadith from HaqQuran',
          text: `${text}\n\n${hadith.hadithEnglish}`,
          url: window.location.origin + '/hadith'
        });
      } catch (e) { console.error(e); }
    } else {
      copyHadith(hadith);
    }
  };

  const books = [
    { name: 'Sahih Bukhari', slug: 'sahih-bukhari', info: 'Compiled by Imam Bukhari, the most authentic collection of Hadith.' },
    { name: 'Sahih Muslim', slug: 'sahih-muslim', info: 'Compiled by Imam Muslim ibn al-Hajjaj, secondary only to Bukhari.' },
    { name: 'Sunan Abi Dawud', slug: 'sunan-abi-dawud', info: 'One of the six major Hadith collections, focusing on legal rulings.' },
    { name: 'Jami at-Tirmidhi', slug: 'jami-at-tirmidhi', info: 'Compiled by Imam at-Tirmidhi, known for classifying Hadith grades.' },
    { name: 'Sunan an-Nasa\'i', slug: 'sunan-an-nasai', info: 'One of the six major collections, known for its strict criteria.' },
    { name: 'Sunan Ibn Majah', slug: 'sunan-ibn-majah', info: 'Last of the six major collections, covering various topics.' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    
    // Track search history
    if (!recentSearches.includes(search)) {
      setRecentSearches(prev => [search, ...prev].slice(0, 5));
    }

    try {
       const res = await fetch(`https://hadith-api.com/api/hadiths?search=${search}&paginate=10&apiKey=$2y$10$f9T7j7N9W3N0X7f4Z2y1O2k1g1i1j1l1m1n1o1p1q1r1s1t1u1v1w`);
       if (res.ok) {
         const data = await res.json();
         setResults(data.hadiths.data);
         setSelectedBook('Search Results');
         setHasMore(false);
       }
    } catch (e) {
       toast.error('Search failed');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className={`p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-32 transition-all ${isStudyMode ? 'max-w-4xl' : ''}`}>
      <Helmet>
        <title>Hadith Library - Authentic Sayings of Prophet Muhammad | HaqQuran</title>
        <meta name="description" content="Search and browse authentic collections of Hadith including Sahih Bukhari, Sahih Muslim, and more on HaqQuran." />
      </Helmet>

      {!isStudyMode && (
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {selectedBook ? (
                   <button onClick={() => { setSelectedBook(null); setResults([]); }} className="p-2 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors">
                      <ChevronLeft size={24} />
                   </button>
                ) : (
                  <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                     <Library size={24} />
                  </div>
                )}
                <h2 className="text-5xl font-black text-emerald-950 tracking-tighter italic">{selectedBook || 'Hadith Library'}</h2>
              </div>
              <p className="text-slate-500 font-medium max-w-xl text-lg leading-tight">Gain deeper knowledge through the sayings and actions of Prophet Muhammad (PBUH).</p>
              {!selectedBook && (
                <Button 
                  variant="link" 
                  onClick={fetchRandomHadith}
                  className="p-0 h-auto text-emerald-600 font-bold flex items-center gap-2 hover:no-underline"
                >
                  <Sparkles size={16} /> Random Light of Wisdom
                </Button>
              )}
            </div>
            
            <div className="flex flex-col gap-4 flex-1 max-w-md">
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={24} />
                <Input 
                  className="pl-12 h-16 rounded-3xl border-slate-100 bg-white shadow-xl shadow-emerald-900/5 focus-visible:ring-emerald-600 text-lg font-medium" 
                  placeholder="Search topics..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
              {recentSearches.length > 0 && !selectedBook && (
                 <div className="flex flex-wrap gap-2">
                    {recentSearches.map(s => (
                      <Badge 
                        key={s} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        onClick={() => { setSearch(s); handleSearch({ preventDefault: () => {} } as any); }}
                      >
                        {s}
                      </Badge>
                    ))}
                 </div>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-16 w-16 rounded-3xl border-slate-100 shadow-xl shadow-emerald-900/5 text-slate-400 hover:text-emerald-600">
                  <Settings2 size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-[2.5rem] p-8 w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-3xl font-black italic text-emerald-950">Grand Library Options</SheetTitle>
                  <SheetDescription className="font-medium">Curate your atmosphere of learning.</SheetDescription>
                </SheetHeader>
                <div className="py-12 space-y-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Atmosphere</label>
                     <div className="grid grid-cols-3 gap-3">
                        {['modern', 'classic', 'dusk'].map(t => (
                          <button 
                            key={t}
                            onClick={() => setReadingTheme(t as any)}
                            className={`h-12 rounded-xl text-xs font-bold border-2 capitalize transition-all ${
                              readingTheme === t ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-50 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <Type size={20} />
                        </div>
                        <span className="font-bold text-slate-900">Arabic Size</span>
                      </div>
                      <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{arabicFontSize}px</span>
                    </div>
                    <Slider 
                      value={[arabicFontSize]} 
                      min={18} 
                      max={48} 
                      step={1} 
                      onValueChange={(val: number[]) => { setArabicFontSize(val[0]); saveSettings({ arabicFontSize: val[0] }); }} 
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-50 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-950 rounded-xl flex items-center justify-center text-emerald-400">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-none">Verified Narrations</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sahih/Authentic Only</span>
                        </div>
                      </div>
                      <Switch checked={filterSahihOnly} onCheckedChange={(val) => { setFilterSahihOnly(val); if(selectedBook) fetchHadiths(selectedBook, 1); }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <Sparkles size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-none">Dhikr Mode</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Focused Study Layout</span>
                        </div>
                      </div>
                      <Switch checked={isStudyMode} onCheckedChange={setIsStudyMode} />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}

      {isStudyMode && (
        <div className="flex items-center justify-between py-4 border-b border-slate-100">
           <Button variant="ghost" onClick={() => setIsStudyMode(false)} className="font-bold text-slate-400 gap-2">
              <ChevronLeft size={16} /> Exit Focused Study
           </Button>
           <Badge className="bg-emerald-950 text-emerald-400 border-none font-black italic uppercase tracking-widest text-[9px]">Dhikr Mode Active</Badge>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedBook ? (
          <motion.div 
            key="books"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {books.map(book => (
              <Card key={book.slug} onClick={() => fetchHadiths(book.slug)} className="hover:shadow-md cursor-pointer border-slate-200 group hover:border-emerald-200 transition-all">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="font-bold text-slate-900">{book.name}</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-300 hover:text-emerald-600"
                      onClick={(e) => { e.stopPropagation(); setShowBookInfo({name: book.name, info: book.info}); }}
                    >
                      <Info size={18} />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Major Collection</p>
                    <ChevronRight className="text-slate-200 group-hover:text-emerald-300 transition-colors" size={20} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
                <p className="text-slate-500 font-medium font-black uppercase tracking-[0.2em] text-[10px]">Verifying Chain of Narration...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((hadith, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border-none shadow-2xl overflow-hidden rounded-[2.5rem] group hover:scale-[1.01] transition-all
                    ${readingTheme === 'classic' ? 'bg-[#fdfcf5] border-[#f1efe1]' : readingTheme === 'dusk' ? 'bg-[#1e201d] text-[#e0e0e0]' : 'bg-white'}`}
                  >
                    <CardContent className="p-10 space-y-10">
                      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b 
                        ${readingTheme === 'dusk' ? 'border-white/5' : 'border-slate-50'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic shadow-lg
                              ${readingTheme === 'dusk' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}
                            >
                               H{hadith.hadithNumber.slice(-2)}
                            </div>
                            <div>
                               <h4 className={`font-black tracking-tight italic ${readingTheme === 'dusk' ? 'text-white' : 'text-slate-900'}`}>Narration #{hadith.hadithNumber}</h4>
                               <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{selectedBook}</p>
                                  {hadith.status && (
                                    <Badge className={`text-[8px] h-4 rounded-sm border-none font-bold italic shadow-sm
                                      ${hadith.status === 'Sahih' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}
                                    >
                                      {hadith.status}
                                    </Badge>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleBookmark(hadith)}
                              className={`w-12 h-12 rounded-2xl transition-all ${readingTheme === 'dusk' ? 'text-white/40 hover:text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            >
                               <Bookmark size={20} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => printHadith(hadith)}
                              className={`w-12 h-12 rounded-2xl transition-all ${readingTheme === 'dusk' ? 'text-white/40 hover:text-slate-200 hover:bg-white/5' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                               <Printer size={20} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => shareHadith(hadith)}
                              className={`w-12 h-12 rounded-2xl transition-all ${readingTheme === 'dusk' ? 'text-white/40 hover:text-blue-400 hover:bg-blue-400/10' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
                            >
                               <Share2 size={20} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => copyHadith(hadith)}
                              className={`w-12 h-12 rounded-2xl transition-all ${readingTheme === 'dusk' ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
                            >
                               <Copy size={20} />
                            </Button>
                         </div>
                      </div>

                      {showArabic && (
                        <p 
                          className={`font-serif leading-[1.8] text-right rtl ${readingTheme === 'dusk' ? 'text-white' : 'text-slate-900'}`} 
                          dir="rtl"
                          style={{ fontSize: `${arabicFontSize}px` }}
                        >
                          {hadith.hadithArabic}
                        </p>
                      )}

                      {showEnglish && (
                        <p 
                          className={`leading-relaxed font-medium italic border-l-4 pl-8 py-2 
                            ${readingTheme === 'dusk' ? 'text-white/70 border-emerald-600/30' : 'text-slate-600 border-emerald-100'}`}
                          style={{ fontSize: `${englishFontSize}px` }}
                        >
                          {hadith.hadithEnglish}
                        </p>
                      )}

                      <div className={`pt-6 border-t flex justify-between items-center ${readingTheme === 'dusk' ? 'border-white/5' : 'border-slate-50'}`}>
                         <div className="flex gap-2">
                           {hadith.hadithGrade && (
                             <Badge variant="outline" className={`border-emerald-100 text-emerald-600 rounded-lg h-10 px-4 font-black text-xs italic ${readingTheme === 'dusk' ? 'border-emerald-400/20 text-emerald-400' : ''}`}>
                               Grade: {hadith.hadithGrade}
                             </Badge>
                           )}
                         </div>
                         <Button 
                          onClick={() => generateInsight(hadith)}
                          className={`rounded-2xl px-10 h-12 font-bold shadow-xl transition-all active:scale-95
                            ${readingTheme === 'dusk' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-950 text-white shadow-emerald-950/20 hover:scale-[1.02]'}`}
                         >
                            <Sparkles size={18} className="mr-2 text-emerald-400" /> Seek Insight
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No Hadiths found. Try a different search term or collection.</p>
              </div>
            )}
            
            {hasMore && !loading && (
              <div className="flex justify-center pt-8">
                 <Button 
                  onClick={() => fetchHadiths(selectedBook!, page + 1, true)}
                  variant="outline"
                  className="rounded-full px-12 h-12 border-slate-200 font-bold text-emerald-600 hover:bg-emerald-50"
                 >
                    Load More Narrations
                 </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHadithForInsight && (
          <Dialog open={!!selectedHadithForInsight} onOpenChange={(open) => !open && setSelectedHadithForInsight(null)}>
            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden">
               <div className="p-8 space-y-6">
                  <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                       <div className="w-12 h-12 rounded-2xl bg-emerald-950 flex items-center justify-center text-emerald-400">
                          <Sparkles size={24} />
                       </div>
                       <div>
                          <DialogTitle className="text-2xl font-black italic text-emerald-950">Scholar's Insight</DialogTitle>
                          <DialogDescription className="font-bold text-xs uppercase tracking-widest">AI Assisted Contextual Study</DialogDescription>
                       </div>
                    </div>
                  </DialogHeader>

                  <ScrollArea className="max-h-[60vh] pr-4">
                     {isAiLoading ? (
                       <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Unfolding Layers of Meaning...</p>
                       </div>
                     ) : (
                       <div className="space-y-6 prose prose-slate">
                          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                             <p className="text-emerald-900 font-bold italic leading-relaxed">
                               {selectedHadithForInsight.hadithEnglish}
                             </p>
                          </div>
                          <div className="whitespace-pre-wrap text-slate-700 font-medium leading-[1.8]">
                             {aiInsight}
                          </div>
                       </div>
                     )}
                  </ScrollArea>

                  <div className="pt-6 border-t border-slate-50 flex justify-end">
                     <Button 
                      onClick={() => setSelectedHadithForInsight(null)}
                      className="rounded-xl px-10 h-12 font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                     >
                        Close Portal
                     </Button>
                  </div>
               </div>
            </DialogContent>
          </Dialog>
        )}

        {showBookInfo && (
           <Dialog open={!!showBookInfo} onOpenChange={() => setShowBookInfo(null)}>
              <DialogContent className="rounded-[2.5rem] p-8">
                 <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                       <Info size={24} />
                    </div>
                    <DialogTitle className="text-3xl font-black italic text-slate-900">{showBookInfo.name}</DialogTitle>
                    <p className="text-slate-500 font-medium leading-relaxed pt-2">{showBookInfo.info}</p>
                 </DialogHeader>
                 <div className="pt-8 flex justify-end">
                    <Button onClick={() => setShowBookInfo(null)} className="rounded-xl bg-slate-900 text-white px-8 font-bold">I Understand</Button>
                 </div>
              </DialogContent>
           </Dialog>
        )}

        {sessionHistory.length > 0 && !selectedBook && !isStudyMode && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-12 border-t border-slate-100"
          >
             <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                   <h3 className="text-2xl font-black italic text-emerald-950">Grand Discovery Path</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your session footprint</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSessionHistory([])} className="font-bold text-rose-500 hover:bg-rose-50">Clear Path</Button>
             </div>
             <div className="flex gap-4 overflow-x-auto pb-4 px-1 -mx-1 scrollbar-hide">
                {sessionHistory.map(hadith => (
                   <Card 
                    key={hadith.hadithNumber} 
                    onClick={() => generateInsight(hadith)}
                    className="min-w-[280px] w-[280px] p-6 border-slate-50 shadow-lg rounded-3xl cursor-pointer hover:border-emerald-200 transition-all flex flex-col justify-between"
                   >
                      <p className="text-xs font-medium text-slate-600 line-clamp-3 italic mb-4">"{hadith.hadithEnglish}"</p>
                      <div className="flex items-center justify-between">
                         <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-widest px-2">H{hadith.hadithNumber}</Badge>
                         <p className="text-[10px] font-black text-slate-300 uppercase">{hadith.bookName}</p>
                      </div>
                   </Card>
                ))}
             </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
