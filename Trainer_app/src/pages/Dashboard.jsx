import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const C = {
  navy:        "#0F2557",
  navyLight:   "#E4EAF8",
  mustard:     "#B5860D",
  mustardMid:  "#D4A017",
  mustardLight:"#FBF3DC",
  emerald:     "#065F46",
  emeraldMid:  "#047857",
  emeraldLight:"#D1FAE5",
  bg:          "#FAFAD2",
  white:       "#FFFFFF",
  text:        "#0D1B2A",
  textSub:     "#64748B",
  border:      "#E8E4C8",
};

const goalIcon  = { "Emagrecimento":"🔥","Ganho de Massa":"💪","Condicionamento":"🏃","Forca e Performance":"⚡" };
const goalColor = { "Emagrecimento":C.emerald,"Ganho de Massa":C.navy,"Condicionamento":C.mustard,"Forca e Performance":"#6D28D9" };
const planColor = { "Ativo":C.emerald,"Rascunho":C.mustard,"Arquivado":C.textSub };
const planBg    = { "Ativo":C.emeraldLight,"Rascunho":C.mustardLight,"Arquivado":"#F1F5F9" };

const DAYS_EN = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];
const todayKey = DAYS_EN[new Date().getDay()];

function calcImc(w, h) { return h > 0 ? (w / ((h / 100) ** 2)).toFixed(1) : "—"; }
function delta(arr, key) {
  if (!arr || arr.length < 2) return null;
  const last = arr[arr.length-1][key], prev = arr[arr.length-2][key];
  if (last == null || prev == null) return null;
  return +(last - prev).toFixed(1);
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({ data, dataKey, color, label, height = 140 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:C.textSub, fontSize:12 }}>
      Dados insuficientes
    </div>
  );

  const values = data.map(d => parseFloat(d[dataKey])).filter(v => !isNaN(v));
  if (values.length < 2) return null;

  const W = 340, H = height;
  const pad = { top:10, right:10, bottom:24, left:36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const minV = Math.min(...values) * 0.98;
  const maxV = Math.max(...values) * 1.02;
  const range = maxV - minV || 1;

  const points = values.map((v, i) => ({
    x: pad.left + (i / (values.length - 1)) * innerW,
    y: pad.top + (1 - (v - minV) / range) * innerH,
    v,
    label: data[i]?.date || i,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length-1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`;

  return (
    <div style={{ overflowX:"auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = pad.top + t * innerH;
          const val = (maxV - t * range).toFixed(1);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke={C.border} strokeWidth="1" />
              <text x={pad.left - 4} y={y + 4} fontSize="9" fill={C.textSub} textAnchor="end">{val}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity="0.08" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} stroke={C.white} strokeWidth="1.5" />
            <text x={p.x} y={H - 6} fontSize="9" fill={C.textSub} textAnchor="middle">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MultiLineChart({ data, keys, colors, labels, height = 140 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:C.textSub, fontSize:12 }}>
      Dados insuficientes
    </div>
  );

  const allValues = keys.flatMap(k => data.map(d => parseFloat(d[k]))).filter(v => !isNaN(v));
  if (allValues.length === 0) return null;

  const W = 340, H = height;
  const pad = { top:10, right:10, bottom:24, left:36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const minV = Math.min(...allValues) * 0.98;
  const maxV = Math.max(...allValues) * 1.02;
  const range = maxV - minV || 1;

  const getPoints = (key) => data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * innerW,
    y: pad.top + (1 - (parseFloat(d[key]) - minV) / range) * innerH,
  }));

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
        {[0, 0.5, 1].map((t, i) => {
          const y = pad.top + t * innerH;
          return <line key={i} x1={pad.left} y1={y} x2={pad.left+innerW} y2={y} stroke={C.border} strokeWidth="1" />;
        })}
        {keys.map((key, ki) => {
          const pts = getPoints(key);
          const d = pts.map((p, i) => `${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
          return <path key={ki} d={d} fill="none" stroke={colors[ki]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
        })}
        {keys.map((key, ki) =>
          getPoints(key).map((p, i) => <circle key={`${ki}-${i}`} cx={p.x} cy={p.y} r="3" fill={colors[ki]} stroke={C.white} strokeWidth="1.5" />)
        )}
        {data.map((d, i) => (
          <text key={i} x={pad.left + (i / (data.length-1)) * innerW} y={H-6} fontSize="9" fill={C.textSub} textAnchor="middle">{d.date}</text>
        ))}
      </svg>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:6 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:C.textSub }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:colors[i] }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeltaBadge({ value, goal, metric }) {
  if (value === null || value === undefined) return null;
  const positive = goal === "Ganho de Massa" ? value > 0 : value < 0;
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20, background: positive ? C.emeraldLight : "#FEE2E2", color: positive ? C.emerald : "#DC2626" }}>
      {value > 0 ? "+" : ""}{value} {metric} {positive ? "🔥" : "⚠️"}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:80, gap:16 }}>
      <div style={{ width:40, height:40, border:`4px solid ${C.navyLight}`, borderTop:`4px solid ${C.navy}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <div style={{ fontSize:13, color:C.textSub }}>Carregando...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function WavySidebar({ activeTab, setActiveTab, professorEmail, onLogout }) {
  const navItems = [
    ["alunos",  "👥","Meus Alunos",   true ],
    ["treinos", "🏋️","Treinos",       true ],
    ["evolucao","📈","Evolucao",      true ],
    ["cardio",  "🏃","Cardio",        false],
    ["config",  "⚙️","Configuracoes", false],
  ];
  return (
    <div style={{ position:"relative", width:230, flexShrink:0, minHeight:"100vh" }}>
      <div style={{ position:"absolute", inset:0, background:C.navy }} />
      <svg style={{ position:"absolute", right:-38, top:0, height:"100%", width:40, zIndex:2 }} viewBox="0 0 40 800" preserveAspectRatio="none">
        <path d="M0,0 C30,100 0,200 25,300 C50,400 0,500 25,600 C50,700 10,750 0,800 L0,800 L0,0 Z" fill={C.navy} />
      </svg>
      <div style={{ position:"relative", zIndex:1, padding:"28px 0", display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        <div style={{ padding:"0 20px 24px", borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${C.mustardMid},${C.mustard})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💪</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Trainer</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:2, textTransform:"uppercase" }}>App</div>
            </div>
          </div>
        </div>
        <div style={{ flex:1, padding:"0 10px" }}>
          {navItems.map(([id, icon, label, enabled]) => (
            <div key={id} onClick={() => enabled && setActiveTab(id)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:12, marginBottom:4,
              cursor: enabled ? "pointer" : "not-allowed", opacity: enabled ? 1 : 0.35,
              background: activeTab===id ? "rgba(255,255,255,0.13)" : "transparent",
              borderLeft: activeTab===id ? `3px solid ${C.mustardMid}` : "3px solid transparent",
              transition:"all 0.18s",
            }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span style={{ fontSize:13, fontWeight:activeTab===id?700:400, color:activeTab===id?"#fff":"rgba(255,255,255,0.5)" }}>{label}</span>
              {!enabled && <span style={{ marginLeft:"auto", fontSize:9, color:"rgba(255,255,255,0.3)", fontWeight:600 }}>EM BREVE</span>}
            </div>
          ))}
        </div>
        <div style={{ padding:"16px 20px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.emeraldMid},${C.emerald})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>👨‍🏫</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{professorEmail||"Professor"}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>Personal Trainer</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ marginTop:12, width:"100%", padding:"8px", borderRadius:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.6)", fontSize:11, cursor:"pointer", fontWeight:600 }}>Sair</button>
        </div>
      </div>
    </div>
  );
}

// ── ABA ALUNOS ────────────────────────────────────────────────────────────────
function TabAlunos({ students, loading, navigate }) {
  const [hovered, setHovered] = useState(null);
  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:10, color:C.textSub, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Painel Principal</div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:C.text }}>Meus Alunos 👥</h1>
        </div>
        <button onClick={() => navigate("/students/new")} style={{ background:C.navy, border:"none", borderRadius:12, padding:"11px 20px", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:`0 4px 16px ${C.navy}44` }}>+ Novo Aluno</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
        {[
          { label:"Total de Alunos", value:students.length,                                     icon:"👥", bg:C.navyLight    },
          { label:"Treinos Ativos",  value:students.filter(s=>s.plan_status==="Ativo").length,   icon:"✅", bg:C.emeraldLight },
          { label:"Emagrecimento",   value:students.filter(s=>s.goal==="Emagrecimento").length,  icon:"🔥", bg:C.mustardLight },
          { label:"Ganho de Massa",  value:students.filter(s=>s.goal==="Ganho de Massa").length, icon:"💪", bg:C.navyLight    },
        ].map((s,i) => (
          <div key={i} style={{ background:C.white, borderRadius:16, padding:16, boxShadow:"0 2px 12px rgba(0,0,0,0.07)", border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-12, right:-12, width:55, height:55, borderRadius:"50%", background:s.bg, opacity:0.8 }} />
            <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:C.text }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.textSub, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {students.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:C.textSub, background:C.white, borderRadius:20, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
          <div style={{ fontSize:16, fontWeight:600 }}>Nenhum aluno cadastrado ainda</div>
          <div style={{ fontSize:13, marginTop:6 }}>Clique em "+ Novo Aluno" para comecar</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
          {students.map(st => {
            const prog  = st.progress || [];
            const lastW = prog[prog.length-1]?.weight ?? st.weight;
            const lastI = calcImc(lastW, st.height);
            const dW    = delta(prog, "weight");
            const dI    = prog.length > 1 ? +(parseFloat(calcImc(prog[prog.length-1].weight, st.height)) - parseFloat(calcImc(prog[prog.length-2].weight, st.height))).toFixed(1) : null;
            return (
              <div key={st.id}
                onMouseEnter={() => setHovered(st.id)} onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(`/students/${st.id}`)}
                style={{ background:C.white, borderRadius:20, padding:20, boxShadow: hovered===st.id?`0 8px 28px ${C.navy}22`:"0 2px 12px rgba(0,0,0,0.06)", border: hovered===st.id?`1.5px solid ${C.navyLight}`:`1.5px solid ${C.border}`, cursor:"pointer", transition:"all 0.22s", transform: hovered===st.id?"translateY(-3px)":"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ width:44, height:44, borderRadius:13, background:`${goalColor[st.goal]||C.navy}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:21 }}>{goalIcon[st.goal]||"🏋️"}</div>
                  <span style={{ fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:700, background:planBg[st.plan_status]||C.navyLight, color:planColor[st.plan_status]||C.navy }}>{st.plan_status||"Sem treino"}</span>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:2 }}>{st.name}</div>
                <div style={{ fontSize:11, color:goalColor[st.goal]||C.navy, fontWeight:600, marginBottom:12 }}>{st.goal||"—"} · {st.level||"—"}</div>
                {(dW !== null || dI !== null) && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                    <span style={{ fontSize:11, color:C.textSub }}>Ultima medicao:</span>
                    {dW !== null && <DeltaBadge value={dW} goal={st.goal} metric="kg" />}
                    {dI !== null && <DeltaBadge value={dI} goal={st.goal} metric="IMC" />}
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                  {[["Peso",`${lastW}kg`],["IMC",lastI],["Nivel",st.level?.slice(0,5)||"—"]].map(([l,v]) => (
                    <div key={l} style={{ background:C.bg, borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                      <div style={{ fontSize:8, color:C.textSub, textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>{l}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:10, color:C.textSub }}>Ver perfil completo</span>
                  <span style={{ fontSize:14, color:C.navy }}>→</span>
                </div>
              </div>
            );
          })}
          <div onClick={() => navigate("/students/new")} style={{ background:"transparent", borderRadius:20, padding:20, border:`2px dashed ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", minHeight:180, gap:8, transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.mustardLight;e.currentTarget.style.borderColor=C.mustard}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border}}>
            <div style={{ width:42, height:42, borderRadius:13, background:C.navyLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:C.navy }}>+</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>Novo Aluno</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ABA TREINOS ───────────────────────────────────────────────────────────────
function TabTreinos({ students, workoutDays, loading }) {
  const allDays = ["Seg","Ter","Qua","Qui","Sex","Sab","Dom"];
  const planMap = {};
  workoutDays.forEach(wd => {
    if (!planMap[wd.student_id]) planMap[wd.student_id] = {};
    planMap[wd.student_id][wd.day_name] = wd.day_name;
  });
  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, color:C.textSub, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Agenda Semanal</div>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:C.text }}>Treinos da Semana 🏋️</h1>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {allDays.map(d => (
          <div key={d} style={{ flex:1, minWidth:60, padding:"10px 6px", borderRadius:12, textAlign:"center", background: d===todayKey?C.navy:C.white, border: d===todayKey?`2px solid ${C.navy}`:`1px solid ${C.border}`, boxShadow: d===todayKey?`0 4px 14px ${C.navy}33`:"none" }}>
            <div style={{ fontSize:11, fontWeight:800, color: d===todayKey?C.mustardMid:C.textSub }}>{d}</div>
            {d===todayKey && <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)", marginTop:2 }}>Hoje</div>}
          </div>
        ))}
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>O que cada aluno treina hoje ({todayKey}):</div>
      <div style={{ display:"grid", gap:12, marginBottom:28 }}>
        {students.length === 0
          ? <div style={{ padding:20, textAlign:"center", color:C.textSub }}>Nenhum aluno cadastrado.</div>
          : students.map(st => {
            const w = planMap[st.id]?.[todayKey];
            return (
              <div key={st.id} style={{ background:C.white, borderRadius:16, padding:"16px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:16, boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ width:46, height:46, borderRadius:13, background:`${goalColor[st.goal]||C.navy}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{goalIcon[st.goal]||"🏋️"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>{st.name}</div>
                  <span style={{ fontSize:12, fontWeight:600, color: w?C.navy:C.textSub, background: w?C.navyLight:C.bg, padding:"4px 12px", borderRadius:20, border:`1px solid ${w?C.navyLight:C.border}` }}>
                    {w ? `🏋️ ${w}` : "😴 Dia de Descanso"}
                  </span>
                </div>
                <span style={{ fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:700, background:planBg[st.plan_status]||C.navyLight, color:planColor[st.plan_status]||C.navy }}>{st.plan_status||"—"}</span>
              </div>
            );
          })
        }
      </div>
      {students.length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>Visao completa da semana:</div>
          <div style={{ background:C.white, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}` }}>
            <div style={{ display:"grid", gridTemplateColumns:"1.5fr repeat(7,1fr)", background:C.navy }}>
              <div style={{ padding:"10px 16px", fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>Aluno</div>
              {allDays.map(d => <div key={d} style={{ padding:"10px 8px", fontSize:11, fontWeight:700, color: d===todayKey?C.mustardMid:"rgba(255,255,255,0.6)", textAlign:"center" }}>{d}</div>)}
            </div>
            {students.map((st,i) => (
              <div key={st.id} style={{ display:"grid", gridTemplateColumns:"1.5fr repeat(7,1fr)", borderTop:`1px solid ${C.border}`, background: i%2===0?C.white:C.bg }}>
                <div style={{ padding:"12px 16px", fontSize:12, fontWeight:700, color:C.text, display:"flex", alignItems:"center", gap:6 }}><span>{goalIcon[st.goal]||"🏋️"}</span>{st.name.split(" ")[0]}</div>
                {allDays.map(d => {
                  const w = planMap[st.id]?.[d];
                  return <div key={d} style={{ padding:"10px 6px", fontSize:10, textAlign:"center", color: !w?C.border:d===todayKey?C.navy:C.textSub, fontWeight: d===todayKey?700:400, background: d===todayKey?C.navyLight:"transparent" }}>{w||"—"}</div>;
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ABA EVOLUCAO ──────────────────────────────────────────────────────────────
function TabEvolucao({ students, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { if (students.length > 0 && !selectedId) setSelectedId(students[0].id); }, [students]);
  if (loading) return <Spinner />;
  if (students.length === 0) return <div style={{ padding:40, textAlign:"center", color:C.textSub }}>Nenhum aluno cadastrado.</div>;

  const st   = students.find(s => s.id === selectedId) || students[0];
  const prog = (st.progress || []).map(p => ({
    ...p,
    imcVal: p.weight && st.height ? parseFloat(calcImc(p.weight, st.height)) : null,
    date: p.measured_at ? new Date(p.measured_at).toLocaleDateString("pt-BR",{month:"short",day:"numeric"}) : "—",
  }));

  const chartCard = (title, subtitle, children) => (
    <div style={{ background:C.white, borderRadius:16, padding:20, border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{title}</div>
      <div style={{ fontSize:11, color:C.textSub, marginBottom:12 }}>{subtitle}</div>
      {children}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, color:C.textSub, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Acompanhamento</div>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:C.text }}>Evolucao 📈</h1>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {students.map(s => (
          <button key={s.id} onClick={() => setSelectedId(s.id)} style={{ padding:"9px 16px", borderRadius:10, cursor:"pointer", background: selectedId===s.id?C.navy:C.white, color: selectedId===s.id?"#fff":C.textSub, fontWeight:700, fontSize:12, border:`1px solid ${selectedId===s.id?C.navy:C.border}`, boxShadow: selectedId===s.id?`0 4px 12px ${C.navy}33`:"none" }}>
            {goalIcon[s.goal]||"🏋️"} {s.name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div style={{ background:C.white, borderRadius:16, padding:"16px 20px", border:`1px solid ${C.border}`, marginBottom:20, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
        <div style={{ width:48, height:48, borderRadius:14, background:`${goalColor[st.goal]||C.navy}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{goalIcon[st.goal]||"🏋️"}</div>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{st.name}</div>
          <div style={{ fontSize:12, color:goalColor[st.goal]||C.navy, fontWeight:600 }}>{st.goal} · {st.level}</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10, flexWrap:"wrap" }}>
          {[
            ["Peso atual", prog.length>0?`${prog[prog.length-1].weight}kg`:`${st.weight}kg`],
            ["IMC",        prog.length>0?prog[prog.length-1].imcVal:calcImc(st.weight,st.height)],
            ["Medicoes",   prog.length],
          ].map(([l,v]) => (
            <div key={l} style={{ background:C.bg, borderRadius:10, padding:"8px 14px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:C.textSub, textTransform:"uppercase", letterSpacing:1 }}>{l}</div>
              <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      {prog.length < 2 ? (
        <div style={{ textAlign:"center", padding:40, color:C.textSub, background:C.white, borderRadius:16, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📊</div>
          <div style={{ fontSize:15, fontWeight:600 }}>Dados insuficientes para graficos</div>
          <div style={{ fontSize:12, marginTop:6 }}>Adicione pelo menos 2 medicoes de progresso para visualizar a evolucao</div>
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            {chartCard("⚖️ Peso (kg)", st.goal==="Ganho de Massa"?"Meta: ganhar massa":"Meta: reduzir peso",
              <LineChart data={prog} dataKey="weight" color={C.navy} label="Peso (kg)" />
            )}
            {chartCard("📊 IMC", "Indice de massa corporal",
              <LineChart data={prog} dataKey="imcVal" color={C.mustard} label="IMC" />
            )}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {chartCard("📏 Medidas Corporais (cm)", "Cintura · Peito · Coxa",
              <MultiLineChart
                data={prog}
                keys={["waist_cm","chest_cm","thigh_cm"]}
                colors={[C.emerald, C.navy, C.mustard]}
                labels={["Cintura","Peito","Coxa"]}
              />
            )}
            {chartCard("🏋️ Carga nos Exercicios (kg)", "Progressao de forca",
              <LineChart data={prog} dataKey="notes" color="#7C3AED" label="Carga (kg)" />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── DASHBOARD PRINCIPAL ───────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab,   setActiveTab]   = useState("alunos");
  const [students,    setStudents]    = useState([]);
  const [workoutDays, setWorkoutDays] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [userEmail,   setUserEmail]   = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      setUserEmail(user.email);

      const [
        { data: studs },
        { data: allProgress },
        { data: allPlans },
        { data: allDays },
      ] = await Promise.all([
        supabase.from("students").select("*").order("created_at", { ascending: false }),
        supabase.from("progress_entries").select("*").order("measured_at", { ascending: true }),
        supabase.from("workout_plans").select("student_id, status").order("created_at", { ascending: false }),
        supabase.from("workout_days").select("plan_id, day_name, workout_plans(student_id)"),
      ]);

      if (!studs) { setLoading(false); return; }

      const progressMap   = {};
      const planStatusMap = {};

      (allProgress||[]).forEach(p => {
        if (!progressMap[p.student_id]) progressMap[p.student_id] = [];
        progressMap[p.student_id].push(p);
      });
      (allPlans||[]).forEach(p => {
        if (!planStatusMap[p.student_id]) planStatusMap[p.student_id] = p.status;
      });

      setStudents(studs.map(st => ({
        ...st,
        progress:    progressMap[st.id]    || [],
        plan_status: planStatusMap[st.id]  || null,
      })));

      setWorkoutDays(
        (allDays||[])
          .map(d => ({ student_id: d.workout_plans?.student_id, day_name: d.day_name }))
          .filter(d => d.student_id)
      );

      setLoading(false);
    }
    loadAll();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI', system-ui, sans-serif", display:"flex" }}>
      <WavySidebar activeTab={activeTab} setActiveTab={setActiveTab} professorEmail={userEmail} onLogout={handleLogout} />
      <div style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>
        {activeTab==="alunos"   && <TabAlunos   students={students} loading={loading} navigate={navigate} />}
        {activeTab==="treinos"  && <TabTreinos  students={students} workoutDays={workoutDays} loading={loading} />}
        {activeTab==="evolucao" && <TabEvolucao students={students} loading={loading} />}
      </div>
    </div>
  );
}
