import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Bookmark, ChevronRight, Play, Heart, MessageCircle, Book, Clock, GraduationCap, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import { auth, db } from '@/src/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface Ayah {
  text: string;
  translation: string;
  surah: string;
  number: number;
  juz: number;
}

export default function Home() {
  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchDailyAyah();
  }, []);

  const fetchDailyAyah = async () => {
    setLoading(true);
    try {
      // Fetching Arabic text and Translation
      const [arRes, enRes] = await Promise.all([
        fetch('https://api.alquran.cloud/v1/ayah/' + Math.floor(Math.random() * 6236)),
        fetch('https://api.alquran.cloud/v1/ayah/' + Math.floor(Math.random() * 6236) + '/en.asad')
      ]);
      
      // For consistency in daily ayah, we should use a deterministic random based on date
      const dateSeed = new Date().toISOString().split('T')[0];
      const ayahNumber = (parseInt(dateSeed.replace(/-/g, '')) % 6236) || 1;
      
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/editions/quran-simple,en.asad`);
      const data = await res.json();
      
      if (data.data) {
        setAyah({
          text: data.data[0].text,
          translation: data.data[1].text,
          surah: data.data[0].surah.englishName,
          number: data.data[0].numberInSurah,
          juz: data.data[0].juz
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load Ayah of the day');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!ayah) return;
    const text = `${ayah.text}\n\n${ayah.translation}\n\n[Surah ${ayah.surah} - ${ayah.number}]`;
    navigator.clipboard.writeText(text);
    toast.success('Ayah copied to clipboard!');
  };

  const generateShareImage = () => {
    if (!ayah || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas styling
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#064e3b'); // emerald-950
    gradient.addColorStop(1, '#065f46'); // emerald-800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Islamic Pattern (Simplified)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
       ctx.beginPath();
       ctx.arc(width/2, height/2, 100 * i, 0, Math.PI * 2);
       ctx.stroke();
    }

    // Text rendering
    ctx.fillStyle = '#fbbf24'; // amber-400
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('AYAH OF THE DAY', width / 2, 150);

    ctx.fillStyle = '#ffffff';
    ctx.font = '50px "Traditional Arabic", "Amiri", serif';
    const lines = wrapText(ctx, ayah.text, width / 2, 350, width - 200, 70);
    
    ctx.fillStyle = '#d1fae5'; // emerald-100
    ctx.font = 'italic 36px Georgia, serif';
    wrapText(ctx, ayah.translation, width / 2, 450 + (lines * 70), width - 200, 50);

    ctx.fillStyle = '#34d399'; // emerald-400
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Surah ${ayah.surah}: ${ayah.number}`, width / 2, height - 100);
    ctx.fillText('HaqQuran App', width / 2, height - 50);

    // Download/Share
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `HaqQuran_Ayah_${ayah.surah}_${ayah.number}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Shareable image generated!');
  };

  // Helper function to wrap text on canvas
  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lineCount++;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
    return lineCount + 1;
  }

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-5xl mx-auto pb-32">
      <Helmet>
        <title>HaqQuran - Your Digital Hub for Islamic Wisdom</title>
        <meta name="description" content="Welcome to HaqQuran. Explore the Holy Quran, authentic Hadith, accurate prayer times, and join a flourishing Muslim community." />
      </Helmet>

      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-emerald-950 tracking-tighter italic">Assalam Alaikum</h2>
          <p className="text-slate-500 font-medium text-lg italic uppercase tracking-widest text-xs">A Path of Light and Knowledge</p>
        </div>
        <div className="flex gap-2">
           <Link to="/profile">
             <Button variant="outline" className="rounded-2xl shadow-sm border-slate-200 h-12 px-6 font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-all">
               <Bookmark size={18} className="mr-2" /> My Journey
             </Button>
           </Link>
        </div>
      </section>

      {/* Daily Ayah Hero */}
      <section>
        <Card className="overflow-hidden border-none shadow-2xl bg-emerald-950 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Book size={200} />
          </div>
          
          <CardContent className="p-8 md:p-12 space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-1 bg-amber-400 rounded-full"></span>
              <span className="text-amber-400 font-bold uppercase tracking-widest text-xs">Ayah of the Day</span>
            </div>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-emerald-900 rounded w-full"></div>
                <div className="h-6 bg-emerald-900 rounded w-2/3"></div>
              </div>
            ) : ayah && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <p className="text-3xl md:text-5xl font-serif text-right leading-relaxed" dir="rtl">
                  {ayah.text}
                </p>
                <div className="space-y-2">
                  <p className="text-xl md:text-2xl font-medium text-emerald-100 italic font-serif">
                    "{ayah.translation}"
                  </p>
                  <p className="text-emerald-400 font-semibold group flex items-center gap-2 cursor-pointer">
                    Surah {ayah.surah}: {ayah.number} <ChevronRight size={16} />
                  </p>
                </div>

          <div className="pt-4 flex flex-wrap gap-3">
                  <Button onClick={copyToClipboard} variant="secondary" className="bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-700">
                    <Copy size={18} className="mr-2" /> Copy
                  </Button>
                  <Button onClick={generateShareImage} className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold">
                    <Share2 size={18} className="mr-2" /> Share Image
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
        <canvas ref={canvasRef} className="hidden" />
      </section>

          {/* Quick Tools Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: 'Prayer Times', color: 'bg-blue-100 text-blue-700', path: '/prayer' },
          { icon: Book, label: 'Al-Quran', color: 'bg-emerald-100 text-emerald-700', path: '/quran' },
          { icon: Heart, label: 'Daily Duas', color: 'bg-rose-100 text-rose-700', path: '/prayer' },
          { icon: GraduationCap, label: 'Learning', color: 'bg-amber-100 text-amber-700', path: '/learning' },
        ].map((tool, idx) => (
          <Link key={idx} to={tool.path}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group border-slate-200">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", tool.color)}>
                  <tool.icon size={28} />
                </div>
                <span className="font-bold text-slate-800">{tool.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Community Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-bold text-slate-900">Community Highlights</h3>
           <Link to="/community" className="text-emerald-600 text-sm font-semibold hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[1, 2].map(i => (
             <Card key={i} className="border-slate-200 shadow-sm overflow-hidden">
               <CardContent className="p-0">
                  <div className="aspect-video bg-slate-200 animate-pulse"></div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-300"></div>
                      <div className="h-4 bg-slate-300 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm pt-2">
                       <span className="flex items-center gap-1"><Heart size={14} /> 12</span>
                       <span className="flex items-center gap-1"><MessageCircle size={14} /> 3</span>
                    </div>
                  </div>
               </CardContent>
             </Card>
           ))}
        </div>
      </section>
    </div>
  );
}
