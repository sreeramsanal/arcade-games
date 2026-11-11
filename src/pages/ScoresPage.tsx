import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { GAMES_CATALOG } from '../services/gamesData';
import { ACHIEVEMENTS } from '../services/achievementsData';
import { soundService } from '../services/soundService';

export const ScoresPage: React.FC = () => {
  const [data, setData] = useState(storageService.getData());
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [newTag, setNewTag] = useState(storageService.getPlayerTag());
  const [showResetModal, setShowResetModal] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    return storageService.subscribe(updated => {
      setData({ ...updated });
      setNewTag(updated.playerTag);
    });
  }, []);

  const totalGamesPlayed = storageService.getTotalGamesPlayed();
  const playerLevel = storageService.getPlayerLevel();
  const totalCompletedChallenges = data.dailyChallenge.completedDates.length;
  
  // Count games where user has established a score
  const personalRecordsCount = Object.values(data.scores).filter(s => s.bestScore > 0).length;

  const handleSaveTag = () => {
    soundService.playScore();
    storageService.setPlayerTag(newTag);
    setIsEditingTag(false);
  };

  const handleExportData = () => {
    soundService.playClick();
    const jsonStr = storageService.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel-arcade-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    soundService.playExplosion();
    storageService.clearAllData();
    setShowResetModal(false);
  };

  const unlockedCount = ACHIEVEMENTS.filter(a => a.isUnlocked(data)).length;
  const filteredAchievements = ACHIEVEMENTS.filter(a => {
    const isUnlocked = a.isUnlocked(data);
    if (achievementFilter === 'unlocked') return isUnlocked;
    if (achievementFilter === 'locked') return !isUnlocked;
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-white pt-24 pb-16 overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Link to="/" onClick={() => soundService.playClick()} className="hover:text-white transition-colors">
              ARCADE
            </Link>
            <span>/</span>
            <span className="text-[#ff2a4b] font-bold">MY SCORES</span>
            <span>/</span>
            <span className="text-white font-bold">{data.playerTag}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportData}
              className="px-3 py-1.5 bg-[#14171f] hover:bg-[#1c212d] border border-white/10 hover:border-white/30 rounded text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download local JSON stats backup"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORT JSON
            </button>
            <button
              onClick={() => {
                soundService.playClick();
                setShowResetModal(true);
              }}
              className="px-3 py-1.5 bg-black/40 hover:bg-[#ff2a4b]/20 border border-white/10 hover:border-[#ff2a4b]/50 rounded text-xs font-mono text-[var(--text-muted)] hover:text-[#ff2a4b] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset records and stats"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              RESET STATS
            </button>
          </div>
        </div>

        {/* Player Cockpit Header Card */}
        <div className="relative p-6 sm:p-8 bg-[#14171f] border border-white/[0.08] rounded-2xl mb-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Player Avatar & Callsign */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#ff2a4b] to-[#ffb703] p-1 flex items-center justify-center shadow-[0_0_20px_rgba(255,42,75,0.4)]">
                  <div className="w-full h-full bg-[#0d0f14] rounded-xl flex items-center justify-center text-[#ff2a4b]">
                    <span className="material-symbols-outlined text-4xl">sports_esports</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-[#ff2a4b] text-white font-mono text-[10px] font-bold rounded">
                  LVL {playerLevel.level}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">PILOT CALLSIGN:</span>
                  <span className="text-[10px] font-mono text-[#22c55e]">● ACTIVE PILOT</span>
                </div>

                {isEditingTag ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      maxLength={12}
                      value={newTag}
                      onChange={e => setNewTag(e.target.value.toUpperCase())}
                      className="bg-black/60 border border-[#ff2a4b] rounded px-3 py-1 font-mono font-bold text-lg text-white uppercase focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTag}
                      className="px-3 py-1 bg-[#22c55e] text-black font-mono font-bold text-xs rounded hover:brightness-110"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => setIsEditingTag(false)}
                      className="px-2 py-1 bg-white/10 text-white font-mono text-xs rounded hover:bg-white/20"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1">
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider">
                      {data.playerTag}
                    </h1>
                    <button
                      onClick={() => {
                        soundService.playClick();
                        setIsEditingTag(true);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-[#ff2a4b] transition-colors"
                      title="Edit Callsign"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  </div>
                )}

                <div className="text-xs font-mono text-[#ffb703] font-bold mt-1">
                  {playerLevel.title}
                </div>
              </div>
            </div>

            {/* XP Meter Progress */}
            <div className="w-full lg:max-w-sm space-y-2 p-4 bg-black/40 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">XP PROGRESSION:</span>
                <span className="text-white font-bold">{playerLevel.xpInLevel} / {playerLevel.xpNeededForNext} XP</span>
              </div>
              <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#ff2a4b] to-[#ffb703] transition-all duration-500 rounded-full"
                  style={{ width: `${playerLevel.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                <span>RANK LVL {playerLevel.level}</span>
                <span>NEXT LVL {playerLevel.level + 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Bento KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="p-5 bg-[#14171f] border border-white/[0.08] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase">GAMES PLAYED</span>
              <span className="material-symbols-outlined text-[#ff2a4b] text-xl">sports_esports</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-3">
              {totalGamesPlayed}
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
              Across 8 arcade cabinets
            </div>
          </div>

          <div className="p-5 bg-[#14171f] border border-white/[0.08] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase">DAILY DRILLS</span>
              <span className="material-symbols-outlined text-[#ffb703] text-xl">psychology</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-3">
              {totalCompletedChallenges}
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
              Calendar challenges solved
            </div>
          </div>

          <div className="p-5 bg-[#14171f] border border-white/[0.08] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase">PERSONAL RECORDS</span>
              <span className="material-symbols-outlined text-[#00f3ff] text-xl">emoji_events</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-3">
              {personalRecordsCount} / 8
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
              Cabinets with active scores
            </div>
          </div>

          <div className="p-5 bg-[#14171f] border border-white/[0.08] rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase">DAILY STREAK</span>
              <span className="material-symbols-outlined text-[#22c55e] text-xl">local_fire_department</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-3 flex items-baseline gap-1">
              <span>{data.dailyChallenge.currentStreak}</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">/ BEST {data.dailyChallenge.bestStreak}</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
              Consecutive days logged
            </div>
          </div>
        </div>

        {/* Personal Records Matrix Table */}
        <div className="p-6 bg-[#14171f] border border-white/[0.08] rounded-2xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5 mb-4">
            <div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                CABINET RECORDS MATRIX
              </h2>
              <p className="text-xs font-sans text-[var(--text-muted)]">
                Direct personal scores recorded on this device. Click PLAY to challenge your current record.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[var(--text-muted)] uppercase text-[10px]">
                  <th className="py-3 px-4">CABINET</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4 text-right">PERSONAL BEST</th>
                  <th className="py-3 px-4 text-right">LAST SCORE</th>
                  <th className="py-3 px-4 text-center">PLAYS</th>
                  <th className="py-3 px-4 text-right">LAST SESSION</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {GAMES_CATALOG.map(game => {
                  const score = storageService.getGameScore(game.id);
                  const hasPlayed = score.gamesPlayed > 0;
                  return (
                    <tr key={game.id} className="hover:bg-black/30 transition-colors">
                      <td className="py-3 px-4 font-display font-bold text-sm text-white flex items-center gap-2">
                        <span 
                          className="w-6 h-6 rounded flex items-center justify-center text-xs"
                          style={{ backgroundColor: `${game.accentColor}20`, color: game.accentColor }}
                        >
                          <span className="material-symbols-outlined text-sm">{game.icon}</span>
                        </span>
                        {game.title}
                      </td>
                      <td className="py-3 px-4">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{ color: game.tagColor, backgroundColor: `${game.tagColor}15` }}
                        >
                          {game.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {score.bestScore > 0 ? (
                          <span className="text-[#ffb703] drop-shadow-[0_0_8px_rgba(255,183,3,0.3)]">
                            {score.bestScore.toLocaleString()} {game.unit}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-300">
                        {score.lastScore > 0 ? `${score.lastScore.toLocaleString()} ${game.unit}` : '--'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-neutral-400">
                        {score.gamesPlayed}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)]">
                        {hasPlayed && score.lastPlayed
                          ? new Date(score.lastPlayed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/games/${game.id}`}
                          onClick={() => soundService.playClick()}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#1c212d] hover:bg-[#ff2a4b] text-white rounded font-display font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          PLAY
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trophies & Achievements Grid */}
        <div className="p-6 bg-[#14171f] border border-white/[0.08] rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                  TROPHIES & UNLOCKS
                </h2>
                <span className="px-2.5 py-0.5 bg-[#ffb703]/20 border border-[#ffb703]/50 text-[#ffb703] font-mono text-[11px] font-bold rounded">
                  {unlockedCount} / {ACHIEVEMENTS.length} UNLOCKED
                </span>
              </div>
              <p className="text-xs font-sans text-[var(--text-muted)] mt-1">
                Complete milestones across individual cabinets to unlock arcade badges.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5">
              {(['all', 'unlocked', 'locked'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    soundService.playClick();
                    setAchievementFilter(tab);
                  }}
                  className={`px-3 py-1 text-xs font-mono uppercase rounded transition-colors ${
                    achievementFilter === tab
                      ? 'bg-[#ff2a4b] text-white font-bold'
                      : 'bg-black/30 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(ach => {
              const isUnlocked = ach.isUnlocked(data);
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[#1c212d] to-[#14171f] border-[#ffb703]/50 shadow-[0_0_15px_rgba(255,183,3,0.15)]'
                      : 'bg-black/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? 'bg-[#ffb703]/20 text-[#ffb703] border border-[#ffb703]/40'
                          : 'bg-white/5 text-neutral-600 border border-white/5'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {isUnlocked ? ach.icon : 'lock'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-display font-bold text-sm text-white truncate">
                          {ach.title}
                        </h4>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase shrink-0">
                          {ach.category}
                        </span>
                      </div>

                      <p className="text-xs font-sans text-[var(--text-muted)] mt-1 line-clamp-2">
                        {ach.description}
                      </p>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                        <span className={isUnlocked ? 'text-[#22c55e] font-bold' : 'text-[var(--text-muted)]'}>
                          {ach.progressText(data)}
                        </span>
                        {isUnlocked && (
                          <span className="text-[#ffb703] font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            CLAIMED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Vault */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#14171f] border-2 border-[#ff2a4b] rounded-2xl max-w-md w-full p-6 text-center shadow-[0_0_50px_rgba(255,42,75,0.4)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#ff2a4b]/20 border border-[#ff2a4b] flex items-center justify-center text-[#ff2a4b] mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="font-display font-black text-2xl text-white tracking-wider mb-2">
              PURGE ALL TELEMETRY?
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed mb-6">
              This will permanently delete all personal records, daily challenge streaks, XP, and trophy unlocks saved in this browser. This cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 bg-[#1c212d] hover:bg-white/10 text-white font-mono font-bold text-xs uppercase rounded transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 py-3 bg-[#ff2a4b] hover:brightness-110 text-white font-mono font-bold text-xs uppercase rounded clip-chamfer-btn transition-all shadow-[0_0_15px_rgba(255,42,75,0.4)]"
              >
                CONFIRM RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoresPage;

