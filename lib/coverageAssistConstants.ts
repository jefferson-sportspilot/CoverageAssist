export type ArticleMode =
  | "player_article"
  | "game_recap"
  | "event_standouts"
  | "team_story"
  | "recruiting_report";

export const SLIDER_DEFS: Record<ArticleMode, string[]> = {
  player_article: [
    "athleticism",
    "skill_level",
    "basketball_iq",
    "coachability",
    "competitive_drive",
    "upside",
  ],
  game_recap: [
    "performance_level",
    "execution",
    "team_effort",
    "game_impact",
    "momentum_control",
  ],
  event_standouts: [
    "standout_score",
    "consistency",
    "clutch_factor",
    "projection",
    "overall_impression",
  ],
  team_story: [
    "team_cohesion",
    "execution",
    "coaching_quality",
    "talent_level",
    "competitive_level",
  ],
  recruiting_report: [
    "athleticism",
    "skill_level",
    "basketball_iq",
    "coachability",
    "competitive_drive",
    "upside",
  ],
};

export const SLIDER_LABELS: Record<string, string> = {
  athleticism: "Athleticism",
  skill_level: "Skill Level",
  basketball_iq: "Basketball IQ",
  coachability: "Coachability",
  competitive_drive: "Competitive Drive",
  upside: "Upside / Projection",
  performance_level: "Performance Level",
  execution: "Execution",
  team_effort: "Team Effort",
  game_impact: "Game Impact",
  momentum_control: "Momentum Control",
  standout_score: "Standout Score",
  consistency: "Consistency",
  clutch_factor: "Clutch Factor",
  projection: "Projection",
  overall_impression: "Overall Impression",
  team_cohesion: "Team Cohesion",
  coaching_quality: "Coaching Quality",
  talent_level: "Talent Level",
  competitive_level: "Competitive Level",
};

export const STYLE_PRESETS = [
  "Neutral Reporter",
  "Recruiting Analyst",
  "Scouting Breakdown",
  "Event Recap",
  "Player Spotlight",
  "High-Energy Feature",
  "Feature Story",
  "Professional Media",
  "Shortform Social",
  "Development-Focused",
  "Coach/Recruiter Brief",
] as const;

export const MODE_LABELS: Record<ArticleMode, string> = {
  player_article: "Player Article",
  game_recap: "Game Recap",
  event_standouts: "Event Standouts",
  team_story: "Team Story",
  recruiting_report: "Recruiting Report",
};

export const AUD_LABELS: Record<string, string> = {
  general_public: "General Audience",
  college_recruiters: "Recruiters",
  coaches: "Coaches",
  parents_players: "Parents",
  media_press: "Media",
  social_media: "Social",
};

/** Drives narrative arc for longform / ESPN-style structure (n8n + payload: story_spine). */
export const STORY_SPINE_OPTIONS = [
  ["stakes", "Stakes"],
  ["timeline", "Timeline"],
  ["matchup", "Matchup"],
  ["identity", "Identity"],
  ["legacy", "Legacy"],
  ["injury_subplot", "Injury / availability"],
] as const;

export type StorySpineId = (typeof STORY_SPINE_OPTIONS)[number][0];

/** Data-Skrive-style quick outputs from the same evaluation payload (n8n: quick_format). */
export const QUICK_FORMAT_OPTIONS = [
  ["full", "Full article"],
  ["recap_short", "Short recap"],
  ["preview_bullets", "Preview · bullets"],
  ["social_pack", "Social pack"],
] as const;

export type QuickFormatId = (typeof QUICK_FORMAT_OPTIONS)[number][0];

/**
 * Per-mode "template contract" for n8n: section order + rough word-share guidance.
 * Scales with the user's target word count; not a second CMS.
 */
export const MODE_ARTICLE_CONTRACTS: Record<
  ArticleMode,
  { sections: string[]; budgetNote: string }
> = {
  player_article: {
    budgetNote:
      "Scale each section to the target word count; avoid padding beyond evaluator notes and verified facts.",
    sections: [
      "Lede (~15–20%) — hook on primary angle; name player/team context from notes only.",
      "Body (~45–55%) —2–4 paragraphs of evidence from sliders + eval notes; at least one block anchored to Moment 1.",
      "Trajectory / fit (~15–25%) — upside, role, coachability; no new claims.",
      "Close (~10%) — one forward-looking line tied to notes.",
    ],
  },
  game_recap: {
    budgetNote:
      "Recap contract: outcome first; turning points from moments; stats only from provided lines/extras.",
    sections: [
      "Lede (~20%) — final score or outcome + one headline performer from notes.",
      "Flow (~40–50%) — 2–3 beats aligned with Moment anchors when present.",
      "Numbers (~15–25%) — stat line / STRUCTURED EXTRAS only; no invented box score.",
      "Close (~10%) — what’s next only if supported by notes.",
    ],
  },
  event_standouts: {
    budgetNote:
      "Event standouts: frame the event, then spotlight individuals without inventing performances.",
    sections: [
      "Scene (~15–20%) — what/where/when from event + evaluator context.",
      "Standouts (~50–55%) — 2–4 names or themes from notes/tags; tie to moments when listed.",
      "Evaluation tie-in (~20–25%) — what it means for projection/recruiting, grounded in sliders.",
      "Close (~10%) — one takeaway line.",
    ],
  },
  team_story: {
    budgetNote:
      "Team story: one thesis about the group; evidence from team + game notes.",
    sections: [
      "Thesis (~20%) — identity or stakes for this team (from team notes).",
      "Evidence (~45–50%) — chemistry, execution, coaching signals from notes only.",
      "Individuals (~15–25%) — only players named in notes; optional moment tie-ins.",
      "Close (~10%) — program direction if notes support it.",
    ],
  },
  recruiting_report: {
    budgetNote:
      "Recruiting report: concise snapshot; every trait claim traceable to evaluator input.",
    sections: [
      "Snapshot (~20%) — class/year/position/team as given.",
      "Strengths (~35–40%) — skills and athletic markers from sliders + notes.",
      "Development (~20–25%) — honest gaps; no invented offers or interest.",
      "Fit / close (~15–20%) — level-appropriate summary; no hype beyond data.",
    ],
  },
};

/** Plain-text block sent as `template_contract` for the automation prompt. */
export function formatModeTemplateContract(mode: ArticleMode): string {
  const c = MODE_ARTICLE_CONTRACTS[mode];
  const title = MODE_LABELS[mode];
  const lines = c.sections.map((s, i) => `${i + 1}. ${s}`);
  return `${title}\n${c.budgetNote}\n${lines.join("\n")}`;
}
