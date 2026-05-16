import { useState } from "react";
import { ThemeToggle } from "./ThemeContext.jsx";
import LoginPage from "./LoginPage";

// ─── DATA SEED ───────────────────────────────────────────────────────────────
const THRUST_AREAS = ["Revenue Growth","Cost Optimization","Customer Experience","People Development","Operational Excellence","Innovation & Technology","Compliance & Governance","Sustainability"];
const UOM_TYPES = ["Numeric (Min - Higher is better)","Numeric (Max - Lower is better)","% (Min - Higher is better)","% (Max - Lower is better)","Timeline","Zero-based"];
const STATUSES = ["Not Started","On Track","Completed"];
const QUARTERS = ["Q1 (July)","Q2 (October)","Q3 (January)","Q4/Annual (March/April)"];

const SEED_EMPLOYEES = [
  { id:"e1", name:"Aarav Sharma",   email:"aarav@corp.in",  role:"employee", managerId:"m1", dept:"Sales" },
  { id:"e2", name:"Priya Nair",     email:"priya@corp.in",  role:"employee", managerId:"m1", dept:"Sales" },
  { id:"e3", name:"Ritu Verma",     email:"ritu@corp.in",   role:"employee", managerId:"m2", dept:"Engineering" },
  { id:"e4", name:"Suresh Patel",   email:"suresh@corp.in", role:"employee", managerId:"m2", dept:"Engineering" },
  { id:"m1", name:"Meera Iyer",     email:"meera@corp.in",  role:"manager",  managerId:"a1", dept:"Sales" },
  { id:"m2", name:"Kiran Reddy",    email:"kiran@corp.in",  role:"manager",  managerId:"a1", dept:"Engineering" },
  { id:"a1", name:"Admin HR",       email:"admin@corp.in",  role:"admin",    managerId:null, dept:"HR" },
];

const SEED_GOALS = [
  { id:"g1", employeeId:"e1", thrustArea:"Revenue Growth", title:"Achieve Q1 Sales Target", description:"Close deals worth ₹50L in Q1", uom:"Numeric (Min - Higher is better)", target:5000000, weightage:40, status:"Approved", achievements:{Q1:3200000,Q2:4800000,Q3:null,Q4:null}, checkInComments:{}, isShared:false, sharedFrom:null, locked:true, createdAt:"2025-05-02" },
  { id:"g2", employeeId:"e1", thrustArea:"Customer Experience", title:"Improve NPS Score", description:"Raise NPS from 32 to 50", uom:"Numeric (Min - Higher is better)", target:50, weightage:30, status:"Approved", achievements:{Q1:38,Q2:45,Q3:null,Q4:null}, checkInComments:{}, isShared:false, sharedFrom:null, locked:true, createdAt:"2025-05-02" },
  { id:"g3", employeeId:"e1", thrustArea:"People Development", title:"Complete 3 Training Modules", description:"Finish assigned L&D programs", uom:"Numeric (Min - Higher is better)", target:3, weightage:30, status:"Approved", achievements:{Q1:1,Q2:2,Q3:null,Q4:null}, checkInComments:{}, isShared:false, sharedFrom:null, locked:true, createdAt:"2025-05-02" },
  { id:"g4", employeeId:"e2", thrustArea:"Revenue Growth", title:"New Client Acquisition", description:"Onboard 5 new clients", uom:"Numeric (Min - Higher is better)", target:5, weightage:50, status:"Pending Approval", achievements:{Q1:null,Q2:null,Q3:null,Q4:null}, checkInComments:{}, isShared:false, sharedFrom:null, locked:false, createdAt:"2025-05-10" },
  { id:"g5", employeeId:"e2", thrustArea:"Compliance & Governance", title:"Zero Compliance Violations", description:"Maintain zero incidents", uom:"Zero-based", target:0, weightage:50, status:"Pending Approval", achievements:{Q1:null,Q2:null,Q3:null,Q4:null}, checkInComments:{}, isShared:false, sharedFrom:null, locked:false, createdAt:"2025-05-10" },
];

