
import React, { useState, useEffect, useCallback } from 'react';
import { 
  SensorData, 
  PredictionResult, 
  SafetyStatus, 
  FeedbackLog 
} from './types';
import { 
  Activity, 
  AlertTriangle, 
  Droplets, 
  History, 
  LayoutDashboard, 
  Settings, 
  ShieldAlert,
  Zap,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Database,
  MapPin,
  Share2,
  Cpu,
  Navigation,
  Microscope,
  Waves,
  Keyboard,
  Link as LinkIcon,
  ChevronRight,
  Info,
  BookOpen,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { analyzeWaterQuality } from './services/geminiService';
import { 
  randomForestRegressor, 
  randomForestClassifier, 
  predictDiseaseProbabilities,
  SAMPLE_DATASET 
} from './services/mlSimulator';
import SafetyGauge from './components/SafetyGauge';
import DiseaseCard from './components/DiseaseCard';
import { COLORS, MOCK_LOCATIONS, SEVERITY_THRESHOLDS, WATER_QUALITY_INDICATORS } from './constants';

type PipelineSource = 'simulated' | 'manual' | 'iot';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'dataset' | 'settings'>('dashboard');
  const [pipelineSource, setPipelineSource] = useState<PipelineSource>('simulated');
  const [selectedLocation, setSelectedLocation] = useState(MOCK_LOCATIONS[0]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<{data: SensorData, prediction: PredictionResult}[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(94.2);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Manual Input State
  const [manualFields, setManualFields] = useState({
    ph: 7.0,
    bod: 2.0,
    do: 6.0,
    fecal: 500,
    conductivity: 500
  });

  const MANUAL_FIELD_LABELS: Record<string, string> = {
    ph: "pH (6.5-8.5)",
    bod: "BOD (< 3mg/l)",
    do: "DO (> 4mg/l)",
    fecal: "Fecal (< 2500)",
    conductivity: "Cond (400-1200)"
  };

  const generateMockData = useCallback((locationOverride?: typeof MOCK_LOCATIONS[0]): SensorData => {
    const loc = locationOverride || selectedLocation;
    const isAnomaly = Math.random() > 0.6;
    
    return {
      id: "STN-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      timestamp: new Date(),
      ph: 6.5 + (Math.random() * 2),
      turbidity: Math.random() * (isAnomaly ? 30 : 5),
      tds: 200 + Math.random() * 1200,
      temperature: 24 + Math.random() * 8,
      dissolvedOxygen: 3 + Math.random() * 5,
      bod: isAnomaly ? 8 + Math.random() * 20 : 1 + Math.random() * 3,
      nitrate: Math.random() * 15,
      fecalColiform: isAnomaly ? 5000 + Math.random() * 50000 : 100 + Math.random() * 1500,
      totalColiform: isAnomaly ? 10000 + Math.random() * 100000 : 500 + Math.random() * 4000,
      conductivity: 400 + Math.random() * 800,
      location: loc
    };
  }, [selectedLocation]);

  const handlePredict = async (data: SensorData) => {
    setIsLoading(true);
    const severity = randomForestRegressor(data);
    const status = randomForestClassifier(severity, data);
    const localDiseases = predictDiseaseProbabilities(data);

    const result = await analyzeWaterQuality(data, { severity, status });
    if (result.diseaseRisks.length === 0) result.diseaseRisks = localDiseases;

    setPrediction(result);
    setHistory(prev => [{ data, prediction: result }, ...prev].slice(0, 30));
    setIsLoading(false);
  };

  const startSimulation = () => {
    const data = generateMockData();
    setCurrentData(data);
    handlePredict(data);
  };

  const processManualInput = () => {
    const data: SensorData = {
      ...generateMockData(),
      ph: manualFields.ph,
      bod: manualFields.bod,
      dissolvedOxygen: manualFields.do,
      fecalColiform: manualFields.fecal,
      conductivity: manualFields.conductivity,
      timestamp: new Date(),
    };
    setCurrentData(data);
    handlePredict(data);
  };

  useEffect(() => {
    if (pipelineSource === 'simulated') startSimulation();
  }, [pipelineSource]);

  const handleLocationChange = (loc: typeof MOCK_LOCATIONS[0]) => {
    setSelectedLocation(loc);
    const data = generateMockData(loc);
    setCurrentData(data);
    handlePredict(data);
  };

  const handleFeedback = (isAccurate: boolean) => {
    if (!prediction || !currentData) return;
    alert(isAccurate ? "Thank you! Your feedback helps refine our AI models." : "Discrepancy noted. Our team will review this telemetry stream.");
  };

  const getStatusColor = (severity?: number) => {
    if (severity !== undefined) {
        if (severity <= SEVERITY_THRESHOLDS.SAFE) return COLORS.SAFE;
        if (severity <= SEVERITY_THRESHOLDS.WARNING) return COLORS.WARNING;
        return COLORS.CRITICAL;
    }
    return COLORS.SECONDARY;
  };

  const themeClasses = {
    bg: isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900',
    sidebar: isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200',
    card: isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200',
    innerBg: isDarkMode ? 'bg-slate-950' : 'bg-slate-100',
    textMuted: isDarkMode ? 'text-slate-500' : 'text-slate-400',
    textPrimary: isDarkMode ? 'text-white' : 'text-slate-900',
    border: isDarkMode ? 'border-white/5' : 'border-slate-200',
    header: isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${themeClasses.bg}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col hidden md:flex shrink-0 border-r ${themeClasses.sidebar}`}>
        <div className="p-8 flex items-center space-x-3">
          <div className="bg-sky-500 p-2.5 rounded-2xl shadow-xl shadow-sky-500/20">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <span className={`text-2xl font-black tracking-tighter italic ${themeClasses.textPrimary}`}>AQUAI</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'history', label: 'Field Logs', icon: History },
            { id: 'dataset', label: 'Research Lab', icon: Microscope },
            { id: 'settings', label: 'Station Config', icon: Settings }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-sky-600 text-white shadow-lg' : isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className={`${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-100'} rounded-3xl p-5 border ${themeClasses.border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] uppercase font-black tracking-widest ${themeClasses.textMuted}`}>Model Fidelity</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
            <div className={`text-3xl font-black ${themeClasses.textPrimary}`}>{confidenceScore.toFixed(1)}%</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={`${themeClasses.header} border-b h-24 flex items-center justify-between px-6 md:px-10 z-20 shrink-0`}>
          <div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight flex items-center uppercase ${themeClasses.textPrimary}`}>
              {activeTab === 'dashboard' ? 'Water Quality Dashboard' : activeTab}
            </h2>
            <div className={`flex items-center text-[10px] font-bold uppercase tracking-widest mt-1 ${themeClasses.textMuted}`}>
              <MapPin className="w-3 h-3 mr-1 text-sky-500" />
              {selectedLocation.name}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="Toggle Theme"
             >
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             {pipelineSource === 'simulated' && (
                <button 
                  onClick={startSimulation}
                  disabled={isLoading}
                  className="group flex items-center space-x-2 bg-sky-600 text-white px-4 md:px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-sky-600/10"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-xs md:text-sm font-black hidden sm:inline">Sync Sample</span>
                </button>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-10 pb-10">
              
              {/* Pipeline Controller */}
              <div className={`${themeClasses.card} p-1.5 md:p-2 rounded-3xl border flex items-center space-x-1 md:space-x-2 w-fit mx-auto shadow-xl`}>
                {[
                  { id: 'simulated', label: 'Sim', icon: RefreshCw },
                  { id: 'manual', label: 'Manual', icon: Keyboard },
                  { id: 'iot', label: 'IoT', icon: Cpu }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPipelineSource(p.id as PipelineSource)}
                    className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-2xl transition-all font-bold text-xs ${pipelineSource === p.id ? (isDarkMode ? 'bg-white text-slate-900' : 'bg-sky-600 text-white') : themeClasses.textMuted + ' hover:text-sky-500'}`}
                  >
                    <p.icon className="w-4 h-4" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Data Ingestion Section */}
              {pipelineSource === 'manual' && (
                <div className={`${themeClasses.card} p-6 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-xl`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm md:text-lg font-black uppercase tracking-wider text-sky-500">Manual Data Lab</h3>
                    <p className={`text-[10px] font-bold italic ${themeClasses.textMuted}`}>Bypassing Hardware Bridge</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                    {Object.entries(manualFields).map(([key, value]) => (
                      <div key={key}>
                        <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${themeClasses.textMuted}`}>
                          {MANUAL_FIELD_LABELS[key] || key}
                        </label>
                        <input 
                          type="number"
                          value={value}
                          onChange={(e) => setManualFields(prev => ({...prev, [key]: parseFloat(e.target.value)}))}
                          className={`w-full ${themeClasses.innerBg} border ${themeClasses.border} rounded-xl px-4 py-3 font-bold focus:border-sky-500 outline-none transition-all ${themeClasses.textPrimary}`}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={processManualInput}
                    className="w-full mt-8 bg-sky-600 hover:bg-sky-500 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-sky-600/10"
                  >
                    <Activity className="w-5 h-5" />
                    <span>RUN DIAGNOSTICS</span>
                  </button>
                </div>
              )}

              {pipelineSource === 'iot' && (
                <div className={`${themeClasses.card} p-8 md:p-12 rounded-[32px] md:rounded-[40px] border border-dashed flex flex-col items-center justify-center space-y-6 text-center`}>
                  <div className="relative">
                     <div className="absolute inset-0 bg-sky-500/20 blur-3xl animate-pulse"></div>
                     <LinkIcon className="w-12 h-12 md:w-16 md:h-16 text-sky-500 relative z-10" />
                  </div>
                  <div>
                    <h3 className={`text-lg md:text-xl font-black uppercase ${themeClasses.textPrimary}`}>Hardware Required</h3>
                    <p className={`${themeClasses.textMuted} text-sm mt-2 max-w-sm mx-auto`}>Connect your sensor bridge (ESP32) to the USB interface for live telemetry.</p>
                  </div>
                </div>
              )}

              {/* Main Visualization Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className={`${themeClasses.card} p-8 md:p-10 rounded-[40px] md:rounded-[48px] border shadow-xl flex flex-col items-center justify-center relative overflow-hidden`}>
                  <SafetyGauge value={prediction?.severityScore || 0} isDarkMode={isDarkMode} />
                  <div className="mt-8 z-10">
                    <div 
                      className="px-8 py-3 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg transition-all duration-700"
                      style={{ 
                        backgroundColor: getStatusColor(prediction?.severityScore),
                      }}
                    >
                      {prediction?.status || 'Analyzing...'}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard label="pH Value" value={currentData?.ph.toFixed(2) || '--'} unit="pH" icon={<Activity />} severity={prediction?.severityScore} isDarkMode={isDarkMode} />
                  <StatCard label="D.O. Level" value={currentData?.dissolvedOxygen.toFixed(1) || '--'} unit="mg/l" icon={<Waves />} severity={prediction?.severityScore} isDarkMode={isDarkMode} />
                  <StatCard label="B.O.D. Index" value={currentData?.bod.toFixed(1) || '--'} unit="mg/l" icon={<AlertTriangle />} severity={prediction?.severityScore} isDarkMode={isDarkMode} />
                  <StatCard label="Fecal Coliform" value={currentData?.fecalColiform.toLocaleString() || '--'} unit="MPN" icon={<Microscope />} severity={prediction?.severityScore} isDarkMode={isDarkMode} />
                  <StatCard label="Conductivity" value={currentData?.conductivity.toFixed(0) || '--'} unit="µmhos" icon={<Zap />} severity={prediction?.severityScore} isDarkMode={isDarkMode} />
                  
                  <div className={`${themeClasses.card} p-8 rounded-[40px] flex flex-col justify-between shadow-xl border relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                        <MapPin className={`w-20 h-20 ${themeClasses.textPrimary}`} />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2 text-sky-500 mb-2">
                           <MapPin className="w-3 h-3" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{currentData?.location.state}</span>
                        </div>
                        <h4 className={`text-lg font-black leading-tight line-clamp-2 pr-10 ${themeClasses.textPrimary}`}>{currentData?.location.name}</h4>
                    </div>
                    <div className={`mt-4 flex items-center justify-between border-t ${themeClasses.border} pt-4`}>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${themeClasses.textMuted}`}>{currentData?.id}</p>
                        <ChevronRight className={`w-4 h-4 ${themeClasses.textMuted}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  {/* Executive Summary with fixed mobile responsiveness */}
                  <div className={`${themeClasses.card} p-5 md:p-12 rounded-[32px] md:rounded-[56px] border shadow-xl relative overflow-hidden`}>
                    <div className="flex items-center space-x-4 mb-6 md:mb-8">
                       <div className="p-3 bg-sky-500/10 rounded-2xl shrink-0">
                          <ShieldAlert className="w-6 h-6 md:w-8 md:h-8 text-sky-500" />
                       </div>
                       <h3 className={`text-lg md:text-2xl font-black tracking-tight ${themeClasses.textPrimary}`}>Executive Biological Summary</h3>
                    </div>
                    <div className="max-w-full overflow-hidden">
                      <p className={`text-sm md:text-xl leading-relaxed font-medium break-words hyphens-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} style={{ overflowWrap: 'anywhere' }}>
                        {isLoading ? (
                          <span className="flex items-center space-x-3">
                            <RefreshCw className="w-5 h-5 md:w-6 md:h-6 animate-spin text-sky-500" />
                            <span>Calibrating Gemini Inference Engine...</span>
                          </span>
                        ) : prediction?.aiSummary}
                      </p>
                    </div>
                    <div className={`mt-8 md:mt-12 flex flex-wrap gap-4 border-t ${themeClasses.border} pt-8 md:pt-10`}>
                        <button onClick={() => handleFeedback(true)} className={`flex items-center space-x-3 px-6 md:px-8 py-3 md:py-4 rounded-[20px] md:rounded-[24px] font-black text-xs transition-all border ${isDarkMode ? 'bg-white/5 text-slate-400 border-transparent hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`}>
                          <ThumbsUp className="w-4 h-4" /> <span>Valid</span>
                        </button>
                        <button onClick={() => handleFeedback(false)} className={`flex items-center space-x-3 px-6 md:px-8 py-3 md:py-4 rounded-[20px] md:rounded-[24px] font-black text-xs transition-all border ${isDarkMode ? 'bg-white/5 text-slate-400 border-transparent hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'}`}>
                          <ThumbsDown className="w-4 h-4" /> <span>Discrepancy</span>
                        </button>
                    </div>
                  </div>

                  <div className={`${themeClasses.card} p-8 md:p-12 rounded-[32px] md:rounded-[56px] border shadow-xl h-[350px] md:h-[400px]`}>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className={`text-base md:text-xl font-black uppercase tracking-[0.1em] ${themeClasses.textPrimary}`}>
                        <Activity className="w-5 h-5 mr-3 text-emerald-500 inline" /> Telemetry Trends
                      </h3>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={history.map(h => ({ name: h.data.timestamp.toLocaleTimeString(), ph: h.data.ph })).reverse()}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
                        <XAxis dataKey="name" hide />
                        <YAxis stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.2)"} fontSize={10} fontVariant="tabular-nums" />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderRadius: '16px', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                        <Area type="monotone" dataKey="ph" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-10">
                   <div className={`${themeClasses.card} p-8 md:p-10 rounded-[32px] md:rounded-[56px] border shadow-xl`}>
                    <h3 className={`text-lg md:text-xl font-black mb-10 tracking-tight uppercase tracking-wider ${themeClasses.textPrimary}`}>Health Risk</h3>
                    <div className="space-y-6">
                      {prediction?.diseaseRisks.map((risk, idx) => <DiseaseCard key={idx} risk={risk} isDarkMode={isDarkMode} />)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer Knowledge Section */}
              <footer className={`mt-20 border-t ${themeClasses.border} pt-16`}>
                 <div className="flex items-center space-x-4 mb-10">
                    <div className="p-3 bg-sky-500/10 rounded-2xl">
                       <BookOpen className="w-6 h-6 text-sky-500" />
                    </div>
                    <h3 className={`text-2xl font-black tracking-tight ${themeClasses.textPrimary}`}>Knowledge Base</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    {WATER_QUALITY_INDICATORS.map((indicator, idx) => (
                        <div key={idx} className={`${themeClasses.card} p-8 rounded-[32px] border hover:shadow-xl transition-all group`}>
                            <h4 className={`text-lg font-black mb-4 group-hover:text-sky-500 transition-colors ${themeClasses.textPrimary}`}>{indicator.name}</h4>
                            <p className={`text-sm leading-relaxed mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{indicator.description}</p>
                            <div className={`flex items-start space-x-3 p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <Info className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                                <p className={`text-[11px] font-bold italic ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{indicator.impact}</p>
                            </div>
                        </div>
                    ))}
                    <div className="bg-sky-600 p-10 rounded-[32px] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                             <ShieldAlert className="w-24 h-24" />
                        </div>
                        <h4 className="text-xl font-black mb-4">Safety Standards</h4>
                        <p className="text-sky-100 text-sm leading-relaxed mb-8">Aquai leverages CPCB (Central Pollution Control Board) and WHO benchmarks for precision safety scoring.</p>
                        <button className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest hover:translate-x-2 transition-transform">
                            <span>Read guidelines</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
                 <div className="mt-20 text-center pb-10">
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${themeClasses.textMuted}`}>Powered by Aquai & Google Gemini 3</p>
                 </div>
              </footer>
            </div>
          )}
          
          {activeTab === 'dataset' && (
            <div className={`max-w-7xl mx-auto ${themeClasses.card} p-8 md:p-12 rounded-[40px] md:rounded-[56px] border shadow-xl`}>
                <h3 className={`text-2xl font-black mb-10 uppercase tracking-widest ${themeClasses.textPrimary}`}>Ground Truth Engine</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={`border-b ${themeClasses.border} text-[10px] font-black uppercase tracking-widest ${themeClasses.textMuted}`}>
                                <th className="px-6 py-4">pH Index</th>
                                <th className="px-6 py-4">D.O. (mg/l)</th>
                                <th className="px-6 py-4">B.O.D</th>
                                <th className="px-6 py-4">Coliform</th>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${themeClasses.border}`}>
                            {SAMPLE_DATASET.map((row, i) => (
                                <tr key={i} className={`${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} transition-colors`}>
                                    <td className={`px-6 py-6 font-black ${themeClasses.textPrimary}`}>{row.ph}</td>
                                    <td className={`px-6 py-6 font-bold ${themeClasses.textMuted}`}>{row.do}</td>
                                    <td className="px-6 py-6 font-bold text-rose-500">{row.bod}</td>
                                    <td className="px-6 py-6 font-bold text-orange-500">{row.fecal}</td>
                                    <td className={`px-6 py-6 font-black ${themeClasses.textPrimary}`}>{row.severity}%</td>
                                    <td className="px-6 py-6">
                                        <span className="px-4 py-2 rounded-xl text-[10px] font-black text-white" style={{ backgroundColor: getStatusColor(row.severity) }}>{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'history' && (
             <div className={`max-w-7xl mx-auto ${themeClasses.card} rounded-[40px] md:rounded-[56px] border shadow-xl overflow-hidden`}>
                <table className="w-full text-left">
                    <thead className={`${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50'} text-[10px] font-black uppercase tracking-widest ${themeClasses.textMuted}`}>
                        <tr>
                            <th className="px-6 md:px-10 py-6 md:py-8">Stream</th>
                            <th className="px-6 md:px-10 py-6 md:py-8">Geography</th>
                            <th className="px-6 md:px-10 py-6 md:py-8">B.O.D</th>
                            <th className="px-6 md:px-10 py-6 md:py-8">Coliform</th>
                            <th className="px-6 md:px-10 py-6 md:py-8">Result</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${themeClasses.border}`}>
                        {history.map((h, i) => (
                            <tr key={i} className={`${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} transition-colors`}>
                                <td className={`px-6 md:px-10 py-6 text-xs font-bold ${themeClasses.textMuted}`}>{h.data.timestamp.toLocaleTimeString()}</td>
                                <td className={`px-6 md:px-10 py-6 font-black text-sm ${themeClasses.textPrimary}`}>{h.data.location.name}</td>
                                <td className={`px-6 md:px-10 py-6 font-bold ${themeClasses.textMuted}`}>{h.data.bod.toFixed(1)}</td>
                                <td className="px-6 md:px-10 py-6 font-bold text-rose-500">{h.data.fecalColiform.toLocaleString()}</td>
                                <td className="px-6 md:px-10 py-6">
                                    <span className="px-4 py-2 rounded-xl text-[10px] font-black text-white" style={{ backgroundColor: getStatusColor(h.prediction.severityScore) }}>{h.prediction.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          )}
          
          {activeTab === 'settings' && (
            <div className={`max-w-4xl mx-auto ${themeClasses.card} p-8 md:p-12 rounded-[40px] md:rounded-[56px] border shadow-xl`}>
                <h3 className={`text-2xl font-black mb-10 uppercase tracking-widest ${themeClasses.textPrimary}`}>Station Protocol</h3>
                <p className={`${themeClasses.textMuted} font-bold text-sm mb-12`}>Select an active survey site to switch telemetry streams.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                     {MOCK_LOCATIONS.map((loc, idx) => (
                        <button key={idx} onClick={() => handleLocationChange(loc)} className={`flex items-start p-6 md:p-8 rounded-[32px] border-2 transition-all text-left group ${selectedLocation.name === loc.name ? 'border-sky-500 bg-sky-500/5 shadow-lg' : isDarkMode ? 'border-white/5 hover:border-white/10 hover:bg-white/5' : 'border-slate-100 hover:border-sky-200 hover:bg-sky-50'}`}>
                          <div className={`p-4 rounded-2xl mr-6 transition-all ${selectedLocation.name === loc.name ? 'bg-sky-500 text-white shadow-xl scale-110' : isDarkMode ? 'bg-slate-950 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                            <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <div>
                            <p className={`font-black text-base md:text-lg transition-colors ${selectedLocation.name === loc.name ? 'text-sky-400' : themeClasses.textPrimary}`}>{loc.name}</p>
                            <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${themeClasses.textMuted}`}>{loc.state}</p>
                          </div>
                        </button>
                      ))}
                </div>
            </div>
          )}

        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(120, 120, 120, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(120, 120, 120, 0.4); }
      `}</style>
    </div>
  );
};

interface StatCardProps { 
  label: string; 
  value: string; 
  unit: string; 
  icon: React.ReactNode; 
  severity?: number;
  isDarkMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, severity, isDarkMode }) => {
  const getUnifiedColor = (v?: number) => {
    if (v === undefined) return '#0ea5e9';
    if (v <= SEVERITY_THRESHOLDS.SAFE) return COLORS.SAFE;
    if (v <= SEVERITY_THRESHOLDS.WARNING) return COLORS.WARNING;
    return COLORS.CRITICAL;
  };

  const color = getUnifiedColor(severity);
  
  return (
    <div 
        className={`p-6 md:p-8 rounded-[32px] md:rounded-[40px] border transition-all duration-700 group overflow-hidden relative shadow-lg ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}
        style={{ 
            borderColor: `${color}2A`,
        }}
    >
      <div className="absolute top-0 right-0 p-4 transform translate-x-4 -translate-y-4 opacity-5 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-10 transition-all duration-700">
        <div className="w-20 h-20" style={{ color }}>{icon}</div>
      </div>
      <div className="mb-6 md:mb-8">
        <div 
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl transition-all duration-700 border shadow-inner ${isDarkMode ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-100'}`}
            style={{ color: color }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <h4 className={`text-3xl md:text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{value}</h4>
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{unit}</span>
      </div>
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-3 md:mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
    </div>
  );
};

export default App;
