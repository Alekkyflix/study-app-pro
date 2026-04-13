import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mic, FileText, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react';

export function Onboarding() {
  const [slide, setSlide] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const navigate = useNavigate();
  const { setRequireOnboarding, user } = useAuth();

  const slides = [
    {
      icon: <Mic className="w-16 h-16 text-gray-900" />,
      title: "Record your lectures",
      desc: "Capture crystal clear audio natively on your device."
    },
    {
      icon: <FileText className="w-16 h-16 text-gray-900" />,
      title: "Get instant transcripts and summaries",
      desc: "Let AI organize and condense your notes."
    },
    {
      icon: <MessageSquare className="w-16 h-16 text-gray-900" />,
      title: "Chat with your lecture content",
      desc: "Ask questions and retrieve exact context instantly."
    }
  ];

  const handleFinish = () => {
    if (!consentGiven) return;
    localStorage.setItem('studypro_onboarded', 'true');
    setRequireOnboarding(false);
    
    // If user is already authenticated (e.g. OAuth), go home. Otherwise go to signup.
    if (user) {
      navigate('/');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col p-6">
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => {
            setSlide(2);
          }} 
          className="text-sm font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 mb-8 transition-all duration-500 transform scale-110">
          {slides[slide].icon}
        </div>
        <h2 className="text-3xl font-extrabold tracking-tighter text-gray-900 mb-4">{slides[slide].title}</h2>
        <p className="text-gray-500 font-medium mb-12">{slides[slide].desc}</p>

        {slide === 2 && (
          <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl mb-8 text-left">
             <h4 className="font-bold text-orange-900 text-sm mb-2 uppercase tracking-wide">Recording Consent Notice</h4>
             <p className="text-xs text-orange-800 leading-relaxed mb-4">
               By using StudyPro, you agree to only record lectures with the explicit permission of the speaker. Unauthorized recording may violate Kenyan law and university policies.
             </p>
             <label className="flex items-start gap-3 cursor-pointer">
               <input 
                  type="checkbox" 
                  checked={consentGiven} 
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 pointer-events-auto"
               />
               <span className="text-sm font-bold text-gray-900">I Understand & Agree</span>
             </label>
          </div>
        )}

        <div className="flex items-center justify-between w-full mt-auto mb-8">
          <button 
            onClick={() => setSlide(s => Math.max(0, s - 1))}
            className={`p-4 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition ${slide === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>

          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${slide === i ? 'w-8 bg-gray-900' : 'w-2 bg-gray-200'}`} />
            ))}
          </div>

          {slide < 2 ? (
            <button 
              onClick={() => setSlide(s => s + 1)}
              className="p-4 rounded-full bg-gray-900 text-white hover:bg-black transition shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              disabled={!consentGiven}
              className="px-6 py-4 rounded-full bg-gray-900 text-white font-bold tracking-tight hover:bg-black transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
