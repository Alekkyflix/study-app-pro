import streamlit as st
from streamlit_mic_recorder import mic_recorder
from faster_whisper import WhisperModel
import os
import sqlite3
from datetime import datetime
from PyPDF2 import PdfReader
from fpdf import FPDF
import streamlit.components.v1 as components

# --- 1. ENHANCED PDF GENERATOR (Supports UTF-8 characters better) ---
def create_pdf(title, text):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt=title, ln=1, align='C')
    pdf.ln(10)
    pdf.set_font("Arial", size=11)
    # Professional formatting: replace problematic characters
    clean_text = text.encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 7, txt=clean_text)
    return pdf.output(dest='S').encode('latin-1')

# --- CONFIG & DB SETUP ---
st.set_page_config(page_title="Class Master Pro", layout="wide", page_icon="🎓")

# Custom CSS for Professional Look
st.markdown("""
    <style>
    .main { background-color: #0e1117; }
    .stButton>button { width: 100%; border-radius: 5px; height: 3em; }
    .stExpander { border: 1px solid #31333F; border-radius: 10px; }
    </style>
    """, unsafe_allow_html=True)

if not os.path.exists("recordings"): 
    os.makedirs("recordings")

@st.cache_resource
def load_model():
    return WhisperModel("base", device="cpu", compute_type="int8")

model = load_model()

