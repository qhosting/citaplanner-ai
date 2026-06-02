
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-card-theme rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center p-12 relative border border-theme">
        <button onClick={onClose} className="absolute top-8 right-8 text-muted hover:text-main transition-colors"><X size={24} /></button>

        <div className="mb-10 text-center">
          <div className="inline-flex p-4 rounded-[1.5rem] bg-[#D4AF37]/10 text-[#D4AF37] mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-3xl font-black text-main uppercase tracking-tighter">CitaPlanner <span className="gold-text-gradient">Voice</span></h2>
          <p className="text-muted text-[10px] font-bold uppercase tracking-widest mt-2 px-10">Inteligencia Artificial Pro activa para tu negocio</p>
        </div>

        <div className="relative flex items-center justify-center w-52 h-52 mb-12">
          {/* Visual Waves */}
          {isActive && status === 'LISTENING' && (
            <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full animate-ping opacity-30" />
          )}
          {isActive && status === 'SPEAKING' && (
            <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full animate-pulse opacity-40 shadow-[0_0_50px_rgba(212,175,55,0.2)]" />
          )}

          <button
            onClick={isActive ? stopAssistant : startAssistant}
            disabled={isConnecting}
            className={`z-10 w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 border-4 ${isActive ? 'bg-[#D4AF37] text-black border-white/20' : 'bg-input-theme text-muted hover:text-main border-theme'
              }`}
          >
            {isConnecting ? <Loader2 size={40} className="animate-spin" /> :
              isActive ? <Mic size={56} className="text-black" /> : <MicOff size={56} />}
          </button>
        </div>

        <div className="w-full bg-input-theme rounded-2xl p-5 border border-theme flex items-center justify-center gap-4">
          <div className={`w-3 h-3 rounded-full ${status === 'LISTENING' ? 'bg-[#D4AF37] animate-pulse shadow-[0_0_10px_#D4AF37]' :
              status === 'SPEAKING' ? 'bg-[#D4AF37]' :
                status === 'THINKING' ? 'bg-amber-500 animate-bounce' : 'bg-muted'
            }`} />
          <span className="text-[10px] font-black text-main uppercase tracking-[0.3em]">
            {status === 'IDLE' ? 'Sincronización de voz lista' :
              status === 'LISTENING' ? 'Escuchando red' :
                status === 'THINKING' ? 'Interpretando...' : 'Transmitiendo...'}
          </span>
        </div>

        <p className="mt-8 text-[9px] text-muted max-w-xs text-center font-bold uppercase tracking-widest leading-relaxed opacity-60 italic">
          "Agenda una limpieza dental con Juan el martes a las 10 de la mañana"
        </p>
      </div>
    </div>
  );
};
