import { ImageResponse, loadGoogleFont } from "workers-og";

let fontsPromise = null;
const fonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      loadGoogleFont({ family: "Fraunces", weight: 500 }),
      loadGoogleFont({ family: "Fraunces", weight: 900 }),
      loadGoogleFont({ family: "JetBrains Mono", weight: 500 }),
    ]).then(([medium, black, mono]) => [
      { name: "Fraunces", data: medium, weight: 500, style: "normal" },
      { name: "Fraunces", data: black, weight: 900, style: "normal" },
      { name: "JetBrains Mono", data: mono, weight: 500, style: "normal" },
    ]);
  }
  return fontsPromise;
};

const fitAnswer = (text) => {
  const sized = Math.floor(1060 / Math.max(text.length, 3) / 0.78);
  return Math.min(280, sized);
};

export const onRequest = async (ctx) => {
  const url = new URL(ctx.request.url);
  const p = url.searchParams;
  const day = (p.get("day") || "").trim();
  const answer = (p.get("answer") || "YES").toUpperCase();
  const emoji = p.get("emoji") || "";
  const accent = p.get("color") || "#16a34a";
  const fg = p.get("qcolor") || "#1a1a1a";
  const bg = p.get("bg") || "#fafaf7";

  const answerSize = fitAnswer(answer);
  const questionNode = day
    ? `<div style="display:flex;font-size:64px;font-weight:500;line-height:1.1;letter-spacing:-0.005em;">Is it ${day} day today?</div>`
    : `<div style="display:flex;align-items:baseline;gap:18px;font-size:64px;font-weight:500;line-height:1.1;letter-spacing:-0.005em;">
        <span>Is it</span>
        <span style="opacity:0.38;">?</span>
        <span>day today?</span>
      </div>`;

  const html = `
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:${bg};color:${fg};font-family:Fraunces;padding:50px 60px 36px;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;">
        ${emoji ? `<div style="display:flex;font-size:120px;line-height:1;margin-bottom:20px;">${emoji}</div>` : ""}
        ${questionNode}
        <div style="display:flex;font-size:${answerSize}px;font-weight:900;line-height:0.92;color:${accent};letter-spacing:-0.04em;margin-top:28px;">${answer}</div>
      </div>
      <div style="display:flex;justify-content:center;font-family:'JetBrains Mono';font-size:16px;font-weight:500;opacity:0.5;letter-spacing:0.22em;">ISTHATDAY.TODAY</div>
    </div>
  `;

  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: await fonts(),
    emoji: "twemoji",
  });
  response.headers.set("cache-control", "public, max-age=31536000, immutable");
  return response;
};
