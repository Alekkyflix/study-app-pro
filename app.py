import streamlit as st
from streamlit_mic_recorder import mic_recorder
from faster_whisper import WhisperModel
import os
import sqlite3
from datetime import datetime
from PyPDF2 import PdfReader
from fpdf import FPDF
import streamlit.components.v1 as components

# --- 1. PDF GENERATOR HELPER ---
def create_pdf(title, text):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt=title, ln=1, align='C')
    pdf.ln(10)
    pdf.set_font("Arial", size=12)
    # Clean text for PDF encoding
    clean_text = text.encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 10, txt=clean_text)
    return pdf.output(dest='S').encode('latin-1')

# --- CONFIG & DB SETUP ---
st.set_page_config(page_title="Class Master Pro", layout="wide", page_icon="🎓")

if not os.path.exists("recordings"): 
    os.makedirs("recordings")

@st.cache_resource
def load_model():
    # 'base' is fast for local CPUs
    return WhisperModel("base", device="cpu", compute_type="int8")

model = load_model()

# Database Connection
conn = sqlite3.connect('class_pro_v6.db', check_same_thread=False)
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS records 
             (id INTEGER PRIMARY KEY, type TEXT, class_name TEXT, file_path TEXT, 
              transcript TEXT, summary TEXT, date TEXT)''')
conn.commit()

# --- SIDEBAR NAVIGATION ---
with st.sidebar:
    st.title("🎓 Study Pro")
    st.markdown("---")
    # This variable 'selection' MUST be defined here before being used below
    selection = st.radio("GO TO:", ["🎙️ Start Recording", "📚 Saved & Notes", "📤 Upload Audio", "📄 Upload PDF"])
    st.markdown("---")
    st.info("System: Local AI Engine Active")

# --- 1. START RECORDING PAGE ---
if selection == "🎙️ Start Recording":
    st.header("New Class Recording")
    
    col_name, col_timer = st.columns([2, 1])
    
    with col_name:
        name_input = st.text_input("Enter Class Name", "New Lecture")
    
    with col_timer:
        st.markdown("### ⏱️ Live Timer")
        components.html("""
            <div id="stopwatch" style="
                font-family: 'Courier New', monospace; 
                font-size: 30px; 
                font-weight: bold;
                color: #ff4b4b; 
                background: #0e1117; 
                padding: 10px; 
                border-radius: 10px; 
                border: 2px solid #31333f;
                text-align: center;
            ">00:00:00</div>
            <script>
                let seconds = 0;
                let display = document.getElementById('stopwatch');
                setInterval(() => {
                    seconds++;
                    let hrs = Math.floor(seconds / 3600);
                    let mins = Math.floor((seconds % 3600) / 60);
                    let secs = seconds % 60;
                    display.innerText = 
                        (hrs < 10 ? "0" + hrs : hrs) + ":" + 
                        (mins < 10 ? "0" + mins : mins) + ":" + 
                        (secs < 10 ? "0" + secs : secs);
                }, 1000);
            </script>
        """, height=100)

    st.write("---")
    audio_record = mic_recorder(
        start_prompt="🔴 Start Recording", 
        stop_prompt="⏹️ Stop and Save", 
        key='main_recorder'
    )

    if audio_record:
        timestamp = datetime.now().strftime('%H%M%S')
        file_name = f"{name_input.replace(' ', '_')}_{timestamp}.mp3"
        save_path = os.path.join("recordings", file_name)
        with open(save_path, "wb") as f:
            f.write(audio_record['bytes'])
        
        c.execute("INSERT INTO records (type, class_name, file_path, transcript, summary, date) VALUES (?,?,?,?,?,?)",
                  ("Live", name_input, save_path, "", "", str(datetime.now())))
        conn.commit()
        st.success(f"✅ Saved! Go to 'Saved & Notes' to process.")

# --- 2. SAVED & NOTES PAGE ---
elif selection == "📚 Saved & Notes":
    st.header("Your Library")
    search = st.text_input("🔍 Search by name...", "")
    
    rows = c.execute("SELECT * FROM records WHERE class_name LIKE ? ORDER BY id DESC", ('%' + search + '%',)).fetchall()
    
    if not rows:
        st.info("Your library is empty.")

    for row in rows:
        rid, rtype, rname, rpath, rtrans, rsum, rdate = row
        with st.expander(f"📁 {rname.upper()} | {rdate[:16]}"):
            if rpath != "N/A" and os.path.exists(rpath):
                st.audio(rpath)
            
            col_a, col_b, col_c = st.columns(3)
            
            if col_a.button(f"📝 Transcribe", key=f"t_{rid}"):
                with st.spinner("AI Transcribing..."):
                    segments, _ = model.transcribe(rpath)
                    full_text = " ".join([s.text for s in segments])
                    c.execute("UPDATE records SET transcript=? WHERE id=?", (full_text, rid))
                    conn.commit()
                    st.rerun()

            if col_b.button(f"✨ Summarize", key=f"s_{rid}"):
                if rtrans:
                    with st.spinner("Summarizing..."):
                        words = rtrans.split()
                        entities = list(set([w.strip(".,!") for w in words if len(w)>3 and w[0].isupper()]))
                        sentences = [s.strip() for s in rtrans.split(". ") if len(s) > 45]
                        
                        smart_notes = f"### 💡 TOPICS:\n" + ", ".join(entities[:15])
                        smart_notes += "\n\n### 📝 KEY POINTS:\n" + "\n".join([f"• {s}" for s in sentences[:10]])
                        
                        c.execute("UPDATE records SET summary=? WHERE id=?", (smart_notes, rid))
                        conn.commit()
                        st.rerun()
                else:
                    st.error("Transcribe first!")

            if col_c.button(f"🗑️ Delete", key=f"d_{rid}"):
                if rpath != "N/A" and os.path.exists(rpath): os.remove(rpath)
                c.execute("DELETE FROM records WHERE id=?", (rid,))
                conn.commit()
                st.rerun()

            tab_t, tab_s = st.tabs(["📜 Transcript", "💡 Summary"])
            with tab_t:
                if rtrans:
                    st.text_area("Full Text", rtrans, height=150, key=f"view_t_{rid}")
                    st.download_button("PDF", create_pdf("Transcript", rtrans), f"{rname}_T.pdf")
            with tab_s:
                if rsum:
                    st.markdown(rsum)
                    st.download_button("PDF", create_pdf("Summary", rsum), f"{rname}_S.pdf")

# --- 3. UPLOAD AUDIO ---
elif selection == "📤 Upload Audio":
    st.header("Upload Audio")
    up_name = st.text_input("Name", "Seminar")
    up_file = st.file_uploader("MP3/WAV", type=['mp3', 'wav'])
    if up_file and st.button("Save"):
        save_path = os.path.join("recordings", up_file.name)
        with open(save_path, "wb") as f: f.write(up_file.read())
        c.execute("INSERT INTO records (type, class_name, file_path, transcript, summary, date) VALUES (?,?,?,?,?,?)",
                  ("Upload", up_name, save_path, "", "", str(datetime.now())))
        conn.commit()
        st.success("Uploaded!")

# --- 4. UPLOAD PDF ---
elif selection == "📄 Upload PDF":
    st.header("Summarize PDF")
    pdf_file = st.file_uploader("PDF", type=['pdf'])
    if pdf_file and st.button("Analyze"):
        reader = PdfReader(pdf_file)
        text = "".join([p.extract_text() for p in reader.pages])
        summary = "### 📄 PDF SUMMARY\n" + "\n".join([f"• {s}" for s in text.split(". ")[:10] if len(s)>30])
        c.execute("INSERT INTO records (type, class_name, file_path, transcript, summary, date) VALUES (?,?,?,?,?,?)",
                  ("PDF", pdf_file.name, "N/A", text, summary, str(datetime.now())))
        conn.commit()
        st.success("Analyzed!")
