import { useState, useEffect } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHIW1_orqyqvoiCPur0J0WmXy7GNJhfLo",
  authDomain: "nascimento-e-marques.firebaseapp.com",
  projectId: "nascimento-e-marques",
  storageBucket: "nascimento-e-marques.firebasestorage.app",
  messagingSenderId: "291678527023",
  appId: "1:291678527023:web:afd2e0ccf5448094e230da"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const C = {
  navy: "#1B2D5B", navyLight: "#243870",
  gold: "#C9A84C", goldLight: "#E8D08A", goldBg: "#FBF7EE",
  bg: "#F7F6F2", card: "#FFFFFF",
  text: "#2C2C2C", muted: "#6B7280", border: "#E5E0D5",
  danger: "#C0392B",
};

const TIPO_C = {
  Trabalhista: { bg: "#EEF2FF", text: "#3730A3" },
  "Cível":     { bg: "#ECFDF5", text: "#065F46" },
  Federal:     { bg: "#FFF7ED", text: "#9A3412" },
};
const STATUS_C = {
  "Em andamento":       { bg: "#DBEAFE", text: "#1E40AF" },
  "Recurso":            { bg: "#FEF9C3", text: "#92400E" },
  "Aguardando decisão": { bg: "#F3E8FF", text: "#6B21A8" },
  "Encerrado":          { bg: "#F3F4F6", text: "#374151" },
};
const AG_C = {
  Prazo:     { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  "Audiência": { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  "Reunião": { bg: "#DCFCE7", text: "#166534", dot: "#22C55E" },
  Outro:     { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
};

const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate  = (iso) => { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };
const daysDiff = (iso) => {
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((new Date(iso + "T00:00:00") - t) / 86400000);
};

const Badge = ({ children, bg, color }) => (
  <span style={{ background: bg, color, fontSize: 10, fontWeight: 700,
    padding: "2px 8px", borderRadius: 20, letterSpacing: "0.04em",
    textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
);

const SLabel = ({ children }) => (
  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: C.gold, margin: "0 0 3px" }}>{children}</p>
);

const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: 8 }}>
    <SLabel>{label}</SLabel>
    <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{value || "—"}</p>
  </div>
);

const InputField = (props) => (
  <input style={{ width: "100%", padding: "9px 10px", borderRadius: 8,
    border: `1px solid ${C.border}`, fontSize: 13, background: C.bg,
    color: C.text, outline: "none", boxSizing: "border-box", marginBottom: 10 }} {...props} />
);

const SelectField = ({ children, ...props }) => (
  <select style={{ width: "100%", padding: "9px 10px", borderRadius: 8,
    border: `1px solid ${C.border}`, fontSize: 13, background: C.bg,
    color: C.text, outline: "none", boxSizing: "border-box", marginBottom: 10 }} {...props}>
    {children}
  </select>
);

const PrimaryBtn = ({ children, style, ...props }) => (
  <button style={{ width: "100%", padding: 13, borderRadius: 10, border: "none",
    cursor: "pointer", fontSize: 14, fontWeight: 700,
    background: `linear-gradient(135deg,${C.navy},${C.navyLight})`,
    color: "#fff", ...style }} {...props}>{children}</button>
);

const LogoBadge = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 32, height: 32, borderRadius: 6,
      background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: 18, color: C.navy, fontFamily: "serif" }}>M</div>
    <div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff",
        fontFamily: "Georgia,serif", lineHeight: 1.1 }}>NASCIMENTO & MARQUES</p>
      <p style={{ margin: 0, fontSize: 9, color: C.goldLight,
        letterSpacing: "0.15em", textTransform: "uppercase" }}>Advogados Associados</p>
    </div>
  </div>
);

