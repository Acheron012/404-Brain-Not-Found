import React, { useState, useEffect } from 'react';
import { BatteryFull, BatteryMedium, BatteryLow, Frown, Meh, Smile, Loader2 } from 'lucide-react';
import { Task, Intensity } from '../types';

interface UserStatusWidgetProps {
  onAddTask?: (task: Omit<Task, 'id' | 'status'>) => void;
}

export function UserStatusWidget({ onAddTask }: UserStatusWidgetProps) {
  const [savedHours, setSavedHours] = useState<number>(8);
  const [savedSleep, setSavedSleep] = useState<number>(8);
  const [savedFatigue, setSavedFatigue] = useState<number>(30);
  const [savedEnergy, setSavedEnergy] = useState<number>(70);

  const [hours, setHours] = useState<number>(8);
  const [sleep, setSleep] = useState<number>(8);
  const [fatigue, setFatigue] = useState<number>(30);
  const [energy, setEnergy] = useState<number>(70);

  const [showPrompt, setShowPrompt] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);

  // Mock API data with multiple containers containing arrays of tasks
  const mockTaskLists = [
    {
      id: 'list-1',
      title: 'Rest & Recover',
      description: 'Light tasks for low energy',
      tasks: [
        { name: '15-min Power Nap', description: 'Rest and recover some energy.', intensity: 'Easy' as Intensity },
        { name: 'Hydrate & Stretch', description: 'Drink water and stretch your legs.', intensity: 'Easy' as Intensity },
        { name: 'Inbox Zero', description: 'Organize your emails.', intensity: 'Easy' as Intensity }
      ]
    },
    {
      id: 'list-2',
      title: 'Steady Pace',
      description: 'Balanced mix of tasks',
      tasks: [
        { name: 'Deep Focus Block', description: 'Use your current energy for a 45-min focus block.', intensity: 'Medium' as Intensity },
        { name: 'Code Review', description: 'Review pending pull requests.', intensity: 'Medium' as Intensity },
        { name: 'Update Documentation', description: 'Document recent changes.', intensity: 'Easy' as Intensity },
        { name: 'Team Check-in', description: 'Brief sync with the team.', intensity: 'Easy' as Intensity }
      ]
    },
    {
      id: 'list-3',
      title: 'Deep Work',
      description: 'High intensity task list',
      tasks: [
        { name: 'Feature Implementation', description: 'Build out the new core feature.', intensity: 'Hard' as Intensity },
        { name: 'Architecture Review', description: 'Review system design.', intensity: 'Hard' as Intensity },
        { name: 'Bug Triaging', description: 'Prioritize and fix critical bugs.', intensity: 'Medium' as Intensity },
        { name: 'Client Presentation', description: 'Present progress to stakeholders.', intensity: 'Hard' as Intensity },
        { name: 'Performance Optimization', description: 'Profile and optimize app speed.', intensity: 'Hard' as Intensity },
        { name: 'Deploy to Staging', description: 'Deploy the latest release to staging.', intensity: 'Medium' as Intensity }
      ]
    }
  ];

  useEffect(() => {
    if (
      hours !== savedHours ||
      sleep !== savedSleep ||
      fatigue !== savedFatigue ||
      energy !== savedEnergy
    ) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [hours, sleep, fatigue, energy, savedHours, savedSleep, savedFatigue, savedEnergy]);

  const handleCancelPrompt = () => {
    setHours(savedHours);
    setSleep(savedSleep);
    setFatigue(savedFatigue);
    setEnergy(savedEnergy);
    setShowPrompt(false);
  };

  const handleSave = () => {
    setSavedHours(hours);
    setSavedSleep(sleep);
    setSavedFatigue(fatigue);
    setSavedEnergy(energy);
    setShowPrompt(false);

    setShowSuggestions(true);
    setIsLoadingSuggestions(true);
    
    // Simulate API fetch
    setTimeout(() => {
      setIsLoadingSuggestions(false);
    }, 1500);
  };

  const handleSelectList = (list: any) => {
    setSelectedList(list);
    setShowFinalConfirm(true);
  };

  const handleFinalConfirm = () => {
    if (onAddTask && selectedList) {
      // Add all tasks from the selected container
      selectedList.tasks.forEach((task: any) => {
        onAddTask({
          name: task.name,
          description: task.description,
          deadline: new Date().toISOString().split('T')[0],
          intensity: task.intensity,
        });
      });
    }
    setShowFinalConfirm(false);
    setShowSuggestions(false);
    setSelectedList(null);
  };

  const handleFinalCancel = () => {
    setShowFinalConfirm(false);
  };

  const getEnergyIcon = () => {
    if (energy > 66) return <BatteryFull className="text-[#7FB77E]" size={20} />;
    if (energy > 33) return <BatteryMedium className="text-yellow-500" size={20} />;
    return <BatteryLow className="text-red-400" size={20} />;
  };

  const getFatigueIcon = () => {
    if (fatigue > 66) return <Frown className="text-red-400" size={20} />;
    if (fatigue > 33) return <Meh className="text-yellow-500" size={20} />;
    return <Smile className="text-[#7FB77E]" size={20} />;
  };

  return (
    <div className="bg-[#E3EFE6] p-4 rounded-xl shadow-sm border border-[#BFD8B8] relative">
      <h2 className="text-lg font-bold text-[#2F3E34] mb-3">User Status</h2>
      
      {/* Inline Save Prompt Banner */}
      {showPrompt && (
        <div className="absolute -top-12 left-0 right-0 bg-[#2F3E34] text-white p-3 rounded-lg shadow-xl flex items-center justify-between z-10 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm font-medium">Do you wish to save changes?</span>
          <div className="flex gap-2">
            <button 
              onClick={handleCancelPrompt}
              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded bg-[#7FB77E] hover:bg-[#68a367] transition-colors font-bold"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Top row: Hours and Sleep */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Hours Available
            </label>
            <input 
              type="number" 
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-1.5"
              min="0"
              max="24"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Total Sleep (hrs)
            </label>
            <input 
              type="number" 
              value={sleep}
              onChange={(e) => setSleep(Number(e.target.value))}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-1.5"
              min="0"
              max="24"
            />
          </div>
        </div>

        {/* Bottom row: Fatigue and Energy */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-[#2F3E34]">
                Fatigue
              </label>
              {getFatigueIcon()}
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={fatigue}
              onChange={(e) => setFatigue(Number(e.target.value))}
              className="w-full h-1.5 bg-[#BFD8B8] rounded-lg appearance-none cursor-pointer accent-[#7FB77E]"
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-[#2F3E34]">
                Energy
              </label>
              {getEnergyIcon()}
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full h-1.5 bg-[#BFD8B8] rounded-lg appearance-none cursor-pointer accent-[#7FB77E]"
            />
          </div>
        </div>
      </div>

      {/* Suggestions Modal with Containers */}
      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F3E34]/40 backdrop-blur-sm">
          <div className="bg-[#F4F7F5] rounded-xl shadow-xl border border-[#BFD8B8] w-full max-w-4xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-[#BFD8B8] bg-[#E3EFE6]">
              <h3 className="text-xl font-bold text-[#2F3E34]">Suggested Task Lists</h3>
              <p className="text-sm text-[#2F3E34]/70 mt-1">Based on your current energy and fatigue levels, choose a set of tasks to add to your list.</p>
            </div>
            
            <div className="p-5 min-h-[300px]">
              {isLoadingSuggestions ? (
                <div className="flex flex-col items-center justify-center h-[250px] space-y-4 text-[#7FB77E]">
                  <Loader2 className="animate-spin" size={40} />
                  <p className="text-base font-medium text-[#2F3E34]">Fetching optimal tasks from API...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {mockTaskLists.map((list) => (
                    <div key={list.id} className="bg-white border-2 border-[#BFD8B8] rounded-xl p-4 flex flex-col h-full hover:border-[#7FB77E] transition-all shadow-sm">
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-[#2F3E34]">{list.title}</h4>
                        <p className="text-xs text-[#2F3E34]/70 mt-1 h-8">{list.description}</p>
                        <div className="mt-3 inline-flex items-center justify-center bg-[#E3EFE6] text-[#2F3E34] text-xs font-bold px-2.5 py-1 rounded-full border border-[#BFD8B8]">
                          {list.tasks.length} Tasks
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto max-h-[160px] mb-5 space-y-2 pr-2 custom-scrollbar">
                        {list.tasks.map((task, tIdx) => (
                          <div key={tIdx} className="text-xs flex items-start gap-2 border-b border-[#F4F7F5] pb-2 last:border-0">
                            <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#7FB77E] shrink-0"></span>
                            <span className="text-[#2F3E34]/80 leading-snug">{task.name}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => handleSelectList(list)}
                        className="w-full text-sm bg-[#E3EFE6] text-[#2F3E34] font-bold px-4 py-2.5 rounded-lg border border-[#BFD8B8] hover:bg-[#7FB77E] hover:text-white hover:border-[#7FB77E] transition-all mt-auto"
                      >
                        Choose List
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#BFD8B8] bg-[#E3EFE6] flex justify-end">
              <button 
                onClick={() => setShowSuggestions(false)}
                className="text-sm px-5 py-2 text-[#2F3E34] hover:bg-[#BFD8B8]/30 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirm Modal */}
      {showFinalConfirm && selectedList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2F3E34]/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-[#2F3E34] mb-3">Confirm Task Selection</h3>
              <p className="text-sm text-[#2F3E34]/80 mb-6">
                Are you sure you want to add the <span className="font-bold text-[#7FB77E]">"{selectedList.title}"</span> list containing <span className="font-bold">{selectedList.tasks.length} tasks</span> to your To-Do List?
              </p>
              
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={handleFinalCancel}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#BFD8B8] text-[#2F3E34] hover:bg-[#F4F7F5] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinalConfirm}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#7FB77E] text-white hover:bg-[#68a367] font-medium transition-colors shadow-sm"
                >
                  Save Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
