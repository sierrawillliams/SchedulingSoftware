import { useState, useRef, useCallback, useEffect } from "react";

// — Helpers ——————————————————————
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ALL_CLIENTS = ["AA","MG","JB","TS","RK","DL","PW","NB","CH","LM"];

function genId() { return Math.random().toString(36).slice(2,9); }
function initials(name) {
const parts = name.trim().split(/\s+/);
if (parts.length === 1) return name.slice(0,2).toUpperCase();
return parts.map(n=>n[0]).join("").toUpperCase().slice(0,2);
}
function timeToMin(t) { const [h,m]=t.split(":").map(Number); return h*60+m; }
function fmtTime(t) {
const [h,m]=t.split(":").map(Number);
const ampm=h>=12?"pm":"am"; const hh=h%12||12;
return m===0?`${hh}${ampm}`:`${hh}:${String(m).padStart(2,"0")}${ampm}`;
}
function fmtDate(d) { return d.toLocaleDateString("en-CA",{month:"short",day:"numeric"}); }

function getWeekDates(anchor) {
const d=new Date(anchor); const day=d.getDay();
const sun=new Date(d); sun.setDate(d.getDate()-day);
return DAYS.map((_,i)=>{ const dd=new Date(sun); dd.setDate(sun.getDate()+i); return dd; });
}

function calcUniqueHours(dayShifts) {
if (!dayShifts.length) return 0;
const ivs=dayShifts.map(s=>[timeToMin(s.start),timeToMin(s.end)]).sort((a,b)=>a[0]-b[0]);
let total=0, cur=[...ivs[0]];
for (let i=1;i<ivs.length;i++) {
if (ivs[i][0]<=cur[1]) cur[1]=Math.max(cur[1],ivs[i][1]);
else { total+=cur[1]-cur[0]; cur=[...ivs[i]]; }
}
total+=cur[1]-cur[0];
return Math.round((total/60)*10)/10;
}

function weeklyHours(shifts, userId, weekDates) {
const dateStrs=weekDates.map(d=>d.toISOString().split("T")[0]);
const mine=shifts.filter(s=>s.userId===userId&&dateStrs.includes(s.date));
const byDay={};
mine.forEach(s=>{ (byDay[s.date]=byDay[s.date]||[]).push(s); });
return Math.round(Object.values(byDay).reduce((sum,day)=>sum+calcUniqueHours(day),0)*10)/10;
}

const PILL_STYLES = [
{bg:"#ede9fe",border:"#a78bfa",text:"#5b21b6"},
{bg:"#fef9c3",border:"#fbbf24",text:"#92400e"},
{bg:"#dbeafe",border:"#60a5fa",text:"#1e40af"},
{bg:"#fce7f3",border:"#f472b6",text:"#9d174d"},
{bg:"#d1fae5",border:"#34d399",text:"#065f46"},
{bg:"#ffedd5",border:"#fb923c",text:"#7c2d12"},
{bg:"#e0e7ff",border:"#818cf8",text:"#3730a3"},
{bg:"#fdf2f8",border:"#e879f9",text:"#701a75"},
{bg:"#ecfdf5",border:"#6ee7b7",text:"#064e3b"},
{bg:"#fef3c7",border:"#f59e0b",text:"#78350f"},
];
function pillStyle(client) {
const i = ALL_CLIENTS.indexOf(client) % PILL_STYLES.length;
return PILL_STYLES[Math.max(0,i)];
}

// — Seed Data ––––––––––––––––––––––––––––––––
const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay());
function wd(offset) { const d=new Date(weekStart); d.setDate(weekStart.getDate()+offset); return d.toISOString().split("T")[0]; }

const SEED_USERS = [
{ id:"u1", name:"Admin User", username:"admin", password:"admin123", role:"admin", allowOvertime:false,
trainedClients:ALL_CLIENTS,
availability:{Sun:[],Mon:["08:00","20:00"],Tue:["08:00","20:00"],Wed:["08:00","20:00"],Thu:["08:00","20:00"],Fri:["08:00","20:00"],Sat:[]} },
{ id:"u2", name:"Sarah Mitchell", username:"sarah", password:"pass123", role:"user", allowOvertime:false,
trainedClients:["AA","MG","JB","TS"],
availability:{Sun:[],Mon:["09:00","17:00"],Tue:["09:00","17:00"],Wed:["09:00","17:00"],Thu:["09:00","17:00"],Fri:["09:00","17:00"],Sat:[]} },
{ id:"u3", name:"James Okafor", username:"james", password:"pass123", role:"user", allowOvertime:true,
trainedClients:["TS","MG","RK","DL"],
availability:{Sun:["10:00","18:00"],Mon:["10:00","18:00"],Tue:[],Wed:["10:00","18:00"],Thu:["10:00","18:00"],Fri:[],Sat:["10:00","18:00"]} },
{ id:"u4", name:"Priya Nair", username:"priya", password:"pass123", role:"user", allowOvertime:false,
trainedClients:["AA","TS","RK","CH"],
availability:{Sun:[],Mon:["07:00","15:00"],Tue:["07:00","15:00"],Wed:["07:00","15:00"],Thu:["07:00","15:00"],Fri:["07:00","15:00"],Sat:[]} },
{ id:"u5", name:"Devon Clarke", username:"devon", password:"pass123", role:"user", allowOvertime:false,
trainedClients:["JB","LM","PW","NB"],
availability:{Sun:[],Mon:["12:00","20:00"],Tue:["12:00","20:00"],Wed:[],Thu:["12:00","20:00"],Fri:["12:00","20:00"],Sat:["10:00","16:00"]} },
];

const SEED_SHIFTS = [
{id:"s1",userId:"u2",date:wd(1),start:"09:00",end:"17:00",client:"AA"},
{id:"s2",userId:"u2",date:wd(1),start:"09:00",end:"12:00",client:"MG"},
{id:"s3",userId:"u3",date:wd(1),start:"10:00",end:"16:00",client:"TS"},
{id:"s4",userId:"u4",date:wd(2),start:"07:00",end:"15:00",client:"RK"},
{id:"s5",userId:"u2",date:wd(3),start:"09:00",end:"13:00",client:"JB"},
{id:"s6",userId:"u5",date:wd(4),start:"12:00",end:"20:00",client:"LM"},
{id:"s7",userId:"u3",date:wd(5),start:"10:00",end:"18:00",client:"MG"},
{id:"s8",userId:"u4",date:wd(3),start:"07:00",end:"11:00",client:"AA"},
];

const SEED_TIMEOFF = [];

// — Styles —————————————————————––
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{color-scheme:light;}
:root{
–purple:#4a2d8f;
–purple-dark:#341f6b;
–purple-mid:#6b46c1;
–purple-light:#7c3aed;
–purple-bg:#f3f0fb;
–purple-border:#ddd6fe;
–gold:#c9a84c;
–gold-light:#e8c96a;
–gold-bg:#fdf8ec;
–gold-border:#f0d98a;
–lavender:#eeeaf7;
–white:#ffffff;
–bg:#f5f2fc;
–card:#ffffff;
–border:#e4ddf7;
–text:#1e1040;
–muted:#7b6fa0;
–red:#dc2626;
–red-bg:#fef2f2;
–green:#059669;
–green-bg:#ecfdf5;
–radius:14px;
–shadow:0 4px 24px rgba(74,45,143,.10);
–shadow-lg:0 12px 48px rgba(74,45,143,.18);
}
body{font-family:‘DM Sans’,sans-serif;background:var(–bg);color:var(–text);min-height:100vh;}