function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro]   = useState("");
  const [load, setLoad]   = useState(false);
  const [modo, setModo]   = useState("login");

  const entrar = async () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setLoad(true); setErro("");
    try {
      if (modo === "login") await signInWithEmailAndPassword(auth, email, senha);
      else await createUserWithEmailAndPassword(auth, email, senha);
    } catch(e) {
      const m = {
        "auth/invalid-credential": "E-mail ou senha incorretos.",
        "auth/user-not-found": "Usuário não encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/email-already-in-use": "E-mail já cadastrado.",
        "auth/weak-password": "Senha deve ter ao menos 6 caracteres.",
        "auth/invalid-email": "E-mail inválido.",
      };
      setErro(m[e.code] || "Erro ao autenticar. Tente novamente.");
    }
    setLoad(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 12px",
          background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, fontWeight: 900, color: C.navy, fontFamily: "serif" }}>M</div>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff",
          fontFamily: "Georgia,serif" }}>NASCIMENTO & MARQUES</p>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: C.goldLight,
          letterSpacing: "0.18em", textTransform: "uppercase" }}>Advogados Associados</p>
      </div>
      <div style={{ background: C.card, borderRadius: 16, padding: 24,
        width: "100%", maxWidth: 360, boxSizing: "border-box",
        boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: C.navy,
          margin: "0 0 16px", textAlign: "center" }}>
          {modo === "login" ? "Entrar no sistema" : "Criar acesso"}
        </p>
        <SLabel>E-mail</SLabel>
        <InputField type="email" placeholder="seuemail@exemplo.com"
          value={email} onChange={e => setEmail(e.target.value)} />
        <SLabel>Senha</SLabel>
        <InputField type="password" placeholder="••••••••"
          value={senha} onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === "Enter" && entrar()} />
        {erro && <p style={{ color: C.danger, fontSize: 12, margin: "-4px 0 10px",
          background: "#FEE2E2", padding: "8px 10px", borderRadius: 8 }}>{erro}</p>}
        <PrimaryBtn onClick={entrar} disabled={load}>
          {load ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
        </PrimaryBtn>
        <p style={{ textAlign: "center", fontSize: 12, color: C.muted,
          marginTop: 14, cursor: "pointer" }}
          onClick={() => { setModo(m => m === "login" ? "cadastro" : "login"); setErro(""); }}>
          {modo === "login" ? "Primeiro acesso? Criar conta →" : "Já tenho conta. Entrar →"}
        </p>
      </div>
    </div>
  );
}

