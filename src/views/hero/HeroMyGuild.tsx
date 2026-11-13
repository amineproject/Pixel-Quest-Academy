import React from 'react';
import { AcademyState, HeroStudent } from '../../types/lms';
import { PixelAvatar } from '../../components/PixelArt';
import {
  PixelEmptyChest,
  PixelSectionTitle,
} from '../../components/PixelUI';
import { getHeroEffectiveRealmIds } from '../../utils/exp';

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

  return (
    <div className="space-y-5">
      <PixelSectionTitle
        title="My Guild / Party"
        subtitle="Informasi ruang kelas dan rekan petualang (Read-Only)"
      />

      {!dungeon ? (
        <PixelEmptyChest
          title="No Guild Assigned!"
          description="Akun Hero Anda belum terhubung dengan Dungeon manapun."
        />
      ) : (
        <section className="pixel-box p-4 space-y-2.5 overflow-hidden">
          <p className="font-pixel-ui text-[10px] text-[var(--accent-warning)] break-words">
            {dungeon.guildCode} · {dungeon.tier}
          </p>
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
            {dungeon.name}
          </h3>
          {dungeon.description && (
            <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
              {dungeon.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="font-pixel-ui text-[9px] text-[var(--accent-warning)] uppercase">
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
        </section>
      )}

      {/* Game Master Card */}
      <section className="space-y-2">
        <PixelSectionTitle title="Guild Master Pengampu" />
        <div className="pixel-box p-3.5 flex items-center gap-3 overflow-hidden">
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
        </div>
      </section>

      {/* Party Roster (No points/EXP displayed) */}
      <section className="space-y-2.5">
        <PixelSectionTitle
          title={`Party Roster (${partyMembers.length})`}
          subtitle="Daftar rekan petualang sekelas (urut abjad)"
        />
        <div className="space-y-2">
          {partyMembers.map((member, index) => {
            const isMe = member.id === hero.id;
            return (
              <div
                key={member.id}
                className={`pixel-box p-3 flex items-center justify-between gap-2.5 overflow-hidden ${
                  isMe ? 'border-[var(--accent-warning)]' : ''
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
                      {member.heroClass}
                    </p>
                  </div>
                </div>
                <span className="font-pixel-ui text-[9px] text-[var(--accent-success)] px-2 py-0.5 border border-[var(--accent-success)]/50 shrink-0">
                  AKTIF
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
