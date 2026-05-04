import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Clock, 
  MapPin, 
  Compass, 
  Bell, 
  BellOff, 
  ChevronRight, 
  Sun, 
  Moon, 
  CloudSun, 
  Sunset,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button as UIButton } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { toast } from 'sonner';
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from 'adhan';
import { format } from 'date-fns';

export default function Prayer() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [address, setAddress] = useState<string>('Detecting location...');
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords(new Coordinates(latitude, longitude));
          fetchAddress(latitude, longitude);
        },
        (error) => {
          console.error(error);
          setAddress('Location permission denied. Using default (Mecca).');
          setCoords(new Coordinates(21.4225, 39.8262)); // Default to Mecca
        }
      );
    }
  }, []);

  useEffect(() => {
    if (coords) {
      const date = new Date();
      const params = CalculationMethod.MuslimWorldLeague();
      const prayerTimes = new PrayerTimes(coords, date, params);
      setTimes(prayerTimes);

      const next = prayerTimes.nextPrayer();
      if (next !== 'none') {
        const nextTime = prayerTimes.timeForPrayer(next);
        if (nextTime) {
          setNextPrayer({ name: next.charAt(0).toUpperCase() + next.slice(1), time: nextTime });
        }
      }
    }
  }, [coords]);

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setAddress(data.display_name.split(',').slice(0, 3).join(','));
    } catch (e) {
      setAddress('Current Location');
    }
  };

  const getPrayerIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'fajr': return <Moon size={20} />;
      case 'dhuhr': return <Sun size={20} />;
      case 'asr': return <CloudSun size={20} />;
      case 'maghrib': return <Sunset size={20} />;
      case 'isha': return <Moon size={20} />;
      default: return <Clock size={20} />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-32">
      <Helmet>
        <title>Accurate Prayer Times & Qibla Finder | HaqQuran</title>
        <meta name="description" content="Get precise prayer times (Salah) for your current location, find the Qibla direction, and track the Hijri calendar with HaqQuran." />
      </Helmet>
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold text-emerald-950 tracking-tight">Prayer Times</h2>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <MapPin size={16} className="text-emerald-600" />
            <span>{address}</span>
          </div>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 hidden md:block">
           <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Current Date</p>
           <p className="text-lg font-bold text-emerald-950">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
      </header>

      {/* Next Prayer Hero */}
      <section>
        <Card className="bg-emerald-950 text-white border-none shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Clock size={240} />
          </div>
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 text-center md:text-left">
              <Badge className="bg-emerald-500 text-emerald-950 font-bold uppercase tracking-widest px-3 py-1">Next Prayer</Badge>
              {nextPrayer ? (
                <>
                  <h3 className="text-6xl md:text-8xl font-black tracking-tighter">{nextPrayer.name}</h3>
                  <p className="text-2xl text-emerald-400 font-medium tracking-tight">at {format(nextPrayer.time, 'hh:mm a')}</p>
                </>
              ) : (
                <p className="text-2xl">Calculating...</p>
              )}
            </div>
            
            <Card className="bg-emerald-900/50 border-emerald-800 text-white backdrop-blur-sm w-full md:w-auto">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                 <Compass size={48} className="text-amber-400 animate-pulse" />
                 <p className="text-xs uppercase font-bold tracking-widest text-emerald-500">Qibla Direction</p>
                 <p className="text-xl font-bold">292° Northwest</p>
                 <UIButton variant="link" className="text-amber-400 p-0 h-auto text-xs">Open Compass</UIButton>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </section>

      {/* Prayer Times List */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 px-2">Today's Schedule</h3>
          <div className="space-y-2">
            {[
              { name: 'Fajr', key: 'fajr' },
              { name: 'Sunrise', key: 'sunrise' },
              { name: 'Dhuhr', key: 'dhuhr' },
              { name: 'Asr', key: 'asr' },
              { name: 'Maghrib', key: 'maghrib' },
              { name: 'Isha', key: 'isha' },
            ].map((p) => {
              const time = times ? (times as any)[p.key] : null;
              const isActive = nextPrayer?.name.toLowerCase() === p.name.toLowerCase();
              
              return (
                <div 
                  key={p.name} 
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    isActive ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]' : 'bg-white hover:bg-slate-50 border border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-500' : 'bg-slate-100 text-slate-500'}`}>
                      {getPrayerIcon(p.name)}
                    </div>
                    <div>
                      <p className="font-bold">{p.name}</p>
                      {isActive && <p className="text-[10px] uppercase tracking-widest font-black text-emerald-200">Upcoming Now</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-mono font-bold">
                      {time ? format(time, 'hh:mm a') : '--:--'}
                    </p>
                    <UIButton variant="ghost" size="icon" className={isActive ? 'text-white hover:bg-emerald-700' : 'text-slate-300'}>
                      <Bell size={20} />
                    </UIButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
           <Card className="border-none bg-indigo-50 text-indigo-900">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <Moon size={20} className="text-indigo-600" /> Islamic Calendar
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="text-center py-6 space-y-1">
                   <p className="text-3xl font-black tracking-tight">14 Shawwal 1447</p>
                   <p className="text-sm font-medium text-indigo-600">Hijri Date</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-indigo-700">
                   <div className="bg-white/50 p-3 rounded-xl">Next Holiday: Eid al-Adha</div>
                   <div className="bg-white/50 p-3 rounded-xl">Season: Spring</div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-emerald-100 shadow-sm">
             <CardHeader>
                <CardTitle className="text-lg">Prayer Notifications</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">Enable Azan notifications on your device to never miss a prayer. You can customize the sound and reminders.</p>
                <div className="flex gap-2">
                   <UIButton className="flex-1 bg-emerald-600">Enable Azan</UIButton>
                   <UIButton variant="outline" className="flex-1">Settings</UIButton>
                </div>
             </CardContent>
           </Card>
        </div>
      </section>
    </div>
  );
}