function BottomSheet({ titulo, onFechar, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
      zIndex: 50, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: 20,
        width: "100%", maxHeight: "88vh", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: C.navy, margin: 0 }}>{titulo}</p>
          <button onClick={onFechar}
            style={{ background: "none", border: "none", fontSize: 22,
              cursor: "pointer", color: C.muted }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalProcesso({ inicial, onSalvar, onFechar }) {
  const [f, setF] = useState(inicial || {
    numero: "", tipo: "Trabalhista", status: "Em andamento",
    foro: "", vara: "", autores: "", reus: "", terceiros: "", procedimento: "",
  });
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  return (
    <BottomSheet titulo={inicial ? "Editar Processo" : "Novo Processo"} onFechar={onFechar}>
      <SLabel>Número do processo</SLabel>
      <InputField placeholder="0000000-00.0000.0.00.0000" value={f.numero} onChange={upd("numero")} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SLabel>Tipo</SLabel>
          <SelectField value={f.tipo} onChange={upd("tipo")}>
            <option>Trabalhista</option><option>Cível</option><option>Federal</option>
          </SelectField>
        </div>
        <div style={{ flex: 1 }}>
          <SLabel>Status</SLabel>
          <SelectField value={f.status} onChange={upd("status")}>
            <option>Em andamento</option><option>Recurso</option>
            <option>Aguardando decisão</option><option>Encerrado</option>
          </SelectField>
        </div>
      </div>
      <SLabel>Foro</SLabel>
      <InputField placeholder="Ex: TRT 2ª Região" value={f.foro} onChange={upd("foro")} />
      <SLabel>Vara</SLabel>
      <InputField placeholder="Ex: 1ª Vara do Trabalho de SP" value={f.vara} onChange={upd("vara")} />
      <SLabel>Autor(es) — separe por vírgula</SLabel>
      <InputField placeholder="Nome do Autor" value={f.autores} onChange={upd("autores")} />
      <SLabel>Réu(s) — separe por vírgula</SLabel>
      <InputField placeholder="Nome do Réu" value={f.reus} onChange={upd("reus")} />
      <SLabel>Terceiros (opcional)</SLabel>
      <InputField placeholder="Nome do terceiro" value={f.terceiros} onChange={upd("terceiros")} />
      <SLabel>Procedimento a executar</SLabel>
      <textarea value={f.procedimento} onChange={upd("procedimento")} rows={3}
        placeholder="Descreva a próxima ação necessária..."
        style={{ width: "100%", padding: "9px 10px", borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 13, background: C.bg,
          color: C.text, outline: "none", boxSizing: "border-box",
          marginBottom: 14, resize: "vertical", fontFamily: "inherit" }} />
      <PrimaryBtn onClick={() => onSalvar({
        ...f,
        autores: f.autores.split(",").map(s => s.trim()).filter(Boolean),
        reus:    f.reus.split(",").map(s => s.trim()).filter(Boolean),
        terceiros: f.terceiros.split(",").map(s => s.trim()).filter(Boolean),
      })}>Salvar Processo</PrimaryBtn>
    </BottomSheet>
  );
}

function ModalAndamento({ onSalvar, onFechar }) {
  const [data, setData] = useState(todayStr());
  const [desc, setDesc] = useState("");
  return (
    <BottomSheet titulo="Registrar Andamento" onFechar={onFechar}>
      <SLabel>Data</SLabel>
      <InputField type="date" value={data} onChange={e => setData(e.target.value)} />
      <SLabel>Descrição</SLabel>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
        placeholder="Descreva o andamento..."
        style={{ width: "100%", padding: "9px 10px", borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 13, background: C.bg,
          color: C.text, outline: "none", boxSizing: "border-box",
          marginBottom: 14, resize: "vertical", fontFamily: "inherit" }} />
      <PrimaryBtn onClick={() => desc.trim() && onSalvar({ data: fmtDate(data), descricao: desc.trim() })}>
        Registrar
      </PrimaryBtn>
    </BottomSheet>
  );
}

function ModalEvento({ onSalvar, onFechar }) {
  const [f, setF] = useState({ data: todayStr(), hora: "09:00", tipo: "Prazo", descricao: "" });
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <BottomSheet titulo="Novo Lembrete" onFechar={onFechar}>
      <SLabel>Tipo</SLabel>
      <SelectField value={f.tipo} onChange={upd("tipo")}>
        <option>Prazo</option><option>Audiência</option>
        <option>Reunião</option><option>Outro</option>
      </SelectField>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 2 }}><SLabel>Data</SLabel>
          <InputField type="date" value={f.data} onChange={upd("data")} /></div>
        <div style={{ flex: 1 }}><SLabel>Hora</SLabel>
          <InputField type="time" value={f.hora} onChange={upd("hora")} /></div>
      </div>
      <SLabel>Descrição</SLabel>
      <InputField placeholder="Ex: Prazo — Apelação proc. 0009876"
        value={f.descricao} onChange={upd("descricao")} />
      <PrimaryBtn onClick={() => f.descricao.trim() && onSalvar(f)}>Salvar Lembrete</PrimaryBtn>
    </BottomSheet>
  );
}

