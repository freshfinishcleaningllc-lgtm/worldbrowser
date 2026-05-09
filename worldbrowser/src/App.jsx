import { useState, useRef, useEffect } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// In production this hits /.netlify/functions/ai (API key stays hidden)
// In local dev with "netlify dev" it also works automatically
const API_URL = "/.netlify/functions/ai";

const LANGS = const LANGS = ["English","Spanish","French","Portuguese","Swahili","Arabic","Hindi","Bengali","Hausa","Amharic","Yoruba","Zulu","Chinese","Indonesian","Russian","Urdu","Vietnamese"];
const NAV = [
  {id:"home",icon:"🏠",label:"Home"},{id:"search",icon:"🔍",label:"Search"},
  {id:"news",icon:"📰",label:"News"},{id:"learn",icon:"🎓",label:"Learn"},
  {id:"health",icon:"❤️",label:"Health"},{id:"tools",icon:"🛠️",label:"Tools"},
  {id:"market",icon:"🛒",label:"Market"},{id:"connect",icon:"🤝",label:"Community"},
];
const QUICK_TOPICS = [
  {icon:"🌾",label:"Farming",q:"best farming techniques for small farms in developing countries"},
  {icon:"💊",label:"Medicine",q:"common illness symptoms and home treatment advice"},
  {icon:"📚",label:"Education",q:"free education resources and online learning platforms"},
  {icon:"💧",label:"Water",q:"how to purify water and find clean water sources"},
  {icon:"⚡",label:"Solar",q:"affordable solar energy solutions for homes"},
  {icon:"💼",label:"Business",q:"how to start a small business with little money"},
  {icon:"🍽️",label:"Nutrition",q:"affordable nutritious foods for families"},
  {icon:"🌦️",label:"Weather",q:"how to predict weather for farming"},
  {icon:"📱",label:"Technology",q:"how to use technology to improve life"},
  {icon:"🏗️",label:"Building",q:"affordable house building materials and methods"},
  {icon:"🐄",label:"Livestock",q:"how to raise chickens cows and goats"},
  {icon:"💰",label:"Money",q:"how to save money and build financial security"},
];
const NEWS_CATS = ["World","Africa","Asia","Americas","Health","Science","Farming","Business","Technology","Environment"];
const LEARN_COURSES = [
  {icon:"➕",title:"Basic Math",desc:"Numbers, addition, subtraction, multiplication",level:"Beginner"},
  {icon:"🔤",title:"Reading & Writing",desc:"Literacy skills for all ages",level:"Beginner"},
  {icon:"🌱",title:"Crop Science",desc:"Soil, seeds, irrigation, pest control",level:"Beginner"},
  {icon:"💻",title:"Using a Phone",desc:"Apps, internet, staying safe online",level:"Beginner"},
  {icon:"💰",title:"Money Skills",desc:"Saving, budgeting, loans, banking",level:"Intermediate"},
  {icon:"🏥",title:"First Aid",desc:"Emergencies, wounds, CPR, childbirth",level:"Intermediate"},
  {icon:"☀️",title:"Solar Energy",desc:"Install and maintain solar panels",level:"Intermediate"},
  {icon:"🐔",title:"Poultry Farming",desc:"Chickens, eggs, disease prevention, selling",level:"Advanced"},
];
const HEALTH_SYMPTOMS = ["Fever","Headache","Stomach pain","Cough","Diarrhea","Skin rash","Eye problem","Chest pain","Back pain","Pregnancy question"];
const TOOLS_LIST = [
  {id:"calc",icon:"🔢",label:"Calculator"},{id:"convert",icon:"📏",label:"Units"},
  {id:"translate",icon:"🌐",label:"Translate"},{id:"weather",icon:"🌤️",label:"Weather"},
  {id:"emergency",icon:"🚨",label:"Emergency"},{id:"currency",icon:"💱",label:"Currency"},
];
const MARKET_CATS = ["🌾 Crops","🐄 Animals","🛠️ Tools","👗 Clothes","🏠 Housing","💊 Medicine","📱 Electronics","🚗 Transport"];

// ─── DAILY LIMIT ─────────────────────────────────────────────────────────────
const DAILY_LIMIT = 9999
const getTodayKey = () => `wb_searches_${new Date().toDateString()}`;
const getSearchCount = () => parseInt(localStorage.getItem(getTodayKey()) || "0");
const bumpSearchCount = () => {
  const c = getSearchCount() + 1;
  localStorage.setItem(getTodayKey(), String(c));
  return c;
};

// ─── AI CALL ─────────────────────────────────────────────────────────────────
const callAI = async (prompt, system) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: system || "You are a helpful AI. Be concise and practical. Use simple words.",
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "No response.";
};

