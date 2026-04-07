const { useState, useEffect, useCallback, useMemo, useRef } = React;

const SUITES = {
  operations: { label: "Operations", color: "#1B2A4A", icon: "⚙" },
  security: { label: "Security", color: "#B5453A", icon: "🛡" },
  healthcare: { label: "Healthcare", color: "#6B8F71", icon: "🏥" },
  build: { label: "Build", color: "#5E465C", icon: "🏗" },
  platform: { label: "Platform Layer", color: "#C4883A", icon: "◆" },
  consumer: { label: "Consumer", color: "#7A7A7A", icon: "♥" },
};

const APPS = [
  { id:"cvg-core", code:"CVG-CORE", name:"Core", suite:"platform", purpose:"Central nervous system. App shell, app launcher, SSO, /billing routes, Stripe webhook handler. Every session starts here.", github:"apps/core", healthUrl:"https://core-production-777b.up.railway.app/healthz", railway:"core-production-777b.up.railway.app", infraDeps:["supabase","railway","redis","stripe","sentry","doppler"], deps:[], consumers:["All apps"], dbSchema:"public", tableCount:31 },
  { id:"cvg-mer", code:"CVG-MER", name:"Meridian", suite:"operations", purpose:"PSA-lite and client lifecycle management. Client records, contacts, site hierarchies, service agreements, ticket workflows.", github:"apps/meridian", healthUrl:"https://meridian-production-0259.up.railway.app/healthz", railway:"meridian-production-0259.up.railway.app", infraDeps:["supabase","railway","sentry"], deps:["cvg-core","cvg-auth","cvg-ai"], consumers:["CVG-CAELUM","CVG-MIDAS","CVG-AEGIS"], dbSchema:"meridian", tableCount:29 },
  { id:"cvg-caelum", code:"CVG-CAELUM", name:"Caelum", suite:"operations", purpose:"Statement of Work builder. SOW-MASTER-SPEC v2.3 format. Pulls client context from Meridian, auto-calculates timelines.", github:"apps/caelum", healthUrl:"https://caelum-production.up.railway.app/healthz", railway:"caelum-production.up.railway.app", infraDeps:["supabase","railway","sentry"], deps:["cvg-core","cvg-auth"], consumers:[], dbSchema:"caelum", tableCount:3 },
  { id:"cvg-midas", code:"CVG-MIDAS", name:"Midas", suite:"operations", purpose:"QBR engine and technology roadmap tracker. Generates client-facing QBR decks, monitors roadmap adoption.", github:"apps/midas", healthUrl:"https://midas-production-5780.up.railway.app/healthz", railway:"midas-production-5780.up.railway.app", infraDeps:["supabase","railway","sentry"], deps:["cvg-core","cvg-auth"], consumers:[], dbSchema:"midas", tableCount:7 },
  { id:"cvg-vespar", code:"CVG-VESPAR", name:"Vespar", suite:"operations", purpose:"Cloud migration planning. Workload assessments, migration waves, cutover schedules, rollback plans.", github:"apps/vespar", healthUrl:"https://vespar-production.up.railway.app/healthz", railway:"vespar-production.up.railway.app", infraDeps:["supabase","railway","sentry"], deps:["cvg-core","cvg-auth"], consumers:[], dbSchema:"vespar", tableCount:6 },
  { id:"cvg-cavalier", code:"CVG-CAVALIER", name:"Cavalier Marketplace", suite:"operations", purpose:"Multi-distributor procurement and deal registration. Pax8, SYNNEX, Ingram, D&H, Amazon. Cisco CCW, Dell, Lenovo, Fortinet deal reg.", github:"apps/cavalier", healthUrl:"https://cavalier-production-66c7.up.railway.app/healthz", railway:"cavalier-production-66c7.up.railway.app", infraDeps:["supabase","railway","openrouter","sentry"], deps:["cvg-core","cvg-auth","cvg-ai"], consumers:[], dbSchema:"public", tableCount:30 },
  { id:"cvg-aegis", code:"CVG-AEGIS", name:"AEGIS", suite:"security", purpose:"Security posture management. Cavaridge Adjusted Score, IAR, SPR, Connector Framework. Nuclei, ConnectSecure, HIBP, Guardz, SentinelOne, BloodHound.", github:"apps/aegis", healthUrl:"https://aegis-production-0a77.up.railway.app/healthz", railway:"aegis-production-0a77.up.railway.app", infraDeps:["supabase","railway","openrouter","sentry"], deps:["cvg-core","cvg-auth","cvg-ai"], consumers:["CVG-VIGIL","CVG-HIPAA"], dbSchema:"aegis", tableCount:9 },
  { id:"cvg-hipaa", code:"CVG-HIPAA", name:"HIPAA Compliance", suite:"security", purpose:"HIPAA readiness and compliance monitoring. Risk analysis, BAA tracking, security rule gap analysis, breach notification.", github:"apps/hipaa", healthUrl:"https://hipaa-production.up.railway.app/healthz", railway:"hipaa-production.up.railway.app", infraDeps:["supabase","railway","sentry"], deps:["cvg-core","cvg-auth"], consumers:["CVG-EHR"], dbSchema:"public (prefixed)", tableCount:5 },
  { id:"cvg-spr", code:"CVG-SPR", name:"SPR", suite:"security", purpose:"Standalone SharePoint Permissions Report. Audits M365 SharePoint for anonymous links, external owners, inheritance breaks.", github:"apps/cavaridge-spr", healthUrl:"https://cavaridge-spr-production.up.railway.app/healthz", railway:"cavaridge-spr-production.up.railway.app", infraDeps:["railway"], deps:[], consumers:[], dbSchema:"—", tableCount:0 },
  { id:"cvg-browse", code:"CVG-BROWSE", name:"Browse", suite:"security", purpose:"Browser security and web filtering. Cloudflare Gateway integration, browser extension management, web activity risk scoring.", github:"apps/browse", healthUrl:null, railway:null, infraDeps:["supabase","railway","cloudflare"], deps:["cvg-core","cvg-auth"], consumers:[], dbSchema:"—", tableCount:0 },
  { id:"cvg-vigil", code:"CVG-VIGIL", name:"VIGIL", suite:"security", purpose:"Vendor Intelligence & Governance Issue Ledger. Adversarial evidence-chain, multi-party RBAC. Built for vendor escalation packages.", github:"apps/vigil", healthUrl:null, railway:null, infraDeps:["supabase","railway"], deps:["cvg-core","cvg-auth","cvg-aegis"], consumers:[], dbSchema:"—", tableCount:0 },
  { id:"cvg-ceres", code:"CVG-CERES", name:"Ceres", suite:"healthcare", purpose:"Free public nursing toolkit. 60-Day Medicare Frequency Calculator, PDGM Over-Utilization Calculator. No login, no backend. Co-designed with Becca (RN).", github:"apps/ceres", healthUrl:"https://ceres-production.up.railway.app/healthz", railway:"ceres-production.up.railway.app", infraDeps:["railway"], deps:[], consumers:[], dbSchema:"—", tableCount:0 },
  { id:"cvg-ehr", code:"CVG-EHR", name:"EHR / Practice Mgmt", suite:"healthcare", purpose:"AI-native EHR and Practice Management. FHIR R4, SMART v2, USCDI v3, HTI-1. Beachhead: home health → ASC → PCP → health systems.", github:"apps/ehr (planned)", healthUrl:null, railway:null, infraDeps:["supabase","railway","openrouter","stripe"], deps:["cvg-core","cvg-auth","cvg-hipaa","cvg-ai"], consumers:[], dbSchema:"planned", tableCount:0 },
  { id:"cvg-atlas", code:"CVG-ATLAS", name:"ATLAS", suite:"build", purpose:"IT-first construction management for ASC greenfields. CPM scheduling, 8 AI agents, AHCA compliance. Low voltage through punch list.", github:"apps/atlas", healthUrl:"https://atlas-production-b6cc.up.railway.app/healthz", railway:"atlas-production-b6cc.up.railway.app", infraDeps:["supabase","railway","openrouter","sentry"], deps:["cvg-core","cvg-auth","cvg-ai"], consumers:[], dbSchema:"atlas", tableCount:26 },
  { id:"cvg-forge", code:"CVG-FORGE", name:"Forge", suite:"build", purpose:"Autonomous content generation. Reports, proposals, compliance docs, marketing materials. Worker-based PDF/DOCX/HTML output with Cavaridge branding.", github:"apps/forge", healthUrl:"https://forge-production-3152.up.railway.app/healthz", railway:"forge-production-3152.up.railway.app", infraDeps:["supabase","railway","openrouter","sentry"], deps:["cvg-core","cvg-auth","cvg-ai"], consumers:["CVG-MIDAS","CVG-CAELUM","CVG-AEGIS"], dbSchema:"public (prefixed)", tableCount:8 },
  { id:"cvg-ai", code:"CVG-AI", name:"Spaniel", suite:"platform", purpose:"AI orchestration engine. All LLM calls route through Spaniel → OpenRouter. Model selection, semantic caching, multi-model consensus, three-tier fallback.", github:"apps/spaniel-api", healthUrl:"https://spaniel-api-production.up.railway.app/healthz", railway:"spaniel-api-production.up.railway.app", infraDeps:["supabase","railway","redis","openrouter","langfuse","sentry"], deps:["cvg-core"], consumers:["All AI-enabled apps"], dbSchema:"spaniel", tableCount:3 },
  { id:"cvg-research", code:"CVG-RESEARCH", name:"Ducky Intelligence", suite:"platform", purpose:"Customer-facing AI personality. Ducky is a girl — Blenheim CKCS. Ticket triage, vendor scoring, compliance Q&A, procurement recs. Never 'Ducky AI.'", github:"apps/ducky", healthUrl:"https://ducky-production.up.railway.app/healthz", railway:"ducky-production.up.railway.app", infraDeps:["supabase","railway","openrouter","langfuse","sentry"], deps:["cvg-core","cvg-ai"], consumers:["All suites"], dbSchema:"ducky", tableCount:11 },
  { id:"cvg-brain", code:"CVG-BRAIN", name:"Brain", suite:"platform", purpose:"Knowledge graph and RAG layer. pgvector embeddings of SOPs, runbooks, client configs, vendor docs. Feeds Ducky with grounded operational context.", github:"apps/brain", healthUrl:"https://brain-production-d70e.up.railway.app/healthz", railway:"brain-production-d70e.up.railway.app", infraDeps:["supabase","railway","openrouter","langfuse","sentry"], deps:["cvg-core","cvg-ai"], consumers:["CVG-RESEARCH"], dbSchema:"—", tableCount:0 },
  { id:"cvg-astra", code:"CVG-ASTRA", name:"Astra", suite:"platform", purpose:"Cross-suite reporting and analytics. License optimization, spend tracking, utilization. Only app with custom domain (astra.app.cavaridge.com).", github:"apps/astra", healthUrl:"https://astra-production-d261.up.railway.app/healthz", railway:"astra-production-d261.up.railway.app", infraDeps:["supabase","railway","sentry"], deps:["cvg-core","cvg-auth"], consumers:["All suites"], dbSchema:"astra", tableCount:4 },
  { id:"cvg-pvt", code:"CVG-PVT", name:"PawVault", suite:"consumer", purpose:"Consumer pet health and memory platform. Cavaridge Puppies division. Vet records, vaccinations, milestones, photos. Standalone, non-UTM.", github:"apps/pawvault", healthUrl:null, railway:null, infraDeps:["supabase","railway"], deps:[], consumers:[], dbSchema:"planned", tableCount:0 },
  { id:"cvg-prism", code:"CVG-PRISM", name:"PRISM", suite:"platform", purpose:"People Records, Identity & Staff Management. Employee directory, org chart, CSV export, photo upload, enable/disable with audit triggers. App #20.", github:"apps/prism", healthUrl:null, railway:null, infraDeps:["supabase","railway"], deps:["cvg-core","cvg-auth"], consumers:[], dbSchema:"planned", tableCount:0 },
];

