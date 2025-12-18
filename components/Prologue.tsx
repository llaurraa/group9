
import React, { useState, useEffect } from 'react';

interface PrologueProps {
  onComplete: () => void;
}

const STORY_LINES = [
  "西元 2077 年...",
  "全球經濟崩潰，貨幣淪為廢紙。",
  "所有的財富都集中在貪婪的「中央銀行」手裡。",
  "你，代號「幻影」，是貧民窟最後的希望。",
  "潛入金庫，奪回屬於我們的財富。",
  "只許成功，不許失敗..."
];

const Prologue: React.FC<PrologueProps> = ({ onComplete }) => {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (lineIndex >= STORY_LINES.length) {
      // End of story
      setTimeout(() => {
         setIsFadingOut(true);
         setTimeout(onComplete, 1000);
      }, 1500);
      return;
    }

    const currentLine = STORY_LINES[lineIndex];

    if (charIndex < currentLine.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + currentLine[charIndex]);
        setCharIndex(prev => prev + 1);
      }, 60); // Type speed
      return () => clearTimeout(timeout);
    } else {
      // Line finished, wait then next
      const timeout = setTimeout(() => {
        setLineIndex(prev => prev + 1);
        setDisplayedText("");
        setCharIndex(0);
      }, 1500); // Read time
      return () => clearTimeout(timeout);
    }
  }, [charIndex, lineIndex, onComplete]);

  return (
    <div className={`absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white font-mono leading-relaxed tracking-wider min-h-[120px]">
          {displayedText}
          <span className="animate-pulse inline-block w-4 h-8 bg-green-500 ml-2 align-middle"></span>
        </h1>
      </div>
      
      <button 
        onClick={() => {
           setIsFadingOut(true);
           setTimeout(onComplete, 500);
        }}
        className="absolute bottom-10 text-slate-500 text-sm hover:text-white transition-colors uppercase tracking-widest"
      >
        [ 跳過劇情 SKIP ]
      </button>
    </div>
  );
};

export default Prologue;
