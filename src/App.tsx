import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Download, 
  RefreshCw, 
  Trash2, 
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Monitor,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MathProblem, Exam, ExamVersion, ProblemVariant } from './types';
import { parseProblems, generateVariants } from './services/gemini';
import { generateExamPDF } from './utils/pdf';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';

type Theme = 'light' | 'dark' | 'system';

export default function App() {
  const [title, setTitle] = useState('Chapter 3: Linear Equations');
  const [rawInput, setRawInput] = useState('');
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [versionCount, setVersionCount] = useState(2);
  const [exam, setExam] = useState<Exam | null>(null);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [theme, setTheme] = useState<Theme>('system');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      if (file.name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setRawInput(prev => prev + (prev ? '\n\n' : '') + result.value);
      } else if (file.name.endsWith('.pdf')) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setRawInput(prev => prev + (prev ? '\n\n' : '') + text);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Failed to parse file. Please try pasting the text instead.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleParse = async () => {
    if (!rawInput.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseProblems(rawInput);
      setProblems(parsed);
    } catch (error) {
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (problems.length === 0) return;
    setIsGenerating(true);
    try {
      const labels = Array.from({ length: versionCount }, (_, i) => String.fromCharCode(65 + i));
      const variantsByVersion = await generateVariants(problems, labels);
      
      const versions: ExamVersion[] = labels.map(label => ({
        label,
        variants: variantsByVersion[label] || []
      }));

      setExam({
        title,
        originalProblems: problems,
        versions
      });
      setActiveVersionIdx(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeProblem = (id: string) => {
    setProblems(prev => prev.filter(p => p.id !== id));
  };

  const downloadPDF = () => {
    if (exam) {
      generateExamPDF(exam);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] text-[#1A1A1A] dark:text-[#E0E0E0] font-sans selection:bg-[#5A5A40] selection:text-white transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 dark:border-white/10 bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white font-bold italic">K</div>
            <h1 className="text-xl font-semibold tracking-tight">KindMath</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded-full p-1 border border-[#1A1A1A]/5 dark:border-white/5">
              {(['light', 'system', 'dark'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    theme === t 
                      ? "bg-white dark:bg-[#4A4A4A] text-[#1A1A1A] dark:text-white shadow-sm" 
                      : "text-[#1A1A1A]/50 dark:text-white/50 hover:text-[#1A1A1A] dark:hover:text-white"
                  )}
                  title={`Theme: ${t}`}
                >
                  {t === 'light' && <Sun size={14} />}
                  {t === 'system' && <Monitor size={14} />}
                  {t === 'dark' && <Moon size={14} />}
                </button>
              ))}
            </div>
            {exam && (
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4A4A30] transition-colors shadow-sm"
              >
                <Download size={16} />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Structure */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 shadow-sm border border-[#1A1A1A]/5 dark:border-white/5 transition-colors duration-200">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#5A5A40] dark:text-[#8A8A60] mb-4 flex items-center gap-2">
                <FileText size={14} />
                Assessment Setup
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#1A1A1A]/50 dark:text-white/50 uppercase mb-1 block">Exam Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#F5F5F0] dark:bg-[#2A2A2A] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all dark:text-white"
                    placeholder="e.g. Midterm Algebra"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#1A1A1A]/50 dark:text-white/50 uppercase block">Paste Questions</label>
                    <input 
                      type="file" 
                      accept=".pdf,.docx" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] dark:text-[#8A8A60] hover:opacity-80 flex items-center gap-1 transition-opacity"
                    >
                      {isUploading ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                      Upload PDF/DOCX
                    </button>
                  </div>
                  <textarea 
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    className="w-full bg-[#F5F5F0] dark:bg-[#2A2A2A] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all min-h-[200px] text-sm dark:text-white"
                    placeholder="Paste your existing questions here or upload a file..."
                  />
                </div>
                <button 
                  onClick={handleParse}
                  disabled={isParsing || !rawInput.trim()}
                  className="w-full py-3 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] rounded-xl font-medium hover:bg-black dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isParsing ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Extract Problems
                </button>
              </div>
            </section>

            {problems.length > 0 && (
              <section className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 shadow-sm border border-[#1A1A1A]/5 dark:border-white/5 transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[#5A5A40] dark:text-[#8A8A60] flex items-center gap-2">
                    <Layers size={14} />
                    Extracted Structure ({problems.length})
                  </h2>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {problems.map((p, idx) => (
                    <div key={p.id} className="p-4 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded-2xl group relative border border-transparent hover:border-[#5A5A40]/20 dark:hover:border-[#8A8A60]/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold bg-white dark:bg-[#3A3A3A] px-2 py-0.5 rounded-full text-[#5A5A40] dark:text-[#A5A580] uppercase">
                          {p.type.replace('-', ' ')}
                        </span>
                        <button 
                          onClick={() => removeProblem(p.id)}
                          className="text-[#1A1A1A]/30 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed dark:text-[#E0E0E0]">{p.originalText}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-[#1A1A1A]/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#1A1A1A]/50 dark:text-white/50 uppercase">Versions to Generate</label>
                    <div className="flex items-center gap-3">
                      {[2, 3, 4].map(n => (
                        <button 
                          key={n}
                          onClick={() => setVersionCount(n)}
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-bold transition-all",
                            versionCount === n 
                              ? "bg-[#5A5A40] text-white" 
                              : "bg-[#F5F5F0] dark:bg-[#2A2A2A] text-[#1A1A1A]/50 dark:text-white/50 hover:bg-[#E5E5E0] dark:hover:bg-[#3A3A3A]"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || problems.length === 0}
                    className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#4A4A30] transition-all shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    Generate All Variants
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Preview & Results */}
          <div className="lg:col-span-7">
            {!exam ? (
              <div className="h-full min-h-[600px] bg-white dark:bg-[#1E1E1E] rounded-[40px] border-2 border-dashed border-[#1A1A1A]/10 dark:border-white/10 flex flex-col items-center justify-center p-12 text-center transition-colors duration-200">
                <div className="w-20 h-20 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded-full flex items-center justify-center mb-6">
                  <BookOpen size={32} className="text-[#1A1A1A]/20 dark:text-white/20" />
                </div>
                <h3 className="text-2xl font-serif italic mb-2 dark:text-white">Your variants will appear here</h3>
                <p className="text-[#1A1A1A]/50 dark:text-white/50 max-w-xs text-sm">
                  Upload or paste your math problems on the left to begin the intelligent variation process.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Version Selector */}
                <div className="flex items-center justify-between bg-white dark:bg-[#1E1E1E] p-2 rounded-full shadow-sm border border-[#1A1A1A]/5 dark:border-white/5 transition-colors duration-200">
                  <div className="flex gap-1">
                    {exam.versions.map((v, idx) => (
                      <button
                        key={v.label}
                        onClick={() => setActiveVersionIdx(idx)}
                        className={cn(
                          "px-6 py-2 rounded-full text-sm font-bold transition-all",
                          activeVersionIdx === idx 
                            ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A]" 
                            : "text-[#1A1A1A]/50 dark:text-white/50 hover:bg-[#F5F5F0] dark:hover:bg-[#2A2A2A]"
                        )}
                      >
                        Form {v.label}
                      </button>
                    ))}
                  </div>
                  <div className="pr-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] dark:text-[#8A8A60]">
                    <CheckCircle2 size={12} />
                    Ready for Print
                  </div>
                </div>

                {/* Preview Area */}
                <div className="bg-white dark:bg-[#1E1E1E] rounded-[40px] shadow-xl border border-[#1A1A1A]/5 dark:border-white/5 overflow-hidden transition-colors duration-200">
                  <div className="p-8 border-b border-[#1A1A1A]/5 dark:border-white/5 flex justify-between items-center bg-[#F5F5F0]/30 dark:bg-[#2A2A2A]/30">
                    <div>
                      <h3 className="text-xl font-serif italic dark:text-white">{title}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 dark:text-white/40 mt-1">
                        Previewing Version {exam.versions[activeVersionIdx].label}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-serif italic text-[#5A5A40] dark:text-[#8A8A60] opacity-20">
                        {exam.versions[activeVersionIdx].label}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 space-y-10">
                    {exam.versions[activeVersionIdx].variants.map((variant, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className="space-y-4"
                      >
                        <div className="flex gap-4">
                          <span className="text-lg font-serif italic text-[#5A5A40] dark:text-[#8A8A60]">{idx + 1}.</span>
                          <div className="space-y-4 flex-1">
                            <div className="text-lg leading-relaxed text-[#1A1A1A]/90 dark:text-white/90 prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{variant.text}</ReactMarkdown>
                            </div>
                            
                            {variant.options && variant.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {variant.options.map((opt, oIdx) => (
                                  <div 
                                    key={oIdx}
                                    className={cn(
                                      "p-4 rounded-2xl border text-sm transition-all flex items-center gap-3",
                                      opt === variant.correctAnswer 
                                        ? "bg-[#5A5A40]/5 dark:bg-[#8A8A60]/10 border-[#5A5A40] dark:border-[#8A8A60] text-[#5A5A40] dark:text-[#A5A580] font-medium" 
                                        : "bg-white dark:bg-[#1E1E1E] border-[#1A1A1A]/10 dark:border-white/10 text-[#1A1A1A]/60 dark:text-white/60"
                                    )}
                                  >
                                    <span className="w-6 h-6 rounded-full bg-current opacity-10 flex items-center justify-center text-[10px] font-bold">
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <ReactMarkdown>{opt}</ReactMarkdown>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-4 p-4 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded-2xl border-l-4 border-[#5A5A40] dark:border-[#8A8A60]">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] dark:text-[#8A8A60] mb-1">Step-by-Step Solution</p>
                              <div className="text-sm text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed italic prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{variant.explanation}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Comparison Table Preview */}
                <section className="bg-[#1A1A1A] dark:bg-[#2A2A2A] text-white rounded-[40px] p-8 transition-colors duration-200">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#5A5A40] dark:text-[#8A8A60]" />
                    Master Answer Comparison
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="pb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">#</th>
                          {exam.versions.map(v => (
                            <th key={v.label} className="pb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Form {v.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exam.originalProblems.map((_, pIdx) => (
                          <tr key={pIdx} className="border-b border-white/5 last:border-0">
                            <td className="py-4 text-xs font-bold opacity-40">{pIdx + 1}</td>
                            {exam.versions.map(v => (
                              <td key={v.label} className="py-4 text-sm font-medium">
                                {v.variants[pIdx].correctAnswer}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1A1A10;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFFFFF10;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1A1A1A20;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FFFFFF20;
        }
      `}</style>
    </div>
  );
}
