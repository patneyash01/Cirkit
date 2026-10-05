import React, { useState } from 'react';
import { LESSONS, Lesson } from '../data/lessons';
import { BookOpen, CheckCircle2, XCircle, Sliders, HelpCircle } from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const LearnPage: React.FC = () => {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);
  const [demoInputs, setDemoInputs] = useState<Record<string, number>>(
    LESSONS[0].interactiveDemo.defaultValues
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const activeLesson: Lesson = LESSONS.find(l => l.id === selectedLessonId) || LESSONS[0];

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setDemoInputs(lesson.interactiveDemo.defaultValues);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleInputChange = (key: string, value: number) => {
    setDemoInputs(prev => ({ ...prev, [key]: value }));
  };

  const demoResults = activeLesson.interactiveDemo.calculate(demoInputs);

  return (
    <div className="flex-1 bg-[#F5F7FA] p-4 sm:p-8 max-w-7xl mx-auto w-full select-none text-[#172033]">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Lesson Navigation Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <div className="border-b border-[#E2E8F0] pb-3 flex items-center space-x-3">
            <Logo size={36} />
            <div>
              <h2 className="text-base font-bold text-[#172033] flex items-center space-x-1.5">
                <span>CirKit Learning Lab</span>
              </h2>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                Core electrical physics & calculators.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {LESSONS.map(lesson => {
              const isSelected = lesson.id === activeLesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex flex-col space-y-1 border ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-[#172033] shadow-xs'
                      : 'bg-white border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate text-[#172033]">{lesson.title}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#64748B]">
                      {lesson.duration}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] line-clamp-1">
                    {lesson.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Lesson Content Area */}
        <div className="flex-1 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs">
          {/* Lesson Header */}
          <div className="space-y-3 border-b border-[#E2E8F0] pb-5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase border border-blue-200">
                {activeLesson.category}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#64748B]">
                {activeLesson.difficulty}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#172033] font-sans">
              {activeLesson.title}
            </h1>

            <p className="text-sm text-[#475569] leading-relaxed">
              {activeLesson.summary}
            </p>

            {/* Formula Callout Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center font-mono">
              <span className="text-[10px] text-blue-700 uppercase tracking-widest block font-bold mb-1">
                Governing Equation
              </span>
              <span className="text-base sm:text-lg font-bold text-blue-900">
                {activeLesson.formula}
              </span>
            </div>
          </div>

          {/* Theoretical Foundations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider font-mono">
              Core Theoretical Concepts
            </h3>
            <div className="space-y-2.5">
              {activeLesson.theory.map((para, i) => (
                <div key={i} className="flex items-start space-x-3 text-xs text-[#475569] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                  <p>{para}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Calculator / Mini Simulation */}
          <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider font-mono">
                  Interactive Mini-Simulator
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[#64748B]">Physics Verification Engine</span>
            </div>

            <p className="text-xs text-[#64748B]">
              {activeLesson.interactiveDemo.description}
            </p>

            {/* Slider Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeLesson.interactiveDemo.inputLabels.map(inp => (
                <div key={inp.key} className="space-y-1.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B] font-medium">{inp.label}</span>
                    <span className="font-mono text-blue-600 font-bold">
                      {demoInputs[inp.key] ?? inp.min} {inp.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={inp.min}
                    max={inp.max}
                    step={inp.step}
                    value={demoInputs[inp.key] ?? inp.min}
                    onChange={e => handleInputChange(inp.key, parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Live Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {Object.entries(demoResults).map(([key, val]) => (
                <div key={key} className="p-3 bg-white border border-[#E2E8F0] rounded-xl font-mono text-center shadow-2xs">
                  <span className="text-[10px] text-[#64748B] block uppercase font-bold">{key}</span>
                  <span className="text-sm font-bold text-emerald-600">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Quiz */}
          <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider font-mono">
                Knowledge Check Quiz
              </h4>
            </div>

            <p className="text-xs font-bold text-[#172033]">
              {activeLesson.quiz.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeLesson.quiz.options.map((opt, idx) => {
                const isCorrect = idx === activeLesson.quiz.correctIndex;
                const isChosen = selectedAnswer === idx;

                let btnStyle = 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50';
                if (selectedAnswer !== null) {
                  if (isCorrect) {
                    btnStyle = 'bg-green-50 border-green-500 text-green-800 font-bold';
                  } else if (isChosen) {
                    btnStyle = 'bg-red-50 border-red-500 text-red-800';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedAnswer(idx);
                      setShowExplanation(true);
                    }}
                    className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer font-mono flex items-center justify-between shadow-2xs ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedAnswer !== null && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                    )}
                    {selectedAnswer !== null && isChosen && !isCorrect && (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 leading-relaxed animate-in fade-in">
                <strong>Explanation: </strong> {activeLesson.quiz.explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
