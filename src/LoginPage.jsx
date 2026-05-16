import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const DUMMY_USERS = [
  { name:"Aarav Sharma",  email:"aarav@corp.in",  role:"Employee", dept:"Sales",       password:"Aarav@123",  avatar:"AS" },
  { name:"Priya Nair",    email:"priya@corp.in",  role:"Employee", dept:"Sales",       password:"Priya@123",  avatar:"PN" },
  { name:"Ritu Verma",    email:"ritu@corp.in",   role:"Employee", dept:"Engineering", password:"Ritu@123",   avatar:"RV" },
  { name:"Suresh Patel",  email:"suresh@corp.in", role:"Employee", dept:"Engineering", password:"Suresh@123", avatar:"SP" },
  { name:"Meera Iyer",    email:"meera@corp.in",  role:"Manager",  dept:"Sales",       password:"Meera@123",  avatar:"MI" },
  { name:"Kiran Reddy",   email:"kiran@corp.in",  role:"Manager",  dept:"Engineering", password:"Kiran@123",  avatar:"KR" },
  { name:"Admin HR",      email:"admin@corp.in",  role:"Admin",    dept:"HR",          password:"Admin@123",  avatar:"AH" },
];

const roleColor = { Employee:"#6366f1", Manager:"#0ea5e9", Admin:"#16a34a" };

const fieldLabelStyle = { display:"block", fontSize:12, fontWeight:600, color:"#6366f1", marginBottom:6 };
const fieldInputStyle = (hasError) => ({
  width:"100%", padding:"10px 14px", borderRadius:9, boxSizing:"border-box",
  fontSize:14, color:"#1e293b", outline:"none",
  background: hasError ? "#fef2f2" : "#eef2ff",
  border: hasError ? "1.5px solid #dc2626" : "1.5px solid #c7d2fe",
});

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(null);

  function handleDummyLogin(e) {
    e.preventDefault();
    const user = DUMMY_USERS.find(
      u => u.email === email.trim() && u.password === password
    );
    if (user) {
      onLogin({ name: user.name, email: user.email,
                role: user.role.toLowerCase(), avatar: user.avatar });
    } else {
      setError("Incorrect email or password. Use the credentials below.");
    }
  }

  async function handleGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      const match = DUMMY_USERS.find(d => d.email === u.email);
      onLogin({
        name:   u.displayName,
        email:  u.email,
        role:   match ? match.role.toLowerCase() : "employee",
        avatar: u.displayName?.split(" ").map(n=>n[0]).join("").slice(0,2) ?? "U",
        photo:  u.photoURL,
      });
    } catch {
      setError("Google sign-in failed. Try dummy login below.");
    }
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  function quickFill(user) {
    setEmail(user.email);
    setPassword(user.password);
    setError("");
  }

  return (
    <div style={{
      minHeight:"100vh", background:"#f8fafc",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif", padding:24
    }}>
      <div style={{ width:"100%", maxWidth:980, display:"flex", gap:32, alignItems:"flex-start" }}>

        <div style={{
          flex:"0 0 380px", background:"#fff", borderRadius:16,
          border:"1px solid #e2e8f0", padding:36, boxShadow:"0 4px 24px #0000000a"
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22
            }}>🎯</div>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:"#1e293b" }}>GoalQuest</div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>Performance Portal</div>
            </div>
          </div>

          <h2 style={{ margin:"0 0 6px", fontSize:22, fontWeight:700, color:"#1e293b" }}>Welcome back</h2>
          <p style={{ margin:"0 0 24px", fontSize:14, color:"#64748b" }}>Sign in to access your goal sheet</p>

          <button type="button" onClick={handleGoogle} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center",
            gap:10, padding:"11px 0", borderRadius:10, border:"1px solid #e2e8f0",
            background:"#fff", fontSize:14, fontWeight:600, color:"#1e293b",
            cursor:"pointer", marginBottom:20, transition:"background .15s"
          }}
            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
            onMouseLeave={e=>e.currentTarget.style.background="#fff"}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
            <span style={{ fontSize:12, color:"#94a3b8" }}>or use demo credentials</span>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
          </div>

          <form onSubmit={handleDummyLogin}>
            <div style={{ marginBottom:14 }}>
              <label style={fieldLabelStyle}>Email address</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
                placeholder="e.g. aarav@corp.in"
                style={fieldInputStyle(!!error)}
              />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={fieldLabelStyle}>Password</label>
              <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                placeholder="e.g. Aarav@123"
                style={fieldInputStyle(!!error)}
              />
            </div>

            {error && (
              <div style={{
                background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8,
                padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:16
              }}>
                {error}
              </div>
            )}

            <button type="submit" style={{
              width:"100%", background:"#6366f1", color:"#fff", border:"none",
              borderRadius:10, padding:"12px 0", fontSize:15, fontWeight:700,
              cursor:"pointer"
            }}>
              Sign In →
            </button>
          </form>
        </div>

        <div style={{ flex:1 }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1e293b" }}>Demo credentials</div>
            <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>
              Click any card to auto-fill, or copy individual fields
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {DUMMY_USERS.map((u, i) => (
              <div key={i}
                onClick={() => quickFill(u)}
                style={{
                  background:"#fff", borderRadius:12, border:"1px solid #e2e8f0",
                  padding:16, cursor:"pointer", transition:"box-shadow .15s, border-color .15s",
                  position:"relative"
                }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px #0000000f"; e.currentTarget.style.borderColor="#c7d2fe";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#e2e8f0";}}
              >
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{
                    width:36, height:36, borderRadius:"50%",
                    background: roleColor[u.role]+"22",
                    color: roleColor[u.role],
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:700, flexShrink:0
                  }}>{u.avatar}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{u.name}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{u.dept}</div>
                  </div>
                  <span style={{
                    marginLeft:"auto", fontSize:10, fontWeight:700, padding:"2px 8px",
                    borderRadius:99, background: roleColor[u.role]+"18",
                    color: roleColor[u.role], letterSpacing:.3
                  }}>{u.role.toUpperCase()}</span>
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:1 }}>EMAIL</div>
                    <div style={{ fontSize:12, color:"#475569", fontFamily:"monospace" }}>{u.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={e=>{ e.stopPropagation(); copyToClipboard(u.email, u.email); }}
                    style={{
                      background: copied===u.email ? "#dcfce7" : "#f1f5f9",
                      color: copied===u.email ? "#16a34a" : "#64748b",
                      border:"none", borderRadius:6, padding:"4px 8px",
                      fontSize:11, cursor:"pointer", fontWeight:600
                    }}
                  >{copied===u.email ? "✓ Copied" : "Copy"}</button>
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:1 }}>PASSWORD</div>
                    <div style={{ fontSize:12, color:"#475569", fontFamily:"monospace" }}>{u.password}</div>
                  </div>
                  <button
                    type="button"
                    onClick={e=>{ e.stopPropagation(); copyToClipboard(u.password, u.password); }}
                    style={{
                      background: copied===u.password ? "#dcfce7" : "#f1f5f9",
                      color: copied===u.password ? "#16a34a" : "#64748b",
                      border:"none", borderRadius:6, padding:"4px 8px",
                      fontSize:11, cursor:"pointer", fontWeight:600
                    }}
                  >{copied===u.password ? "✓ Copied" : "Copy"}</button>
                </div>

                <div style={{ fontSize:10, color:"#c7d2fe", marginTop:8, textAlign:"center" }}>
                  click card to auto-fill →
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
