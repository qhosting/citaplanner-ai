import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, AppWindow, Smartphone, RefreshCw, 
  ChevronUp, ChevronDown, Check, ArrowRight, Sparkles,
  SmartphoneNfc, Eye, EyeOff
} from 'lucide-react';

interface DeviceVisualizerProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  isLoginPage?: boolean;
  isLandingPage?: boolean;
}

export const DeviceVisualizer: React.FC<DeviceVisualizerProps> = ({ 
  children, 
  theme = 'dark',
  isLoginPage = false,
  isLandingPage = false
}) => {
  // Detectar si está ejecutándose dentro del iframe simulador
  const isIframe = window.self !== window.top;

  if (isIframe) {
    return <>{children}</>;
  }

  // Estados del Simulador (Persistidos en localStorage)
  const [viewMode, setViewMode] = useState<'DESKTOP' | 'PWA' | 'MOBILE'>(() => {
    const saved = localStorage.getItem('citaPlannerViewMode');
    return (saved as 'DESKTOP' | 'PWA' | 'MOBILE') || 'DESKTOP';
  });

  const [mobilePlatform, setMobilePlatform] = useState<'IOS' | 'ANDROID'>(() => {
    const saved = localStorage.getItem('citaPlannerMobilePlatform');
    return (saved as 'IOS' | 'ANDROID') || 'IOS';
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('citaPlannerVisualizerCollapsed') === 'true';
  });

  // URL del iframe, inicializada con la ruta actual del navegador
  const [iframeUrl, setIframeUrl] = useState(() => {
    return window.location.pathname + window.location.search;
  });

  const [scale, setScale] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Guardar configuraciones en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem('citaPlannerViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('citaPlannerMobilePlatform', mobilePlatform);
  }, [mobilePlatform]);

  useEffect(() => {
    localStorage.setItem('citaPlannerVisualizerCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Escuchar navegación dentro del iframe (Mensajería del puente bidireccional)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'ROUTE_CHANGE') {
        const newPath = e.data.pathname;
        setIframeUrl(newPath);
        
        // Actualizar la URL real del navegador síncronamente sin recargar la página padre
        window.history.replaceState(null, '', newPath);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Escucha cambios en el historial del padre (por ejemplo, clic en atrás/adelante en el navegador)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname + window.location.search;
      setIframeUrl(currentPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Calcular escala adaptativa para que el dispositivo siempre quepa perfectamente en pantalla
  useEffect(() => {
    if (viewMode === 'DESKTOP') return;

    const calculateScale = () => {
      const verticalMargin = 160; // espacio para la barra e indicador de info
      const horizontalMargin = 40;
      
      const targetHeight = viewMode === 'MOBILE' ? (mobilePlatform === 'IOS' ? 820 : 840) : 800;
      const targetWidth = viewMode === 'MOBILE' ? (mobilePlatform === 'IOS' ? 390 : 400) : 512;

      const scaleY = (window.innerHeight - verticalMargin) / targetHeight;
      const scaleX = (window.innerWidth - horizontalMargin) / targetWidth;

      // Escalar hacia abajo, no hacia arriba (máximo 1)
      const finalScale = Math.min(scaleX, scaleY, 1);
      setScale(finalScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [viewMode, mobilePlatform]);

  // Forzar recarga del frame de simulación
  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeUrl;
    }
  };

  // Si está en modo escritorio nativo, renderiza la app normal con la barra flotante encima
  if (viewMode === 'DESKTOP') {
    return (
      <div className="relative min-h-screen">
        {children}
        
        {/* Floating Controller Bar */}
        <FloatingToolbar 
          viewMode={viewMode}
          setViewMode={setViewMode}
          mobilePlatform={mobilePlatform}
          setMobilePlatform={setMobilePlatform}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          handleReload={handleReload}
          iframeUrl={iframeUrl}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#030303] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/80 via-black to-black text-white overflow-hidden flex flex-col items-center justify-center z-[200]">
      {/* Dynamic Ambient Background Light based on Mobile or PWA */}
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[160px] opacity-15 pointer-events-none transition-all duration-1000 ${
        viewMode === 'MOBILE' 
          ? (mobilePlatform === 'IOS' ? 'bg-[#D4AF37] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'bg-emerald-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2') 
          : 'bg-[#CE4676] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
      }`} />

      {/* Simulator Workspace Indicator */}
      <div className="absolute top-5 left-6 flex items-center gap-3 select-none pointer-events-none">
        <div className="p-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
          <Sparkles className="text-[#D4AF37] animate-pulse" size={14} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Visual Studio Pro</span>
          <span className="text-[8px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">
            {viewMode === 'PWA' ? 'PWA Desktop Standalone' : `Móvil Nivel de Red (${mobilePlatform})`}
          </span>
        </div>
      </div>

      <div className="absolute top-5 right-6 flex items-center gap-4 select-none">
        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <span>Escala:</span>
          <span className="text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* Workspace Wrapper (Handles the Scale Transformation) */}
      <div 
        className="flex items-center justify-center transition-transform duration-500 ease-out origin-center"
        style={{ transform: `scale(${scale})` }}
      >
        {/* MODE: PWA standalone window */}
        {viewMode === 'PWA' && (
          <div className="w-[512px] h-[800px] bg-[#0A0A0A] border border-white/15 rounded-2xl flex flex-col shadow-[0_35px_80px_rgba(0,0,0,0.95),_0_0_40px_rgba(212,175,55,0.03)] relative overflow-hidden transition-all duration-500">
            {/* Native OS/PWA App Window Titlebar */}
            <div className="bg-[#111] border-b border-white/5 h-12 px-4 flex items-center justify-between select-none">
              {/* Colored dot window controls */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
              </div>
              
              {/* Simulated Standalone Address bar / Name */}
              <div className="bg-black/40 border border-white/5 px-6 py-1 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-300 w-64 justify-center">
                <SmartphoneNfc size={10} className="text-[#D4AF37]" />
                <span className="truncate">CitaPlanner — App PWA</span>
              </div>

              {/* Action item (Reload) */}
              <button 
                onClick={handleReload}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Recargar Simulador"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* Simulated standing screen viewport */}
            <div className="flex-grow w-full relative bg-[#050505] transform translate-z-0">
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="w-full h-full border-0 absolute inset-0 bg-[#050505]"
                title="Visualizador PWA"
              />
            </div>
          </div>
        )}

        {/* MODE: MOBILE */}
        {viewMode === 'MOBILE' && (
          <>
            {/* iOS iPhone Mockup */}
            {mobilePlatform === 'IOS' && (
              <div className="w-[390px] h-[820px] bg-black rounded-[3.2rem] border-[12px] border-zinc-900 shadow-[0_45px_100px_rgba(0,0,0,0.98),_0_0_50px_rgba(212,175,55,0.03)] relative flex flex-col overflow-hidden transition-all duration-500">
                {/* Dynamic Island */}
                <div className="w-[100px] h-6 bg-black rounded-full absolute top-3 left-1/2 -translate-x-1/2 z-[250] flex items-center justify-between px-3.5 border border-zinc-800 shadow-inner">
                  <div className="w-2.5 h-2.5 bg-zinc-950 rounded-full border border-zinc-900 flex items-center justify-center">
                    <span className="w-1 h-1 bg-[#1e2a38] rounded-full opacity-60" />
                  </div>
                  <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full border border-zinc-900" />
                </div>

                {/* iOS Status Bar */}
                <div className="h-11 px-6 flex items-center justify-between select-none absolute top-0 left-0 w-full z-[240] pointer-events-none text-white text-[10px] font-black tracking-tighter">
                  <div className="pt-0.5">9:41</div>
                  <div className="flex items-center gap-1.5">
                    {/* Cellular Network icon */}
                    <div className="flex items-end gap-[1.5px] h-2">
                      <span className="w-[2px] h-[3px] bg-white rounded-full" />
                      <span className="w-[2px] h-[4px] bg-white rounded-full" />
                      <span className="w-[2px] h-[6px] bg-white rounded-full" />
                      <span className="w-[2px] h-[8px] bg-white rounded-full" />
                    </div>
                    {/* WiFi icon */}
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21l-12-12c4.8-4.8 12.6-4.8 17.4 0l-5.4 5.4-12 12z" className="opacity-30" />
                      <path d="M12 21l-1.8-1.8c2.4-2.4 6.3-2.4 8.7 0l-6.9 6.9-1.8-1.8z" />
                    </svg>
                    {/* Battery icon */}
                    <div className="w-[18px] h-2.5 border border-white/60 rounded-[3px] p-[1px] flex items-center relative">
                      <div className="h-full w-4/5 bg-white rounded-[1.5px]" />
                      <div className="w-[1px] h-1 bg-white/60 rounded-r-[1px] absolute -right-[2.5px] top-[2px]" />
                    </div>
                  </div>
                </div>

                {/* Bottom Home Indicator */}
                <div className="w-32 h-1 bg-white/30 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2 z-[250] pointer-events-none" />

                {/* Device Screen Viewport */}
                <div className="w-full h-full flex-grow relative bg-[#050505] rounded-[2.6rem] overflow-hidden pt-11 pb-4 transform translate-z-0">
                  <iframe
                    ref={iframeRef}
                    src={iframeUrl}
                    className="w-full h-full border-0 absolute inset-0 bg-[#050505] rounded-[2.6rem]"
                    title="Visualizador iOS"
                  />
                </div>
              </div>
            )}

            {/* Android Mockup */}
            {mobilePlatform === 'ANDROID' && (
              <div className="w-[400px] h-[840px] bg-black rounded-[2.8rem] border-[9px] border-zinc-900 shadow-[0_45px_100px_rgba(0,0,0,0.98),_0_0_50px_rgba(16,185,129,0.03)] relative flex flex-col overflow-hidden transition-all duration-500">
                {/* Punch-hole camera */}
                <div className="w-3.5 h-3.5 bg-black rounded-full absolute top-3.5 left-1/2 -translate-x-1/2 z-[250] border border-zinc-800 shadow-inner flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-[#0d121c] rounded-full opacity-60" />
                </div>

                {/* Android Status Bar */}
                <div className="h-10 px-6 flex items-center justify-between select-none absolute top-0 left-0 w-full z-[240] pointer-events-none text-zinc-300 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] tracking-widest font-black uppercase text-zinc-400">CitaPlanner OS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Time */}
                    <span className="text-[9.5px]">12:30 PM</span>
                    {/* LTE / Battery */}
                    <span className="text-[8px] font-black tracking-widest">LTE</span>
                    {/* Battery icon */}
                    <div className="w-3.5 h-2.5 bg-zinc-700/50 border border-zinc-500 rounded-[2px] relative flex items-center justify-start p-[1px]">
                      <div className="h-full w-3/4 bg-emerald-500" />
                      <div className="w-0.5 h-1 bg-zinc-500 rounded-r-[1px] absolute -right-[1.5px]" />
                    </div>
                  </div>
                </div>

                {/* Android Bottom Navigation Bar (Three buttons) */}
                <div className="bg-black/95 h-12 flex items-center justify-around text-zinc-400 border-t border-white/5 absolute bottom-0 left-0 w-full z-[250] select-none text-xs">
                  {/* Back Triangle */}
                  <button 
                    onClick={() => {
                      if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.history.back();
                      }
                    }}
                    className="p-3 hover:text-white transition-colors cursor-pointer"
                  >
                    ◀
                  </button>
                  {/* Home Circle */}
                  <button 
                    onClick={() => {
                      if (iframeRef.current) {
                        iframeRef.current.src = '/';
                      }
                    }}
                    className="p-3 hover:text-white transition-colors cursor-pointer text-sm"
                  >
                    ●
                  </button>
                  {/* Recents Square */}
                  <button 
                    onClick={handleReload}
                    className="p-3 hover:text-white transition-colors cursor-pointer"
                  >
                    ■
                  </button>
                </div>

                {/* Device Screen Viewport */}
                <div className="w-full h-full flex-grow relative bg-[#050505] rounded-[2.3rem] overflow-hidden pt-10 pb-12 transform translate-z-0">
                  <iframe
                    ref={iframeRef}
                    src={iframeUrl}
                    className="w-full h-full border-0 absolute inset-0 bg-[#050505] rounded-[2.3rem]"
                    title="Visualizador Android"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Controller Bar */}
      <FloatingToolbar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        mobilePlatform={mobilePlatform}
        setMobilePlatform={setMobilePlatform}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        handleReload={handleReload}
        iframeUrl={iframeUrl}
      />
    </div>
  );
};

// COMPONENTE SECUNDARIO: La Barra Flotante de Control (Glassmorphism Premium)
interface FloatingToolbarProps {
  viewMode: 'DESKTOP' | 'PWA' | 'MOBILE';
  setViewMode: (mode: 'DESKTOP' | 'PWA' | 'MOBILE') => void;
  mobilePlatform: 'IOS' | 'ANDROID';
  setMobilePlatform: (platform: 'IOS' | 'ANDROID') => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  handleReload: () => void;
  iframeUrl: string;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  viewMode,
  setViewMode,
  mobilePlatform,
  setMobilePlatform,
  isCollapsed,
  setIsCollapsed,
  handleReload,
  iframeUrl
}) => {
  // Animación del enrutador relativo simplificado
  const relativePath = iframeUrl.split('?')[0];

  if (isCollapsed) {
    return (
      <button 
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-6 right-6 z-[300] w-14 h-14 rounded-full bg-black/90 hover:bg-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37] flex items-center justify-center text-[#D4AF37] hover:text-black shadow-[0_15px_40px_rgba(212,175,55,0.25)] hover:scale-110 transition-all duration-300 cursor-pointer group"
        title="Ver Diseñador de Dispositivos"
      >
        <Eye className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-3 w-max select-none animate-entrance">
      {/* Dynamic Sub-Toolbar for Mobile Platforms */}
      {viewMode === 'MOBILE' && (
        <div className="bg-black/90 border border-white/10 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-xl flex items-center gap-1.5 scale-95 transition-all">
          <span className="text-[7.5px] font-black uppercase tracking-[0.25em] text-zinc-400 pl-2 pr-1">Plataforma:</span>
          
          <button
            onClick={() => setMobilePlatform('IOS')}
            className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              mobilePlatform === 'IOS' 
                ? 'bg-[#D4AF37] text-black shadow-[0_4px_12px_rgba(212,175,55,0.3)]' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Apple iOS
          </button>
          <button
            onClick={() => setMobilePlatform('ANDROID')}
            className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              mobilePlatform === 'ANDROID' 
                ? 'bg-emerald-500 text-black shadow-[0_4px_12px_rgba(16,185,129,0.3)]' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Google Android
          </button>
        </div>
      )}

      {/* Main Glassmorphic Viewer Bar */}
      <div className="bg-black/85 border border-white/10 rounded-full px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_20px_rgba(212,175,55,0.12)] backdrop-blur-2xl flex items-center gap-5 text-white">
        
        {/* Title/Label */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37] hidden sm:inline">VISTA:</span>
        </div>

        {/* View Mode Selectors */}
        <div className="flex items-center gap-1">
          {/* DESKTOP */}
          <button
            onClick={() => setViewMode('DESKTOP')}
            className={`px-4 py-2 rounded-full flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              viewMode === 'DESKTOP'
                ? 'bg-white text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor size={12} />
            <span className="hidden xs:inline">Escritorio</span>
          </button>

          {/* PWA */}
          <button
            onClick={() => setViewMode('PWA')}
            className={`px-4 py-2 rounded-full flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              viewMode === 'PWA'
                ? 'bg-white text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AppWindow size={12} />
            <span className="hidden xs:inline">PWA App</span>
          </button>

          {/* MOBILE */}
          <button
            onClick={() => setViewMode('MOBILE')}
            className={`px-4 py-2 rounded-full flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              viewMode === 'MOBILE'
                ? 'bg-[#D4AF37] text-black shadow-[0_5px_15px_rgba(212,175,55,0.3)] font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone size={12} />
            <span className="hidden xs:inline">Móvil Nativo</span>
          </button>
        </div>

        {/* Active Route Bar (Visible in Iframe Modes) */}
        {viewMode !== 'DESKTOP' && (
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-1.5 rounded-full text-[8px] font-mono text-zinc-400 max-w-44 truncate">
            <span className="text-[#D4AF37] font-black">URL:</span>
            <span className="truncate">{relativePath}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 border-l border-white/10 pl-4">
          {/* Reload inside simulation */}
          {viewMode !== 'DESKTOP' && (
            <button
              onClick={handleReload}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Recargar página simulada"
            >
              <RefreshCw size={12} />
            </button>
          )}

          {/* Hide/Collapse button */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 rounded-full bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Ocultar Visualizador"
          >
            <EyeOff size={12} />
          </button>
        </div>

      </div>
    </div>
  );
};
