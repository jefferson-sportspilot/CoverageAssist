import type { ArticleMode, QuickFormatId, StorySpineId } from "./coverageAssistConstants";

/** Everything needed to repopulate the form + canvas from a saved run (demo data for now). */
export type ArticleTemplateSnapshot = {
  mode: ArticleMode;
  stylePreset: string;
  primaryAngle: string;
  tone: string;
  audience: string;
  confidence: string;
  wordCount: number;
  quickFormat: QuickFormatId;
  tags: string[];
  playerName: string;
  position: string;
  team: string;
  ageGrade: string;
  eventName: string;
  publicationName: string;
  evalNotes: string;
  gameNotes: string;
  teamNotes: string;
  storySpine: StorySpineId;
  momentAnchor1: string;
  momentAnchor2: string;
  momentAnchor3: string;
  statLine: string;
  verifiedFacts: string;
  structuredExtras: string;
  quote1: string;
  quote2: string;
  quote3: string;
  espnDepthMode: boolean;
  voicePunch: number;
  voiceAnalytics: number;
  voiceScene: number;
  sliders: Record<string, number>;
  headline: string;
  /** Full plain-text article (headline should match first line or headline field). */
  article: string;
};

export type ArticleHistoryEntry = {
  id: string;
  title: string;
  /** Short line: mode, preset, word count, date (display only). */
  metaLine: string;
  /** One-line preview for the list. */
  excerpt: string;
  snapshot: ArticleTemplateSnapshot;
};

const P1_BODY = `Morgan Chen did not need a loud night to steer Northside past Riverside, 58–52, in a game that felt closer than the final margin. The junior guard finished with 17 points, 6 assists, and 4 rebounds, but the stat line undersells how often the offense breathed through her hands in the half court.

The first turning point came late in the second quarter, when Chen rejected a lazy skip pass and pushed tempo, finding the trailing shooter for a corner three that erased a seven-point deficit. From there Northside’s pace settled: fewer empty dribbles, more early seals on the block, and Chen reading the tag on ball screens well enough to keep Riverside’s big from camping in the paint.

Defensively, Chen’s positioning on closeouts stood out. She contested without fouling, forced a handful of contested twos, and helped Northside limit Riverside to one field goal over the final four minutes. There are still growth edges—occasional over-help when the weak-side shooter lifted—but the competitive temperament was unmistakable.

Northside improves to 14–4 in league play with two home dates left. Chen’s steadiness suggests she can shoulder more late-clock creation as the bracket tightens—without the offense grinding to a halt.`;

const P1 = `Chen’s Quiet Command Powers Northside Past Riverside

${P1_BODY}`;

const G1_BODY = `HARTFORD — Eastview outlasted Central 71–66 in overtime on Saturday, leaning on a 12–2 run in the extra period after Central tied the game on a contested three with 4.1 seconds left in regulation.

Eastview led by as many as 11 in the third quarter before Central’s pressure forced six turnovers in four minutes. The hosts answered with offensive rebounds and second-chance points, trimming the margin to one possession entering the fourth.

The decisive stretch belonged to Eastview’s frontcourt, which scored eight points in the paint in overtime without a single turnover. Central’s final three possessions ended in a blocked layup, a travel, and a rushed baseline jumper.

Eastview (18–5) travels to Mercer Tuesday. Central (16–7) hosts Westbrook Thursday.`;

const G1 = `Eastview Edges Central in Overtime After Late Rally

${G1_BODY}`;

const T1_BODY = `The Westbrook girls program has spent the season learning how to win ugly. Tuesday’s 49–44 win over Lakeside was another chapter: shaky shooting early, stubborn defense late, and a bench unit that refused to let the lead evaporate when starters sat with foul trouble.

What stood out was communication. Rotations arrived on time, help defenders pointed drivers to the baseline, and the team’s “next play” body language stayed steady through a six-minute scoring drought. That is coaching culture showing up as habit, not heroics.

Westbrook does not have the region’s flashiest scorer, but it has a clear identity: contest everything, gang-rebound, and make you execute in the half court. If the shooting variance improves even slightly in March, this group becomes a bracket problem—not because it blows teams out, but because it does not beat itself.`;

const T1 = `Westbrook Finds an Identity in the Grind

${T1_BODY}`;