conn = sqlite3.connect('class_pro_v7.db', check_same_thread=False)
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS records 
             (id INTEGER PRIMARY KEY, type TEXT, class_name TEXT, file_path TEXT, 
              transcript TEXT, summary TEXT, date TEXT)''')
conn.commit()

# --- SIDEBAR ---
with st.sidebar:
    st.title("🎓 Study Pro AI")
    st.markdown("---")
    selection = st.radio("NAVIGATION", ["🎙️ Live Lecture", "📚 Archive Library", "📤 Audio Import", "📄 PDF Analyst"])
    st.markdown("---")
    st.status("AI Core: Online", state="running")

# --- 1. LIVE LECTURE (WITH SYNCED TIMER) ---
if selection == "🎙️ Live Lecture":
    st.header("Session Recorder")
    
    if 'recording_active' not in st.session_state:
        st.session_state.recording_active = False

    name_input = st.text_input("Lecture Topic / Course Code", "Lecture_Session")
    
    col_ctrl, col_timer = st.columns([1, 1])
    
    with col_ctrl:
        if not st.session_state.recording_active:
            if st.button("🚀 Initialize Session", type="primary"):
                st.session_state.recording_active = True
                st.rerun()
        else:
            if st.button("❌ Terminate Session"):
                st.session_state.recording_active = False
                st.rerun()

    with col_timer:
        if st.session_state.recording_active:
            components.html("""
                <div id="stopwatch" style="font-family:monospace; font-size:35px; color:#00ffcc; text-align:center; background:#1e1e1e; padding:10px; border-radius:10px; border:2px solid #00ffcc;">00:00:00</div>
                <script>
                    let s = 0;
                    setInterval(() => {
                        s++;
                        let h=Math.floor(s/3600); let m=Math.floor((s%3600)/60); let sec=s%60;
                        document.getElementById('stopwatch').innerText = (h<10?"0"+h:h)+":"+(m<10?"0"+m:m)+":"+(sec<10?"0"+sec:sec);
                    }, 1000);
                </script>
            """, height=100)
        else:
            st.info("Status: Ready to Record")

    if st.session_state.recording_active:
        audio_record = mic_recorder(start_prompt="Click to Start Audio", stop_prompt="Stop & Save Session", key='active_rec')
        
        if audio_record:
            save_path = os.path.join("recordings", f"{name_input}_{datetime.now().strftime('%Y%m%d_%H%M')}.mp3")
            with open(save_path, "wb") as f:
                f.write(audio_record['bytes'])
            
            c.execute("INSERT INTO records (type, class_name, file_path, transcript, summary, date) VALUES (?,?,?,?,?,?)",
                      ("Live", name_input, save_path, "", "", str(datetime.now())))
            conn.commit()
            st.session_state.recording_active = False
            st.success("Lecture Captured Successfully!")
            st.rerun()

# --- 2. ARCHIVE LIBRARY (FIXED IDS & PRO UI) ---
elif selection == "📚 Archive Library":
    st.header("Academic Archive")
    search = st.text_input("🔍 Search Lectures...", "")
    rows = c.execute("SELECT * FROM records WHERE class_name LIKE ? ORDER BY id DESC", ('%' + search + '%',)).fetchall()
    
    for row in rows:
        rid, rtype, rname, rpath, rtrans, rsum, rdate = row
        with st.expander(f"● {rtype} | {rname.upper()} | {rdate[:10]}"):
            if rpath != "N/A": st.audio(rpath)
            
            col1, col2, col3 = st.columns(3)
            
            if col1.button("📝 AI Transcribe", key=f"t_{rid}"):
                with st.spinner("Processing Audio..."):
                    segments, _ = model.transcribe(rpath)
                    full_text = " ".join([s.text for s in segments])
                    c.execute("UPDATE records SET transcript=? WHERE id=?", (full_text, rid))
                    conn.commit()
                    st.rerun()

            if col2.button("✨ Smart Summary", key=f"s_{rid}"):
                if rtrans:
                    summary = f"### KEY LEARNINGS: {rname}\n" + "\n".join([f"• {s}" for s in rtrans.split(". ")[:8] if len(s) > 30])
                    c.execute("UPDATE records SET summary=? WHERE id=?", (summary, rid))
                    conn.commit()
                    st.rerun()
                else: st.warning("Transcribe first.")

            if col3.button("🗑️ Purge Record", key=f"d_{rid}"):
                c.execute("DELETE FROM records WHERE id=?", (rid,))
                conn.commit()
                st.rerun()

            t_tab, s_tab = st.tabs(["📜 Detailed Transcript", "💡 Executive Summary"])
            with t_tab:
                if rtrans:
                    st.write(rtrans)
                    st.download_button("📥 Export Transcript (PDF)", create_pdf(f"Transcript: {rname}", rtrans), f"{rname}_T.pdf", key=f"dl_t_{rid}")
            with s_tab:
                if rsum:
                    st.markdown(rsum)
                    st.download_button("📥 Export Summary (PDF)", create_pdf(f"Summary: {rname}", rsum), f"{rname}_S.pdf", key=f"dl_s_{rid}")

# --- 3. AUDIO IMPORT ---
elif selection == "📤 Audio Import":
    st.header("External Import")
    up_file = st.file_uploader("Upload MP3/WAV", type=['mp3', 'wav'])
    if up_file and st.button("Process & Save"):
        save_path = os.path.join("recordings", up_file.name)
        with open(save_path, "wb") as f: f.write(up_file.read())
        c.execute("INSERT INTO records (type, class_name, file_path, transcript, summary, date) VALUES (?,?,?,?,?,?)",
                  ("Upload", up_file.name, save_path, "", "", str(datetime.now())))
        conn.commit()
        st.success("File added to Archive!")

# --- 4. PDF ANALYST ---
elif selection == "📄 PDF Analyst":
    st.header("Document Intelligence")
    pdf_file = st.file_uploader("Upload Lecture PDF", type=['pdf'])
    if pdf_file and st.button("Extract Knowledge"):
        reader = PdfReader(pdf_file)
        text = " ".join([p.extract_text() for p in reader.pages])
        summary = f"### PDF SUMMARY: {pdf_file.name}\n" + "\n".join([f"• {s}" for s in text.split(". ")[:12] if len(s)>40])
        c.execute("INSERT INTO records (type, class_name, file_path, transcript, summary, date) VALUES (?,?,?,?,?,?)",
                  ("PDF", pdf_file.name, "N/A", text, summary, str(datetime.now())))
        conn.commit()
        st.success("PDF knowledge extracted!")
