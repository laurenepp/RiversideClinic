// js/ui.js

// js/ui.js

function ensureToastWrap(){
  let wrap = document.getElementById("toastWrap");
  if(!wrap){
    wrap = document.createElement("div");
    wrap.id = "toastWrap";
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  return wrap;
}

function toast(title, msg="", type="ok"){
  const wrap = ensureToastWrap();
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="t-title">${title}</div>
    <div class="t-msg">${msg}</div>
  `;
  wrap.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 3200);
}

async function apiSafe(url, method="GET", data=null){
  try{
    const out = await api(url, method, data);
    return out;
  }catch(e){
    const msg = e?.error || "Request failed";
    toast("Error", msg, "err");
    throw e;
  }
}

function fmtDT(mysqlDT){
  if(!mysqlDT) return "";
  const s = String(mysqlDT).replace(" ", "T");
  const d = new Date(s);
  if(isNaN(d.getTime())) return mysqlDT;
  return d.toLocaleString([], {
    month:"2-digit", day:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}

function badgeClass(status){
  const s = String(status||"").toUpperCase();
  if(s === "CHECKED_IN") return "badge dark";
  if(s === "COMPLETED") return "badge teal";
  if(s === "CANCELLED") return "badge gold";
  if(s === "RESCHEDULED") return "badge gold";
  return "badge";
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}