function TelaDetalhe({ proc, onEditar, onDeletar }) {
  const [modalAnd, setModalAnd] = useState(false);
  const tc  = TIPO_C[proc.tipo]    || TIPO_C.Trabalhista;
  const sc  = STATUS_C[proc.status] || STATUS_C["Encerrado"];
  const ands = proc.andamentos || [];

  const salvarAndamento = async (a) => {
    const novos = [a, ...ands].slice(0, 20);
    await updateDoc(doc(db, "processos", proc.id), { andamentos: novos });
    setModalAnd(false);
  };

  return (
    <div style={{ padding: "0 16px 80px" }}>
      <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 12,
        boxShadow: "0 2px 8px rgba(27,45,91,.07)", borderTop: `4px solid ${C.gold}` }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          <Badge bg={tc.bg} color={tc.text}>{proc.tipo}</Badge>
          <Badge bg={sc.bg} color={sc.text}>{proc.status}</Badge>
        </div>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 8px", fontFamily: "monospace" }}>
          {proc.numero}
        </p>
        <InfoRow label="Foro" value={proc.foro} />
        <InfoRow label="Vara" value={proc.vara} />
      </div>

      <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 12,
        boxShadow: "0 2px 8px rgba(27,45,91,.07)" }}>
        <InfoRow label="Autor(es)" value={(proc.autores || []).join(" | ")} />
        <InfoRow label="Réu(s)"    value={(proc.reus    || []).join(" | ")} />
        {(proc.terceiros || []).length > 0 &&
          <InfoRow label="Terceiros" value={proc.terceiros.join(" | ")} />}
      </div>

      <div style={{ background: C.goldBg, borderRadius: 12, padding: 14, marginBottom: 12,
        border: `1px solid ${C.goldLight}` }}>
        <SLabel>📋 Procedimento a executar</SLabel>
        <p style={{ fontSize: 14, color: C.navy, fontWeight: 600, margin: 0 }}>
          {proc.procedimento || "—"}
        </p>
      </div>

      <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 12,
        boxShadow: "0 2px 8px rgba(27,45,91,.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 10 }}>
          <SLabel>🗂 Últimos andamentos</SLabel>
          <button onClick={() => setModalAnd(true)}
            style={{ background: C.gold, border: "none", borderRadius: 20,
              padding: "3px 10px", fontSize: 11, fontWeight: 700,
              color: C.navy, cursor: "pointer" }}>+ Registrar</button>
        </div>
        {ands.slice(0, 3).map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4,
                background: C.gold, marginTop: 3 }} />
              {i < 2 && <div style={{ width: 1, flex: 1,
                background: C.border, marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: C.gold, fontWeight: 700,
                letterSpacing: "0.05em", margin: "0 0 2px" }}>{a.data}</p>
              <p style={{ fontSize: 12, color: C.text, margin: 0 }}>{a.descricao}</p>
            </div>
          </div>
        ))}
        {ands.length === 0 &&
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Nenhum andamento registrado.</p>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onEditar}
          style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.navy}`,
            background: "none", color: C.navy, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ✏️ Editar
        </button>
        <button onClick={onDeletar}
          style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.danger}`,
            background: "none", color: C.danger, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          🗑 Excluir
        </button>
      </div>

      {modalAnd && <ModalAndamento onSalvar={salvarAndamento} onFechar={() => setModalAnd(false)} />}
    </div>
  );
}

function TelaProcessos({ processos, onSelect, onNovo }) {
  const [busca, setBusca]   = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const tipos = ["Todos", "Trabalhista", "Cível", "Federal"];

  const lista = processos.filter(p => {
    const q  = busca.toLowerCase();
    const ok = p.numero?.includes(q)
      || (p.autores || []).join().toLowerCase().includes(q)
      || (p.reus    || []).join().toLowerCase().includes(q);
    return ok && (filtro === "Todos" || p.tipo === filtro);
  });

  return (
    <div style={{ padding: "0 16px 80px" }}>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 10, top: "50%",
          transform: "translateY(-50%)", fontSize: 14, color: C.muted }}>🔍</span>
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar número, parte..."
          style={{ width: "100%", padding: "10px 10px 10px 32px", borderRadius: 10,
            border: `1px solid ${C.border}`, fontSize: 13, background: C.card,
            color: C.text, outline: "none", boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14,
        overflowX: "auto", paddingBottom: 4 }}>
        {tipos.map(t => (
          <button key={t} onClick={() => setFiltro(t)}
            style={{ padding: "5px 12px", borderRadius: 20, border: "none",
              cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              background: filtro === t ? C.navy : C.card,
              color: filtro === t ? "#fff" : C.muted,
              boxShadow: filtro === t ? "none" : "0 1px 3px rgba(0,0,0,.08)" }}>
            {t}
          </button>
        ))}
      </div>

      {lista.map(p => {
        const tc = TIPO_C[p.tipo]    || TIPO_C.Trabalhista;
        const sc = STATUS_C[p.status] || STATUS_C["Encerrado"];
        return (
          <div key={p.id} onClick={() => onSelect(p)}
            style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 10,
              boxShadow: "0 2px 8px rgba(27,45,91,.07)", cursor: "pointer",
              borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
              <Badge bg={tc.bg} color={tc.text}>{p.tipo}</Badge>
              <Badge bg={sc.bg} color={sc.text}>{p.status}</Badge>
            </div>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 4px", fontFamily: "monospace" }}>
              {p.numero}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: "0 0 2px" }}>
              {(p.autores || []).join(", ")}
            </p>
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 8px" }}>
              × {(p.reus || []).join(", ")}
            </p>
            <div style={{ height: 1, background: C.border, marginBottom: 8 }} />
            <p style={{ fontSize: 11, color: C.text, margin: 0 }}>
              📋 <strong>Próximo passo:</strong> {p.procedimento || "—"}
            </p>
          </div>
        );
      })}

      {lista.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          <p style={{ fontSize: 32 }}>📂</p>
          <p>Nenhum processo encontrado.</p>
        </div>
      )}

      <button onClick={onNovo}
        style={{ position: "fixed", bottom: 72, right: 20, width: 52, height: 52,
          borderRadius: 26, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
          border: "none", cursor: "pointer", fontSize: 24, color: C.navy,
          boxShadow: "0 4px 16px rgba(201,168,76,.5)", zIndex: 10 }}>+</button>
    </div>
  );
}