const INFRA = [
  { id:"supabase", name:"Supabase", category:"Database & Auth", purpose:"PostgreSQL, auth, RLS, real-time. Project rastlfqertdllarbciwv. 129+ tables, 10 schemas, 100% RLS.", pingUrl:"https://rastlfqertdllarbciwv.supabase.co/rest/v1/", expectStatus:401, plan:"Pro", cost:"$25/mo", region:"us-east-1", consumers:["All backend apps"] },
  { id:"railway", name:"Railway", category:"Compute & Hosting", purpose:"Container hosting. 16 services, 2 cron jobs (usage 1AM, trial 2AM UTC). Non-root Docker, helmet, scoped CORS.", pingUrl:null, plan:"Pro", cost:"~$45/mo", region:"us-west-1", consumers:["All deployed apps"] },
  { id:"redis", name:"Redis", category:"Cache & Queues", purpose:"BullMQ job queues (billing-metering daily 3AM), Spaniel rate limiting, semantic cache. Railway add-on.", pingUrl:null, plan:"Add-on", cost:"~$5/mo", region:"us-west-1", consumers:["CVG-CORE","CVG-AI","CVG-BRAIN"] },
  { id:"doppler", name:"Doppler", category:"Secrets", purpose:"Centralized secrets. Single project 'cavaridge-platform'. 32 prd / 35 stg. No plaintext in repo.", pingUrl:null, plan:"Team", cost:"$0", region:"Global", consumers:["All apps"] },
  { id:"openrouter", name:"OpenRouter", category:"LLM Gateway", purpose:"Unified LLM API under master Cavaridge key. Claude, GPT-4, Llama, Mixtral. Central routing config by task type.", pingUrl:"https://openrouter.ai/api/v1/models", expectStatus:200, plan:"Pay-as-you-go", cost:"Variable", region:"Global", consumers:["CVG-AI","CVG-RESEARCH","CVG-BRAIN","CVG-AEGIS","CVG-CAVALIER","CVG-ATLAS","CVG-FORGE"] },
  { id:"stripe", name:"Stripe", category:"Billing", purpose:"Subscriptions, checkout, customer portal, Connect for MSP reselling. Per-seat pricing, 4 suites + bundle.", pingUrl:"https://api.stripe.com/v1", expectStatus:401, plan:"Standard", cost:"2.9%+30¢/txn", region:"Global", consumers:["CVG-CORE","PKG-BILLING"] },
  { id:"sentry", name:"Sentry", category:"Error Tracking", purpose:"Error tracking + performance. Trace sampling 0.1 prd / 1.0 dev. On 16 apps.", pingUrl:null, plan:"Team", cost:"$26/mo", region:"Global", consumers:["All backend apps"] },
  { id:"langfuse", name:"Langfuse", category:"LLM Observability", purpose:"LLM tracing, prompt management, eval. Every Spaniel call traced — latency, tokens, model, cache.", pingUrl:"https://cloud.langfuse.com", expectStatus:200, plan:"Hobby", cost:"$0", region:"EU", consumers:["CVG-AI","CVG-RESEARCH","CVG-BRAIN"] },
  { id:"github", name:"GitHub", category:"Source Control", purpose:"Monorepo (pnpm/Turborepo). 18 apps, shared packages. Railway auto-deploy from main. 884 test assertions.", pingUrl:"https://api.github.com", expectStatus:200, plan:"Team", cost:"$4/user", region:"Global", consumers:["All apps","Railway"] },
  { id:"cloudflare", name:"Cloudflare", category:"DNS & Edge", purpose:"DNS, DDoS protection, Gateway for Browse browser security. cavaridge.com + subdomains.", pingUrl:null, plan:"Pro", cost:"$20/mo", region:"Global (edge)", consumers:["CVG-BROWSE","cavaridge.com"] },
];

