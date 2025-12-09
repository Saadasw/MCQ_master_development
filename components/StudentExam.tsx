import React, { useState, useEffect } from 'react';
import { Subject, QuestionSegment } from '../types';
import { questionService } from '../services/questionService';
import { ChevronRight, CheckCircle, XCircle, Trophy, LayoutList, MonitorPlay, Loader2, Clock } from 'lucide-react';

interface StudentExamProps {
  subjects: Subject[];
  onFinish: () => void;
}

// Local session type (no Firebase)
interface LocalExamSession {
  answers: Record<string | number, { questionId: string | number; selectedOption: string }>;
  startTime: number;
  endTime: number;
  totalQuestions: number;
}

export const StudentExam: React.FC<StudentExamProps> = ({ subjects, onFinish }) => {
  const [step, setStep] = useState<'SELECT' | 'EXAM' | 'RESULT'>('SELECT');

  // Selection State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // Exam State
  const [questions, setQuestions] = useState<QuestionSegment[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'PAGINATED' | 'SCROLLING'>('PAGINATED');

  // Timer State
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Local Session (no Firebase)
  const [session, setSession] = useState<LocalExamSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Timer Logic
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = session.endTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("00:00");
        handleFinish();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const startExam = async () => {
    if (!selectedSubjectId) return;

    setLoadingQuestions(true);
    try {
      // Fetch questions from Firebase (public read)
      const qs = await questionService.getQuestions(selectedSubjectId, selectedChapterId || 'all');

      if (qs.length === 0) {
        alert("No questions found for this selection in the database.");
        setLoadingQuestions(false);
        return;
      }

      // Shuffle locally
      const shuffled = qs.sort(() => Math.random() - 0.5);
      const examQuestions = shuffled.slice(0, 20);

      setQuestions(examQuestions);

      // Create local session (30 min duration)
      const now = Date.now();
      const durationMinutes = 30;
      setSession({
        answers: {},
        startTime: now,
        endTime: now + (durationMinutes * 60 * 1000),
        totalQuestions: examQuestions.length
      });

      setStep('EXAM');
    } catch (err) {
      console.error(err);
      alert("Failed to load exam. Please try again.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const saveAnswer = (questionId: string | number, selectedOption: string) => {
    if (!session) return;

    setSession(prev => prev ? {
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: { questionId, selectedOption }
      }
    } : null);
  };

  const handleFinish = () => {
    setStep('RESULT');
  };

  // --- RENDERERS ---

  if (loading || loadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">
          {loadingQuestions ? "Loading Questions..." : "Preparing Exam..."}
        </p>
      </div>
    );
  }

  if (step === 'SELECT') {
    const activeSubject = subjects.find(s => s.id === selectedSubjectId || s.name.toLowerCase() === selectedSubjectId.toLowerCase());

    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">Student Portal</h2>
          <p className="text-slate-500 mt-2">Select your topic to begin the assessment.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedChapterId(""); }}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Choose a subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className={`transition-opacity duration-300 ${!selectedSubjectId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Chapter (Optional)</label>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Chapters (Shuffle)</option>
              {activeSubject?.chapters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={startExam}
            disabled={!selectedSubjectId}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200 mt-4 flex items-center justify-center gap-2"
          >
            Start Exam <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'EXAM' && session) {
    const answeredCount = Object.keys(session.answers || {}).length;
    const progress = Math.round((answeredCount / questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6 space-y-4 sticky top-16 z-40 bg-slate-50/95 backdrop-blur py-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Exam in Progress</span>
              <span className="text-xs text-slate-500">{answeredCount} of {questions.length} Answered</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg font-mono text-sm font-bold shadow-md">
                <Clock size={16} className="text-yellow-400" />
                {timeLeft}
              </div>

              <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300">
                <button
                  onClick={() => setViewMode('PAGINATED')}
                  className={`p-2 rounded-md ${viewMode === 'PAGINATED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <MonitorPlay size={16} />
                </button>
                <button
                  onClick={() => setViewMode('SCROLLING')}
                  className={`p-2 rounded-md ${viewMode === 'SCROLLING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <LayoutList size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* PAGINATED VIEW */}
        {viewMode === 'PAGINATED' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
              <div className="bg-slate-50 border-b border-slate-100 p-8 flex justify-center flex-1 items-center">
                {questions[currentQIndex]?.cropUrl ? (
                  <img src={questions[currentQIndex].cropUrl} alt="Question" className="max-w-full max-h-[400px] object-contain" />
                ) : (
                  <div className="text-slate-400 italic">No image available</div>
                )}
              </div>

              <div className="p-8 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">Select Answer</p>
                  <span className="text-xs font-bold text-slate-300">Q{currentQIndex + 1}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => saveAnswer(questions[currentQIndex].id, opt)}
                      className={`py-4 rounded-xl font-bold text-lg border-2 transition-all ${session.answers[questions[currentQIndex].id]?.selectedOption === opt
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                        : 'border-slate-200 hover:border-indigo-300 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>

              {currentQIndex === questions.length - 1 ? (
                <button
                  onClick={handleFinish}
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-transform hover:scale-105"
                >
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        )}

        {/* SCROLLING VIEW */}
        {viewMode === 'SCROLLING' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-300">
            {questions.map((q, idx) => (
              <div key={q.id} id={`question-${idx}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-32">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Question {idx + 1}</span>
                  {session.answers[q.id] && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Answered</span>}
                </div>

                <div className="p-6 flex flex-col items-center border-b border-slate-50">
                  {q.cropUrl ? (
                    <img src={q.cropUrl} alt={`Q${idx + 1}`} className="max-w-full max-h-[300px] object-contain" />
                  ) : (
                    <div className="text-slate-300 text-sm">Image not available</div>
                  )}
                </div>

                <div className="p-6 bg-white">
                  <div className="grid grid-cols-4 gap-4">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => saveAnswer(q.id, opt)}
                        className={`py-2 rounded-lg font-bold text-sm border-2 transition-all ${session.answers[q.id]?.selectedOption === opt
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 hover:border-indigo-300 text-slate-600'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-8 pb-12 flex justify-center">
              <button
                onClick={handleFinish}
                className="w-full max-w-md px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 shadow-xl shadow-green-200 transition-transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} /> Submit All Answers
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Result View
  if (step === 'RESULT' && session) {
    // Calculate score locally
    let score = 0;
    const answerList = Object.values(session.answers || {});
    answerList.forEach(ans => {
      const q = questions.find(qu => qu.id === ans.questionId);
      if (q && ans.selectedOption.toLowerCase() === q.correctAnswer?.toLowerCase()) {
        score++;
      }
    });
    const percentage = Math.round((score / session.totalQuestions) * 100);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in zoom-in-95">
        <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Exam Completed!</h2>
        <p className="text-slate-500 mb-8">Your answers have been recorded.</p>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-8">
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wide mb-2">Your Score</div>
          <div className="text-5xl font-extrabold text-indigo-600 mb-2">{percentage}%</div>
          <p className="text-slate-400">{score} out of {session.totalQuestions} Correct</p>
        </div>

        <button
          onClick={onFinish}
          className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 w-full"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return null;
};