function TelaAgenda({ agenda, onNovo, onDeletar }) {
  const hoje = todayStr();
  const ord  = [...agenda].sort((a, b) => a.data.localeCompare(b.data));
  const prox = ord.filter(e => e.data >= hoje);
  const pass = ord.filter(e => e.data < hoje);

  const Card = ({ e }) => {
    const tc   = AG_C[e.tipo] || AG_C.Outro;
    const diff = daysDiff(e.data);
    const urg  = diff >= 0 && diff <= 3;
    return (
      <div style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 8,
        boxShadow: "0 2px 8px rgba(27,45,91,.07)",
        borderLeft: `4px solid ${tc.dot}`, opacity: diff < 0 ? 0.6 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <Badge bg={tc.bg} color={tc.text}>{e.tipo}</Badge>
          {urg && <Badge bg="#FEE2E2" color="#991B1B">⚠ URGENTE</Badge>}
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: "4px 0 2px" }}>
          {e.descricao}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            📅 {fmtDate(e.data)} às {e.hora}
            {diff >= 0 && <span style={{ color: urg ? C.danger : C.muted }}>
              {" "}· {diff === 0 ? "Hoje!" : `em ${diff} dia${diff > 1 ? "s" : ""}`}
            </span>}
          </p>
          <button onClick={() => onDeletar(e.id)}
            style={{ background: "none", border: "none", color: C.muted,
              fontSize: 16, cursor: "pointer", padding: "0 4px" }}>🗑</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0 16px 80px" }}>
      {prox.length > 0 && <>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.gold,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Próximas</p>
        {prox.map(e => <Card key={e.id} e={e} />)}
      </>}
      {pass.length > 0 && <>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted,
          letterSpacing: "0.1em", textTransform: "uppercase", margin: "16px 0 8px" }}>Anteriores</p>
        {pass.map(e => <Card key={e.id} e={e} />)}
      </>}
      {agenda.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          <p style={{ fontSize: 32 }}>📅</p>
          <p>Nenhum lembrete cadastrado.</p>
        </div>
      )}
      <button onClick={onNovo}
        style={{ position: "fixed", bottom: 72, right: 20, width: 52, height: 52,
          borderRadius: 26, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
          border: "none", cursor: "pointer", fontSize: 24, color: C.navy,
          boxShadow: "0 4px 16px rgba(201,168,76,.5)", zIndex: 10 }}>+</button>
    </div>
  );
}