// ─── FORMAT RESPONSE ─────────────────────────────────────────────────────────
const fmt = (text, fs) =>
  text.split("\n").filter(l => l.trim()).map((line, i) => {
    const c = line.replace(/\*\*/g, "");
    if (line.match(/^\*\*.*\*\*$/) || line.startsWith("## "))
      return <h3 key={i} style={{ color: "#ffd166", margin: "12px 0 4px", fontSize: "1em", fontWeight: 700 }}>{c.replace(/^#+\s/, "")}</h3>;
    if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* "))
      return <div key={i} style={{ display: "flex", gap: "9px", margin: "5px 0", alignItems: "flex-start", fontSize: fs }}>
        <span style={{ color: "#06d6a0", flexShrink: 0, marginTop: "3px" }}>▸</span>
        <span style={{ lineHeight: 1.7 }}>{c.replace(/^[-•*]\s/, "")}</span>
      </div>;
    if (line.match(/^\d+\./))
      return <div key={i} style={{ display: "flex", gap: "9px", margin: "6px 0", alignItems: "flex-start", fontSize: fs }}>
        <span style={{ background: "#06d6a0", color: "#073b4c", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", flexShrink: 0, fontWeight: 800 }}>{line.match(/^(\d+)/)[1]}</span>
        <span style={{ lineHeight: 1.7 }}>{c.replace(/^\d+\.\s/, "")}</span>
      </div>;
    return <p key={i} style={{ margin: "6px 0", lineHeight: 1.75, fontSize: fs }}>{c}</p>;
  });

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("wb_lang") || "English");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("wb_history") || "[]"); } catch { return []; } });
  const [simple, setSimple] = useState(() => localStorage.getItem("wb_simple") !== "false");
  const [fs, setFs] = useState(() => localStorage.getItem("wb_fs") || "0.9rem");
  const [searches, setSearches] = useState(getSearchCount);
  const [newsCat, setNewsCat] = useState("World");
  const [newsResult, setNewsResult] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [learnTopic, setLearnTopic] = useState(null);
  const [learnResult, setLearnResult] = useState(null);
  const [learnLoading, setLearnLoading] = useState(false);
  const [healthSym, setHealthSym] = useState([]);
  const [healthResult, setHealthResult] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [toolActive, setToolActive] = useState("calc");
  const [calcVal, setCalcVal] = useState("");
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [transInput, setTransInput] = useState("");
  const [transFrom, setTransFrom] = useState("English");
  const [transTo, setTransTo] = useState("Swahili");
  const [transResult, setTransResult] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const [weatherCity, setWeatherCity] = useState("");
  const [weatherResult, setWeatherResult] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [convertVal, setConvertVal] = useState("");
  const [convertFrom, setConvertFrom] = useState("kg");
  const [convertTo, setConvertTo] = useState("lb");
  const [convertResult, setConvertResult] = useState("");
  const [marketCat, setMarketCat] = useState("🌾 Crops");
  const [marketPost, setMarketPost] = useState({ title: "", price: "" });
  const [marketListings, setMarketListings] = useState([
    { title: "Fresh Maize 50kg", price: "$12", seller: "John K.", loc: "Nairobi", icon: "🌽" },
    { title: "2 Goats for sale", price: "$85", seller: "Amara B.", loc: "Accra", icon: "🐐" },
    { title: "Solar panel 100W", price: "$45", seller: "Ravi P.", loc: "Mumbai", icon: "☀️" },
    { title: "Hand plow tool", price: "$8", seller: "Pedro S.", loc: "São Paulo", icon: "🛠️" },
  ]);
  const [communityPosts, setCommunityPosts] = useState([
    { user: "Fatima A.", loc: "Lagos", msg: "My tomatoes are turning yellow. Anyone know why?", likes: 14, replies: 6, time: "2h ago" },
    { user: "Chen W.", loc: "Chengdu", msg: "Found a great way to store rainwater for dry season — ask me how!", likes: 32, replies: 11, time: "5h ago" },
    { user: "Maria G.", loc: "Bogotá", msg: "Free reading lessons every Sunday at my house. All welcome.", likes: 28, replies: 4, time: "1d ago" },
  ]);
  const [newPost, setNewPost] = useState("");
  const [listening, setListening] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const inputRef = useRef(null);
  const resultRef = useRef(null);

  // Persist preferences
  useEffect(() => { localStorage.setItem("wb_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("wb_simple", String(simple)); }, [simple]);
  useEffect(() => { localStorage.setItem("wb_fs", fs); }, [fs]);
  useEffect(() => { if (history.length) localStorage.setItem("wb_history", JSON.stringify(history.slice(0, 20))); }, [history]);

  // PWA install prompt
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); setInstallPrompt(e); });
  }, []);

  useEffect(() => {
    if (result && resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const checkLimit = () => {
    if (searches >= DAILY_LIMIT) {
      return false;
    }
    const c = bumpSearchCount();
    setSearches(c);
    return true;
  };

  const aiSearch = async (q) => {
    const sq = q || query;
    if (!sq.trim()) return;
    if (!checkLimit()) { setResult(`⏳ You've used all ${DAILY_LIMIT} free searches for today. Come back tomorrow — it resets at midnight!`); return; }
    setLoading(true); setResult(null);
    const sys = simple
      ? `Answer in ${lang}. Very simple words, short sentences. Summary first, then bullets, then one action tip. Under 280 words.`
      : `Answer in ${lang}. Thorough, well-structured. Use web search.`;
    try {
      const r = await callAI(sq, sys);
      setResult(r);
      setHistory(h => [{ q: sq, r, t: new Date().toLocaleTimeString() }, ...h.slice(0, 19)]);
    } catch (e) {
      setResult("⚠️ Connection error. Please check your internet and try again.");
    }
    setLoading(false);
  };

  const fetchNews = async (cat) => {
    setNewsLoading(true); setNewsResult(null);
    const c = cat || newsCat;
    try {
      const r = await callAI(`Give me 5 important ${c} news stories from today. For each: headline, 2-sentence summary, why it matters. Answer in ${lang}.`, "You are a news summarizer. Use web search. Be factual and neutral.");
      setNewsResult(r);
    } catch { setNewsResult("⚠️ Could not fetch news."); }
    setNewsLoading(false);
  };

  const fetchLesson = async (course) => {
    setLearnTopic(course); setLearnLoading(true); setLearnResult(null);
    try {
      const r = await callAI(`Teach me about "${course.title}". Give a beginner lesson: key concepts, 3 practical tips, a simple exercise I can do today. Answer in ${lang}. Simple words.`, "You are a patient teacher.");
      setLearnResult(r);
    } catch { setLearnResult("⚠️ Could not load lesson."); }
    setLearnLoading(false);
  };

  const checkHealth = async () => {
    if (!healthSym.length) return;
    setHealthLoading(true); setHealthResult(null);
    try {
      const r = await callAI(`I have: ${healthSym.join(", ")}. What might this be? What should I do at home? When to see a doctor? Answer in ${lang}.`, "You are a health advisor. Give practical advice. Always recommend seeing a doctor for serious conditions.");
      setHealthResult(r);
    } catch { setHealthResult("⚠️ Could not analyze symptoms."); }
    setHealthLoading(false);
  };

  const doTranslate = async () => {
    if (!transInput.trim()) return;
    setTransLoading(true);
    try {
      const r = await callAI(`Translate from ${transFrom} to ${transTo}: "${transInput}". Return ONLY the translation.`, "You are a translator. Return ONLY the translated text.");
      setTransResult(r);
    } catch { setTransResult("Translation failed."); }
    setTransLoading(false);
  };

  const doWeather = async () => {
    if (!weatherCity.trim()) return;
    setWeatherLoading(true); setWeatherResult(null);
    try {
      const r = await callAI(`Current weather in ${weatherCity}: temperature, conditions, forecast 3 days. Answer in ${lang}.`, "You are a weather assistant. Use web search.");
      setWeatherResult(r);
    } catch { setWeatherResult("⚠️ Could not get weather."); }
    setWeatherLoading(false);
  };

  const doConvert = () => {
    const v = parseFloat(convertVal); if (isNaN(v)) return;
    const map = { "kg→lb": v * 2.205, "lb→kg": v / 2.205, "km→mi": v * 0.621, "mi→km": v * 1.609, "L→gal": v * 0.264, "gal→L": v * 3.785, "m→ft": v * 3.281, "ft→m": v / 3.281, "°C→°F": v * 9 / 5 + 32, "°F→°C": (v - 32) * 5 / 9, "ha→ac": v * 2.471, "ac→ha": v / 2.471 };
    const res = map[`${convertFrom}→${convertTo}`];
    setConvertResult(res !== undefined ? `${v} ${convertFrom} = ${res.toFixed(3)} ${convertTo}` : "Conversion not available");
  };

  const voiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice not supported. Please try Chrome.");
    const r = new SR();
    r.lang = lang === "Spanish" ? "es-ES" : lang === "French" ? "fr-FR" : lang === "Arabic" ? "ar-SA" : lang === "Hindi" ? "hi-IN" : lang === "Swahili" ? "sw-KE" : lang === "Portuguese" ? "pt-BR" : "en-US";
    r.onstart = () => setListening(true);
    r.onresult = e => { setQuery(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };

  const calcPress = (v) => {
    if (v === "=") { try { setCalcDisplay(String(eval(calcVal) || 0)); } catch { setCalcDisplay("Err"); } }
    else if (v === "C") { setCalcVal(""); setCalcDisplay("0"); }
    else if (v === "⌫") { const s = calcVal.slice(0, -1); setCalcVal(s); setCalcDisplay(s || "0"); }
    else { const s = calcVal + v; setCalcVal(s); setCalcDisplay(s); }
  };

  // ── STYLE CONSTANTS ──
  const C = { bg: "#040d1a", card: "rgba(255,255,255,0.04)", border: "rgba(6,214,160,0.2)", accent: "#06d6a0", gold: "#ffd166", red: "#ef476f", blue: "#118ab2" };
  const card = { background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, padding: "14px" };
  const pw = { minHeight: "calc(100vh - 120px)", padding: "14px 13px 86px" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{-webkit-text-size-adjust:100%;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#06d6a0;border-radius:2px;}
        input,select,button,textarea{font-family:inherit;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3);}
        input:focus,textarea:focus,select:focus{outline:2px solid rgba(6,214,160,0.5)!important;}
        .nb{transition:all 0.18s;-webkit-tap-highlight-color:transparent;cursor:pointer;}
        .nb:hover,.nb.act{background:rgba(6,214,160,0.1)!important;color:#06d6a0!important;}
        .nb:active{transform:scale(0.94);}
        .cb{transition:all 0.18s;-webkit-tap-highlight-color:transparent;cursor:pointer;}
        .cb:hover{transform:translateY(-2px);border-color:rgba(6,214,160,0.4)!important;background:rgba(6,214,160,0.07)!important;}
        .cb:active{transform:scale(0.96);}
        .ab{transition:all 0.15s;-webkit-tap-highlight-color:transparent;cursor:pointer;}
        .ab:hover{opacity:0.82;} .ab:active{transform:scale(0.95);}
        .kc{transition:all 0.1s;-webkit-tap-highlight-color:transparent;cursor:pointer;}
        .kc:hover{filter:brightness(1.25);} .kc:active{transform:scale(0.9);}
        .ch{transition:all 0.15s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .ch:hover,.ch.s{background:rgba(6,214,160,0.14)!important;border-color:#06d6a0!important;color:#06d6a0!important;}
        .ph{transition:background 0.15s;}
        .ph:hover{background:rgba(255,255,255,0.06)!important;}
        @keyframes fu{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pl{0%,100%{opacity:1;}50%{opacity:0.25;}}
        @keyframes sp{to{transform:rotate(360deg);}}
        @keyframes gl{0%,100%{box-shadow:0 0 18px rgba(6,214,160,0.08);}50%{box-shadow:0 0 38px rgba(6,214,160,0.22);}}
        @keyframes bl{0%,100%{opacity:1;}50%{opacity:0.15;}}
        .fd{animation:fu 0.38s ease forwards;}
        .pl{animation:pl 1.3s ease-in-out infinite;}
        .sp{animation:sp 0.65s linear infinite;display:inline-block;}
        .gl{animation:gl 2.5s ease-in-out infinite;}
        .bl{animation:bl 0.75s ease-in-out infinite;}
        @media(max-width:599px){.donly{display:none!important;}}
        @media(min-width:600px){.monly{display:none!important;}}
        @media(prefers-reduced-motion:reduce){.fd,.pl,.sp,.gl,.bl{animation:none!important;}}
      `}</style>

      {/* BG blobs */}
      <div style={{ position: "fixed", top: "-100px", right: "-100px", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle,rgba(6,214,160,0.05),transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "12%", left: "-90px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,209,102,0.04),transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── HEADER ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(4,13,26,0.96)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", padding: "9px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.35rem", filter: "drop-shadow(0 0 8px rgba(6,214,160,0.5))" }}>🌍</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: "0.98rem", background: "linear-gradient(135deg,#06d6a0,#ffd166)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>WorldBrowser</div>
            <div style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.32)", letterSpacing: "1.5px" }}>AI · FREE · GLOBAL</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="donly" style={{ display: "flex", gap: "1px" }}>
          {NAV.map(n => <button key={n.id} className={`nb${page === n.id ? " act" : ""}`} onClick={() => setPage(n.id)} style={{ background: "transparent", border: "none", borderRadius: "8px", padding: "5px 9px", color: page === n.id ? C.accent : "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: page === n.id ? 700 : 400, display: "flex", alignItems: "center", gap: "4px" }}>
            <span>{n.icon}</span><span>{n.label}</span>
          </button>)}
        </nav>

        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {/* Font size */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "2px", gap: "1px" }}>
            {[["S", "0.8rem"], ["M", "0.9rem"], ["L", "1.05rem"]].map(([l, v]) => <button key={l} className="ab" onClick={() => setFs(v)} style={{ background: fs === v ? "rgba(6,214,160,0.18)" : "transparent", border: "none", borderRadius: "6px", padding: "3px 7px", color: fs === v ? C.accent : "rgba(255,255,255,0.38)", fontSize: "0.62rem", fontWeight: fs === v ? 700 : 400 }}>{l}</button>)}
          </div>
          {/* Install button */}
          {installPrompt && <button className="ab" onClick={handleInstall} style={{ background: "rgba(6,214,160,0.15)", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "4px 9px", color: C.accent, fontSize: "0.65rem", fontWeight: 700, whiteSpace: "nowrap" }}>📲 Install</button>}
          {/* Searches left */}
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{DAILY_LIMIT - searches} left</span>
        </div>
      </header>

      {/* ── PAGES ── */}
      <div style={{ maxWidth: "880px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* HOME */}
        {page === "home" && <div style={pw} className="fd">
          <div style={{ textAlign: "center", marginBottom: "20px", paddingTop: "6px" }}>
            <div style={{ fontSize: "2.8rem", filter: "drop-shadow(0 0 18px rgba(6,214,160,0.35))" }}>🌍</div>
            <h1 style={{ fontWeight: 900, fontSize: "clamp(1.3rem,5vw,2rem)", background: "linear-gradient(135deg,#06d6a0,#ffd166)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "7px 0 4px", lineHeight: 1.2 }}>WorldBrowser AI</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", maxWidth: "380px", margin: "0 auto", lineHeight: 1.6 }}>The world's most powerful free browser — built for everyone, everywhere.</p>
          </div>

          {/* Search */}
          <div style={{ ...card, marginBottom: "14px", borderColor: "rgba(6,214,160,0.3)", background: "rgba(6,214,160,0.03)" }} className="gl">
            <div style={{ display: "flex", gap: "6px", marginBottom: "9px", flexWrap: "wrap", alignItems: "center" }}>
              <select value={lang} onChange={e => setLang(e.target.value)} style={{ background: "rgba(6,214,160,0.1)", border: `1px solid ${C.border}`, borderRadius: "7px", color: "#fff", padding: "4px 7px", fontSize: "0.76rem", cursor: "pointer" }}>
                {LANGS.map(l => <option key={l} value={l} style={{ background: "#040d1a" }}>{l}</option>)}
              </select>
              <button className="ab" onClick={() => setSimple(!simple)} style={{ background: simple ? "rgba(6,214,160,0.12)" : "transparent", border: `1px solid ${C.border}`, borderRadius: "18px", padding: "4px 10px", color: simple ? C.accent : "rgba(255,255,255,0.45)", fontSize: "0.68rem" }}>
                {simple ? "✅ Simple" : "📖 Full"}
              </button>
              <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: "rgba(255,255,255,0.28)" }}>🔋 {DAILY_LIMIT - searches}/{DAILY_LIMIT} searches today</span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && aiSearch()} placeholder="Ask anything in the world..." style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "11px 12px", color: "#fff", fontSize: fs, minWidth: 0 }} autoComplete="off" />
              <button className="ab" onClick={voiceSearch} style={{ background: listening ? "rgba(239,71,111,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${listening ? "#ef476f" : C.border}`, borderRadius: "9px", padding: "11px 12px", color: "#fff" }}><span className={listening ? "bl" : ""}>🎤</span></button>
              <button className="ab" onClick={() => aiSearch()} disabled={loading} style={{ background: "linear-gradient(135deg,#06d6a0,#08b38a)", border: "none", borderRadius: "9px", padding: "11px 15px", color: "#073b4c", fontWeight: 800, minWidth: "44px" }}>
                {loading ? <span className="sp">⟳</span> : "🔍"}
              </button>
            </div>
          </div>

          {loading && <div className="fd" style={{ textAlign: "center", padding: "34px 0" }}>
            <div style={{ fontSize: "2.4rem" }} className="pl">🌐</div>
            <div style={{ color: C.gold, fontWeight: 700, marginTop: "9px", fontSize: "0.9rem" }}>Searching the world for you...</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "7px", marginTop: "12px" }}>{[0, 1, 2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accent, animation: `pl 1.2s ${i * 0.25}s ease-in-out infinite` }} />)}</div>
          </div>}

          {result && !loading && <div className="fd" ref={resultRef}>
            <div style={{ ...card, borderColor: "rgba(6,214,160,0.28)", marginBottom: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "5px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: C.gold }}>✨ AI Answer — {lang}</span>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button className="ab" onClick={() => navigator.clipboard?.writeText(result)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "7px", padding: "3px 9px", color: "#fff", fontSize: "0.68rem" }}>📋</button>
                  <button className="ab" onClick={() => { setResult(null); setQuery(""); }} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "7px", padding: "3px 9px", color: "#fff", fontSize: "0.68rem" }}>🔄 New</button>
                </div>
              </div>
              {fmt(result, fs)}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && aiSearch()} placeholder="Ask a follow-up..." style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "10px 12px", color: "#fff", fontSize: fs, minWidth: 0 }} />
              <button className="ab" onClick={() => aiSearch()} style={{ background: "linear-gradient(135deg,#06d6a0,#08b38a)", border: "none", borderRadius: "9px", padding: "10px 15px", color: "#073b4c", fontWeight: 800 }}>Ask</button>
            </div>
          </div>}

          {!result && !loading && <div className="fd">
            <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.38)", letterSpacing: "1.2px", marginBottom: "7px" }}>EXPLORE TOPICS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "14px" }}>
              {QUICK_TOPICS.map(t => (
                <button key={t.label} className="cb" onClick={() => { setQuery(t.q); aiSearch(t.q); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "11px", padding: "9px 5px", color: "#fff", textAlign: "center", minHeight: "58px" }}>
                  <div style={{ fontSize: "1.2rem" }}>{t.icon}</div>
                  <div style={{ fontSize: "0.62rem", fontWeight: 600, marginTop: "3px", color: "rgba(255,255,255,0.65)" }}>{t.label}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {["🌐 12 Languages", "🎤 Voice", "📰 Live News", "🎓 8 Courses", "❤️ Health AI", "🛒 Marketplace", "🤝 Community", "🛠️ 6 Tools"].map(b => (
                <span key={b} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: "18px", padding: "3px 8px", fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{b}</span>
              ))}
            </div>
          </div>}
        </div>}

        {/* SEARCH */}
        {page === "search" && <div style={pw} className="fd">
          <h2 style={{ fontWeight: 800, fontSize: "1rem", color: C.gold, marginBottom: "13px" }}>🔍 AI Search Engine</h2>
          <div style={{ ...card, marginBottom: "11px" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "9px", flexWrap: "wrap" }}>
              <select value={lang} onChange={e => setLang(e.target.value)} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", color: "#fff", padding: "5px 7px", fontSize: "0.76rem", cursor: "pointer" }}>
                {LANGS.map(l => <option key={l} value={l} style={{ background: "#040d1a" }}>{l}</option>)}
              </select>
              <button className="ab" onClick={() => setSimple(!simple)} style={{ background: simple ? "rgba(6,214,160,0.1)" : "transparent", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "5px 10px", color: simple ? C.accent : "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>{simple ? "✅ Simple" : "📖 Full"}</button>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && aiSearch()} placeholder="Search anything..." style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "11px 12px", color: "#fff", fontSize: fs, minWidth: 0 }} autoComplete="off" />
              <button className="ab" onClick={voiceSearch} style={{ background: listening ? "rgba(239,71,111,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "11px 12px", color: "#fff" }}><span className={listening ? "bl" : ""}>🎤</span></button>
              <button className="ab" onClick={() => aiSearch()} disabled={loading} style={{ background: "linear-gradient(135deg,#06d6a0,#08b38a)", border: "none", borderRadius: "9px", padding: "11px 16px", color: "#073b4c", fontWeight: 800 }}>{loading ? <span className="sp">⟳</span> : "Go"}</button>
            </div>
          </div>
          {loading && <div style={{ textAlign: "center", padding: "36px 0" }}><div className="pl" style={{ fontSize: "2.3rem" }}>🔍</div><div style={{ color: C.gold, marginTop: "9px", fontWeight: 600, fontSize: "0.9rem" }}>Searching...</div></div>}
          {result && !loading && <div className="fd">
            <div style={{ ...card, marginBottom: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px", flexWrap: "wrap", gap: "5px" }}>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: "0.82rem" }}>✨ {lang}</span>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button className="ab" onClick={() => navigator.clipboard?.writeText(result)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "7px", padding: "3px 9px", color: "#fff", fontSize: "0.68rem" }}>📋</button>
                  <button className="ab" onClick={() => { setResult(null); setQuery(""); }} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "7px", padding: "3px 9px", color: "#fff", fontSize: "0.68rem" }}>🔄</button>
                </div>
              </div>
              {fmt(result, fs)}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && aiSearch()} placeholder="Follow-up..." style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "10px 12px", color: "#fff", fontSize: fs, minWidth: 0 }} />
              <button className="ab" onClick={() => aiSearch()} style={{ background: "linear-gradient(135deg,#06d6a0,#08b38a)", border: "none", borderRadius: "9px", padding: "10px 15px", color: "#073b4c", fontWeight: 800 }}>Ask</button>
            </div>
          </div>}
          {history.length > 0 && !result && <div style={{ marginTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
              <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.38)", letterSpacing: "1px" }}>RECENT</div>
              <button className="ab" onClick={() => { setHistory([]); localStorage.removeItem("wb_history"); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", cursor: "pointer" }}>Clear</button>
            </div>
            {history.map((h, i) => <div key={i} className="ph" onClick={() => { setQuery(h.q); setResult(h.r); }} style={{ ...card, marginBottom: "6px", cursor: "pointer" }}>
              <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.gold, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.q}</div>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.32)", marginTop: "2px" }}>{h.t}</div>
            </div>)}
          </div>}
        </div>}

        {/* NEWS */}
        {page === "news" && <div style={pw} className="fd">
          <h2 style={{ fontWeight: 800, fontSize: "1rem", color: C.gold, marginBottom: "11px" }}>📰 World News</h2>
          <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "9px", marginBottom: "11px", scrollbarWidth: "none" }}>
            {NEWS_CATS.map(c => <button key={c} className={`ch${newsCat === c ? " s" : ""}`} onClick={() => { setNewsCat(c); fetchNews(c); }} style={{ background: newsCat === c ? "rgba(6,214,160,0.14)" : "transparent", border: `1px solid ${newsCat === c ? C.accent : C.border}`, borderRadius: "18px", padding: "5px 12px", color: newsCat === c ? C.accent : "rgba(255,255,255,0.52)", fontSize: "0.73rem", whiteSpace: "nowrap", fontWeight: newsCat === c ? 700 : 400 }}>{c}</button>)}
          </div>
          <button className="ab" onClick={() => fetchNews(newsCat)} style={{ width: "100%", background: "linear-gradient(135deg,#118ab2,#0a6d8a)", border: "none", borderRadius: "11px", padding: "11px", color: "#fff", fontWeight: 700, fontSize: "0.85rem", marginBottom: "13px" }}>
            {newsLoading ? <><span className="sp">⟳</span> Loading...</> : `📡 Get Latest ${newsCat} News`}
          </button>
          {newsLoading && <div style={{ textAlign: "center", padding: "28px 0" }}><div className="pl" style={{ fontSize: "2.3rem" }}>📰</div><div style={{ color: C.gold, marginTop: "9px", fontWeight: 600, fontSize: "0.9rem" }}>Getting latest news...</div></div>}
          {newsResult && !newsLoading && <div className="fd" style={card}>{fmt(newsResult, fs)}</div>}
          {!newsResult && !newsLoading && <div style={{ ...card, textAlign: "center", padding: "28px", color: "rgba(255,255,255,0.35)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "7px" }}>📰</div>
            <div style={{ fontSize: "0.8rem" }}>Select a category above, then tap "Get Latest News".</div>
          </div>}
        </div>}

        {/* LEARN */}
        {page === "learn" && <div style={pw} className="fd">
          <h2 style={{ fontWeight: 800, fontSize: "1rem", color: C.gold, marginBottom: "11px" }}>🎓 Free Learning Center</h2>
          {!learnTopic && <>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "13px", lineHeight: 1.6 }}>All lessons are free, simple, and in your language.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {LEARN_COURSES.map(c => (
                <button key={c.title} className="cb" onClick={() => fetchLesson(c)} style={{ ...card, textAlign: "left", cursor: "pointer" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "5px" }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "3px" }}>{c.title}</div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.42)", marginBottom: "6px", lineHeight: 1.5 }}>{c.desc}</div>
                  <span style={{ background: c.level === "Beginner" ? "rgba(6,214,160,0.14)" : c.level === "Intermediate" ? "rgba(255,209,102,0.14)" : "rgba(239,71,111,0.14)", color: c.level === "Beginner" ? C.accent : c.level === "Intermediate" ? C.gold : C.red, borderRadius: "9px", padding: "2px 7px", fontSize: "0.62rem", fontWeight: 700 }}>{c.level}</span>
                </button>
              ))}
            </div>
          </>}
          {learnTopic && <>
            <button className="ab" onClick={() => { setLearnTopic(null); setLearnResult(null); }} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "7px", padding: "5px 11px", color: "#fff", fontSize: "0.75rem", marginBottom: "11px", cursor: "pointer" }}>← Back</button>
            <div style={{ ...card, marginBottom: "11px", borderColor: "rgba(255,209,102,0.28)" }}>
              <div style={{ fontSize: "1.7rem", marginBottom: "5px" }}>{learnTopic.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "0.96rem", color: C.gold }}>{learnTopic.title}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.42)", marginTop: "2px" }}>{learnTopic.desc}</div>
            </div>
            {learnLoading && <div style={{ textAlign: "center", padding: "28px 0" }}><div className="pl" style={{ fontSize: "2.3rem" }}>📚</div><div style={{ color: C.gold, marginTop: "9px", fontWeight: 600, fontSize: "0.9rem" }}>Loading lesson in {lang}...</div></div>}
            {learnResult && !learnLoading && <div className="fd" style={card}>{fmt(learnResult, fs)}</div>}
          </>}
        </div>}

        {/* HEALTH */}
        {page === "health" && <div style={pw} className="fd">
          <h2 style={{ fontWeight: 800, fontSize: "1rem", color: C.gold, marginBottom: "6px" }}>❤️ AI Health Advisor</h2>
          <div style={{ background: "rgba(239,71,111,0.08)", border: "1px solid rgba(239,71,111,0.22)", borderRadius: "9px", padding: "9px 11px", marginBottom: "13px", fontSize: "0.7rem", color: "rgba(255,180,180,0.85)", lineHeight: 1.6 }}>⚠️ General info only. Always see a real doctor for serious symptoms.</div>
          {!healthResult && <>
            <div style={{ ...card, marginBottom: "11px" }}>
              <div style={{ fontWeight: 700, fontSize: "0.83rem", marginBottom: "9px", color: C.gold }}>Select your symptoms:</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {HEALTH_SYMPTOMS.map(s => <button key={s} className={`ch${healthSym.includes(s) ? " s" : ""}`} onClick={() => setHealthSym(h => h.includes(s) ? h.filter(x => x !== s) : [...h, s])} style={{ background: healthSym.includes(s) ? "rgba(6,214,160,0.14)" : "rgba(255,255,255,0.04)", border: `1px solid ${healthSym.includes(s) ? C.accent : C.border}`, borderRadius: "18px", padding: "5px 11px", color: healthSym.includes(s) ? C.accent : "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>{s}</button>)}
              </div>
            </div>
            {healthSym.length > 0 && <>
              <div style={{ ...card, marginBottom: "11px", background: "rgba(6,214,160,0.04)" }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginBottom: "3px" }}>Selected:</div>
                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: C.accent }}>{healthSym.join(" · ")}</div>
              </div>
              <button className="ab" onClick={checkHealth} disabled={healthLoading} style={{ width: "100%", background: "linear-gradient(135deg,#ef476f,#c0385a)", border: "none", borderRadius: "11px", padding: "11px", color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                {healthLoading ? <><span className="sp">⟳</span> Analyzing...</> : "🔍 Check My Symptoms"}
              </button>
            </>}
            {healthLoading && <div style={{ textAlign: "center", padding: "28px 0" }}><div className="pl" style={{ fontSize: "2.3rem" }}>❤️</div></div>}
          </>}
          {healthResult && <div className="fd">
            <button className="ab" onClick={() => { setHealthResult(null); setHealthSym([]); }} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "7px", padding: "5px 11px", color: "#fff", fontSize: "0.75rem", marginBottom: "11px", cursor: "pointer" }}>← Check Again</button>
            <div style={{ ...card, borderColor: "rgba(239,71,111,0.28)" }}>{fmt(healthResult, fs)}</div>
          </div>}
          <div style={{ ...card, marginTop: "14px", borderColor: "rgba(239,71,111,0.18)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: C.red, marginBottom: "9px" }}>🚨 Emergency Numbers</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[["🚑 Ambulance", "112 / 911"], ["👮 Police", "112 / 999"], ["🔥 Fire", "112 / 119"], ["☎️ WHO", "+41 22 791 2111"]].map(([l, n]) => <div key={l} style={{ background: "rgba(239,71,111,0.07)", borderRadius: "9px", padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{l}</div>
                <div style={{ fontSize: "0.78rem", color: C.red, fontFamily: "'JetBrains Mono',monospace", marginTop: "2px" }}>{n}</div>
              </div>)}
            </div>
          </div>
        </div>}

        {/* TOOLS */}
        {page === "tools" && <div style={pw} className="fd">
          <h2 style={{ fontWeight: 800, fontSize: "1rem", color: C.gold, marginBottom: "11px" }}>🛠️ Built-in Tools</h2>
          <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "9px", marginBottom: "13px", scrollbarWidth: "none" }}>
            {TOOLS_LIST.map(t => <button key={t.id} className={`ch${toolActive === t.id ? " s" : ""}`} onClick={() => setToolActive(t.id)} style={{ background: toolActive === t.id ? "rgba(6,214,160,0.13)" : "transparent", border: `1px solid ${toolActive === t.id ? C.accent : C.border}`, borderRadius: "18px", padding: "5px 12px", color: toolActive === t.id ? C.accent : "rgba(255,255,255,0.52)", fontSize: "0.72rem", whiteSpace: "nowrap", fontWeight: toolActive === t.id ? 700 : 400 }}>{t.icon} {t.label}</button>)}
          </div>

          {toolActive === "calc" && <div style={{ ...card, maxWidth: "300px", margin: "0 auto" }}>
            <div style={{ background: "rgba(0,0,0,0.45)", borderRadius: "9px", padding: "13px", marginBottom: "11px", textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.55rem", color: C.accent, wordBreak: "break-all", minHeight: "40px" }}>{calcDisplay}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
              {["C", "⌫", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "=", "∅"].map((k, i) => {
                if (k === "∅") return <div key={i} />;
                const op = ["÷", "×", "−", "+", "="].includes(k);
                const cl = k === "C";
                return <button key={k + i} className="kc" onClick={() => calcPress(k === "÷" ? "/" : k === "×" ? "*" : k === "−" ? "-" : k)} style={{ background: cl ? "rgba(239,71,111,0.22)" : op ? "rgba(6,214,160,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${cl ? "rgba(239,71,111,0.35)" : op ? "rgba(6,214,160,0.28)" : "rgba(255,255,255,0.09)"}`, borderRadius: "9px", padding: "13px 7px", color: cl ? C.red : op ? C.accent : "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>{k}</button>;
              })}
            </div>
          </div>}

          {toolActive === "convert" && <div style={card}>
            <div style={{ fontWeight: 700, fontSize: "0.87rem", color: C.gold, marginBottom: "11px" }}>📏 Unit Converter</div>
            <input value={convertVal} onChange={e => setConvertVal(e.target.value)} type="number" placeholder="Enter value..." style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "10px 12px", color: "#fff", fontSize: fs, marginBottom: "9px" }} />
            <div style={{ display: "flex", gap: "7px", marginBottom: "11px" }}>
              <select value={convertFrom} onChange={e => setConvertFrom(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", color: "#fff", padding: "7px", fontSize: "0.78rem", cursor: "pointer" }}>
                {["kg", "lb", "km", "mi", "L", "gal", "m", "ft", "°C", "°F", "ha", "ac"].map(u => <option key={u} value={u} style={{ background: "#040d1a" }}>{u}</option>)}
              </select>
              <button className="ab" onClick={() => { const t = convertFrom; setConvertFrom(convertTo); setConvertTo(t); }} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "7px 11px", color: "#fff" }}>⇄</button>
              <select value={convertTo} onChange={e => setConvertTo(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", color: "#fff", padding: "7px", fontSize: "0.78rem", cursor: "pointer" }}>
                {["lb", "kg", "mi", "km", "gal", "L", "ft", "m", "°F", "°C", "ac", "ha"].map(u => <option key={u} value={u} style={{ background: "#040d1a" }}>{u}</option>)}
              </select>
            </div>
            <button className="ab" onClick={doConvert} style={{ width: "100%", background: "linear-gradient(135deg,#06d6a0,#08b38a)", border: "none", borderRadius: "9px", padding: "10px", color: "#073b4c", fontWeight: 800, fontSize: "0.87rem", marginBottom: "9px" }}>Convert</button>
            {convertResult && <div style={{ background: "rgba(6,214,160,0.09)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "11px", textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: "1.05rem", color: C.accent, fontWeight: 700 }}>{convertResult}</div>}
          </div>}

          {toolActive === "translate" && <div style={card}>
            <div style={{ fontWeight: 700, fontSize: "0.87rem", color: C.gold, marginBottom: "11px" }}>🌐 Translator</div>
            <div style={{ display: "flex", gap: "7px", marginBottom: "9px" }}>
              <select value={transFrom} onChange={e => setTransFrom(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", color: "#fff", padding: "7px", fontSize: "0.76rem", cursor: "pointer" }}>{LANGS.map(l => <option key={l} value={l} style={{ background: "#040d1a" }}>{l}</option>)}</select>
              <button className="ab" onClick={() => { const t = transFrom; setTransFrom(transTo); setTransTo(t); }} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "7px 11px", color: "#fff" }}>⇄</button>
              <select value={transTo} onChange={e => setTransTo(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", color: "#fff", padding: "7px", fontSize: "0.76rem", cursor: "pointer" }}>{LANGS.map(l => <option key={l} value={l} style={{ background: "#040d1a" }}>{l}</option>)}</select>
            </div>
            <textarea value={transInput} onChange={e => setTransInput(e.target.value)} placeholder="Type text to translate..." rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "10px 12px", color: "#fff", fontSize: fs, resize: "vertical", marginBottom: "9px" }} />
            <button className="ab" onClick={doTranslate} disabled={transLoading} style={{ width: "100%", background: "linear-gradient(135deg,#118ab2,#0a6d8a)", border: "none", borderRadius: "9px", padding: "10px", color: "#fff", fontWeight: 800, fontSize: "0.85rem", marginBottom: "9px" }}>{transLoading ? <><span className="sp">⟳</span> Translating...</> : "🌐 Translate"}</button>
            {transResult && <div style={{ background: "rgba(17,138,178,0.09)", border: "1px solid rgba(17,138,178,0.28)", borderRadius: "9px", padding: "11px", fontSize: fs, lineHeight: 1.7 }}>{transResult}</div>}
          </div>}

          {toolActive === "weather" && <div style={card}>
            <div style={{ fontWeight: 700, fontSize: "0.87rem", color: C.gold, marginBottom: "11px" }}>🌤️ Weather Checker</div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "11px" }}>
              <input value={weatherCity} onChange={e => setWeatherCity(e.target.value)} onKeyDown={e => e.key === "Enter" && doWeather()} placeholder="Enter your city..." style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "10px 12px", color: "#fff", fontSize: fs }} />
              <button className="ab" onClick={doWeather} disabled={weatherLoading} style={{ background: "linear-gradient(135deg,#118ab2,#0a6d8a)", border: "none", borderRadius: "9px", padding: "10px 13px", color: "#fff", fontWeight: 800 }}>{weatherLoading ? <span className="sp">⟳</span> : "🌤️"}</button>
            </div>
            {weatherLoading && <div style={{ textAlign: "center", padding: "18px" }}><div className="pl" style={{ fontSize: "2rem" }}>🌍</div></div>}
            {weatherResult && !weatherLoading && <div className="fd" style={{ background: "rgba(17,138,178,0.07)", borderRadius: "9px", padding: "11px" }}>{fmt(weatherResult, fs)}</div>}
          </div>}

          {toolActive === "emergency" && <div style={{ ...card, borderColor: "rgba(239,71,111,0.28)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.87rem", color: C.red, marginBottom: "11px" }}>🚨 Emergency Guide</div>
            <div style={{ display: "grid", gap: "7px" }}>
              {[["🚑", "Medical", "Call 112 or 911. Describe your location clearly."], ["👮", "Police", "Call 112 or 999. Stay calm, give your location."], ["🔥", "Fire", "Evacuate first. Call 112 or 119."], ["🌊", "Flood", "Move to high ground immediately."], ["🤰", "Childbirth", "Call 112. Keep calm. Boil water, clean cloths ready."], ["☠️", "Poisoning", "Call poison control. Do NOT make patient vomit unless instructed."]].map(([i, t, d]) => (
                <div key={t} style={{ background: "rgba(239,71,111,0.06)", border: "1px solid rgba(239,71,111,0.16)", borderRadius: "9px", padding: "9px 11px", display: "flex", gap: "9px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{i}</span>
                  <div><div style={{ fontWeight: 700, fontSize: "0.8rem", color: C.red, marginBottom: "2px" }}>{t}</div><div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.5 }}>{d}</div></div>
                </div>
              ))}
            </div>
          </div>}

          {toolActive === "currency" && <div style={card}>
            <div style={{ fontWeight: 700, fontSize: "0.87rem", color: C.gold, marginBottom: "11px" }}>💱 Currency Info</div>
            <p style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.45)", marginBottom: "11px", lineHeight: 1.6 }}>Ask the AI for any currency exchange rate.</p>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { setPage("search"); aiSearch(query); } }} placeholder='e.g. "100 USD to Nigerian Naira"' style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "10px 12px", color: "#fff", fontSize: fs, marginBottom: "9px" }} />
            <button className="ab" onClick={() => { setPage("search"); aiSearch(query); }} style={{ width: "100%", background: "linear-gradient(135deg,#ffd166,#d4a820)", border: "none", borderRadius: "9px", padding: "10px", color: "#073b4c", fontWeight: 800, fontSize: "0.85rem" }}>💱 Check Rate</button>
          </div>}
        </div>}

        {/* MARKET */}
        {page === "market" && <div style={pw} className="fd">
          <h2 style={{ fontWeight: 800, fontSize: "1rem", color: C.gold, marginBottom: "11px" }}>🛒 Community Marketplace</h2>
          <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "8px", marginBottom: "13px", scrollbarWidth: "none" }}>
            {MARKET_CATS.map(c => <button key={c} className={`ch${marketCat === c ? " s" : ""}`} onClick={() => setMarketCat(c)} style={{ background: marketCat === c ? "rgba(255,209,102,0.13)" : "transparent", border: `1px solid ${marketCat === c ? "rgba(255,209,102,0.45)" : C.border}`, borderRadius: "18px", padding: "5px 11px", color: marketCat === c ? C.gold : "rgba(255,255,255,0.52)", fontSize: "0.7rem", whiteSpace: "nowrap", fontWeight: marketCat === c ? 700 : 400 }}>{c}</button>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
            {marketListings.map((m, i) => (
              <div key={i} style={{ ...card, borderColor: "rgba(255,209,102,0.18)" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "5px" }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "3px" }}>{m.title}</div>
                <div style={{ fontSize: "0.85rem", color: C.gold, fontWeight: 800, marginBottom: "4px" }}>{m.price}</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.38)" }}>{m.seller} · 📍{m.loc}</div>
                <button className="ab" style={{ marginTop: "7px", width: "100%", background: "rgba(255,209,102,0.1)", border: "1px solid rgba(255,209,102,0.25)", borderRadius: "7px", padding: "5px", color: C.gold, fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>Contact Seller</button>
              </div>
            ))}
          </div>
          <div style={{ ...card, borderColor: "rgba(255,209,102,0.18)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: C.gold, marginBottom: "9px" }}>+ Post Your Item</div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              <input value={marketPost.title} onChange={e => setMarketPost(p => ({ ...p, title: e.target.value }))} placeholder="Item name..." style={{ flex: 2, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 11px", color: "#fff", fontSize: "0.8rem" }} />
              <input value={marketPost.price} onChange={e => setMarketPost(p => ({ ...p, price: e.target.value }))} placeholder="Price" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "8px 11px", color: "#fff", fontSize: "0.8rem" }} />
            </div>
            <button className="ab" onClick={() => { if (marketPost.title && marketPost.price) { setMarketListings(l => [{ title: marketPost.title, price: marketPost.price, seller: "You", loc: "Your Location", icon: "📦" }, ...l]); setMarketPost({ title: "", price: "" }); } }} style={{ width: "100%", background: "linear-gradient(135deg,#ffd166,#d4a820)", border: "none", borderRadius: "9px", padding: "9px", color: "#073b4c", fontWeight: 800, fontSize: "0.83rem" }}>📬 Post Listing</button>
          </div>
        </div>}

        {/* COMMUNITY */}
        {page === "connect" && <div style={pw} className="fd">
          <h2 style={{ fontWeight: 800, fontSize: "1rem", color: C.gold, marginBottom: "6px" }}>🤝 Community Board</h2>
          <p style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.42)", marginBottom: "13px", lineHeight: 1.6 }}>Share knowledge, ask questions, help your neighbors.</p>
          <div style={{ ...card, marginBottom: "13px", borderColor: "rgba(6,214,160,0.22)" }}>
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share something useful with your community..." rows={2} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "9px", padding: "10px 12px", color: "#fff", fontSize: fs, resize: "none", marginBottom: "7px" }} />
            <button className="ab" onClick={() => { if (newPost.trim()) { setCommunityPosts(p => [{ user: "You", loc: "Your Location", msg: newPost, likes: 0, replies: 0, time: "just now" }, ...p]); setNewPost(""); } }} style={{ background: "linear-gradient(135deg,#06d6a0,#08b38a)", border: "none", borderRadius: "9px", padding: "8px 16px", color: "#073b4c", fontWeight: 800, fontSize: "0.83rem" }}>Post</button>
          </div>
          {communityPosts.map((p, i) => (
            <div key={i} className="ph" style={{ ...card, marginBottom: "8px", background: "rgba(255,255,255,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `hsl(${i * 80},55%,48%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.76rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{p.user[0]}</div>
                  <div><div style={{ fontWeight: 700, fontSize: "0.8rem" }}>{p.user}</div><div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.36)" }}>📍{p.loc}</div></div>
                </div>
                <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)" }}>{p.time}</span>
              </div>
              <p style={{ fontSize: "0.83rem", lineHeight: 1.6, color: "rgba(255,255,255,0.82)", marginBottom: "8px" }}>{p.msg}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="ab" onClick={() => setCommunityPosts(ps => ps.map((x, j) => j === i ? { ...x, likes: x.likes + 1 } : x))} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "4px 9px", color: "rgba(255,255,255,0.48)", fontSize: "0.7rem", cursor: "pointer" }}>❤️ {p.likes}</button>
                <button className="ab" style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "4px 9px", color: "rgba(255,255,255,0.48)", fontSize: "0.7rem", cursor: "pointer" }}>💬 {p.replies}</button>
                <button className="ab" onClick={() => { setQuery(p.msg); setPage("search"); aiSearch(p.msg); }} style={{ background: "rgba(6,214,160,0.07)", border: `1px solid ${C.border}`, borderRadius: "7px", padding: "4px 9px", color: C.accent, fontSize: "0.7rem", cursor: "pointer" }}>🔍 AI Help</button>
              </div>
            </div>
          ))}
        </div>}

      </div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="monly" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "rgba(4,13,26,0.97)", borderTop: `1px solid ${C.border}`, backdropFilter: "blur(16px)", display: "flex", justifyContent: "space-around", padding: "5px 0", paddingBottom: "max(6px,env(safe-area-inset-bottom))" }}>
        {NAV.map(n => <button key={n.id} className="nb" onClick={() => setPage(n.id)} style={{ background: "transparent", border: "none", padding: "4px 4px", color: page === n.id ? C.accent : "rgba(255,255,255,0.38)", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "34px" }}>
          <span style={{ fontSize: page === n.id ? "1.15rem" : "1rem", filter: page === n.id ? "drop-shadow(0 0 5px rgba(6,214,160,0.55))" : "none" }}>{n.icon}</span>
          <span style={{ fontSize: "0.5rem", fontWeight: page === n.id ? 700 : 400, whiteSpace: "nowrap" }}>{n.label}</span>
        </button>)}
      </nav>
    </div>
  );
}
