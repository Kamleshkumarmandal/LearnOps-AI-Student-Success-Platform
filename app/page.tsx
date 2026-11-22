"use client";

import { useMemo, useState } from "react";
import { calculateStudentRisk, prioritizeStudents, type StudentSignal, type StudentRisk } from "@/lib/analytics";

const seed: StudentSignal[] = [
  { id: "ST-2041", name: "Aarav Sharma", cohort: "2027", githubUsername: "aarav-builds", githubDaysSinceActivity: 1, commitsLast7Days: 12, openPullRequests: 2, failedChecks: 0, overdueTasks: 0, assessmentAverage: 91, projectProgress: 86 },
  { id: "ST-2038", name: "Meera Iyer", cohort: "2027", githubUsername: "meera-codes", githubDaysSinceActivity: 9, commitsLast7Days: 2, openPullRequests: 1, failedChecks: 1, overdueTasks: 1, assessmentAverage: 72, projectProgress: 58 },
  { id: "ST-2022", name: "Rohan Das", cohort: "2027", githubUsername: "rohancode", githubDaysSinceActivity: 17, commitsLast7Days: 0, openPullRequests: 0, failedChecks: 2, overdueTasks: 3, assessmentAverage: 54, projectProgress: 28 },
  { id: "ST-2054", name: "Ananya Rao", cohort: "2027", githubUsername: "ananya-dev", githubDaysSinceActivity: 2, commitsLast7Days: 8, openPullRequests: 3, failedChecks: 0, overdueTasks: 0, assessmentAverage: 84, projectProgress: 79 },
  { id: "ST-2017", name: "Kabir Nair", cohort: "2026", githubUsername: "kabir-labs", githubDaysSinceActivity: 12, commitsLast7Days: 1, openPullRequests: 0, failedChecks: 1, overdueTasks: 2, assessmentAverage: 68, projectProgress: 43 },
  { id: "ST-2060", name: "Ishita Sen", cohort: "2027", githubUsername: "ishita-creates", githubDaysSinceActivity: 0, commitsLast7Days: 15, openPullRequests: 1, failedChecks: 0, overdueTasks: 0, assessmentAverage: 94, projectProgress: 92 }
];

const feed = [
  { name: "Aarav Sharma", action: "opened a pull request", detail: "feature/auth-flow · learnops-api", time: "8 min ago", symbol: "↗", tone: "purple" },
  { name: "Meera Iyer", action: "assessment completed", detail: "Data Structures · 82 / 100", time: "32 min ago", symbol: "✓", tone: "green" },
  { name: "Ananya Rao", action: "project milestone reached", detail: "API integration · 80% complete", time: "1 hr ago", symbol: "◆", tone: "blue" },
  { name: "Kabir Nair", action: "CI check failed", detail: "unit-tests · 2 failing tests", time: "2 hrs ago", symbol: "!", tone: "orange" }
];

const path = [
  { title: "Programming foundations", week: "Week 01", complete: true },
  { title: "Data structures & algorithms", week: "Week 02", complete: true },
  { title: "Object-oriented design", week: "Week 03", complete: true },
  { title: "APIs & backend systems", week: "Week 04", complete: false },
  { title: "Concurrency & reliability", week: "Week 05", complete: false }
];

