import type { AppScope } from "../restrictions/schema.js";

const APP_LABELS: Record<string, string> = {
  "meta-fb": "Facebook",
  "meta-ig": "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  snapchat: "Snapchat",
  pinterest: "Pinterest",
};

/** Human label for the fake app header. `"*"` → generic "In-App Browser". */
function appLabel(app: AppScope): string {
  return app === "*" ? "In-App Browser" : (APP_LABELS[app] ?? "In-App Browser");
}

/**
 * Build a self-contained visual "in-app browser" chrome: a phone status bar, a
 * fake app header (✕ · site title/URL · ⋯) and a bottom toolbar (‹ › share
 * open), injected into the page so a manual tester *sees* they are inside an IAB
 * while the restrictions are active.
 *
 * This is PRESENTATION ONLY — it applies no restrictions itself — and is
 * injected as static markup by the integrations (unlike a restriction's
 * `emulate`, it is not serialized and has no self-contained constraint). Its
 * "Open in browser" / "Share" buttons deliberately hit the emulated
 * `window.open` / `navigator.share`, so tapping them fails just as in a real IAB.
 *
 * The returned string is `</script>`-safe (contains no literal closing tag).
 */
export function buildChromeOverlay(app: AppScope): string {
  const label = JSON.stringify(appLabel(app));
  return `<style>
#iab-emulator-chrome,#iab-emulator-chrome *{box-sizing:border-box;}
#iab-emulator-chrome{position:fixed;left:0;right:0;z-index:2147483646;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
#iab-emulator-chrome .iab-top{position:fixed;top:0;left:0;right:0;background:#fff;color:#050505;border-bottom:1px solid #dadde1;}
#iab-emulator-chrome .iab-bottom{position:fixed;bottom:0;left:0;right:0;height:44px;background:#fff;color:#050505;border-top:1px solid #dadde1;display:flex;align-items:center;justify-content:space-around;}
@media (prefers-color-scheme:dark){#iab-emulator-chrome .iab-top,#iab-emulator-chrome .iab-bottom{background:#242526;color:#e4e6eb;border-color:#3e4042;}}
#iab-emulator-chrome .iab-status{height:28px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:13px;font-weight:600;}
#iab-emulator-chrome .iab-glyphs{letter-spacing:1px;font-size:12px;}
#iab-emulator-chrome .iab-header{height:48px;display:flex;align-items:center;gap:8px;padding:0 10px;}
#iab-emulator-chrome .iab-id{flex:1;min-width:0;text-align:center;}
#iab-emulator-chrome .iab-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#iab-emulator-chrome .iab-host{font-size:11px;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#iab-emulator-chrome button{background:none;border:none;color:inherit;font-size:19px;line-height:1;padding:6px 10px;cursor:pointer;}
#iab-emulator-chrome .iab-badge{position:fixed;bottom:52px;right:10px;background:#1877f2;color:#fff;font-size:11px;font-weight:600;padding:3px 8px;border-radius:10px;opacity:.92;}
</style>
<div id="iab-emulator-chrome">
<div class="iab-top">
<div class="iab-status"><span id="iab-clock">9:41</span><span class="iab-glyphs">5G&nbsp;&nbsp;&#9645;&#9645;&#9645;&nbsp;&nbsp;100%</span></div>
<div class="iab-header"><button data-iab-act="close" aria-label="close">&#10005;</button><div class="iab-id"><div class="iab-title" id="iab-title">&nbsp;</div><div class="iab-host" id="iab-host">&nbsp;</div></div><button data-iab-act="more" aria-label="more">&#8943;</button></div>
</div>
<div class="iab-bottom"><button data-iab-act="back" aria-label="back">&#8249;</button><button data-iab-act="forward" aria-label="forward">&#8250;</button><button data-iab-act="share" aria-label="share">&#8613;</button><button data-iab-act="open" aria-label="open in browser">&#8599;</button></div>
<div class="iab-badge" id="iab-badge"></div>
</div>
<script data-iab-emulator-chrome>(function(){
var LABEL=${label},d=document,root=d.getElementById("iab-emulator-chrome");
function pad(n){return n<10?"0"+n:""+n;}
function tick(){var el=d.getElementById("iab-clock");if(el){var t=new Date();el.textContent=t.getHours()+":"+pad(t.getMinutes());}}
tick();setInterval(tick,20000);
var host=d.getElementById("iab-host");if(host){host.textContent=location.host;}
function title(){var el=d.getElementById("iab-title");if(el){el.textContent=d.title||LABEL;}}
title();setTimeout(title,600);
var badge=d.getElementById("iab-badge");if(badge){badge.textContent=LABEL+" \\u00b7 emulated";}
function pad2(){var top=root.querySelector(".iab-top"),bot=root.querySelector(".iab-bottom");if(d.body){if(top){d.body.style.paddingTop=top.offsetHeight+"px";}if(bot){d.body.style.paddingBottom=bot.offsetHeight+"px";}}}
if(d.body){pad2();}else{d.addEventListener("DOMContentLoaded",pad2);}
window.addEventListener("resize",pad2);
root.addEventListener("click",function(e){
var t=e.target,b=t&&t.closest?t.closest("[data-iab-act]"):null;if(!b){return;}
var act=b.getAttribute("data-iab-act");
if(act==="back"){history.back();}
else if(act==="forward"){history.forward();}
else if(act==="share"){try{if(navigator.share){navigator.share({url:location.href});}else{console.warn("[iab-emulator] navigator.share unavailable (as in a real IAB)");}}catch(err){}}
else if(act==="open"){var w=window.open(location.href,"_blank");if(!w){console.warn("[iab-emulator] 'Open in browser' blocked (as in a real IAB)");}}
else{console.warn("[iab-emulator] "+act+" is cosmetic in the emulator");}
});
})();</script>`;
}
