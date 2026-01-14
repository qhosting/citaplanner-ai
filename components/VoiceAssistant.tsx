
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, Loader2, X, Volume2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, onAppointmentCreated }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'>('IDLE');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Function Declaration para Gemini
  const createAppointmentFn: FunctionDeclaration = {
    name: 'create_appointment',
    parameters: {
      type: Type.OBJECT,
      description: 'Crea una nueva cita en el sistema.',
      properties: {
        title: { type: Type.STRING, description: 'Título o motivo de la cita' },
        date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD' },
        time: { type: Type.STRING, description: 'Hora en formato HH:mm' },
        clientName: { type: Type.STRING, description: 'Nombre del cliente' }
      },
      required: ['title', 'date', 'time', 'clientName']
    }
  };

  const stopAssistant = () => {
    setIsActive(false);
    setStatus('IDLE');
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (sessionRef.current) sessionRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  const startAssistant = async () => {
    setIsConnecting(true);
    try {
      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        // Updated to the recommended model name
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'Eres el Asistente de Voz de CitaPlanner. Tu objetivo es ayudar al usuario a agendar citas. Habla de forma natural y breve en español. Cuando tengas los datos (título, fecha, hora y cliente), usa la herramienta create_appointment.',
          tools: [{ functionDeclarations: [createAppointmentFn] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setStatus('LISTENING');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Manejo de Audio de Salida
            const base64EncodedAudioString = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              setStatus('SPEAKING');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64EncodedAudioString), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('LISTENING');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.add(source);
            }

            // Manejo de Function Calls
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'create_appointment') {
                  const { title, date, time, clientName } = fc.args as any;
                  // Simular creación o llamar a API real
                  toast.success(`Agendando: ${title} para ${clientName}`);
                  onAppointmentCreated();
                  
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: 'ok' } }
                  }));
                }
              }
            }

            const interrupted = msg.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { console.error(e); stopAssistant(); },
          onclose: () => stopAssistant()
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error(err);
      toast.error("Error al acceder al micrófono o conectar con la IA.");
      setIsConnecting(false);
    }
  };

  // HELPERS (Manual impl as per guidelines)
  function createBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }
  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function decode(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, rate: number, channels: number) {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(channels, dataInt16.length / channels, rate);
    for (let ch = 0; ch < channels; ch++) {
      const chData = buffer.getChannelData(ch);
      for (let i = 0; i < chData.length; i++) chData[i] = dataInt16[i * channels + ch] / 32768.0;
    }
    return buffer;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center p-10 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24} /></button>
        
        <div className="mb-8 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">CitaPlanner Voice</h2>
            <p className="text-slate-500 mt-2">Habla conmigo para agendar una cita rápidamente</p>
        </div>

        <div className="relative flex items-center justify-center w-48 h-48 mb-10">
            {/* Visual Waves */}
            {isActive && status === 'LISTENING' && (
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20" />
            )}
            {isActive && status === 'SPEAKING' && (
                <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse opacity-40" />
            )}

            <button 
                onClick={isActive ? stopAssistant : startAssistant}
                disabled={isConnecting}
                className={`z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
            >
                {isConnecting ? <Loader2 size={40} className="animate-spin" /> : 
                 isActive ? <Mic size={48} /> : <MicOff size={48} />}
            </button>
        </div>

        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-center gap-3">
             <div className={`w-3 h-3 rounded-full ${
                 status === 'LISTENING' ? 'bg-green-500 animate-pulse' :
                 status === 'SPEAKING' ? 'bg-purple-500' :
                 status === 'THINKING' ? 'bg-yellow-500 animate-bounce' : 'bg-slate-300'
             }`} />
             <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                 {status === 'IDLE' ? 'Pulsa para empezar' :
                  status === 'LISTENING' ? 'Escuchando...' :
                  status === 'THINKING' ? 'Procesando...' : 'Hablando...'}
             </span>
        </div>

        <p className="mt-8 text-xs text-slate-400 max-w-xs text-center italic">
            "Agenda una limpieza dental con Juan el martes a las 10 de la mañana"
        </p>
      </div>
    </div>
  );
};
