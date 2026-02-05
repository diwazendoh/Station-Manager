
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RoomData, ViewState, Task } from './types';
import { STORAGE_KEY, getInitialRoomData } from './constants';
import Sidebar from './components/Sidebar';
import RoomDashboard from './components/RoomDashboard';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [quickTaskData, setQuickTaskData] = useState({ roomId: '', task: '' });
  const [doctorFilter, setDoctorFilter] = useState('');

  // Initial Load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRooms(parsed);
      } catch (e) {
        console.error("Data Load Error:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Data Persistence
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    }
  }, [rooms, isLoaded]);

  // Priority Sorting Logic
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [rooms]);

  const handleAddRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNum = newRoomNumber.trim();
    if (!cleanNum) return;
    
    if (rooms.some(r => r.roomNumber === cleanNum)) {
      alert(`Room ${cleanNum} is already assigned!`);
      return;
    }

    const newRoom: RoomData = {
      ...getInitialRoomData(),
      id: "rm_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      roomNumber: cleanNum,
      lastUpdated: new Date().toISOString()
    } as RoomData;

    setRooms(prev => [...prev, newRoom]);
    setSelectedRoomId(newRoom.id);
    setCurrentView('room-detail');
    setIsAddRoomModalOpen(false);
    setNewRoomNumber('');
  };

  const updateRoom = (updatedRoom: RoomData) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...updatedRoom, lastUpdated: new Date().toISOString() } : r));
  };

  const toggleTask = (roomId: string, taskId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          tasks: room.tasks.map(t => {
            if (t.id === taskId) {
              const isCompleted = !t.isCompleted;
              return {
                ...t,
                isCompleted,
                completedAt: isCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
              };
            }
            return t;
          })
        };
      }
      return room;
    }));
  };

  const deleteTask = useCallback((taskId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === selectedRoomId) {
        return {
          ...room,
          tasks: room.tasks.filter(t => t.id !== taskId)
        };
      }
      return room;
    }));
  }, [selectedRoomId]);

  const handleQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    const { roomId, task } = quickTaskData;
    if (!roomId || !task.trim()) return;

    const newTask: Task = {
      id: "tk_" + Date.now(),
      description: task.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, tasks: [...r.tasks, newTask] } : r));
    setQuickTaskData({ roomId: '', task: '' });
    setIsQuickTaskModalOpen(false);
  };

  const activeRoom = rooms.find(r => r.id === selectedRoomId);

  const allTasks = useMemo(() => {
    return rooms.flatMap(r => (r.tasks || []).map(t => ({ ...t, roomNumber: r.roomNumber, roomId: r.id })))
                .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [rooms]);

  const filteredDirectory = useMemo(() => {
    if (!doctorFilter.trim()) return sortedRooms;
    return sortedRooms.filter(r => 
      r.doctors.toLowerCase().includes(doctorFilter.toLowerCase()) || 
      r.roomNumber.includes(doctorFilter)
    );
  }, [sortedRooms, doctorFilter]);

  return (
    <div className="flex min-h-screen bg-[#FDFDFD] font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">
      <Sidebar 
        rooms={sortedRooms}
        currentView={currentView}
        selectedRoomId={selectedRoomId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onViewChange={setCurrentView}
        onRoomSelect={(id) => { setSelectedRoomId(id); setCurrentView('room-detail'); }}
        onAddRoom={() => setIsAddRoomModalOpen(true)}
      />

      <main className="flex-1 p-5 md:p-10 overflow-y-auto h-screen max-w-7xl mx-auto w-full">
        <header className="mb-12 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-green-700 hover:bg-green-50 w-11 h-11 rounded-2xl flex items-center justify-center transition-colors">
              <i className="fas fa-bars text-xl"></i>
            </button>
            <div>
              <p className="text-[10px] font-bold text-green-800 uppercase tracking-[0.25em] mb-1 opacity-80">Station Manager</p>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {currentView === 'dashboard' ? 'Shift Overview' : currentView === 'directory' ? 'Room Directory' : activeRoom ? `Room ${activeRoom.roomNumber}` : 'Room Detail'}
              </h2>
            </div>
          </div>
          <button onClick={() => setIsQuickTaskModalOpen(true)} className="bg-green-800 text-white w-12 h-12 rounded-[1.25rem] hover:bg-green-900 shadow-sm hover:shadow-green-700/20 flex items-center justify-center transition-all active:scale-95 group">
            <i className="fas fa-plus text-sm group-hover:scale-110 transition-transform"></i>
          </button>
        </header>

        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-2xl bg-green-50 flex items-center justify-center">
                    <i className="fas fa-door-open text-green-800 text-xs"></i>
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Active Rooms</p>
                </div>
                <h3 className="text-3xl font-black text-green-800">{rooms.filter(r => r.status === 'active').length}</h3>
              </div>
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <i className="fas fa-glass-water text-blue-600 text-xs"></i>
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Strict I&O</p>
                </div>
                <h3 className="text-sm font-bold text-slate-700 leading-relaxed truncate">
                  {sortedRooms.filter(r => r.ioRequired).map(r => r.roomNumber).join(', ') || 'None'}
                </h3>
              </div>
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <i className="fas fa-heartbeat text-amber-600 text-xs"></i>
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Monitoring</p>
                </div>
                <h3 className="text-sm font-bold text-slate-700 leading-relaxed truncate">
                   {sortedRooms.filter(r => r.monitoring !== 'None').map(r => r.roomNumber).join(', ') || 'None'}
                </h3>
              </div>
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center">
                    <i className="fas fa-triangle-exclamation text-rose-600 text-xs"></i>
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Precautions</p>
                </div>
                <h3 className="text-sm font-bold text-rose-600 leading-relaxed truncate">
                   {sortedRooms.filter(r => r.precautions.length > 0 || r.otherPrecaution).map(r => r.roomNumber).join(', ') || 'None'}
                </h3>
              </div>
            </div>

            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-10 py-7 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center gap-4 uppercase text-[12px] tracking-widest">
                  <i className="fas fa-list-ul text-green-800 text-sm"></i> Task Tracker
                </h4>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{allTasks.length} Entries</span>
              </div>
              <div className="divide-y divide-slate-50">
                {allTasks.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                      <i className="fas fa-clipboard text-slate-100 text-3xl"></i>
                    </div>
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-[11px]">No active tasks logged</p>
                  </div>
                ) : (
                  allTasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-7 px-10 py-7 transition-all group ${task.isCompleted ? 'bg-slate-50/40' : 'hover:bg-slate-50/60'}`}>
                      <input 
                        type="checkbox" 
                        checked={task.isCompleted} 
                        onChange={() => toggleTask(task.roomId, task.id)}
                        className="w-6 h-6 rounded-xl text-green-800 border-slate-200 cursor-pointer focus:ring-0 transition-all shadow-sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-bold text-green-900 bg-green-50 px-3 py-1 rounded-lg uppercase tracking-tight">Room {task.roomNumber}</span>
                          <span className="text-[10px] font-medium text-slate-300 uppercase tracking-tighter">
                            {new Date(task.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <span className={`text-[15px] font-semibold leading-relaxed ${task.isCompleted ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                          {task.description}
                        </span>
                      </div>
                      <div className="text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.isCompleted ? (
                          <span className="text-[11px] font-bold text-green-800 bg-green-50 px-4 py-1.5 rounded-full uppercase tracking-tight">Done at {task.completedAt}</span>
                        ) : (
                           <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">Pending</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {currentView === 'directory' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
             <div className="bg-white px-8 py-4 rounded-3xl flex items-center gap-5 border border-slate-100 shadow-sm w-full max-w-2xl focus-within:ring-4 focus-within:ring-green-800/5 transition-all">
               <i className="fas fa-search text-slate-300"></i>
               <input 
                 type="text" 
                 value={doctorFilter}
                 onChange={(e) => setDoctorFilter(e.target.value)}
                 placeholder="Search by Room or Physician..." 
                 className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-semibold text-slate-700 py-1"
               />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDirectory.map(room => (
                <div 
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setCurrentView('room-detail');
                  }}
                  className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-green-400/30 cursor-pointer hover:shadow-xl transition-all shadow-sm group flex flex-col h-full relative ${
                    room.status === 'inactive' ? 'opacity-60 bg-slate-50/50 grayscale-[0.2]' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-4">
                        <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                          {room.roomNumber}
                        </h3>
                        <div className={`w-2.5 h-2.5 rounded-full ${room.status === 'active' ? 'bg-green-800 shadow-[0_0_12px_rgba(20,83,45,0.5)] animate-pulse' : 'bg-slate-200'}`}></div>
                      </div>
                      <div className="flex flex-wrap gap-2.5 mt-5">
                        {room.monitoring !== 'None' && (
                          <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-xl border border-amber-100/30 uppercase tracking-tight">
                            {room.monitoring} Mon
                          </span>
                        )}
                        {room.ioRequired && (
                          <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border border-blue-100/30 uppercase tracking-tight">
                            Strict I&O
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      room.status === 'active' ? 'bg-green-800 text-white shadow-lg shadow-green-900/20' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {room.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="space-y-8 flex-1">
                     <div className="bg-slate-50/30 p-5 rounded-3xl border border-slate-50">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Diagnosis & Team</label>
                       <p className="text-[15px] font-extrabold text-slate-800 line-clamp-2 leading-tight tracking-tight">{room.diagnosis || 'Clinical Update Pending'}</p>
                       <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                         <i className="fas fa-user-doctor text-[11px] text-green-800"></i>
                         <p className="text-[12px] font-semibold text-slate-500 truncate">{room.doctors || 'No team assigned'}</p>
                       </div>
                     </div>

                     {room.ivFluid && (
                       <div className="px-2">
                         <label className="text-[10px] font-black text-blue-700/50 uppercase tracking-[0.2em] block mb-3">Infusion</label>
                         <p className="text-[14px] font-black text-slate-800 flex items-center justify-between">
                           <span className="flex items-center gap-3">
                             <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm"></span>
                             {room.ivFluid === 'Other' ? room.ivFluidOther : room.ivFluid}
                           </span>
                           {room.regulation && <span className="text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded-lg">{room.regulation} mL/hr</span>}
                         </p>
                       </div>
                     )}

                     {(room.contraptions.length > 0 || room.contraptionsOther) && (
                       <div className="px-2">
                         <label className="text-[10px] font-black text-green-800/50 uppercase tracking-[0.2em] block mb-3">Contraptions</label>
                         <div className="flex flex-wrap gap-2">
                           {room.contraptions.map(c => (
                             <span key={c} className="text-[10px] font-black px-3 py-1.5 bg-white text-green-800 rounded-xl uppercase border border-green-100/60 shadow-sm">{c}</span>
                           ))}
                           {room.contraptionsOther && <span key="other" className="text-[10px] font-black px-3 py-1.5 bg-white text-green-800 rounded-xl uppercase border border-green-100/60 shadow-sm">{room.contraptionsOther}</span>}
                         </div>
                       </div>
                     )}

                     {(room.precautions.length > 0 || room.otherPrecaution) && (
                       <div className="px-2">
                         <label className="text-[10px] font-black text-rose-700/50 uppercase tracking-[0.2em] block mb-3">Precautions</label>
                         <div className="flex flex-wrap gap-2">
                           {room.precautions.map(p => (
                             <span key={p} className="text-[10px] font-black px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl uppercase border border-rose-100/30">{p}</span>
                           ))}
                           {room.otherPrecaution && (
                             <span key="other-pre" className="text-[10px] font-black px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl uppercase border border-rose-100/30">{room.otherPrecaution}</span>
                           )}
                         </div>
                       </div>
                     )}
                  </div>
                  
                  <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-300">
                      <i className="far fa-clock text-[11px]"></i>
                      <span className="text-[10px] font-black uppercase tracking-tight">Sync {new Date(room.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-green-800 transition-all group-hover:shadow-lg group-hover:shadow-green-900/20">
                      <i className="fas fa-arrow-right text-slate-200 group-hover:text-white text-xs transition-all group-hover:translate-x-1"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'room-detail' && activeRoom && (
          <RoomDashboard 
            room={activeRoom} 
            onUpdate={updateRoom} 
            onDeleteTask={deleteTask}
          />
        )}
      </main>

      {/* MODALS */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm p-12 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">New Room</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Entry bed or station ID</p>
            </div>
            <form onSubmit={handleAddRoom} className="space-y-10">
              <div className="relative group">
                <input 
                  autoFocus 
                  type="text" 
                  required 
                  value={newRoomNumber} 
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="000"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 text-7xl text-center font-black text-green-950 outline-none focus:bg-white focus:ring-[15px] focus:ring-green-700/5 focus:border-green-700/40 transition-all placeholder:text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-4">
                <button type="submit" className="w-full bg-green-700 text-white py-6 rounded-[1.75rem] font-black shadow-2xl shadow-green-700/30 uppercase text-[12px] tracking-[0.2em] hover:bg-green-800 hover:-translate-y-1 transition-all active:scale-95">Assign Bed</button>
                <button type="button" onClick={() => setIsAddRoomModalOpen(false)} className="w-full py-2 font-black text-slate-300 text-[10px] uppercase tracking-widest hover:text-slate-500 transition-colors">Discard Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuickTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm p-12 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-900 mb-10 uppercase tracking-widest text-center">Rapid Log Entry</h3>
            <form onSubmit={handleQuickTask} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Identity</label>
                 <select 
                  required 
                  value={quickTaskData.roomId} 
                  onChange={(e) => setQuickTaskData({ ...quickTaskData, roomId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-black text-[15px] outline-none focus:bg-white focus:ring-8 focus:ring-green-700/5 focus:border-green-700/40 transition-all appearance-none"
                >
                  <option value="">Select Bed</option>
                  {sortedRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Details</label>
                <textarea 
                  required 
                  rows={4} 
                  value={quickTaskData.task} 
                  onChange={(e) => setQuickTaskData({ ...quickTaskData, task: e.target.value })}
                  placeholder="Order, med, or observation..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 font-semibold text-[16px] outline-none focus:bg-white focus:ring-8 focus:ring-green-700/5 focus:border-green-700/40 transition-all resize-none leading-relaxed"
                />
              </div>
              <div className="pt-4 flex flex-col gap-4">
                <button type="submit" className="w-full bg-green-700 text-white py-6 rounded-2xl font-black shadow-xl shadow-green-700/10 uppercase text-[12px] tracking-[0.2em] hover:bg-green-800 transition-all active:scale-95">Add Log</button>
                <button type="button" onClick={() => setIsQuickTaskModalOpen(false)} className="w-full py-2 font-black text-slate-300 text-[10px] uppercase tracking-widest hover:text-slate-500 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
