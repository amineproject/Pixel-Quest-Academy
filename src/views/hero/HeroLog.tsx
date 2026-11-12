import React from 'react';
import {
  AcademyState,
  HeroStudent,
  UserRole,
} from '../../types/lms';
import { PixelRealmGlyph } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelExpBar,
  PixelFieldLabel,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import {
  formatRetroDate,
  getHeroLevelProgress,
  getHeroTotalExp,
  getRankFromScore,
} from '../../utils/exp';

interface HeroLogProps {
  state: AcademyState;
  hero: HeroStudent;
}

export const HeroLog: React.FC<HeroLogProps> = ({
  state,
  hero,
}) => {
  const heroGrades = state.grades.filter((g) => g.heroId === hero.id);
  const totalExp = getHeroTotalExp(hero.id, state.grades);
  const levelInfo = getHeroLevelProgress(totalExp);

  const avgScore =
    heroGrades.length > 0
      ? Math.round(
          heroGrades.reduce((sum, g) => sum + g.score, 0) / heroGrades.length
        )
      : 0;
  const overallRank = heroGrades.length > 0 ? getRankFromScore(avgScore) : '-';

  return (
    <div className="space-y-5">
      <PixelSectionTitle
        title="Hero Log / EXP & Stats"
        subtitle="Rapor nilai transparan sesuai Realm (Read-Only)"
      />

      {/* Overall Stats Card */}
      <section className="pixel-box p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="pixel-box-inset p-2.5">
            <p className="font-pixel-ui text-[9px] text-[var(--text-muted)]">
              TOTAL EXP
            </p>
            <p className="font-pixel-display text-[14px] text-[var(--accent-warning)] tabular-nums mt-1">
              {totalExp}
            </p>
          </div>
          <div className="pixel-box-inset p-2.5">
            <p className="font-pixel-ui text-[9px] text-[var(--text-muted)]">
              AVG SCORE
            </p>
            <p className="font-pixel-display text-[14px] text-[var(--accent-success)] tabular-nums mt-1">
              {avgScore}
            </p>
          </div>
          <div className="pixel-box-inset p-2.5">
            <p className="font-pixel-ui text-[9px] text-[var(--text-muted)]">
              RANK
            </p>
            <p className="font-pixel-display text-[14px] text-[var(--text-primary)] mt-1">
              {overallRank}
            </p>
          </div>
        </div>

        <PixelExpBar
          percent={levelInfo.percent}
          labelLeft={`Level ${levelInfo.level} · ${levelInfo.title}`}
          labelRight={`${levelInfo.expIntoLevel}/${levelInfo.expForNextLevel} EXP`}
          color="var(--accent-success)"
        />
      </section>

      {/* Grades Breakdown Grouped By Realm */}
      <section className="space-y-3">
        <PixelSectionTitle title="Rapor per Realm / Mapel" />

        {heroGrades.length === 0 ? (
          <PixelEmptyChest
            title="No EXP Loot Recorded!"
            description="Belum ada nilai tugas yang diterbitkan oleh Game Master untuk akun Hero ini."
          />
        ) : (
          state.realms.map((realm) => {
            const realmGrades = heroGrades.filter((g) => g.realmId === realm.id);
            if (realmGrades.length === 0) return null;
            const realmExp = realmGrades.reduce(
              (sum, g) => sum + g.expEarned,
              0
            );
            const realmAvg = Math.round(
              realmGrades.reduce((sum, g) => sum + g.score, 0) /
                realmGrades.length
            );

            return (
              <article key={realm.id} className="pixel-box p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelRealmGlyph
                      icon={realm.icon}
                      color={realm.accentColor}
                      size={24}
                    />
                    <div className="min-w-0">
                      <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)] truncate">
                        {realm.name}
                      </h3>
                      <p className="font-pixel-body text-[15px] text-[var(--text-muted)] tabular-nums">
                        Avg {realmAvg}/100 · Rank {getRankFromScore(realmAvg)}
                      </p>
                    </div>
                  </div>
                  <span className="font-pixel-ui text-[11px] text-[var(--accent-warning)] tabular-nums shrink-0">
                    +{realmExp} EXP
                  </span>
                </div>

                <div className="space-y-2.5">
                  {realmGrades.map((grade) => {
                    const quest = state.quests.find(
                      (q) => q.id === grade.questId
                    );
                    return (
                      <div
                        key={grade.id}
                        className="pixel-box-inset p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-pixel-ui text-[11px] text-[var(--text-primary)] truncate">
                            {quest?.title || 'Quest Evaluation'}
                          </p>
                          <span className="font-pixel-ui text-[11px] text-[var(--accent-success)] tabular-nums shrink-0">
                            {grade.score}/100 ({getRankFromScore(grade.score)})
                          </span>
                        </div>
                        <p className="font-pixel-body text-[15px] text-[var(--accent-warning)] tabular-nums">
                          +{grade.expEarned} EXP · Graded{' '}
                          {formatRetroDate(grade.gradedDate)}
                        </p>
                        {grade.feedback && (
                          <p className="font-pixel-body text-[16px] text-[var(--text-secondary)]">
                            GM Note: {grade.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
