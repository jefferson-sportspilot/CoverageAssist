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