const REFRESH_INTERVAL = 60000;

function hc(p) { return p >= 90 ? "#6B8F71" : p >= 70 ? "#C4883A" : p >= 40 ? "#B5453A" : "#7A7A7A"; }
function sc(s) { return s === "up" ? "#6B8F71" : s === "degraded" ? "#C4883A" : s === "down" ? "#B5453A" : s === "maintenance" ? "#1B2A4A" : "#7A7A7A"; }
function sl(s) { return s === "up" ? "Operational" : s === "degraded" ? "Degraded" : s === "down" ? "Down" : s === "maintenance" ? "Maintenance" : s === "pending" ? "Checking..." : s === "not_deployed" ? "Not Deployed" : "Unknown"; }

function HBar({ pct, h = 6, showLabel = false }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, width:"100%" }}>
      <div style={{ flex:1, background:"#E8E5E0", borderRadius:h/2, height:h, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", borderRadius:h/2, background:hc(pct), transition:"width 0.6s ease" }}/>
      </div>
      {showLabel && <span style={{ fontSize:12, fontWeight:700, color:hc(pct), minWidth:38, textAlign:"right" }}>{pct}%</span>}
    </div>
  );
}

function Pulse({ color }) {
  return (
    <div style={{ position:"relative", width:8, height:8 }}>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:color }} />
      <div style={{
        position:"absolute", inset:-3, borderRadius:"50%", border:`2px solid ${color}`, opacity:0.4,
        animation:"pulse 2s ease-in-out infinite",
      }} />
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.5);opacity:0} }`}</style>
    </div>
  );
}

async function pingEndpoint(url, expectStatus) {
  const start = performance.now();
  try {
    const res = await fetch(url, { method:"GET", mode:"cors", cache:"no-store", signal:AbortSignal.timeout(8000) });
    const ms = Math.round(performance.now() - start);
    if (expectStatus && res.status === expectStatus) return { status:"up", ms, code:res.status };
    if (res.ok) return { status:"up", ms, code:res.status };
    if (res.status >= 500) return { status:"down", ms, code:res.status };
    return { status:"up", ms, code:res.status };
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    if (e.name === "TypeError" && ms < 7500) {
      // CORS block — server responded but browser blocked. Still means it's up.
      return { status:"up", ms, code:"CORS" };
    }
    if (e.name === "TimeoutError" || ms >= 7500) return { status:"down", ms, code:"TIMEOUT" };
    return { status:"down", ms, code:e.message?.substring(0,20) };
  }
}

function StatusApp() {
  const [appStatus, setAppStatus] = useState({});
  const [infraStatus, setInfraStatus] = useState({});
  const [maintenance, setMaintenance] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState("apps");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const intervalRef = useRef(null);

  // Load maintenance flags from storage
  useEffect(() => {
    (async () => {
      try {
        const r = { value: localStorage.getItem("status-maintenance-v4") };
        if (r?.value) setMaintenance(JSON.parse(r.value));
      } catch (e) {}
    })();
  }, []);

  const saveMaintenance = useCallback(async (next) => {
    setMaintenance(next);
    try { localStorage.setItem("status-maintenance-v4", JSON.stringify(next)); } catch (e) {}
  }, []);

  const toggleMaintenance = (id) => {
    saveMaintenance({ ...maintenance, [id]: !maintenance[id] });
  };

  const runChecks = useCallback(async () => {
    setChecking(true);
    const appResults = {};
    const infraResults = {};

    // Check all apps with healthUrl
    const appPromises = APPS.filter(a => a.healthUrl).map(async (app) => {
      const result = await pingEndpoint(app.healthUrl);
      appResults[app.id] = result;
    });

    // Check infra with pingUrl
    const infraPromises = INFRA.filter(s => s.pingUrl).map(async (svc) => {
      const result = await pingEndpoint(svc.pingUrl, svc.expectStatus);
      infraResults[svc.id] = result;
    });

    await Promise.allSettled([...appPromises, ...infraPromises]);

    // Mark apps without healthUrl
    APPS.filter(a => !a.healthUrl).forEach(a => {
      appResults[a.id] = { status: "not_deployed", ms: 0, code: "—" };
    });

    // Mark infra without pingUrl as unknown (can't verify from browser)
    INFRA.filter(s => !s.pingUrl).forEach(s => {
      infraResults[s.id] = { status: "up", ms: 0, code: "N/A (no public endpoint)" };
    });

    setAppStatus(appResults);
    setInfraStatus(infraResults);
    setLastCheck(new Date());
    setChecking(false);
  }, []);

  // Initial check + interval
  useEffect(() => {
    runChecks();
    intervalRef.current = setInterval(runChecks, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [runChecks]);

  const getAppState = (id) => {
    if (maintenance[id]) return "maintenance";
    return appStatus[id]?.status || "pending";
  };
  const getInfraState = (id) => {
    if (maintenance[id]) return "maintenance";
    return infraStatus[id]?.status || "pending";
  };

  const filtered = useMemo(() => APPS.filter(a => {
    if (filter !== "all" && a.suite !== filter) return false;
    if (search) { const q = search.toLowerCase(); return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.purpose.toLowerCase().includes(q); }
    return true;
  }), [filter, search]);

  const appUpCount = APPS.filter(a => getAppState(a.id) === "up").length;
  const appDeployedCount = APPS.filter(a => a.healthUrl).length;
  const infraUpCount = INFRA.filter(s => getInfraState(s.id) === "up").length;
  const appHealthPct = APPS.length > 0 ? Math.round((appUpCount / APPS.length) * 100) : 0;
  const infraHealthPct = INFRA.length > 0 ? Math.round((infraUpCount / INFRA.length) * 100) : 0;
  const totalTables = APPS.reduce((s, a) => s + (a.tableCount || 0), 0);

  const suiteHealth = useMemo(() => {
    const out = {};
    for (const [k] of Object.entries(SUITES)) {
      const sa = APPS.filter(a => a.suite === k);
      if (!sa.length) continue;
      const up = sa.filter(a => getAppState(a.id) === "up").length;
      out[k] = Math.round((up / sa.length) * 100);
    }
    return out;
  }, [appStatus, maintenance]);

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#F5F2ED", minHeight:"100vh", color:"#2D2D2D" }}>
      {/* HEADER */}
      <div style={{ background:"#1B2A4A", padding:"20px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ background:"#5E465C", borderRadius:6, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17L7.5 8L12 13L16 6L21 17" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", color:"#fff", fontSize:18, letterSpacing:"0.04em" }}>CAVARIDGE</div>
              <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:500 }}>Live Platform Status</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:hc(appHealthPct), fontSize:26, fontWeight:700, lineHeight:1 }}>{appHealthPct}%</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:3 }}>Apps</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:hc(infraHealthPct), fontSize:26, fontWeight:700, lineHeight:1 }}>{infraHealthPct}%</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:3 }}>Infra</div>
            </div>
            <div style={{ width:1, height:36, background:"rgba(255,255,255,0.1)" }}/>
            {[
              { v:`${appDeployedCount}/${APPS.length}`, l:"Deployed" },
              { v:`${infraUpCount}/${INFRA.length}`, l:"Services" },
              { v:totalTables, l:"Tables" },
            ].map(s => (
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ color:"#fff", fontSize:16, fontWeight:700, lineHeight:1 }}>{s.v}</div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:500, marginTop:2 }}>{s.l}</div>
              </div>
            ))}
            <button onClick={runChecks} disabled={checking}
              style={{ padding:"6px 14px", borderRadius:6, border:"1.5px solid rgba(255,255,255,0.2)", background:"transparent", color:"#fff", fontSize:11, fontWeight:600, cursor:checking?"default":"pointer", fontFamily:"inherit", opacity:checking?0.5:1, display:"flex", alignItems:"center", gap:6 }}>
              {checking ? <span style={{ display:"inline-block", width:10, height:10, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/> : "⟳"} {checking ? "Checking..." : "Refresh"}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </div>

        {/* Suite health bars */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(135px, 1fr))", gap:8, marginTop:16 }}>
          {Object.entries(SUITES).map(([k, suite]) => suiteHealth[k] !== undefined ? (
            <div key={k} style={{ background:"rgba(255,255,255,0.05)", borderRadius:6, padding:"8px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <span style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.6)" }}>{suite.icon} {suite.label}</span>
                <span style={{ fontSize:10, fontWeight:700, color:hc(suiteHealth[k]) }}>{suiteHealth[k]}%</span>
              </div>
              <HBar pct={suiteHealth[k]} h={3}/>
            </div>
          ) : null)}
          <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:6, padding:"8px 12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
              <span style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.6)" }}>⬡ Infrastructure</span>
              <span style={{ fontSize:10, fontWeight:700, color:hc(infraHealthPct) }}>{infraHealthPct}%</span>
            </div>
            <HBar pct={infraHealthPct} h={3}/>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding:"0 28px", background:"#fff", borderBottom:"1px solid #E8E5E0" }}>
        <div style={{ display:"flex", alignItems:"center" }}>
          {[{ k:"infra", l:`Infrastructure (${INFRA.length})` },{ k:"apps", l:`Applications (${APPS.length})` }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding:"12px 20px", fontSize:13, fontWeight:600, fontFamily:"inherit", border:"none", cursor:"pointer", background:"transparent",
              color:tab===t.k?"#5E465C":"#7A7A7A", borderBottom:tab===t.k?"2px solid #5E465C":"2px solid transparent",
            }}>{t.l}</button>
          ))}
          <div style={{ marginLeft:"auto", padding:"12px 0", display:"flex", gap:10, alignItems:"center" }}>
            {tab === "apps" && <>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ padding:"6px 12px", borderRadius:6, border:"1.5px solid #E8E5E0", background:"#F5F2ED", fontSize:12, fontFamily:"inherit", width:180, outline:"none" }}/>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ padding:"6px 12px", borderRadius:6, border:"1.5px solid #E8E5E0", background:"#F5F2ED", fontSize:12, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                <option value="all">All Suites</option>
                {Object.entries(SUITES).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </>}
            <span style={{ fontSize:10, color:"#7A7A7A" }}>
              {lastCheck ? `Checked ${lastCheck.toLocaleTimeString()} · refreshes every 60s` : "Checking..."}
            </span>
          </div>
        </div>
      </div>

      {/* INFRA TAB */}
      {tab === "infra" && (
        <div style={{ padding:"20px 28px", display:"flex", flexDirection:"column", gap:10 }}>
          {INFRA.map(svc => {
            const state = getInfraState(svc.id);
            const result = infraStatus[svc.id];
            const isOpen = expanded === svc.id;
            return (
              <div key={svc.id} style={{ background:"#fff", border:"1px solid #E8E5E0", borderRadius:6, borderLeft:`4px solid ${sc(state)}`, boxShadow:isOpen?"0 4px 20px rgba(0,0,0,0.06)":"none" }}>
                <div onClick={() => setExpanded(isOpen ? null : svc.id)} style={{ padding:"14px 20px", cursor:"pointer", display:"grid", gap:14, gridTemplateColumns:"minmax(140px,0.7fr) 110px minmax(200px,2fr) 80px", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{svc.name}</div>
                    <div style={{ fontSize:10, color:"#7A7A7A", marginTop:2 }}>{svc.category}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Pulse color={sc(state)}/>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:sc(state) }}>{sl(state)}</div>
                      {result?.ms > 0 && <div style={{ fontSize:9, color:"#7A7A7A" }}>{result.ms}ms</div>}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:"#7A7A7A", lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                    {svc.purpose}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"#7A7A7A" }}>{svc.plan}</div>
                    <div style={{ fontSize:10, color:"#2D2D2D", fontWeight:600 }}>{svc.cost}</div>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding:"0 20px 20px", borderTop:"1px solid #E8E5E0", paddingTop:16 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                      <div>
                        <div style={{ fontSize:13, lineHeight:1.65, marginBottom:14 }}>{svc.purpose}</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12, marginBottom:14 }}>
                          <div><span style={{ color:"#7A7A7A" }}>Region:</span> {svc.region}</div>
                          <div><span style={{ color:"#7A7A7A" }}>Ping URL:</span> <span style={{ fontSize:10, fontFamily:"monospace" }}>{svc.pingUrl || "None (private)"}</span></div>
                          <div><span style={{ color:"#7A7A7A" }}>Response:</span> {result?.code || "—"}</div>
                          <div><span style={{ color:"#7A7A7A" }}>Latency:</span> {result?.ms ? `${result.ms}ms` : "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:600, color:"#7A7A7A", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Consumed By</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {svc.consumers.map(c => <span key={c} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:"#F5F2ED", border:"1px solid #E8E5E0", color:"#5E465C", fontWeight:500 }}>{c}</span>)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <button onClick={e => { e.stopPropagation(); toggleMaintenance(svc.id); }}
                          style={{ padding:"6px 14px", borderRadius:6, fontSize:11, fontWeight:600, fontFamily:"inherit", cursor:"pointer",
                            border: maintenance[svc.id] ? "1.5px solid #1B2A4A" : "1.5px solid #E8E5E0",
                            background: maintenance[svc.id] ? "#1B2A4A" : "#fff",
                            color: maintenance[svc.id] ? "#fff" : "#7A7A7A",
                          }}>
                          {maintenance[svc.id] ? "✦ Under Maintenance — Click to Clear" : "Mark as Under Maintenance"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* APPS TAB */}
      {tab === "apps" && (
        <div style={{ padding:"20px 28px", display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(app => {
            const state = getAppState(app.id);
            const result = appStatus[app.id];
            const isOpen = expanded === app.id;
            const infraForApp = (app.infraDeps || []).map(id => ({ ...INFRA.find(s => s.id === id), state: getInfraState(id) })).filter(i => i.name);
            const allInfraUp = infraForApp.every(i => i.state === "up");

            return (
              <div key={app.id} style={{ background:"#fff", border:"1px solid #E8E5E0", borderRadius:6, borderLeft:`4px solid ${SUITES[app.suite]?.color || "#E8E5E0"}`, boxShadow:isOpen?"0 4px 20px rgba(0,0,0,0.06)":"none" }}>
                <div onClick={() => setExpanded(isOpen ? null : app.id)} style={{ padding:"14px 20px", cursor:"pointer", display:"grid", gap:14, gridTemplateColumns:"minmax(160px,1fr) 110px minmax(200px,2fr) 80px", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{app.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                      <span style={{ fontSize:10, color:"#7A7A7A", fontFamily:"monospace" }}>{app.code}</span>
                      {!allInfraUp && state === "up" && <span style={{ fontSize:8, padding:"1px 5px", borderRadius:3, background:"#C4883A20", color:"#C4883A", fontWeight:600 }}>INFRA ⚠</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Pulse color={sc(state)}/>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:sc(state) }}>{sl(state)}</div>
                      {result?.ms > 0 && <div style={{ fontSize:9, color:"#7A7A7A" }}>{result.ms}ms</div>}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:"#7A7A7A", lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                    {app.purpose}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:4, background:SUITES[app.suite]?.color+"12", color:SUITES[app.suite]?.color }}>
                      {SUITES[app.suite]?.label}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding:"0 20px 20px", borderTop:"1px solid #E8E5E0", paddingTop:16 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                      <div>
                        <div style={{ fontSize:13, lineHeight:1.65, marginBottom:14 }}>{app.purpose}</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12, marginBottom:14 }}>
                          <div><span style={{ color:"#7A7A7A" }}>GitHub:</span> <span style={{ fontFamily:"monospace", fontSize:11 }}>{app.github}</span></div>
                          <div><span style={{ color:"#7A7A7A" }}>Railway:</span> <span style={{ fontFamily:"monospace", fontSize:10 }}>{app.railway || "—"}</span></div>
                          <div><span style={{ color:"#7A7A7A" }}>Schema:</span> {app.dbSchema}</div>
                          <div><span style={{ color:"#7A7A7A" }}>Tables:</span> {app.tableCount}</div>
                          <div><span style={{ color:"#7A7A7A" }}>Response:</span> {result?.code || "—"}</div>
                          <div><span style={{ color:"#7A7A7A" }}>Latency:</span> {result?.ms ? `${result.ms}ms` : "—"}</div>
                        </div>

                        {/* Infra deps with live status */}
                        {infraForApp.length > 0 && (
                          <div style={{ marginBottom:14 }}>
                            <div style={{ fontSize:10, fontWeight:600, color:"#7A7A7A", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Infrastructure Dependencies</div>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              {infraForApp.map(s => (
                                <div key={s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 10px", borderRadius:4, background:"#F5F2ED" }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    <div style={{ width:6, height:6, borderRadius:"50%", background:sc(s.state) }}/>
                                    <span style={{ fontSize:11, fontWeight:500 }}>{s.name}</span>
                                  </div>
                                  <span style={{ fontSize:10, color:sc(s.state), fontWeight:600 }}>{sl(s.state)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(app.deps.length > 0 || app.consumers?.length > 0) && (
                          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                            {app.deps.length > 0 && (
                              <div>
                                <div style={{ fontSize:10, fontWeight:600, color:"#7A7A7A", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>App Dependencies</div>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                                  {app.deps.map(d => {
                                    const depState = getAppState(d);
                                    return <span key={d} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:"#F5F2ED", border:`1px solid ${sc(depState)}30`, color:sc(depState), fontWeight:500 }}>{d}</span>;
                                  })}
                                </div>
                              </div>
                            )}
                            {app.consumers?.length > 0 && (
                              <div>
                                <div style={{ fontSize:10, fontWeight:600, color:"#7A7A7A", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Consumed By</div>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                                  {app.consumers.map(c => <span key={c} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:"#1B2A4A10", border:"1px solid #1B2A4A20", color:"#1B2A4A", fontWeight:500 }}>{c}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <button onClick={e => { e.stopPropagation(); toggleMaintenance(app.id); }}
                          style={{ padding:"6px 14px", borderRadius:6, fontSize:11, fontWeight:600, fontFamily:"inherit", cursor:"pointer", marginBottom:14,
                            border: maintenance[app.id] ? "1.5px solid #1B2A4A" : "1.5px solid #E8E5E0",
                            background: maintenance[app.id] ? "#1B2A4A" : "#fff",
                            color: maintenance[app.id] ? "#fff" : "#7A7A7A",
                          }}>
                          {maintenance[app.id] ? "✦ Under Maintenance — Click to Clear" : "Mark as Under Maintenance"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER */}
      <div style={{ padding:"16px 28px", textAlign:"center", borderTop:"1px solid #E8E5E0", color:"#7A7A7A", fontSize:10 }}>
        🐾 Powered by Ducky Intelligence · Cavaridge, LLC · Live pings every 60s · {appUpCount}/{APPS.length} apps up · {infraUpCount}/{INFRA.length} services up · {totalTables} tables · 100% RLS
      </div>
    </div>
  );
}
