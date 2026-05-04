import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Book, 
  Play, 
  Bookmark, 
  Info, 
  ChevronLeft, 
  Sparkles, 
  Send, 
  Volume2, 
  Pause,
  Settings2,
  Type,
  Languages,
  Quote as QuoteIcon,
  ChevronRight,
  Filter as FilterIcon,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button as UIButton } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/src/components/ui/dialog';
import { Textarea } from '@/src/components/ui/textarea';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  translation?: string;
}

const EDITIONS = [
  { id: 'en.sahih', name: 'English (Sahih)', lang: 'EN' },
  { id: 'ur.jalandhry', name: 'Urdu', lang: 'UR' },
  { id: 'tr.ates', name: 'Turkish', lang: 'TR' },
  { id: 'fr.hamidullah', name: 'French', lang: 'FR' },
];

export default function Quran() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [readingLoading, setReadingLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // New UI states
  const [selectedEdition, setSelectedEdition] = useState('en.sahih');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [fontSize, setFontSize] = useState(24);
  const [showTranslation, setShowTranslation] = useState(true);

  useEffect(() => {
    fetchSurahs();
    return () => {
      if (currentAudio) currentAudio.pause();
    };
  }, []);

  const playAyahAudio = async (ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      currentAudio?.pause();
      setPlayingAyah(null);
      return;
    }

    if (currentAudio) currentAudio.pause();

    try {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/ar.alafasy`);
      const data = await res.json();
      const audio = new Audio(data.data.audio);
      audio.onended = () => setPlayingAyah(null);
      audio.play();
      setCurrentAudio(audio);
      setPlayingAyah(ayahNumber);
    } catch (e) {
      toast.error('Failed to load audio');
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const context = selectedSurah ? `Analyzing Surah ${selectedSurah.englishName}. ` : '';
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${context}Question about Quran: ${aiQuestion}. Provide authentic information based on mainstream Islamic scholarship. State clearly if there are differing opinions.`,
      });
      setAiResponse(response.text || 'No response found.');
    } catch (e) {
      toast.error('AI Assistant failed. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredSurahs(
      surahs.filter(s => 
        s.englishName.toLowerCase().includes(term) || 
        s.number.toString().includes(term) ||
        s.name.includes(term)
      )
    );
  }, [search, surahs]);

  const fetchSurahs = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await res.json();
      setSurahs(data.data);
      setFilteredSurahs(data.data);
    } catch (error) {
      toast.error('Failed to load Surahs');
    } finally {
      setLoading(false);
    }
  };

  const readSurah = async (surahValue: Surah, editionId: string = selectedEdition) => {
    setSelectedSurah(surahValue);
    setReadingLoading(true);
    try {
      const [resAr, resTr] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surahValue.number}/quran-simple`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahValue.number}/${editionId}`)
      ]);
      const dataAr = await resAr.json();
      const dataTr = await resTr.json();

      const combined = dataAr.data.ayahs.map((ayah: any, i: number) => ({
        ...ayah,
        translation: dataTr.data.ayahs[i].text
      }));
      setAyahs(combined);
    } catch (error) {
      toast.error('Failed to load Ayahs');
    } finally {
      setReadingLoading(false);
    }
  };

  const handleSurahClick = (surah: Surah) => {
    readSurah(surah);
  };

  if (selectedSurah) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <Helmet>
          <title>{selectedSurah.englishName} - Read Holy Quran Online | HaqQuran</title>
          <meta name="description" content={`Read Surah ${selectedSurah.englishName} with translation in ${selectedEdition}. Authentic Quran recitation and AI assistance.`} />
        </Helmet>
        
        <header className="sticky top-0 z-20 bg-emerald-950 text-white px-4 py-3 shadow-xl backdrop-blur-md bg-opacity-95">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UIButton 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (currentAudio) currentAudio.pause();
                  setSelectedSurah(null);
                }}
                className="text-white hover:bg-emerald-800 rounded-full"
              >
                <ChevronLeft size={24} />
              </UIButton>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black italic tracking-tight">{selectedSurah.englishName}</h2>
                  <Badge variant="outline" className="text-[9px] border-emerald-700 text-emerald-400 bg-emerald-900/50">
                    {selectedSurah.revelationType}
                  </Badge>
                </div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">
                  {selectedSurah.englishNameTranslation} • {selectedSurah.numberOfAyahs} Ayahs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <Dialog>
                 <DialogTrigger asChild>
                    <UIButton variant="ghost" size="icon" className="text-emerald-400 hover:text-white">
                       <Settings2 size={20} />
                    </UIButton>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-md">
                   <DialogHeader>
                     <DialogTitle>Reading Preferences</DialogTitle>
                   </DialogHeader>
                   <div className="space-y-6 pt-4">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Languages size={14} /> Translation Language
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                           {EDITIONS.map(ed => (
                             <UIButton 
                               key={ed.id} 
                               variant={selectedEdition === ed.id ? "default" : "outline"}
                               className="text-xs justify-start h-10"
                               onClick={() => {
                                 setSelectedEdition(ed.id);
                                 readSurah(selectedSurah, ed.id);
                               }}
                             >
                               {ed.name}
                             </UIButton>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Type size={14} /> Arabic Font Size ({fontSize}px)
                        </label>
                        <Input 
                          type="range" 
                          min="18" 
                          max="64" 
                          value={fontSize} 
                          onChange={(e) => setFontSize(parseInt(e.target.value))}
                          className="h-2"
                        />
                     </div>

                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="space-y-0.5">
                           <p className="text-sm font-bold">Display Translation</p>
                        </div>
                        <input 
                           type="checkbox" 
                           checked={showTranslation} 
                           onChange={() => setShowTranslation(!showTranslation)}
                        />
                     </div>
                   </div>
                 </DialogContent>
               </Dialog>

               <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
                <DialogTrigger render={
                  <UIButton variant="ghost" className="bg-emerald-900 border border-emerald-800 text-emerald-400 hover:text-white hover:bg-emerald-800 rounded-full h-9 px-4 gap-2">
                     <Sparkles size={16} /> <span className="text-xs font-bold">AI Help</span>
                  </UIButton>
                } />
                <DialogContent className="sm:max-w-lg">
                   <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles size={20} className="text-emerald-600" />
                        AI Quran Guide
                      </DialogTitle>
                   </DialogHeader>
                   <div className="space-y-4 pt-4">
                     <Textarea 
                       placeholder="Ask about themes, historical context, or specific verses..." 
                       value={aiQuestion}
                       onChange={(e) => setAiQuestion(e.target.value)}
                       className="min-h-[120px]"
                     />
                     <UIButton 
                       onClick={askAI} 
                       disabled={isAiLoading || !aiQuestion.trim()}
                       className="w-full bg-emerald-600"
                     >
                       {isAiLoading ? 'Synthesizing knowledge...' : 'Reveal Insights'}
                     </UIButton>
                     {aiResponse && (
                       <ScrollArea className="h-[250px] p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm leading-relaxed whitespace-pre-wrap">
                          {aiResponse}
                       </ScrollArea>
                     )}
                   </div>
                </DialogContent>
               </Dialog>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-16 pb-24">
            {readingLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Illuminating Pages...</p>
              </div>
            ) : (
              ayahs.map((ayah, i) => (
                <motion.div 
                  key={ayah.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.02 }}
                  className="space-y-8 group border-b border-slate-50 pb-16"
                >
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center font-black text-emerald-600">
                         {ayah.numberInSurah}
                      </div>
                      <div className="flex items-center gap-1">
                        <UIButton 
                          variant="ghost" 
                          size="icon" 
                          className={playingAyah === ayah.number ? "text-emerald-600 bg-emerald-50 rounded-full" : "text-slate-300 hover:text-emerald-600 rounded-full"}
                          onClick={() => playAyahAudio(ayah.number)}
                        >
                           {playingAyah === ayah.number ? <Pause size={20} /> : <Volume2 size={20} />}
                        </UIButton>
                        <UIButton variant="ghost" size="icon" className="text-slate-300 hover:text-amber-500 rounded-full">
                           <Bookmark size={18} />
                        </UIButton>
                      </div>
                    </div>
                  </div>

                  <p 
                    className="text-right leading-[2em] font-serif text-slate-900 tracking-wide" 
                    dir="rtl"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {ayah.text}
                  </p>

                  {showTranslation && (
                    <div className="flex gap-4">
                       <QuoteIcon size={24} className="text-emerald-100 flex-shrink-0" />
                       <p className="text-lg text-slate-600 leading-relaxed font-medium italic border-l-4 border-emerald-50 pl-6">
                         {ayah.translation}
                       </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
            
            {!readingLoading && (
              <div className="text-center pt-10 pb-20">
                 <h4 className="text-2xl font-black text-emerald-950 italic">Sadaqallahul Azim</h4>
                 <UIButton 
                   variant="outline" 
                   onClick={() => setSelectedSurah(null)}
                   className="mt-8 rounded-full"
                 >
                    Return to Library
                 </UIButton>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-32">
      <Helmet>
        <title>Read Holy Quran Online - English Translation & Audio | HaqQuran</title>
        <meta name="description" content="Explore all 114 Surahs of the Holy Quran with authentic Arabic text, multi-language translations, audio recitation, and AI powered understanding." />
      </Helmet>
      
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-emerald-950 tracking-tighter italic">Holy Quran</h2>
            <p className="text-slate-500 font-medium max-w-xl text-lg">Illuminate your soul with the final revelation. Search, read, and listen.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full">
             <UIButton 
               variant={viewMode === 'grid' ? "default" : "ghost"} 
               size="icon" 
               onClick={() => setViewMode('grid')}
               className="rounded-full w-10 h-10"
             >
                <LayoutGrid size={18} />
             </UIButton>
             <UIButton 
               variant={viewMode === 'list' ? "default" : "ghost"} 
               size="icon" 
               onClick={() => setViewMode('list')}
               className="rounded-full w-10 h-10"
             >
                <ListIcon size={18} />
             </UIButton>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={24} />
            <Input 
              className="pl-12 h-16 rounded-3xl border-slate-100 bg-white shadow-xl shadow-emerald-900/5 focus-visible:ring-emerald-600 text-lg font-medium" 
              placeholder="Search Surah by name or number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <UIButton className="h-16 px-8 rounded-3xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 gap-2 font-bold text-lg">
             <FilterIcon size={20} /> Advanced Filter
          </UIButton>
        </div>
      </header>

      <div className={cn(
        "gap-6",
        viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
      )}>
        {loading ? (
          Array(12).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-3xl"></div>
          ))
        ) : filteredSurahs.map((surah) => (
          <Card 
            key={surah.number} 
            onClick={() => handleSurahClick(surah)}
            className="hover:shadow-2xl hover:scale-[1.02] cursor-pointer border-slate-50 transition-all group rounded-[2rem] overflow-hidden"
          >
            <CardContent className="p-0">
               <div className="flex items-center gap-5 p-6">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                   {surah.number}
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center justify-between">
                     <h3 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-emerald-600">{surah.englishName}</h3>
                     <span className="text-xl font-serif text-slate-400" dir="rtl">{surah.name}</span>
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{surah.englishNameTranslation}</p>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{surah.numberOfAyahs} Verses</p>
                   </div>
                 </div>
                 <ChevronRight className="text-slate-200 group-hover:text-emerald-400 transition-colors" size={24} />
               </div>
               <div className="h-1 w-full bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
