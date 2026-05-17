import { ImageResponse, loadGoogleFont } from "workers-og";

let fontsPromise = null;
const fonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      loadGoogleFont({ family: "Inter", weight: 500 }),
      loadGoogleFont({ family: "Inter", weight: 900 }),
    ]).then(([medium, black]) => [
      { name: "Inter", data: medium, weight: 500, style: "normal" },
      { name: "Inter", data: black, weight: 900, style: "normal" },
    ]);
  }
  return fontsPromise;
};

const fitAnswer = (text) => {
  const max = 280;
  const charWidth = 0.78;
  const usable = 1060;
  const sized = Math.floor(usable / Math.max(text.length, 3) / charWidth);
  return Math.min(max, sized);
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

  const question = day ? `Is it ${day} day today?` : "Is it ___ day today?";
  const answerSize = fitAnswer(answer);
  const answerTracking = -Math.round(answerSize * 0.035);

  const html = `
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:${bg};color:${fg};font-family:Inter;padding:50px 60px 36px;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;">
        ${emoji ? `<div style="display:flex;font-size:120px;line-height:1;margin-bottom:20px;">${emoji}</div>` : ""}
        <div style="display:flex;font-size:60px;font-weight:500;line-height:1;">${question}</div>
        <div style="display:flex;font-size:${answerSize}px;font-weight:900;line-height:0.95;color:${accent};letter-spacing:${answerTracking}px;margin-top:24px;">${answer}</div>
      </div>
      <div style="display:flex;justify-content:center;font-size:22px;font-weight:500;opacity:0.42;letter-spacing:0.02em;">isthatday.today</div>
    </div>
  `;

  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: await fonts(),
    emoji: "twemoji",
  });
};
