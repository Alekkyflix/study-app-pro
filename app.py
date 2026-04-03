# --- 1. START RECORDING PAGE ---
if selection == "🎙️ Start Recording":
    st.header("New Class Recording")
    
    col_name, col_timer = st.columns([2, 1])
    
    with col_name:
        name_input = st.text_input("Enter Class Name", "New Lecture")
    
    with col_timer:
        # --- LIVE STOPWATCH COMPONENT ---
        # This runs in the browser so it doesn't interrupt the Python script
        st.markdown("### ⏱️ Timer")
        st.components.v1.html("""
            <div id="stopwatch" style="
                font-family: 'Courier New', monospace; 
                font-size: 32px; 
                font-weight: bold;
                color: #ff4b4b; 
                background: #0e1117; 
                padding: 5px 15px; 
                border-radius: 10px; 
                border: 1px solid #31333f;
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
        """, height=70)

    st.write("---")
    
    # mic_recorder starts/stops and returns bytes when finished
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
