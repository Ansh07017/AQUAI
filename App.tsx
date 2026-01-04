
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SensorData, PredictionResult, SafetyStatus, WaterSourceCategory, DataMode, HardwareStatus } from './types';
import { 
  Droplets, History, LayoutDashboard, Database, 
  RefreshCw, Beaker, Fish, Trash2, ShieldCheck, 
  Microscope, Activity, ThumbsUp, ThumbsDown, 
  AlertCircle, TrendingUp, Settings as SettingsIcon, 
  Cpu, Keyboard, MapPin, Save, Map, LocateFixed, Send,
  CheckCircle2, Wifi, Zap, Terminal, Box, ChevronRight, Info,
  Usb, Cable, BrainCircuit, Sparkles, Navigation
} from 'lucide-react';
import { analyzeWaterQuality } from './services/geminiService';
import { 
  randomForestRegressor, randomForestClassifier, calculateConfidence, 
  calculateReliabilityIndex, calculateBioHazardScore, generateRollingValue 
} from './services/mlSimulator';
import SafetyGauge from './components/SafetyGauge';
import { COLORS, MOCK_LOCATIONS, SOURCE_LIMITS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings' | 'manual' | 'hardware'>('dashboard');
  const [dataMode, setDataMode] = useState<DataMode>(DataMode.SIMULATED);
  const [hwStatus, setHwStatus] = useState<HardwareStatus>(HardwareStatus.DISCONNECTED);
  const [hwLogs, setHwLogs] = useState<string[]>(["[System] Awaiting interface..."]);
  const [selectedCategory, setSelectedCategory] = useState<WaterSourceCategory>(WaterSourceCategory.RIVER);
  const [currentLocation, setCurrentLocation] = useState(MOCK_LOCATIONS[0]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<{data: SensorData, prediction: PredictionResult}[]>([]);
  const [learningStore, setLearningStore] = useState<{data: SensorData, prediction: PredictionResult, isCorrect: boolean}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Manual Input State
  const [manualValues, setManualValues] = useState({
    ph: 7.2, bod: 2.1, fecal: 150, tds: 450, turbidity: 4.5, do: 6.8,
    stationName: MOCK_LOCATIONS[0].name,
    lat: MOCK_LOCATIONS[0].lat,
    lng: MOCK_LOCATIONS[0].lng
  });

  // Simulation Logic (Rolling)
  const lastSimValues = useRef({
    ph: 7.2, bod: 2.1, fecal: 500, tds: 450, turbidity: 5, do: 7.0, nitrate: 5, temp: 25
  });

  const addHwLog = (msg: string) => {
    setHwLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const processPipeline = async (inputData: SensorData) => {
    setIsLoading(true);
    setFeedbackGiven(false);
    
    const severity = randomForestRegressor(inputData);
    const bioHazard = calculateBioHazardScore(inputData);
    const status = randomForestClassifier(severity, inputData);
    const confidence = calculateConfidence(inputData, severity);
    const reliability = calculateReliabilityIndex(history);

    const result = await analyzeWaterQuality(inputData, { severity, bioHazard, status, confidence, reliability });
    
    setCurrentData(inputData);
    setCurrentLocation(inputData.location);
    setPrediction(result);
    setHistory(prev => [{ data: inputData, prediction: result }, ...prev].slice(0, 50));
    setIsLoading(false);
  };

  const syncData = useCallback(async () => {
    if (dataMode !== DataMode.SIMULATED) return;
    
    const v = lastSimValues.current;
    v.ph = generateRollingValue(v.ph, 6, 9);
    v.bod = generateRollingValue(v.bod, 0.5, 15);
    v.fecal = generateRollingValue(v.fecal, 0, 20000);
    v.tds = generateRollingValue(v.tds, 100, 2000);
    v.turbidity = generateRollingValue(v.turbidity, 1, 40);
    v.do = generateRollingValue(v.do, 2, 9);
    
    const sensorData: SensorData = {
      id: `SIM-${Date.now().toString().slice(-4)}`,
      timestamp: new Date(),
      ph: v.ph, turbidity: v.turbidity, tds: v.tds, temperature: v.temp,
      dissolvedOxygen: v.do, conductivity: v.tds * 1.2, bod: v.bod,
      nitrate: v.nitrate, fecalColiform: v.fecal, totalColiform: v.fecal * 2,
      location: currentLocation, category: selectedCategory
    };

    await processPipeline(sensorData);
  }, [dataMode, selectedCategory, currentLocation, history]);

  const submitManual = async () => {
    const sensorData: SensorData = {
        id: `MAN-${Date.now().toString().slice(-4)}`,
        timestamp: new Date(),
        ph: manualValues.ph,
        turbidity: manualValues.turbidity,
        tds: manualValues.tds,
        temperature: 25,
        dissolvedOxygen: manualValues.do,
        conductivity: manualValues.tds * 1.5,
        bod: manualValues.bod,
        nitrate: 10,
        fecalColiform: manualValues.fecal,
        totalColiform: manualValues.fecal * 1.5,
        location: {
          lat: manualValues.lat,
          lng: manualValues.lng,
          name: manualValues.stationName,
          state: "Field Data"
        },
        category: selectedCategory
    };
    await processPipeline(sensorData);
    setActiveTab('dashboard');
  };

  const handleFeedback = (isCorrect: boolean) => {
    if (!currentData || !prediction) return;
    setLearningStore(prev => [...prev, { data: currentData, prediction, isCorrect }]);
    setFeedbackGiven(true);
    addHwLog(`RL Feedback: Model precision ${isCorrect ? 'confirmed' : 'flagged'}.`);
  };

  const syncLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "Local Detection Node",
          state: "GPS Calibrated"
        };
        setCurrentLocation(newLoc);
        setManualValues(prev => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          stationName: "Local Detection Node"
        }));
        addHwLog(`GPS: Station calibrated to ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      }, (err) => {
        addHwLog(`GPS Error: ${err.message}. Reverting to defaults.`);
      });
    }
  };

  useEffect(() => { 
    if (dataMode === DataMode.SIMULATED) syncData(); 
  }, [selectedCategory, dataMode]);

  const getStatusColor = (s?: SafetyStatus) => {
    if (s === SafetyStatus.SAFE) return COLORS.SAFE;
    if (s === SafetyStatus.WARNING) return COLORS.WARNING;
    return COLORS.CRITICAL;
  };

  const getHazardLevelProps = (score: number) => {
    if (score > 60) return { 
      color: COLORS.CRITICAL, 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20', 
      text: 'text-rose-500',
      label: 'Hazardous Load'
    };
    if (score > 30) return { 
      color: COLORS.WARNING, 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20', 
      text: 'text-amber-500',
      label: 'Elevated Load'
    };
    return { 
      color: COLORS.SAFE, 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20', 
      text: 'text-emerald-500',
      label: 'Optimal Load'
    };
  };

  const getMetricAnalysis = (val: number, key: string) => {
    const lim = SOURCE_LIMITS[selectedCategory];
    switch(key) {
      case 'ph':
        if (val < lim.ph[0] || val > lim.ph[1]) return { color: 'rose', status: 'Alert' };
        return { color: 'emerald', status: 'Optimal' };
      case 'bod':
        if (val > lim.bod * 3) return { color: 'rose', status: 'Critical' };
        if (val > lim.bod) return { color: 'amber', status: 'Warning' };
        return { color: 'emerald', status: 'Clean' };
      case 'tds':
        if (val > lim.tds * 1.5) return { color: 'rose', status: 'Toxic' };
        if (val > lim.tds) return { color: 'amber', status: 'Mineral' };
        return { color: 'emerald', status: 'Pure' };
      case 'fecal':
        if (val > lim.fecal * 2) return { color: 'rose', status: 'Hazard' };
        if (val > lim.fecal) return { color: 'amber', status: 'At Risk' };
        return { color: 'emerald', status: 'Safe' };
      case 'nitrates':
        if (val > 20) return { color: 'rose', status: 'Toxic' };
        if (val > 10) return { color: 'amber', status: 'Elevated' };
        return { color: 'emerald', status: 'Low' };
      case 'turbidity':
        if (val > 25) return { color: 'rose', status: 'Opaque' };
        if (val > 5) return { color: 'amber', status: 'Murky' };
        return { color: 'emerald', status: 'Clear' };
      default:
        return { color: 'emerald', status: 'Active' };
    }
  };

  const bioProps = getHazardLevelProps(prediction?.bioHazardScore || 0);

  return (
    <div className="flex h-screen bg-[#06090D] text-white font-sans overflow-hidden relative z-10">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1E262F] flex flex-col py-8 shrink-0 bg-[#0A0E14]/90 backdrop-blur-xl z-20">
        <div className="flex items-center space-x-3 mb-12 px-8">
          <div className="p-2 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">AQUAI</span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavBtn icon={LayoutDashboard} label="Monitor" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavBtn icon={Keyboard} label="Data Entry" active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
          <NavBtn icon={Cpu} label="Hardware" active={activeTab === 'hardware'} onClick={() => setActiveTab('hardware')} />
          <NavBtn icon={History} label="Replay" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavBtn icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        
        <div className="px-6 py-4 border-t border-[#1E262F] mx-4 mt-auto">
           <div className="flex items-center space-x-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] font-black uppercase text-slate-500">Node: {currentLocation.state || 'Initializing'}</span>
           </div>
           <p className="text-[9px] font-bold text-slate-600 truncate">{currentLocation.name}</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 border-b border-[#1E262F] flex items-center justify-between px-10 shrink-0 bg-[#06090D]/80 backdrop-blur-md z-20">
          <div className="flex items-center space-x-4">
             <div className="flex bg-[#0F141A] rounded-2xl p-1 border border-[#1E262F]">
                <button 
                  onClick={() => setDataMode(DataMode.SIMULATED)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center space-x-2 ${dataMode === DataMode.SIMULATED ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <TrendingUp className="w-3 h-3"/>
                  <span>Simulate</span>
                </button>
                <div className="w-px h-4 bg-[#1E262F] self-center"></div>
                <div className="px-4 py-2 text-[10px] font-black uppercase text-slate-400">
                  {currentData?.id.startsWith('SIM') ? 'Auto' : (currentData?.id.startsWith('MAN') ? 'Manual Entry' : 'Hardware Link')}
                </div>
             </div>
             <div className="h-4 w-px bg-[#1E262F]"></div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                <MapPin className="w-3 h-3 mr-2 text-blue-500" />
                <span className="truncate max-w-[200px]">{currentLocation.name}</span>
             </div>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={syncLocation} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group">
              <Navigation className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </button>
            <button onClick={() => { setDataMode(DataMode.SIMULATED); syncData(); }} className="p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl transition-all border border-blue-500/20">
              <RefreshCw className={`w-4 h-4 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative z-10">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {!feedbackGiven && prediction && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-[32px] p-6 flex items-center justify-between backdrop-blur-md">
                   <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                         <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="text-sm font-black uppercase tracking-widest">Feedback Optimization Loop</h4>
                         <p className="text-[10px] font-bold text-slate-400">Verify AI results to refine spatial reinforcement learning models.</p>
                      </div>
                   </div>
                   <div className="flex space-x-3">
                      <button onClick={() => handleFeedback(true)} className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-emerald-500/20">
                         <ThumbsUp className="w-3.5 h-3.5" />
                         <span>Confirm Accuracy</span>
                      </button>
                      <button onClick={() => handleFeedback(false)} className="flex items-center space-x-2 px-6 py-3 bg-[#1E262F] hover:bg-rose-500 rounded-xl text-[10px] font-black uppercase transition-all group border border-white/5">
                         <ThumbsDown className="w-3.5 h-3.5 group-hover:text-white" />
                         <span>Report Error</span>
                      </button>
                   </div>
                </div>
              )}

              {feedbackGiven && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-6 flex items-center justify-center space-x-3 backdrop-blur-md">
                   <Sparkles className="w-5 h-5 text-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Pattern Logged. Reinforcement weights adjusted.</span>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="bg-[#0F141A]/90 backdrop-blur-md rounded-[32px] border border-[#1E262F] p-8 flex flex-col h-[420px] relative overflow-hidden group">
                   <div className="flex justify-between items-start z-10">
                      <div className="flex flex-col">
                         <span className={`text-[10px] font-black uppercase tracking-widest mb-1 transition-colors duration-500 ${bioProps.text}`}>Pathogen Index</span>
                         <div className={`flex items-center space-x-2 border px-2 py-1 rounded-lg transition-all duration-500 ${bioProps.bg} ${bioProps.border}`}>
                            <Activity className={`w-3 h-3 ${bioProps.text}`} />
                            <span className={`text-[9px] font-black uppercase ${bioProps.text}`}>{bioProps.label}</span>
                         </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex flex-col items-end">
                         <span className="text-[8px] font-black text-slate-500 uppercase">Confidence</span>
                         <span className="text-xs font-black font-mono">{(prediction?.confidence ? prediction.confidence * 100 : 0).toFixed(0)}%</span>
                      </div>
                   </div>
                   <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="text-[120px] font-black tracking-tighter leading-none mb-2 transition-colors duration-500" style={{ color: bioProps.color, textShadow: `0 0 40px ${bioProps.color}44` }}>
                         {Math.round(prediction?.bioHazardScore || 0)}
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-500 ${bioProps.text}`}>Hazard Units</div>
                   </div>
                   <div className={`absolute -bottom-20 -right-20 w-64 h-64 blur-[100px] opacity-20 rounded-full transition-colors duration-500`} style={{ backgroundColor: bioProps.color }}></div>
                </div>

                <div className="bg-[#0F141A]/90 backdrop-blur-md rounded-[32px] border border-[#1E262F] p-8 grid grid-cols-2 gap-8 h-[420px]">
                   <MiniMetric label="pH Balance" value={currentData?.ph.toFixed(2)} {...getMetricAnalysis(currentData?.ph || 7, 'ph')} />
                   <MiniMetric label="B.O.D Index" value={currentData?.bod.toFixed(1)} unit="mg/l" {...getMetricAnalysis(currentData?.bod || 0, 'bod')} />
                   <MiniMetric label="Nitrates" value={currentData?.nitrate.toFixed(1)} unit="mg/l" {...getMetricAnalysis(currentData?.nitrate || 0, 'nitrates')} />
                   <MiniMetric label="TDS Level" value={currentData?.tds.toFixed(0)} unit="ppm" {...getMetricAnalysis(currentData?.tds || 0, 'tds')} />
                   <MiniMetric label="Coliform" value={currentData?.fecalColiform.toLocaleString()} unit="MPN" {...getMetricAnalysis(currentData?.fecalColiform || 0, 'fecal')} />
                   <MiniMetric label="Turbidity" value={currentData?.turbidity.toFixed(1)} unit="NTU" {...getMetricAnalysis(currentData?.turbidity || 0, 'turbidity')} />
                </div>

                <div className="bg-[#0F141A]/90 backdrop-blur-md rounded-[32px] border border-[#1E262F] p-8 flex items-center justify-center h-[420px]">
                   <SafetyGauge value={Math.round((prediction?.severityScore || 0))} label="Chemical Contaminants" unit="%" />
                </div>

                <div className="xl:col-span-2 bg-[#0F141A]/90 backdrop-blur-md rounded-[32px] border border-[#1E262F] p-10 flex flex-col relative overflow-hidden">
                   <div className="flex items-center space-x-3 mb-8">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Spatial Intelligence Diagnostic</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <div>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Site Cause Correlation</span>
                            <p className="text-lg font-bold text-slate-200 leading-tight">{prediction?.rootCause || 'Cross-referencing telemetry...'}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 block">Regional Countermeasure</span>
                            <p className="text-xs font-bold text-slate-400">{prediction?.counterfactual || 'Generating spatial delta...'}</p>
                         </div>
                      </div>
                      <div className="bg-blue-600 rounded-[28px] p-8 flex items-center shadow-xl shadow-blue-600/30">
                         <p className="text-xl font-black leading-tight italic text-white/95">"{prediction?.policyRecommendation || 'Drafting advisory...'}"</p>
                      </div>
                   </div>
                </div>

                <div className="bg-[#0F141A]/90 backdrop-blur-md rounded-[32px] border border-[#1E262F] p-8">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-rose-500" /> Site-Specific Risks
                   </h3>
                   <div className="space-y-5">
                      {prediction?.diseaseRisks.map((risk, i) => (
                        <div key={i} className="space-y-1.5">
                           <div className="flex justify-between text-[11px] font-black">
                              <span className="text-slate-400 uppercase">{risk.disease}</span>
                              <span className={risk.probability > 0.6 ? 'text-rose-500' : (risk.probability > 0.3 ? 'text-amber-500' : 'text-emerald-500')}>{(risk.probability * 100).toFixed(0)}%</span>
                           </div>
                           <div className="h-1 bg-black rounded-full overflow-hidden">
                              <div className="h-full bg-current transition-all duration-1000" style={{ width: `${risk.probability * 100}%`, color: risk.probability > 0.6 ? '#f43f5e' : (risk.probability > 0.3 ? '#f59e0b' : '#10b981') }}></div>
                           </div>
                        </div>
                      ))}
                      {!prediction && <div className="text-[10px] font-bold text-slate-600 animate-pulse">Running site risk analysis...</div>}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry View */}
          {activeTab === 'manual' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
               <div className="bg-[#0F141A]/90 backdrop-blur-md rounded-[40px] border border-[#1E262F] p-12 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-10 relative z-10">
                     <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30"><Keyboard className="w-6 h-6"/></div>
                        <div>
                          <h2 className="text-3xl font-black tracking-tighter">Manual Field Entry</h2>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Protocol: Lab Verified Telemetry</p>
                        </div>
                     </div>
                     <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase text-slate-400">
                        Standards: {selectedCategory}
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                     {/* Column 1: Spatial Context */}
                     <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center space-x-2 mb-2">
                           <Map className="w-4 h-4 text-blue-500" />
                           <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Spatial Context</h4>
                        </div>
                        <div className="space-y-4">
                           <InputField label="Station Name" value={manualValues.stationName} onChange={(v: string) => setManualValues({...manualValues, stationName: v})} type="text" />
                           <div className="grid grid-cols-2 gap-4">
                              <InputField label="Latitude" value={manualValues.lat} onChange={(v: string) => setManualValues({...manualValues, lat: parseFloat(v)})} />
                              <InputField label="Longitude" value={manualValues.lng} onChange={(v: string) => setManualValues({...manualValues, lng: parseFloat(v)})} />
                           </div>
                           <button 
                            onClick={syncLocation}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all text-blue-400"
                           >
                              <LocateFixed className="w-4 h-4 animate-pulse" />
                              <span>Auto-Detect GPS</span>
                           </button>
                        </div>
                     </div>

                     {/* Column 2 & 3: Parameters */}
                     <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="flex items-center space-x-2 mb-2">
                              <Beaker className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Chemical Metrics</h4>
                           </div>
                           <InputField label="pH Level" value={manualValues.ph} onChange={(v: string) => setManualValues({...manualValues, ph: parseFloat(v)})} min={0} max={14} hint={`${SOURCE_LIMITS[selectedCategory].ph[0]}-${SOURCE_LIMITS[selectedCategory].ph[1]}`} />
                           <InputField label="B.O.D (mg/l)" value={manualValues.bod} onChange={(v: string) => setManualValues({...manualValues, bod: parseFloat(v)})} min={0} max={100} hint={`Limit: ${SOURCE_LIMITS[selectedCategory].bod}`} />
                           <InputField label="TDS (ppm)" value={manualValues.tds} onChange={(v: string) => setManualValues({...manualValues, tds: parseFloat(v)})} min={0} max={5000} hint={`Limit: ${SOURCE_LIMITS[selectedCategory].tds}`} />
                        </div>
                        <div className="space-y-6">
                           <div className="flex items-center space-x-2 mb-2">
                              <Microscope className="w-4 h-4 text-rose-500" />
                              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Biological Metrics</h4>
                           </div>
                           <InputField label="Fecal Coliform" value={manualValues.fecal} onChange={(v: string) => setManualValues({...manualValues, fecal: parseFloat(v)})} min={0} max={100000} hint={`Limit: ${SOURCE_LIMITS[selectedCategory].fecal}`} />
                           <InputField label="Turbidity (NTU)" value={manualValues.turbidity} onChange={(v: string) => setManualValues({...manualValues, turbidity: parseFloat(v)})} min={0} max={100} hint="Max: 25" />
                           <InputField label="D.O (mg/l)" value={manualValues.do} onChange={(v: string) => setManualValues({...manualValues, do: parseFloat(v)})} min={0} max={15} hint="Opt: > 5" />
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={submitManual}
                    disabled={isLoading}
                    className="w-full mt-12 py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-3xl transition-all flex items-center justify-center space-x-4 shadow-2xl shadow-blue-600/40 relative z-10 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin relative z-10" /> : <Send className="w-5 h-5 relative z-10" />}
                    <span className="relative z-10">{isLoading ? 'Engaging Neural Diagnostic Core...' : 'Sync Site Telemetry to AI'}</span>
                  </button>
               </div>
            </div>
          )}

          {/* Hardware View */}
          {activeTab === 'hardware' && (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-[#0F141A]/90 backdrop-blur-md rounded-[40px] border border-[#1E262F] p-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                          <Usb className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black tracking-tighter">Hardware Bridge</h2>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Serial / UART Physical Interface</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setHwStatus(HardwareStatus.CONNECTING); setTimeout(() => setHwStatus(HardwareStatus.ERROR), 1500); }}
                        className="px-6 py-3 bg-[#1E262F] border border-blue-500/30 hover:bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                         Scan Physical Ports
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <BlueprintStep num="01" title="USB Serial" desc="Bridge MCU via serial cable. Ensure 115200 baud is configured." icon={Cable} />
                       <BlueprintStep num="02" title="Site Calibration" desc="Auto-link current GPS coords to the hardware data stream." icon={Navigation} />
                    </div>
                  </div>
                  <div className="bg-[#0A0E14]/90 border border-[#1E262F] rounded-[32px] p-6 font-mono text-xs backdrop-blur-md">
                     <div className="text-emerald-500 mb-4 font-black uppercase tracking-widest flex items-center">
                        <div className="w-1 h-1 bg-current rounded-full mr-2 animate-pulse"></div>
                        <span>Telemetry Buffer</span>
                     </div>
                     <div className="h-40 overflow-y-auto space-y-1 opacity-60 custom-scrollbar">
                        {hwLogs.map((log, i) => <div key={i}>{log}</div>)}
                     </div>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-blue-600 rounded-[32px] p-8 flex flex-col justify-between shadow-2xl shadow-blue-600/10">
                   <h3 className="text-2xl font-black italic uppercase leading-tight">Spatial Reinforcement</h3>
                   <p className="text-xs font-bold text-white/70 leading-relaxed">
                     Hardware monitoring nodes are automatically geofenced. The AI analyzes temporal trends specifically tied to these coordinates.
                   </p>
                   <div className="bg-white/10 p-4 rounded-xl border border-white/10 mt-6">
                      <span className="text-[9px] font-black uppercase block mb-1 opacity-60">Handshake Status</span>
                      <span className="text-xs font-black tracking-widest">{hwStatus}</span>
                   </div>
                </div>
             </div>
          )}

          {/* History View */}
          {activeTab === 'history' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
               <h2 className="text-3xl font-black tracking-tighter">Site Replay Engine</h2>
               <div className="bg-[#0F141A]/90 backdrop-blur-md rounded-[32px] border border-[#1E262F] overflow-hidden shadow-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-[#06090D] border-b border-[#1E262F]">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase">Timestamp</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase">Location Node</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase">Bio Hazard</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i} className="border-b border-[#1E262F]/50 hover:bg-white/[0.02] transition-all">
                          <td className="px-8 py-6 font-mono text-xs opacity-50">{h.data.timestamp.toLocaleTimeString()}</td>
                          <td className="px-8 py-6 text-sm font-bold truncate max-w-[200px]">{h.data.location.name}</td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black px-3 py-1 rounded-full border" style={{ color: getStatusColor(h.prediction.status), borderColor: getStatusColor(h.prediction.status) }}>{h.prediction.status}</span>
                          </td>
                          <td className="px-8 py-6 font-black font-mono text-blue-400">{Math.round(h.prediction.bioHazardScore)}</td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">No site archives available</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
               <h2 className="text-3xl font-black tracking-tighter">Environment Control</h2>
               <div className="grid grid-cols-2 gap-8">
                  <div className="bg-[#0F141A]/90 backdrop-blur-md p-10 rounded-[40px] border border-[#1E262F] space-y-6">
                     <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Global Source Standard</h4>
                     <div className="space-y-3">
                        {Object.values(WaterSourceCategory).map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center ${selectedCategory === cat ? 'bg-blue-600/10 border-blue-600 text-white font-black' : 'border-[#1E262F] text-slate-500 hover:border-slate-300'}`}
                          >
                             <span>{cat}</span>
                             {selectedCategory === cat && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="bg-[#0F141A]/90 backdrop-blur-md p-10 rounded-[40px] border border-[#1E262F] space-y-6 flex flex-col">
                     <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Neural Calibration</h4>
                     <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1E262F] rounded-[32px] text-center">
                        <BrainCircuit className="w-12 h-12 text-blue-500 mb-4 opacity-50" />
                        <span className="text-2xl font-black mb-1">{learningStore.length}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reinforcement Vectors</span>
                     </div>
                     <button 
                      className="w-full py-4 bg-[#1E262F] hover:bg-[#2A3440] text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 mt-4"
                      disabled={learningStore.length < 5}
                     >
                       Re-train Site Heuristics
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const BlueprintStep = ({ num, title, desc, icon: Icon }: any) => (
  <div className="group p-6 bg-[#06090D] border border-[#1E262F] rounded-2xl hover:border-blue-500/50 transition-all">
     <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-blue-500 tracking-widest">{num}</span>
        <Icon className="w-4 h-4 text-slate-600 group-hover:text-blue-500 transition-colors" />
     </div>
     <h5 className="text-sm font-black uppercase tracking-tight mb-2">{title}</h5>
     <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const NavBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${active ? 'bg-[#1E262F] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-black uppercase tracking-widest">{label}</span>
  </button>
);

const MiniMetric = ({ label, value, unit, status, color = 'emerald' }: any) => (
  <div className="flex flex-col group">
    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-3">{label}</p>
    <div className="flex items-baseline space-x-1">
      <span className="text-3xl font-black font-mono tracking-tighter">{value || '--'}</span>
      <span className="text-[9px] font-bold text-slate-600">{unit}</span>
    </div>
    <div className={`mt-3 text-[9px] font-black uppercase flex items-center ${color === 'rose' ? 'text-rose-500' : (color === 'amber' ? 'text-amber-500' : 'text-emerald-500')}`}>
       <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 shadow-[0_0_5px_currentColor]"></div> {status}
    </div>
  </div>
);

const InputField = ({ label, value, onChange, min, max, hint, type = "number" }: any) => (
  <div className="space-y-2">
     <div className="flex justify-between">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</label>
        {hint && <span className="text-[9px] font-bold text-blue-500 uppercase">{hint}</span>}
     </div>
     <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      min={min} 
      max={max}
      className="w-full bg-[#06090D] border border-[#1E262F] rounded-xl p-4 text-white font-mono focus:border-blue-600 focus:outline-none transition-all placeholder-slate-700"
     />
  </div>
);

export default App;
