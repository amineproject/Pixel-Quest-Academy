import React, { useMemo } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { AcademyState, HeroStudent } from '../../types/lms';
import { PixelAvatar, PixelCoin } from '../../components/PixelArt';
import {
  PixelEmptyChest,
  PixelSectionTitle,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  getGuildLeaderboard,
  getHeroEffectiveRealmIds,
  getScopedHeroLeaderboardInputs,
} from '../../utils/exp';

interface HeroMyGuildProps {
  state: AcademyState;
  hero: HeroStudent;
}

export const HeroMyGuild: React.FC<HeroMyGuildProps> = ({ state, hero }) => {
  const dungeon = state.dungeons.find((d) => d.id === hero.dungeonId);
  const allowedRealmIds = getHeroEffectiveRealmIds(hero, state.dungeons) || [];
  const enrolledRealms = state.realms.filter((r) =>
    allowedRealmIds.includes(r.id)
  );
  const partyMembers = state.heroes
    .filter((h) => h.dungeonId === hero.dungeonId && h.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));

  const guildLeaderboard = useMemo(() => {
    const { scopedHeroes, scopedGrades } = getScopedHeroLeaderboardInputs(
      hero,
      state.heroes,
      state.dungeons,
      state.grades
    );
    return getGuildLeaderboard(scopedHeroes, scopedGrades).slice(0, 15);
  }, [hero, state.heroes, state.dungeons, state.grades]);

  return (
    <div className="space-y-5">
      <PixelSectionTitle
        title="My Guild / Party"
        subtitle="Informasi ruang kelas, leaderboard EXP, dan rekan petualang (Read-Only)"
      />

      {!dungeon ? (
        <PixelEmptyChest
          title="No Guild Assigned!"
          description="Akun Hero Anda belum terhubung dengan Dungeon manapun."
        />
      ) : (
        <ThemedPanelCard className="space-y-2.5">
          <p className="font-pixel-ui text-[10px] text-[var(--accent-warning)] break-words">
            {dungeon.guildCode} · {dungeon.tier}
          </p>
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug break-words">
            {dungeon.name}
          </h3>
          {dungeon.description && (
            <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words">
              {dungeon.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)] uppercase">
              Mapel Diikuti ({enrolledRealms.length}):
            </span>
            {enrolledRealms.length > 0 ? (
              enrolledRealms.map((realm) => (
                <span
                  key={realm.id}
                  className="text-[11px] font-medium px-2 py-0.5 border border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] flex items-center gap-1 max-w-full"
                >
                  <span
                    className="w-2 h-2 inline-block shrink-0"
                    style={{ backgroundColor: realm.accentColor }}
                  />
                  <span className="truncate max-w-[160px]">{realm.name}</span>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[var(--text-muted)] italic">
                Semua Mapel
              </span>
            )}
          </div>
          <p className="text-[12px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-pixel)]/40 tabular-nums">
            Kapasitas Guild: {partyMembers.length}/{dungeon.capacity} Heroes Aktif
          </p>
        </ThemedPanelCard>
      )}

      {/* Game Master Card */}
      <section className="space-y-2">
        <PixelSectionTitle title="Guild Master Pengampu" />
        <ThemedPanelCard className="p-3.5 flex items-center gap-3">
          <PixelAvatar avatar={state.gmProfile.avatar} size={48} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-pixel-ui text-[10px] text-[var(--accent-warning)]">
              GAME MASTER
            </p>
            <h3 className="text-[14px] font-bold text-[var(--text-primary)] truncate">
              {state.gmProfile.name}
            </h3>
            <p className="text-[12.5px] text-[var(--text-secondary)] truncate">
              {state.gmProfile.title} · {state.gmProfile.specialty}
            </p>
          </div>
        </ThemedPanelCard>
      </section>

      {/* Guild Leaderboard by EXP & Hero Level (Item 4.3) */}
      <section className="space-y-2.5">
        <PixelSectionTitle
          title="Leaderboard Guild"
          subtitle="Peringkat petualang berdasarkan akumulasi EXP & Quest Tuntas"
        />
        {guildLeaderboard.length === 0 ? (
          <PixelEmptyChest
            title="Belum Ada Peringkat Guild!"
            description="Selesaikan Quest untuk mulai mengumpulkan EXP dan masuk ke papan peringkat."
          />
        ) : (
          <div className="space-y-2">
            {guildLeaderboard.map((entry) => {
              const isMe = entry.hero.id === hero.id;
              const rankBadgeClass =
                entry.rank === 1
                  ? 'bg-[#ffd000] text-[#09090f] border-[#09090f]'
                  : entry.rank === 2
                    ? 'bg-slate-200 text-slate-900 border-slate-700'
                    : entry.rank === 3
                      ? 'bg-amber-200 text-amber-950 border-amber-800'
                      : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-pixel)]/60';

              return (
                <ThemedPanelCard
                  key={entry.hero.id}
                  className={`p-3 flex items-center justify-between gap-2.5 ${
                    isMe ? 'ring-2 ring-[var(--accent-warning)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 rounded border-2 font-pixel-display text-[11px] flex items-center justify-center shrink-0 tabular-nums ${rankBadgeClass}`}
                    >
                      {entry.rank === 1 ? <Crown size={14} /> : `#${entry.rank}`}
                    </span>
                    <PixelAvatar
                      avatar={entry.hero.avatar}
                      size={36}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">
                          {entry.hero.name} {isMe ? '(Kamu)' : ''}
                        </p>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--surface-tint)] border border-[var(--border-pixel)]/40 font-pixel-ui text-[10px] font-bold text-[var(--text-primary)] shrink-0 tabular-nums">
                          Lv.{entry.level}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[var(--text-secondary)] truncate">
                        {entry.title} · {entry.tuntasCount} Quest Tuntas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-inset)] border border-[var(--border-pixel)]/50 shrink-0">
                    <PixelCoin size={13} />
                    <span className="font-pixel-display text-[11.5px] text-[var(--accent-warning)] tabular-nums">
                      {entry.totalExp} EXP
                    </span>
                  </div>
                </ThemedPanelCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Party Roster */}
      <section className="space-y-2.5">
        <PixelSectionTitle
          title={`Party Roster (${partyMembers.length})`}
          subtitle="Daftar rekan petualang sekelas (urut abjad)"
        />
        <div className="space-y-2">
          {partyMembers.map((member, index) => {
            const isMe = member.id === hero.id;
            return (
              <ThemedPanelCard
                key={member.id}
                className={`p-3 flex items-center justify-between gap-2.5 ${
                  isMe ? 'ring-2 ring-[var(--accent-warning)]' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-pixel-display text-[11px] text-[var(--text-muted)] w-6 shrink-0 tabular-nums">
                    #{index + 1}
                  </span>
                  <PixelAvatar avatar={member.avatar} size={38} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">
                      {member.name} {isMe ? '(Kamu)' : ''}
                    </p>
                    <p className="text-[12px] text-[var(--text-secondary)] truncate">
                      {member.heroClass}{member.username ? ` · @${member.username}` : ''}
                    </p>
                  </div>
                </div>
                <span className="font-pixel-ui text-[10px] text-[var(--accent-success)] px-2 py-0.5 border border-[var(--accent-success)]/50 shrink-0 flex items-center gap-1">
                  <Trophy size={10} />
                  AKTIF
                </span>
              </ThemedPanelCard>
            );
          })}
        </div>
      </section>
    </div>
  );
};
