import React from 'react';
import { AcademyState, HeroStudent } from '../../types/lms';
import { PixelAvatar } from '../../components/PixelArt';
import {
  PixelEmptyChest,
  PixelSectionTitle,
} from '../../components/PixelUI';
import { getHeroLevelProgress, getHeroTotalExp } from '../../utils/exp';

interface HeroMyGuildProps {
  state: AcademyState;
  hero: HeroStudent;
}

export const HeroMyGuild: React.FC<HeroMyGuildProps> = ({ state, hero }) => {
  const dungeon = state.dungeons.find((d) => d.id === hero.dungeonId);
  const partyMembers = state.heroes
    .filter((h) => h.dungeonId === hero.dungeonId && h.active)
    .sort(
      (a, b) =>
        getHeroTotalExp(b.id, state.grades) -
        getHeroTotalExp(a.id, state.grades)
    );

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
        <section className="pixel-box p-4 space-y-2.5">
          <p className="font-pixel-ui text-[10px] text-[var(--accent-warning)]">
            {dungeon.guildCode} · {dungeon.tier}
          </p>
          <h3 className="font-pixel-display text-[14px] text-[var(--text-primary)]">
            {dungeon.name}
          </h3>
          <p className="font-pixel-body text-[18px] text-[var(--text-secondary)]">
            {dungeon.description}
          </p>
          <p className="font-pixel-body text-[16px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-pixel)]/40 tabular-nums">
            Kapasitas Guild: {partyMembers.length}/{dungeon.capacity} Heroes Aktif
          </p>
        </section>
      )}

      {/* Game Master Card */}
      <section className="space-y-2">
        <PixelSectionTitle title="Guild Master Pengampu" />
        <div className="pixel-box p-3.5 flex items-center gap-3">
          <PixelAvatar avatar={state.gmProfile.avatar} size={48} />
          <div className="min-w-0">
            <p className="font-pixel-ui text-[10px] text-[var(--accent-warning)]">
              GAME MASTER
            </p>
            <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)] truncate">
              {state.gmProfile.name}
            </h3>
            <p className="font-pixel-body text-[17px] text-[var(--text-secondary)] truncate">
              {state.gmProfile.title} · {state.gmProfile.specialty}
            </p>
          </div>
        </div>
      </section>

      {/* Party Roster */}
      <section className="space-y-2.5">
        <PixelSectionTitle
          title={`Party Roster (${partyMembers.length})`}
          subtitle="Urutan berdasarkan perolehan EXP"
        />
        <div className="space-y-2">
          {partyMembers.map((member, index) => {
            const exp = getHeroTotalExp(member.id, state.grades);
            const lvl = getHeroLevelProgress(exp);
            const isMe = member.id === hero.id;
            return (
              <div
                key={member.id}
                className={`pixel-box p-3 flex items-center justify-between gap-2.5 ${
                  isMe ? 'border-[var(--accent-warning)]' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-pixel-display text-[11px] text-[var(--text-muted)] w-6 tabular-nums">
                    #{index + 1}
                  </span>
                  <PixelAvatar avatar={member.avatar} size={38} />
                  <div className="min-w-0">
                    <p className="font-pixel-ui text-[11px] text-[var(--text-primary)] truncate">
                      {member.name} {isMe ? '(You)' : ''}
                    </p>
                    <p className="font-pixel-body text-[15px] text-[var(--text-secondary)] truncate">
                      {member.heroClass} · LV.{lvl.level}
                    </p>
                  </div>
                </div>
                <span className="font-pixel-ui text-[11px] text-[var(--accent-success)] tabular-nums shrink-0">
                  {exp} EXP
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
