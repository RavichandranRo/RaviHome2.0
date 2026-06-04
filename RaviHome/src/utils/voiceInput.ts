export const listenForVoiceInput = (
  onText: (text: string) => void,
  onStateChange?: (isListening: boolean) => void,
) => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    window.alert('Your device does not support voice input.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => onStateChange?.(true);
  recognition.onresult = (event: any) => onText(event.results[0][0].transcript);
  recognition.onend = () => onStateChange?.(false);
  recognition.onerror = () => onStateChange?.(false);
  recognition.start();
};
