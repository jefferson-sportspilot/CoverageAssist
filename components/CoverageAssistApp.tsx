"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AUD_LABELS,
  MODE_LABELS,
  SLIDER_DEFS,
  SLIDER_LABELS,
  STYLE_PRESETS,
  type ArticleMode,
} from "@/lib/coverageAssistConstants";
import {
  callN8nWebhook,
  structuredArticleToString,
  type WebhookPayload,
} from "@/lib/webhook";

type LastArticle = {
  article?: string;
  headline?: string;
  mode?: string;
  stylePreset?: string;
  tone?: string;
  wordCount?: number;
  generatedAt?: string;
  hasStyleSample?: boolean;
  modeLabel?: string;
};

/** Defensive: coerce if state ever holds a non-string (e.g. legacy). */
function articleToString(value: unknown): string {
  return structuredArticleToString(value);
}

function initialSlidersForMode(m: ArticleMode): Record<string, number> {
  const defs = SLIDER_DEFS[m];
  const o: Record<string, number> = {};
  defs.forEach((k) => {
    o[k] = 7;
  });
  return o;
}

const PANEL_MIN = 56;
const PANEL_DEFAULT_LEFT = 270;
const PANEL_DEFAULT_RIGHT = 290;
const CENTER_MIN = 220;
const HANDLE_W = 6;

