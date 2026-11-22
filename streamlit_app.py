from __future__ import annotations

import csv
import io
from datetime import datetime

import pandas as pd
import streamlit as st

from learnops_engine import LEARNING_PATH, SEED_STUDENTS, prioritize_students, order_learning_path

st.set_page_config(page_title="LearnOps | Student Success", page_icon="🎓", layout="wide")

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
html,body,[class*="css"]{font-family:'DM Sans',sans-serif}
.stApp{background:#f6f7fb;color:#1c2941}
[data-testid="stSidebar"]{background:#fff;border-right:1px solid #e9ecf2}
.brand{font:800 26px Manrope;letter-spacing:-1.3px;color:#1c2941;margin:2px 0 18px}
.brand span{color:#6759e8}
.eyebrow{color:#7164e8;font-size:10px;letter-spacing:1.5px;font-weight:800;margin-bottom:7px}
.hero{background:linear-gradient(112deg,#24204f,#39316f);border-radius:16px;padding:27px 30px;color:#fff;margin:5px 0 18px}
.hero h1{color:white;font:800 34px Manrope;letter-spacing:-1.7px;margin:0 0 7px}
.hero p{color:#d2ceef;font-size:13px;margin:0;max-width:670px;line-height:1.65}
.hero .tagline{color:#bdb5ff;font-size:10px;letter-spacing:1.5px;font-weight:700;margin-bottom:12px}
div[data-testid="stMetric"]{background:#fff;border:1px solid #e9ecf2;border-radius:12px;padding:14px 16px;box-shadow:0 3px 12px #14234108}
div[data-testid="stMetricLabel"]{color:#8792a5;font-size:11px}
div[data-testid="stMetricValue"]{color:#1d2941;font-family:Manrope;font-weight:800}
.section-title{font:800 20px Manrope;color:#202d47;letter-spacing:-.5px;margin:10px 0 3px}
.section-sub{color:#8994a6;font-size:11px;margin-bottom:13px}
.insight{background:#eeecff;border:1px solid #e4e0ff;border-radius:11px;padding:13px 16px;color:#554abf;font-size:12px;line-height:1.6;margin:10px 0 16px}
.profile-card{background:#fff;border:1px solid #e9ecf2;border-radius:12px;padding:13px 15px;margin-bottom:9px}
.profile-card strong{color:#25324b;font-size:13px}
.muted{color:#8b96a7;font-size:11px}
.risk-high{background:#fff0ee;color:#c65b4b;padding:4px 8px;border-radius:18px;font-size:10px;font-weight:700}
.risk-watch{background:#fff5e8;color:#b67a29;padding:4px 8px;border-radius:18px;font-size:10px;font-weight:700}
.risk-low{background:#eaf8f2;color:#278b67;padding:4px 8px;border-radius:18px;font-size:10px;font-weight:700}
.smallcaps{color:#9aa3b2;font-size:9px;letter-spacing:1.1px;font-weight:800}
.footer-note{color:#9aa3b2;font-size:10px;text-align:center;padding:22px 0 10px}
.stButton>button[kind="primary"]{background:#6759e8;border-color:#6759e8}
.stButton>button{border-radius:8px;font-weight:600}
div[data-testid="stDataFrame"]{border:1px solid #e9ecf2;border-radius:10px;overflow:hidden}
hr{border-color:#e9ecf2}
</style>
""", unsafe_allow_html=True)

if "students" not in st.session_state:
    st.session_state.students = [dict(student) for student in SEED_STUDENTS]
if "queued" not in st.session_state:
    st.session_state.queued = ["ST-2022"]
if "activity" not in st.session_state:
    st.session_state.activity = [
        {"student":"Aarav Sharma","event":"Pull request opened","detail":"feature/auth-flow · learnops-api","when":"8 min ago"},
        {"student":"Meera Iyer","event":"Assessment completed","detail":"Data Structures · 82 / 100","when":"32 min ago"},
        {"student":"Ananya Rao","event":"Project milestone reached","detail":"API integration · 80% complete","when":"1 hr ago"},
        {"student":"Kabir Nair","event":"CI check failed","detail":"unit-tests · 2 failing tests","when":"2 hrs ago"},
    ]

students = st.session_state.students
ranked = prioritize_students(students)
total = len(students)
on_track = sum(item["level"] == "On track" for item in ranked)
needs_support = sum(item["level"] == "Needs support" for item in ranked)
avg_progress = round(sum(int(s["progress"]) for s in students) / max(total, 1))
avg_assessment = round(sum(int(s["assessment"]) for s in students) / max(total, 1))

with st.sidebar:
    st.markdown('<div class="brand">learn<span>ops</span></div>', unsafe_allow_html=True)
    st.caption("KAMLESH'S WORKSPACE · DEMO")
    page = st.radio("WORKSPACE", ["Overview","Students","Mentor queue","Learning paths","GitHub activity"])
    st.divider()
    st.markdown("**COHORTS**")
    cohort_filter = st.selectbox("Select cohort", ["All cohorts","2027","2026"], label_visibility="collapsed")
    st.divider()
    if st.button("↻ Reset sample data", use_container_width=True):
        st.session_state.students = [dict(student) for student in SEED_STUDENTS]
        st.session_state.queued = ["ST-2022"]
        st.rerun()
    st.caption("Illustrative sample data. No real student records are connected.")

st.markdown('<div class="eyebrow">STUDENT SUCCESS WORKSPACE</div>', unsafe_allow_html=True)
st.markdown('<div class="hero"><div class="tagline">OUTCOMES · OWNERSHIP · CONTINUOUS LEARNING</div><h1>Make progress visible.</h1><p>One clear view of learning, engineering practice and the support that moves students forward. Use transparent signals to guide meaningful mentor conversations.</p></div>', unsafe_allow_html=True)

if page in ("Overview","Students"):
    st.markdown('<div class="section-title">Cohort health</div><div class="section-sub">A snapshot of learning progress and mentor support signals.</div>', unsafe_allow_html=True)
    m1,m2,m3,m4=st.columns(4)
    m1.metric("Students in view",total,"Sample profiles")
    m2.metric("On track",on_track,"Low support signals")
    m3.metric("Needs support",needs_support,"Review with a mentor")
    m4.metric("Avg. project progress",f"{avg_progress}%",f"Assessment avg. {avg_assessment}%")
    if needs_support:
        highest=next(item for item in ranked if item["level"]=="Needs support")
        st.markdown(f'<div class="insight"><b>✳ One actionable insight</b><br/>{needs_support} student(s) show multiple support signals. Start by reviewing <b>{highest["name"]}</b> with a human mentor and agreeing on one achievable next step.</div>',unsafe_allow_html=True)
    left,right=st.columns([1.65,1])
    with left:
        st.markdown('<div class="section-title">Student progress</div><div class="section-sub">Search learners, filter cohorts and inspect the evidence behind each support score.</div>',unsafe_allow_html=True)
        c1,c2=st.columns([1.4,1])
        query=c1.text_input("Search student or GitHub username",placeholder="e.g. Meera or aarav-builds",label_visibility="collapsed")
        risk_filter=c2.selectbox("Support level",["All students","On track","Watch","Needs support"],label_visibility="collapsed")
        filtered=[item for item in ranked if (cohort_filter=="All cohorts" or item["cohort"]==cohort_filter) and (risk_filter=="All students" or item["level"]==risk_filter) and (query.lower() in item["name"].lower() or query.lower() in item["github"].lower())]
        rows=[{"Student":i["name"],"GitHub":"@"+i["github"],"Cohort":i["cohort"],"Project":i["progress"],"Assessment":i["assessment"],"Support score":i["score"],"Support level":i["level"]} for i in filtered]
        st.dataframe(pd.DataFrame(rows),use_container_width=True,hide_index=True,column_config={"Project":st.column_config.ProgressColumn("Project",min_value=0,max_value=100,format="%d%%"),"Assessment":st.column_config.ProgressColumn("Assessment",min_value=0,max_value=100,format="%d%%"),"Support score":st.column_config.ProgressColumn("Support score",min_value=0,max_value=100)})
        if filtered:
            chosen=st.selectbox("Inspect learner",[item["id"] for item in filtered],format_func=lambda key:next(x["name"] for x in filtered if x["id"]==key))
            selected=next(item for item in filtered if item["id"]==chosen)
            with st.expander("View learner signals and recommended action"):
                st.markdown(f"**{selected['name']}** · @{selected['github']} · Class of {selected['cohort']}")
                st.progress(selected["score"]/100,text=f"Support signal score: {selected['score']}/100 · {selected['level']}")
                if selected["reasons"]:
                    for reason in selected["reasons"]:
                        st.write("• "+reason)
                else:
                    st.success("No elevated support signals in this sample.")
                st.info(selected["recommended_action"])
                if st.button("＋ Queue mentor follow-up",key="queue-"+selected["id"],type="primary"):
                    if selected["id"] not in st.session_state.queued:
                        st.session_state.queued.append(selected["id"])
                    st.success("Follow-up added to this demo queue.")
        else:
            st.info("No students match the selected filters.")
    with right:
        st.markdown('<div class="section-title">Progress pulse</div>',unsafe_allow_html=True)
        chart=pd.DataFrame([{"Student":item["name"].split()[0],"Progress":item["progress"]} for item in ranked])
        st.bar_chart(chart.set_index("Student"),y="Progress",color="#7669ec")
        st.markdown('<div class="section-title">Recent activity</div>',unsafe_allow_html=True)
        for event in st.session_state.activity[:4]:
            st.markdown(f'<div class="profile-card"><strong>{event["student"]}</strong><br/><span class="muted">{event["event"]} · {event["when"]}</span><br/><span class="muted">{event["detail"]}</span></div>',unsafe_allow_html=True)
    if page=="Overview":
        st.markdown('<div class="section-title">Mentor attention</div>',unsafe_allow_html=True)
        for item in ranked[:3]:
            badge="risk-high" if item["level"]=="Needs support" else "risk-watch" if item["level"]=="Watch" else "risk-low"
            st.markdown(f'<div class="profile-card"><strong>{item["name"]}</strong> <span class="{badge}">{item["level"]}</span><br/><span class="muted">{item["recommended_action"]}</span></div>',unsafe_allow_html=True)

elif page=="Mentor queue":
    st.markdown('<div class="section-title">Prioritized mentor follow-ups</div><div class="section-sub">Higher support signal scores appear first. Mentors review context before acting.</div>',unsafe_allow_html=True)
    queue_items=[item for item in ranked if item["id"] in st.session_state.queued or item["level"]!="On track"]
    if not queue_items:
        st.success("No mentor follow-ups are currently queued.")
    for item in queue_items:
        with st.container(border=True):
            c1,c2,c3=st.columns([1.2,2,1])
            c1.markdown(f"**{item['name']}**\\n\\n{item['id']} · Class of {item['cohort']}")
            c2.markdown(f"**{item['level']} · Score {item['score']}/100**")
            c2.write(" · ".join(item["reasons"]) if item["reasons"] else "Routine progress review")
            if item["id"] in st.session_state.queued:
                c3.success("Queued")
            elif c3.button("Queue follow-up",key="queue-"+item["id"]):
                st.session_state.queued.append(item["id"])
                st.rerun()
            with st.expander("Recommended next step"):
                st.write(item["recommended_action"])
    st.caption("Support scores are advisory demo heuristics, not a diagnosis or measure of student ability.")

elif page=="Learning paths":
    st.markdown('<div class="section-title">Engineering foundations</div><div class="section-sub">A prerequisite-aware path covering core capabilities in the role brief.</div>',unsafe_allow_html=True)
    order=order_learning_path(LEARNING_PATH)
    modules={module["id"]:module for module in LEARNING_PATH}
    completed=sum(bool(module["complete"]) for module in LEARNING_PATH)
    st.progress(completed/len(LEARNING_PATH),text=f"{completed} of {len(LEARNING_PATH)} modules complete")
    for index,module_id in enumerate(order,start=1):
        module=modules[module_id]
        with st.container(border=True):
            c1,c2,c3=st.columns([0.15,2,.7])
            c1.markdown("✅" if module["complete"] else f"**{index:02d}**")
            c2.markdown(f"**{module['title']}**\\n\\n{module['week']}")
            if module["complete"]:
                c3.success("Completed")
            else:
                c3.info("Upcoming")
    st.info("The Python engine uses Kahn's topological sort (O(V + E)) to validate prerequisite order and detect cycles.")

elif page=="GitHub activity":
    st.markdown('<div class="section-title">Engineering activity feed</div><div class="section-sub">Sample activity now; signed GitHub webhook ingestion is scaffolded in the Next.js app.</div>',unsafe_allow_html=True)
    for event in st.session_state.activity:
        with st.container(border=True):
            c1,c2=st.columns([1,4])
            c1.caption(event["when"])
            c2.markdown(f"**{event['student']}** — {event['event']}\\n\\n{event['detail']}")
    with st.expander("Integration architecture"):
        st.code("GitHub webhook → HMAC signature check → delivery ID idempotency → event inbox → student mapping → activity metrics",language="text")
        st.write("Configure the existing Next.js webhook endpoint and Supabase secrets for real event storage. Streamlit currently presents sample activity only.")

st.divider()
st.markdown('<div class="smallcaps">ADD A LEARNER TO THIS DEMO</div>',unsafe_allow_html=True)
with st.form("add_student_form",clear_on_submit=True):
    a,b,c=st.columns([1.4,1.2,.8])
    name=a.text_input("Student name",placeholder="e.g. Priya Nair")
    github=b.text_input("GitHub username",placeholder="e.g. priya-dev")
    new_cohort=c.selectbox("Cohort",["2027","2026"])
    submitted=st.form_submit_button("＋ Add student",type="primary")
    if submitted:
        if not name.strip() or not github.strip():
            st.error("Enter both a name and a GitHub username.")
        elif any(s["github"].lower()==github.strip().lower() for s in st.session_state.students):
            st.warning("That GitHub username is already in this demo.")
        else:
            st.session_state.students.append({"id":"ST-"+str(int(datetime.now().timestamp()))[-5:],"name":name.strip(),"cohort":new_cohort,"github":github.strip(),"days_since_activity":0,"commits_7d":0,"open_prs":0,"failed_checks":0,"overdue_tasks":0,"assessment":0,"progress":0})
            st.session_state.activity.insert(0,{"student":name.strip(),"event":"Learner profile added","detail":"Added to the local demo workspace","when":"Just now"})
            st.success("Student added to the local demo.")
            st.rerun()

buffer=io.StringIO()
writer=csv.DictWriter(buffer,fieldnames=["id","name","cohort","github","score","level","progress","assessment"])
writer.writeheader()
for item in ranked:
    writer.writerow({key:item.get(key) for key in writer.fieldnames})
st.download_button("⬇ Download cohort report (CSV)",buffer.getvalue(),"learnops-cohort-report.csv","text/csv")
st.markdown('<div class="footer-note">LearnOps · Independent portfolio demo · Sample data only · Support scores are explainable triage signals for human review.</div>',unsafe_allow_html=True)
