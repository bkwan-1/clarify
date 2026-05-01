import { useState, useEffect } from 'react';
import { TopNav } from './components/shell/TopNav';
import type { ActiveTool } from './components/shell/TopNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GradeRecoveryPage } from './components/tool1/GradeRecoveryPage';
import { GPATrackerPage } from './components/tool2/GPATrackerPage';
import { useTheme } from './hooks/useTheme';
import type { LetterGrade } from './models/gradeRecovery';

interface PendingHandoff {
  courseName: string;
  projectedGrade: LetterGrade;
}

function App() {
  const [theme, toggleTheme] = useTheme();
  const [activeTool, setActiveTool] = useState<ActiveTool>(() => {
    try {
      return (localStorage.getItem('clarify_active_tool') as ActiveTool) || 'grade-recovery';
    } catch {
      return 'grade-recovery';
    }
  });
  const [welcomed, setWelcomed] = useState(() => {
    try {
      return localStorage.getItem('clarify_welcomed') === 'true';
    } catch {
      return false;
    }
  });
  const [pendingHandoff, setPendingHandoff] = useState<PendingHandoff | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('clarify_active_tool', activeTool);
    } catch {}
  }, [activeTool]);

  function handleStart(tool: ActiveTool) {
    setActiveTool(tool);
    setWelcomed(true);
    try {
      localStorage.setItem('clarify_welcomed', 'true');
    } catch {}
  }

  function handleSwitchTool(tool: ActiveTool) {
    setActiveTool(tool);
  }

  function handleHandoff(className: string, projectedGrade: LetterGrade) {
    setPendingHandoff({ courseName: className, projectedGrade });
    setActiveTool('gpa-tracker');
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Welcome screen (first visit) */}
      {!welcomed && <WelcomeScreen onStart={handleStart} />}

      {/* Shell */}
      <TopNav
        activeTool={activeTool}
        onSwitch={handleSwitchTool}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {/* Tool pages — mount/unmount on switch to reset local state */}
      <main className="flex flex-1 overflow-hidden">
        {activeTool === 'grade-recovery' && (
          <GradeRecoveryPage
            onSwitchTool={handleSwitchTool}
            onHandoff={handleHandoff}
          />
        )}
        {activeTool === 'gpa-tracker' && (
          <GPATrackerPage
            pendingHandoff={pendingHandoff}
            onHandoffConsumed={() => setPendingHandoff(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
