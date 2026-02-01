'use client';

import React, { useState, useEffect, useRef } from 'react';

// ============================================
// GOODBUDDI - Create a Great Day
// ============================================

// Audio context for timer sounds
const createAudioContext = () => {
  if (typeof window !== 'undefined') {
    return new (window.AudioContext || window.webkitAudioContext)();
  }
  return null;
};

const playTone = (audioContext, frequency, duration, type = 'sine') => {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const playMilestoneTone = (audioContext) => {
  playTone(audioContext, 523.25, 0.15);
  setTimeout(() => playTone(audioContext, 659.25, 0.15), 150);
};

const playCompletionMelody = (audioContext) => {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(audioContext, freq, 0.2), i * 200);
  });
};

// Date utilities
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getDateKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDate = (date) => {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get Monday of current week
const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Parse scratchpad text into structured events
const parseScratchpad = (text) => {
  const lines = text.split('\n');
  const events = [];
  let currentEvent = null;
  let currentActivity = null;

  lines.forEach((line) => {
    if (!line.trim()) return;
    
    const indentMatch = line.match(/^(\t*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const content = line.replace(/^\t*•\s*/, '').replace(/^\t*-\s*/, '').trim();
    
    if (!content) return;

    // Parse time and duration
    const timeMatch = content.match(/@\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
    const durationMatch = content.match(/\*\s*(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|min|mins|minute|minutes)?/i);
    const maybeMatch = content.match(/^maybe:\s*/i);
    
    let title = content
      .replace(/@\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/i, '')
      .replace(/\*\s*\d+(?:\.\d+)?\s*(?:hour|hours|hr|hrs|min|mins|minute|minutes)?/i, '')
      .replace(/^maybe:\s*/i, '')
      .trim();

    const hasBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    
    if (indent === 0 && hasBullet) {
      currentEvent = {
        id: Date.now() + Math.random(),
        title,
        time: timeMatch ? timeMatch[1] : null,
        duration: durationMatch ? `${durationMatch[1]} ${durationMatch[2] || 'hours'}` : null,
        isMaybe: !!maybeMatch,
        activities: [],
        completed: false
      };
      events.push(currentEvent);
      currentActivity = null;
    } else if (indent === 1 && currentEvent && hasBullet) {
      currentActivity = {
        id: Date.now() + Math.random(),
        name: title,
        details: [],
        completed: false
      };
      currentEvent.activities.push(currentActivity);
    } else if (indent === 2 && currentActivity && hasBullet) {
      currentActivity.details.push(title);
    }
  });

  return events;
};

// ============================================
// COMPONENTS
// ============================================

// Billboard Component - Light Up Phrase
const Billboard = ({ phrase, userName, userInitial, onMenuClick, onUserMenuToggle, showUserMenu, onLogout, currentView, onViewChange }) => {
  return (
    <header className="billboard">
      <div className="billboard-top">
        <button className="menu-btn-header" onClick={onMenuClick}>A</button>
        <h1 className="billboard-phrase">{phrase}</h1>
        <div className="user-menu-container">
          <div className="user-avatar" onClick={onUserMenuToggle}>{userInitial}</div>
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-dropdown-name">{userName}</div>
                <div className="user-dropdown-email">{userName.toLowerCase()}@email.com</div>
                <div className="user-dropdown-id">ID: demo-123</div>
              </div>
              <div className="user-dropdown-item">⚙️ Settings</div>
              <div className="user-dropdown-item">📥 Export My Data</div>
              <div className="user-dropdown-item danger" onClick={onLogout}>🚪 Sign Out</div>
            </div>
          )}
        </div>
      </div>
      <nav className="billboard-nav">
        <button 
          className={`billboard-nav-link ${currentView === 'today' ? 'active' : ''}`}
          onClick={() => onViewChange('today')}
        >Today</button>
        <button 
          className={`billboard-nav-link ${currentView === 'week' ? 'active' : ''}`}
          onClick={() => onViewChange('week')}
        >Plan my week</button>
        <button 
          className={`billboard-nav-link ${currentView === 'playbook' ? 'active' : ''}`}
          onClick={() => onViewChange('playbook')}
        >Playbook</button>
      </nav>
    </header>
  );
};

// Navigation Menu Component
const NavMenu = ({ isOpen, onClose, onNavigate, userName }) => {
  const menuItems = [
    { id: 'portal', icon: '◐', label: "Today's Portal" },
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'phrases', icon: '✦', label: '5 Light Up Phrases' },
    { id: 'attention', icon: '🔔', label: 'Attention Center' },
    { id: 'discovery', icon: '🌟', label: 'Discovery Zone' }
  ];

  if (!isOpen) return null;

  return (
    <div className="nav-overlay" onClick={onClose}>
      <nav className="nav-menu" onClick={(e) => e.stopPropagation()}>
        <div className="nav-header">
          <div className="nav-logo">A</div>
          <div>
            <div className="nav-title">GoodBuddi</div>
            <div className="nav-subtitle">Hello, {userName}!</div>
          </div>
        </div>
        <ul className="nav-items">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button 
                className="nav-item"
                onClick={() => { onNavigate(item.id); onClose(); }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

// Profile Modal with Light Up Phrases Management
const ProfileModal = ({ isOpen, onClose, phrases, onPhrasesUpdate, selectedPhraseIndex, onSelectPhrase }) => {
  const [editingPhrases, setEditingPhrases] = useState(phrases);
  
  useEffect(() => {
    setEditingPhrases(phrases);
  }, [phrases]);

  if (!isOpen) return null;

  const handlePhraseChange = (index, value) => {
    const newPhrases = [...editingPhrases];
    newPhrases[index] = value;
    setEditingPhrases(newPhrases);
  };

  const handleAddPhrase = () => {
    if (editingPhrases.length < 10) {
      setEditingPhrases([...editingPhrases, '']);
    }
  };

  const handleRemovePhrase = (index) => {
    if (editingPhrases.length > 1) {
      setEditingPhrases(editingPhrases.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    onPhrasesUpdate(editingPhrases.filter(p => p.trim()));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Light Up Phrases</h2>
        <p className="profile-description">
          Add up to 10 phrases that inspire you. One will be randomly selected each day, or you can choose one below.
        </p>
        
        <div className="phrases-list">
          {editingPhrases.map((phrase, index) => (
            <div key={index} className="phrase-item">
              <input
                type="radio"
                name="selectedPhrase"
                checked={selectedPhraseIndex === index}
                onChange={() => onSelectPhrase(index)}
              />
              <input
                type="text"
                value={phrase}
                onChange={(e) => handlePhraseChange(index, e.target.value)}
                placeholder={`Phrase ${index + 1}`}
                className="phrase-input"
              />
              {editingPhrases.length > 1 && (
                <button className="phrase-remove" onClick={() => handleRemovePhrase(index)}>×</button>
              )}
            </div>
          ))}
        </div>
        
        {editingPhrases.length < 10 && (
          <button className="add-phrase-btn" onClick={handleAddPhrase}>+ Add Phrase</button>
        )}
        
        <div className="profile-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Phrases</button>
        </div>
      </div>
    </div>
  );
};

// Event Card Component for Portal
const EventCard = ({ event, onClick }) => {
  const completedActivities = event.activities.filter(a => a.completed).length;
  const totalActivities = event.activities.length;

  const getEventType = () => {
    if (event.isMaybe) return 'maybe';
    if (event.time) return 'timed';
    return 'flexible';
  };

  return (
    <div className={`event-card ${event.completed ? 'completed' : ''}`} onClick={() => onClick(event)}>
      <div className={`event-type-indicator ${getEventType()}`} />
      <div className="event-header">
        <span className="event-title">{event.title}</span>
        <span className="event-meta">
          {event.time && <span className="event-time">{event.time}</span>}
          {event.duration && <span className="event-duration"> • {event.duration}</span>}
        </span>
      </div>
      {totalActivities > 0 && (
        <div className="activities-list">
          {event.activities.map((activity, i) => (
            <div key={i} className={`activity-row ${activity.completed ? 'completed' : ''}`}>
              <span className={`activity-checkbox ${activity.completed ? 'checked' : ''}`} />
              <span>{activity.name}</span>
              {activity.details.length > 0 && (
                <div className="sub-activities">
                  {activity.details.map((detail, j) => (
                    <div key={j} className="sub-activity">○ {detail}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="activity-progress">
            {completedActivities}/{totalActivities} completed
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Viewer Modal Component
const ActivityViewer = ({ event, onClose, onActivityComplete, onActivitySkip }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [milestonesPassed, setMilestonesPassed] = useState({ 50: false, 75: false, 90: false });
  const audioContextRef = useRef(null);

  const timerPresets = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];
  
  const currentActivity = event.activities[currentIndex];

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const newValue = prev - 1;
          const percentComplete = ((timerDuration - newValue) / timerDuration) * 100;
          
          if (percentComplete >= 50 && !milestonesPassed[50]) {
            playMilestoneTone(audioContextRef.current);
            setMilestonesPassed(m => ({ ...m, 50: true }));
          }
          if (percentComplete >= 75 && !milestonesPassed[75]) {
            playMilestoneTone(audioContextRef.current);
            setMilestonesPassed(m => ({ ...m, 75: true }));
          }
          if (percentComplete >= 90 && !milestonesPassed[90]) {
            playMilestoneTone(audioContextRef.current);
            setMilestonesPassed(m => ({ ...m, 90: true }));
          }
          
          if (newValue <= 0) {
            setTimerRunning(false);
            playCompletionMelody(audioContextRef.current);
            setShowCompletion(true);
          }
          
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerDuration, milestonesPassed]);

  const handleTimerSelect = (e) => {
    const minutes = parseInt(e.target.value);
    if (minutes > 0) {
      const seconds = minutes * 60;
      setTimerDuration(seconds);
      setTimerSeconds(seconds);
      setTimerRunning(false);
      setMilestonesPassed({ 50: false, 75: false, 90: false });
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
  };

  const getTimerClass = () => {
    if (timerDuration === 0) return '';
    const percentRemaining = (timerSeconds / timerDuration) * 100;
    if (percentRemaining <= 10) return 'critical';
    if (percentRemaining <= 25) return 'warning';
    return timerRunning ? 'running' : '';
  };

  const getProgressWidth = () => {
    if (timerDuration === 0) return 0;
    return ((timerDuration - timerSeconds) / timerDuration) * 100;
  };

  const handleComplete = () => {
    onActivityComplete(event.id, currentActivity.id);
    if (currentIndex < event.activities.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimerSeconds(0);
      setTimerRunning(false);
      setShowCompletion(false);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onActivitySkip(event.id, currentActivity.id);
    if (currentIndex < event.activities.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimerSeconds(0);
      setTimerRunning(false);
    } else {
      onClose();
    }
  };

  if (!currentActivity) return null;

  const allDone = event.activities.every(a => a.completed);

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{event.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="activity-nav">
            {event.activities.map((_, i) => (
              <span 
                key={i} 
                className={`activity-dot ${i === currentIndex ? 'active' : ''} ${event.activities[i].completed ? 'completed' : ''}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>

          <div className="current-activity">
            <div className="current-activity-name">{currentActivity.name}</div>
            {currentActivity.details.length > 0 && (
              <div className="current-activity-detail">
                {currentActivity.details.join(' • ')}
              </div>
            )}

            <div className="timer-section-compact">
              <div className="timer-row">
                <select className="timer-dropdown" onChange={handleTimerSelect} value="">
                  <option value="">Set timer...</option>
                  {timerPresets.map(preset => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                </select>
                <span className={`timer-display-compact ${getTimerClass()}`}>
                  {formatTime(timerSeconds)}
                </span>
                <div className="timer-controls-compact">
                  <button 
                    className={`timer-btn-compact ${timerRunning ? 'pause' : 'start'}`}
                    onClick={() => setTimerRunning(!timerRunning)}
                    disabled={timerSeconds === 0}
                  >
                    {timerRunning ? '⏸' : '▶'}
                  </button>
                  <button 
                    className="timer-btn-compact reset"
                    onClick={() => { setTimerSeconds(0); setTimerRunning(false); setTimerDuration(0); }}
                  >
                    ↺
                  </button>
                </div>
              </div>
              {timerDuration > 0 && (
                <div className="timer-progress">
                  <div 
                    className={`timer-progress-bar ${getTimerClass()}`}
                    style={{ width: `${getProgressWidth()}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {showCompletion && (
            <div className="timer-complete-popup-inline">
              <p>🎉 Keep your momentum going!</p>
              <p className="completion-subtext">Move to the next activity or reset the timer.</p>
            </div>
          )}

          <div className="modal-actions">
            {allDone ? (
              <button className="modal-btn finish" onClick={onClose}>Finish ✓</button>
            ) : (
              <>
                <button className="modal-btn skip" onClick={handleSkip}>Next (skip)</button>
                <button className="modal-btn complete" onClick={handleComplete}>Complete</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// End Day Modal Component
const EndDayModal = ({ events, onClose, onSave }) => {
  const [excitement, setExcitement] = useState('');

  const completedItems = [];
  events.forEach(event => {
    event.activities.forEach(activity => {
      if (activity.completed) {
        completedItems.push(`✓ ${activity.name}`);
      }
    });
  });

  return (
    <div className="end-day-view active">
      <div className="end-day-header">
        <h2>End of Day</h2>
      </div>

      <div className="reflection-card">
        <div className="reflection-label">Completed Today</div>
        <div className="completed-list">
          {completedItems.length > 0 
            ? completedItems.map((item, i) => <div key={i} style={{padding: '4px 0'}}>{item}</div>)
            : <div style={{color: '#999'}}>No activities completed yet</div>
          }
        </div>
      </div>

      <div className="reflection-card">
        <div className="reflection-label">What was exciting about your day?</div>
        <textarea 
          className="reflection-textarea"
          value={excitement}
          onChange={(e) => setExcitement(e.target.value)}
          placeholder="Share what made today special..."
        />
      </div>

      <div className="end-day-actions">
        <button className="back-btn" onClick={onClose}>Back</button>
        <button className="save-btn" onClick={() => onSave({ excitement })}>Save & Close</button>
      </div>
    </div>
  );
};

// Scratchpad Component
const Scratchpad = ({ value, onChange, onSetForToday, hasChanges, currentDate, onDateChange }) => {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd, value } = textarea;
    
    const beforeCursor = value.substring(0, selectionStart);
    const afterCursor = value.substring(selectionEnd);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineEnd = afterCursor.indexOf('\n');
    const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : selectionEnd + lineEnd);
    
    const tabMatch = currentLine.match(/^(\t*)/);
    const currentIndent = tabMatch ? tabMatch[1].length : 0;

    if (e.key === '-') {
      e.preventDefault();
      const textBeforeCursor = value.substring(lineStart, selectionStart);
      const isStartOfContent = /^\t*$/.test(textBeforeCursor);
      
      if (isStartOfContent || currentLine.trim() === '') {
        const indent = '\t'.repeat(currentIndent);
        const bullet = '• ';
        const insertPos = lineStart + currentIndent;
        const newValue = value.substring(0, insertPos) + bullet + value.substring(selectionStart);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = insertPos + bullet.length;
        }, 0);
      } else {
        const newValue = value.substring(0, selectionStart) + '-' + value.substring(selectionEnd);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const hasBullet = /^(\t*)• /.test(currentLine);
      
      if (e.shiftKey) {
        if (currentIndent > 0) {
          const newIndent = '\t'.repeat(currentIndent - 1);
          const lineContent = currentLine.replace(/^\t*/, '');
          const beforeLine = value.substring(0, lineStart);
          const afterLine = value.substring(lineEnd === -1 ? value.length : selectionEnd + lineEnd);
          const newValue = beforeLine + newIndent + lineContent + afterLine;
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, selectionStart - 1);
          }, 0);
        }
      } else {
        if (hasBullet && currentIndent < 2) {
          const newIndent = '\t'.repeat(currentIndent + 1);
          const lineContent = currentLine.replace(/^\t*/, '');
          const beforeLine = value.substring(0, lineStart);
          const afterLine = value.substring(lineEnd === -1 ? value.length : selectionEnd + lineEnd);
          const newValue = beforeLine + newIndent + lineContent + afterLine;
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
          }, 0);
        }
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const bulletMatch = currentLine.match(/^(\t*)(• )(.*)/);
      
      if (bulletMatch) {
        const indent = bulletMatch[1];
        const content = bulletMatch[3];
        
        if (content.trim() === '') {
          if (currentIndent > 0) {
            const newIndent = '\t'.repeat(currentIndent - 1);
            const beforeLine = value.substring(0, lineStart);
            const afterLine = value.substring(lineEnd === -1 ? value.length : selectionEnd + lineEnd);
            const newValue = beforeLine + newIndent + '• ' + afterLine;
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStart + newIndent.length + 2;
            }, 0);
          } else {
            const beforeLine = value.substring(0, lineStart);
            const afterLine = value.substring(lineEnd === -1 ? value.length : selectionEnd + lineEnd);
            const newValue = beforeLine + afterLine;
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStart;
            }, 0);
          }
        } else {
          const newLine = '\n' + indent + '• ';
          const newValue = value.substring(0, selectionStart) + newLine + value.substring(selectionEnd);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + newLine.length;
          }, 0);
        }
      } else {
        const newValue = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      }
      return;
    }
  };

  const prevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  return (
    <section className="scratchpad">
      <div className="scratchpad-header">
        <span className="scratchpad-title">What&apos;s Good Today?</span>
        {hasChanges && <span className="unsaved-indicator">● unsaved</span>}
      </div>

      <div className="scratchpad-editor">
        <div className="editor-toolbar">
          <div className="day-nav">
            <button onClick={prevDay}>◀</button>
            <span className="day-display">{dayNames[currentDate.getDay()]}</span>
            <button onClick={nextDay}>▶</button>
          </div>
        </div>

        <div className="editor-content">
          <div className="syntax-hint">
            <code>-</code> bullet • <code>Tab</code> indent • Syntax: <code>Event @ time *duration</code>
          </div>
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Press - to start adding events..."
            spellCheck={false}
          />
        </div>

        <div className="scratchpad-footer">
          <button className="set-today-btn" onClick={onSetForToday}>Set for Today</button>
        </div>
      </div>
    </section>
  );
};

// Portal Component
const Portal = ({ date, events, onEventClick, onEndDay }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <section className="portal">
      <div className="portal-header">
        <div>
          <h2 className="portal-day">{dayNames[date.getDay()]}</h2>
          <div className="portal-date">{formatDate(date)}</div>
        </div>
        <div className="portal-time">Time now: <strong>{formatCurrentTime()}</strong></div>
      </div>

      <div className="portal-content">
        {events.length === 0 ? (
          <div className="empty-state">
            Add events in the Scratchpad and press &quot;Set for Today&quot; →
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={onEventClick}
            />
          ))
        )}
      </div>

      <div className="portal-footer">
        <button className="end-day-btn" onClick={onEndDay}>end day</button>
      </div>
    </section>
  );
};

// Week View Component
const WeekView = ({ weekStartDate, calendarData, onWeekChange, onDaySelect, selectedDay, scratchpadText, onScratchpadChange, onSave }) => {
  const textareaRef = useRef(null);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    days.push(date);
  }

  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatWeekRange = () => {
    const startMonth = monthNames[weekStartDate.getMonth()].substring(0, 3);
    const endMonth = monthNames[weekEnd.getMonth()].substring(0, 3);
    return `${startMonth} ${weekStartDate.getDate()} - ${endMonth} ${weekEnd.getDate()}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getEventPreview = (date) => {
    const key = getDateKey(date);
    const data = calendarData[key];
    if (!data?.events?.length) return null;
    return data.events.map(e => e.title).slice(0, 3);
  };

  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const { selectionStart, selectionEnd, value } = textarea;
    const beforeCursor = value.substring(0, selectionStart);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
    const tabMatch = currentLine.match(/^(\t*)/);
    const currentIndent = tabMatch ? tabMatch[1].length : 0;

    if (e.key === '-') {
      e.preventDefault();
      const textBeforeCursor = value.substring(lineStart, selectionStart);
      const isStartOfContent = /^\t*$/.test(textBeforeCursor);
      
      if (isStartOfContent || currentLine.trim() === '') {
        const indent = '\t'.repeat(currentIndent);
        const bullet = '• ';
        const insertPos = lineStart + currentIndent;
        const newValue = value.substring(0, insertPos) + bullet + value.substring(selectionStart);
        onScratchpadChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = insertPos + bullet.length;
        }, 0);
      } else {
        const newValue = value.substring(0, selectionStart) + '-' + value.substring(selectionEnd);
        onScratchpadChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      }
    }
  };

  return (
    <div className="week-view-container active">
      <div className="week-planner">
        <div className="week-planner-header">
          <h2>Plan your week</h2>
          <div className="week-nav">
            <button className="week-nav-btn" onClick={() => onWeekChange(-1)}>◀</button>
            <span className="week-range">{formatWeekRange()}</span>
            <button className="week-nav-btn" onClick={() => onWeekChange(1)}>▶</button>
          </div>
        </div>

        <div className="week-grid">
          {days.slice(0, 3).map((date, i) => {
            const preview = getEventPreview(date);
            const isSelected = selectedDay && date.toDateString() === selectedDay.toDateString();
            return (
              <div 
                key={i}
                className={`day-card ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => onDaySelect(date)}
              >
                <div className="day-card-header">{dayNames[date.getDay()]}</div>
                <div className="day-card-date">{monthNames[date.getMonth()]} {date.getDate()}</div>
                {preview && (
                  <div className="day-card-preview">
                    {preview.map((title, j) => (
                      <div key={j} className="preview-event">• {title}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="week-grid-bottom">
          {days.slice(3, 5).map((date, i) => {
            const preview = getEventPreview(date);
            const isSelected = selectedDay && date.toDateString() === selectedDay.toDateString();
            return (
              <div 
                key={i}
                className={`day-card ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => onDaySelect(date)}
              >
                <div className="day-card-header">{dayNames[date.getDay()]}</div>
                <div className="day-card-date">{monthNames[date.getMonth()]} {date.getDate()}</div>
                {preview && (
                  <div className="day-card-preview">
                    {preview.map((title, j) => (
                      <div key={j} className="preview-event">• {title}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="week-grid-bottom" style={{marginTop: '16px'}}>
          {days.slice(5, 7).map((date, i) => {
            const preview = getEventPreview(date);
            const isSelected = selectedDay && date.toDateString() === selectedDay.toDateString();
            return (
              <div 
                key={i}
                className={`day-card ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => onDaySelect(date)}
              >
                <div className="day-card-header">{dayNames[date.getDay()]}</div>
                <div className="day-card-date">{monthNames[date.getMonth()]} {date.getDate()}</div>
                {preview && (
                  <div className="day-card-preview">
                    {preview.map((title, j) => (
                      <div key={j} className="preview-event">• {title}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="week-scratchpad">
        <div className="week-scratchpad-header">
          <h3>What&apos;s Good Today?</h3>
          <div className="week-scratchpad-day">
            {selectedDay ? `${dayNames[selectedDay.getDay()]}, ${formatDate(selectedDay)}` : 'Select a day'}
          </div>
        </div>
        <div className="week-scratchpad-editor">
          <textarea
            ref={textareaRef}
            className="week-scratchpad-textarea"
            value={scratchpadText}
            onChange={(e) => onScratchpadChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDay ? "Press - to start adding events..." : "Select a day to plan..."}
            disabled={!selectedDay}
          />
          <div className="week-scratchpad-footer">
            <button className="week-save-btn" onClick={onSave} disabled={!selectedDay}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Playbook Component
const PlaybookView = () => {
  return (
    <div className="playbook-container active">
      <div className="playbook-sidebar">
        <div className="playbook-tabs">
          <button className="playbook-tab active">Event Cards</button>
          <button className="playbook-tab">Activities</button>
        </div>
        <div className="playbook-list">
          <div className="playbook-empty-state">No event cards yet. Click + to create one.</div>
        </div>
      </div>
      <div className="playbook-detail">
        <div className="playbook-detail-header">
          <span className="playbook-detail-title">Activities</span>
        </div>
        <div className="playbook-detail-content">
          <div className="playbook-empty-state">Select an item to view details</div>
        </div>
      </div>
    </div>
  );
};

// Auth Screen Component
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(firstName || email.split('@')[0] || 'User');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>GoodBuddi</h1>
          <p>Create a great day, every day</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >Sign In</button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >Sign Up</button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-btn">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          By continuing, you agree to GoodBuddi&apos;s Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function GoodBuddi() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentView, setCurrentView] = useState('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scratchpadText, setScratchpadText] = useState('');
  const [events, setEvents] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEndDay, setShowEndDay] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const [lightUpPhrases, setLightUpPhrases] = useState([
    "Let's get it poppin!",
    "Today is your canvas. Paint it with intention.",
    "Small steps create great journeys.",
    "You have everything you need right now.",
    "Energy flows where attention goes."
  ]);
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState(null);
  const [dailyPhrase, setDailyPhrase] = useState('');

  const [weekStartDate, setWeekStartDate] = useState(getMondayOfWeek(new Date()));
  const [selectedWeekDay, setSelectedWeekDay] = useState(null);
  const [weekScratchpadText, setWeekScratchpadText] = useState('');

  useEffect(() => {
    if (selectedPhraseIndex !== null && lightUpPhrases[selectedPhraseIndex]) {
      setDailyPhrase(lightUpPhrases[selectedPhraseIndex]);
    } else if (lightUpPhrases.length > 0) {
      const randomIndex = Math.floor(Math.random() * lightUpPhrases.length);
      setDailyPhrase(lightUpPhrases[randomIndex]);
    }
  }, [lightUpPhrases, selectedPhraseIndex]);

  useEffect(() => {
    const key = getDateKey(currentDate);
    const data = calendarData[key];
    if (data) {
      setScratchpadText(data.scratchpadText || '');
      setEvents(data.events || []);
    } else {
      setScratchpadText('');
      setEvents([]);
    }
    setHasUnsavedChanges(false);
  }, [currentDate, calendarData]);

  useEffect(() => {
    if (selectedWeekDay) {
      const key = getDateKey(selectedWeekDay);
      const data = calendarData[key];
      setWeekScratchpadText(data?.scratchpadText || '');
    }
  }, [selectedWeekDay, calendarData]);

  const handleLogin = (name) => {
    setUserName(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setShowUserMenu(false);
  };

  const handleScratchpadChange = (text) => {
    setScratchpadText(text);
    setHasUnsavedChanges(true);
  };

  const handleSetForToday = () => {
    const parsed = parseScratchpad(scratchpadText);
    setEvents(parsed);
    const key = getDateKey(currentDate);
    setCalendarData(prev => ({
      ...prev,
      [key]: { scratchpadText, events: parsed }
    }));
    setHasUnsavedChanges(false);
  };

  const handleActivityComplete = (eventId, activityId) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const updatedActivities = event.activities.map(a => 
          a.id === activityId ? { ...a, completed: true } : a
        );
        const allComplete = updatedActivities.every(a => a.completed);
        return { ...event, activities: updatedActivities, completed: allComplete };
      }
      return event;
    }));
  };

  const handleActivitySkip = (eventId, activityId) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          activities: event.activities.map(a => 
            a.id === activityId ? { ...a, skipped: true } : a
          )
        };
      }
      return event;
    }));
  };

  const handleSaveReflections = (reflections) => {
    console.log('Reflections saved:', reflections);
    setShowEndDay(false);
  };

  const handleNavigate = (destination) => {
    if (destination === 'portal') {
      setCurrentView('today');
    } else if (destination === 'phrases' || destination === 'profile') {
      setShowProfile(true);
    }
    setShowNav(false);
  };

  const handleWeekChange = (direction) => {
    const newStart = new Date(weekStartDate);
    newStart.setDate(newStart.getDate() + (direction * 7));
    setWeekStartDate(newStart);
    setSelectedWeekDay(null);
    setWeekScratchpadText('');
  };

  const handleWeekDaySelect = (date) => {
    setSelectedWeekDay(date);
  };

  const handleWeekSave = () => {
    if (!selectedWeekDay) return;
    const key = getDateKey(selectedWeekDay);
    const parsed = parseScratchpad(weekScratchpadText);
    setCalendarData(prev => ({
      ...prev,
      [key]: { scratchpadText: weekScratchpadText, events: parsed }
    }));
  };

  if (!isLoggedIn) {
    return (
      <>
        <style>{styles}</style>
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  if (showEndDay) {
    return (
      <>
        <style>{styles}</style>
        <EndDayModal
          events={events}
          onClose={() => setShowEndDay(false)}
          onSave={handleSaveReflections}
        />
      </>
    );
  }

  return (
    <div className="goodbuddi-app">
      <style>{styles}</style>

      <Billboard 
        phrase={dailyPhrase}
        userName={userName}
        userInitial={userName.charAt(0).toUpperCase()}
        onMenuClick={() => setShowNav(true)}
        onUserMenuToggle={() => setShowUserMenu(!showUserMenu)}
        showUserMenu={showUserMenu}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {currentView === 'today' && (
        <main className="main-container">
          <Portal
            date={currentDate}
            events={events}
            onEventClick={setSelectedEvent}
            onEndDay={() => setShowEndDay(true)}
          />
          
          <Scratchpad
            value={scratchpadText}
            onChange={handleScratchpadChange}
            onSetForToday={handleSetForToday}
            hasChanges={hasUnsavedChanges}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        </main>
      )}

      {currentView === 'week' && (
        <WeekView
          weekStartDate={weekStartDate}
          calendarData={calendarData}
          onWeekChange={handleWeekChange}
          onDaySelect={handleWeekDaySelect}
          selectedDay={selectedWeekDay}
          scratchpadText={weekScratchpadText}
          onScratchpadChange={setWeekScratchpadText}
          onSave={handleWeekSave}
        />
      )}

      {currentView === 'playbook' && <PlaybookView />}

      <NavMenu 
        isOpen={showNav}
        onClose={() => setShowNav(false)}
        onNavigate={handleNavigate}
        userName={userName}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        phrases={lightUpPhrases}
        onPhrasesUpdate={setLightUpPhrases}
        selectedPhraseIndex={selectedPhraseIndex}
        onSelectPhrase={setSelectedPhraseIndex}
      />

      {selectedEvent && (
        <ActivityViewer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onActivityComplete={handleActivityComplete}
          onActivitySkip={handleActivitySkip}
        />
      )}
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    color: #333;
    min-height: 100vh;
  }

  .goodbuddi-app {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  }

  .auth-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    padding: 48px;
    width: 100%;
    max-width: 420px;
    margin: 20px;
  }

  .auth-logo {
    text-align: center;
    margin-bottom: 32px;
  }

  .auth-logo h1 {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .auth-logo p {
    color: #666;
    font-size: 14px;
  }

  .auth-tabs {
    display: flex;
    border-bottom: 1px solid #ddd;
    margin-bottom: 24px;
  }

  .auth-tab {
    flex: 1;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    font-weight: 500;
    font-size: 16px;
    color: #666;
  }

  .auth-tab.active {
    color: #333;
    border-bottom-color: #333;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 14px;
  }

  .form-group input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
  }

  .form-group input:focus {
    outline: none;
    border-color: #333;
  }

  .auth-btn {
    width: 100%;
    padding: 16px;
    background: #333;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .auth-btn:hover {
    background: #444;
  }

  .auth-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: #666;
  }

  .billboard {
    background: #e0e0e0;
    padding: 24px 24px 12px 24px;
    text-align: center;
  }

  .billboard-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .menu-btn-header {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #333;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
  }

  .menu-btn-header:hover {
    background: #333;
    color: #fff;
  }

  .billboard-phrase {
    font-size: 24px;
    font-weight: bold;
    flex: 1;
    text-align: center;
  }

  .user-menu-container {
    position: relative;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #333;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
  }

  .user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    min-width: 200px;
    z-index: 100;
    margin-top: 8px;
  }

  .user-dropdown-header {
    padding: 16px;
    border-bottom: 1px solid #eee;
  }

  .user-dropdown-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .user-dropdown-email {
    font-size: 14px;
    color: #666;
  }

  .user-dropdown-id {
    font-size: 11px;
    color: #999;
    margin-top: 4px;
  }

  .user-dropdown-item {
    padding: 12px 16px;
    cursor: pointer;
    font-size: 14px;
  }

  .user-dropdown-item:hover {
    background: #f5f5f5;
  }

  .user-dropdown-item.danger {
    color: #f44336;
  }

  .billboard-nav {
    display: flex;
    gap: 24px;
    justify-content: center;
    margin-top: 16px;
  }

  .billboard-nav-link {
    font-size: 14px;
    color: #333;
    padding: 8px 4px;
    cursor: pointer;
    border: none;
    background: none;
    position: relative;
  }

  .billboard-nav-link:hover {
    color: #000;
  }

  .billboard-nav-link.active {
    font-weight: 600;
  }

  .billboard-nav-link.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #333;
  }

  .main-container {
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    gap: 20px;
    min-height: calc(100vh - 120px);
  }

  .portal {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .portal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 0 8px;
  }

  .portal-day {
    font-size: 36px;
    font-weight: bold;
  }

  .portal-date {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
  }

  .portal-time {
    font-size: 14px;
    color: #666;
  }

  .portal-content {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #999;
  }

  .portal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ddd;
  }

  .end-day-btn {
    background: #fff;
    border: 1px solid #333;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    text-decoration: underline;
  }

  .end-day-btn:hover {
    background: #333;
    color: #fff;
  }

  .event-card {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    position: relative;
    padding-left: 24px;
  }

  .event-card:hover {
    background: #eee;
    border-color: #999;
  }

  .event-card.completed {
    opacity: 0.6;
  }

  .event-type-indicator {
    position: absolute;
    left: -8px;
    top: 16px;
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }

  .event-type-indicator.timed { background: #ff9800; }
  .event-type-indicator.flexible { background: #9c27b0; }
  .event-type-indicator.maybe { background: #666; }

  .event-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .event-title {
    font-size: 16px;
    font-weight: bold;
    text-decoration: underline;
  }

  .event-meta {
    font-size: 12px;
    color: #666;
  }

  .activities-list {
    margin-left: 8px;
    font-size: 14px;
    color: #555;
  }

  .activity-row {
    padding: 4px 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  .activity-row.completed {
    text-decoration: line-through;
    color: #999;
  }

  .activity-checkbox {
    width: 14px;
    height: 14px;
    border: 1px solid #999;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 3px;
  }

  .activity-checkbox.checked {
    background: #333;
    border-color: #333;
  }

  .sub-activities {
    width: 100%;
    margin-left: 22px;
  }

  .sub-activity {
    font-size: 13px;
    color: #777;
    padding: 2px 0;
  }

  .activity-progress {
    font-size: 12px;
    color: #888;
    margin-top: 8px;
    text-align: right;
  }

  .scratchpad {
    width: 420px;
    display: flex;
    flex-direction: column;
  }

  .scratchpad-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    padding: 0 8px;
  }

  .scratchpad-title {
    font-size: 18px;
    font-weight: bold;
  }

  .unsaved-indicator {
    color: #ff9800;
    font-size: 12px;
  }

  .scratchpad-editor {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .editor-toolbar {
    padding: 12px 16px;
    border-bottom: 1px solid #ddd;
    background: #f9f9f9;
  }

  .day-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }

  .day-nav button {
    background: #fff;
    border: 1px solid #ccc;
    font-size: 16px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 4px;
  }

  .day-nav button:hover {
    background: #eee;
  }

  .day-nav .day-display {
    font-weight: bold;
    min-width: 100px;
    text-align: center;
  }

  .editor-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .syntax-hint {
    padding: 10px 16px;
    background: #f9f9f9;
    border-bottom: 1px solid #eee;
    font-size: 11px;
    color: #888;
  }

  .syntax-hint code {
    background: #fff;
    padding: 2px 6px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-family: monospace;
  }

  .editor-textarea {
    width: 100%;
    flex: 1;
    min-height: 350px;
    border: none;
    outline: none;
    padding: 16px;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.8;
    resize: none;
    tab-size: 2;
  }

  .editor-textarea::placeholder {
    color: #bbb;
  }

  .scratchpad-footer {
    padding: 12px 16px;
    border-top: 1px solid #ddd;
    text-align: center;
  }

  .set-today-btn {
    background: #ff9800;
    color: #fff;
    border: none;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 4px;
  }

  .set-today-btn:hover {
    background: #e68a00;
  }

  .nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
  }

  .nav-menu {
    position: absolute;
    top: 20px;
    left: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    width: 280px;
    overflow: hidden;
  }

  .nav-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: #f5f5f5;
    border-bottom: 1px solid #eee;
  }

  .nav-logo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #333;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
  }

  .nav-title {
    font-weight: bold;
    font-size: 18px;
  }

  .nav-subtitle {
    font-size: 13px;
    color: #666;
  }

  .nav-items {
    list-style: none;
    padding: 8px 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 20px;
    background: none;
    border: none;
    font-size: 15px;
    cursor: pointer;
    text-align: left;
  }

  .nav-item:hover {
    background: #f5f5f5;
  }

  .nav-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-overlay.active {
    display: flex;
  }

  .activity-modal {
    background: #fff;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    overflow: hidden;
  }

  .modal-header {
    background: #e0e0e0;
    padding: 20px;
    text-align: center;
    position: relative;
  }

  .modal-title {
    font-size: 20px;
    font-weight: bold;
  }

  .modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }

  .modal-content {
    padding: 24px;
  }

  .activity-nav {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .activity-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ddd;
    cursor: pointer;
  }

  .activity-dot.active {
    background: #333;
  }

  .activity-dot.completed {
    background: #4caf50;
  }

  .current-activity {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    margin-bottom: 20px;
  }

  .current-activity-name {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .current-activity-detail {
    font-size: 14px;
    color: #666;
    margin-bottom: 16px;
  }

  .timer-section-compact {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ddd;
  }

  .timer-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .timer-dropdown {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: #fff;
  }

  .timer-display-compact {
    font-size: 24px;
    font-weight: bold;
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    min-width: 70px;
    text-align: center;
  }

  .timer-display-compact.running {
    color: #4caf50;
  }

  .timer-display-compact.warning {
    color: #ff9800;
  }

  .timer-display-compact.critical {
    color: #f44336;
  }

  .timer-controls-compact {
    display: flex;
    gap: 6px;
  }

  .timer-btn-compact {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid #ddd;
    background: #fff;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer-btn-compact:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .timer-btn-compact:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .timer-btn-compact.start {
    background: #4caf50;
    color: #fff;
    border-color: #4caf50;
  }

  .timer-btn-compact.pause {
    background: #ff9800;
    color: #fff;
    border-color: #ff9800;
  }

  .timer-progress {
    width: 100%;
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 12px;
  }

  .timer-progress-bar {
    height: 100%;
    background: #4caf50;
    border-radius: 3px;
    transition: width 1s linear, background-color 0.3s;
  }

  .timer-progress-bar.warning {
    background: #ff9800;
  }

  .timer-progress-bar.critical {
    background: #f44336;
  }

  .timer-complete-popup-inline {
    background: #e8f5e9;
    border: 1px solid #4caf50;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    margin-bottom: 16px;
  }

  .timer-complete-popup-inline p {
    margin: 0;
    font-weight: 600;
  }

  .completion-subtext {
    font-size: 13px;
    color: #666;
    font-weight: normal !important;
    margin-top: 4px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
  }

  .modal-btn {
    flex: 1;
    padding: 14px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 4px;
  }

  .modal-btn.skip {
    background: #f5f5f5;
    border: 1px solid #ccc;
  }

  .modal-btn.complete {
    background: #333;
    color: #fff;
    border: none;
  }

  .modal-btn.finish {
    background: #4caf50;
    color: #fff;
    border: none;
  }

  .end-day-view {
    padding: 40px 20px;
    max-width: 600px;
    margin: 0 auto;
    min-height: 100vh;
    background: #f5f5f5;
  }

  .end-day-view.active {
    display: block;
  }

  .end-day-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .end-day-header h2 {
    font-size: 28px;
  }

  .reflection-card {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .reflection-label {
    font-weight: bold;
    margin-bottom: 12px;
  }

  .completed-list {
    color: #555;
  }

  .reflection-textarea {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 14px;
    resize: none;
  }

  .end-day-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .end-day-actions button {
    padding: 12px 24px;
    font-size: 14px;
    cursor: pointer;
  }

  .back-btn {
    background: #fff;
    border: 1px solid #333;
  }

  .save-btn {
    background: #333;
    color: #fff;
    border: none;
  }

  .week-view-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 20px;
  }

  .week-view-container.active {
    display: flex;
  }

  .week-planner {
    flex: 1;
    background: #e0e0e0;
    border-radius: 8px;
    padding: 24px;
  }

  .week-planner-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .week-planner-header h2 {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .week-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .week-nav-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    color: #333;
  }

  .week-range {
    font-size: 14px;
    color: #666;
  }

  .week-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .week-grid-bottom {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: 66.666%;
    margin: 0 auto;
  }

  .day-card {
    background: white;
    border: 2px solid #ddd;
    border-radius: 12px;
    padding: 16px;
    min-height: 100px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .day-card:hover {
    border-color: #999;
    transform: translateY(-2px);
  }

  .day-card.selected {
    border-color: #f5a623;
    background: #fffbf0;
  }

  .day-card.today {
    border-color: #4CAF50;
  }

  .day-card-header {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .day-card-date {
    font-size: 12px;
    color: #666;
  }

  .day-card-preview {
    margin-top: 8px;
  }

  .preview-event {
    font-size: 11px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 2px 0;
  }

  .week-scratchpad {
    width: 350px;
    display: flex;
    flex-direction: column;
  }

  .week-scratchpad-header {
    background: #e0e0e0;
    padding: 16px;
    border-radius: 8px 8px 0 0;
    text-align: center;
  }

  .week-scratchpad-header h3 {
    font-size: 18px;
    font-weight: bold;
  }

  .week-scratchpad-day {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
  }

  .week-scratchpad-editor {
    background: #fffef5;
    border: 2px solid #e0e0e0;
    border-top: none;
    border-radius: 0 0 8px 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .week-scratchpad-textarea {
    flex: 1;
    border: none;
    resize: none;
    padding: 16px;
    font-size: 14px;
    font-family: inherit;
    line-height: 1.6;
    background: transparent;
    min-height: 300px;
  }

  .week-scratchpad-textarea:focus {
    outline: none;
  }

  .week-scratchpad-textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .week-scratchpad-footer {
    padding: 12px 16px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
  }

  .week-save-btn {
    background: #f5a623;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .week-save-btn:hover:not(:disabled) {
    background: #e6951a;
  }

  .week-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .playbook-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 20px;
  }

  .playbook-container.active {
    display: flex;
  }

  .playbook-sidebar {
    width: 320px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .playbook-tabs {
    display: flex;
    border-bottom: 1px solid #ddd;
    background: #e0e0e0;
    border-radius: 8px 8px 0 0;
  }

  .playbook-tab {
    flex: 1;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 14px;
    color: #666;
  }

  .playbook-tab.active {
    color: #000;
    font-weight: 600;
    background: #f5f5f5;
  }

  .playbook-list {
    padding: 16px;
  }

  .playbook-empty-state {
    text-align: center;
    color: #999;
    font-style: italic;
    padding: 40px 20px;
  }

  .playbook-detail {
    flex: 1;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
  }

  .playbook-detail-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
  }

  .playbook-detail-title {
    font-size: 14px;
    color: #666;
    text-decoration: underline;
  }

  .playbook-detail-content {
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

  .profile-modal {
    background: #fff;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 32px;
    position: relative;
  }

  .profile-modal h2 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .profile-description {
    color: #666;
    font-size: 14px;
    margin-bottom: 24px;
  }

  .phrases-list {
    margin-bottom: 16px;
  }

  .phrase-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .phrase-item input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .phrase-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
  }

  .phrase-input:focus {
    outline: none;
    border-color: #333;
  }

  .phrase-remove {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid #ddd;
    background: #fff;
    font-size: 18px;
    cursor: pointer;
    color: #999;
  }

  .phrase-remove:hover {
    background: #f5f5f5;
    color: #f44336;
    border-color: #f44336;
  }

  .add-phrase-btn {
    width: 100%;
    padding: 12px;
    border: 1px dashed #ccc;
    border-radius: 6px;
    background: #f9f9f9;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
  }

  .add-phrase-btn:hover {
    background: #f0f0f0;
    border-color: #999;
  }

  .profile-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn-cancel {
    padding: 12px 24px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-save {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    background: #333;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .btn-save:hover {
    background: #444;
  }

  @media (max-width: 900px) {
    .main-container {
      flex-direction: column;
    }

    .scratchpad {
      width: 100%;
    }

    .week-view-container {
      flex-direction: column;
    }

    .week-scratchpad {
      width: 100%;
    }

    .week-grid-bottom {
      max-width: 100%;
    }

    .playbook-container {
      flex-direction: column;
    }

    .playbook-sidebar {
      width: 100%;
    }
  }
`;