export default function App() {
  const [user, setUser]           = useState(undefined);
  const [aba, setAba]             = useState("processos");
  const [processos, setProcessos] = useState([]);
  const [agenda, setAgenda]       = useState([]);
  const [procSel, setProcSel]     = useState(null);
  const [modal, setModal]         = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubP = onSnapshot(
      query(collection(db, "processos"), orderBy("criadoEm", "desc")),
      snap => setProcessos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubA = onSnapshot(
      query(collection(db, "agenda"), orderBy("data", "asc")),
      snap => setAgenda(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubP(); unsubA(); };
  }, [user]);

  const salvarProcesso = async (dados) => {
    if (modal === "editar" && procSel) {
      await updateDoc(doc(db, "processos", procSel.id), dados);
      setProcSel(p => ({ ...p, ...dados }));
    } else {
      await addDoc(collection(db, "processos"),
        { ...dados, andamentos: [], criadoEm: serverTimestamp() });
    }
    setModal(null);
  };

  const deletarProcesso = async (id) => {
    if (!window.confirm("Excluir este processo permanentemente?")) return;
    await deleteDoc(doc(db, "processos", id));
    setProcSel(null);
  };

  const salvarEvento = async (dados) => {
    await addDoc(collection(db, "agenda"), { ...dados, criadoEm: serverTimestamp() });
    setModal(null);
  };

  const deletarEvento = async (id) => {
    await deleteDoc(doc(db, "agenda", id));
  };

  const urgentes = agenda.filter(e => { const d = daysDiff(e.data); return d >= 0 && d <= 3; }).length;

  if (user === undefined) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: C.navy }}>
      <p style={{ color: C.goldLight, fontSize: 14 }}>Carregando...</p>
    </div>
  );

  if (!user) return <TelaLogin />;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 430,
      margin: "0 auto", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      <div style={{ background: C.navy, padding: "12px 16px",
        position: "sticky", top: 0, zIndex: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <LogoBadge />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {urgentes > 0 && (
              <div style={{ background: C.danger, borderRadius: 20, padding: "3px 8px",
                fontSize: 10, fontWeight: 700, color: "#fff" }}>⚠ {urgentes}</div>
            )}
            <button onClick={() => signOut(auth)}
              style={{ background: "rgba(255,255,255,.12)", border: "none",
                color: "rgba(255,255,255,.8)", fontSize: 11, padding: "5px 10px",
                borderRadius: 20, cursor: "pointer" }}>Sair</button>
          </div>
        </div>
        {procSel && (
          <button onClick={() => setProcSel(null)}
            style={{ background: "none", border: "none", color: C.goldLight,
              fontSize: 12, cursor: "pointer", padding: "6px 0 0",
              display: "flex", alignItems: "center", gap: 4 }}>
            ← Voltar para processos
          </button>
        )}
      </div>

      <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 18, background: C.gold, borderRadius: 2 }} />
        <p style={{ fontSize: 15, fontWeight: 800, color: C.navy, margin: 0 }}>
          {procSel ? "Detalhes do Processo"
            : aba === "processos" ? `Processos (${processos.length})` : "Agenda"}
        </p>
      </div>

      {procSel ? (
        <TelaDetalhe
          proc={procSel}
          onEditar={() => setModal("editar")}
          onDeletar={() => deletarProcesso(procSel.id)}
        />
      ) : aba === "processos" ? (
        <TelaProcessos processos={processos} onSelect={setProcSel} onNovo={() => setModal("processo")} />
      ) : (
        <TelaAgenda agenda={agenda} onNovo={() => setModal("evento")} onDeletar={deletarEvento} />
      )}

      {!procSel && (
        <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, background: C.card,
          borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 20,
          boxShadow: "0 -2px 12px rgba(0,0,0,.08)" }}>
          {[
            { id: "processos", icon: "⚖️", label: "Processos" },
            { id: "agenda",    icon: "📅", label: `Agenda${urgentes > 0 ? ` (${urgentes})` : ""}` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              style={{ flex: 1, padding: "10px 8px", border: "none", cursor: "pointer",
                background: "none", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700,
                color: aba === tab.id ? C.navy : C.muted,
                borderBottom: aba === tab.id ? `2px solid ${C.gold}` : "2px solid transparent",
                paddingBottom: 2 }}>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {modal === "processo" && (
        <ModalProcesso onSalvar={salvarProcesso} onFechar={() => setModal(null)} />
      )}
      {modal === "editar" && procSel && (
        <ModalProcesso
          inicial={{
            ...procSel,
            autores:   (procSel.autores   || []).join(", "),
            reus:      (procSel.reus      || []).join(", "),
            terceiros: (procSel.terceiros || []).join(", "),
          }}
          onSalvar={salvarProcesso} onFechar={() => setModal(null)}
        />
      )}
      {modal === "evento" && (
        <ModalEvento onSalvar={salvarEvento} onFechar={() => setModal(null)} />
      )}
    </div>
  );
}
