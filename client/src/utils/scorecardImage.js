// Generates a shareable "Wrapped"-style scorecard image using the native Canvas API.
// No external dependencies — draws directly to an offscreen canvas and returns a PNG blob/URL.

const ROLE_LABELS = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  devops: "DevOps Engineer",
  datascience: "Data Scientist",
  dsa: "DSA / Algorithms",
  hr: "HR Interview",
  aiml: "AI / ML Engineer",
  security: "Security Engineer",
  data: "Data Analyst",
};

const VERDICT_COLORS = {
  Excellent:    { accent: "#22c55e", glow: "rgba(34,197,94,0.35)" },
  Good:         { accent: "#00e5ff", glow: "rgba(0,229,255,0.35)" },
  Average:      { accent: "#f59e0b", glow: "rgba(245,158,11,0.35)" },
  "Needs Work": { accent: "#ef4444", glow: "rgba(239,68,68,0.35)" },
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/**
 * Draws a shareable scorecard and returns a Promise<Blob> (PNG).
 * @param {{ role: string, difficulty: string, score: number, verdict: string, userName: string, date: Date }} data
 */
export const generateScorecardImage = (data) => {
  return new Promise((resolve) => {
    const W = 1080, H = 1350; // 4:5 — ideal for LinkedIn / Instagram
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const { role, difficulty, score, verdict, userName, date } = data;
    const roleLabel = ROLE_LABELS[role] || role?.toUpperCase() || "Interview";
    const colors = VERDICT_COLORS[verdict] || VERDICT_COLORS["Needs Work"];

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(1, "#0d1420");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Ambient glow orbs ──
    const glow1 = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, 420);
    glow1.addColorStop(0, "rgba(0,245,160,0.18)");
    glow1.addColorStop(1, "transparent");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(W * 0.1, H * 0.9, 0, W * 0.1, H * 0.9, 380);
    glow2.addColorStop(0, colors.glow);
    glow2.addColorStop(1, "transparent");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // ── Grid texture ──
    ctx.strokeStyle = "rgba(255,255,255,0.025)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // ── Brand tag ──
    ctx.fillStyle = "rgba(0,245,160,0.1)";
    roundRect(ctx, 80, 80, 230, 46, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,245,160,0.3)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 80, 80, 230, 46, 8);
    ctx.stroke();
    ctx.fillStyle = "#00f5a0";
    ctx.font = "700 22px Arial";
    ctx.textBaseline = "middle";
    ctx.fillText("AI INTERVIEW", 100, 104);

    // ── Headline ──
    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 56px Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${userName || "Candidate"}'s`, 80, 230);
    ctx.fillText("Interview Wrapped", 80, 295);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "400 28px Arial";
    ctx.fillText(roleLabel, 80, 345);

    // ── Giant score ring ──
    const cx = W / 2, cy = 660, r = 230;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 26;
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (score / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 130px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${score}`, cx, cy - 10);
    ctx.font = "600 36px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("OUT OF 100", cx, cy + 75);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // ── Verdict badge ──
    ctx.font = "700 38px Arial";
    const verdictText = verdict.toUpperCase();
    const vw = ctx.measureText(verdictText).width;
    const badgeW = vw + 80, badgeX = (W - badgeW) / 2, badgeY = 940;
    ctx.fillStyle = colors.glow;
    roundRect(ctx, badgeX, badgeY, badgeW, 76, 38);
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    roundRect(ctx, badgeX, badgeY, badgeW, 76, 38);
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(verdictText, W / 2, badgeY + 40);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // ── Footer info row ──
    const footY = 1120;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, footY); ctx.lineTo(W - 80, footY); ctx.stroke();

    const drawFootStat = (x, label, value) => {
      ctx.fillStyle = "#64748b";
      ctx.font = "600 22px Arial";
      ctx.fillText(label.toUpperCase(), x, footY + 50);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 32px Arial";
      ctx.fillText(value, x, footY + 90);
    };
    drawFootStat(80, "Difficulty", (difficulty || "medium").charAt(0).toUpperCase() + (difficulty || "medium").slice(1));
    drawFootStat(420, "Date", new Date(date || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
    drawFootStat(760, "Mode", "AI Mock");

    // ── Bottom branding ──
    ctx.fillStyle = "#475569";
    ctx.font = "500 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Practiced with AI Interview Platform", W / 2, H - 60);
    ctx.textAlign = "left";

    canvas.toBlob((blob) => resolve({ blob, dataUrl: canvas.toDataURL("image/png") }), "image/png", 1);
  });
};

export const downloadScorecardImage = async (data, filename = "interview-scorecard.png") => {
  const { blob } = await generateScorecardImage(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Attempts native share (mobile/share-capable browsers); falls back to download.
 */
export const shareScorecardImage = async (data, shareText) => {
  const { blob } = await generateScorecardImage(data);
  const file = new File([blob], "interview-scorecard.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "My AI Interview Scorecard",
        text: shareText || "Check out my AI mock interview score!",
      });
      return { method: "share" };
    } catch (err) {
      if (err.name === "AbortError") return { method: "cancelled" };
      // fall through to download
    }
  }

  await downloadScorecardImage(data);
  return { method: "download" };
};