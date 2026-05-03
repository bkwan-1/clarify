import { useState, useEffect, useMemo } from 'react';
import { TopNav } from './components/shell/TopNav';
import { BottomNav } from './components/shell/BottomNav';
import { AboutModal } from './components/shell/AboutModal';
import type { ActiveTool } from './components/shell/TopNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GradeRecoveryPage } from './components/tool1/GradeRecoveryPage';
import { GPATrackerPage } from './components/tool2/GPATrackerPage';
import { useTheme } from './hooks/useTheme';
import { readSavedDataSummary } from './lib/savedData';

interface PendingHandoff {
  courseName: string;
  gradePercent: number;
  creditHours: number | null;
}

function App() {
  const [theme, toggleTheme] = useTheme();

  // Persist last-used tool across sessions
  const [activeTool, setActiveTool] = useState<ActiveTool>(() => {
    try {
      return (localStorage.getItem('clarify_active_tool') as ActiveTool) || 'grade-recovery';
    } catch {
      return 'grade-recovery';
    }
  });

  // Landing shows on first visit; logo click re-shows it any time
  const [showLanding, setShowLanding] = useState(() => {
    try {
      return localStorage.getItem('clarify_welcomed') !== 'true';
    } catch {
      return true;
    }
  });

  const [showAbout, setShowAbout] = useState(false);
  const [pendingHandoff, setPendingHandoff] = useState<PendingHandoff | null>(null);

  // Snapshot of saved data for nav indicators — refreshed on each render
  // (cheap localStorage read, but stable enough for dots)
  const savedData = useMemo(() => readSavedDataSummary(), [activeTool, showLanding]);

  useEffect(() => {
    try {
      localStorage.setItem('clarify_active_tool', activeTool);
    } catch {}
  }, [activeTool]);

  function handleStart(tool: ActiveTool) {
    setActiveTool(tool);
    setShowLanding(false);
    try {
      localStorage.setItem('clarify_welcomed', 'true');
    } catch {}
  }

  function handleSwitchTool(tool: ActiveTool) {
    setActiveTool(tool);
  }

  function handleHandoff(className: string, gradePercent: number, creditHours: number | null) {
    setPendingHandoff({ courseName: className, gradePercent, creditHours });
    setActiveTool('gpa-tracker');
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Landing / welcome-back screen — covers everything at z-50 */}
      {showLanding && (
        <WelcomeScreen
          onStart={handleStart}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      )}

      {/* App shell — always rendered so tools stay mounted */}
      <TopNav
        activeTool={activeTool}
        onSwitch={handleSwitchTool}
        theme={theme}
        onThemeToggle={toggleTheme}
        onLogoClick={() => setShowLanding(true)}
        onInfoClick={() => setShowAbout(true)}
        hasGradeData={savedData.hasGradeData}
        hasGPAData={savedData.hasGPAData}
      />

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

      {/* Mobile bottom nav — sits in normal flow so content doesn't overlap */}
      <BottomNav
        activeTool={activeTool}
        onSwitch={handleSwitchTool}
        hasGradeData={savedData.hasGradeData}
        hasGPAData={savedData.hasGPAData}
      />

      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}

export default App;
