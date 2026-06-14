import React, { useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { parseAICommand } from '../utils/aiCommandParser';
import { listenForVoiceInput } from '../utils/voiceInput';
import { motion, AnimatePresence } from 'framer-motion';
import { IonIcon, IonButton, IonInput } from '@ionic/react';
import { micOutline, sendOutline, sparklesOutline, closeOutline, volumeHighOutline } from 'ionicons/icons';

const AIAssistant: React.FC = () => {
  const { isAssistantOpen, setAssistantOpen, aiStatus, setAIStatus, showNotification } = useNotificationStore();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{ action: string; details: string; rawData: any } | null>(null);

  const handleTextSubmit = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setAIStatus('thinking');
    setParsedPreview(null);

    try {
      // Small simulated delay for AI thinking look
      setTimeout(async () => {
        const result = await parseAICommand(textToSend);
        if (result.success) {
          setAIStatus('success');
          // If successful, reset and auto close drawer after 1.5 seconds
          setInputText('');
          setTimeout(() => {
            setAssistantOpen(false);
            setAIStatus('idle');
          }, 1500);
        } else {
          setAIStatus('error');
          showNotification('validation', 'AI Validation Check', result.message);
        }
      }, 1000);
    } catch (e) {
      setAIStatus('error');
      showNotification('failure', 'AI Error', 'Failed to parse command.');
    }
  };

  const startVoiceInput = () => {
    setIsListening(true);
    setAIStatus('listening');
    listenForVoiceInput(
      (text) => {
        setInputText(text);
        setIsListening(false);
        setAIStatus('idle');
        handleTextSubmit(text);
      },
      (listening) => {
        if (!listening) {
          setIsListening(false);
          setAIStatus('idle');
        }
      }
    );
  };

  const suggestions = [
    "Spent 450 rupees on dinner using UPI",
    "Book train ticket fare 650 PNR 4321098765 coach S2 seat 45",
    "EB reading previous 1100 current 1280",
    "Plan task finish filing tax next Monday",
    "Create RD deposit of 5000 in SBI for 180 days, ROI 6.8%",
  ];

  return (
    <>
      {/* AI Assistant Sheet Drawer */}
      <AnimatePresence>
        {isAssistantOpen && (
          <div className="fixed inset-0 z-[1000] pointer-events-none flex items-end justify-center px-4 pb-4">
            {/* Backdrop click dismiss */}
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => {
                if (aiStatus !== 'thinking' && !isListening) setAssistantOpen(false);
              }}
            />

            {/* Main Assistant Panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white/95 border border-slate-200/80 rounded-t-[32px] rounded-b-[24px] shadow-2xl overflow-hidden pointer-events-auto z-10 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <IonIcon icon={sparklesOutline} className="text-sm" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">Home AI Copilot</h3>
                    <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase">Automation Assistant</span>
                  </div>
                </div>
                <IonButton fill="clear" color="dark" className="-mr-2" onClick={() => setAssistantOpen(false)}>
                  <IonIcon icon={closeOutline} slot="icon-only" />
                </IonButton>
              </div>

              {/* Body Content */}
              <div className="p-5 space-y-4 max-h-[360px] overflow-y-auto">
                {/* AI status messages */}
                {aiStatus === 'thinking' && (
                  <div className="flex items-center gap-3 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100/60">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Processing command...</p>
                      <p className="text-xs text-slate-500">Auto-populating page values</p>
                    </div>
                  </div>
                )}

                {aiStatus === 'listening' && (
                  <div className="flex items-center gap-4 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="absolute w-8 h-8 bg-rose-400 rounded-full"
                      />
                      <IonIcon icon={volumeHighOutline} className="text-rose-600 text-2xl relative z-10" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-800">Listening to your voice...</p>
                      <p className="text-xs text-rose-500">Speak clearly close to mic</p>
                    </div>
                  </div>
                )}

                {aiStatus === 'success' && (
                  <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Action Successful!</p>
                      <p className="text-xs text-emerald-600">State successfully synced with SQLite DB</p>
                    </div>
                  </div>
                )}

                {aiStatus === 'idle' && (
                  <div className="text-center py-2">
                    <p className="text-sm text-slate-600 font-semibold mb-3">What entry would you like me to automate today?</p>
                    {/* Suggestion list */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputText(s);
                            handleTextSubmit(s);
                          }}
                          className="text-left text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-xl px-3 py-2 text-slate-600 hover:text-indigo-800 transition-all font-medium leading-relaxed max-w-xs"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Input Bar */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2 items-center">
                <IonButton fill="clear" color={isListening ? 'danger' : 'primary'} className="flex-shrink-0" onClick={startVoiceInput}>
                  <IonIcon icon={micOutline} slot="icon-only" className={isListening ? 'animate-bounce' : ''} />
                </IonButton>
                <div className="flex-1 relative">
                  <IonInput
                    value={inputText}
                    onIonInput={(e) => setInputText(e.detail.value!)}
                    placeholder="Enter voice or text command..."
                    className="bg-white border border-slate-200 rounded-xl px-3 text-sm focus-within:border-indigo-500 transition-colors w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTextSubmit(inputText);
                    }}
                  />
                </div>
                <IonButton
                  fill="solid"
                  className="flex-shrink-0 bg-indigo-600 text-white rounded-xl shadow-md"
                  onClick={() => handleTextSubmit(inputText)}
                  disabled={!inputText.trim() || aiStatus === 'thinking'}
                >
                  <IonIcon icon={sendOutline} slot="icon-only" />
                </IonButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
