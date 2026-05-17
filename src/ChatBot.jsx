import { useState } from "react";
import { chatWithAI } from "./api";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm GoalBot 🎯 Ask me anything about your goals!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role, content: m.content
      }));
      const data = await chatWithAI(input, history);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Try again!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FLOATING BUTTON */}
      <button onClick={() => setOpen(!open)} style={{
        position:"fixed", bottom:24, right:24, width:56, height:56,
        borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
        color:"#fff", border:"none", fontSize:24, cursor:"pointer",
        boxShadow:"0 4px 20px #6366f144", zIndex:1000,
        display:"flex", alignItems:"center", justifyContent:"center"
      }}>
        {open ? "✕" : "🤖"}
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div style={{
          position:"fixed", bottom:90, right:24, width:340, height:460,
          background:"#fff", borderRadius:16, boxShadow:"0 8px 32px #0000001a",
          border:"1px solid #e2e8f0", display:"flex", flexDirection:"column",
          zIndex:1000, overflow:"hidden"
        }}>
          {/* Header */}
          <div style={{
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            padding:"14px 16px", color:"#fff"
          }}>
            <div style={{ fontSize:15, fontWeight:700 }}>🤖 GoalBot</div>
            <div style={{ fontSize:12, opacity:.8 }}>AI Performance Assistant</div>
          </div>

          {/* Messages */}
          <div style={{
            flex:1, overflowY:"auto", padding:16,
            display:"flex", flexDirection:"column", gap:10
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display:"flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth:"80%", padding:"10px 14px", borderRadius:12,
                  fontSize:13, lineHeight:1.5,
                  background: m.role === "user" ? "#6366f1" : "#f1f5f9",
                  color: m.role === "user" ? "#fff" : "#1e293b",
                  borderBottomRightRadius: m.role === "user" ? 4 : 12,
                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 12,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", justifyContent:"flex-start" }}>
                <div style={{
                  background:"#f1f5f9", padding:"10px 14px",
                  borderRadius:12, fontSize:13, color:"#94a3b8"
                }}>
                  GoalBot is typing...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding:12, borderTop:"1px solid #e2e8f0",
            display:"flex", gap:8
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask GoalBot anything..."
              style={{
                flex:1, padding:"9px 12px", borderRadius:8,
                border:"1px solid #e2e8f0", fontSize:13,
                outline:"none", fontFamily:"inherit"
              }}
            />
            <button onClick={sendMessage} disabled={loading} style={{
              background:"#6366f1", color:"#fff", border:"none",
              borderRadius:8, padding:"9px 14px", fontSize:13,
              cursor:"pointer", fontWeight:600
            }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}