const S1_BODY = `TWEET: Tonight’s takeaway: defense travels. Westbrook held Lakeside to 44 on the road and closed on a 9–2 run. #hsbb

THREAD 1: First half was ugly offensively (cold from three), but the rotations were loud—help was early, rebounding was a committee job.

THREAD 2: Key stretch: starters in foul trouble, bench steadied the lead without turnovers. That’s culture.

THREAD 3: Next up: home stand. If shooting normalizes, this team’s floor is high because the defense doesn’t beat itself.

CAPTION 1: Road win. Defense set the tone.

CAPTION 2: Bench minutes mattered in the fourth.

CAPTION 3: Identity > hype.`;

const S1 = `Social pack — Westbrook @ Lakeside (demo)

${S1_BODY}`;

export const ARTICLE_HISTORY_TEMPLATES: ArticleHistoryEntry[] = [
  {
    id: "demo-player-feature",
    title: "Chen’s Quiet Command (player feature)",
    metaLine:
      "Player article · Professional Media · ~420 words · Demo — Mar 28, 2026",
    excerpt:
      "Morgan Chen did not need a loud night to steer Northside past Riverside…",
    snapshot: {
      mode: "player_article",
      stylePreset: "Professional Media",
      primaryAngle: "floor_general_leadership",
      tone: "analytical",
      audience: "media_press",
      confidence: "high",
      wordCount: 640,
      quickFormat: "full",
      tags: ["Poise", "Half-court command", "Defensive IQ"],
      playerName: "Morgan Chen",
      position: "Guard",
      team: "Northside HS",
      ageGrade: "Junior",
      eventName: "Northside vs Riverside — League play",
      publicationName: "SportsPilot Scout Report",
      evalNotes:
        "Calm pace-setter who improved Northside’s shot quality in the half court. Strong closeouts and communication; occasional over-help when weak-side lifted. Clutch rebounding from the guard spot in the fourth.",
      gameNotes: "Northside 58–52 Riverside. Key8–0 run late Q2 after tempo push.",
      teamNotes: "",
      storySpine: "stakes",
      momentAnchor1:
        "Q2 1:40 — steal in passing lane, push for corner three to cut deficit to 2",
      momentAnchor2:
        "Q4 5:10 — rejected drive, forced contested two, no foul",
      momentAnchor3: "Final 2:00 — offensive board chain on three consecutive misses",
      statLine: "17 PTS · 6 AST · 4 REB · 2 STL · 31 MIN",
      verifiedFacts:
        "Northside 14–4 league · Chen averaging 15.2 PPG entering week",
      structuredExtras: "",
      quote1: "",
      quote2: "",
      quote3: "",
      espnDepthMode: true,
      voicePunch: 6,
      voiceAnalytics: 7,
      voiceScene: 5,
      sliders: {
        athleticism: 7,
        skill_level: 8,
        basketball_iq: 9,
        coachability: 8,
        competitive_drive: 8,
        upside: 7,
      },
      headline: "Chen’s Quiet Command Powers Northside Past Riverside",
      article: P1,
    },
  },
  {
    id: "demo-game-recap",
    title: "Eastview edges Central (game recap)",
    metaLine: "Game recap · Event Recap · ~230 words · Demo — Mar 22, 2026",
    excerpt:
      "HARTFORD — Eastview outlasted Central 71–66 in overtime on Saturday…",
    snapshot: {
      mode: "game_recap",
      stylePreset: "Event Recap",
      primaryAngle: "clutch_performance",
      tone: "neutral",
      audience: "general_public",
      confidence: "moderate",
      wordCount: 520,
      quickFormat: "recap_short",
      tags: ["Overtime", "Paint scoring", "Turnovers"],
      playerName: "",
      position: "",
      team: "Eastview",
      ageGrade: "",
      eventName: "Eastview vs Central — Regional Saturday",
      publicationName: "SportsPilot Scout Report",
      evalNotes: "",
      gameNotes:
        "Eastview 71–66 OT. Central tied at buzzer on contested three. Eastview 12–2 in OT. Key: paint points +0 TO in OT for Eastview.",
      teamNotes: "",
      storySpine: "timeline",
      momentAnchor1: "Regulation: Central three at 4.1s to force OT",
      momentAnchor2: "OT: 8–0 paint run for Eastview",
      momentAnchor3: "Final possessions: block, travel, contested miss",
      statLine: "Eastview 18–5 · Central 16–7",
      verifiedFacts: "Next: Eastview at Mercer Tue; Central hosts Westbrook Thu",
      structuredExtras: "Final 71–66 OT",
      quote1: "",
      quote2: "",
      quote3: "",
      espnDepthMode: false,
      voicePunch: 5,
      voiceAnalytics: 6,
      voiceScene: 6,
      sliders: {
        performance_level: 8,
        execution: 7,
        team_effort: 8,
        game_impact: 7,
        momentum_control: 8,
      },
      headline: "Eastview Edges Central in Overtime After Late Rally",
      article: G1,
    },
  },
  {
    id: "demo-team-story",
    title: "Westbrook identity (team story)",
    metaLine: "Team story · Neutral Reporter · ~280 words · Demo — Mar 15, 2026",
    excerpt:
      "The Westbrook girls program has spent the season learning how to win ugly…",
    snapshot: {
      mode: "team_story",
      stylePreset: "Neutral Reporter",
      primaryAngle: "defensive_impact",
      tone: "narrative",
      audience: "coaches",
      confidence: "measured",
      wordCount: 550,
      quickFormat: "full",
      tags: ["Identity", "Defense", "Rebounding"],
      playerName: "",
      position: "",
      team: "Westbrook",
      ageGrade: "",
      eventName: "Westbrook vs Lakeside",
      publicationName: "SportsPilot Scout Report",
      evalNotes: "",
      gameNotes: "Westbrook 49–44. Cold shooting stretch mid-game; defense held.",
      teamNotes:
        "Program emphasis: communication, gang rebounding, next-play demeanor. Bench steadied lead when starters in foul trouble.",
      storySpine: "identity",
      momentAnchor1: "Third quarter: six-minute drought survived via defense",
      momentAnchor2: "Fourth: 9–2 close with limited turnovers",
      momentAnchor3: "Bench stint: no giveaways, lead preserved",
      statLine: "",
      verifiedFacts: "Westbrook improves in league standings (demo)",
      structuredExtras: "",
      quote1: "",
      quote2: "",
      quote3: "",
      espnDepthMode: true,
      voicePunch: 4,
      voiceAnalytics: 6,
      voiceScene: 7,
      sliders: {
        team_cohesion: 9,
        execution: 7,
        coaching_quality: 8,
        talent_level: 6,
        competitive_level: 8,
      },
      headline: "Westbrook Finds an Identity in the Grind",
      article: T1,
    },
  },
  {
    id: "demo-social-pack",
    title: "Social pack — Westbrook (quick output demo)",
    metaLine: "Team story · Shortform Social · Social pack · Demo — Mar 15, 2026",
    excerpt: "TWEET: Tonight’s takeaway: defense travels…",
    snapshot: {
      mode: "team_story",
      stylePreset: "Shortform Social",
      primaryAngle: "two_way_player",
      tone: "energetic",
      audience: "social_media",
      confidence: "high",
      wordCount: 280,
      quickFormat: "social_pack",
      tags: ["Defense", "Bench", "Close"],
      playerName: "",
      position: "",
      team: "Westbrook",
      ageGrade: "",
      eventName: "@ Lakeside",
      publicationName: "SportsPilot Scout Report",
      evalNotes: "",
      gameNotes: "49–44 road win. Same notes as team story template.",
      teamNotes: "Use for social-only output shape; facts match team story demo.",
      storySpine: "identity",
      momentAnchor1: "Defense set tone on the road",
      momentAnchor2: "Bench steadied fourth",
      momentAnchor3: "9–2 closing run",
      statLine: "49–44",
      verifiedFacts: "Road win; defense-first identity",
      structuredExtras: "",
      quote1: "",
      quote2: "",
      quote3: "",
      espnDepthMode: false,
      voicePunch: 8,
      voiceAnalytics: 4,
      voiceScene: 5,
      sliders: {
        team_cohesion: 8,
        execution: 7,
        coaching_quality: 7,
        talent_level: 6,
        competitive_level: 8,
      },
      headline: "Social pack — Westbrook @ Lakeside (demo)",
      article: S1,
    },
  },
];