export function CoverageAssistApp() {
  const [mode, setMode] = useState<ArticleMode>("player_article");
  const [stylePreset, setStylePreset] = useState("Neutral Reporter");
  const [primaryAngle, setPrimaryAngle] = useState("breakout_performance");
  const [tone, setTone] = useState("analytical");
  const [audience, setAudience] = useState("general_public");
  const [confidence, setConfidence] = useState("moderate");
  const [wordCount, setWordCount] = useState(500);
  const [tags, setTags] = useState<string[]>([]);
  const [styleSample, setStyleSample] = useState("");
  const [styleSampleUrl, setStyleSampleUrl] = useState("");
  const [styleUrlInput, setStyleUrlInput] = useState("");
  const [styleUrlLoading, setStyleUrlLoading] = useState(false);
  const [serpContext, setSerpContext] = useState("");
  const [serpQuery, setSerpQuery] = useState("");
  const [serpLoading, setSerpLoading] = useState(false);
  const [sliders, setSliders] = useState<Record<string, number>>(() =>
    initialSlidersForMode("player_article")
  );

  const [playerName, setPlayerName] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [ageGrade, setAgeGrade] = useState("");
  const [eventName, setEventName] = useState("");
  const [publicationName, setPublicationName] = useState(
    "SportsPilot Scout Report"
  );
  const [evalNotes, setEvalNotes] = useState("");
  const [gameNotes, setGameNotes] = useState("");
  const [teamNotes, setTeamNotes] = useState("");
  const [stylePaste, setStylePaste] = useState("");

  const [lastArticle, setLastArticle] = useState<LastArticle | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [leftPanelWidth, setLeftPanelWidth] = useState(PANEL_DEFAULT_LEFT);
  const [rightPanelWidth, setRightPanelWidth] = useState(PANEL_DEFAULT_RIGHT);

  const [uploadActive, setUploadActive] = useState(false);
  const [uploadZoneTitle, setUploadZoneTitle] = useState("📄 Upload Writing Sample");
  const [uploadZoneDesc, setUploadZoneDesc] = useState(
    "Drag & drop or click — .txt, .doc, .docx — or load text from a link below\nAI will adopt this writer's voice and style"
  );
  const [uploadDragOver, setUploadDragOver] = useState(false);

  const [leftNotice, setLeftNotice] = useState("");
  const [loader, setLoader] = useState({
    active: false,
    title: "GENERATING",
    sub: "",
  });
  const [headlineOptions, setHeadlineOptions] = useState<string[]>([]);
  const [copyBtnLabel, setCopyBtnLabel] = useState("📋 Copy");
  const [generating, setGenerating] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState("");

  const styleFileRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const sliderKeys = SLIDER_DEFS[mode];

  const clampLeftWidth = useCallback((next: number, rightW: number) => {
    if (typeof window === "undefined") return next;
    const w = window.innerWidth;
    const max = Math.max(PANEL_MIN, w - rightW - HANDLE_W * 2 - CENTER_MIN);
    return Math.min(max, Math.max(PANEL_MIN, next));
  }, []);

  const clampRightWidth = useCallback((next: number, leftW: number) => {
    if (typeof window === "undefined") return next;
    const w = window.innerWidth;
    const max = Math.max(PANEL_MIN, w - leftW - HANDLE_W * 2 - CENTER_MIN);
    return Math.min(max, Math.max(PANEL_MIN, next));
  }, []);

  const onLeftResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startLeft = leftPanelWidth;
    const rightW = rightPanelWidth;
    let done = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      setLeftPanelWidth(clampLeftWidth(startLeft + dx, rightW));
    };
    const finish = (ev: PointerEvent) => {
      if (done) return;
      done = true;
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* already released */
      }
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("lostpointercapture", finish);
      document.body.classList.remove("panel-resizing");
    };
    document.body.classList.add("panel-resizing");
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", finish);
    document.addEventListener("lostpointercapture", finish);
  };

  const onRightResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startRight = rightPanelWidth;
    const leftW = leftPanelWidth;
    let done = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      setRightPanelWidth(clampRightWidth(startRight - dx, leftW));
    };
    const finish = (ev: PointerEvent) => {
      if (done) return;
      done = true;
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* already released */
      }
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("lostpointercapture", finish);
      document.body.classList.remove("panel-resizing");
    };
    document.body.classList.add("panel-resizing");
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", finish);
    document.addEventListener("lostpointercapture", finish);
  };

  const isPlayer = mode === "player_article" || mode === "recruiting_report";
  const isGame = mode === "game_recap";
  const isTeam = mode === "team_story";
  const isEvent = mode === "event_standouts";

  const notesLabel = isTeam
    ? "Team Evaluation Notes"
    : isGame
      ? "Game Evaluation Notes"
      : isEvent
        ? "Event Overview Notes"
        : "Evaluator Notes";

  const buildPayload = useCallback(
    (override?: WebhookPayload): WebhookPayload => {
      return {
        mode,
        player_name: playerName,
        position,
        team,
        age_grade: ageGrade,
        event_name: eventName,
        publication_name: publicationName || "SportsPilot Scout Report",
        evaluator_notes: evalNotes,
        game_notes: gameNotes,
        team_notes: teamNotes,
        standout_tags: tags,
        sliders,
        style_preset: stylePreset,
        primary_angle: primaryAngle,
        tone,
        audience,
        confidence,
        word_count: wordCount,
        style_sample: styleSample,
        style_sample_url: styleSampleUrl.trim(),
        serp_context: serpContext.trim(),
        ...override,
      };
    },
    [
      mode,
      playerName,
      position,
      team,
      ageGrade,
      eventName,
      publicationName,
      evalNotes,
      gameNotes,
      teamNotes,
      tags,
      sliders,
      stylePreset,
      primaryAngle,
      tone,
      audience,
      confidence,
      wordCount,
      styleSample,
      styleSampleUrl,
      serpContext,
    ]
  );

  const switchMode = (m: ArticleMode) => {
    setMode(m);
    setSliders((prev) => {
      const defs = SLIDER_DEFS[m];
      const next: Record<string, number> = {};
      defs.forEach((key) => {
        next[key] = prev[key] ?? 7;
      });
      return next;
    });
  };

  const updateSlider = (key: string, val: string) => {
    const n = parseInt(val, 10);
    setSliders((s) => ({ ...s, [key]: n }));
  };

  const addTag = () => {
    const input = tagInputRef.current;
    const val = input?.value.trim() ?? "";
    if (!val || tags.includes(val)) {
      if (input) input.value = "";
      return;
    }
    setTags((t) => [...t, val]);
    if (input) input.value = "";
  };

  const removeTag = (i: number) => {
    setTags((t) => t.filter((_, idx) => idx !== i));
  };

  const readFileAsText = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      setStyleSample(text);
      setStyleSampleUrl("");
      setUploadActive(true);
      setUploadZoneTitle("✅ Style Loaded");
      setUploadZoneDesc(`${file.name} — AI will mirror this voice`);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    readFileAsText(file);
  };

  const updateStyleFromPaste = (v: string) => {
    setStylePaste(v);
    setStyleSample(v);
    setStyleSampleUrl("");
  };

  const loadStyleFromUrl = async () => {
    const raw = styleUrlInput.trim();
    if (!raw) {
      setLeftNotice("Paste a valid http(s) URL for the style sample.");
      setTimeout(() => setLeftNotice(""), 5000);
      return;
    }
    setStyleUrlLoading(true);
    try {
      const res = await fetch("/api/style-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = (await res.json()) as { text?: string; error?: string; finalUrl?: string };
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const text = data.text ?? "";
      setStylePaste(text);
      setStyleSample(text);
      setStyleSampleUrl(data.finalUrl || raw);
      setUploadActive(true);
      setUploadZoneTitle("✅ Style loaded from URL");
      setUploadZoneDesc("Text extracted from the page — AI will mirror this voice");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLeftNotice(`⚠ URL load failed: ${msg}`);
      setTimeout(() => setLeftNotice(""), 8000);
    } finally {
      setStyleUrlLoading(false);
    }
  };

  const fetchSerpContext = async () => {
    const q = serpQuery.trim();
    if (!q) {
      setLeftNotice("Enter a search query for SerpAPI research.");
      setTimeout(() => setLeftNotice(""), 5000);
      return;
    }
    setSerpLoading(true);
    try {
      const res = await fetch("/api/serp-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || `SerpAPI failed (${res.status})`);
      }
      setSerpContext(data.text ?? "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLeftNotice(`⚠ Serp research failed: ${msg}`);
      setTimeout(() => setLeftNotice(""), 10000);
    } finally {
      setSerpLoading(false);
    }
  };

  const showLoader = (title: string, sub: string) => {
    setLoader({ active: true, title, sub });
  };
  const hideLoader = () => {
    setLoader((l) => ({ ...l, active: false }));
  };

  const generate = async () => {
    const notes = evalNotes.trim();
    const gNotes = gameNotes.trim();
    const tNotes = teamNotes.trim();
    if (!notes && !gNotes && !tNotes) {
      setLeftNotice("Add evaluator notes before generating.");
      setTimeout(() => setLeftNotice(""), 5000);
      return;
    }

    showLoader("GENERATING", "Building article from evaluation data…");
    setGenerating(true);
    try {
      const data = await callN8nWebhook(buildPayload());
      setLastArticle(data);
      setEditMode(false);
      setHeadlineOptions([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLeftNotice(`⚠ Generation failed: ${msg}`);
      setTimeout(() => setLeftNotice(""), 8000);
    } finally {
      hideLoader();
      setGenerating(false);
    }
  };

  const rewriteSection = async (
    section: "headline" | "intro" | "body" | "closing"
  ) => {
    if (!lastArticle) return;
    const article = articleToString(lastArticle.article);
    if (!article) return;
    const lines = article.split("\n").filter((l) => l.trim());
    let content = "";
    if (section === "headline") content = lines[0] || "";
    else if (section === "intro") content = lines.slice(1, 3).join("\n");
    else if (section === "body") content = lines.slice(3, lines.length - 1).join("\n");
    else if (section === "closing") content = lines[lines.length - 1] || "";

    showLoader("REWRITING", `Refining the ${section}…`);
    try {
      const data = await callN8nWebhook(
        buildPayload({
          section_rewrite: section,
          rewrite_content: content,
        })
      );
      const newPart = articleToString(data.article ?? "");
      if (section === "headline") {
        const rest = article.split("\n").slice(1).join("\n");
        setLastArticle({
          ...lastArticle,
          article: `${newPart}\n${rest}`,
          headline: newPart,
        });
      } else {
        setLastArticle({
          ...lastArticle,
          article: article.replace(content, newPart),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Rewrite failed: ${msg}`);
    } finally {
      hideLoader();
    }
  };

  const regenerateWithEdits = async () => {
    if (!lastArticle) return;
    const instructions = regenerateInstructions.trim();
    if (!instructions) {
      alert("Add what you want changed before regenerating.");
      return;
    }

    showLoader("REGENERATING", "Applying your edit instructions…");
    setGenerating(true);
    try {
      const data = await callN8nWebhook(
        buildPayload({
          section_rewrite: "full_article",
          rewrite_content: articleToString(lastArticle.article),
          regenerate_instructions: instructions,
          user_edit_instructions: instructions,
          revision_instructions: instructions,
        })
      );
      setLastArticle(data);
      setEditMode(false);
      setHeadlineOptions([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Regenerate failed: ${msg}`);
    } finally {
      hideLoader();
      setGenerating(false);
    }
  };

  const generateHeadlines = async () => {
    if (!lastArticle) return;
    showLoader("HEADLINES", "Generating headline options…");
    try {
      const data = await callN8nWebhook(
        buildPayload({
          section_rewrite: "headlines",
          rewrite_content:
            "Generate 4 alternative headline options for this article. Return ONLY 4 headlines, one per line, no numbering.",
          word_count: 60,
        })
      );
      const headlines = articleToString(data.article ?? "")
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 4);
      setHeadlineOptions(headlines);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not generate headlines: ${msg}`);
    } finally {
      hideLoader();
    }
  };

  const applyHeadline = (text: string) => {
    const current = articleToString(lastArticle?.article);
    if (!lastArticle || !current) return;
    const lines = current.split("\n");
    lines[0] = text;
    setLastArticle({
      ...lastArticle,
      article: lines.join("\n"),
      headline: text,
    });
  };

  const wordCountDisplay = lastArticle
    ? articleToString(lastArticle.article).split(/\s+/).filter(Boolean).length
    : 0;

  const evidenceSentences = useMemo(() => {
    const notes = evalNotes.trim();
    if (!notes) return [];
    return notes
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 15)
      .slice(0, 5)
      .map((s) => `${s.trim()}.`);
  }, [evalNotes]);

  const articleParts = useMemo(() => {
    if (!lastArticle) return null;
    const data = lastArticle;
    const lines = articleToString(data.article)
      .split("\n")
      .filter((l) => l.trim());
    const headline = data.headline || lines[0] || "";
    const body = lines.slice(1).join("\n").trim();
    const pub = publicationName || "SportsPilot Scout Report";
    const byline = `${pub}${playerName ? ` · ${playerName}` : ""}${eventName ? ` · ${eventName}` : ""}`;
    const metaPills = [
      (data.mode && MODE_LABELS[data.mode as ArticleMode]) || data.mode,
      data.stylePreset || stylePreset,
      data.wordCount ? `${data.wordCount} words` : "",
    ].filter(Boolean) as string[];
    return {
      headline,
      body,
      byline,
      metaPills,
      hasStyleSample: data.hasStyleSample,
    };
  }, [lastArticle, stylePreset, publicationName, playerName, eventName]);

  const copyArticle = () => {
    const text = articleToString(lastArticle?.article);
    if (!lastArticle || !text) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopyBtnLabel("✅ Copied");
      setTimeout(() => setCopyBtnLabel("📋 Copy"), 2000);
    });
  };

  const downloadArticle = () => {
    const txt = articleToString(lastArticle?.article);
    if (!lastArticle || !txt) return;
    const headline = lastArticle.headline || "article";
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coverageassist-${headline.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 40)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    if (!lastArticle) return;
    const art = lastArticle;
    const lines = articleToString(art.article)
      .split("\n")
      .filter((l) => l.trim());
    const headline = lines[0] || "Article";
    const body = lines.slice(1).join("\n\n");
    const pub = publicationName || "SportsPilot";
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${headline}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Outfit:wght@300;400&display=swap" rel="stylesheet"/>
<style>body{font-family:'Outfit',sans-serif;max-width:720px;margin:60px auto;padding:0 24px;color:#1a1a1a;line-height:1.8;}
h1{font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,42px);font-weight:900;line-height:1.15;margin-bottom:20px;}
.meta{font-size:12px;color:#888;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #e0e0e0;}
.body{font-size:17px;font-weight:300;white-space:pre-wrap;}
</style></head><body>
<h1>${headline}</h1>
<div class="meta">${pub} · ${art.modeLabel || ""} · ${art.stylePreset || ""} · ${art.wordCount || 0} words</div>
<div class="body">${body}</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coverageassist-${headline.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 40)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPlayerName("LeBron James");
    setPosition("Forward");
    setTeam("Los Angeles Lakers");
    setAgeGrade("NBA Veteran / Age 41");
    setEventName(
      "April 2026 NBA Playoff Push — Western Conference Race"
    );
    setPublicationName("SportsPilot Scout Report");
    setEvalNotes(
      "LeBron delivered another high-leverage performance as the playoff race tightened, " +
        "controlling tempo with deep-post orchestration and early-clock hit-ahead passing. " +
        "He finished with 30 points, 11 assists, and 8 rebounds while generating quality looks " +
        "for shooters out of spread pick-and-roll and elbow actions. In the fourth quarter, " +
        "he repeatedly hunted favorable matchups, forcing late help and creating corner threes " +
        "or paint touches on consecutive possessions. Beyond the box score, his communication " +
        "on defensive switches settled younger lineups and reduced transition breakdowns. " +
        "Areas to monitor: preserving burst across heavy minute loads and limiting live-ball " +
        "turnovers when defenses load two to the ball."
    );
    setTags([
      "Playoff Poise",
      "Half-Court Control",
      "Late-Game Shot Creation",
      "Leadership",
    ]);
    setSliders({
      athleticism: 8,
      skill_level: 10,
      basketball_iq: 10,
      coachability: 10,
      competitive_drive: 10,
      upside: 8,
    });
    setStylePreset("Recruiting Analyst");
    setAudience("college_recruiters");
    setConfidence("high");
    setWordCount(550);
    const paste =
      "In year twenty-plus, LeBron still manipulates a defense like a chess player on a fast clock: " +
      "one look-off to move the low man, one shoulder turn to freeze the nail defender, then a pass " +
      "that arrives before the help rotation has even decided who it belongs to.";
    setStylePaste(paste);
    setStyleSample(paste);
    setSerpQuery(
      "LeBron James April 2026 Lakers playoff push Western Conference standings"
    );
    setSerpContext(
      "Validation notes (April 2026):\n" +
        "- Lakers remained in a tight Western Conference playoff / play-in race entering the final week.\n" +
        "- LeBron James stayed central to late-season offensive creation and closing-lineup minutes.\n" +
        "- Western seeding volatility made nightly results highly consequential.\n" +
        "- Regular season endpoint around April 12; play-in starts around April 14; playoffs around April 18.\n" +
        "Source checkpoints:\n" +
        "- NBA.com playoff picture / standings updates\n" +
        "- Yahoo Sports April 5, 2026 playoff-picture report\n" +
        "- CBS Sports April 2026 playoff-picture tracker"
    );
  }, []);

  const rawArticleLines = articleToString(lastArticle?.article).split("\n");
  const editHeadlineVal = rawArticleLines[0] ?? "";
  const editBodyVal = rawArticleLines.slice(1).join("\n");

  return (
    <>
      <div
        className={`loading-overlay ${loader.active ? "active" : ""}`}
        id="loadingOverlay"
      >
        <div className="loader-ring" />
        <div className="loader-text" id="loaderText">
          {loader.title}
        </div>
        <div className="loader-sub" id="loaderSub">
          {loader.sub}
        </div>
      </div>

      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon">CA</div>
          <div>
            <div className="brand-name">
              Coverage<span>Assist</span>AI
            </div>
            <div className="brand-suite">
              SportsPilotAI Suite · Evaluation-to-Article Engine
            </div>
          </div>
        </div>
        <div className="topbar-mode-tabs">
          {(
            [
              ["player_article", "Player Article"],
              ["game_recap", "Game Recap"],
              ["event_standouts", "Event Standouts"],
              ["team_story", "Team Story"],
              ["recruiting_report", "Recruiting Report"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              className={`mode-tab ${mode === m ? "active" : ""}`}
              data-mode={m}
              onClick={() => switchMode(m)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="topbar-actions">
          <span className="topbar-pill live" id="sessionPill">
            SESSION READY
          </span>
          <span className="topbar-pill" id="modePill">
            {MODE_LABELS[mode].toUpperCase()}
          </span>
        </div>
      </header>

      <div
        className="workspace"
        style={{
          gridTemplateColumns: `${leftPanelWidth}px ${HANDLE_W}px 1fr ${HANDLE_W}px ${rightPanelWidth}px`,
        }}
      >
        <div className="panel-left" id="panelLeft">
          <div className="panel-section" id="section-player-info">
            <div className="panel-label">Player / Event Info</div>
            <div className="field">
              <label>Player Name</label>
              <input
                type="text"
                id="l-playerName"
                placeholder="First Last (no ID needed)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div
              className="field"
              id="field-position"
              style={{ display: isPlayer || isGame ? undefined : "none" }}
            >
              <label>Position</label>
              <input
                type="text"
                id="l-position"
                placeholder="e.g. Point Guard, Striker…"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Team / Club</label>
              <input
                type="text"
                id="l-team"
                placeholder="e.g. Westview Wolves"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              />
            </div>
            <div
              className="field"
              id="field-age"
              style={{ display: isPlayer ? undefined : "none" }}
            >
              <label>Age / Grade</label>
              <input
                type="text"
                id="l-age"
                placeholder="e.g. Grade 11 / 16 years old"
                value={ageGrade}
                onChange={(e) => setAgeGrade(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Event / Tournament</label>
              <input
                type="text"
                id="l-event"
                placeholder="e.g. Spring Showcase 2025"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Publication Name</label>
              <input
                type="text"
                id="l-pub"
                placeholder="e.g. SportsPilot Scout Report"
                value={publicationName}
                onChange={(e) => setPublicationName(e.target.value)}
              />
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label" id="notes-label">
              {notesLabel}
            </div>
            <div className="field">
              <textarea
                id="l-evalNotes"
                rows={5}
                placeholder="Describe performance, observations, strengths, areas for development. Ground all claims here — the AI will not hallucinate beyond these notes."
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
              />
            </div>
            <div
              className="field"
              id="field-gameNotes"
              style={{ display: isGame || isEvent ? undefined : "none" }}
            >
              <label>Game Notes</label>
              <textarea
                id="l-gameNotes"
                rows={3}
                placeholder="Score, key moments, turning points…"
                value={gameNotes}
                onChange={(e) => setGameNotes(e.target.value)}
              />
            </div>
            <div
              className="field"
              id="field-teamNotes"
              style={{ display: isTeam || isGame ? undefined : "none" }}
            >
              <label>Team Notes</label>
              <textarea
                id="l-teamNotes"
                rows={3}
                placeholder="Team identity, trends, key contributors…"
                value={teamNotes}
                onChange={(e) => setTeamNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">Standout Tags</div>
            <div className="tag-input-wrap">
              <input
                ref={tagInputRef}
                type="text"
                id="l-tagInput"
                placeholder="Add a standout quality…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button type="button" onClick={addTag}>
                +
              </button>
            </div>
            <div className="tags-list" id="tagsList">
              {tags.map((t, i) => (
                <div key={`${t}-${i}`} className="tag">
                  {t}
                  <button type="button" onClick={() => removeTag(i)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section" id="section-sliders">
            <div className="panel-label">Evaluation Sliders</div>
            <div className="slider-group" id="sliderGroup">
              {sliderKeys.map((key) => {
                const val = sliders[key] ?? 7;
                const pct = (val / 10) * 100;
                return (
                  <div key={key} className="slider-item">
                    <div className="slider-header">
                      <span className="slider-name">
                        {SLIDER_LABELS[key] || key}
                      </span>
                      <span className="slider-value" id={`sv-${key}`}>
                        {val}
                      </span>
                    </div>
                    <div className="slider-track">
                      <div
                        className="slider-fill"
                        id={`sf-${key}`}
                        style={{ width: `${pct}%` }}
                      />
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={val}
                        onChange={(e) => updateSlider(key, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel-section">
            <div className={`notice ${leftNotice ? "visible" : ""}`} id="leftNotice">
              {leftNotice}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--text3)",
                textAlign: "center",
                marginBottom: 8,
                letterSpacing: "0.04em",
                lineHeight: 1.6,
              }}
            >
              Richer notes → richer articles
              <br />
              Aim for 3+ sentences of evaluator notes
            </div>
            <button
              type="button"
              className="generate-btn"
              id="generateBtn"
              disabled={generating}
              onClick={() => void generate()}
            >
              GENERATE ARTICLE
            </button>
          </div>
        </div>

        <div
          className="panel-resize-handle panel-resize-handle--left"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize inputs panel"
          onPointerDown={onLeftResizePointerDown}
        />

        <div className="panel-center">
          <div className="article-toolbar">
            <div className="article-toolbar-left">
              <span className="article-meta-chip mode" id="toolbarMode">
                {MODE_LABELS[mode]}
              </span>
              <span className="article-meta-chip accent" id="toolbarStyle">
                {stylePreset}
              </span>
              <span className="article-meta-chip" id="toolbarAudience">
                {AUD_LABELS[audience] || audience}
              </span>
            </div>
            <div className="article-toolbar-right">
              {lastArticle ? (
                <>
                  <button
                    type="button"
                    className="toolbar-btn"
                    id="editToggleBtn"
                    onClick={() => setEditMode((e) => !e)}
                  >
                    {editMode ? "👁 Read Mode" : "✏️ Edit Mode"}
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    id="copyBtn"
                    onClick={copyArticle}
                  >
                    {copyBtnLabel}
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn primary"
                    id="dlBtn"
                    onClick={downloadArticle}
                  >
                    ⬇ Export
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="article-canvas-wrap" id="articleCanvas">
            {!lastArticle || !articleParts ? (
              <div className="article-empty" id="articleEmpty">
                <div className="article-empty-icon">📰</div>
                <h2>Article Canvas</h2>
                <p>
                  Select a mode, fill in your evaluation data and notes, then hit
                  Generate Article. Set word count to 500+ for ESPN-caliber depth.
                </p>
              </div>
            ) : editMode ? (
              <div>
                <textarea
                  className="article-headline-edit"
                  id="articleHeadlineEdit"
                  rows={2}
                  value={editHeadlineVal}
                  onChange={(e) => {
                    const h = e.target.value;
                    setLastArticle((prev) => {
                      if (!prev) return prev;
                      const b = articleToString(prev.article)
                        .split("\n")
                        .slice(1)
                        .join("\n");
                      return {
                        ...prev,
                        headline: h,
                        article: h ? `${h}\n${b}` : b,
                      };
                    });
                  }}
                />
                <div className="article-meta-bar">
                  <span className="article-byline">{articleParts.byline}</span>
                  {articleParts.metaPills.map((p, i) => (
                    <span key={i} className="article-meta-pill">
                      {p}
                    </span>
                  ))}
                  {articleParts.hasStyleSample ? (
                    <span
                      className="article-meta-pill"
                      style={{
                        borderColor: "var(--accent3)",
                        color: "var(--accent3)",
                      }}
                    >
                      Style-Trained
                    </span>
                  ) : null}
                </div>
                <textarea
                  className="article-body-edit"
                  id="articleBodyEdit"
                  value={editBodyVal}
                  onChange={(e) => {
                    const b = e.target.value;
                    setLastArticle((prev) => {
                      if (!prev) return prev;
                      const h =
                        articleToString(prev.article).split("\n")[0] ?? "";
                      return {
                        ...prev,
                        article: h ? `${h}\n${b}` : b,
                        headline: h,
                      };
                    });
                  }}
                />
              </div>
            ) : (
              <div>
                <div className="article-headline" id="articleHeadlineEl">
                  {articleParts.headline}
                </div>
                <div className="article-meta-bar">
                  <span className="article-byline">{articleParts.byline}</span>
                  {articleParts.metaPills.map((p, i) => (
                    <span key={i} className="article-meta-pill">
                      {p}
                    </span>
                  ))}
                  {articleParts.hasStyleSample ? (
                    <span
                      className="article-meta-pill"
                      style={{
                        borderColor: "var(--accent3)",
                        color: "var(--accent3)",
                      }}
                    >
                      Style-Trained
                    </span>
                  ) : null}
                </div>
                <div className="article-body" id="articleBodyDisplay">
                  {articleParts.body}
                </div>
              </div>
            )}
          </div>

          <div className="word-count-bar">
            <span id="wordCountDisplay">
              {lastArticle ? `${wordCountDisplay} words` : "— words"}
            </span>
            <span id="generatedAtDisplay" style={{ color: "var(--text3)" }}>
              {lastArticle?.generatedAt
                ? new Date(lastArticle.generatedAt).toLocaleTimeString()
                : "—"}
            </span>
            <span id="styleDisplay" style={{ color: "var(--text3)" }}>
              {lastArticle
                ? `${lastArticle.stylePreset || stylePreset} · ${lastArticle.tone || tone}`
                : "—"}
            </span>
          </div>
        </div>

        <div
          className="panel-resize-handle panel-resize-handle--right"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize style panel"
          onPointerDown={onRightResizePointerDown}
        />

        <div className="panel-right">
          <div className="right-section">
            <div className="panel-label">Style Preset</div>
            <div className="preset-grid" id="presetGrid">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`preset-btn ${stylePreset === p ? "active" : ""}`}
                  onClick={() => setStylePreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="right-section">
            <div className="panel-label">Primary Angle</div>
            <div className="chip-row" id="angleChips">
              {(
                [
                  ["breakout_performance", "Breakout"],
                  ["defensive_impact", "Defense"],
                  ["clutch_performance", "Clutch"],
                  ["floor_general_leadership", "Floor General"],
                  ["shooting_showcase", "Shooting"],
                  ["two_way_player", "Two-Way"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`chip ${primaryAngle === val ? "active" : ""}`}
                  data-angle={val}
                  onClick={() => setPrimaryAngle(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="right-section">
            <div className="panel-label">Tone</div>
            <div className="chip-row" id="toneChips">
              {(
                [
                  ["analytical", "Analytical"],
                  ["narrative", "Narrative"],
                  ["energetic", "Energetic"],
                  ["neutral", "Neutral"],
                  ["technical", "Technical"],
                  ["inspirational", "Inspire"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`chip tone ${tone === val ? "active" : ""}`}
                  data-tone={val}
                  onClick={() => setTone(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="right-section">
            <div className="panel-label">Audience</div>
            <div className="chip-row" id="audienceChips">
              {(
                [
                  ["general_public", "Public"],
                  ["college_recruiters", "Recruiters"],
                  ["coaches", "Coaches"],
                  ["parents_players", "Parents"],
                  ["media_press", "Media"],
                  ["social_media", "Social"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`chip ${audience === val ? "active" : ""}`}
                  data-aud={val}
                  onClick={() => setAudience(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="right-section">
            <div className="panel-label">Confidence Level</div>
            <div className="chip-row">
              {(
                [
                  ["high", "High"],
                  ["moderate", "Moderate"],
                  ["measured", "Measured"],
                  ["cautious", "Cautious"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`chip ${confidence === val ? "active" : ""}`}
                  data-conf={val}
                  onClick={() => setConfidence(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="right-section">
            <div className="panel-label">Target Word Count</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <input
                type="range"
                className="wc-slider"
                id="wcSlider"
                min={200}
                max={1200}
                step={25}
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value, 10))}
              />
              <span className="wc-display" id="wcDisplay">
                {wordCount}w
              </span>
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--text3)",
                lineHeight: 1.6,
                letterSpacing: "0.03em",
                borderTop: "1px solid var(--border)",
                paddingTop: 7,
                marginTop: 2,
              }}
            >
              <span style={{ color: "var(--accent3)" }}>ESPN REFERENCE</span>
              <br />
              Player Spotlight 450–700w · Recruiting 350–550w
              <br />
              Game Recap 500–900w · Event Standouts 500–700w
            </div>
          </div>

          <div className="right-section">
            <div className="panel-label">Style Sample Upload</div>
            <div
              className={`upload-zone ${uploadActive ? "upload-active" : ""} ${uploadDragOver ? "drag-over" : ""}`}
              id="uploadZone"
              onClick={() => styleFileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setUploadDragOver(true);
              }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={styleFileRef}
                type="file"
                id="styleFileInput"
                accept=".txt,.doc,.docx"
                onChange={handleFileUpload}
              />
              <strong id="uploadZoneTitle">{uploadZoneTitle}</strong>
              <p id="uploadZoneDesc" style={{ whiteSpace: "pre-line" }}>
                {uploadZoneDesc}
              </p>
            </div>
            <div style={{ marginTop: 6 }}>
              <div className="field">
                <label>Or Paste Sample Text</label>
                <textarea
                  id="stylePasteArea"
                  rows={3}
                  placeholder="Paste a paragraph of the target writing style here…"
                  value={stylePaste}
                  onChange={(e) => updateStyleFromPaste(e.target.value)}
                />
              </div>
              <div className="field" style={{ marginTop: 8 }}>
                <label>Or Load From Article URL</label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "stretch",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    value={styleUrlInput}
                    onChange={(e) => setStyleUrlInput(e.target.value)}
                    style={{ flex: "1 1 160px", minWidth: 0 }}
                  />
                  <button
                    type="button"
                    className="toolbar-btn primary"
                    disabled={styleUrlLoading}
                    onClick={() => void loadStyleFromUrl()}
                  >
                    {styleUrlLoading ? "Loading…" : "Load from URL"}
                  </button>
                </div>
                {styleSampleUrl ? (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text3)",
                      marginTop: 4,
                      wordBreak: "break-all",
                    }}
                  >
                    Source: {styleSampleUrl}
                  </div>
                ) : null}
              </div>
              <div className="field" style={{ marginTop: 10 }}>
                <label>SerpAPI — Web Research (optional)</label>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text3)",
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  Snippets are sent with your generation request for richer context. Set{" "}
                  <code style={{ fontSize: 9 }}>SERPAPI_KEY</code> in{" "}
                  <code style={{ fontSize: 9 }}>.env.local</code>. Treat as background
                  noise — facts in the article must still come from your evaluator notes.
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "stretch",
                    flexWrap: "wrap",
                    marginBottom: 6,
                  }}
                >
                  <input
                    type="search"
                    placeholder="Search query (e.g. NBA playoff race…)"
                    value={serpQuery}
                    onChange={(e) => setSerpQuery(e.target.value)}
                    style={{ flex: "1 1 160px", minWidth: 0 }}
                  />
                  <button
                    type="button"
                    className="toolbar-btn"
                    disabled={serpLoading}
                    onClick={() => void fetchSerpContext()}
                  >
                    {serpLoading ? "Fetching…" : "Fetch snippets"}
                  </button>
                </div>
                <textarea
                  id="serpContextArea"
                  rows={4}
                  placeholder="Search snippets appear here after you fetch. You can edit before generating."
                  value={serpContext}
                  onChange={(e) => setSerpContext(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div
            className="right-section"
            id="rewriteSection"
            style={{ display: lastArticle ? undefined : "none" }}
          >
            <div className="panel-label">Section Rewrite</div>
            <button
              type="button"
              className="rewrite-btn"
              onClick={() => void rewriteSection("headline")}
            >
              <span className="rb-icon">🎯</span> Rewrite Headline
            </button>
            <button
              type="button"
              className="rewrite-btn"
              onClick={() => void rewriteSection("intro")}
            >
              <span className="rb-icon">📝</span> Rewrite Opening
            </button>
            <button
              type="button"
              className="rewrite-btn"
              onClick={() => void rewriteSection("body")}
            >
              <span className="rb-icon">📰</span> Rewrite Body
            </button>
            <button
              type="button"
              className="rewrite-btn"
              onClick={() => void rewriteSection("closing")}
            >
              <span className="rb-icon">🔚</span> Rewrite Closing
            </button>
            <button
              type="button"
              className="rewrite-btn"
              onClick={() => void generateHeadlines()}
            >
              <span className="rb-icon">💡</span> Suggest Headlines
            </button>
          </div>

          <div
            className="right-section"
            id="headlineSuggestions"
            style={{ display: headlineOptions.length ? undefined : "none" }}
          >
            <div className="panel-label">Headline Options</div>
            <div id="headlineList">
              {headlineOptions.map((h, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  className="headline-option"
                  onClick={() => applyHeadline(h)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") applyHeadline(h);
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>

          <div
            className="right-section"
            id="evidenceSection"
            style={{ display: lastArticle ? undefined : "none" }}
          >
            <div className="panel-label">Source Evidence</div>
            <div id="evidenceList">
              {evidenceSentences.map((s, i) => (
                <div key={i} className="evidence-item">
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="right-section">
            <div className="panel-label">Export & Publish</div>
            <button
              type="button"
              className="export-btn copy"
              onClick={copyArticle}
            >
              📋 Copy to Clipboard
            </button>
            <button
              type="button"
              className="export-btn download"
              onClick={downloadArticle}
            >
              ⬇ Download .txt
            </button>
            <button
              type="button"
              className="export-btn download"
              onClick={downloadHTML}
            >
              🌐 Download .html
            </button>
          </div>

          <div
            className="right-section"
            style={{ display: lastArticle ? undefined : "none" }}
          >
            <div className="panel-label">Regenerate With Edits</div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>What do you want changed?</label>
              <textarea
                rows={3}
                placeholder="Example: Make it shorter, more coach-focused, less hype, and add clearer development points."
                value={regenerateInstructions}
                onChange={(e) => setRegenerateInstructions(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rewrite-btn"
              onClick={() => void regenerateWithEdits()}
              disabled={generating}
              style={{
                justifyContent: "center",
                fontWeight: 700,
                opacity: generating ? 0.6 : 1,
              }}
            >
              🔁 Regenerate Article
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
