
import React, { useState, useMemo } from 'react';
import { RoomData, Task, MonitoringInterval } from '../types';
import { COMMON_PRECAUTIONS, CONTRAPTION_OPTIONS, FLUID_OPTIONS } from '../constants';
import { getSmartNursingRecommendations } from '../services/geminiService';

interface RoomDashboardProps {
  room: RoomData;
  onUpdate: (updatedRoom: RoomData) => void;
  onDeleteTask: (taskId: string) => void;
}

const RoomDashboard: React.FC<RoomDashboardProps> = ({ room, onUpdate, onDeleteTask }) => {
  const [newTask, setNewTask] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const sortedTasks = useMemo(
    () => [...(room.tasks || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [room.tasks]
  );

  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = (room.tasks || []).map(t => {
      if (t.id === taskId) {
        const isCompleted = !t.isCompleted;
        return {
          ...t,
          isCompleted,
          completedAt: isCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      }
      return t;
    });
    onUpdate({ ...room, tasks: updatedTasks });
  };

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTask.trim()) return;
    const task: Task = {
      id: "tk_" + Date.now(),
      description: newTask.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    onUpdate({ ...room, tasks: [...(room.tasks || []), task] });
    setNewTask('');
  };

  const handleSmartSuggest = async () => {
    if (!room.diagnosis) {
      alert("Please enter a diagnosis first for smart suggestions.");
      return;
    }
    setIsSuggesting(true);
    const suggestions = await getSmartNursingRecommendations(room.diagnosis);
    if (suggestions && suggestions.suggestedTasks) {
      const newTasks: Task[] = suggestions.suggestedTasks.map((desc: string) => ({
        id: "tk_smart_" + Math.random().toString(36).substr(2, 9),
        description: `Suggested: ${desc}`,
        isCompleted: false,
        createdAt: new Date().toISOString()
      }));
      onUpdate({ ...room, tasks: [...(room.tasks || []), ...newTasks] });
    }
    setIsSuggesting(false);
  };

  const handleInputChange = (field: keyof RoomData, value: any) => {
    onUpdate({ ...room, [field]: value });
  };

  const toggleArrayItem = (field: 'precautions' | 'contraptions', item: string) => {
    const current = (room[field] as string[]) || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    handleInputChange(field, updated);
  };

  const toggleStatus = () => {
    handleInputChange('status', room.status === 'active' ? 'inactive' : 'active');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center overflow-hidden relative group transition-all hover:shadow-xl hover:border-green-100/30">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-5 mb-6">
            <button 
              onClick={toggleStatus}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm ${
                room.status === 'active' 
                  ? 'bg-green-700 text-white shadow-green-700/20' 
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {room.status === 'active' ? 'Active' : 'Inactive'}
            </button>
            <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Updated {new Date(room.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="flex items-center gap-8">
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Room {room.roomNumber}</h2>
            <div className="hidden lg:flex flex-wrap gap-3">
               {room.monitoring !== 'None' && <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-4 py-2 rounded-2xl uppercase border border-amber-100/40 shadow-sm">Interval: {room.monitoring}</span>}
               {room.ioRequired && <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-4 py-2 rounded-2xl uppercase border border-blue-100/40 shadow-sm">Strict I&O</span>}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-16 -right-6 text-[220px] font-black text-green-50/20 select-none pointer-events-none group-hover:scale-110 group-hover:-translate-x-4 transition-transform duration-1000 ease-in-out tracking-tighter">
          {room.roomNumber}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-2 space-y-10">
          {/* MEDICAL INFO CARD */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-6">
                <label className="text-[11px] font-black text-green-800/50 uppercase tracking-[0.25em] block pb-3 border-b border-slate-50 flex items-center gap-3">
                  <i className="fas fa-stethoscope text-[10px]"></i> Medical Diagnosis
                </label>
                <textarea 
                  value={room.diagnosis} 
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  className="w-full border-none focus:ring-0 p-0 text-slate-900 font-extrabold text-[22px] leading-tight tracking-tight resize-none bg-transparent placeholder:text-slate-100 outline-none h-28"
                  placeholder="Clinical diagnosis details..." 
                />
              </div>
              <div className="space-y-6">
                <label className="text-[11px] font-black text-green-800/50 uppercase tracking-[0.25em] block pb-3 border-b border-slate-50 flex items-center gap-3">
                  <i className="fas fa-user-md text-[10px]"></i> Physicians
                </label>
                <textarea 
                  value={room.doctors} 
                  onChange={(e) => handleInputChange('doctors', e.target.value)}
                  className="w-full border-none focus:ring-0 p-0 text-slate-900 font-extrabold text-[22px] leading-tight tracking-tight resize-none bg-transparent placeholder:text-slate-100 outline-none h-28"
                  placeholder="Physician and team info..." 
                />
              </div>
            </div>
            {room.diagnosis && (
              <button 
                onClick={handleSmartSuggest}
                disabled={isSuggesting}
                className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-50 px-6 py-3 rounded-2xl hover:bg-green-100 transition-all disabled:opacity-50"
              >
                <i className={`fas ${isSuggesting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                {isSuggesting ? 'Analyzing Diagnosis...' : 'Get Smart Recommendations'}
              </button>
            )}
          </div>

          {/* TASKS CARD */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-5">
                <div className="w-12 h-12 rounded-[1.5rem] bg-green-50 flex items-center justify-center shadow-inner">
                  <i className="fas fa-tasks text-green-800 text-lg"></i>
                </div>
                Shift Tasks
              </h3>
              <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-5 py-2.5 rounded-full uppercase tracking-[0.2em] border border-slate-100/50">
                {room.tasks?.filter(t => t.isCompleted).length || 0} / {room.tasks?.length || 0} Logged
              </div>
            </div>
            
            <form onSubmit={addTask} className="flex gap-5 mb-12">
              <input 
                type="text" 
                value={newTask} 
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Log med, vital, or clinical order..." 
                className="flex-1 bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 py-5.5 focus:border-green-700/30 focus:bg-white focus:ring-[12px] focus:ring-green-700/5 outline-none font-semibold text-[16px] transition-all shadow-inner placeholder:text-slate-200"
              />
              <button type="submit" className="bg-green-700 text-white px-12 py-5.5 rounded-[1.5rem] hover:bg-green-800 shadow-xl shadow-green-700/20 hover:-translate-y-1 transition-all font-black text-[12px] uppercase tracking-widest active:scale-95">
                Add
              </button>
            </form>

            <div className="space-y-4">
              {sortedTasks.length === 0 ? (
                <div className="text-center py-24 bg-slate-50/20 rounded-[2.5rem] border-2 border-dashed border-green-100/60">
                  <p className="text-slate-300 font-black text-[12px] uppercase tracking-[0.25em]">No tasks logged</p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <div key={task.id} className={`flex items-center justify-between p-7 rounded-[1.75rem] border transition-all group ${task.isCompleted ? 'bg-slate-50/50 border-slate-100 shadow-inner' : 'bg-white border-slate-100 hover:border-green-200/50 hover:shadow-lg'}`}>
                    <div className="flex items-center gap-7 flex-1">
                      <div className="relative h-7 w-7">
                        <input 
                          type="checkbox" 
                          checked={task.isCompleted} 
                          onChange={() => handleTaskToggle(task.id)}
                          className="w-7 h-7 rounded-xl text-green-700 border-slate-200 cursor-pointer focus:ring-0 transition-all shadow-sm checked:scale-110"
                        />
                      </div>
                      <div className="flex-1">
                        <p className={`text-[16px] font-bold leading-relaxed tracking-tight ${task.isCompleted ? 'line-through text-slate-300' : 'text-slate-800'}`}>{task.description}</p>
                        {task.isCompleted && (
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] text-green-700 font-black uppercase tracking-widest bg-green-50 px-3 py-1 rounded-lg">Done</span>
                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-tighter">{task.completedAt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="ml-8 w-11 h-11 flex items-center justify-center rounded-2xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 border border-transparent transition-all opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <i className="fas fa-trash-alt text-sm"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/* MONITORING SECTION */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <h3 className="text-[11px] font-black text-green-800/50 mb-8 uppercase tracking-[0.25em] flex items-center gap-4">
              <i className="fas fa-heartbeat"></i> Monitoring
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['None', 'Q1', 'Q2'] as MonitoringInterval[]).map((m) => (
                <button 
                  key={m} 
                  onClick={() => handleInputChange('monitoring', m)}
                  className={`py-5 text-[12px] font-black rounded-2xl transition-all border ${
                    room.monitoring === m 
                      ? 'bg-green-700 text-white border-green-700 shadow-xl shadow-green-700/10' 
                      : 'bg-slate-50/50 text-slate-400 border-slate-100/50 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  {m === 'None' ? 'OFF' : m}
                </button>
              ))}
            </div>
            <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-[14px] font-black text-slate-950 tracking-tight flex items-center gap-3">
                  <i className="fas fa-glass-water text-blue-500 text-[11px]"></i> Strict I&O
                </label>
                <p className="text-[11px] font-bold text-slate-300 uppercase mt-1.5 tracking-wide">Volume Tracking</p>
              </div>
              <div 
                className={`w-16 h-9 rounded-full flex items-center p-1.5 cursor-pointer transition-all duration-400 shadow-inner ${room.ioRequired ? 'bg-green-700' : 'bg-slate-100'}`}
                onClick={() => handleInputChange('ioRequired', !room.ioRequired)}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-xl transform transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${room.ioRequired ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>

          {/* INFUSION SECTION */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <h3 className="text-[11px] font-black text-green-800/50 mb-8 uppercase tracking-[0.25em] flex items-center gap-4">
              <i className="fas fa-tint"></i> Infusion Therapy
            </h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Line</label>
                <div className="relative group">
                   <select 
                    value={room.ivFluid} 
                    onChange={(e) => handleInputChange('ivFluid', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-2xl p-5 text-[15px] font-black text-slate-900 outline-none appearance-none transition-all focus:bg-white focus:ring-[10px] focus:ring-green-700/5 focus:border-green-700/40 shadow-inner"
                  >
                    <option value="">No Active Line</option>
                    {FLUID_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-green-700 transition-colors">
                    <i className="fas fa-chevron-down text-[11px]"></i>
                  </div>
                </div>
              </div>
              
              {room.ivFluid === 'Other' && (
                <input 
                  type="text" 
                  value={room.ivFluidOther} 
                  onChange={(e) => handleInputChange('ivFluidOther', e.target.value)}
                  className="w-full bg-green-50/30 border border-green-100/50 rounded-2xl p-5 text-[14px] font-black outline-none placeholder:text-green-950/20 text-green-950" 
                  placeholder="Solution custom label..."
                />
              )}

              <div className="grid grid-cols-2 gap-5">
                 <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Flow Rate</label>
                   <input 
                    type="text" 
                    value={room.regulation} 
                    onChange={(e) => handleInputChange('regulation', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-2xl p-5 text-[15px] font-black outline-none transition-all focus:bg-white focus:ring-[10px] focus:ring-green-700/5 focus:border-green-700/40 shadow-inner placeholder:text-slate-200" 
                    placeholder="mL/hr"
                   />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Side drip</label>
                   <input 
                    type="text" 
                    value={room.sideDrips} 
                    onChange={(e) => handleInputChange('sideDrips', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-2xl p-5 text-[15px] font-black outline-none transition-all focus:bg-white focus:ring-[10px] focus:ring-green-700/5 focus:border-green-700/40 shadow-inner placeholder:text-slate-200" 
                    placeholder="Meds..."
                   />
                 </div>
              </div>
            </div>
          </div>

          {/* CONTRAPTIONS & PRECAUTIONS SECTION */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-12">
            <div>
              <h3 className="text-[11px] font-black text-green-800/50 mb-8 uppercase tracking-[0.25em] flex items-center gap-4">
                <i className="fas fa-tools"></i> Contraptions
              </h3>
              <div className="flex flex-wrap gap-2.5 mb-6">
                {CONTRAPTION_OPTIONS.map(c => (
                  <button 
                    key={c} 
                    onClick={() => toggleArrayItem('contraptions', c)}
                    className={`px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight border transition-all ${
                      room.contraptions?.includes(c) 
                        ? 'bg-green-700 text-white border-green-700 shadow-lg shadow-green-700/10' 
                        : 'bg-slate-50 text-slate-400 border-slate-100/60 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input 
                type="text" 
                value={room.contraptionsOther} 
                onChange={(e) => handleInputChange('contraptionsOther', e.target.value)}
                className="w-full bg-slate-50 border border-slate-100/60 rounded-2xl p-5 text-[14px] font-black outline-none transition-all focus:bg-white focus:ring-[10px] focus:ring-green-700/5 focus:border-green-700/40 shadow-inner"
                placeholder="Other devices..."
              />
            </div>

            <div className="pt-2">
              <h3 className="text-[11px] font-black text-green-800/50 mb-8 uppercase tracking-[0.25em] flex items-center gap-4">
                <i className="fas fa-shield-alt"></i> Precautions
              </h3>
              <div className="grid grid-cols-1 gap-2 mb-10">
                {COMMON_PRECAUTIONS.map(p => (
                  <label key={p} className="flex items-center gap-5 cursor-pointer group p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <input 
                      type="checkbox" 
                      checked={(room.precautions || []).includes(p)} 
                      onChange={() => toggleArrayItem('precautions', p)}
                      className="w-6 h-6 rounded-lg text-green-700 border-slate-200 focus:ring-0 transition-all"
                    />
                    <span className={`text-[13px] font-extrabold tracking-tight transition-colors ${
                      room.precautions?.includes(p) ? 'text-slate-950' : 'text-slate-300'
                    }`}>
                      {p}
                    </span>
                  </label>
                ))}
              </div>
              <textarea 
                value={room.otherPrecaution} 
                onChange={(e) => handleInputChange('otherPrecaution', e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-[14px] font-semibold leading-relaxed outline-none transition-all focus:bg-white focus:ring-[12px] focus:ring-green-700/5 focus:border-green-700/40 resize-none h-40 shadow-inner"
                placeholder="Specific precautions..." 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDashboard;