const SEED_AUDIT = [
  { id:"au1", goalId:"g1", action:"Goal Approved", by:"Meera Iyer", at:"2025-05-15T09:30:00", detail:"Target locked at ₹50,00,000" },
  { id:"au2", goalId:"g2", action:"Goal Approved", by:"Meera Iyer", at:"2025-05-15T09:35:00", detail:"NPS target set to 50" },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function computeScore(uom, target, achievement) {
  if (achievement === null || achievement === undefined || achievement === "") return null;
  const t = parseFloat(target), a = parseFloat(achievement);
  if (isNaN(t) || isNaN(a)) return null;
  if (uom.includes("Min")) return Math.min(Math.round((a / t) * 100), 150);
  if (uom.includes("Max")) return t === 0 ? 100 : Math.min(Math.round((t / a) * 100), 150);
  if (uom === "Zero-based") return a === 0 ? 100 : 0;
  if (uom === "Timeline") return a <= t ? 100 : Math.max(0, Math.round(100 - ((a - t) / t) * 100));
  return null;
}

function weightedScore(goals, quarter) {
  const locked = goals.filter(g => g.locked);
  if (!locked.length) return 0;
  let total = 0;
  locked.forEach(g => {
    const s = computeScore(g.uom, g.target, g.achievements[quarter]);
    if (s !== null) total += (s * g.weightage) / 100;
  });
  return Math.round(total);
}

function Badge({ color, children }) {
  const map = { green:"#16a34a", amber:"#d97706", red:"#dc2626", blue:"#2563eb", gray:"#6b7280", purple:"#7c3aed" };
  return <span style={{ display:"inline-block", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background: map[color]+"22", color: map[color], letterSpacing:.3 }}>{children}</span>;
}

function statusBadge(s) {
  if (s === "Approved") return <Badge color="green">Approved</Badge>;
  if (s === "Pending Approval") return <Badge color="amber">Pending</Badge>;
  if (s === "Rejected") return <Badge color="red">Rejected</Badge>;
  if (s === "Draft") return <Badge color="gray">Draft</Badge>;
  return <Badge color="gray">{s}</Badge>;
}

function progressBar(pct) {
  const c = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  return <div style={{ background:"var(--gp-progress-track)", borderRadius:99, height:6, width:"100%", marginTop:4 }}>
    <div style={{ background:c, width:`${Math.min(pct,100)}%`, height:"100%", borderRadius:99 }} />
  </div>;
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [users] = useState(SEED_EMPLOYEES);
  const [goals, setGoals] = useState(SEED_GOALS);
  const [auditLog, setAuditLog] = useState(SEED_AUDIT);
  const [currentUser, setCurrentUser] = useState(SEED_EMPLOYEES[0]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [notification, setNotification] = useState(null);

  function handleLogin(authUser) {
    const match = SEED_EMPLOYEES.find(u => u.email === authUser.email);
    setCurrentUser(match ?? SEED_EMPLOYEES[0]);
    setLoggedInUser(authUser);
    setView("dashboard");
  }

  function handleLogout() {
    setLoggedInUser(null);
  }

  if (!loggedInUser) return <LoginPage onLogin={handleLogin} />;

  function notify(msg, type="success") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function addAudit(goalId, action, by, detail) {
    setAuditLog(prev => [...prev, { id:"au"+Date.now(), goalId, action, by, at: new Date().toISOString(), detail }]);
  }

  const myGoals = goals.filter(g => g.employeeId === currentUser.id);
  const teamGoals = goals.filter(g => users.find(u => u.id === g.employeeId && u.managerId === currentUser.id));
  const allGoals = goals;

  const navItems = {
    employee: [
      { id:"dashboard", label:"Dashboard", icon:"📊" },
      { id:"my-goals", label:"My Goals", icon:"🎯" },
      { id:"achievements", label:"Achievements", icon:"📈" },
    ],
    manager: [
      { id:"dashboard", label:"Dashboard", icon:"📊" },
      { id:"team-goals", label:"Team Goals", icon:"👥" },
      { id:"approvals", label:"Approvals", icon:"✅" },
      { id:"checkins", label:"Check-ins", icon:"💬" },
    ],
    admin: [
      { id:"dashboard", label:"Dashboard", icon:"📊" },
      { id:"all-goals", label:"All Goals", icon:"🗂" },
      { id:"reports", label:"Reports", icon:"📋" },
      { id:"audit", label:"Audit Trail", icon:"🔍" },
      { id:"shared-goals", label:"Shared Goals", icon:"🔗" },
    ],
  };

  const role = currentUser.role;

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:"100vh", background:"var(--gp-bg)", display:"flex", flexDirection:"column", transition:"background .25s ease, color .25s ease" }}>
      {/* TOP BAR */}
      <header style={{ background:"#1e293b", color:"#fff", padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 3px #0003", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:32, height:32, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🎯</div>
          <span style={{ fontWeight:700, fontSize:16, letterSpacing:-.3 }}>GoalQuest Portal</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <ThemeToggle />
          <select value={currentUser.id} onChange={e => setCurrentUser(users.find(u=>u.id===e.target.value))}
            style={{ background:"#334155", color:"#fff", border:"1px solid #475569", borderRadius:6, padding:"4px 8px", fontSize:13 }}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
          <button onClick={handleLogout} style={{
            background:"#ef4444", color:"#fff", border:"none", borderRadius:6,
            padding:"6px 14px", fontSize:13, fontWeight:600, cursor:"pointer"
          }}>
            Logout
          </button>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"#6366f1",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>
            {currentUser.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
          </div>
        </div>
      </header>

      {notification && (
        <div style={{ position:"fixed", top:64, right:24, zIndex:200, background: notification.type==="success"?"#16a34a":"#dc2626", color:"#fff", padding:"10px 20px", borderRadius:8, boxShadow:"0 4px 12px #0003", fontSize:14, fontWeight:500 }}>
          {notification.msg}
        </div>
      )}

      <div style={{ display:"flex", flex:1 }}>
        {/* SIDEBAR */}
        <nav style={{ width:200, background:"var(--gp-surface)", borderRight:"1px solid var(--gp-border)", padding:"16px 8px", display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--gp-text-muted)", textTransform:"uppercase", letterSpacing:1, padding:"8px 10px 4px" }}>
            {role.toUpperCase()}
          </div>
          {(navItems[role]||[]).map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:"none", background: view===item.id ? "var(--gp-muted)" : "transparent", color: view===item.id ? "#6366f1" : "var(--gp-text-tertiary)", fontWeight: view===item.id ? 600 : 400, fontSize:14, cursor:"pointer", textAlign:"left" }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <main style={{ flex:1, padding:24, overflowY:"auto", maxHeight:"calc(100vh - 56px)" }}>
          {view === "dashboard" && <Dashboard currentUser={currentUser} users={users} goals={goals} myGoals={myGoals} teamGoals={teamGoals} />}
          {view === "my-goals" && <MyGoals currentUser={currentUser} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "achievements" && <Achievements currentUser={currentUser} myGoals={myGoals} setGoals={setGoals} notify={notify} />}
          {view === "team-goals" && <TeamGoals currentUser={currentUser} users={users} teamGoals={teamGoals} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "approvals" && <Approvals currentUser={currentUser} users={users} teamGoals={teamGoals} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "checkins" && <CheckIns currentUser={currentUser} users={users} teamGoals={teamGoals} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "all-goals" && <AllGoals users={users} goals={allGoals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "reports" && <Reports users={users} goals={allGoals} />}
          {view === "audit" && <AuditTrail auditLog={auditLog} goals={allGoals} users={users} />}
          {view === "shared-goals" && <SharedGoals users={users} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
        </main>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ currentUser, users, goals, myGoals, teamGoals }) {
  const role = currentUser.role;
  const approvedMy = myGoals.filter(g=>g.status==="Approved");
  const pendingMy = myGoals.filter(g=>g.status==="Pending Approval");
  const score = weightedScore(approvedMy, "Q2");

  const teamMembers = users.filter(u=>u.managerId===currentUser.id);
  const pendingApprovals = teamGoals.filter(g=>g.status==="Pending Approval");

  const allEmps = users.filter(u=>u.role==="employee");
  const submittedCount = [...new Set(goals.filter(g=>g.status!=="Draft").map(g=>g.employeeId))].length;
  const approvedCount = [...new Set(goals.filter(g=>g.status==="Approved").map(g=>g.employeeId))].length;

  return (
    <div>
      <h2 style={{ margin:"0 0 6px", fontSize:22, fontWeight:700, color:"var(--gp-text)" }}>Welcome back, {currentUser.name.split(" ")[0]} 👋</h2>
      <p style={{ color:"var(--gp-text-secondary)", margin:"0 0 24px", fontSize:14 }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>

      {/* CYCLE STATUS */}
      <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:12, padding:20, color:"#fff", marginBottom:24 }}>
        <div style={{ fontSize:13, opacity:.85, marginBottom:4 }}>Current Phase</div>
        <div style={{ fontSize:20, fontWeight:700 }}>Q2 Check-in Window</div>
        <div style={{ fontSize:13, opacity:.85, marginTop:4 }}>October — Progress Update: Planned vs. Actual</div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:28 }}>
        {role==="employee" && <>
          <StatCard icon="🎯" label="My Goals" value={myGoals.length} sub="created" color="#6366f1" />
          <StatCard icon="✅" label="Approved" value={approvedMy.length} sub="locked" color="#16a34a" />
          <StatCard icon="⏳" label="Pending" value={pendingMy.length} sub="awaiting mgr" color="#d97706" />
          <StatCard icon="📊" label="Q2 Score" value={score ? score+"%" : "N/A"} sub="weighted" color="#0ea5e9" />
        </>}
        {role==="manager" && <>
          <StatCard icon="👥" label="Team Size" value={teamMembers.length} sub="direct reports" color="#6366f1" />
          <StatCard icon="⏳" label="Pending Review" value={pendingApprovals.length} sub="need action" color="#d97706" />
          <StatCard icon="✅" label="Approved" value={teamGoals.filter(g=>g.status==="Approved").length} sub="goal entries" color="#16a34a" />
          <StatCard icon="💬" label="Check-ins Due" value={teamMembers.length} sub="Q2 window" color="#0ea5e9" />
        </>}
        {role==="admin" && <>
          <StatCard icon="👤" label="Employees" value={allEmps.length} sub="active" color="#6366f1" />
          <StatCard icon="📝" label="Submitted" value={submittedCount} sub="employees" color="#0ea5e9" />
          <StatCard icon="✅" label="Approved" value={approvedCount} sub="employees" color="#16a34a" />
          <StatCard icon="🗂" label="Total Goals" value={goals.length} sub="all entries" color="#d97706" />
        </>}
      </div>

      {/* QUICK TABLE */}
      {role === "employee" && approvedMy.length > 0 && (
        <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--gp-border-light)", fontSize:15, fontWeight:600, color:"var(--gp-text)" }}>My Goal Sheet Summary</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"var(--gp-bg)" }}>
              {["Goal","Thrust Area","Weight","Q1","Q2","Status"].map(h=><th key={h} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:"var(--gp-text-secondary)", textAlign:"left", textTransform:"uppercase", letterSpacing:.5 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {myGoals.map((g,i)=>(
                <tr key={g.id} style={{ borderTop:"1px solid var(--gp-border-light)", background: i%2?"var(--gp-surface-alt)":"var(--gp-surface)" }}>
                  <td style={{ padding:"10px 16px", fontSize:13, fontWeight:500, color:"var(--gp-text)" }}>{g.title}</td>
                  <td style={{ padding:"10px 16px", fontSize:12, color:"var(--gp-text-secondary)" }}>{g.thrustArea}</td>
                  <td style={{ padding:"10px 16px", fontSize:13, fontWeight:600, color:"#6366f1" }}>{g.weightage}%</td>
                  <td style={{ padding:"10px 16px", fontSize:12 }}>{g.achievements.Q1 !== null ? <span style={{color:"#16a34a",fontWeight:500}}>{g.achievements.Q1}</span> : <span style={{color:"var(--gp-text-muted)"}}>—</span>}</td>
                  <td style={{ padding:"10px 16px", fontSize:12 }}>{g.achievements.Q2 !== null ? <span style={{color:"#16a34a",fontWeight:500}}>{g.achievements.Q2}</span> : <span style={{color:"var(--gp-text-muted)"}}>—</span>}</td>
                  <td style={{ padding:"10px 16px" }}>{statusBadge(g.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {role === "manager" && (
        <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--gp-border-light)", fontSize:15, fontWeight:600, color:"var(--gp-text)" }}>Team Q2 Progress</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"var(--gp-bg)" }}>
              {["Employee","Goals","Approved","Q2 Score","Check-in"].map(h=><th key={h} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:"var(--gp-text-secondary)", textAlign:"left", textTransform:"uppercase", letterSpacing:.5 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {teamMembers.map((emp,i)=>{
                const eg = goals.filter(g=>g.employeeId===emp.id);
                const approved = eg.filter(g=>g.locked);
                const sc = weightedScore(approved,"Q2");
                return (
                  <tr key={emp.id} style={{ borderTop:"1px solid var(--gp-border-light)", background: i%2?"var(--gp-surface-alt)":"var(--gp-surface)" }}>
                    <td style={{ padding:"10px 16px", fontSize:13, fontWeight:500, color:"var(--gp-text)" }}>{emp.name}</td>
                    <td style={{ padding:"10px 16px", fontSize:13 }}>{eg.length}</td>
                    <td style={{ padding:"10px 16px", fontSize:13 }}>{approved.length}</td>
                    <td style={{ padding:"10px 16px", fontSize:13, fontWeight:600, color: sc>70?"#16a34a":sc>40?"#d97706":"#dc2626" }}>{sc}%</td>
                    <td style={{ padding:"10px 16px" }}><Badge color="amber">Due</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:"18px 20px" }}>
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:24, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:600, color:"var(--gp-text)", marginTop:4 }}>{label}</div>
      <div style={{ fontSize:12, color:"var(--gp-text-muted)" }}>{sub}</div>
    </div>
  );
}

// ─── MY GOALS ────────────────────────────────────────────────────────────────
function MyGoals({ currentUser, goals, setGoals, addAudit, notify }) {
  const myGoals = goals.filter(g => g.employeeId === currentUser.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ thrustArea:"Revenue Growth", title:"", description:"", uom:UOM_TYPES[0], target:"", weightage:"" });
  const [errors, setErrors] = useState({});

  const totalWeight = myGoals.reduce((s,g)=>s+g.weightage,0);
  const canAdd = myGoals.length < 8;

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.target) e.target = "Target is required";
    const w = parseInt(form.weightage);
    if (!w || w < 10) e.weightage = "Minimum 10%";
    if (w > 100) e.weightage = "Cannot exceed 100%";
    if (totalWeight + w > 100) e.weightage = `Would exceed 100% (current total: ${totalWeight}%)`;
    return e;
  }

  function submitGoal() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const newGoal = {
      id: "g" + Date.now(),
      employeeId: currentUser.id,
      thrustArea: form.thrustArea,
      title: form.title,
      description: form.description,
      uom: form.uom,
      target: parseFloat(form.target),
      weightage: parseInt(form.weightage),
      status: "Pending Approval",
      achievements: { Q1:null, Q2:null, Q3:null, Q4:null },
      checkInComments: {},
      isShared: false,
      sharedFrom: null,
      locked: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setGoals(prev => [...prev, newGoal]);
    addAudit(newGoal.id, "Goal Submitted", currentUser.name, `Target: ${form.target}, Weight: ${form.weightage}%`);
    notify("Goal submitted for manager approval!");
    setShowForm(false);
    setForm({ thrustArea:"Revenue Growth", title:"", description:"", uom:UOM_TYPES[0], target:"", weightage:"" });
    setErrors({});
  }

  function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id));
    notify("Goal deleted.", "error");
  }

  const remaining = 100 - totalWeight;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>My Goal Sheet</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"var(--gp-text-secondary)" }}>FY 2025–26 | Max 8 goals | Total weightage must equal 100%</p>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, color:"var(--gp-text-secondary)" }}>Total Weightage</div>
            <div style={{ fontSize:20, fontWeight:700, color: totalWeight===100?"#16a34a":totalWeight>100?"#dc2626":"#d97706" }}>{totalWeight}%</div>
          </div>
          {canAdd && myGoals.some(g=>!g.locked) === false && (
            <button onClick={() => setShowForm(true)}
              style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              + Add Goal
            </button>
          )}
          {myGoals.some(g=>!g.locked) && (
            <button onClick={() => setShowForm(true)}
              style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              + Add Goal
            </button>
          )}
        </div>
      </div>

      {/* WEIGHT BAR */}
      <div style={{ background:"var(--gp-surface)", borderRadius:10, border:"1px solid var(--gp-border)", padding:16, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
          <span style={{ color:"var(--gp-text-secondary)" }}>Weightage Allocation</span>
          <span style={{ fontWeight:600, color: totalWeight===100?"#16a34a":"#d97706" }}>{remaining}% remaining</span>
        </div>
        <div style={{ background:"var(--gp-muted)", borderRadius:99, height:10, position:"relative" }}>
          <div style={{ background: totalWeight===100?"#16a34a":totalWeight>100?"#dc2626":"#6366f1", width:`${Math.min(totalWeight,100)}%`, height:"100%", borderRadius:99, transition:"width .3s" }}/>
        </div>
        {totalWeight===100 && <p style={{ margin:"8px 0 0", fontSize:12, color:"#16a34a", fontWeight:500 }}>✓ Weightage complete! Goals can be submitted.</p>}
        {totalWeight!==100 && totalWeight>0 && <p style={{ margin:"8px 0 0", fontSize:12, color:"#d97706" }}>⚠ Add {remaining}% more weightage to reach 100%</p>}
      </div>

      {/* ADD FORM */}
      {showForm && (
        <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"2px solid #6366f1", padding:24, marginBottom:20 }}>
          <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:"var(--gp-text)" }}>New Goal</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <FormField label="Thrust Area" required>
              <select value={form.thrustArea} onChange={e=>setForm(f=>({...f,thrustArea:e.target.value}))}
                style={inputStyle}>
                {THRUST_AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </FormField>
            <FormField label="Unit of Measurement" required>
              <select value={form.uom} onChange={e=>setForm(f=>({...f,uom:e.target.value}))}
                style={inputStyle}>
                {UOM_TYPES.map(u=><option key={u}>{u}</option>)}
              </select>
            </FormField>
            <FormField label="Goal Title" error={errors.title} required style={{ gridColumn:"1/-1" }}>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Achieve Q3 Revenue Target" style={inputStyle} />
            </FormField>
            <FormField label="Description" style={{ gridColumn:"1/-1" }}>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="Describe what success looks like..." style={{...inputStyle,resize:"vertical"}} />
            </FormField>
            <FormField label="Target" error={errors.target} required>
              <input type="number" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} placeholder="e.g. 1000000" style={inputStyle} />
            </FormField>
            <FormField label="Weightage (%)" error={errors.weightage} required>
              <input type="number" value={form.weightage} onChange={e=>setForm(f=>({...f,weightage:e.target.value}))} placeholder="min 10%, max 100%" min={10} max={100} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <button onClick={submitGoal} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontSize:14, fontWeight:600, cursor:"pointer" }}>Submit for Approval</button>
            <button onClick={() => { setShowForm(false); setErrors({}); }} style={{ background:"var(--gp-muted)", color:"var(--gp-text-secondary)", border:"1px solid var(--gp-border)", borderRadius:8, padding:"9px 20px", fontSize:14, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* GOALS LIST */}
      {myGoals.length === 0 && (
        <div style={{ textAlign:"center", padding:60, color:"var(--gp-text-muted)", background:"var(--gp-surface)", borderRadius:12, border:"1px dashed var(--gp-border)" }}>
          <div style={{ fontSize:40 }}>🎯</div>
          <div style={{ fontSize:16, fontWeight:500, marginTop:12 }}>No goals yet</div>
          <div style={{ fontSize:13, marginTop:4 }}>Click "Add Goal" to create your first goal</div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {myGoals.map(g => (
          <div key={g.id} style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:20, display:"flex", gap:16, alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                {statusBadge(g.status)}
                <Badge color="purple">{g.thrustArea}</Badge>
                {g.isShared && <Badge color="blue">Shared Goal</Badge>}
                {g.locked && <Badge color="gray">🔒 Locked</Badge>}
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:"var(--gp-text)" }}>{g.title}</div>
              <div style={{ fontSize:13, color:"var(--gp-text-secondary)", marginTop:4 }}>{g.description}</div>
              <div style={{ display:"flex", gap:20, marginTop:12, fontSize:13 }}>
                <span><span style={{ color:"var(--gp-text-muted)" }}>UoM:</span> <strong>{g.uom}</strong></span>
                <span><span style={{ color:"var(--gp-text-muted)" }}>Target:</span> <strong>{g.target}</strong></span>
                <span><span style={{ color:"var(--gp-text-muted)" }}>Weight:</span> <strong style={{ color:"#6366f1" }}>{g.weightage}%</strong></span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
              <div style={{ fontSize:24, fontWeight:700, color:"#6366f1" }}>{g.weightage}%</div>
              {!g.locked && (
                <button onClick={() => deleteGoal(g.id)}
                  style={{ background:"var(--gp-danger-bg)", color:"#dc2626", border:"none", borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* VALIDATION SUMMARY */}
      {myGoals.length > 0 && (
        <div style={{ marginTop:16, background:"var(--gp-bg)", borderRadius:10, border:"1px solid var(--gp-border)", padding:16, fontSize:13 }}>
          <strong>Validation Rules:</strong>
          <ul style={{ margin:"8px 0 0", paddingLeft:20, color:"var(--gp-text-tertiary)" }}>
            <li style={{ color: myGoals.length<=8?"#16a34a":"#dc2626" }}>{myGoals.length<=8?"✓":"✗"} Max 8 goals ({myGoals.length}/8 used)</li>
            <li style={{ color: myGoals.every(g=>g.weightage>=10)?"#16a34a":"#dc2626" }}>{myGoals.every(g=>g.weightage>=10)?"✓":"✗"} Each goal ≥ 10% weightage</li>
            <li style={{ color: totalWeight===100?"#16a34a":"#d97706" }}>{totalWeight===100?"✓":"⚠"} Total weightage = 100% (currently {totalWeight}%)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── ACHIEVEMENTS ────────────────────────────────────────────────────────────
function Achievements({ currentUser, myGoals, setGoals, notify }) {
  const [editQ, setEditQ] = useState(null);
  const [vals, setVals] = useState({});
  const lockedGoals = myGoals.filter(g => g.locked || g.status === "Approved");
  const activeQ = "Q2";

  function saveAchievement(goalId) {
    const v = vals[goalId];
    if (v === undefined || v === "") return;
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, achievements: { ...g.achievements, [activeQ]: parseFloat(v) } } : g));
    notify("Achievement saved!");
    setEditQ(null);
  }

  if (!lockedGoals.length) return (
    <div style={{ textAlign:"center", padding:60, background:"var(--gp-surface)", borderRadius:12, border:"1px dashed var(--gp-border)" }}>
      <div style={{ fontSize:40 }}>📈</div>
      <div style={{ fontSize:16, fontWeight:600, marginTop:12, color:"var(--gp-text)" }}>No achievements to log yet</div>
      <div style={{ fontSize:13, color:"var(--gp-text-secondary)", marginTop:8, maxWidth:360, margin:"8px auto 0" }}>
        Your goals need to be <strong>approved and locked</strong> by your manager before you can log actuals here.
      </div>
      <div style={{ marginTop:20, background:"var(--gp-bg)", borderRadius:10, padding:16, maxWidth:360, margin:"16px auto 0", textAlign:"left" }}>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--gp-text-tertiary)", marginBottom:8 }}>Steps to unlock this section:</div>
        <div style={{ fontSize:13, color:"var(--gp-text-secondary)", lineHeight:2 }}>
          1. Go to <strong>My Goals</strong> → add goals<br/>
          2. Total weightage must reach <strong>100%</strong><br/>
          3. Ask your manager to <strong>approve</strong> them<br/>
          4. Come back here to log your actuals ✓
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>Achievement Tracker</h2>
      <p style={{ color:"var(--gp-text-secondary)", margin:"0 0 20px", fontSize:13 }}>Active window: <strong>Q2 Check-in (October)</strong> — Log your actuals against planned targets</p>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {lockedGoals.map(g => {
          const scores = QUARTERS.reduce((acc,q,i) => {
            const qk = ["Q1","Q2","Q3","Q4"][i];
            const s = computeScore(g.uom, g.target, g.achievements[qk]);
            acc[qk] = s;
            return acc;
          }, {});

          return (
            <div key={g.id} style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:"var(--gp-text)" }}>{g.title}</div>
                  <div style={{ fontSize:12, color:"var(--gp-text-secondary)", marginTop:2 }}>{g.thrustArea} · {g.uom} · Target: <strong>{g.target}</strong> · Weight: <strong style={{color:"#6366f1"}}>{g.weightage}%</strong></div>
                </div>
                <Badge color="green">Locked ✓</Badge>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {["Q1","Q2","Q3","Q4"].map(qk => {
                  const ach = g.achievements[qk];
                  const score = scores[qk];
                  const isActive = qk === activeQ;
                  return (
                    <div key={qk} style={{ background: isActive?"var(--gp-accent-bg)":"var(--gp-muted-2)", borderRadius:10, border: isActive?"2px solid #6366f1":"1px solid var(--gp-border)", padding:14, position:"relative" }}>
                      <div style={{ fontSize:11, fontWeight:700, color: isActive?"#6366f1":"var(--gp-text-muted)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>{qk} {isActive && "• Active"}</div>
                      {editQ === g.id+qk ? (
                        <div>
                          <input type="number" autoFocus
                            value={vals[g.id] ?? ""}
                            onChange={e => setVals(v => ({ ...v, [g.id]: e.target.value }))}
                            style={{ ...inputStyle, marginBottom:8 }} />
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => saveAchievement(g.id)} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:6, padding:"4px 12px", fontSize:12, cursor:"pointer" }}>Save</button>
                            <button onClick={() => setEditQ(null)} style={{ background:"var(--gp-muted)", border:"none", borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>×</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize:20, fontWeight:700, color: ach!==null?"var(--gp-text)":"var(--gp-placeholder)" }}>
                            {ach !== null ? ach : "—"}
                          </div>
                          {score !== null && (
                            <div style={{ marginTop:6 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--gp-text-secondary)" }}>
                                <span>Score</span><span style={{ fontWeight:700, color: score>=80?"#16a34a":score>=50?"#d97706":"#dc2626" }}>{score}%</span>
                              </div>
                              {progressBar(score)}
                            </div>
                          )}
                          {isActive && (
                            <button onClick={() => { setEditQ(g.id+qk); setVals(v=>({...v,[g.id]:ach??""} )); }}
                              style={{ marginTop:8, background:"var(--gp-accent-soft)", color:"#6366f1", border:"none", borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                              {ach!==null ? "Edit" : "Log"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* STATUS */}
              <div style={{ marginTop:12, display:"flex", gap:8 }}>
                <span style={{ fontSize:13, color:"var(--gp-text-secondary)" }}>Status:</span>
                {STATUSES.map(s => (
                  <button key={s} style={{
                    fontSize:12, borderRadius:99, padding:"3px 12px", cursor:"pointer", fontWeight: 500,
                    background: g.achievements.Q2!==null && s==="On Track" ? "var(--gp-status-ontrack)" : "var(--gp-bg)",
                    border: "1px solid var(--gp-border)", color:"var(--gp-text-tertiary)"
                  }}>{s}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* OVERALL SCORE */}
      <div style={{ marginTop:20, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:12, padding:20, color:"#fff" }}>
        <div style={{ fontSize:13, opacity:.85 }}>Q2 Weighted Score</div>
        <div style={{ fontSize:36, fontWeight:800, lineHeight:1 }}>{weightedScore(lockedGoals, "Q2")}%</div>
        <div style={{ fontSize:13, opacity:.75, marginTop:4 }}>Based on locked goals and logged actuals</div>
      </div>
    </div>
  );
}

// ─── MANAGER: APPROVALS ──────────────────────────────────────────────────────
function Approvals({ currentUser, users, teamGoals, goals, setGoals, addAudit, notify }) {
  const pending = teamGoals.filter(g => g.status === "Pending Approval");
  const [editGoal, setEditGoal] = useState(null);
  const [remarks, setRemarks] = useState({});

  function approve(g) {
    setGoals(prev => prev.map(goal => goal.id === g.id ? { ...goal, status:"Approved", locked:true } : goal));
    addAudit(g.id, "Goal Approved", currentUser.name, "Approved by L1 manager");
    notify(`Goal "${g.title}" approved and locked!`);
  }

  function reject(g) {
    const r = remarks[g.id] || "Needs revision";
    setGoals(prev => prev.map(goal => goal.id === g.id ? { ...goal, status:"Rejected" } : goal));
    addAudit(g.id, "Goal Rejected", currentUser.name, `Reason: ${r}`);
    notify(`Goal returned for rework.`, "error");
  }

  function saveEdit(g, updates) {
    setGoals(prev => prev.map(goal => goal.id === g.id ? { ...goal, ...updates } : goal));
    addAudit(g.id, "Goal Edited by Manager", currentUser.name, `Updated target/weightage`);
    setEditGoal(null);
    notify("Changes saved!");
  }

  const empMap = {};
  users.forEach(u => empMap[u.id] = u);

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>Goal Approvals</h2>
      <p style={{ color:"var(--gp-text-secondary)", margin:"0 0 20px", fontSize:13 }}>{pending.length} goal{pending.length!==1?"s":""} pending your review</p>

      {pending.length === 0 && (
        <div style={{ textAlign:"center", padding:60, background:"var(--gp-surface)", borderRadius:12, border:"1px dashed var(--gp-border)", color:"var(--gp-text-muted)" }}>
          <div style={{ fontSize:36 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, marginTop:12 }}>All caught up!</div>
          <div style={{ fontSize:13 }}>No pending approvals at this time.</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {pending.map(g => {
          const emp = empMap[g.employeeId];
          const isEditing = editGoal === g.id;

          return (
            <div key={g.id} style={{ background:"var(--gp-surface)", borderRadius:12, border:"2px solid var(--gp-warning-border)", padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:12, color:"var(--gp-text-secondary)", marginBottom:4 }}>From: <strong>{emp?.name}</strong> · {emp?.dept} · Submitted: {g.createdAt}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"var(--gp-text)" }}>{g.title}</div>
                  <div style={{ fontSize:13, color:"var(--gp-text-secondary)", marginTop:2 }}>{g.description}</div>
                </div>
                <Badge color="amber">Pending Review</Badge>
              </div>

              {isEditing ? (
                <InlineEditForm goal={g} onSave={updates => saveEdit(g, updates)} onCancel={() => setEditGoal(null)} />
              ) : (
                <div style={{ background:"var(--gp-bg)", borderRadius:8, padding:12, marginBottom:12, display:"flex", gap:24, fontSize:13 }}>
                  <span><span style={{color:"var(--gp-text-muted)"}}>Thrust:</span> <strong>{g.thrustArea}</strong></span>
                  <span><span style={{color:"var(--gp-text-muted)"}}>UoM:</span> <strong>{g.uom}</strong></span>
                  <span><span style={{color:"var(--gp-text-muted)"}}>Target:</span> <strong>{g.target}</strong></span>
                  <span><span style={{color:"var(--gp-text-muted)"}}>Weight:</span> <strong style={{color:"#6366f1"}}>{g.weightage}%</strong></span>
                </div>
              )}

              <div style={{ marginBottom:12 }}>
                <input value={remarks[g.id]||""} onChange={e=>setRemarks(r=>({...r,[g.id]:e.target.value}))}
                  placeholder="Add remarks for employee (optional)..."
                  style={{ ...inputStyle, width:"100%", boxSizing:"border-box" }} />
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => approve(g)} style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontSize:14, fontWeight:600, cursor:"pointer" }}>✓ Approve & Lock</button>
                <button onClick={() => setEditGoal(g.id)} style={{ background:"var(--gp-accent-soft)", color:"#6366f1", border:"none", borderRadius:8, padding:"9px 20px", fontSize:14, fontWeight:600, cursor:"pointer" }}>✏ Edit Inline</button>
                <button onClick={() => reject(g)} style={{ background:"var(--gp-danger-bg)", color:"#dc2626", border:"none", borderRadius:8, padding:"9px 20px", fontSize:14, fontWeight:600, cursor:"pointer" }}>↩ Return for Rework</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ALREADY PROCESSED */}
      {teamGoals.filter(g=>g.status!=="Pending Approval").length > 0 && (
        <div style={{ marginTop:28 }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:"var(--gp-text-secondary)", marginBottom:12 }}>Previously Processed</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {teamGoals.filter(g=>g.status!=="Pending Approval").map(g => (
              <div key={g.id} style={{ background:"var(--gp-surface)", borderRadius:10, border:"1px solid var(--gp-border)", padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color:"var(--gp-text)" }}>{g.title}</div>
                  <div style={{ fontSize:12, color:"var(--gp-text-secondary)" }}>{empMap[g.employeeId]?.name} · {g.weightage}%</div>
                </div>
                {statusBadge(g.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InlineEditForm({ goal, onSave, onCancel }) {
  const [target, setTarget] = useState(goal.target);
  const [weightage, setWeightage] = useState(goal.weightage);
  return (
    <div style={{ background:"var(--gp-accent-bg)", borderRadius:8, padding:14, marginBottom:12 }}>
      <div style={{ fontSize:13, fontWeight:600, color:"#6366f1", marginBottom:10 }}>Editing inline (Manager override)</div>
      <div style={{ display:"flex", gap:12 }}>
        <FormField label="Target">
          <input type="number" value={target} onChange={e=>setTarget(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label="Weightage (%)">
          <input type="number" value={weightage} onChange={e=>setWeightage(e.target.value)} min={10} max={100} style={inputStyle} />
        </FormField>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <button onClick={() => onSave({ target: parseFloat(target), weightage: parseInt(weightage) })}
          style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:6, padding:"6px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Save Changes</button>
        <button onClick={onCancel} style={{ background:"var(--gp-muted)", border:"none", borderRadius:6, padding:"6px 14px", fontSize:13, cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── CHECK-INS ────────────────────────────────────────────────────────────────
function CheckIns({ currentUser, users, teamGoals, goals, setGoals, addAudit, notify }) {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [comments, setComments] = useState({});
  const teamMembers = users.filter(u => u.managerId === currentUser.id);
  const activeQ = "Q2";

  function saveComment(goalId) {
    const c = comments[goalId];
    if (!c?.trim()) return;
    setGoals(prev => prev.map(g => g.id === goalId ? {
      ...g, checkInComments: { ...g.checkInComments, [activeQ]: { text:c, by:currentUser.name, at: new Date().toISOString() } }
    } : g));
    addAudit(goalId, "Check-in Comment Added", currentUser.name, c);
    notify("Check-in comment saved!");
  }

  const empGoals = selectedEmp ? goals.filter(g => g.employeeId === selectedEmp.id && g.locked) : [];

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>Q2 Check-ins</h2>
      <p style={{ color:"var(--gp-text-secondary)", margin:"0 0 20px", fontSize:13 }}>Review Planned vs Actual and document your check-in discussion</p>

      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:20 }}>
        {/* TEAM LIST */}
        <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:12 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--gp-text-muted)", textTransform:"uppercase", letterSpacing:.5, padding:"4px 8px 8px" }}>Team Members</div>
          {teamMembers.map(emp => {
            const eg = goals.filter(g=>g.employeeId===emp.id && g.locked);
            const hasCheckin = eg.some(g=>g.checkInComments[activeQ]);
            return (
              <button key={emp.id} onClick={() => setSelectedEmp(emp)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"10px 10px", borderRadius:8, border:"none", background: selectedEmp?.id===emp.id?"var(--gp-accent-bg)":"transparent", cursor:"pointer", marginBottom:2, textAlign:"left" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--gp-text)" }}>{emp.name}</div>
                  <div style={{ fontSize:11, color:"var(--gp-text-muted)" }}>{eg.length} goals</div>
                </div>
                {hasCheckin ? <span style={{fontSize:16}}>✅</span> : <span style={{fontSize:16}}>⏳</span>}
              </button>
            );
          })}
        </div>

        {/* CHECK-IN PANEL */}
        <div>
          {!selectedEmp && (
            <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px dashed var(--gp-border)", padding:60, textAlign:"center", color:"var(--gp-text-muted)" }}>
              <div style={{ fontSize:32 }}>💬</div>
              <div style={{ fontSize:15, marginTop:12 }}>Select a team member to begin check-in</div>
            </div>
          )}
          {selectedEmp && (
            <div>
              <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:20, marginBottom:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"var(--gp-text)" }}>{selectedEmp.name} — Q2 Check-in</div>
                <div style={{ fontSize:13, color:"var(--gp-text-secondary)", marginTop:4 }}>Q2 Score: <strong style={{color:"#6366f1"}}>{weightedScore(empGoals,activeQ)}%</strong> weighted</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {empGoals.map(g => {
                  const ach = g.achievements[activeQ];
                  const score = computeScore(g.uom, g.target, ach);
                  const prevComment = g.checkInComments[activeQ];
                  return (
                    <div key={g.id} style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:18 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"var(--gp-text)", marginBottom:10 }}>{g.title}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
                        <div style={{ background:"var(--gp-bg)", borderRadius:8, padding:12, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:"var(--gp-text-muted)", marginBottom:4 }}>TARGET</div>
                          <div style={{ fontSize:18, fontWeight:700, color:"var(--gp-text)" }}>{g.target}</div>
                        </div>
                        <div style={{ background:"var(--gp-success-bg)", borderRadius:8, padding:12, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:"var(--gp-text-muted)", marginBottom:4 }}>ACTUAL (Q2)</div>
                          <div style={{ fontSize:18, fontWeight:700, color: ach!==null?"#16a34a":"var(--gp-text-muted)" }}>{ach ?? "Not logged"}</div>
                        </div>
                        <div style={{ background: score!==null?(score>=80?"var(--gp-success-bg)":score>=50?"var(--gp-warning-bg)":"var(--gp-danger-surface)"):"var(--gp-muted-2)", borderRadius:8, padding:12, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:"var(--gp-text-muted)", marginBottom:4 }}>SCORE</div>
                          <div style={{ fontSize:18, fontWeight:700, color: score!==null?(score>=80?"#16a34a":score>=50?"#d97706":"#dc2626"):"#94a3b8" }}>{score !== null ? score+"%" : "N/A"}</div>
                        </div>
                      </div>
                      {prevComment && (
                        <div style={{ background:"var(--gp-accent-bg)", borderRadius:8, padding:10, marginBottom:8, fontSize:12, color:"var(--gp-comment-text)" }}>
                          <strong>Previous comment:</strong> {prevComment.text}
                        </div>
                      )}
                      <textarea value={comments[g.id]||""} onChange={e=>setComments(c=>({...c,[g.id]:e.target.value}))}
                        rows={2} placeholder="Add structured check-in comment (e.g. Good progress, keep up momentum)..."
                        style={{ ...inputStyle, width:"100%", boxSizing:"border-box", resize:"vertical" }} />
                      <button onClick={() => saveComment(g.id)}
                        style={{ marginTop:8, background:"#6366f1", color:"#fff", border:"none", borderRadius:6, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        Save Comment
                      </button>
                    </div>
                  );
                })}
                {empGoals.length === 0 && <div style={{ color:"var(--gp-text-muted)", fontSize:14, padding:20, textAlign:"center" }}>No locked goals for this employee.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TEAM GOALS ──────────────────────────────────────────────────────────────
function TeamGoals({ currentUser, users, teamGoals, goals, setGoals, addAudit, notify }) {
  const empMap = {};
  users.forEach(u => empMap[u.id] = u);

  return (
    <div>
      <h2 style={{ margin:"0 0 20px", fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>Team Goal Overview</h2>
      {teamGoals.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, background:"var(--gp-surface)", borderRadius:12, border:"1px dashed var(--gp-border)", color:"var(--gp-text-muted)" }}>
          <div style={{ fontSize:36 }}>👥</div>
          <div style={{ fontSize:16, fontWeight:500, marginTop:12 }}>No team goals yet</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {teamGoals.map(g => (
            <div key={g.id} style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:18, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ display:"flex", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                  {statusBadge(g.status)}
                  <Badge color="purple">{g.thrustArea}</Badge>
                  {g.locked && <Badge color="gray">🔒</Badge>}
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:"var(--gp-text)" }}>{g.title}</div>
                <div style={{ fontSize:12, color:"var(--gp-text-secondary)", marginTop:4 }}>
                  {empMap[g.employeeId]?.name} · Target: {g.target} · Weight: {g.weightage}%
                </div>
                <div style={{ fontSize:12, color:"var(--gp-text-muted)", marginTop:4 }}>
                  Q1: {g.achievements.Q1??"-"} | Q2: {g.achievements.Q2??"-"} | Q3: {g.achievements.Q3??"-"} | Q4: {g.achievements.Q4??"-"}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:700, color:"#6366f1" }}>{g.weightage}%</div>
                <div style={{ fontSize:11, color:"var(--gp-text-muted)" }}>weightage</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN: ALL GOALS ────────────────────────────────────────────────────────
function AllGoals({ users, goals, setGoals, addAudit, notify }) {
  const [filter, setFilter] = useState("all");
  const empMap = {};
  users.forEach(u => empMap[u.id] = u);

  const filtered = filter === "all" ? goals : goals.filter(g => g.status === filter);

  function unlockGoal(g) {
    setGoals(prev => prev.map(goal => goal.id === g.id ? { ...goal, locked:false, status:"Draft" } : goal));
    addAudit(g.id, "Goal Unlocked by Admin", "Admin HR", "Admin override — goal unlocked for editing");
    notify("Goal unlocked for editing (Admin override).");
  }

  return (
    <div>
      <h2 style={{ margin:"0 0 16px", fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>All Goals — Admin View</h2>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {["all","Approved","Pending Approval","Rejected","Draft"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:"6px 14px", borderRadius:99, border:"1px solid var(--gp-border)", background: filter===s?"#6366f1":"var(--gp-surface)", color: filter===s?"#fff":"var(--gp-text-tertiary)", fontSize:13, cursor:"pointer", fontWeight: filter===s?600:400 }}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>
      <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:"var(--gp-bg)" }}>
            {["Employee","Dept","Goal","Thrust Area","Target","Weight","Q1","Q2","Status","Action"].map(h=>(
              <th key={h} style={{ padding:"10px 14px", fontSize:11, fontWeight:600, color:"var(--gp-text-secondary)", textAlign:"left", textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((g,i) => {
              const emp = empMap[g.employeeId];
              return (
                <tr key={g.id} style={{ borderTop:"1px solid var(--gp-border-light)", background: i%2?"var(--gp-surface-alt)":"var(--gp-surface)" }}>
                  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:500, color:"var(--gp-text)", whiteSpace:"nowrap" }}>{emp?.name}</td>
                  <td style={{ padding:"10px 14px", fontSize:12, color:"var(--gp-text-secondary)" }}>{emp?.dept}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, color:"var(--gp-text)", maxWidth:180 }}>{g.title}</td>
                  <td style={{ padding:"10px 14px", fontSize:12 }}><Badge color="purple">{g.thrustArea.split(" ")[0]}</Badge></td>
                  <td style={{ padding:"10px 14px", fontSize:13 }}>{g.target}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:600, color:"#6366f1" }}>{g.weightage}%</td>
                  <td style={{ padding:"10px 14px", fontSize:12 }}>{g.achievements.Q1 ?? <span style={{color:"var(--gp-placeholder)"}}>—</span>}</td>
                  <td style={{ padding:"10px 14px", fontSize:12 }}>{g.achievements.Q2 ?? <span style={{color:"var(--gp-placeholder)"}}>—</span>}</td>
                  <td style={{ padding:"10px 14px" }}>{statusBadge(g.status)}</td>
                  <td style={{ padding:"10px 14px" }}>
                    {g.locked && (
                      <button onClick={() => unlockGoal(g)}
                        style={{ background:"var(--gp-unlock-bg)", color:"var(--gp-unlock-text)", border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>
                        🔓 Unlock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding:40, textAlign:"center", color:"var(--gp-text-muted)" }}>No goals found.</div>}
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports({ users, goals }) {
  const empMap = {};
  users.forEach(u => empMap[u.id] = u);
  const employees = users.filter(u => u.role === "employee");

  function exportCSV() {
    const rows = [["Employee","Department","Goal","Thrust Area","UoM","Target","Q1 Actual","Q1 Score","Q2 Actual","Q2 Score","Weightage","Status"]];
    goals.forEach(g => {
      const emp = empMap[g.employeeId];
      if (!emp) return;
      rows.push([
        emp.name, emp.dept, g.title, g.thrustArea, g.uom, g.target,
        g.achievements.Q1 ?? "", computeScore(g.uom,g.target,g.achievements.Q1) ?? "",
        g.achievements.Q2 ?? "", computeScore(g.uom,g.target,g.achievements.Q2) ?? "",
        g.weightage, g.status
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "achievement_report.csv"; a.click();
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>Reports & Governance</h2>
        <button onClick={exportCSV} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* COMPLETION DASHBOARD */}
      <h3 style={{ fontSize:15, fontWeight:600, color:"var(--gp-text)", marginBottom:12 }}>Completion Dashboard — Q2 Check-in</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12, marginBottom:28 }}>
        {employees.map(emp => {
          const eg = goals.filter(g => g.employeeId === emp.id);
          const approved = eg.filter(g => g.locked);
          const logged = approved.filter(g => g.achievements.Q2 !== null);
          const pct = approved.length ? Math.round((logged.length/approved.length)*100) : 0;
          const mgr = users.find(u => u.id === emp.managerId);
          return (
            <div key={emp.id} style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--gp-text)" }}>{emp.name}</div>
                  <div style={{ fontSize:12, color:"var(--gp-text-secondary)" }}>{emp.dept} · {mgr?.name}</div>
                </div>
                <div style={{ fontSize:20, fontWeight:800, color: pct===100?"#16a34a":pct>50?"#d97706":"#dc2626" }}>{pct}%</div>
              </div>
              {progressBar(pct)}
              <div style={{ fontSize:11, color:"var(--gp-text-muted)", marginTop:6 }}>{logged.length}/{approved.length} actuals logged</div>
            </div>
          );
        })}
      </div>

      {/* ACHIEVEMENT TABLE */}
      <h3 style={{ fontSize:15, fontWeight:600, color:"var(--gp-text)", marginBottom:12 }}>Achievement Report — All Employees</h3>
      <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
          <thead><tr style={{ background:"var(--gp-bg)" }}>
            {["Employee","Goal","Target","Q1 Actual","Q1 Score%","Q2 Actual","Q2 Score%","Weight","Status"].map(h=>(
              <th key={h} style={{ padding:"10px 14px", fontSize:11, fontWeight:600, color:"var(--gp-text-secondary)", textAlign:"left", textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {goals.map((g,i) => {
              const emp = empMap[g.employeeId];
              const s1 = computeScore(g.uom,g.target,g.achievements.Q1);
              const s2 = computeScore(g.uom,g.target,g.achievements.Q2);
              return (
                <tr key={g.id} style={{ borderTop:"1px solid var(--gp-border-light)", background: i%2?"var(--gp-surface-alt)":"var(--gp-surface)" }}>
                  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:500, color:"var(--gp-text)" }}>{emp?.name}</td>
                  <td style={{ padding:"10px 14px", fontSize:12, color:"var(--gp-text-tertiary)", maxWidth:160 }}>{g.title}</td>
                  <td style={{ padding:"10px 14px", fontSize:13 }}>{g.target}</td>
                  <td style={{ padding:"10px 14px", fontSize:13 }}>{g.achievements.Q1 ?? "—"}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:600, color: s1!==null?(s1>=80?"#16a34a":s1>=50?"#d97706":"#dc2626"):"var(--gp-placeholder)" }}>{s1 !== null ? s1+"%" : "—"}</td>
                  <td style={{ padding:"10px 14px", fontSize:13 }}>{g.achievements.Q2 ?? "—"}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:600, color: s2!==null?(s2>=80?"#16a34a":s2>=50?"#d97706":"#dc2626"):"var(--gp-placeholder)" }}>{s2 !== null ? s2+"%" : "—"}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:600, color:"#6366f1" }}>{g.weightage}%</td>
                  <td style={{ padding:"10px 14px" }}>{statusBadge(g.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────
function AuditTrail({ auditLog, goals, users }) {
  const goalMap = {};
  goals.forEach(g => goalMap[g.id] = g);

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>Audit Trail</h2>
      <p style={{ color:"var(--gp-text-secondary)", margin:"0 0 20px", fontSize:13 }}>All system changes logged automatically — who changed what and when</p>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {[...auditLog].reverse().map(a => {
          const goal = goalMap[a.goalId];
          return (
            <div key={a.id} style={{ background:"var(--gp-surface)", borderRadius:10, border:"1px solid var(--gp-border)", padding:14, display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", marginTop:5, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"var(--gp-text)" }}>{a.action}</span>
                  <span style={{ fontSize:12, color:"var(--gp-text-muted)" }}>{new Date(a.at).toLocaleString("en-IN")}</span>
                </div>
                {goal && <div style={{ fontSize:12, color:"#6366f1", marginBottom:2 }}>Goal: {goal.title}</div>}
                <div style={{ fontSize:12, color:"var(--gp-text-secondary)" }}>By: <strong>{a.by}</strong> · {a.detail}</div>
              </div>
            </div>
          );
        })}
        {auditLog.length === 0 && (
          <div style={{ textAlign:"center", padding:40, color:"var(--gp-text-muted)" }}>No audit entries yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED GOALS ────────────────────────────────────────────────────────────
function SharedGoals({ users, goals, setGoals, addAudit, notify }) {
  const employees = users.filter(u => u.role === "employee");
  const [form, setForm] = useState({ title:"", thrustArea:"Revenue Growth", uom:UOM_TYPES[0], target:"", selectedEmps:[], defaultWeight:20 });
  const [errors, setErrors] = useState({});

  function pushSharedGoal() {
    if (!form.title.trim()) { setErrors({ title:"Required" }); return; }
    if (!form.target) { setErrors({ target:"Required" }); return; }
    if (!form.selectedEmps.length) { setErrors({ emps:"Select at least one employee" }); return; }
    const newGoals = form.selectedEmps.map(empId => ({
      id: "g" + Date.now() + Math.random(),
      employeeId: empId,
      thrustArea: form.thrustArea,
      title: form.title,
      description: "Shared departmental KPI — target is read-only",
      uom: form.uom,
      target: parseFloat(form.target),
      weightage: form.defaultWeight,
      status: "Approved",
      achievements: { Q1:null, Q2:null, Q3:null, Q4:null },
      checkInComments: {},
      isShared: true,
      sharedFrom: "Admin HR",
      locked: true,
      createdAt: new Date().toISOString().split("T")[0],
    }));
    setGoals(prev => [...prev, ...newGoals]);
    newGoals.forEach(g => addAudit(g.id, "Shared Goal Pushed", "Admin HR", `KPI pushed to ${users.find(u=>u.id===g.employeeId)?.name}`));
    notify(`Shared goal pushed to ${form.selectedEmps.length} employee(s)!`);
    setForm({ title:"", thrustArea:"Revenue Growth", uom:UOM_TYPES[0], target:"", selectedEmps:[], defaultWeight:20 });
    setErrors({});
  }

  const sharedGoals = goals.filter(g => g.isShared);

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"var(--gp-text)" }}>Shared Goals — Push KPIs</h2>
      <p style={{ color:"var(--gp-text-secondary)", margin:"0 0 20px", fontSize:13 }}>Push a departmental KPI to multiple employees. Title and target are read-only; employees may adjust weightage only.</p>

      <div style={{ background:"var(--gp-surface)", borderRadius:12, border:"1px solid var(--gp-border)", padding:24, marginBottom:24 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:600 }}>Push New Shared Goal</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <FormField label="Thrust Area">
            <select value={form.thrustArea} onChange={e=>setForm(f=>({...f,thrustArea:e.target.value}))} style={inputStyle}>
              {THRUST_AREAS.map(a=><option key={a}>{a}</option>)}
            </select>
          </FormField>
          <FormField label="UoM">
            <select value={form.uom} onChange={e=>setForm(f=>({...f,uom:e.target.value}))} style={inputStyle}>
              {UOM_TYPES.map(u=><option key={u}>{u}</option>)}
            </select>
          </FormField>
          <FormField label="KPI Title (read-only for employees)" error={errors.title} required style={{ gridColumn:"1/-1" }}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Department Safety Score" style={inputStyle} />
          </FormField>
          <FormField label="Target (read-only for employees)" error={errors.target} required>
            <input type="number" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} placeholder="e.g. 100" style={inputStyle} />
          </FormField>
          <FormField label="Default Weightage %">
            <input type="number" value={form.defaultWeight} onChange={e=>setForm(f=>({...f,defaultWeight:parseInt(e.target.value)||10}))} min={10} max={100} style={inputStyle} />
          </FormField>
        </div>
        <FormField label="Push to Employees" error={errors.emps} required style={{ marginTop:16 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:12, background:"var(--gp-bg)", borderRadius:8, border:"1px solid var(--gp-border)" }}>
            {employees.map(emp => (
              <label key={emp.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:99, background: form.selectedEmps.includes(emp.id)?"var(--gp-accent-soft)":"var(--gp-surface)", border:"1px solid", borderColor: form.selectedEmps.includes(emp.id)?"#8b5cf6":"var(--gp-border)", cursor:"pointer", fontSize:13, fontWeight: form.selectedEmps.includes(emp.id)?600:400, color: form.selectedEmps.includes(emp.id)?"#a78bfa":"var(--gp-text-tertiary)", transition:"all .15s" }}>
                <input type="checkbox" checked={form.selectedEmps.includes(emp.id)} onChange={e => {
                  setForm(f => ({...f, selectedEmps: e.target.checked ? [...f.selectedEmps, emp.id] : f.selectedEmps.filter(id=>id!==emp.id)}));
                }} style={{ display:"none" }} />
                {emp.name}
              </label>
            ))}
          </div>
        </FormField>
        <button onClick={pushSharedGoal} style={{ marginTop:16, background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
          Push to Selected Employees
        </button>
      </div>

      {/* EXISTING SHARED GOALS */}
      {sharedGoals.length > 0 && (
        <div>
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:12, color:"var(--gp-text)" }}>Active Shared Goals</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {sharedGoals.map(g => {
              const emp = users.find(u=>u.id===g.employeeId);
              return (
                <div key={g.id} style={{ background:"var(--gp-surface)", borderRadius:10, border:"1px solid var(--gp-border)", padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ display:"flex", gap:6, marginBottom:4 }}>
                      <Badge color="blue">Shared</Badge>
                      <Badge color="purple">{g.thrustArea}</Badge>
                    </div>
                    <div style={{ fontSize:14, fontWeight:500, color:"var(--gp-text)" }}>{g.title}</div>
                    <div style={{ fontSize:12, color:"var(--gp-text-secondary)" }}>→ {emp?.name} · Target: {g.target} · Weight: {g.weightage}%</div>
                  </div>
                  <div style={{ fontSize:13, color:"var(--gp-text-muted)" }}>Pushed by Admin</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function FormField({ label, error, required, children, style }) {
  return (
    <div style={style}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--gp-text)", marginBottom:6 }}>
        {label}{required && <span style={{ color:"#dc2626", marginLeft:2 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize:11, color:"#dc2626", marginTop:4 }}>⚠ {error}</div>}
    </div>
  );
}

const inputStyle = {
  width:"100%",
  padding:"8px 12px",
  borderRadius:8,
  border:"1px solid var(--gp-input-border)",
  fontSize:13,
  color:"var(--gp-text)",
  background:"var(--gp-input-bg)",
  outline:"none",
  boxSizing:"border-box",
  fontFamily:"inherit",
};