export default function Home() {
  const [students, setStudents] = useState<StudentSignal[]>(seed);
  const [nav, setNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [cohort, setCohort] = useState("All cohorts");
  const [filter, setFilter] = useState("All students");
  const [selected, setSelected] = useState<StudentRisk | null>(null);
  const [queue, setQueue] = useState<string[]>(["ST-2022"]);
  const [notice, setNotice] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const ranked = useMemo(() => prioritizeStudents(students), [students]);
  const visible = useMemo(() => ranked.filter((item) => {
    const q = search.toLowerCase();
    return (item.student.name.toLowerCase().includes(q) || item.student.githubUsername.toLowerCase().includes(q)) &&
      (cohort === "All cohorts" || item.student.cohort === cohort) &&
      (filter === "All students" || item.level === filter);
  }), [ranked, search, cohort, filter]);

  const supportCount = ranked.filter((item) => item.level === "Needs support").length;
  const onTrack = ranked.filter((item) => item.level === "On track").length;
  const averageProgress = Math.round(students.reduce((sum, s) => sum + s.projectProgress, 0) / Math.max(1, students.length));
  const averageAssessment = Math.round(students.reduce((sum, s) => sum + s.assessmentAverage, 0) / Math.max(1, students.length));

  function queueStudent(item: StudentRisk) {
    setQueue((current) => current.includes(item.student.id) ? current : [...current, item.student.id]);
    setNotice("Mentor follow-up queued for " + item.student.name + " in this local demo.");
  }

  function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const github = String(data.get("github") || "").trim();
    if (!name || !github) return;
    const student: StudentSignal = {
      id: "ST-" + String(Date.now()).slice(-5), name, githubUsername: github,
      cohort: String(data.get("cohort") || "2027"), githubDaysSinceActivity: 0,
      commitsLast7Days: 0, openPullRequests: 0, failedChecks: 0, overdueTasks: 0,
      assessmentAverage: 0, projectProgress: 0
    };
    setStudents((current) => [...current, student]);
    setShowAdd(false);
    setNotice(name + " added to this browser preview. Connect the database for persistence.");
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setNav("Overview")}><span className="brand-mark">l</span><span>learn<span>ops</span></span></a>
        <div className="workspace"><span>K</span><div><strong>Kamlesh&apos;s workspace</strong><small>Education · Demo</small></div><b>⌄</b></div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {[
            ["Overview", "▦"], ["Students", "♙"], ["Learning paths", "⌘"],
            ["Projects", "▤"], ["Mentor queue", "◎"], ["GitHub activity", "↗"]
          ].map(([label, icon]) => <button key={label} className={nav === label ? "nav-item active" : "nav-item"} onClick={() => setNav(label)}><span>{icon}</span>{label}{label === "Mentor queue" && queue.length > 0 && <i>{queue.length}</i>}</button>)}
        </nav>
        <p className="nav-label cohort-label">COHORTS <button onClick={() => setShowAdd(true)}>＋</button></p>
        <button className="cohort-link" onClick={() => { setCohort("2027"); setNav("Students"); }}><i className="dot violet" />Class of 2027 <small>18</small></button>
        <button className="cohort-link" onClick={() => { setCohort("2026"); setNav("Students"); }}><i className="dot blue" />Class of 2026 <small>12</small></button>
        <div className="sidebar-bottom"><div className="sidebar-note"><span>✳</span><strong>Outcome over activity</strong><p>Focus on meaningful progress, not vanity metrics.</p></div><div className="profile"><span>KM</span><div><strong>Kamlesh Mandal</strong><small>Workspace admin</small></div><b>···</b></div></div>
      </aside>

      <section className="main">
        <header className="topbar"><div>Workspace <span>/</span> <strong>{nav}</strong></div><div className="top-actions"><span className="sample"><i />Sample data</span><button onClick={() => setNotice("No new notifications.")}>♧</button><b>KM</b></div></header>
        <div className="content">
          <section className="welcome"><div><div className="eyebrow"><i />STUDENT SUCCESS WORKSPACE</div><h1>{nav === "Overview" ? <>Make progress <em>visible.</em></> : <>{nav}<em>.</em></>}</h1><p>One clear view of learning, engineering practice and the support that moves students forward.</p></div><div className="welcome-actions"><button className="secondary" onClick={() => setNotice("Report export is planned for the persistence milestone.")}>↧ Export report</button><button className="primary" onClick={() => setShowAdd(true)}>＋ Add student</button></div></section>

          {nav === "Learning paths" ? <section className="large-panel"><PanelHeading title="Engineering foundations" subtitle="Suggested prerequisite sequence for the 2027 cohort." badge="5 modules" /><div className="path-list">{path.map((item, index) => <div className="path-row" key={item.title}><span className={item.complete ? "check done" : "check"}>{item.complete ? "✓" : index + 1}</span><div><strong>{item.title}</strong><small>{item.week} · {item.complete ? "Completed" : "Upcoming"}</small></div><label>{item.complete ? "Done" : "Not started"}</label></div>)}</div><div className="algorithm-note"><strong>Prerequisite planner</strong><p>A topological-sort utility orders modules from prerequisite relationships and detects circular dependencies. Connect a curriculum dataset to use it here.</p></div></section>
          : nav === "Mentor queue" ? <section className="large-panel"><PanelHeading title="Prioritized mentor follow-ups" subtitle="Students ranked by explainable support signals." badge={queue.length + " queued"} />{ranked.filter((item) => queue.includes(item.student.id) || item.level !== "On track").map((item) => <div className="queue-row" key={item.student.id}><StudentIdentity student={item.student} /><RiskBadge level={item.level} /><span className="queue-reason">{item.reasons.slice(0,2).join(" · ") || "Routine progress review"}</span><button className="secondary" onClick={() => setSelected(item)}>View signals</button><button className="primary" disabled={queue.includes(item.student.id)} onClick={() => queueStudent(item)}>{queue.includes(item.student.id) ? "Queued ✓" : "Queue"}</button></div>)}</section>
          : nav === "Projects" || nav === "GitHub activity" ? <section className="large-panel"><PanelHeading title={nav === "Projects" ? "Project delivery pulse" : "Engineering activity feed"} subtitle="Recent sample repository, assessment and project signals." badge="Demo feed" />{feed.map((item, index) => <div className="feed-row" key={index}><span className={"feed-icon " + item.tone}>{item.symbol}</span><div><strong>{item.name} <span>{item.action}</span></strong><small>{item.detail}</small></div><time>{item.time}</time></div>)}<div className="algorithm-note"><strong>GitHub webhook integration</strong><p>Configure the webhook endpoint to ingest signed push, pull request, review and workflow events. Verified deliveries are stored once using GitHub&apos;s delivery ID.</p></div></section>
          : <><section className="metrics"><Metric title="Students in view" value={String(students.length)} hint="Active sample profiles" icon="♙" tone="violet" /><Metric title="On track" value={String(onTrack)} hint="Low support signals" icon="↗" tone="green" /><Metric title="Needs support" value={String(supportCount)} hint="Mentor attention recommended" icon="◎" tone="orange" /><Metric title="Avg. project progress" value={averageProgress + "%"} hint={"Assessment avg. " + averageAssessment + "%"} icon="◴" tone="blue" /></section>
            <section className="insight"><span>✳</span><div><strong>One actionable insight</strong><p>{supportCount > 0 ? supportCount + " student(s) show multiple support signals. Start with the highest-priority follow-up and agree on one achievable next step." : "Your current cohort has no high-priority support signals."}</p></div><button onClick={() => setNav("Mentor queue")}>Open mentor queue →</button></section>
            <section className="grid"><div className="panel students"><PanelHeading title="Student progress" subtitle="Transparent signals to guide mentor conversations." badge={String(visible.length)} /><div className="filters"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or GitHub username" /><select value={cohort} onChange={(e) => setCohort(e.target.value)}><option>All cohorts</option><option value="2027">Class of 2027</option><option value="2026">Class of 2026</option></select><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All students</option><option>On track</option><option>Watch</option><option>Needs support</option></select></div><div className="table-head"><span>STUDENT</span><span>PROJECT</span><span>ASSESSMENT</span><span>SUPPORT SIGNAL</span></div>{visible.map((item) => <button className="student-row" key={item.student.id} onClick={() => setSelected(item)}><StudentIdentity student={item.student} /><span className="progress"><strong>{item.student.projectProgress}%</strong><i><b style={{width: item.student.projectProgress + "%"}} /></i></span><span className="score">{item.student.assessmentAverage}%</span><RiskBadge level={item.level} /></button>)}{visible.length === 0 && <div className="empty">No students match those filters.</div>}<div className="panel-foot">Sorted by highest support score <button onClick={() => {setSearch("");setCohort("All cohorts");setFilter("All students");}}>Reset filters</button></div></div>
              <aside className="right"><div className="panel activity"><PanelHeading title="Recent activity" subtitle="Sample engineering signals" />{feed.slice(0,4).map((item,index) => <div className="mini-feed" key={index}><span className={"feed-icon " + item.tone}>{item.symbol}</span><div><strong>{item.name}</strong><p>{item.action}</p><small>{item.detail}</small></div><time>{item.time}</time></div>)}<button className="link" onClick={() => setNav("GitHub activity")}>View activity feed ↗</button></div><div className="panel roadmap"><PanelHeading title="Core foundations" subtitle="Learning roadmap" badge="Week 04" /><div className="roadmap-bar"><span>3 of 5 modules</span><strong>60%</strong><i><b /></i></div>{path.slice(0,4).map((item) => <div className="module" key={item.title}><span>{item.complete ? "✓" : "·"}</span>{item.title}</div>)}<button className="link" onClick={() => setNav("Learning paths")}>View learning path ↗</button></div></aside></section></>}
          <footer className="footer"><span>© 2026 LearnOps</span><span>Built around outcomes, ownership and continuous learning ✳</span><span>Privacy · Documentation · Help</span></footer>
        </div>
      </section>

      {selected && <div className="overlay" onMouseDown={(event) => {if(event.target===event.currentTarget)setSelected(null);}}><aside className="drawer"><div className="drawer-top"><span className="eyebrow">STUDENT PROFILE</span><button onClick={() => setSelected(null)}>×</button></div><div className="drawer-person"><StudentIdentity student={selected.student} /><RiskBadge level={selected.level} /></div><div className="risk-score"><span>Support signal score</span><strong>{selected.score}<small>/100</small></strong></div><h3>Signals to discuss</h3><ul>{selected.reasons.length ? selected.reasons.map((reason) => <li key={reason}>{reason}</li>) : <li>No elevated support signals in this sample.</li>}</ul><div className="recommendation"><b>RECOMMENDED NEXT STEP</b><p>{selected.recommendedAction}</p></div><div className="drawer-metrics"><span>Commits / 7 days<strong>{selected.student.commitsLast7Days}</strong></span><span>Assessment<strong>{selected.student.assessmentAverage}%</strong></span><span>Failed checks<strong>{selected.student.failedChecks}</strong></span><span>Overdue tasks<strong>{selected.student.overdueTasks}</strong></span></div><button className="primary full" onClick={() => {queueStudent(selected);setSelected(null);}}>＋ Queue mentor follow-up</button><small className="disclaimer">Demo heuristic only. Not a diagnosis or measure of student ability.</small></aside></div>}

      {showAdd && <div className="overlay centered" onMouseDown={(event) => {if(event.target===event.currentTarget)setShowAdd(false);}}><form className="modal" onSubmit={addStudent}><div className="drawer-top"><div><span className="eyebrow">COHORT MANAGEMENT</span><h2>Add a student</h2><p>Create a sample profile for this preview.</p></div><button type="button" onClick={() => setShowAdd(false)}>×</button></div><label>Student name<input name="name" required placeholder="e.g. Priya Nair" /></label><label>GitHub username<input name="github" required placeholder="e.g. priya-dev" /></label><label>Cohort<select name="cohort"><option value="2027">Class of 2027</option><option value="2026">Class of 2026</option></select></label><button className="primary full" type="submit">Add sample student</button><p className="disclaimer">Temporary browser state only. Connect Supabase for persistence.</p></form></div>}

      {notice && <div className="toast" role="status">✳ {notice}<button onClick={() => setNotice("")}>×</button></div>}
    </main>
  );
}

function PanelHeading({title,subtitle,badge}:{title:string;subtitle?:string;badge?:string}) {return <div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{badge && <span className="tag">{badge}</span>}</div>}
function StudentIdentity({student}:{student:StudentSignal}) {return <span className="identity"><b>{student.name.split(" ").map((n)=>n[0]).slice(0,2).join("")}</b><span><strong>{student.name}</strong><small>@{student.githubUsername}</small></span></span>}
function RiskBadge({level}:{level:StudentRisk["level"]}) {return <span className={"risk " + (level==="Needs support"?"high":level==="Watch"?"watch":"low")}><i />{level}</span>}
function Metric({title,value,hint,icon,tone}:{title:string;value:string;hint:string;icon:string;tone:string}) {return <div className="metric"><span className={"metric-icon "+tone}>{icon}</span><small>{title}</small><strong>{value}</strong><em>{hint}</em></div>}
