import { useState, useEffect } from "react";
import { fetchMyGoals, fetchTeamGoals, fetchAllGoals, fetchAllUsers, createGoal, approveGoal, rejectGoal, logAchievement, saveCheckin, deleteGoal } from "./api";
import { ThemeToggle } from "./ThemeContext.jsx";
import LoginPage from "./LoginPage";
import ChatBot from "./ChatBot";
import './responsive.css'

// ─── DATA SEED ───────────────────────────────────────────────────────────────
const THRUST_AREAS = ["Revenue Growth","Cost Optimization","Customer Experience","People Development","Operational Excellence","Innovation & Technology","Compliance & Governance","Sustainability"];
const UOM_TYPES = ["Numeric (Min - Higher is better)","Numeric (Max - Lower is better)","% (Min - Higher is better)","% (Max - Lower is better)","Timeline","Zero-based"];
const STATUSES = ["Not Started","On Track","Completed"];
const QUARTERS = ["Q1 (July)","Q2 (October)","Q3 (January)","Q4/Annual (March/April)"];

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
  return (
    <div style={{ background:"#e5e7eb", borderRadius:99, height:6, width:"100%", marginTop:4 }}>
      <div style={{ background:c, width:`${Math.min(pct,100)}%`, height:"100%", borderRadius:99 }} />
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState(SEED_AUDIT);
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [notification, setNotification] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const role = currentUser.role;
        const [goalsData, usersData] = await Promise.all([
          role === "admin" ? fetchAllGoals() :
          role === "manager" ? fetchTeamGoals() :
          fetchMyGoals(),
          fetchAllUsers()
        ]);
        setGoals(Array.isArray(goalsData) ? goalsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (currentUser) loadData();
  }, [currentUser]);

  function handleLogin(authUser) {
    localStorage.setItem("goalquest_token", authUser.token);
    setCurrentUser(authUser);
    setLoggedInUser(authUser);
    setView("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("goalquest_token");
    localStorage.removeItem("goalquest_user");
    setLoggedInUser(null);
    setCurrentUser(null);
  }

  if (!loggedInUser) return <LoginPage onLogin={handleLogin} />;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", background:"#f8fafc" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40 }}>🎯</div>
        <div style={{ fontSize:16, fontWeight:600, color:"#6366f1", marginTop:12 }}>Loading GoalQuest...</div>
      </div>
    </div>
  );

  function notify(msg, type="success") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function addAudit(goalId, action, by, detail) {
    setAuditLog(prev => [...prev, { id:"au"+Date.now(), goalId, action, by, at: new Date().toISOString(), detail }]);
  }

  const myGoals = goals.filter(g => g.employeeId === currentUser._id);
  const teamGoals = goals.filter(g => users.find(u => u._id === g.employeeId && u.managerId === currentUser._id));
  const allGoals = goals;
  const role = currentUser.role;

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

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:"100vh", background:"#f8fafc", display:"flex", flexDirection:"column" }}>

      {/* ── TOP BAR ── */}
      <header style={{ background:"#1e293b", color:"#fff", padding:"0 16px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 3px #0003", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* hamburger — mobile only */}
          <button onClick={() => setMenuOpen(o => !o)}
            className="hamburger-btn"
            style={{ display:"none", background:"none", border:"none", color:"#fff", fontSize:22, cursor:"pointer", padding:4 }}>
            ☰
          </button>
          <div style={{ width:30, height:30, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🎯</div>
          <span style={{ fontWeight:700, fontSize:15, letterSpacing:-.3 }}>GoalQuest</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={handleLogout} style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Logout
          </button>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>
            {currentUser.name?.split(" ").map(n=>n[0]).join("").slice(0,2)}
          </div>
        </div>
      </header>

      {/* ── NOTIFICATION ── */}
      {notification && (
        <div style={{ position:"fixed", top:64, right:16, zIndex:200, background: notification.type==="success"?"#16a34a":"#dc2626", color:"#fff", padding:"10px 18px", borderRadius:8, boxShadow:"0 4px 12px #0003", fontSize:13, fontWeight:500, maxWidth:"90vw" }}>
          {notification.msg}
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ display:"flex", flex:1, position:"relative" }}>

        {/* ── SIDEBAR (desktop) / DRAWER (mobile) ── */}
        <>
          {/* mobile overlay */}
          {menuOpen && (
            <div onClick={() => setMenuOpen(false)}
              style={{ position:"fixed", inset:0, background:"#0006", zIndex:149 }}
              className="mobile-overlay" />
          )}

          <nav className={`app-sidebar ${menuOpen ? "sidebar-open" : ""}`}
            style={{ width:200, background:"#fff", borderRight:"1px solid #e2e8f0", padding:"16px 8px", display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:1, padding:"8px 10px 4px" }}>
              {role.toUpperCase()}
            </div>
            {(navItems[role]||[]).map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setMenuOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:"none", background: view===item.id ? "#f1f5f9" : "transparent", color: view===item.id ? "#6366f1" : "#475569", fontWeight: view===item.id ? 600 : 400, fontSize:14, cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </>

        {/* ── MAIN CONTENT ── */}
        <main className="app-main" style={{ flex:1, padding:24, overflowY:"auto", maxHeight:"calc(100vh - 56px)" }}>
          {view === "dashboard"    && <Dashboard currentUser={currentUser} users={users} goals={goals} myGoals={myGoals} teamGoals={teamGoals} />}
          {view === "my-goals"     && <MyGoals currentUser={currentUser} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "achievements" && <Achievements currentUser={currentUser} myGoals={myGoals} setGoals={setGoals} notify={notify} />}
          {view === "team-goals"   && <TeamGoals currentUser={currentUser} users={users} teamGoals={teamGoals} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "approvals"    && <Approvals currentUser={currentUser} users={users} teamGoals={teamGoals} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "checkins"     && <CheckIns currentUser={currentUser} users={users} teamGoals={teamGoals} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "all-goals"    && <AllGoals users={users} goals={allGoals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
          {view === "reports"      && <Reports users={users} goals={allGoals} />}
          {view === "audit"        && <AuditTrail auditLog={auditLog} goals={allGoals} users={users} />}
          {view === "shared-goals" && <SharedGoals users={users} goals={goals} setGoals={setGoals} addAudit={addAudit} notify={notify} />}
        </main>
      </div>

      {/* ── CHATBOT ── */}
      <ChatBot />

    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ currentUser, users, goals, myGoals, teamGoals }) {
  const role = currentUser.role;
  const approvedMy = myGoals.filter(g=>g.status==="Approved");
  const pendingMy  = myGoals.filter(g=>g.status==="Pending Approval");
  const score = weightedScore(approvedMy, "Q2");
  const teamMembers = users.filter(u=>u.managerId===currentUser._id);
  const pendingApprovals = teamGoals.filter(g=>g.status==="Pending Approval");
  const allEmps = users.filter(u=>u.role==="employee");
  const submittedCount = [...new Set(goals.filter(g=>g.status!=="Draft").map(g=>g.employeeId))].length;
  const approvedCount  = [...new Set(goals.filter(g=>g.status==="Approved").map(g=>g.employeeId))].length;

  return (
    <div>
      <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:700, color:"#1e293b" }}>Welcome back, {currentUser.name?.split(" ")[0]} 👋</h2>
      <p style={{ color:"#64748b", margin:"0 0 20px", fontSize:13 }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>

      {/* CYCLE STATUS */}
      <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:12, padding:18, color:"#fff", marginBottom:20 }}>
        <div style={{ fontSize:12, opacity:.85 }}>Current Phase</div>
        <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>Q2 Check-in Window</div>
        <div style={{ fontSize:12, opacity:.85, marginTop:4 }}>October — Progress Update: Planned vs. Actual</div>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
        {role==="employee" && <>
          <StatCard icon="🎯" label="My Goals"  value={myGoals.length}      sub="created"      color="#6366f1" />
          <StatCard icon="✅" label="Approved"   value={approvedMy.length}   sub="locked"       color="#16a34a" />
          <StatCard icon="⏳" label="Pending"    value={pendingMy.length}    sub="awaiting mgr" color="#d97706" />
          <StatCard icon="📊" label="Q2 Score"   value={score?score+"%":"N/A"} sub="weighted"   color="#0ea5e9" />
        </>}
        {role==="manager" && <>
          <StatCard icon="👥" label="Team Size"      value={teamMembers.length}                              sub="direct reports" color="#6366f1" />
          <StatCard icon="⏳" label="Pending Review"  value={pendingApprovals.length}                        sub="need action"    color="#d97706" />
          <StatCard icon="✅" label="Approved"         value={teamGoals.filter(g=>g.status==="Approved").length} sub="goal entries" color="#16a34a" />
          <StatCard icon="💬" label="Check-ins Due"   value={teamMembers.length}                             sub="Q2 window"      color="#0ea5e9" />
        </>}
        {role==="admin" && <>
          <StatCard icon="👤" label="Employees"  value={allEmps.length}     sub="active"     color="#6366f1" />
          <StatCard icon="📝" label="Submitted"  value={submittedCount}     sub="employees"  color="#0ea5e9" />
          <StatCard icon="✅" label="Approved"   value={approvedCount}      sub="employees"  color="#16a34a" />
          <StatCard icon="🗂" label="Total Goals" value={goals.length}      sub="all entries" color="#d97706" />
        </>}
      </div>

      {/* TABLE */}
      {role==="employee" && approvedMy.length>0 && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9", fontSize:14, fontWeight:600, color:"#1e293b" }}>My Goal Sheet Summary</div>
          <div className="table-wrapper">
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
              <thead><tr style={{ background:"#f8fafc" }}>
                {["Goal","Thrust Area","Weight","Q1","Q2","Status"].map(h=>(
                  <th key={h} style={{ padding:"9px 14px", fontSize:11, fontWeight:600, color:"#64748b", textAlign:"left", textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {myGoals.map((g,i)=>(
                  <tr key={g._id||g.id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"#fff" }}>
                    <td style={{ padding:"9px 14px", fontSize:13, fontWeight:500, color:"#1e293b" }}>{g.title}</td>
                    <td style={{ padding:"9px 14px", fontSize:12, color:"#64748b" }}>{g.thrustArea}</td>
                    <td style={{ padding:"9px 14px", fontSize:13, fontWeight:600, color:"#6366f1" }}>{g.weightage}%</td>
                    <td style={{ padding:"9px 14px", fontSize:12 }}>{g.achievements?.Q1!=null?<span style={{color:"#16a34a",fontWeight:500}}>{g.achievements.Q1}</span>:<span style={{color:"#94a3b8"}}>—</span>}</td>
                    <td style={{ padding:"9px 14px", fontSize:12 }}>{g.achievements?.Q2!=null?<span style={{color:"#16a34a",fontWeight:500}}>{g.achievements.Q2}</span>:<span style={{color:"#94a3b8"}}>—</span>}</td>
                    <td style={{ padding:"9px 14px" }}>{statusBadge(g.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {role==="manager" && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9", fontSize:14, fontWeight:600, color:"#1e293b" }}>Team Q2 Progress</div>
          <div className="table-wrapper">
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:400 }}>
              <thead><tr style={{ background:"#f8fafc" }}>
                {["Employee","Goals","Approved","Q2 Score","Check-in"].map(h=>(
                  <th key={h} style={{ padding:"9px 14px", fontSize:11, fontWeight:600, color:"#64748b", textAlign:"left", textTransform:"uppercase", letterSpacing:.5 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {teamMembers.map((emp,i)=>{
                  const eg = goals.filter(g=>g.employeeId===emp._id);
                  const approved = eg.filter(g=>g.locked);
                  const sc = weightedScore(approved,"Q2");
                  return (
                    <tr key={emp._id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"#fff" }}>
                      <td style={{ padding:"9px 14px", fontSize:13, fontWeight:500, color:"#1e293b" }}>{emp.name}</td>
                      <td style={{ padding:"9px 14px", fontSize:13 }}>{eg.length}</td>
                      <td style={{ padding:"9px 14px", fontSize:13 }}>{approved.length}</td>
                      <td style={{ padding:"9px 14px", fontSize:13, fontWeight:600, color:sc>70?"#16a34a":sc>40?"#d97706":"#dc2626" }}>{sc}%</td>
                      <td style={{ padding:"9px 14px" }}><Badge color="amber">Due</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"16px 18px" }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", marginTop:4 }}>{label}</div>
      <div style={{ fontSize:11, color:"#94a3b8" }}>{sub}</div>
    </div>
  );
}

// ─── MY GOALS ────────────────────────────────────────────────────────────────
function MyGoals({ currentUser, goals, setGoals, addAudit, notify }) {
  const myGoals = goals.filter(g => g.employeeId === currentUser._id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ thrustArea:"Revenue Growth", title:"", description:"", uom:UOM_TYPES[0], target:"", weightage:"" });
  const [errors, setErrors] = useState({});

  const totalWeight = myGoals.reduce((s,g)=>s+g.weightage,0);

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.target) e.target = "Target is required";
    const w = parseInt(form.weightage);
    if (!w || w < 10) e.weightage = "Minimum 10%";
    if (w > 100) e.weightage = "Cannot exceed 100%";
    if (totalWeight + w > 100) e.weightage = `Would exceed 100% (current: ${totalWeight}%)`;
    return e;
  }

  function submitGoal() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const newGoal = {
      id:"g"+Date.now(), employeeId:currentUser._id,
      thrustArea:form.thrustArea, title:form.title, description:form.description,
      uom:form.uom, target:parseFloat(form.target), weightage:parseInt(form.weightage),
      status:"Pending Approval", achievements:{Q1:null,Q2:null,Q3:null,Q4:null},
      checkInComments:{}, isShared:false, sharedFrom:null, locked:false,
      createdAt:new Date().toISOString().split("T")[0],
    };
    setGoals(prev=>[...prev,newGoal]);
    addAudit(newGoal.id,"Goal Submitted",currentUser.name,`Target: ${form.target}, Weight: ${form.weightage}%`);
    notify("Goal submitted for manager approval!");
    setShowForm(false);
    setForm({thrustArea:"Revenue Growth",title:"",description:"",uom:UOM_TYPES[0],target:"",weightage:""});
    setErrors({});
  }

  const remaining = 100 - totalWeight;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>My Goal Sheet</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#64748b" }}>FY 2025–26 · Max 8 goals · Total weightage = 100%</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, color:"#64748b" }}>Total Weight</div>
            <div style={{ fontSize:20, fontWeight:700, color:totalWeight===100?"#16a34a":totalWeight>100?"#dc2626":"#d97706" }}>{totalWeight}%</div>
          </div>
          {myGoals.length < 8 && (
            <button onClick={()=>setShowForm(true)}
              style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              + Add Goal
            </button>
          )}
        </div>
      </div>

      {/* WEIGHT BAR */}
      <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:14, marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
          <span style={{ color:"#64748b" }}>Weightage</span>
          <span style={{ fontWeight:600, color:totalWeight===100?"#16a34a":"#d97706" }}>{remaining}% remaining</span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:8 }}>
          <div style={{ background:totalWeight===100?"#16a34a":totalWeight>100?"#dc2626":"#6366f1", width:`${Math.min(totalWeight,100)}%`, height:"100%", borderRadius:99, transition:"width .3s" }}/>
        </div>
        {totalWeight===100 && <p style={{ margin:"6px 0 0", fontSize:12, color:"#16a34a", fontWeight:500 }}>✓ Weightage complete!</p>}
      </div>

      {/* ADD FORM */}
      {showForm && (
        <div style={{ background:"#fff", borderRadius:12, border:"2px solid #6366f1", padding:20, marginBottom:18 }}>
          <h3 style={{ margin:"0 0 14px", fontSize:15, fontWeight:700, color:"#1e293b" }}>New Goal</h3>
          <div className="form-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <FormField label="Thrust Area" required>
              <select value={form.thrustArea} onChange={e=>setForm(f=>({...f,thrustArea:e.target.value}))} style={inputStyle}>
                {THRUST_AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </FormField>
            <FormField label="Unit of Measurement" required>
              <select value={form.uom} onChange={e=>setForm(f=>({...f,uom:e.target.value}))} style={inputStyle}>
                {UOM_TYPES.map(u=><option key={u}>{u}</option>)}
              </select>
            </FormField>
            <FormField label="Goal Title" error={errors.title} required style={{gridColumn:"1/-1"}}>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Achieve Q3 Revenue Target" style={inputStyle} />
            </FormField>
            <FormField label="Description" style={{gridColumn:"1/-1"}}>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="What does success look like?" style={{...inputStyle,resize:"vertical"}} />
            </FormField>
            <FormField label="Target" error={errors.target} required>
              <input type="number" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} placeholder="e.g. 1000000" style={inputStyle} />
            </FormField>
            <FormField label="Weightage (%)" error={errors.weightage} required>
              <input type="number" value={form.weightage} onChange={e=>setForm(f=>({...f,weightage:e.target.value}))} placeholder="min 10%" min={10} max={100} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
            <button onClick={submitGoal} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:14, fontWeight:600, cursor:"pointer" }}>Submit for Approval</button>
            <button onClick={()=>{setShowForm(false);setErrors({});}} style={{ background:"#f1f5f9", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:8, padding:"9px 18px", fontSize:14, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* GOALS LIST */}
      {myGoals.length===0 && (
        <div style={{ textAlign:"center", padding:50, color:"#94a3b8", background:"#fff", borderRadius:12, border:"1px dashed #e2e8f0" }}>
          <div style={{ fontSize:36 }}>🎯</div>
          <div style={{ fontSize:15, fontWeight:500, marginTop:10 }}>No goals yet</div>
          <div style={{ fontSize:13, marginTop:4 }}>Click "Add Goal" to get started</div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {myGoals.map(g=>(
          <div key={g._id||g.id} className="goal-card" style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:18, display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                {statusBadge(g.status)}
                <Badge color="purple">{g.thrustArea}</Badge>
                {g.isShared && <Badge color="blue">Shared</Badge>}
                {g.locked && <Badge color="gray">🔒 Locked</Badge>}
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1e293b" }}>{g.title}</div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>{g.description}</div>
              <div style={{ display:"flex", gap:14, marginTop:10, fontSize:12, flexWrap:"wrap" }}>
                <span style={{ color:"#94a3b8" }}>UoM: <strong style={{color:"#475569"}}>{g.uom}</strong></span>
                <span style={{ color:"#94a3b8" }}>Target: <strong style={{color:"#475569"}}>{g.target}</strong></span>
                <span style={{ color:"#94a3b8" }}>Weight: <strong style={{color:"#6366f1"}}>{g.weightage}%</strong></span>
              </div>
            </div>
            <div className="goal-card-right" style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end", flexShrink:0 }}>
              <div style={{ fontSize:22, fontWeight:700, color:"#6366f1" }}>{g.weightage}%</div>
              {!g.locked && (
                <button onClick={()=>setGoals(prev=>prev.filter(x=>x.id!==g.id))}
                  style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer" }}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {myGoals.length>0 && (
        <div style={{ marginTop:14, background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0", padding:14, fontSize:13 }}>
          <strong>Validation</strong>
          <ul style={{ margin:"6px 0 0", paddingLeft:18, color:"#475569" }}>
            <li style={{ color:myGoals.length<=8?"#16a34a":"#dc2626" }}>{myGoals.length<=8?"✓":"✗"} Max 8 goals ({myGoals.length}/8)</li>
            <li style={{ color:myGoals.every(g=>g.weightage>=10)?"#16a34a":"#dc2626" }}>{myGoals.every(g=>g.weightage>=10)?"✓":"✗"} Each goal ≥ 10%</li>
            <li style={{ color:totalWeight===100?"#16a34a":"#d97706" }}>{totalWeight===100?"✓":"⚠"} Total = 100% (currently {totalWeight}%)</li>
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
  const lockedGoals = myGoals.filter(g=>g.locked||g.status==="Approved");
  const activeQ = "Q2";

  function saveAchievement(goalId) {
    const v = vals[goalId];
    if (v===undefined||v==="") return;
    setGoals(prev=>prev.map(g=>g.id===goalId?{...g,achievements:{...g.achievements,[activeQ]:parseFloat(v)}}:g));
    notify("Achievement saved!");
    setEditQ(null);
  }

  if (!lockedGoals.length) return (
    <div style={{ textAlign:"center", padding:50, background:"#fff", borderRadius:12, border:"1px dashed #e2e8f0" }}>
      <div style={{ fontSize:36 }}>📈</div>
      <div style={{ fontSize:15, fontWeight:600, marginTop:10, color:"#1e293b" }}>No approved goals yet</div>
      <div style={{ fontSize:13, color:"#64748b", marginTop:6, maxWidth:320, margin:"8px auto 0" }}>
        Goals must be <strong>approved and locked</strong> by your manager first.
      </div>
      <div style={{ marginTop:16, background:"#f8fafc", borderRadius:10, padding:14, maxWidth:320, margin:"14px auto 0", textAlign:"left" }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#475569", marginBottom:6 }}>Steps:</div>
        <div style={{ fontSize:13, color:"#64748b", lineHeight:2 }}>
          1. Go to <strong>My Goals</strong> → add goals<br/>
          2. Weightage must reach <strong>100%</strong><br/>
          3. Manager <strong>approves</strong> them<br/>
          4. Come back here to log actuals ✓
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"#1e293b" }}>Achievement Tracker</h2>
      <p style={{ color:"#64748b", margin:"0 0 18px", fontSize:13 }}>Active: <strong>Q2 Check-in (October)</strong></p>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {lockedGoals.map(g=>{
          const scores = ["Q1","Q2","Q3","Q4"].reduce((acc,qk)=>({...acc,[qk]:computeScore(g.uom,g.target,g.achievements[qk])}),{});
          return (
            <div key={g._id||g.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#1e293b" }}>{g.title}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{g.thrustArea} · Target: <strong>{g.target}</strong> · <strong style={{color:"#6366f1"}}>{g.weightage}%</strong></div>
                </div>
                <Badge color="green">Locked ✓</Badge>
              </div>
              <div className="quarters-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                {["Q1","Q2","Q3","Q4"].map(qk=>{
                  const ach = g.achievements[qk];
                  const score = scores[qk];
                  const isActive = qk===activeQ;
                  return (
                    <div key={qk} style={{ background:isActive?"#f0f4ff":"#f8fafc", borderRadius:10, border:isActive?"2px solid #6366f1":"1px solid #e2e8f0", padding:12 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:isActive?"#6366f1":"#94a3b8", textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>{qk}{isActive&&" •"}</div>
                      {editQ===g.id+qk ? (
                        <div>
                          <input type="number" autoFocus value={vals[g.id]??""} onChange={e=>setVals(v=>({...v,[g.id]:e.target.value}))} style={{...inputStyle,marginBottom:6,padding:"6px 8px"}} />
                          <div style={{ display:"flex", gap:4 }}>
                            <button onClick={()=>saveAchievement(g.id)} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>Save</button>
                            <button onClick={()=>setEditQ(null)} style={{ background:"#f1f5f9", border:"none", borderRadius:6, padding:"3px 8px", fontSize:11, cursor:"pointer" }}>×</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize:18, fontWeight:700, color:ach!==null?"#1e293b":"#cbd5e1" }}>{ach!==null?ach:"—"}</div>
                          {score!==null && (
                            <div style={{ marginTop:4 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#64748b" }}>
                                <span>Score</span><span style={{ fontWeight:700, color:score>=80?"#16a34a":score>=50?"#d97706":"#dc2626" }}>{score}%</span>
                              </div>
                              {progressBar(score)}
                            </div>
                          )}
                          {isActive && (
                            <button onClick={()=>{setEditQ(g.id+qk);setVals(v=>({...v,[g.id]:ach??""}) );}}
                              style={{ marginTop:6, background:"#ede9fe", color:"#6366f1", border:"none", borderRadius:6, padding:"3px 10px", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                              {ach!==null?"Edit":"Log"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:"#64748b" }}>Status:</span>
                {STATUSES.map(s=>(
                  <button key={s} style={{ fontSize:11, borderRadius:99, padding:"2px 10px", cursor:"pointer", background:"#f8fafc", border:"1px solid #e2e8f0", color:"#475569" }}>{s}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:18, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:12, padding:18, color:"#fff" }}>
        <div style={{ fontSize:12, opacity:.85 }}>Q2 Weighted Score</div>
        <div style={{ fontSize:34, fontWeight:800, lineHeight:1 }}>{weightedScore(lockedGoals,"Q2")}%</div>
        <div style={{ fontSize:12, opacity:.75, marginTop:4 }}>Based on locked goals and logged actuals</div>
      </div>
    </div>
  );
}

// ─── APPROVALS ───────────────────────────────────────────────────────────────
function Approvals({ currentUser, users, teamGoals, goals, setGoals, addAudit, notify }) {
  const pending = teamGoals.filter(g=>g.status==="Pending Approval");
  const [editGoal, setEditGoal] = useState(null);
  const [remarks, setRemarks] = useState({});
  const empMap = {};
  users.forEach(u=>empMap[u._id||u.id]=u);

  function approve(g) {
    setGoals(prev=>prev.map(goal=>goal.id===g.id?{...goal,status:"Approved",locked:true}:goal));
    addAudit(g.id,"Goal Approved",currentUser.name,"Approved by L1 manager");
    notify(`"${g.title}" approved!`);
  }
  function reject(g) {
    setGoals(prev=>prev.map(goal=>goal.id===g.id?{...goal,status:"Rejected"}:goal));
    addAudit(g.id,"Goal Rejected",currentUser.name,remarks[g.id]||"Needs revision");
    notify("Goal returned for rework.","error");
  }
  function saveEdit(g, updates) {
    setGoals(prev=>prev.map(goal=>goal.id===g.id?{...goal,...updates}:goal));
    addAudit(g.id,"Goal Edited by Manager",currentUser.name,"Updated target/weightage");
    setEditGoal(null);
    notify("Changes saved!");
  }

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"#1e293b" }}>Goal Approvals</h2>
      <p style={{ color:"#64748b", margin:"0 0 18px", fontSize:13 }}>{pending.length} goal{pending.length!==1?"s":""} pending review</p>

      {pending.length===0 && (
        <div style={{ textAlign:"center", padding:50, background:"#fff", borderRadius:12, border:"1px dashed #e2e8f0", color:"#94a3b8" }}>
          <div style={{ fontSize:32 }}>✅</div>
          <div style={{ fontSize:15, fontWeight:500, marginTop:10 }}>All caught up!</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {pending.map(g=>{
          const emp = empMap[g.employeeId];
          return (
            <div key={g._id||g.id} style={{ background:"#fff", borderRadius:12, border:"2px solid #fbbf24", padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>From: <strong>{emp?.name}</strong> · {emp?.dept}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#1e293b" }}>{g.title}</div>
                  <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>{g.description}</div>
                </div>
                <Badge color="amber">Pending</Badge>
              </div>

              {editGoal===g.id ? (
                <InlineEditForm goal={g} onSave={u=>saveEdit(g,u)} onCancel={()=>setEditGoal(null)} />
              ) : (
                <div style={{ background:"#f8fafc", borderRadius:8, padding:10, marginBottom:10, display:"flex", gap:16, fontSize:12, flexWrap:"wrap" }}>
                  <span style={{color:"#94a3b8"}}>Thrust: <strong style={{color:"#475569"}}>{g.thrustArea}</strong></span>
                  <span style={{color:"#94a3b8"}}>Target: <strong style={{color:"#475569"}}>{g.target}</strong></span>
                  <span style={{color:"#94a3b8"}}>Weight: <strong style={{color:"#6366f1"}}>{g.weightage}%</strong></span>
                </div>
              )}

              <input value={remarks[g.id]||""} onChange={e=>setRemarks(r=>({...r,[g.id]:e.target.value}))}
                placeholder="Remarks (optional)..." style={{...inputStyle,marginBottom:10}} />

              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button onClick={()=>approve(g)} style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Approve</button>
                <button onClick={()=>setEditGoal(g.id)} style={{ background:"#ede9fe", color:"#6366f1", border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>✏ Edit</button>
                <button onClick={()=>reject(g)} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>↩ Return</button>
              </div>
            </div>
          );
        })}
      </div>

      {teamGoals.filter(g=>g.status!=="Pending Approval").length>0 && (
        <div style={{ marginTop:24 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:"#64748b", marginBottom:10 }}>Previously Processed</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {teamGoals.filter(g=>g.status!=="Pending Approval").map(g=>(
              <div key={g._id||g.id} style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:"#1e293b" }}>{g.title}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{empMap[g.employeeId]?.name} · {g.weightage}%</div>
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
    <div style={{ background:"#f0f4ff", borderRadius:8, padding:12, marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:600, color:"#6366f1", marginBottom:8 }}>Manager edit override</div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <FormField label="Target">
          <input type="number" value={target} onChange={e=>setTarget(e.target.value)} style={{...inputStyle,width:120}} />
        </FormField>
        <FormField label="Weightage (%)">
          <input type="number" value={weightage} onChange={e=>setWeightage(e.target.value)} style={{...inputStyle,width:120}} />
        </FormField>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <button onClick={()=>onSave({target:parseFloat(target),weightage:parseInt(weightage)})}
          style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Save</button>
        <button onClick={onCancel} style={{ background:"#f1f5f9", border:"none", borderRadius:6, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── CHECK-INS ───────────────────────────────────────────────────────────────
function CheckIns({ currentUser, users, teamGoals, goals, setGoals, addAudit, notify }) {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [comments, setComments] = useState({});
  const teamMembers = users.filter(u=>u.managerId===currentUser._id);
  const activeQ = "Q2";

  function saveComment(goalId) {
    const c = comments[goalId];
    if (!c?.trim()) return;
    setGoals(prev=>prev.map(g=>g.id===goalId?{...g,checkInComments:{...g.checkInComments,[activeQ]:{text:c,by:currentUser.name,at:new Date().toISOString()}}}:g));
    addAudit(goalId,"Check-in Added",currentUser.name,c);
    notify("Check-in saved!");
  }

  const empGoals = selectedEmp ? goals.filter(g=>g.employeeId===selectedEmp._id&&g.locked) : [];

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"#1e293b" }}>Q2 Check-ins</h2>
      <p style={{ color:"#64748b", margin:"0 0 18px", fontSize:13 }}>Planned vs Actual · Add discussion notes</p>
      <div className="checkin-grid" style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:10 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.5, padding:"4px 6px 8px" }}>Team</div>
          {teamMembers.map(emp=>{
            const eg = goals.filter(g=>g.employeeId===emp._id&&g.locked);
            const hasCheckin = eg.some(g=>g.checkInComments[activeQ]);
            return (
              <button key={emp._id} onClick={()=>setSelectedEmp(emp)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"8px 8px", borderRadius:8, border:"none", background:selectedEmp?._id===emp._id?"#f0f4ff":"transparent", cursor:"pointer", marginBottom:2, textAlign:"left" }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:"#1e293b" }}>{emp.name}</div>
                  <div style={{ fontSize:10, color:"#94a3b8" }}>{eg.length} goals</div>
                </div>
                <span>{hasCheckin?"✅":"⏳"}</span>
              </button>
            );
          })}
        </div>
        <div>
          {!selectedEmp ? (
            <div style={{ background:"#fff", borderRadius:12, border:"1px dashed #e2e8f0", padding:50, textAlign:"center", color:"#94a3b8" }}>
              <div style={{ fontSize:28 }}>💬</div>
              <div style={{ fontSize:14, marginTop:10 }}>Select a team member</div>
            </div>
          ) : (
            <div>
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:16, marginBottom:14 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#1e293b" }}>{selectedEmp.name} — Q2</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Score: <strong style={{color:"#6366f1"}}>{weightedScore(empGoals,activeQ)}%</strong></div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {empGoals.map(g=>{
                  const ach = g.achievements[activeQ];
                  const score = computeScore(g.uom,g.target,ach);
                  const prev = g.checkInComments[activeQ];
                  return (
                    <div key={g._id||g.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:16 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", marginBottom:10 }}>{g.title}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
                        {[["TARGET",g.target,"#f8fafc"],["ACTUAL",ach??"Not logged","#f0fdf4"],["SCORE",score!==null?score+"%":"N/A",score!==null?(score>=80?"#f0fdf4":score>=50?"#fffbeb":"#fef2f2"):"#f8fafc"]].map(([label,val,bg])=>(
                          <div key={label} style={{ background:bg, borderRadius:8, padding:10, textAlign:"center" }}>
                            <div style={{ fontSize:10, color:"#94a3b8", marginBottom:4 }}>{label}</div>
                            <div style={{ fontSize:16, fontWeight:700, color:"#1e293b" }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {prev && <div style={{ background:"#f0f4ff", borderRadius:8, padding:8, marginBottom:8, fontSize:12, color:"#4338ca" }}><strong>Prev:</strong> {prev.text}</div>}
                      <textarea value={comments[g.id]||""} onChange={e=>setComments(c=>({...c,[g.id]:e.target.value}))}
                        rows={2} placeholder="Add check-in note..." style={{...inputStyle,width:"100%",resize:"vertical"}} />
                      <button onClick={()=>saveComment(g.id)} style={{ marginTop:6, background:"#6366f1", color:"#fff", border:"none", borderRadius:6, padding:"5px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Save</button>
                    </div>
                  );
                })}
                {empGoals.length===0 && <div style={{ color:"#94a3b8", fontSize:13, padding:16, textAlign:"center" }}>No locked goals.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TEAM GOALS ──────────────────────────────────────────────────────────────
function TeamGoals({ currentUser, users, teamGoals }) {
  const empMap = {};
  users.forEach(u=>empMap[u._id||u.id]=u);
  return (
    <div>
      <h2 style={{ margin:"0 0 18px", fontSize:20, fontWeight:700, color:"#1e293b" }}>Team Goal Overview</h2>
      {teamGoals.length===0 ? (
        <div style={{ textAlign:"center", padding:50, background:"#fff", borderRadius:12, border:"1px dashed #e2e8f0", color:"#94a3b8" }}>
          <div style={{ fontSize:32 }}>👥</div>
          <div style={{ fontSize:15, fontWeight:500, marginTop:10 }}>No team goals yet</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {teamGoals.map(g=>(
            <div key={g._id||g.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:16, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                  {statusBadge(g.status)}<Badge color="purple">{g.thrustArea}</Badge>{g.locked&&<Badge color="gray">🔒</Badge>}
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:"#1e293b" }}>{g.title}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{empMap[g.employeeId]?.name} · Target: {g.target} · {g.weightage}%</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Q1:{g.achievements.Q1??"-"} Q2:{g.achievements.Q2??"-"} Q3:{g.achievements.Q3??"-"} Q4:{g.achievements.Q4??"-"}</div>
              </div>
              <div style={{ fontSize:20, fontWeight:700, color:"#6366f1" }}>{g.weightage}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ALL GOALS (ADMIN) ───────────────────────────────────────────────────────
function AllGoals({ users, goals, setGoals, addAudit, notify }) {
  const [filter, setFilter] = useState("all");
  const empMap = {};
  users.forEach(u=>empMap[u._id||u.id]=u);
  const filtered = filter==="all" ? goals : goals.filter(g=>g.status===filter);

  function unlockGoal(g) {
    setGoals(prev=>prev.map(goal=>goal.id===g.id?{...goal,locked:false,status:"Draft"}:goal));
    addAudit(g.id,"Goal Unlocked","Admin HR","Admin override");
    notify("Goal unlocked.");
  }

  return (
    <div>
      <h2 style={{ margin:"0 0 14px", fontSize:20, fontWeight:700, color:"#1e293b" }}>All Goals — Admin</h2>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {["all","Approved","Pending Approval","Rejected","Draft"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:"5px 12px", borderRadius:99, border:"1px solid #e2e8f0", background:filter===s?"#6366f1":"#fff", color:filter===s?"#fff":"#475569", fontSize:12, cursor:"pointer", fontWeight:filter===s?600:400 }}>
            {s==="all"?"All":s}
          </button>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
        <div className="table-wrapper">
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
            <thead><tr style={{ background:"#f8fafc" }}>
              {["Employee","Dept","Goal","Target","Weight","Q1","Q2","Status","Action"].map(h=>(
                <th key={h} style={{ padding:"9px 12px", fontSize:11, fontWeight:600, color:"#64748b", textAlign:"left", textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((g,i)=>{
                const emp = empMap[g.employeeId];
                return (
                  <tr key={g._id||g.id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"#fff" }}>
                    <td style={{ padding:"9px 12px", fontSize:12, fontWeight:500, color:"#1e293b", whiteSpace:"nowrap" }}>{emp?.name}</td>
                    <td style={{ padding:"9px 12px", fontSize:11, color:"#64748b" }}>{emp?.dept}</td>
                    <td style={{ padding:"9px 12px", fontSize:12, color:"#1e293b", maxWidth:150 }}>{g.title}</td>
                    <td style={{ padding:"9px 12px", fontSize:12 }}>{g.target}</td>
                    <td style={{ padding:"9px 12px", fontSize:12, fontWeight:600, color:"#6366f1" }}>{g.weightage}%</td>
                    <td style={{ padding:"9px 12px", fontSize:11 }}>{g.achievements?.Q1??<span style={{color:"#cbd5e1"}}>—</span>}</td>
                    <td style={{ padding:"9px 12px", fontSize:11 }}>{g.achievements?.Q2??<span style={{color:"#cbd5e1"}}>—</span>}</td>
                    <td style={{ padding:"9px 12px" }}>{statusBadge(g.status)}</td>
                    <td style={{ padding:"9px 12px" }}>
                      {g.locked&&<button onClick={()=>unlockGoal(g)} style={{ background:"#fef3c7", color:"#b45309", border:"none", borderRadius:6, padding:"3px 8px", fontSize:10, cursor:"pointer", fontWeight:600 }}>🔓</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length===0&&<div style={{ padding:32, textAlign:"center", color:"#94a3b8" }}>No goals found.</div>}
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports({ users, goals }) {
  const empMap = {};
  users.forEach(u=>empMap[u._id||u.id]=u);
  const employees = users.filter(u=>u.role==="employee");

  function exportCSV() {
    const rows = [["Employee","Dept","Goal","Thrust Area","UoM","Target","Q1","Q1%","Q2","Q2%","Weight","Status"]];
    goals.forEach(g=>{
      const emp = empMap[g.employeeId];
      if(!emp) return;
      rows.push([emp.name,emp.dept,g.title,g.thrustArea,g.uom,g.target,
        g.achievements?.Q1??"",computeScore(g.uom,g.target,g.achievements?.Q1)??"",
        g.achievements?.Q2??"",computeScore(g.uom,g.target,g.achievements?.Q2)??"",
        g.weightage,g.status]);
    });
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "goalquest_report.csv"; a.click();
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>Reports</h2>
        <button onClick={exportCSV} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>⬇ Export CSV</button>
      </div>

      <h3 style={{ fontSize:14, fontWeight:600, color:"#1e293b", marginBottom:10 }}>Q2 Completion Dashboard</h3>
      <div className="completion-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10, marginBottom:24 }}>
        {employees.map(emp=>{
          const eg = goals.filter(g=>g.employeeId===emp._id||g.employeeId===emp.id);
          const approved = eg.filter(g=>g.locked);
          const logged = approved.filter(g=>g.achievements?.Q2!==null);
          const pct = approved.length ? Math.round((logged.length/approved.length)*100) : 0;
          const mgr = users.find(u=>u._id===emp.managerId||u.id===emp.managerId);
          return (
            <div key={emp._id||emp.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{emp.name}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{emp.dept} · {mgr?.name}</div>
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:pct===100?"#16a34a":pct>50?"#d97706":"#dc2626" }}>{pct}%</div>
              </div>
              {progressBar(pct)}
              <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>{logged.length}/{approved.length} logged</div>
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize:14, fontWeight:600, color:"#1e293b", marginBottom:10 }}>Achievement Report</h3>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0" }}>
        <div className="table-wrapper">
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
            <thead><tr style={{ background:"#f8fafc" }}>
              {["Employee","Goal","Target","Q1","Q1%","Q2","Q2%","Weight","Status"].map(h=>(
                <th key={h} style={{ padding:"9px 12px", fontSize:11, fontWeight:600, color:"#64748b", textAlign:"left", textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {goals.map((g,i)=>{
                const emp = empMap[g.employeeId];
                const s1 = computeScore(g.uom,g.target,g.achievements?.Q1);
                const s2 = computeScore(g.uom,g.target,g.achievements?.Q2);
                return (
                  <tr key={g._id||g.id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"#fff" }}>
                    <td style={{ padding:"9px 12px", fontSize:12, fontWeight:500, color:"#1e293b" }}>{emp?.name}</td>
                    <td style={{ padding:"9px 12px", fontSize:11, color:"#475569", maxWidth:140 }}>{g.title}</td>
                    <td style={{ padding:"9px 12px", fontSize:12 }}>{g.target}</td>
                    <td style={{ padding:"9px 12px", fontSize:12 }}>{g.achievements?.Q1??"—"}</td>
                    <td style={{ padding:"9px 12px", fontSize:12, fontWeight:600, color:s1!=null?(s1>=80?"#16a34a":s1>=50?"#d97706":"#dc2626"):"#cbd5e1" }}>{s1!=null?s1+"%":"—"}</td>
                    <td style={{ padding:"9px 12px", fontSize:12 }}>{g.achievements?.Q2??"—"}</td>
                    <td style={{ padding:"9px 12px", fontSize:12, fontWeight:600, color:s2!=null?(s2>=80?"#16a34a":s2>=50?"#d97706":"#dc2626"):"#cbd5e1" }}>{s2!=null?s2+"%":"—"}</td>
                    <td style={{ padding:"9px 12px", fontSize:12, fontWeight:600, color:"#6366f1" }}>{g.weightage}%</td>
                    <td style={{ padding:"9px 12px" }}>{statusBadge(g.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────
function AuditTrail({ auditLog, goals }) {
  const goalMap = {};
  goals.forEach(g=>goalMap[g._id||g.id]=g);
  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"#1e293b" }}>Audit Trail</h2>
      <p style={{ color:"#64748b", margin:"0 0 16px", fontSize:13 }}>Every change logged automatically</p>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {[...auditLog].reverse().map(a=>{
          const goal = goalMap[a.goalId];
          return (
            <div key={a.id} style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:12, display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", marginTop:4, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, flexWrap:"wrap", gap:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{a.action}</span>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>{new Date(a.at).toLocaleString("en-IN")}</span>
                </div>
                {goal&&<div style={{ fontSize:11, color:"#6366f1", marginBottom:2 }}>{goal.title}</div>}
                <div style={{ fontSize:12, color:"#64748b" }}>By: <strong>{a.by}</strong> · {a.detail}</div>
              </div>
            </div>
          );
        })}
        {auditLog.length===0&&<div style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No entries yet.</div>}
      </div>
    </div>
  );
}

// ─── SHARED GOALS ────────────────────────────────────────────────────────────
function SharedGoals({ users, goals, setGoals, addAudit, notify }) {
  const employees = users.filter(u=>u.role==="employee");
  const [form, setForm] = useState({ title:"", thrustArea:"Revenue Growth", uom:UOM_TYPES[0], target:"", selectedEmps:[], defaultWeight:20 });
  const [errors, setErrors] = useState({});

  function pushSharedGoal() {
    if(!form.title.trim()){setErrors({title:"Required"});return;}
    if(!form.target){setErrors({target:"Required"});return;}
    if(!form.selectedEmps.length){setErrors({emps:"Select at least one"});return;}
    const newGoals = form.selectedEmps.map(empId=>({
      id:"g"+Date.now()+Math.random(), employeeId:empId,
      thrustArea:form.thrustArea, title:form.title,
      description:"Shared KPI — read-only", uom:form.uom,
      target:parseFloat(form.target), weightage:form.defaultWeight,
      status:"Approved", achievements:{Q1:null,Q2:null,Q3:null,Q4:null},
      checkInComments:{}, isShared:true, sharedFrom:"Admin HR",
      locked:true, createdAt:new Date().toISOString().split("T")[0],
    }));
    setGoals(prev=>[...prev,...newGoals]);
    newGoals.forEach(g=>addAudit(g.id,"Shared Goal Pushed","Admin HR",`Pushed to ${users.find(u=>u._id===g.employeeId||u.id===g.employeeId)?.name}`));
    notify(`Pushed to ${form.selectedEmps.length} employee(s)!`);
    setForm({title:"",thrustArea:"Revenue Growth",uom:UOM_TYPES[0],target:"",selectedEmps:[],defaultWeight:20});
    setErrors({});
  }

  const sharedGoals = goals.filter(g=>g.isShared);

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:"#1e293b" }}>Shared Goals — Push KPIs</h2>
      <p style={{ color:"#64748b", margin:"0 0 18px", fontSize:13 }}>Push a KPI to multiple employees at once.</p>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:20, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:600 }}>Push New KPI</h3>
        <div className="shared-form-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
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
          <FormField label="KPI Title" error={errors.title} required style={{gridColumn:"1/-1"}}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Department Safety Score" style={inputStyle} />
          </FormField>
          <FormField label="Target" error={errors.target} required>
            <input type="number" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} placeholder="e.g. 100" style={inputStyle} />
          </FormField>
          <FormField label="Default Weightage %">
            <input type="number" value={form.defaultWeight} onChange={e=>setForm(f=>({...f,defaultWeight:parseInt(e.target.value)||10}))} min={10} max={100} style={inputStyle} />
          </FormField>
        </div>
        <FormField label="Push to Employees" error={errors.emps} required style={{marginTop:14}}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:10, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
            {employees.map(emp=>(
              <label key={emp._id||emp.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:99, background:form.selectedEmps.includes(emp._id||emp.id)?"#ede9fe":"#fff", border:"1px solid", borderColor:form.selectedEmps.includes(emp._id||emp.id)?"#8b5cf6":"#e2e8f0", cursor:"pointer", fontSize:13, fontWeight:form.selectedEmps.includes(emp._id||emp.id)?600:400, color:form.selectedEmps.includes(emp._id||emp.id)?"#7c3aed":"#475569" }}>
                <input type="checkbox" checked={form.selectedEmps.includes(emp._id||emp.id)} onChange={e=>{
                  const id = emp._id||emp.id;
                  setForm(f=>({...f,selectedEmps:e.target.checked?[...f.selectedEmps,id]:f.selectedEmps.filter(x=>x!==id)}));
                }} style={{display:"none"}} />
                {emp.name}
              </label>
            ))}
          </div>
        </FormField>
        <button onClick={pushSharedGoal} style={{ marginTop:14, background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"9px 22px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
          Push to Selected
        </button>
      </div>

      {sharedGoals.length>0 && (
        <div>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:10, color:"#1e293b" }}>Active Shared Goals</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {sharedGoals.map(g=>{
              const emp = users.find(u=>u._id===g.employeeId||u.id===g.employeeId);
              return (
                <div key={g._id||g.id} style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ display:"flex", gap:6, marginBottom:4 }}><Badge color="blue">Shared</Badge><Badge color="purple">{g.thrustArea}</Badge></div>
                    <div style={{ fontSize:13, fontWeight:500, color:"#1e293b" }}>{g.title}</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{emp?.name} · {g.target} · {g.weightage}%</div>
                  </div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>Admin</div>
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
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:5 }}>
        {label}{required&&<span style={{color:"#dc2626",marginLeft:2}}>*</span>}
      </label>
      {children}
      {error&&<div style={{ fontSize:11, color:"#dc2626", marginTop:3 }}>⚠ {error}</div>}
    </div>
  );
}

const inputStyle = {
  width:"100%", padding:"8px 12px", borderRadius:8,
  border:"1px solid #d1d5db", fontSize:13, color:"#1e293b",
  background:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"inherit",
};