::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(–purple-border);border-radius:10px;}

/* Login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,#2a1657 0%,#4a2d8f 50%,#7c4fc0 100%);
padding:1rem;position:relative;overflow:hidden;}
.login-wrap::before{content:’’;position:absolute;inset:0;
background:radial-gradient(ellipse at 70% 20%,rgba(201,168,76,.15) 0%,transparent 60%),
radial-gradient(ellipse at 20% 80%,rgba(124,58,237,.3) 0%,transparent 50%);pointer-events:none;}
.login-card{background:white;border-radius:24px;padding:2.75rem 2.25rem;width:100%;max-width:420px;
box-shadow:0 40px 80px rgba(0,0,0,.5);position:relative;z-index:1;animation:fadeUp .4s ease;}
@keyframes fadeUp{from{transform:translateY(20px);opacity:0;}to{transform:none;opacity:1;}}
.login-brand{display:flex;align-items:center;gap:.875rem;margin-bottom:2rem;}
.login-brand-icon{width:64px;height:64px;background:linear-gradient(135deg,#4a2d8f,#6b46c1);
  border-radius:14px;display:flex;align-items:center;justify-content:center;
  font-family:'Montserrat',sans-serif;font-size:1.1rem;font-weight:700;color:white;
  box-shadow:0 6px 16px rgba(74,45,143,.35);}
.login-brand-text{font-family:'Montserrat',sans-serif;font-size:1rem;font-weight:700;color:#4a2d8f;line-height:1.2;}
.login-brand-text small{font-family:‘DM Sans’,sans-serif;font-size:.72rem;font-weight:500;color:#7b6fa0;display:block;}
.login-h{font-family:‘Montserrat’,sans-serif;font-size:1.6rem;font-weight:700;color:var(–text);margin-bottom:.3rem;}
.login-sub{color:#7b6fa0;font-size:.875rem;margin-bottom:1.75rem;}
.field{margin-bottom:1rem;}
.field label{display:block;font-size:.75rem;font-weight:600;color:var(–purple);margin-bottom:.4rem;letter-spacing:.06em;text-transform:uppercase;}
.field input,.field select{width:100%;padding:.7rem 1rem;border:none;border-radius:12px;
  font-family:'DM Sans',sans-serif;font-size:.9rem;color:#1e1040;background:#f3f0fb;
  transition:border .2s,background .2s;outline:none;}
.field input:focus,.field select:focus{border-color:var(–purple-mid);background:white;box-shadow:0 0 0 3px rgba(107,70,193,.1);}
.field input::placeholder{color:#7b6fa0;}
.error-msg{background:var(–red-bg);color:var(–red);padding:.65rem 1rem;border-radius:9px;
font-size:.84rem;font-weight:600;margin-bottom:1rem;border:1px solid #fecaca;}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:.4rem;padding:.6rem 1.1rem;border-radius:10px;
font-family:‘DM Sans’,sans-serif;font-size:.84rem;font-weight:600;cursor:pointer;border:none;
transition:all .15s;white-space:nowrap;}
.btn-primary{background:linear-gradient(135deg,#4a2d8f,#6b46c1);color:white;
  box-shadow:0 4px 14px rgba(74,45,143,.35);}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(74,45,143,.45);}
.btn-gold{background:linear-gradient(135deg,var(–gold),var(–gold-light));color:#3d2200;
box-shadow:0 4px 14px rgba(201,168,76,.3);}
.btn-gold:hover{transform:translateY(-1px);}
.btn-ghost{background:transparent;color:#7b6fa0;border:1.5px solid var(–border);}
.btn-ghost:hover{border-color:var(–purple-border);color:var(–purple);}
.btn-danger{background:var(–red-bg);color:var(–red);border:1px solid #fecaca;}
.btn-danger:hover{background:var(–red);color:white;}
.btn-sm{padding:.35rem .7rem;font-size:.77rem;border-radius:8px;}
.btn-full{width:100%;justify-content:center;padding:.85rem;font-size:.95rem;}

/* Layout */
.app{display:flex;height:100vh;overflow:hidden;}
.sidebar{width:230px;min-width:230px;background:linear-gradient(180deg,var(–purple-dark) 0%,var(–purple) 100%);
display:flex;flex-direction:column;overflow-y:auto;}
.sidebar-brand{padding:1.5rem 1.25rem 1.25rem;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:.5rem;}
.sidebar-brand-inner{display:flex;align-items:center;gap:.75rem;}
.sidebar-brand-icon{width:40px;height:40px;min-width:40px;background:linear-gradient(135deg,var(–gold),var(–gold-light));
border-radius:11px;display:flex;align-items:center;justify-content:center;
font-family:‘Montserrat’,sans-serif;font-size:.95rem;font-weight:700;color:var(–purple-dark);}
.sidebar-brand-name{font-family:‘Montserrat’,sans-serif;font-size:.9rem;font-weight:700;color:white;line-height:1.2;}
.sidebar-brand-name small{font-family:‘DM Sans’,sans-serif;font-size:.65rem;font-weight:400;color:rgba(255,255,255,.45);display:block;}
.nav-section{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
color:rgba(255,255,255,.3);padding:.875rem 1.25rem .3rem;}
.nav-item{display:flex;align-items:center;gap:.65rem;padding:.6rem 1.25rem;color:rgba(255,255,255,.65);
font-size:.84rem;font-weight:500;cursor:pointer;transition:all .15s;border-left:3px solid transparent;margin:.05rem 0;}
.nav-item:hover{background:rgba(255,255,255,.08);color:white;}
.nav-item.active{background:rgba(255,255,255,.12);color:white;border-left-color:var(–gold);}
.nav-icon{font-size:1rem;width:20px;text-align:center;flex-shrink:0;}
.sidebar-footer{margin-top:auto;padding:1.25rem;border-top:1px solid rgba(255,255,255,.1);}
.user-chip{display:flex;align-items:center;gap:.65rem;margin-bottom:.875rem;}
.avatar{width:34px;height:34px;min-width:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;
font-size:.78rem;font-weight:700;background:linear-gradient(135deg,var(–gold),var(–gold-light));color:var(–purple-dark);}
.user-chip-name{font-size:.8rem;font-weight:600;color:white;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.user-chip-role{font-size:.67rem;color:rgba(255,255,255,.45);text-transform:capitalize;}

/* Main */
.main{flex:1;overflow-y:auto;display:flex;flex-direction:column;}
.topbar{background:white;border-bottom:1px solid var(–border);padding:.875rem 1.5rem;
display:flex;align-items:center;gap:.875rem;position:sticky;top:0;z-index:20;
box-shadow:0 1px 0 var(–border);}
.topbar-title{font-family:‘Montserrat’,sans-serif;font-size:1.1rem;font-weight:700;color:var(–purple);flex:1;}
.page{padding:1.5rem;flex:1;}

/* Week nav */
.week-nav{display:flex;align-items:center;gap:.6rem;}
.week-label{font-size:.82rem;font-weight:600;color:var(–purple);min-width:150px;text-align:center;}

/* Stats row */
.stats-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:.875rem;margin-bottom:1.25rem;}
.stat-card{background:white;border:1.5px solid var(–border);border-radius:var(–radius);padding:1rem 1.1rem;
display:flex;flex-direction:column;gap:.2rem;}
.stat-head{display:flex;align-items:center;gap:.5rem;}
.stat-val{font-family:‘Montserrat’,sans-serif;font-size:1.6rem;font-weight:700;color:var(–purple);line-height:1;}
.stat-val.warn{color:var(–red);}
.stat-label{font-size:.7rem;font-weight:500;color:#7b6fa0;}

/* Schedule grid */
.sched-wrap{background:white;border:1.5px solid var(–border);border-radius:var(–radius);overflow:hidden;box-shadow:var(–shadow);}
.sched-grid{display:grid;grid-template-columns:130px repeat(7,1fr);min-width:900px;}
.sched-grid > *{border-right:1px solid var(–border);border-bottom:1px solid var(–border);}
.sched-grid > *:nth-child(8n){border-right:none;}
.grid-head{background:linear-gradient(135deg,var(–purple-dark),var(–purple));padding:.65rem .5rem;text-align:center;}
.grid-head-staff{background:linear-gradient(135deg,var(–purple-dark),var(–purple));display:flex;align-items:center;justify-content:center;}
.grid-head-label{font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5);}
.grid-head-day{font-size:.74rem;font-weight:700;color:white;text-transform:uppercase;letter-spacing:.05em;}
.grid-head-date{font-size:.7rem;color:rgba(255,255,255,.55);margin-top:.1rem;}
.grid-head.is-today{background:linear-gradient(135deg,var(–purple-mid),var(–purple-light));}
.grid-head-dot{width:5px;height:5px;background:var(–gold);border-radius:50%;margin:.25rem auto 0;}
.row-label{background:var(–lavender);padding:.6rem .75rem;display:flex;align-items:flex-start;gap:.5rem;min-height:95px;}
.row-label-inner{display:flex;align-items:center;gap:.5rem;}
.row-label .avatar{width:30px;height:30px;font-size:.72rem;}
.row-staff-name{font-size:.78rem;font-weight:700;color:var(–purple);line-height:1.2;}
.row-staff-hrs{font-size:.67rem;color:#7b6fa0;}
.row-staff-hrs.warn{color:var(–red);font-weight:700;}
.grid-cell{background:white;padding:.35rem;min-height:95px;transition:background .12s;position:relative;}
.grid-cell:hover{background:#faf8ff;}
.grid-cell.drag-over{background:var(–purple-bg);outline:2px dashed var(–purple-border);}
.grid-cell.today-col{background:#fffdf5;}

/* Shift pill */
.pill{border-radius:8px;padding:.28rem .5rem;margin-bottom:.22rem;cursor:grab;
font-size:.72rem;line-height:1.3;border:1.5px solid;transition:box-shadow .12s,transform .1s;
user-select:none;position:relative;}
.pill:active{cursor:grabbing;transform:scale(.96);}
.pill:hover{box-shadow:0 3px 12px rgba(74,45,143,.18);}
.pill-client{font-weight:800;font-size:.78rem;}
.pill-time{font-size:.66rem;opacity:.65;}
.pill-actions{display:none;position:absolute;top:3px;right:3px;gap:2px;}
.pill:hover .pill-actions{display:flex;}
.pill-btn{background:rgba(0,0,0,.1);border:none;border-radius:4px;width:18px;height:18px;
cursor:pointer;font-size:.62rem;display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,.5);}
.pill-btn:hover{background:rgba(0,0,0,.22);color:black;}
.add-btn{width:100%;border:1.5px dashed var(–border);border-radius:7px;background:transparent;
padding:.22rem;color:#7b6fa0;font-size:.68rem;cursor:pointer;
transition:all .15s;display:flex;align-items:center;justify-content:center;gap:.2rem;margin-top:.1rem;}
.add-btn:hover{border-color:var(–purple-mid);color:var(–purple);background:var(–purple-bg);}

/* Modal */
.overlay{position:fixed;inset:0;background:rgba(30,16,64,.5);display:flex;align-items:center;
justify-content:center;z-index:100;padding:1rem;backdrop-filter:blur(4px);}
.modal{background:white;border-radius:20px;padding:2rem 1.75rem;width:100%;max-width:480px;
box-shadow:var(–shadow-lg);animation:popIn .22s ease;}
@keyframes popIn{from{transform:scale(.92) translateY(12px);opacity:0;}to{transform:none;opacity:1;}}
.modal-title{font-family:‘Montserrat’,sans-serif;font-size:1.15rem;font-weight:700;color:var(–purple);
margin-bottom:1.25rem;display:flex;align-items:center;gap:.6rem;}
.modal-footer{display:flex;gap:.75rem;margin-top:1.5rem;justify-content:flex-end;flex-wrap:wrap;}
.modal-section{font-size:.72rem;font-weight:700;color:var(–purple);letter-spacing:.07em;
text-transform:uppercase;margin:.875rem 0 .5rem;padding-bottom:.3rem;border-bottom:1px solid var(–border);}

/* Staff cards */
.staff-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:1rem;}
.staff-card{background:white;border:1.5px solid var(–border);border-radius:var(–radius);
padding:1.25rem;transition:box-shadow .15s,border-color .15s;}
.staff-card:hover{box-shadow:var(–shadow);border-color:var(–purple-border);}
.staff-card-head{display:flex;align-items:center;gap:.75rem;margin-bottom:.875rem;}
.staff-card-head .avatar{width:44px;height:44px;font-size:1.05rem;}
.sc-name{font-family:‘Montserrat’,sans-serif;font-weight:700;color:var(–purple);font-size:.95rem;}
.sc-role{font-size:.69rem;font-weight:700;padding:.15rem .5rem;border-radius:20px;display:inline-block;margin-top:.15rem;}
.role-admin{background:var(–gold-bg);color:#6b3f00;border:1px solid var(–gold-border);}
.role-user{background:var(–purple-bg);color:var(–purple);border:1px solid var(–purple-border);}
.sc-label{font-size:.72rem;font-weight:700;color:var(–purple);margin-top:.75rem;margin-bottom:.35rem;}
.client-tags{display:flex;flex-wrap:wrap;gap:.3rem;}
.ctag{background:var(–purple-bg);color:var(–purple);font-size:.69rem;font-weight:700;
padding:.15rem .45rem;border-radius:6px;border:1px solid var(–purple-border);}
.avail-mini{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:.35rem;}
.avail-dot{height:28px;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;}
.avail-dot-label{font-size:.6rem;font-weight:700;color:#7b6fa0;}
.avail-dot-val{font-size:.55rem;font-weight:700;}
.avail-dot.has{background:var(–purple-bg);border:1px solid var(–purple-border);}
.avail-dot.has .avail-dot-label{color:var(–purple);}
.avail-dot.has .avail-dot-val{color:var(–purple-mid);}
.avail-dot.off{background:var(–bg);border:1px solid var(–border);}
.avail-dot.off .avail-dot-val{color:#7b6fa0;}
.overtime-badge{display:inline-block;margin-top:.5rem;font-size:.68rem;font-weight:700;
background:var(–gold-bg);color:#6b3f00;border:1px solid var(–gold-border);padding:.15rem .5rem;border-radius:20px;}

/* Tags */
.tag-opts{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem;}
.tag-opt{font-size:.72rem;padding:.18rem .5rem;border-radius:6px;border:1.5px solid var(–border);
cursor:pointer;background:white;transition:all .12s;font-weight:600;}
.tag-opt:hover{border-color:var(–purple-border);color:var(–purple);}
.tag-opt.on{background:var(–purple-bg);border-color:var(–purple-border);color:var(–purple);}

/* Toggle */
.toggle-row{display:flex;align-items:center;gap:.65rem;}
.toggle{position:relative;width:42px;height:23px;flex-shrink:0;}
.toggle input{opacity:0;width:0;height:0;}
.tslider{position:absolute;inset:0;background:var(–border);border-radius:23px;cursor:pointer;transition:.2s;}
.tslider::before{content:’’;position:absolute;width:17px;height:17px;left:3px;top:3px;
background:white;border-radius:50%;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.2);}
input:checked+.tslider{background:var(–purple-mid);}
input:checked+.tslider::before{transform:translateX(19px);}
.toggle-label{font-size:.82rem;font-weight:500;color:var(–text);}

/* Avail editor */
.avail-editor{display:grid;grid-template-columns:repeat(7,1fr);gap:.4rem;}
.avail-col{display:flex;flex-direction:column;gap:.3rem;}
.avail-col-head{font-size:.68rem;font-weight:700;color:var(–purple);text-align:center;text-transform:uppercase;letter-spacing:.05em;padding-bottom:.2rem;}
.avail-time{width:100%;font-size:.68rem;padding:.3rem .2rem;border:1.5px solid var(–border);
border-radius:6px;text-align:center;font-family:‘DM Sans’,sans-serif;color:var(–text);background:var(–bg);outline:none;}
.avail-time:focus{border-color:var(–purple-mid);}
.avail-off-btn{font-size:.62rem;padding:.2rem;border:none;background:var(–red-bg);color:var(–red);border-radius:5px;cursor:pointer;text-align:center;}
.avail-on-btn{font-size:.62rem;padding:.25rem;border:none;background:var(–purple-bg);color:var(–purple);border-radius:5px;cursor:pointer;text-align:center;}

/* Profile */
.profile-header{background:linear-gradient(135deg,var(–purple-dark),var(–purple));border-radius:var(–radius);
padding:1.75rem;margin-bottom:1.25rem;color:white;display:flex;align-items:center;gap:1.25rem;}
.profile-avatar{width:68px;height:68px;min-width:68px;border-radius:50%;background:linear-gradient(135deg,var(–gold),var(–gold-light));
display:flex;align-items:center;justify-content:center;font-family:‘Montserrat’,sans-serif;
font-size:1.5rem;font-weight:700;color:var(–purple-dark);box-shadow:0 4px 16px rgba(0,0,0,.2);}
.profile-name{font-family:‘Montserrat’,sans-serif;font-size:1.4rem;font-weight:700;margin-bottom:.2rem;}
.profile-role{font-size:.78rem;opacity:.7;}
.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
.pcard{background:white;border:1.5px solid var(–border);border-radius:var(–radius);padding:1.25rem;}
.pcard-title{font-family:‘Montserrat’,sans-serif;font-size:.9rem;font-weight:700;color:var(–purple);
margin-bottom:.875rem;display:flex;align-items:center;gap:.4rem;}
.hours-ring-wrap{display:flex;align-items:center;gap:1.25rem;}
.hours-ring{width:80px;height:80px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.ring-num{font-family:‘Montserrat’,sans-serif;font-size:1.5rem;font-weight:700;line-height:1;}
.ring-label{font-size:.6rem;font-weight:600;opacity:.6;}
.hours-info{flex:1;}
.hours-bar{height:8px;background:var(–border);border-radius:4px;overflow:hidden;margin:.3rem 0;}
.hours-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(–purple),var(–purple-mid));transition:width .4s;}
.hours-fill.warn{background:linear-gradient(90deg,#ef4444,#dc2626);}

@media(max-width:900px){
.sidebar{display:none;}
.sched-grid{grid-template-columns:80px repeat(7,1fr);}
.profile-grid{grid-template-columns:1fr;}
}
`;

// — Component: Login ———————————————————
function LoginScreen({ users, onLogin }) {
const [u, setU] = useState("");
const [p, setP] = useState("");
const [err, setErr] = useState("");
const submit = () => {
const found = users.find(x => x.username === u && x.password === p);
if (found) onLogin(found);
else setErr("Invalid username or password.");
};
return (
<div className="login-wrap">
<div className="login-card">
<div className="login-brand">
<div className="login-brand-icon">OI</div>
<div className="login-brand-text">Okanagan Inclusion<small>Staff Scheduler</small></div>
</div>
<h2 className="login-h">Welcome back</h2>
<p className="login-sub">Sign in to view your schedule</p>
{err && <div className="error-msg">⚠ {err}</div>}
<div className="field">
<label>Username</label>
<input value={u} onChange={e=>setU(e.target.value)} placeholder="Enter your username"
onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus />
</div>
<div className="field">
<label>Password</label>
<input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Enter your password"
onKeyDown={e=>e.key==="Enter"&&submit()} />
</div>
<button className="btn btn-primary btn-full" style={{marginTop:".5rem"}} onClick={submit}>Sign In</button>
<p style={{fontSize:".72rem",color:"#7b6fa0",marginTop:"1rem",textAlign:"center"}}>
Demo: <strong>admin</strong> / admin123  |  <strong>sarah</strong> / pass123
</p>
</div>
</div>
);
}

// — Component: ShiftCell —————————————————–
function ShiftCell({ shifts, date, userId, isAdmin, onDragStart, onDrop, onEdit, onAdd }) {
const [dragOver, setDragOver] = useState(false);
const todayStr = new Date().toISOString().split("T")[0];
return (
<div
className={`grid-cell ${dragOver?"drag-over":""} ${date===todayStr?"today-col":""}`}
onDragOver={e=>{ if(isAdmin){e.preventDefault();setDragOver(true);} }}
onDragLeave={()=>setDragOver(false)}
onDrop={()=>{ setDragOver(false); onDrop(userId, date); }}
>
{shifts.map(s => {
const ps = pillStyle(s.client);
return (
<div key={s.id} className="pill"
style={{background:ps.bg,borderColor:ps.border,color:ps.text}}
draggable={isAdmin}
onDragStart={()=>onDragStart(s.id)}>
<div className="pill-client">{s.client}</div>
<div className="pill-time">{fmtTime(s.start)}–{fmtTime(s.end)}</div>
{isAdmin && (
<div className="pill-actions">
<button className="pill-btn" onClick={e=>{e.stopPropagation();onEdit(s);}}>✎</button>
</div>
)}
</div>
);
})}
{isAdmin && <button className="add-btn" onClick={()=>onAdd()}>+ Add</button>}
</div>
);
}

// — Component: ShiftModal ––––––––––––––––––––––––––
function ShiftModal({ shift, users, shifts, weekDates, onSave, onDelete, onClose, isAdmin }) {
const isNew = !shift.id;
const staffUsers = users.filter(u => u.role === "user");
const [form, setForm] = useState({
id: shift.id||"",
userId: shift.userId || staffUsers[0]?.id || "",
date: shift.date || new Date().toISOString().split("T")[0],
start: shift.start || "09:00",
end: shift.end || "17:00",
client: shift.client || ALL_CLIENTS[0],
});
const selUser = users.find(u => u.id === form.userId);
const availableClients = selUser ? ALL_CLIENTS.filter(c => selUser.trainedClients.includes(c)) : ALL_CLIENTS;
const hrs = weeklyHours(shifts.filter(s=>s.id!==form.id), form.userId, weekDates) + calcUniqueHours([form]);
const over = selUser && !selUser.allowOvertime && hrs > 40;
const set = (k,v) => setForm(f=>({...f,[k]:v}));
return (
<div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal">
<div className="modal-title">{isNew ? "Add Shift" : "Edit Shift"}</div>
{isAdmin && (
<div className="field">
<label>Staff Member</label>
<select value={form.userId} onChange={e=>set("userId",e.target.value)}>
{staffUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
</select>
</div>
)}
<div className="field">
<label>Client (Initials)</label>
<select value={form.client} onChange={e=>set("client",e.target.value)}>
{(isAdmin ? ALL_CLIENTS : availableClients).map(c=>(
<option key={c} value={c}>{c}</option>
))}
</select>
{selUser && !selUser.trainedClients.includes(form.client) && (
<p style={{fontSize:".72rem",color:"var(–red)",marginTop:".25rem"}}>
Warning: {selUser.name} is not trained with this client
</p>
)}
</div>
<div className="field">
<label>Date</label>
<input type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem"}}>
<div className="field">
<label>Start Time</label>
<input type="time" value={form.start} onChange={e=>set("start",e.target.value)} />
</div>
<div className="field">
<label>End Time</label>
<input type="time" value={form.end} onChange={e=>set("end",e.target.value)} />
</div>
</div>
{over && (
<div className="error-msg">This shift puts {selUser?.name} over 40h this week ({hrs}h total). Overtime is not enabled.</div>
)}
{!over && selUser && (
<div style={{background:"var(–purple-bg)",border:"1px solid var(–purple-border)",borderRadius:"8px",padding:".5rem .75rem",fontSize:".76rem",color:"var(–purple)"}}>
Weekly total with this shift: <strong>{hrs}h</strong>
</div>
)}
<div className="modal-footer">
{!isNew && isAdmin && <button className="btn btn-danger btn-sm" onClick={()=>onDelete(form.id)}>Delete</button>}
<button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
<button className="btn btn-primary btn-sm" onClick={()=>onSave(form)} disabled={over}>
{isNew ? "Add Shift" : "Save Changes"}
</button>
</div>
</div>
</div>
);
}

// — Component: TimeOffModal –––––––––––––––––––––––––
function TimeOffModal({ currentUser, onSave, onClose }) {
const [form, setForm] = useState({ startDate:"", endDate:"", reason:"" });
const set = (k,v) => setForm(f=>({...f,[k]:v}));
return (
<div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal">
<div className="modal-title">Request Time Off</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem"}}>
<div className="field">
<label>Start Date</label>
<input type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} />
</div>
<div className="field">
<label>End Date</label>
<input type="date" value={form.endDate} onChange={e=>set("endDate",e.target.value)} />
</div>
</div>
<div className="field">
<label>Reason (optional)</label>
<input value={form.reason} onChange={e=>set("reason",e.target.value)} placeholder="e.g. vacation, medical..." />
</div>
<div className="modal-footer">
<button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
<button className="btn btn-primary btn-sm" onClick={()=>{
if(!form.startDate||!form.endDate){alert("Please select dates.");return;}
onSave({...form, userId:currentUser.id});
}}>Submit Request</button>
</div>
</div>
</div>
);
}

// — Component: TimeOffView —————————————————
function TimeOffView({ requests, setRequests, currentUser, users, isAdmin, onNew }) {
const mine = isAdmin ? requests : requests.filter(r=>r.userId===currentUser.id);
const pending = mine.filter(r=>r.status==="pending");
const decided = mine.filter(r=>r.status!=="pending");
const approve = (id) => setRequests(p=>p.map(r=>r.id===id?{...r,status:"approved"}:r));
const deny = (id) => setRequests(p=>p.map(r=>r.id===id?{...r,status:"denied"}:r));
const remove = (id) => setRequests(p=>p.filter(r=>r.id!==id));
const userName = (uid) => users.find(u=>u.id===uid)?.name || "Unknown";
const statusStyle = (s) => ({
pending:  {background:"var(–gold-bg)",color:"#6b3f00",border:"1px solid var(–gold-border)"},
approved: {background:"var(–green-bg)",color:"var(–green)",border:"1px solid #6ee7b7"},
denied:   {background:"var(–red-bg)",color:"var(–red)",border:"1px solid #fecaca"},
}[s]);

const Card = ({r}) => (
<div style={{background:"white",border:"1.5px solid var(–border)",borderRadius:"var(–radius)",padding:"1.1rem",display:"flex",flexDirection:"column",gap:".6rem"}}>
<div style={{display:"flex",alignItems:"center",gap:".75rem",flexWrap:"wrap"}}>
{isAdmin && (
<div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
<div className="avatar" style={{width:30,height:30,fontSize:".72rem"}}>{initials(userName(r.userId))}</div>
<span style={{fontWeight:700,fontSize:".85rem",color:"var(–purple)"}}>{userName(r.userId)}</span>
</div>
)}
<span style={{fontSize:".8rem",fontWeight:700,color:"var(–text)"}}>
{r.startDate}{r.startDate!==r.endDate&&` to ${r.endDate}`}
</span>
<span style={{fontSize:".72rem",fontWeight:700,padding:".15rem .5rem",borderRadius:"20px",...statusStyle(r.status)}}>
{r.status.charAt(0).toUpperCase()+r.status.slice(1)}
</span>
</div>
{r.reason && <div style={{fontSize:".8rem",color:"#7b6fa0",fontStyle:"italic"}}>"{r.reason}"</div>}
<div style={{display:"flex",gap:".5rem"}}>
{isAdmin && r.status==="pending" && (
<>
<button className="btn btn-sm" style={{background:"var(–green-bg)",color:"var(–green)",border:"1px solid #6ee7b7"}} onClick={()=>approve(r.id)}>Approve</button>
<button className="btn btn-danger btn-sm" onClick={()=>deny(r.id)}>Deny</button>
</>
)}
<button className="btn btn-ghost btn-sm" onClick={()=>remove(r.id)}>
{isAdmin ? "Delete" : "Cancel"}
</button>
</div>
</div>
);

return (
<div>
{!isAdmin && (
<div style={{marginBottom:"1.25rem"}}>
<button className="btn btn-primary" onClick={onNew}>+ New Request</button>
</div>
)}
{pending.length > 0 && (
<>
<div style={{fontFamily:"‘Montserrat’,sans-serif",fontSize:".9rem",fontWeight:700,color:"var(–purple)",marginBottom:".75rem"}}>
{isAdmin ? `Pending (${pending.length})` : "Pending"}
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:".875rem",marginBottom:"1.5rem"}}>
{pending.map(r=><Card key={r.id} r={r}/>)}
</div>
</>
)}
{decided.length > 0 && (
<>
<div style={{fontFamily:"‘Montserrat’,sans-serif",fontSize:".9rem",fontWeight:700,color:"var(–purple)",marginBottom:".75rem"}}>Past Requests</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:".875rem"}}>
{decided.map(r=><Card key={r.id} r={r}/>)}
</div>
</>
)}
{mine.length===0 && (
<div style={{textAlign:"center",padding:"3rem",color:"#7b6fa0",fontSize:".875rem"}}>
{isAdmin ? "No time off requests yet." : "You have not submitted any requests yet."}
</div>
)}
</div>
);
}

// — Component: UserModal —————————————————–
function UserModal({ user, onSave, onDelete, onClose }) {
const isNew = !user.id;
const [form, setForm] = useState({
id: user.id||"",
name: user.name||"",
username: user.username||"",
password: user.password||"",
role: user.role||"user",
allowOvertime: user.allowOvertime||false,
trainedClients: user.trainedClients||[],
availability: user.availability||{Sun:[],Mon:[],Tue:[],Wed:[],Thu:[],Fri:[],Sat:[]},
});
const set = (k,v) => setForm(f=>({...f,[k]:v}));
const toggleClient = (c) => {
set("trainedClients", form.trainedClients.includes(c)
? form.trainedClients.filter(x=>x!==c)
: [...form.trainedClients, c]);
};
const setAvail = (day, idx, val) => {
const arr = [...(form.availability[day]||[])];
arr[idx] = val;
set("availability", {...form.availability, [day]: arr});
};
const toggleDay = (day) => {
const has = form.availability[day]?.length > 0;
set("availability", {...form.availability, [day]: has ? [] : ["09:00","17:00"]});
};
return (
<div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal" style={{maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
<div className="modal-title">{isNew ? "Add Staff Member" : `Edit — ${form.name}`}</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem"}}>
<div className="field">
<label>Full Name</label>
<input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Jane Smith" />
</div>
<div className="field">
<label>Role</label>
<select value={form.role} onChange={e=>set("role",e.target.value)}>
<option value="user">Staff</option>
<option value="admin">Admin</option>
</select>
</div>
<div className="field">
<label>Username</label>
<input value={form.username} onChange={e=>set("username",e.target.value)} placeholder="jsmith" />
</div>
<div className="field">
<label>Password</label>
<input type="text" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="password" />
</div>
</div>
<div className="modal-section">Overtime</div>
<div className="toggle-row">
<label className="toggle">
<input type="checkbox" checked={form.allowOvertime} onChange={e=>set("allowOvertime",e.target.checked)} />
<span className="tslider"></span>
</label>
<span className="toggle-label">Allow over 40 hours/week</span>
</div>
<div className="modal-section">Trained Clients</div>
<p style={{fontSize:".75rem",color:"#7b6fa0",marginBottom:".5rem"}}>Select all clients this staff member is trained to support</p>
<div className="tag-opts">
{ALL_CLIENTS.map(c => (
<span key={c} className={`tag-opt ${form.trainedClients.includes(c)?"on":""}`}
onClick={()=>toggleClient(c)}>{c}</span>
))}
</div>
<div className="modal-section">Weekly Availability</div>
<p style={{fontSize:".75rem",color:"#7b6fa0",marginBottom:".75rem"}}>Click a day to toggle, then set hours</p>
<div className="avail-editor">
{DAYS.map(day => {
const has = form.availability[day]?.length > 0;
return (
<div key={day} className="avail-col">
<div className="avail-col-head">{day}</div>
{has ? (
<>
<input className="avail-time" type="time" value={form.availability[day][0]||"09:00"}
onChange={e=>setAvail(day,0,e.target.value)} />
<input className="avail-time" type="time" value={form.availability[day][1]||"17:00"}
onChange={e=>setAvail(day,1,e.target.value)} />
<button className="avail-off-btn" onClick={()=>toggleDay(day)}>Off</button>
</>
) : (
<button className="avail-on-btn" onClick={()=>toggleDay(day)}>+ On</button>
)}
</div>
);
})}
</div>
<div className="modal-footer">
{!isNew && <button className="btn btn-danger btn-sm" onClick={()=>onDelete(form.id)}>Delete</button>}
<button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
<button className="btn btn-primary btn-sm"
onClick={()=>{ if(!form.name||!form.username||!form.password){alert("Please fill all required fields.");return;} onSave(form); }}>
{isNew ? "Add Staff" : "Save Changes"}
</button>
</div>
</div>
</div>
);
}

// — Component: ProfileView —————————————————
function ProfileView({ user, shifts, weekDates, onEdit, isAdmin }) {
const hrs = weeklyHours(shifts, user.id, weekDates);
const max = user.allowOvertime ? 50 : 40;
const pct = Math.min((hrs/max)*100, 100);
const over = !user.allowOvertime && hrs > 40;
return (
<div>
<div className="profile-header">
<div className="profile-avatar">{initials(user.name)}</div>
<div style={{flex:1}}>
<div className="profile-name">{user.name}</div>
<div className="profile-role">{user.role==="admin" ? "Administrator" : "Support Staff"}</div>
<div style={{fontSize:".75rem",opacity:.6,marginTop:".2rem"}}>@{user.username}</div>
</div>
{isAdmin && <button className="btn btn-gold btn-sm" onClick={onEdit}>Edit Profile</button>}
</div>
<div className="profile-grid">
<div className="pcard">
<div className="pcard-title">Hours This Week</div>
<div className="hours-ring-wrap">
<div className="hours-ring" style={{background:over?"var(–red-bg)":"var(–purple-bg)"}}>
<div className="ring-num" style={{color:over?"var(–red)":"var(–purple)"}}>{hrs}</div>
<div className="ring-label" style={{color:over?"var(–red)":"#7b6fa0"}}>hrs</div>
</div>
<div className="hours-info">
<div style={{fontSize:".78rem",fontWeight:600,color:"var(–text)"}}>
{over ? "Over limit" : `${Math.max(0,max-hrs)}h remaining`}
</div>
<div className="hours-bar">
<div className={`hours-fill ${over?"warn":""}`} style={{width:`${pct}%`}}></div>
</div>
<div style={{fontSize:".7rem",color:"#7b6fa0"}}>
of {max}h {user.allowOvertime?"(overtime allowed)":"weekly limit"}
</div>
</div>
</div>
</div>
<div className="pcard">
<div className="pcard-title">Trained Clients</div>
<div className="client-tags">
{user.trainedClients.map(c=><span key={c} className="ctag">{c}</span>)}
{user.trainedClients.length===0 && <span style={{fontSize:".78rem",color:"#7b6fa0"}}>No clients assigned</span>}
</div>
</div>
<div className="pcard" style={{gridColumn:"1/-1"}}>
<div className="pcard-title">My Availability</div>
<div className="avail-mini">
{DAYS.map(day=>{
const has=user.availability?.[day]?.length>0;
return (
<div key={day} className={`avail-dot ${has?"has":"off"}`}>
<div className="avail-dot-label">{day[0]}</div>
<div className="avail-dot-val">{has?"✓":"–"}</div>
</div>
);
})}
</div>
{DAYS.filter(d=>user.availability?.[d]?.length>0).map(day=>(
<div key={day} style={{fontSize:".75rem",color:"#7b6fa0",marginTop:".4rem",display:"flex",gap:".5rem",alignItems:"center"}}>
<strong style={{color:"var(–purple)",width:30}}>{day}</strong>
{fmtTime(user.availability[day][0])} – {fmtTime(user.availability[day][1])}
</div>
))}
</div>
<div className="pcard" style={{gridColumn:"1/-1"}}>
<div className="pcard-title">This Week’s Shifts</div>
{weekDates.map(date=>{
const ds=date.toISOString().split("T")[0];
const dayShifts=shifts.filter(s=>s.userId===user.id&&s.date===ds);
if(!dayShifts.length) return null;
return (
<div key={ds} style={{marginBottom:".75rem"}}>
<div style={{fontSize:".75rem",fontWeight:700,color:"var(–purple)",marginBottom:".35rem"}}>
{DAYS[date.getDay()]} {fmtDate(date)}
<span style={{fontWeight:400,color:"#7b6fa0",marginLeft:".4rem"}}>({calcUniqueHours(dayShifts)}h)</span>
</div>
<div style={{display:"flex",flexWrap:"wrap",gap:".35rem"}}>
{dayShifts.map(s=>{
const ps=pillStyle(s.client);
return (
<div key={s.id} className="pill" style={{background:ps.bg,borderColor:ps.border,color:ps.text,cursor:"default",marginBottom:0}}>
<span className="pill-client">{s.client}</span>
<span className="pill-time" style={{marginLeft:".3rem"}}>{fmtTime(s.start)}–{fmtTime(s.end)}</span>
</div>
);
})}
</div>
</div>
);
})}
{shifts.filter(s=>s.userId===user.id&&weekDates.map(d=>d.toISOString().split("T")[0]).includes(s.date)).length===0 && (
<p style={{fontSize:".8rem",color:"#7b6fa0"}}>No shifts scheduled this week</p>
)}
</div>
</div>
</div>
);
}

// — Main App —————————————————————–
export default function App() {
const [users, setUsers] = useState(() => {
try { const s = localStorage.getItem("oki_users"); return s ? JSON.parse(s) : SEED_USERS; }
catch { return SEED_USERS; }
});
const [shifts, setShifts] = useState(() => {
try { const s = localStorage.getItem("oki_shifts"); return s ? JSON.parse(s) : SEED_SHIFTS; }
catch { return SEED_SHIFTS; }
});
const [timeOffRequests, setTimeOffRequests] = useState(() => {
try { const s = localStorage.getItem("oki_timeoff"); return s ? JSON.parse(s) : SEED_TIMEOFF; }
catch { return SEED_TIMEOFF; }
});
const [currentUser, setCurrentUser] = useState(() => {
try { const s = localStorage.getItem("oki_currentUser"); return s ? JSON.parse(s) : null; }
catch { return null; }
});

useEffect(() => { localStorage.setItem("oki_users", JSON.stringify(users)); }, [users]);
useEffect(() => { localStorage.setItem("oki_shifts", JSON.stringify(shifts)); }, [shifts]);
useEffect(() => { localStorage.setItem("oki_timeoff", JSON.stringify(timeOffRequests)); }, [timeOffRequests]);
useEffect(() => {
if (currentUser) localStorage.setItem("oki_currentUser", JSON.stringify(currentUser));
else localStorage.removeItem("oki_currentUser");
}, [currentUser]);

const [view, setView] = useState("schedule");
const [weekAnchor, setWeekAnchor] = useState(new Date());
const [modal, setModal] = useState(null);
const [dragShiftId, setDragShiftId] = useState(null);

const weekDates = getWeekDates(weekAnchor);
const isAdmin = currentUser?.role === "admin";

if (!currentUser) return (
<>
<style>{CSS}</style>
<LoginScreen users={users} onLogin={setCurrentUser} />
</>
);

const openModal = (type, data={}) => setModal({type, data});
const closeModal = () => setModal(null);

const saveShift = (s) => {
if (s.id) setShifts(prev=>prev.map(x=>x.id===s.id?s:x));
else setShifts(prev=>[...prev,{...s,id:genId()}]);
closeModal();
};
const deleteShift = (id) => { setShifts(p=>p.filter(x=>x.id!==id)); closeModal(); };

const saveUser = (u) => {
if (u.id) {
setUsers(p=>p.map(x=>x.id===u.id?u:x));
if (currentUser.id===u.id) setCurrentUser(u);
} else {
setUsers(p=>[...p,{...u,id:genId()}]);
}
closeModal();
};
const deleteUser = (id) => { setUsers(p=>p.filter(x=>x.id!==id)); closeModal(); };

const handleDrop = (userId, date) => {
if (!dragShiftId || !isAdmin) return;
setShifts(p=>p.map(x=>x.id===dragShiftId?{...x,userId,date}:x));
setDragShiftId(null);
};

const visibleStaff = isAdmin ? users.filter(u=>u.role==="user") : [currentUser];
const navItems = [
{id:"schedule", icon:"📅", label:"Schedule"},
...(isAdmin ? [{id:"staff", icon:"👥", label:"Staff"}] : []),
{id:"timeoff", icon:"🌿", label: isAdmin ? "Time Off Requests" : "Request Time Off"},
{id:"myprofile", icon:"👤", label:"My Profile"},
];

return (
<div className="app">
<style>{CSS}</style>


  <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="sidebar-brand-inner">
        <div className="sidebar-brand-icon">OI</div>
        <div className="sidebar-brand-name">Okanagan Inclusion<small>Staff Scheduler</small></div>
      </div>
    </div>
    <span className="nav-section">Menu</span>
    {navItems.map(n=>(
      <div key={n.id} className={`nav-item ${view===n.id?"active":""}`} onClick={()=>setView(n.id)}>
        <span className="nav-icon">{n.icon}</span>{n.label}
      </div>
    ))}
    <div className="sidebar-footer">
      <div className="user-chip">
        <div className="avatar">{initials(currentUser.name)}</div>
        <div>
          <div className="user-chip-name">{currentUser.name}</div>
          <div className="user-chip-role">{currentUser.role}</div>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" style={{width:"100%",justifyContent:"center"}}
        onClick={()=>{ setCurrentUser(null); setView("schedule"); }}>Sign Out</button>
    </div>
  </aside>

  <main className="main">
    <div className="topbar">
      <span className="topbar-title">
        {view==="schedule" && "Weekly Schedule"}
        {view==="staff" && "Staff Management"}
        {view==="timeoff" && (isAdmin ? "Time Off Requests" : "Request Time Off")}
        {view==="myprofile" && "My Profile"}
      </span>
      {view==="schedule" && (
        <div className="week-nav">
          <button className="btn btn-ghost btn-sm" onClick={()=>{const d=new Date(weekAnchor);d.setDate(d.getDate()-7);setWeekAnchor(d);}}>Prev</button>
          <span className="week-label">{fmtDate(weekDates[0])} – {fmtDate(weekDates[6])}</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>{const d=new Date(weekAnchor);d.setDate(d.getDate()+7);setWeekAnchor(d);}}>Next</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setWeekAnchor(new Date())}>Today</button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={()=>openModal("shift",{date:todayStr,userId:visibleStaff[0]?.id})}>+ Add Shift</button>}
        </div>
      )}
      {view==="staff" && isAdmin && (
        <button className="btn btn-primary btn-sm" onClick={()=>openModal("user",{})}>+ Add Staff</button>
      )}
      {view==="timeoff" && !isAdmin && (
        <button className="btn btn-primary btn-sm" onClick={()=>openModal("timeoff",{})}>+ New Request</button>
      )}
    </div>

    <div className="page">
      {/* Schedule */}
      {view==="schedule" && (
        <>
          <div className="stats-row">
            {visibleStaff.map(u=>{
              const hrs=weeklyHours(shifts,u.id,weekDates);
              const over=!u.allowOvertime&&hrs>40;
              return (
                <div key={u.id} className="stat-card">
                  <div className="stat-head">
                    <div className="avatar" style={{width:26,height:26,fontSize:".68rem"}}>{initials(u.name)}</div>
                    <span style={{fontSize:".76rem",fontWeight:600,color:"var(--purple)"}}>{u.name.split(" ")[0] || u.name}</span>
                  </div>
                  <div className={`stat-val ${over?"warn":""}`}>{hrs}<span style={{fontSize:".7rem",fontWeight:500,color:"#7b6fa0"}}>h</span></div>
                  <div className="stat-label" style={{color:over?"var(--red)":""}}>{over?"Over limit":"this week"}</div>
                </div>
              );
            })}
          </div>
          <div className="sched-wrap" style={{overflowX:"auto"}}>
            <div className="sched-grid">
              <div className="grid-head grid-head-staff"><div className="grid-head-label">Staff</div></div>
              {weekDates.map((d,i)=>{
                const ds=d.toISOString().split("T")[0];
                return (
                  <div key={i} className={`grid-head ${ds===todayStr?"is-today":""}`}>
                    <div className="grid-head-day">{DAYS[i]}</div>
                    <div className="grid-head-date">{fmtDate(d)}</div>
                    {ds===todayStr && <div className="grid-head-dot"></div>}
                  </div>
                );
              })}
              {visibleStaff.map(u=>{
                const hrs=weeklyHours(shifts,u.id,weekDates);
                const over=!u.allowOvertime&&hrs>40;
                return weekDates.map((d,di)=>{
                  const ds=d.toISOString().split("T")[0];
                  const cellShifts=shifts.filter(s=>s.userId===u.id&&s.date===ds);
                  if (di===0) return [
                    <div key={`lbl-${u.id}`} className="row-label">
                      <div className="row-label-inner">
                        <div className="avatar" style={{width:30,height:30,fontSize:".72rem"}}>{initials(u.name)}</div>
                        <div>
                          <div className="row-staff-name">{u.name.split(" ")[0] || u.name}</div>
                          <div className={`row-staff-hrs ${over?"warn":""}`}>{hrs}h</div>
                        </div>
                      </div>
                    </div>,
                    <ShiftCell key={`${u.id}-0`} shifts={cellShifts} date={ds} userId={u.id}
                      isAdmin={isAdmin} onDragStart={setDragShiftId} onDrop={handleDrop}
                      onEdit={s=>openModal("shift",s)} onAdd={()=>openModal("shift",{userId:u.id,date:ds})} />
                  ];
                  return (
                    <ShiftCell key={`${u.id}-${di}`} shifts={cellShifts} date={ds} userId={u.id}
                      isAdmin={isAdmin} onDragStart={setDragShiftId} onDrop={handleDrop}
                      onEdit={s=>openModal("shift",s)} onAdd={()=>openModal("shift",{userId:u.id,date:ds})} />
                  );
                });
              })}
            </div>
          </div>
        </>
      )}

      {/* Staff */}
      {view==="staff" && isAdmin && (
        <div className="staff-grid">
          {users.map(u=>(
            <div key={u.id} className="staff-card">
              <div className="staff-card-head">
                <div className="avatar" style={{width:44,height:44,fontSize:"1rem"}}>{initials(u.name)}</div>
                <div style={{flex:1}}>
                  <div className="sc-name">{u.name}</div>
                  <span className={`sc-role ${u.role==="admin"?"role-admin":"role-user"}`}>{u.role==="admin"?"Admin":"Staff"}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>openModal("user",{...u})}>Edit</button>
              </div>
              <div style={{fontSize:".72rem",color:"#7b6fa0",marginBottom:".5rem"}}>@{u.username}</div>
              <div className="sc-label">Trained Clients</div>
              <div className="client-tags">
                {u.trainedClients.map(c=><span key={c} className="ctag">{c}</span>)}
                {!u.trainedClients.length && <span style={{fontSize:".72rem",color:"#7b6fa0"}}>None assigned</span>}
              </div>
              <div className="sc-label">Availability</div>
              <div className="avail-mini">
                {DAYS.map(day=>{
                  const has=u.availability?.[day]?.length>0;
                  return (
                    <div key={day} className={`avail-dot ${has?"has":"off"}`}>
                      <div className="avail-dot-label">{day[0]}</div>
                      <div className="avail-dot-val">{has?"✓":"–"}</div>
                    </div>
                  );
                })}
              </div>
              {u.allowOvertime && <div className="overtime-badge">Overtime OK</div>}
            </div>
          ))}
        </div>
      )}

      {/* Time Off */}
      {view==="timeoff" && (
        <TimeOffView
          requests={timeOffRequests}
          setRequests={setTimeOffRequests}
          currentUser={currentUser}
          users={users}
          isAdmin={isAdmin}
          onNew={()=>openModal("timeoff",{})}
        />
      )}

      {/* Profile */}
      {view==="myprofile" && (
        <ProfileView user={currentUser} shifts={shifts} weekDates={weekDates}
          onEdit={()=>openModal("user",{...currentUser})} isAdmin={isAdmin} />
      )}
    </div>
  </main>

  {/* Modals */}
  {modal?.type==="shift" && (
    <ShiftModal shift={modal.data} users={users} shifts={shifts} weekDates={weekDates}
      onSave={saveShift} onDelete={deleteShift} onClose={closeModal}
      isAdmin={isAdmin} currentUser={currentUser} />
  )}
  {modal?.type==="timeoff" && (
    <TimeOffModal
      currentUser={currentUser}
      onSave={(req)=>{ setTimeOffRequests(p=>[...p,{...req,id:genId(),status:"pending",createdAt:new Date().toISOString()}]); closeModal(); }}
      onClose={closeModal}
    />
  )}
  {modal?.type==="user" && isAdmin && (
    <UserModal user={modal.data} onSave={saveUser} onDelete={deleteUser} onClose={closeModal} />
  )}
</div>


);
}