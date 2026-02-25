
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2, User } from 'lucide-react';
import { api } from '../services/api';

export const AIConciergeWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
        { role: 'model', content: '¡Hola! Soy tu Concierge Inteligente de Aurum. ¿En qué puedo ayudarte hoy? Puedo informarte sobre nuestros servicios, disponibilidad e instrucciones de cuidado.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Create chat history for context
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            const response = await fetch('/api/ai/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, context: { history } })
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'model', content: data.text || 'Lo siento, tuve un pequeño glitch neural. ¿Puedes repetir?' }]);
        } catch (error) {
            console.error("AI Concierge Error:", error);
            setMessages(prev => [...prev, { role: 'model', content: 'Mi conexión con el nodo central se ha interrumpido momentáneamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[9999]">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-main text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#CE4676] to-[#630E14] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageSquare className="relative z-10" />
                    <span className="absolute -top-2 -right-2 bg-bugambilia text-[8px] font-black px-2 py-1 rounded-full animate-bounce">AI</span>
                </button>
            ) : (
                <div className="bg-card-theme w-[380px] h-[600px] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col border border-theme overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
                    {/* Header */}
                    <div className="bg-main p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-2xl">
                                <Bot size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-[12px] uppercase tracking-widest">Concierge <span className="opacity-60 italic lowercase font-medium">Neural</span></h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-white/60 text-[8px] font-bold uppercase tracking-wider">Sistema Activo</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
                    >
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-[12px] leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-main text-white rounded-tr-none'
                                        : 'bg-input-theme text-main border border-theme rounded-tl-none font-medium'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-input-theme p-4 rounded-3xl rounded-tl-none flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-main/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-main/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-main/40 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-6 border-t border-theme bg-input-theme/30">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Escribe tu consulta..."
                                className="w-full bg-input-theme border border-theme rounded-2xl py-4 pl-5 pr-14 text-[12px] font-medium focus:ring-2 focus:ring-main/20 focus:border-main outline-none transition-all shadow-inner"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading}
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-main text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-90 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 opacity-30">
                            <Sparkles size={10} className="text-main" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-main">Powered by Gemini Pro</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
