'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { GAMES, PLAY_STYLES, type GameKey } from '@/lib/games';
import { useProfileForm } from '@/components/forms/ProfileForm';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

const STEP_LABELS = ['Basic Info', 'Your Games', 'Play Style', 'Discord'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABEL = (h: number) => {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
};

export default function EditProfilePage() {
  const {
    step,
    formData,
    saving,
    setStep,
    updateField,
    toggleGame,
    updateGameRank,
    updateHoursPlayed,
    togglePlayStyle,
    handleSave,
  } = useProfileForm();

  const progress = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-orbitron text-2xl font-bold mb-1" style={{ color: 'var(--cyan)' }}>
          프로필 설정
        </h1>
        <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
          {step}/4 단계 — {STEP_LABELS[step - 1]}
        </p>

        {/* Progress bar */}
        <div className="progress-bar mt-4">
          <motion.div
            className="progress-bar-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-orbitron font-bold transition-all duration-300"
                  style={{
                    background: isDone
                      ? 'var(--green)'
                      : isActive
                      ? 'var(--cyan)'
                      : 'var(--surface-2)',
                    color: isDone || isActive ? 'var(--bg)' : 'var(--text-muted)',
                    boxShadow: isActive ? 'var(--glow-cyan)' : isDone ? 'var(--glow-green)' : 'none',
                    border: `1px solid ${isDone ? 'var(--green)' : isActive ? 'var(--cyan)' : 'var(--border)'}`,
                  }}
                >
                  {isDone ? <Check size={10} /> : stepNum}
                </div>
                <span
                  className="text-[9px] font-orbitron hidden sm:block"
                  style={{ color: isActive ? 'var(--cyan)' : 'var(--text-muted)' }}
                >
                  {label.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="card p-6 min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {step === 1 && (
              <Step1BasicInfo formData={formData} updateField={updateField} />
            )}
            {step === 2 && (
              <Step2Games
                formData={formData}
                toggleGame={toggleGame}
                updateGameRank={updateGameRank}
                updateHoursPlayed={updateHoursPlayed}
              />
            )}
            {step === 3 && (
              <Step3PlayStyle formData={formData} togglePlayStyle={togglePlayStyle} updateField={updateField} />
            )}
            {step === 4 && (
              <Step4Discord formData={formData} updateField={updateField} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <ChevronLeft size={14} />
          이전
        </Button>

        {step < 4 ? (
          <Button
            variant="primary"
            onClick={() => setStep(Math.min(4, step + 1))}
          >
            다음
            <ChevronRight size={14} />
          </Button>
        ) : (
          <Button
            variant="success"
            loading={saving}
            onClick={handleSave}
          >
            <Check size={14} />
            저장하기
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Step 1: Basic Info ─── */
function Step1BasicInfo({
  formData,
  updateField,
}: {
  formData: ReturnType<typeof useProfileForm>['formData'];
  updateField: ReturnType<typeof useProfileForm>['updateField'];
}) {
  const bioLength = formData.bio?.length ?? 0;

  return (
    <div className="space-y-5">
      <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>
        BASIC INFO
      </h2>

      <Input
        label="Username"
        placeholder="게이머 닉네임"
        value={formData.username}
        onChange={(e) => updateField('username', e.target.value)}
        maxLength={32}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase">
            Bio
          </label>
          <span
            className="text-xs font-mono"
            style={{ color: bioLength > 260 ? 'var(--pink)' : 'var(--text-muted)' }}
          >
            {bioLength}/280
          </span>
        </div>
        <Textarea
          placeholder="자신을 소개해 주세요..."
          value={formData.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          maxLength={280}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase">
          Region
        </label>
        <select
          className="input"
          value={formData.region}
          onChange={(e) => updateField('region', e.target.value)}
        >
          <option value="Korea">🇰🇷 Korea</option>
          <option value="Asia">🌏 Asia</option>
          <option value="Global">🌎 Global</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase">
          Languages
        </label>
        <div className="flex gap-3 flex-wrap">
          {[
            { key: 'ko', label: '🇰🇷 Korean' },
            { key: 'en', label: '🇺🇸 English' },
            { key: 'both', label: '🌐 Both' },
          ].map(({ key, label }) => {
            const active = formData.languages.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const next = active
                    ? formData.languages.filter((l) => l !== key)
                    : [...formData.languages, key];
                  updateField('languages', next);
                }}
                className="tag cursor-pointer transition-all"
                style={
                  active
                    ? { color: 'var(--cyan)', borderColor: 'var(--cyan)', background: 'rgba(0,245,255,0.1)' }
                    : {}
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Games ─── */
function Step2Games({
  formData,
  toggleGame,
  updateGameRank,
  updateHoursPlayed,
}: {
  formData: ReturnType<typeof useProfileForm>['formData'];
  toggleGame: ReturnType<typeof useProfileForm>['toggleGame'];
  updateGameRank: ReturnType<typeof useProfileForm>['updateGameRank'];
  updateHoursPlayed: ReturnType<typeof useProfileForm>['updateHoursPlayed'];
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>
        YOUR GAMES
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.values(GAMES).map((game) => {
          const isSelected = formData.selectedGames.includes(game.key);
          const rankData = formData.gameRanks[game.key] ?? { rank: '', hours: '' };
          return (
            <div key={game.key} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => toggleGame(game.key)}
                className="flex items-center gap-3 rounded-lg p-3 text-left transition-all duration-200"
                style={{
                  background: isSelected ? `${game.color}15` : 'var(--surface-2)',
                  border: `1px solid ${isSelected ? game.color : 'var(--border)'}`,
                  boxShadow: isSelected ? `0 0 12px ${game.color}25` : 'none',
                }}
              >
                <span className="text-xl flex-shrink-0">{game.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-orbitron text-xs font-bold truncate"
                    style={{ color: isSelected ? game.color : 'var(--text-dim)' }}
                  >
                    {game.nameKo}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {game.name}
                  </p>
                </div>
                {isSelected && (
                  <Check size={14} style={{ color: game.color, flexShrink: 0 }} />
                )}
              </button>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 px-1"
                >
                  {'ranks' in game && game.ranks.length > 0 && (
                    <select
                      className="input text-xs flex-1"
                      value={rankData.rank}
                      onChange={(e) => updateGameRank(game.key, e.target.value)}
                    >
                      <option value="">Rank 선택</option>
                      {(game.ranks as readonly string[]).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                  {'itemLevelBrackets' in game && (
                    <select
                      className="input text-xs flex-1"
                      value={rankData.rank}
                      onChange={(e) => updateGameRank(game.key, e.target.value)}
                    >
                      <option value="">아이템 레벨</option>
                      {(game.itemLevelBrackets as readonly string[]).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    className="input text-xs w-20"
                    placeholder="시간"
                    min={0}
                    max={99999}
                    value={rankData.hours}
                    onChange={(e) => updateHoursPlayed(game.key, e.target.value)}
                  />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 3: Play Style ─── */
function Step3PlayStyle({
  formData,
  togglePlayStyle,
  updateField,
}: {
  formData: ReturnType<typeof useProfileForm>['formData'];
  togglePlayStyle: ReturnType<typeof useProfileForm>['togglePlayStyle'];
  updateField: ReturnType<typeof useProfileForm>['updateField'];
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>
        PLAY STYLE
      </h2>

      <div className="flex flex-wrap gap-2">
        {PLAY_STYLES.map((style) => {
          const active = formData.playStyles.includes(style.key);
          return (
            <button
              key={style.key}
              type="button"
              onClick={() => togglePlayStyle(style.key)}
              className="tag cursor-pointer transition-all text-xs"
              style={
                active
                  ? { color: 'var(--cyan)', borderColor: 'var(--cyan)', background: 'rgba(0,245,255,0.1)' }
                  : {}
              }
            >
              {style.emoji} {style.labelKo}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <label className="text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase">
          Active Hours (KST)
        </label>
        <div className="flex items-center gap-3">
          <select
            className="input text-xs flex-1"
            value={formData.activeHoursStart}
            onChange={(e) => updateField('activeHoursStart', parseInt(e.target.value, 10))}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{HOUR_LABEL(h)}</option>
            ))}
          </select>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>~</span>
          <select
            className="input text-xs flex-1"
            value={formData.activeHoursEnd}
            onChange={(e) => updateField('activeHoursEnd', parseInt(e.target.value, 10))}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{HOUR_LABEL(h)}</option>
            ))}
          </select>
        </div>

        {/* Preview bar */}
        <div>
          <div className="hours-bar">
            {(() => {
              const start = formData.activeHoursStart;
              const end = formData.activeHoursEnd;
              let duration = end - start;
              if (duration <= 0) duration += 24;
              const leftPct = (start / 24) * 100;
              const widthPct = (duration / 24) * 100;
              return (
                <div
                  className="hours-bar-fill"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              );
            })()}
          </div>
          <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Discord ─── */
function Step4Discord({
  formData,
  updateField,
}: {
  formData: ReturnType<typeof useProfileForm>['formData'];
  updateField: ReturnType<typeof useProfileForm>['updateField'];
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>
        DISCORD SETTINGS
      </h2>

      {/* Join server */}
      <div
        className="rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="font-orbitron text-xs font-bold" style={{ color: 'var(--text)' }}>
            SquadUp KR 커뮤니티 서버
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
            디스코드 서버에 참여하면 더 많은 기능을 사용할 수 있습니다.
          </p>
        </div>
        <a
          href="https://discord.gg/squadupkr"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-discord flex-shrink-0"
        >
          서버 참여하기
        </a>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <ToggleRow
          label="온라인 상태 표시"
          description="다른 사용자에게 접속 중인지 표시합니다."
          checked={formData.showOnlineStatus}
          onChange={(v) => updateField('showOnlineStatus', v)}
        />
        <ToggleRow
          label="Squad Request 허용"
          description="다른 사용자가 팀원 요청을 보낼 수 있습니다."
          checked={formData.allowRequests}
          onChange={(v) => updateField('allowRequests', v)}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>{label}</p>
        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300"
        style={{
          background: checked ? 'var(--cyan)' : 'var(--surface-3)',
          border: `1px solid ${checked ? 'var(--cyan)' : 'var(--border)'}`,
          boxShadow: checked ? 'var(--glow-cyan)' : 'none',
        }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
          style={{
            background: checked ? 'var(--bg)' : 'var(--text-muted)',
            left: checked ? 'calc(100% - 1.375rem)' : '0.125rem',
          }}
        />
      </button>
    </div>
  );
}
