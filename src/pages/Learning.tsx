import { GraduationCap, Award, PlayCircle, BookOpen, CheckCircle2, XCircle, ArrowRight, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const QUIZ_QUESTIONS = [
  {
    question: "How many Surahs are in the Holy Quran?",
    options: ["110", "114", "120", "100"],
    answer: 1
  },
  {
    question: "Which Surah is known as the 'Heart of the Quran'?",
    options: ["Surah Ya-Sin", "Surah Al-Fatiha", "Surah Al-Baqarah", "Surah Ar-Rahman"],
    answer: 0
  },
  {
    question: "How many Prophets are mentioned by name in the Quran?",
    options: ["20", "25", "30", "40"],
    answer: 1
  },
  {
    question: "In which month was the Quran first revealed?",
    options: ["Rajab", "Shaban", "Ramadan", "Muharram"],
    answer: 2
  }
];

export default function Learning() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleAnswer = (index: number) => {
    setSelectedOption(index);
    if (index === QUIZ_QUESTIONS[currentQuestion].answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    const next = currentQuestion + 1;
    if (next < QUIZ_QUESTIONS.length) {
      setCurrentQuestion(next);
      setSelectedOption(null);
    } else {
      setShowScore(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedOption(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <header>
        <h2 className="text-4xl font-bold text-emerald-950 tracking-tight">Learning Center</h2>
        <p className="text-slate-500 mt-2 text-lg">Interactive lessons for all ages. Master Tajweed, memorization, and Islamic history.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-emerald-950 text-white border-none overflow-hidden relative group">
            <div className="p-8 space-y-4 relative z-10">
              <Badge className="bg-amber-400 text-emerald-950 font-bold">New Course</Badge>
              <h3 className="text-3xl font-bold">Kids Quran Academy</h3>
              <p className="text-emerald-100/70">Gamified lessons designed for children to learn Arabic and basic Alif-Ba-Ta with interactive characters.</p>
              <Button className="bg-white text-emerald-950 hover:bg-emerald-50 rounded-full font-bold px-8">Start Learning</Button>
            </div>
            <GraduationCap className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500" size={240} />
          </Card>

          <section className="grid grid-cols-2 gap-4">
            {[
              { icon: BookOpen, label: 'Tajweed Basics', count: '12 Lessons', color: 'text-blue-600 bg-blue-50' },
              { icon: PlayCircle, label: 'Video Lessons', count: '45+ Videos', color: 'text-rose-600 bg-rose-50' },
              { icon: Award, label: 'Daily Quiz', count: 'Win Points', color: 'text-amber-600 bg-amber-50' },
              { icon: BookOpen, label: 'Memorization', count: 'Track Progress', color: 'text-emerald-600 bg-emerald-50' },
            ].map((item, idx) => (
              <Card key={idx} className="border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                   <div className={`p-4 rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}>
                     <item.icon size={32} />
                   </div>
                   <h4 className="font-bold text-slate-800">{item.label}</h4>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{item.count}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>

        {/* Quiz Module */}
        <Card className="border-slate-200 shadow-xl overflow-hidden rounded-3xl bg-white flex flex-col">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
            <CardTitle className="flex justify-between items-center text-emerald-950">
               <span className="flex items-center gap-2 italic"><Award size={20} className="text-emerald-600" /> Daily Knowledge Quest</span>
               {!showScore && <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">Question {currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {showScore ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 scale-animation">
                     <Award size={48} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 italic">Mubarak!</h3>
                    <p className="text-slate-500 mt-2 text-lg">You scored <span className="font-bold text-emerald-600">{score}</span> out of {QUIZ_QUESTIONS.length}</p>
                  </div>
                  <Button onClick={resetQuiz} className="bg-emerald-600 hover:bg-emerald-500 rounded-full px-8 gap-2">
                     <RefreshCcw size={18} /> Take Again
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-slate-900 leading-snug">{QUIZ_QUESTIONS[currentQuestion].question}</h3>
                  <div className="space-y-3">
                    {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === QUIZ_QUESTIONS[currentQuestion].answer;
                      const showResult = selectedOption !== null;

                      return (
                        <button
                          key={idx}
                          disabled={showResult}
                          onClick={() => handleAnswer(idx)}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group",
                            showResult
                              ? isCorrect 
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800" 
                                : isSelected ? "bg-rose-50 border-rose-500 text-rose-800" : "bg-white border-slate-100 text-slate-400"
                              : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 text-slate-700"
                          )}
                        >
                          <span className="font-medium">{option}</span>
                          {showResult && isCorrect && <CheckCircle2 size={18} className="text-emerald-600" />}
                          {showResult && isSelected && !isCorrect && <XCircle size={18} className="text-rose-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {selectedOption !== null && (
                    <Button onClick={nextQuestion} className="w-full bg-emerald-950 text-white hover:bg-emerald-900 rounded-xl py-6 text-lg gap-2 mt-4 group">
                       {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question'}
                       <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import { cn } from '@/src/lib/utils';
