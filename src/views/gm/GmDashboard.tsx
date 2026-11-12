import React from 'react';
import {
  AcademyState,
  GmMenuId,
  UserRole,
} from '../../types/lms';
import {
  GM_NAV_ITEMS,
  getGmMenuIcon,
} from '../../components/ArcadeShell';
import { PixelAvatar, PixelCoin, PixelStar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelSectionTitle,
} from '../../components/PixelUI';
import { formatRetroDate, getHeroTotalExp } from '../../utils/exp';

interface GmDashboardProps {
  state: AcademyState;
  onNavigate: (menu: GmMenuId) => void;
  onSwitchRole: (role: UserRole) => void;
}

export const GmDashboard: React.FC<GmDashboardProps> = ({
  state,
  onNavigate,
  onSwitchRole,
}) => {
  const activeHeroes = state.heroes.filter((h) => h.active).length;
  const totalExpAwarded = state.grades.reduce((sum, g) => sum + g.expEarned, 0);
  const topHero = [...state.heroes].sort(
    (a, b) =>
      getHeroTotalExp(b.id, state.grades) - getHeroTotalExp(a.id, state.grades)
  )[0];

  return (
    <div className="space-y-5">
      {/* GM Identity Banner */}
      <section className="pixel-box p-4 space-y-3">
        <div className="flex items-center gap-3">
          <PixelAvatar avatar={state.gmProfile.avatar} size={52} className="animate-pixel-bounce" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-pixel-ui text-[10px] text-[var(--accent-warning)]">
              <PixelStar size={12} />
              GUILD MASTER ONLINE
            </div>
            <h2 className="font-pixel-display text-[13px] text-[var(--text-primary)] truncate mt-0.5">
              {state.gmProfile.name}
            </h2>
            <p className="font-pixel-body text-[17px] text-[var(--text-secondary)] truncate">
              {state.gmProfile.title} · {state.settings.academicTerm}
            </p>
          </div>
        </div>

        {/* 4 Core KPI Counters */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="pixel-box-inset p-2.5">
            <p className="font-pixel-ui text-[10px] text-[var(--text-muted)] flex items-center justify-between">
              <span>ACTIVE HEROES</span>
              <PixelStar size={12} className="text-[var(--accent-success)]" />
            </p>
            <p className="font-pixel-display text-[16px] text-[var(--accent-success)] tabular-nums mt-1">
              {activeHeroes}/{state.heroes.length}
            </p>
          </div>
          <div className="pixel-box-inset p-2.5">
            <p className="font-pixel-ui text-[10px] text-[var(--text-muted)] flex items-center justify-between">
              <span>DUNGEONS</span>
              <span>🏰</span>
            </p>
            <p className="font-pixel-display text-[16px] text-[var(--text-primary)] tabular-nums mt-1">
              {state.dungeons.length}
            </p>
          </div>
          <div className="pixel-box-inset p-2.5">
            <p className="font-pixel-ui text-[10px] text-[var(--text-muted)] flex items-center justify-between">
              <span>ACTIVE QUESTS</span>
              <span>⚔️</span>
            </p>
            <p className="font-pixel-display text-[16px] text-[var(--accent-warning)] tabular-nums mt-1">
              {state.quests.length}
            </p>
          </div>
          <div className="pixel-box-inset p-2.5">
            <p className="font-pixel-ui text-[10px] text-[var(--text-muted)] flex items-center justify-between">
              <span>TOTAL EXP LOOT</span>
              <PixelCoin size={14} className="animate-coin-shine" />
            </p>
            <p className="font-pixel-display text-[16px] text-[var(--accent-primary-hover)] tabular-nums mt-1 flex items-center gap-1">
              +{totalExpAwarded}
            </p>
          </div>
        </div>
      </section>

      {/* 9-Menu Command Center */}
      <section>
        <PixelSectionTitle
          title="Command Menu (9 Modules)"
          subtitle="Akses cepat seluruh modul Game Master"
        />
        <div className="grid grid-cols-3 gap-2">
          {GM_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="pixel-btn min-h-[74px] p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-alt)] flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer"
            >
              <span className="text-[var(--accent-warning)]">
                {getGmMenuIcon(item.id, 20)}
              </span>
              <span className="font-pixel-ui text-[10px] text-[var(--text-primary)] leading-tight">
                {item.shortLabel}
              </span>
              <span className="font-pixel-body text-[13px] text-[var(--text-muted)] leading-none">
                {item.standardName}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Top Hero & Recent Broadcast Snapshot */}
      <section className="space-y-3">
        <PixelSectionTitle
          title="Tavern Highlights"
          action={
            <PixelButton
              type="button"
              size="sm"
              variant="success"
              onClick={() => onSwitchRole(UserRole.HERO)}
            >
              Preview Hero
            </PixelButton>
          }
        />

        {topHero && (
          <div className="pixel-box p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <PixelAvatar avatar={topHero.avatar} size={40} />
              <div className="min-w-0">
                <p className="font-pixel-ui text-[10px] text-[var(--accent-warning)]">
                  TOP EXP HERO
                </p>
                <p className="font-pixel-body text-[20px] text-[var(--text-primary)] truncate">
                  {topHero.name}
                </p>
                <p className="font-pixel-body text-[15px] text-[var(--text-secondary)]">
                  {topHero.heroClass} ·{' '}
                  <span className="tabular-nums">
                    {getHeroTotalExp(topHero.id, state.grades)} EXP
                  </span>
                </p>
              </div>
            </div>
            <PixelButton
              type="button"
              size="sm"
              variant="neutral"
              onClick={() => onNavigate('exp_loot')}
            >
              Grade
            </PixelButton>
          </div>
        )}

        {state.notices[0] && (
          <div className="pixel-box p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[15px] font-pixel-body text-[var(--text-secondary)]">
              <span>Latest Notice · {state.notices[0].priority}</span>
              <span className="tabular-nums">
                {formatRetroDate(state.notices[0].releaseDate)}
              </span>
            </div>
            <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)]">
              {state.notices[0].title}
            </h3>
            <p className="font-pixel-body text-[17px] text-[var(--text-secondary)] line-clamp-2">
              {state.notices[0].description}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
