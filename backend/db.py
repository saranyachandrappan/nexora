import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'campus_docs.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_reseed=False):
    conn = get_db_connection()
    cursor = conn.cursor()

    if force_reseed:
        cursor.execute('DROP TABLE IF EXISTS document_chunks')
        cursor.execute('DROP TABLE IF EXISTS documents')
        cursor.execute('DROP TABLE IF EXISTS chat_history')
        cursor.execute('DROP TABLE IF EXISTS feedback')
        cursor.execute('DROP TABLE IF EXISTS unanswered_queries')
        cursor.execute('DROP TABLE IF EXISTS search_analytics')
        cursor.execute('DROP TABLE IF EXISTS settings')
        conn.commit()

    # Documents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            department TEXT NOT NULL,
            doc_type TEXT NOT NULL DEFAULT 'circular', -- 'circular', 'regulation', 'timetable', 'notice'
            year_regulation TEXT DEFAULT 'R2021', -- e.g. R2021, 2026-2027
            access_level TEXT NOT NULL DEFAULT 'all', -- 'all', 'student', 'staff', 'admin'
            effective_date TEXT,
            urgency TEXT DEFAULT 'normal', -- 'normal', 'urgent'
            file_path TEXT,
            raw_text TEXT NOT NULL,
            chunk_count INTEGER DEFAULT 0,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Document chunks for vector / semantic retrieval
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS document_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            chunk_index INTEGER NOT NULL,
            page_number INTEGER DEFAULT 1,
            content TEXT NOT NULL,
            metadata_json TEXT,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
        )
    ''')

    # Chat history
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_role TEXT NOT NULL DEFAULT 'student',
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            intent TEXT DEFAULT 'general',
            sources_json TEXT,
            confidence REAL DEFAULT 0.0,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Feedback rating table (👍 / 👎)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            question TEXT NOT NULL,
            rating TEXT NOT NULL, -- 'up' or 'down'
            comment TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Unanswered queries log for review
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS unanswered_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            user_role TEXT DEFAULT 'student',
            department TEXT DEFAULT 'General',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Search audit & analytics
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            user_role TEXT NOT NULL DEFAULT 'student',
            category TEXT DEFAULT 'all',
            matched_count INTEGER DEFAULT 0,
            top_similarity REAL DEFAULT 0.0,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')

    conn.commit()

    cursor.execute('SELECT COUNT(*) FROM documents')
    count = cursor.fetchone()[0]
    if count == 0:
        seed_aec_salem_data(conn)

    conn.close()

def seed_aec_salem_data(conn):
    cursor = conn.cursor()

    sample_docs = [
        {
            "title": "Anna University B.E./B.Tech Academic Regulations R-2021",
            "filename": "aec_anna_univ_regulations_2026.txt",
            "file_type": "text/plain",
            "department": "Academic Affairs",
            "doc_type": "regulation",
            "year_regulation": "R-2021",
            "access_level": "all",
            "effective_date": "2026-08-01",
            "urgency": "normal",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE (AEC), SALEM
(Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai)
NH-47 Sankari Main Road, Periaseeragapadi, Salem - 636308, Tamil Nadu

OFFICIAL ACADEMIC NOTIFICATION: ANNA UNIVERSITY B.E./B.TECH REGULATIONS (R-2021) & BY-LAWS

1. ATTENDANCE CRITERIA & CONDONATION (CLAUSE 6.0):
- Regular Attendance Requirement: Every student shall maintain an overall attendance of not less than 75% in all courses taken together in the current semester to be eligible to appear for the Anna University End Semester Examinations.
- Medical Condonation (Shortage of Attendance): A candidate whose overall semester attendance falls between 65% and 74% on grounds of severe illness or hospitalization certified by a registered Medical Practitioner, or participation in University/Zonal sports, cultural meets, or NSS/YRC camps approved by the Principal, may be granted condonation.
- Condonation Processing Fee: A fee of INR 750/- must be remitted at the AEC Accounts Office along with medical certificate verification and Principal's approval before the exam registration deadline.
- Below 65% (Lack of Attendance - Redo): Candidates having attendance strictly less than 65% are NOT eligible to write the semester examinations. They will be marked as 'Detained due to Lack of Attendance' (Prevented) and must re-enroll and repeat the entire semester when offered next.

--- Page 2 ---
2. CONTINUOUS INTERNAL ASSESSMENT (CIA) & ANNA UNIVERSITY EXAMS:
- Theory Courses: 40% Continuous Internal Assessment (CIA) + 60% End Semester Examination (ESE).
- CIA Components:
  * Internal Assessment Test 1 (IAT-1): 15 marks
  * Internal Assessment Test 2 (IAT-2): 15 marks
  * Assignments, Seminars & Naan Mudhalvan skill module: 10 marks
- Passing Minimum: A candidate must secure a minimum of 45% in the Anna University End Semester Examination and 50% in aggregate (CIA + ESE combined) to obtain a pass.

3. 10-POINT LETTER GRADING & REVALUATION RULES:
- Letter Grades: O (Outstanding: 91-100), A+ (Excellent: 81-90), A (Very Good: 71-80), B+ (Good: 61-70), B (Average: 50-60), RA (Re-Appearance/Arrear: <50), SA (Shortage of Attendance), W (Withdrawal).
- Supplementary / Arrear: Students with RA grade can re-appear in subsequent semester examination cycles without attending regular classes.
- Anna University Revaluation & Answer Script Photocopy: Within 10 days of results publication on the AU COE portal, students can apply for photocopy of answer scripts (INR 500/- per script) and revaluation (INR 800/- per subject) through the AEC Exam Cell."""
        },
        {
            "title": "Circular #AEC/ADM/2026/042: Odd Semester Tuition Fee, Bus & Hostel Remittance",
            "filename": "aec_fee_circular_2026.txt",
            "file_type": "text/plain",
            "department": "Finance & Accounts",
            "doc_type": "circular",
            "year_regulation": "2026-2027",
            "access_level": "all",
            "effective_date": "2026-09-12",
            "urgency": "urgent",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE, SALEM
OFFICE OF THE PRINCIPAL & ADMINISTRATIVE OFFICER
CIRCULAR NO: AEC/ADM/2026-27/042
DATE: SEPTEMBER 12, 2026
SUBJECT: TUITION FEE PAYMENT SCHEDULE, GOVERNMENT SCHOLARSHIPS & BUS PASS RENEWAL (ODD SEM 2026-2027)

1. TUITION & AMENITIES FEE PAYMENT DATES:
All students of 2nd, 3rd, and 4th Year B.E. (CSE, AI&DS, ECE, EEE, Mech, Civil, BME) are directed to remit their odd semester tuition and college fees in accordance with the schedule below:
- Standard Payment Period (Without Fine): September 15, 2026 to October 25, 2026.
- Late Payment with Fine: October 26, 2026 to November 05, 2026 (Late fine of INR 100/- per day will be levied).
- Defaulter Clause: Students failing to pay before November 05, 2026 will not receive exam hall tickets and will face portal deactivation.
- Payment Channels: Online via AEC Student ERP Portal / State Bank of India (SB Collect) / Indian Bank payment link. Cash payments are accepted exclusively at the Accounts Section, Main Admin Block between 09:30 AM and 03:30 PM.

--- Page 2 ---
2. GOVERNMENT CONCESSIONS & MERIT SCHOLARSHIPS:
- Tamil Nadu Government First Graduate (FG) Concession: Eligible students who secured admission under the First Graduate quota must submit their updated Tahsildar FG Certificate and parent income declaration at Room 102 by October 15, 2026 to claim their tuition fee waiver.
- SC/ST/SCA & Post-Matric Scholarship: Eligible students must submit biometric Aadhaar authentication and bank passbook copies at the AEC Scholarship Facilitation Desk (Admin Block) before October 20, 2026.
- AEC Institutional Merit Scholarship: Top 2 rank holders in each branch who maintain 8.5+ CGPA receive a 40% tuition fee scholarship sponsored by the management."""
        },
        {
            "title": "AEC Odd Semester 2026-27 Master Examination Timetable & Hall Allocations",
            "filename": "aec_exam_timetable_2026.txt",
            "file_type": "text/plain",
            "department": "Examination Cell",
            "doc_type": "timetable",
            "year_regulation": "2026-2027",
            "access_level": "all",
            "effective_date": "2026-10-01",
            "urgency": "urgent",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE, SALEM
OFFICE OF THE CONTROLLER OF EXAMINATIONS
MASTER END SEMESTER TIMETABLE (ODD SEM 2026-2027)

| Date | Session | Department | Course Code & Title | Hall Allocation |
|---|---|---|---|---|
| 10-11-2026 | FN (10:00 AM - 01:00 PM) | CSE / AI&DS | CS3491 Cryptography and Network Security | Admin Block H-101 to H-105 |
| 10-11-2026 | AN (02:00 PM - 05:00 PM) | ECE | EC3451 Linear Integrated Circuits | Tech Block T-201 to T-204 |
| 12-11-2026 | FN (10:00 AM - 01:00 PM) | CSE | CS3451 Distributed Systems | Admin Block H-101 to H-105 |
| 12-11-2026 | FN (10:00 AM - 01:00 PM) | MECH | ME3491 Theory of Machines | Mechanical Block M-101 |
| 14-11-2026 | FN (10:00 AM - 01:00 PM) | All Depts | GE3451 Environmental Sciences and Sustainability | All Exam Halls |

--- Page 2 ---
EXAMINATION HALL RULES:
- Reporting time: FN session 09:40 AM, AN session 01:40 PM.
- Mandatory documents: Anna University Hall Ticket and College ID Card.
- Prohibited: Mobile phones, smartwatches, programmable calculators."""
        },
        {
            "title": "AEC Centre for Corporate Relations: Campus Placement & Naan Mudhalvan Policy 2026-2027",
            "filename": "aec_placement_policy_2026.txt",
            "file_type": "text/plain",
            "department": "Training & Placement Cell",
            "doc_type": "circular",
            "year_regulation": "2026-2027",
            "access_level": "student",
            "effective_date": "2026-07-25",
            "urgency": "normal",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE, SALEM
CENTRE FOR CAREER GUIDANCE & PLACEMENT CELL
CAMPUS RECRUITMENT POLICY & INTERNSHIP CODE (BATCH 2023-2027)

1. RECRUITMENT ELIGIBILITY NORMS:
- Tier-1 & Product Companies (CTC >= 8 LPA): Minimum 7.5 CGPA in B.E. with 70%+ in 10th and 12th standards, with ZERO standing arrears.
- Core & IT Services Drives (TCS, Cognizant, Wipro, Infosys, Zoho, Capgemini, Salem/Coimbatore Core Industries): Minimum 6.5 CGPA with a maximum of 1 active arrear (subject to company criteria).
- Mandatory Placement Training: 85% attendance in Soft Skills, Aptitude, Java/Python Full Stack, and Government Naan Mudhalvan skill certifications is mandatory to participate in campus recruitment.

--- Page 2 ---
2. ONE STUDENT - ONE JOB & UPGRADE REGULATION:
- Once a student secures an offer with CTC up to 4.5 LPA, they are permitted to attend interviews only for 'Dream Companies' offering CTC >= 6.5 LPA.
- If a student gets selected for a Dream Company, they are entitled to try for 'Super Dream Companies' offering CTC >= 10 LPA.
- Once selected by a Super Dream firm, the student is placed out of all further placement drives to provide opportunities to peers.

3. 8TH SEMESTER CORPORATE INTERNSHIP NOC:
Final-year students who obtain full-time 6-month internships at recognized software or core manufacturing industries in Chennai, Bangalore, Coimbatore, or Salem must submit the official corporate internship offer letter, endorsed by their Department HOD and Placement Director, to the Principal at least two weeks before joining."""
        },
        {
            "title": "Annapoorana Residential Hostel By-Laws: Gate Timings, Outing e-Pass & Mess Rules",
            "filename": "aec_hostel_rules_2026.txt",
            "file_type": "text/plain",
            "department": "Hostel Administration",
            "doc_type": "notice",
            "year_regulation": "2026-2027",
            "access_level": "student",
            "effective_date": "2026-08-05",
            "urgency": "normal",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE, SALEM
OFFICE OF THE CHIEF WARDEN - BOYS & GIRLS RESIDENTIAL HOSTELS

1. GATE TIMINGS & CURFEW (SANKARI HIGHWAY CAMPUS):
- Main Campus Gate Closes: 08:30 PM.
- Boys Hostel Gate Closes: 08:15 PM sharp. Night biometric punch is mandatory between 07:30 PM and 08:15 PM.
- Girls Hostel Gate Closes: 07:45 PM sharp. Night biometric attendance punch is mandatory between 07:00 PM and 07:45 PM.
- Students arriving past curfew will be issued warning slips; a third infraction results in immediate communication with parents and disciplinary review.

--- Page 2 ---
2. LOCAL OUTING & WEEKEND HOME LEAVE PASS:
- Weekday Salem Town Outing: Allowed only on Wednesdays and Saturdays from 04:45 PM to 07:30 PM with Resident Warden's sign-off.
- Weekend Home Leave: Students wishing to visit their native place on weekends must submit an e-Pass on the AEC Hostel portal before Thursday 04:00 PM.
- Automatic SMS OTP confirmation is transmitted to the parent's registered mobile number. The outpass is sanctioned only upon parent OTP confirmation.

3. MESS TIMINGS & DINING FACILITY:
- Breakfast: 07:15 AM - 08:30 AM (South Indian Idli, Dosa, Pongal, Poori)
- Lunch: 12:30 PM - 02:00 PM (Unlimited Meals, Variety Rice)
- Evening Snacks & Tea: 04:45 PM - 05:30 PM
- Dinner: 07:30 PM - 09:15 PM (Chapati, Rice, Curd)"""
        },
        {
            "title": "AEC Faculty & Staff Service Regulations, Leaves & Anna University Zonal Duties",
            "filename": "aec_faculty_regulations_2026.txt",
            "file_type": "text/plain",
            "department": "Administration & HR",
            "doc_type": "regulation",
            "year_regulation": "2026-2027",
            "access_level": "staff",
            "effective_date": "2026-06-15",
            "urgency": "normal",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE, SALEM
OFFICE OF THE PRINCIPAL & REGISTRAR
STAFF SERVICE RULES, LEAVE SANCTIONS & RESEARCH INCENTIVES

1. WORKING HOURS & BIOMETRIC ATTENDANCE:
- College Working Hours: 08:40 AM to 04:40 PM (Monday through Friday, and declared Saturdays).
- Morning Biometric Punch: Faculty must complete biometric punch on or before 08:50 AM. Grace time of 10 minutes is permitted up to 2 times a month.
- Afternoon Punch: Must be completed after 04:40 PM.

--- Page 2 ---
2. LEAVE ENTITLEMENT:
- Casual Leave (CL): 12 days per calendar year (credited at 1 day per month).
- Restricted Holidays (RH): 3 days per year as per Tamil Nadu government holiday gazette.
- On-Duty (OD) Leave: Up to 15 days per academic year for attending Anna University Zonal Central Valuation, External Practical Examiner duty, Doctoral Committee meetings, and AICTE/DST sponsored Faculty Development Programs (FDP).
- Medical Leave: 10 days on half pay (or 5 days full pay) upon completion of 1 year of continuous service.

3. RESEARCH INCENTIVE SCHEME:
Faculty members who publish high-impact research papers under the institutional affiliation 'Annapoorana Engineering College, Salem' are granted cash awards:
- SCI / SCIE Indexed Journal Publication: INR 25,000 cash incentive per paper.
- Scopus Indexed Q1 / Q2 Journal Publication: INR 15,000 cash award.
- Published Indian / International Patent: INR 20,000 financial support."""
        },
        {
            "title": "AEC Institutional Transport Network: Salem, Sankari, Tiruchengode & Erode Bus Routes",
            "filename": "aec_transport_routes_2026.txt",
            "file_type": "text/plain",
            "department": "Campus Transportation",
            "doc_type": "timetable",
            "year_regulation": "2026-2027",
            "access_level": "all",
            "effective_date": "2026-07-15",
            "urgency": "normal",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE, SALEM
DEPARTMENT OF CAMPUS TRANSPORTATION & BUS FLEET MANAGEMENT

1. BUS FLEET COVERAGE (SALEM & SURROUNDING DISTRICTS):
AEC operates 26 college buses connecting the Periaseeragapadi campus across Salem, Namakkal, and Erode districts:
- Route 1: Salem New Bus Stand -> Four Roads -> Gugai -> Kondalampatti -> Campus (Departure 07:40 AM)
- Route 3: Hasthampatti -> Cherry Road -> Old Bus Stand -> Dadagapatty -> Seelanaickenpatti -> Campus (Departure 07:35 AM)
- Route 5: Ammapet -> Udayapatti -> Ayothiyapattinam -> Campus (Departure 07:25 AM)
- Route 8: Omalur -> Jagirammapalayam -> Meyyanur -> Campus (Departure 07:30 AM)
- Route 12: Sankari Town -> Sankari R.S. -> Vaikundam -> Campus (Departure 07:55 AM)
- Route 15: Tiruchengode Bus Stand -> Kootapalli -> Magudanchavadi -> Campus (Departure 07:30 AM)
- Route 18: Edappadi -> Poolampatti -> Jalakandapuram -> Campus (Departure 07:20 AM)
- Route 22: Rasipuram -> Vennandur -> Attayampatti -> Campus (Departure 07:25 AM)

--- Page 2 ---
2. ARRIVAL & DEPARTURE SCHEDULE:
- Morning Arrival: All college buses reach the AEC campus by 08:25 AM.
- Evening Departure: Buses depart from campus bus parking at 04:50 PM.
3. BUS PASS & SAFETY RULES:
- Commuters must produce their physical RFID Bus Pass to the driver/supervisor upon boarding.
- Annual bus pass fee must be cleared before the semester start date."""
        },
        {
            "title": "Anna University (CAC): Academic Schedule, Working Days & Assessment Entry (Affiliated Institutions)",
            "filename": "anna_univ_academic_schedule_cac.txt",
            "file_type": "text/plain",
            "department": "Academic Affairs",
            "doc_type": "regulation",
            "year_regulation": "R-2021",
            "access_level": "all",
            "effective_date": "2026-08-01",
            "urgency": "urgent",
            "raw_text": """--- Page 1 ---
CENTRE FOR ACADEMIC COURSES (CAC), ANNA UNIVERSITY, CHENNAI
OFFICIAL ACADEMIC SCHEDULE FOR AFFILIATED INSTITUTIONS (UG & PG PROGRAMMES)
URL REF: cac.annauniv.edu/aidetails/ai_ug_schedule.html

1. SEMESTER INSTRUCTIONAL DURATION & WORKING DAYS:
- Minimum Instructional Days: Every affiliated engineering college shall strictly conduct a minimum of 90 instructional working days (450 instructional hours / periods) excluding semester examination days.
- Six-day Working Week Pattern: Saturdays are designated as instructional working days whenever required to compensate for unforeseen holidays and fulfill university statutory working hours.
- Last Working Day: Classes officially conclude exactly on the notified Last Working Day. No assessments or instruction shall take place after this cutoff date.

--- Page 2 ---
2. CONTINUOUS ASSESSMENT MARKS (CIA) & ATTENDANCE ENTRY PORTAL:
As notified by the Controller of Examinations (COE) Anna University (coe1.annauniv.edu):
- Colleges must record cumulative attendance and internal assessment marks across 4 Assessment Entry Periods:
  * Assessment Period I: Covering Units 1 & 2 (Continuous Assessment Test 1 / IAT-1)
  * Assessment Period II: Covering Units 3, 4 & 5 (Continuous Assessment Test 2 / IAT-2)
  * Assessment Period III & IV: Laboratory / Practical marks, assignments, seminars and Naan Mudhalvan skill evaluations.
- Closing of Attendance: Final semester attendance percentage is frozen at 5:00 PM on the Last Working Day. Attendance certificates must be generated, signed by the Principal, and submitted to the Zonal Office.
- Minimum 75% attendance across all subjects combined is strictly validated by the University portal for hall ticket generation.

3. UNIVERSITY THEORY & PRACTICAL EXAMINATION TIMELINES:
- Practical Examinations: Commences within 7 to 10 days from the Last Working Day.
- End Semester Theory Examinations: Commences immediately following practicals as per the Central Controller of Examinations (COE) Master Timetable.
- Re-opening for Subsequent Semester: Re-opening dates are notified by CAC Anna University in coordination with the Syndicate."""
        },
        {
            "title": "Anna University (CAC): B.E. / B.Tech. R-2021 CBCS Curriculum & Syllabi Structure (Affiliated Institutions)",
            "filename": "anna_univ_r2021_cbcs_curriculum_cac.txt",
            "file_type": "text/plain",
            "department": "Academic Affairs",
            "doc_type": "regulation",
            "year_regulation": "R-2021",
            "access_level": "student",
            "effective_date": "2026-08-01",
            "urgency": "normal",
            "raw_text": """--- Page 1 ---
CENTRE FOR ACADEMIC COURSES (CAC), ANNA UNIVERSITY, CHENNAI
REGULATIONS 2021 (R-2021) CHOICE BASED CREDIT SYSTEM (CBCS)
UNDERGRADUATE PROGRAMMES (B.E. / B.TECH.) CURRICULUM & SYLLABI FOR AFFILIATED COLLEGES
URL REF: cac.annauniv.edu/aidetails/ai_ug_cands_2021ft.html

1. PROGRAMMES & SPECIALIZATIONS OFFERED AT AFFILIATED COLLEGES:
Approved curricula for Annapoorana Engineering College departments:
- B.E. Computer Science and Engineering (CSE)
- B.Tech. Artificial Intelligence and Data Science (AI&DS)
- B.Tech. Information Technology (IT)
- B.E. Electronics and Communication Engineering (ECE)
- B.E. Electrical and Electronics Engineering (EEE)
- B.E. Mechanical Engineering (Mech)
- B.E. Automobile Engineering
- B.E. Civil Engineering (Civil)
- B.E. Biomedical Engineering (BME)

--- Page 2 ---
2. DEGREE CREDIT REQUIREMENTS & COURSE CATEGORIES:
A student must successfully earn between 160 to 165 credits (120 to 125 credits for Lateral Entry) distributed across categories:
- HSMC (Humanities and Social Sciences including Management Courses): Professional Communication, Heritage of Tamils, Tamils and Technology, Environmental Sciences.
- BSC (Basic Science Courses): Matrices and Calculus, Physics for Information/Electrical Sciences, Engineering Chemistry, Problem Solving and Python.
- ESC (Engineering Science Courses): Engineering Graphics, Basic Electrical/Electronics/Civil/Mechanical Engineering, C Programming, Engineering Practices Lab.
- PCC (Professional Core Courses): Essential branch foundational subjects and laboratory courses.
- PEC (Professional Elective Courses): Specialized verticals (Cloud Computing, Cyber Security, Artificial Intelligence, VLSI, Electric Vehicles, Industry 4.0).
- OEC (Open Elective Courses): Multi-disciplinary courses chosen from faculties other than the parent branch.
- EEC (Employability Enhancement Courses): Summer Internships, Mini-Projects, Naan Mudhalvan Skill Modules, Final Year Project Work Phase-I (Sem VII) & Phase-II (Sem VIII).

3. VALUE ADDED COURSES (VAC) & ONLINE NPTEL/SWAYAM CREDITS:
- Value Added Courses: 1 or 2 credit courses offered beyond regular curriculum with industry collaboration, approved by CAC.
- Credit Transfer via Online Courses: Students can opt for NPTEL / SWAYAM online courses (up to 3 credits per semester, maximum 6 credits across degree) in lieu of Professional Electives with prior approval from HOD and Academic Council."""
        },
        {
            "title": "Annapoorana Engineering College (AEC) Salem: Official Institutional Profile, Contact Directory, Admissions & Online Fee Portals",
            "filename": "aec_official_profile_directory_2026.txt",
            "file_type": "text/plain",
            "department": "Administration & HR",
            "doc_type": "circular",
            "year_regulation": "2026-2027",
            "access_level": "all",
            "effective_date": "2026-08-01",
            "urgency": "normal",
            "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE (AEC), SALEM
(Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai)
NH-47, Sankari Main Road, Periyaseeragapadi, Salem - 636 308, Tamil Nadu
Official Website: https://aecsalem.edu.in
Email: annapooranaengineeringinfo@gmail.com
Official Helplines: +91 9786911333 / +91 9442000648

1. LEADERSHIP & ADMINISTRATION:
- Principal: Dr. A. Anbuchezian (Office of the Principal, Main Administrative Block)
- Dean of Academic Affairs & Controller of Examinations (COE Anna University Zonal Office Co-ordination)
- Director of Placement & Career Centre: Placement & Corporate Relations Centre

2. OFFICIAL ONLINE PORTALS:
- Official College Web Portal: https://aecsalem.edu.in
- Online Tuition Fee Payment Portal: https://aecsalem.edu.in/pay/ (Direct gateway for college tuition, bus pass, hostel fees)
- Admissions 2026 Online Portal: https://admission.aecsalem.edu.in/
- Anna University COE Portal: https://coe1.annauniv.edu (Internal assessment marks, hall tickets, revaluation results)

--- Page 2 ---
3. UNDERGRADUATE (B.E. / B.TECH.) PROGRAMMES OFFERED:
- Artificial Intelligence and Data Science (B.Tech AI&DS)
- Automobile Engineering (B.E.)
- Biomedical Engineering (B.E. BME)
- Civil Engineering (B.E. Civil)
- Computer Science and Engineering (B.E. CSE)
- Electrical and Electronics Engineering (B.E. EEE)
- Electronics and Communication Engineering (B.E. ECE)
- Information Technology (B.Tech IT)
- Mechanical Engineering (B.E. Mech)

4. POSTGRADUATE (M.E. / M.TECH.) PROGRAMMES OFFERED:
- M.E. Computer Science and Engineering
- M.E. Power Electronics & Drives (PED)
- M.E. Structural Engineering
- M.E. Industrial & Safety Engineering
- M.E. Communication Systems

--- Page 3 ---
5. VISION & MISSION STATEMENTS:
- Vision: To become an institute of great repute in the field of engineering and technology by offering a full range of programs of global standard to transform students into globally competent personalities.
- Mission:
  * To provide students with basic and advanced engineering knowledge, interdisciplinary and problem-solving skills, and self-confidence to excel in their professions.
  * To foster a diverse, supportive academic culture that addresses societal and business issues.
  * To nurture leaders ready for the global environment, with a commitment to inclusive education and social justice.

6. CAMPUS FACILITIES & EMERGENCY HELPLINE:
- Dr. A.P.J. Abdul Kalam Central Knowledge Resource Centre & Digital Library
- Placement & Career Guidance Cell
- Residential Hostels (Boys & Girls) with 24/7 Security and Resident Wardens
- Transport Fleet of 26 College Buses covering Salem, Sankari, Tiruchengode, Edappadi, Rasipuram, Omalur, Erode districts
- Admission Enquiry Helpline: +91 9786911333, +91 9442000648"""
        },
{
        "title": "AEC Academic Calendar 2026-2027: Semester Working Days, CIA Schedule & Holidays",
        "filename": "aec_academic_calendar_2026_27.txt",
        "file_type": "text/plain",
        "department": "Academic Affairs",
        "doc_type": "circular",
        "year_regulation": "2026-2027",
        "access_level": "all",
        "effective_date": "2026-08-10",
        "urgency": "urgent",
        "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE (AEC), SALEM
OFFICIAL ACADEMIC CALENDAR & SCHEDULE FOR ODD & EVEN SEMESTERS (ACADEMIC YEAR 2026-2027)

1. SEMESTER DATES & INSTRUCTIONAL PERIOD:
- Commencement of Classes for Odd Semester: August 16, 2026.
- Last Working Day for Odd Semester: November 28, 2026.
- Total Instructional Working Days: 90 Days (Minimum mandatory requirement as per Anna University CAC norms).
- Commencement of Even Semester Classes: January 04, 2027.

2. CONTINUOUS INTERNAL ASSESSMENT (CIA) TESTS SCHEDULE:
- CIA Test 1 (IAT-1): September 22 to September 28, 2026 (Portions: Units I & II).
- Mark Entry & Web Attendance Period 1: October 03, 2026 on Anna University portal.
- CIA Test 2 (IAT-2): November 10 to November 16, 2026 (Portions: Units III, IV & V).
- Model Practical Examinations: November 18 to November 24, 2026.

--- Page 2 ---
3. ANNA UNIVERSITY END SEMESTER EXAMINATION TIMINGS:
- Practical Examination Window: November 30 to December 08, 2026.
- Theory Examination Window: December 11 to December 30, 2026.
- Forenoon Session (FN): 10:00 AM to 01:00 PM.
- Afternoon Session (AN): 02:00 PM to 05:00 PM.

4. OFFICIAL LIST OF CAMPUS HOLIDAYS (ODD SEM):
- Vinayaka Chaturthi: September 07, 2026.
- Gandhi Jayanthi: October 02, 2026.
- Ayutha Pooja & Vijaya Dasami: October 11 & 12, 2026.
- Deepavali Festival: October 31 to November 02, 2026.
- Christmas Celebration: December 25, 2026."""
    },
    {
        "title": "AEC Department of AI & Data Science: Curriculum Structure, Labs & Naan Mudhalvan Modules",
        "filename": "aec_aids_curriculum_manual.txt",
        "file_type": "text/plain",
        "department": "Artificial Intelligence & Data Science (AI&DS)",
        "doc_type": "regulation",
        "year_regulation": "R2021",
        "access_level": "all",
        "effective_date": "2026-07-15",
        "urgency": "normal",
        "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE, SALEM
DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE (AI & DS)
PROGRAMME SPECIFICATION & LABORATORY GUIDELINES (B.TECH AI & DS - R2021 CBCS)

1. CORE TECHNICAL COURSES & CREDIT DISTRIBUTION:
- Semester 3: Foundations of Data Science, Data Structures & Algorithms, Python for Machine Learning, Digital Logic & Microcontrollers.
- Semester 4: Database Management Systems, Machine Learning Techniques, Applied Statistics & Linear Algebra, Design & Analysis of Algorithms.
- Semester 5: Deep Learning Architectures, Natural Language Processing, Computer Vision & Image Analytics, Web Technologies Lab.
- Semester 6: Big Data Analytics, Cloud Computing with AWS/Azure, AI Ethics & Cyber Laws, Naan Mudhalvan Generative AI Specialization.
- Semester 7: Reinforcement Learning, MLOps & Production Pipelines, Open Electives & Industrial Project Phase-I.
- Semester 8: Industrial Internship (Full Semester NOC) & Capstone Project Phase-II.

--- Page 2 ---
2. ADVANCED COMPUTING LAB FACILITIES:
- AICTE Idea Lab & GPU High-Performance Cluster: NVIDIA RTX 4090 Workstations for Deep Learning model training.
- IBM Center of Excellence: Specialized curriculum modules on IBM Cloud Pak for Data, Watson Discovery, and Red Hat OpenShift.
- Data Engineering Studio: 70 Core-i7 desktop nodes running Ubuntu Linux, Apache Spark, Hadoop, and PostgreSQL.
- Coding Club & Hackathon Hub: 24x7 high-speed 1 Gbps leased line internet connection for student participation in Smart India Hackathon (SIH) and Tamil Nadu State Hackathons."""
    },
    {
        "title": "AEC Central Library & Digital Knowledge Center: DELNET Access, Book Lending & E-Resources Policy",
        "filename": "aec_library_policy.txt",
        "file_type": "text/plain",
        "department": "Library Services",
        "doc_type": "notice",
        "year_regulation": "2026-2027",
        "access_level": "all",
        "effective_date": "2026-08-01",
        "urgency": "normal",
        "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE (AEC), SALEM
CENTRAL LIBRARY & DIGITAL INFORMATION RESOURCE CENTRE (DIRC)
RULES, CIRCULATION REGULATIONS & DIGITAL ACCESS MANUAL

1. LIBRARY WORKING HOURS:
- Working Days (Monday to Saturday): 08:30 AM to 06:00 PM.
- Examination Preparation Period: 08:00 AM to 07:30 PM.
- Digital Library & Internet Lab: 09:00 AM to 05:30 PM.

2. BOOK BORROWING PRIVILEGES & LOAN PERIOD:
- Under Graduate Students (B.E. / B.Tech): 4 Library Borrower Cards (Loan Period: 14 Days).
- Post Graduate Students (M.E.): 6 Library Borrower Cards (Loan Period: 21 Days).
- Faculty Members: 8 Books (Loan Period: One Full Semester).
- Renewal & Late Return Overdue Charges: Books can be renewed once for an additional 14 days if there are no advance reservations. An overdue fine of INR 2/- per day per volume will be charged for delayed returns.

--- Page 2 ---
3. E-RESOURCES & SUBSCRIPTION ACCESS:
- IEEE Xplore Digital Library: Access to IEEE Transactions, Conferences, and Standards on college IP range.
- DELNET (Developing Library Network): Inter-library loan facility and union catalogue access across 7000+ Indian libraries.
- NPTEL / SWAYAM Local Chapter: 50 dedicated multimedia PCs with video lectures on engineering, management, and basic sciences.
- Anna University Consortium E-Journals: Elsevier ScienceDirect, Springer Link, and McGraw Hill AccessEngineering."""
    },
    {
        "title": "AEC Student Discipline, Campus Ethics & Anti-Ragging Committee Regulations",
        "filename": "aec_antiragging_discipline_code.txt",
        "file_type": "text/plain",
        "department": "Administration & HR",
        "doc_type": "regulation",
        "year_regulation": "2026-2027",
        "access_level": "all",
        "effective_date": "2026-08-01",
        "urgency": "urgent",
        "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE (AEC), SALEM
STUDENT CODE OF CONDUCT, ANTI-RAGGING CELL REGULATIONS & DISCIPLINARY BY-LAWS

1. ZERO TOLERANCE POLICY AGAINST RAGGING:
Ragging in any form inside or outside the college campus, in college buses, or in residential hostels is strictly prohibited by law under the Tamil Nadu Prohibition of Ragging Act, 1997 and UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions.

2. PENALTIES FOR RAGGING:
Any student found guilty of ragging, abetting ragging, or participating in ragging will face:
- Immediate suspension from attending classes and academic privileges.
- Withholding/withdrawing scholarship, fee concessions, and other benefits.
- Debarring from appearing in Internal Assessment and Anna University examinations.
- Expulsion from the hostel and cancellation of admission.
- Lodging of First Information Report (FIR) with the local police station (Sankari / Salem Police).

--- Page 2 ---
3. ANTI-RAGGING COMMITTEE & 24/7 HELPLINE DIRECTORY:
- Principal & Chairman: Dr. A. Anbuchezian (+91 9442000648).
- Anti-Ragging Nodal Officer: Vice Principal / Senior Professor (+91 9786911333).
- National Anti-Ragging 24x7 Toll-Free Helpline: 1800-180-5522.
- Anti-Ragging Squad Email: antiragging@aecsalem.edu.in.
- Confidential Drop Boxes: Installed at Main Reception, Library, Boys Hostel Entrance, and Girls Hostel Lounge."""
    },
    {
        "title": "AEC Student Clubs, Muthamizh Mandram & Sports Council Activities 2026-2027",
        "filename": "aec_student_clubs_activities.txt",
        "file_type": "text/plain",
        "department": "Campus Life & Extracurriculars",
        "doc_type": "notice",
        "year_regulation": "2026-2027",
        "access_level": "all",
        "effective_date": "2026-08-15",
        "urgency": "normal",
        "raw_text": """--- Page 1 ---
ANNAPOORANA ENGINEERING COLLEGE (AEC), SALEM
CO-CURRICULAR & EXTRA-CURRICULAR CLUBS COUNCIL (ACADEMIC YEAR 2026-2027)

1. ACTIVE CAMPUS CLUBS & ENROLMENT GUIDELINES:
All 1st, 2nd, and 3rd year students are required to join at least one technical and one non-technical club for personality development:
- Coders Club: Weekly competitive programming contests on LeetCode, HackerRank, and CodeChef; hackathons and open-source contribution drives.
- Muthamizh Mandram (முத்தமிழ் மன்றம்): Tamil oratory, poetry competitions, Pattimandram, Pongal cultural celebrations, and heritage preservation.
- Fine Arts & Music Club: Classical dance, western music band, drama, photography, and short film production.
- Science & Innovation Club: Project expo, robotics competitions, CAD design contests, and patent filing guidance.
- Trekking & Environmental Club: Nature camps, tree plantation drives, plastic-free campus initiatives, and Yercaud hill trekking expeditions.
- Radio Jockey (RJ) Club & Language Lounge: English communication enhancement, public speaking workshops, campus podcasting, and toastmasters sessions.

--- Page 2 ---
2. SPORTS & PHYSICAL EDUCATION COUNCIL:
- Outdoor Sports Grounds: 400m Athletic Track, Cricket Ground with turf nets, Football Field, Volleyball & Basketball Courts with floodlights.
- Indoor Sports Complex: Badminton wooden courts, Table Tennis arena, Chess lounge, and modern Multi-Gymnasium.
- Anna University Zonal Tournaments: AEC students participating in Anna University Zone-8 sports tournaments receive Special On-Duty (OD), sports tracksuits, and travel allowance."""
    }
    ]

    for doc in sample_docs:
        cursor.execute('''
            INSERT INTO documents (title, filename, file_type, department, doc_type, year_regulation, access_level, effective_date, urgency, raw_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            doc["title"],
            doc["filename"],
            doc["file_type"],
            doc["department"],
            doc["doc_type"],
            doc["year_regulation"],
            doc["access_level"],
            doc["effective_date"],
            doc["urgency"],
            doc["raw_text"]
        ))
        doc_id = cursor.lastrowid
        
        chunks = chunk_text_by_pages(doc["raw_text"], doc["title"], doc["department"], doc["doc_type"])
        for idx, chunk in enumerate(chunks):
            cursor.execute('''
                INSERT INTO document_chunks (document_id, chunk_index, page_number, content, metadata_json)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                doc_id,
                idx,
                chunk.get("page_number", 1),
                chunk["content"],
                json.dumps({
                    "title": doc["title"],
                    "department": doc["department"],
                    "doc_type": doc["doc_type"],
                    "year_regulation": doc["year_regulation"],
                    "access_level": doc["access_level"],
                    "page": chunk.get("page_number", 1),
                    "effective_date": doc["effective_date"],
                    "section": chunk.get("section", "")
                })
            ))
        
        cursor.execute('UPDATE documents SET chunk_count = ? WHERE id = ?', (len(chunks), doc_id))

    conn.commit()

def chunk_text_by_pages(text, title="", department="", doc_type="circular", max_words=220):
    """Splits text by page markers ('--- Page X ---') and chunks section by section with page metadata"""
    pages = text.split("--- Page ")
    chunks = []
    chunk_idx = 0

    for p in pages:
        p = p.strip()
        if not p:
            continue
        
        page_num = 1
        lines = p.split("\n")
        first_line = lines[0].strip()
        
        # Check if first line starts with page number like "1 ---"
        if "---" in first_line:
            parts = first_line.split("---")
            if parts[0].strip().isdigit():
                page_num = int(parts[0].strip())
                page_body = "\n".join(lines[1:])
            else:
                page_body = p
        else:
            page_body = p

        sections = page_body.split("\n\n")
        for sec in sections:
            sec = sec.strip()
            if not sec:
                continue
            words = sec.split()
            if len(words) <= max_words:
                chunks.append({
                    "content": sec,
                    "page_number": page_num,
                    "section": sec.split("\n")[0][:80]
                })
            else:
                start = 0
                while start < len(words):
                    end = min(start + max_words, len(words))
                    sub_chunk = " ".join(words[start:end])
                    chunks.append({
                        "content": sub_chunk,
                        "page_number": page_num,
                        "section": sec.split("\n")[0][:80]
                    })
                    if end == len(words):
                        break
                    start += (max_words - 40)

    return chunks
