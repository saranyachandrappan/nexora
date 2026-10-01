import json
from rag_engine import CampusRAGEngine
from db import DB_PATH

EVALUATION_QUESTIONS = [
    # 1-10: Academic Regulations & Attendance (R-2021)
    {
        "id": 1,
        "question": "What is the minimum overall attendance required to write Anna University semester exams?",
        "role": "student",
        "expected_keywords": ["75%", "attendance", "semester"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 2,
        "question": "What attendance percentage range is eligible for medical condonation at AEC Salem?",
        "role": "student",
        "expected_keywords": ["65%", "74%", "medical"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 3,
        "question": "How much is the attendance condonation processing fee at AEC Salem?",
        "role": "student",
        "expected_keywords": ["750", "INR 750", "fee"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 4,
        "question": "What happens to a student with attendance strictly below 65%?",
        "role": "student",
        "expected_keywords": ["Detained", "Lack of Attendance", "repeat", "Prevented"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 5,
        "question": "What is the weightage split between Continuous Internal Assessment (CIA) and End Semester Exams?",
        "role": "student",
        "expected_keywords": ["40%", "60%", "CIA", "End Semester"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 6,
        "question": "What is the passing minimum percentage required in the End Semester Examination?",
        "role": "student",
        "expected_keywords": ["45%", "50%", "aggregate"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 7,
        "question": "What does RA grade signify in Anna University grade sheets?",
        "role": "student",
        "expected_keywords": ["Re-Appearance", "Arrear", "50"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 8,
        "question": "How much is the fee for Anna University answer script photocopy and revaluation per subject?",
        "role": "student",
        "expected_keywords": ["500", "800", "revaluation"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 9,
        "question": "Within how many days of result publication must revaluation applications be submitted?",
        "role": "student",
        "expected_keywords": ["10 days", "AU COE"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },
    {
        "id": 10,
        "question": "varugai 68% irundha condonation apply pannalama?",
        "role": "student",
        "expected_keywords": ["65%", "74%", "750", "medical"],
        "expected_doc": "Anna University B.E./B.Tech Academic Regulations R-2021"
    },

    # 11-20: Tuition Fees, Scholarships & Circulars
    {
        "id": 11,
        "question": "What is the deadline for paying odd semester tuition fee without late fine?",
        "role": "student",
        "expected_keywords": ["October 25, 2026", "September 15"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 12,
        "question": "How much is the late payment fine per day for tuition fee defaults?",
        "role": "student",
        "expected_keywords": ["100", "INR 100", "fine"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 13,
        "question": "What is the last date to submit First Graduate concession documents at Room 102?",
        "role": "student",
        "expected_keywords": ["October 15, 2026", "Tahsildar", "First Graduate"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 14,
        "question": "Where should SC/ST students submit biometric Aadhaar authentication for Post-Matric scholarship?",
        "role": "student",
        "expected_keywords": ["October 20, 2026", "Scholarship Facilitation Desk", "Admin Block"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 15,
        "question": "What criteria is required for AEC Institutional Merit Scholarship 40% tuition fee waiver?",
        "role": "student",
        "expected_keywords": ["8.5+", "CGPA", "top 2 rank"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 16,
        "question": "What are the approved online payment channels for AEC tuition fees?",
        "role": "student",
        "expected_keywords": ["SB Collect", "Indian Bank", "AEC Student ERP"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 17,
        "question": "What are the cash counter opening hours at the Main Admin Block Accounts section?",
        "role": "student",
        "expected_keywords": ["09:30 AM", "03:30 PM"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 18,
        "question": "tuition fee epo katatnum fine illama?",
        "role": "student",
        "expected_keywords": ["October 25, 2026", "September 15"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 19,
        "question": "What happens if a student fails to pay tuition fees before November 05, 2026?",
        "role": "student",
        "expected_keywords": ["hall tickets", "deactivation", "Defaulter"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },
    {
        "id": 20,
        "question": "Who signed Circular AEC/ADM/2026-27/042?",
        "role": "student",
        "expected_keywords": ["PRINCIPAL", "ADMINISTRATIVE OFFICER"],
        "expected_doc": "Circular #AEC/ADM/2026/042"
    },

    # 21-30: Examination Timetables & Malpractice Code
    {
        "id": 21,
        "question": "When is the CSE Cryptography and Network Security exam scheduled according to the timetable?",
        "role": "student",
        "expected_keywords": ["10-11-2026", "FN", "CS3491"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 22,
        "question": "Where is the hall allocation for ECE Linear Integrated Circuits paper?",
        "role": "student",
        "expected_keywords": ["Tech Block", "T-201", "T-204"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 23,
        "question": "What mandatory documents are required to enter the examination hall?",
        "role": "student",
        "expected_keywords": ["Hall Ticket", "College ID", "Anna University"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 24,
        "question": "What reporting time is mandatory for morning session semester exams?",
        "role": "student",
        "expected_keywords": ["09:40 AM", "10:00 AM"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 25,
        "question": "What electronic items are strictly prohibited inside exam halls?",
        "role": "student",
        "expected_keywords": ["Mobile phones", "smartwatches", "programmable calculators"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 26,
        "question": "When is the MECH Theory of Machines exam date?",
        "role": "student",
        "expected_keywords": ["12-11-2026", "ME3491", "Mechanical Block"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 27,
        "question": "When is the GE3451 Environmental Sciences exam date for all departments?",
        "role": "student",
        "expected_keywords": ["14-11-2026", "FN", "All Exam Halls"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 28,
        "question": "After how many minutes of commencement will candidates be denied entry into exam halls?",
        "role": "student",
        "expected_keywords": ["30 minutes", "commencement"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 29,
        "question": "thervu time table padhi sollunga",
        "role": "student",
        "expected_keywords": ["10-11-2026", "CS3491", "Hall Allocation"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },
    {
        "id": 30,
        "question": "Which block is allocated for CS3451 Distributed Systems paper?",
        "role": "student",
        "expected_keywords": ["Admin Block", "H-101", "H-105"],
        "expected_doc": "AEC Odd Semester 2026-27 Master Examination Timetable"
    },

    # 31-40: Hostel By-Laws & Transport Routes
    {
        "id": 31,
        "question": "What is the Boys Hostel gate curfew timing?",
        "role": "student",
        "expected_keywords": ["08:15 PM", "biometric"],
        "expected_doc": "Annapoorana Residential Hostel By-Laws"
    },
    {
        "id": 32,
        "question": "What is the Girls Hostel gate curfew timing?",
        "role": "student",
        "expected_keywords": ["07:45 PM", "biometric"],
        "expected_doc": "Annapoorana Residential Hostel By-Laws"
    },
    {
        "id": 33,
        "question": "When is local Salem town outing permitted for hostellers?",
        "role": "student",
        "expected_keywords": ["Wednesdays", "Saturdays", "04:45 PM", "07:30 PM"],
        "expected_doc": "Annapoorana Residential Hostel By-Laws"
    },
    {
        "id": 34,
        "question": "What is the cutoff day and time to apply for weekend home leave e-Pass?",
        "role": "student",
        "expected_keywords": ["Thursday", "04:00 PM", "e-Pass"],
        "expected_doc": "Annapoorana Residential Hostel By-Laws"
    },
    {
        "id": 35,
        "question": "What is the total number of college buses operated by AEC Salem?",
        "role": "student",
        "expected_keywords": ["26", "buses", "Periaseeragapadi"],
        "expected_doc": "AEC Institutional Transport Network"
    },
    {
        "id": 36,
        "question": "What departure time is scheduled for Route 1 from Salem New Bus Stand?",
        "role": "student",
        "expected_keywords": ["07:40 AM", "Kondalampatti"],
        "expected_doc": "AEC Institutional Transport Network"
    },
    {
        "id": 37,
        "question": "What time do all college buses arrive at the campus in the morning?",
        "role": "student",
        "expected_keywords": ["08:25 AM", "Morning Arrival"],
        "expected_doc": "AEC Institutional Transport Network"
    },
    {
        "id": 38,
        "question": "What time do college buses depart from campus in the evening?",
        "role": "student",
        "expected_keywords": ["04:50 PM", "departure"],
        "expected_doc": "AEC Institutional Transport Network"
    },
    {
        "id": 39,
        "question": "What is the departure time for special exam/lab buses?",
        "role": "student",
        "expected_keywords": ["06:15 PM", "Salem New Bus Stand"],
        "expected_doc": "AEC Institutional Transport Network"
    },
    {
        "id": 40,
        "question": "hostel gate epo mooduvanga?",
        "role": "student",
        "expected_keywords": ["08:15 PM", "07:45 PM"],
        "expected_doc": "Annapoorana Residential Hostel By-Laws"
    },

    # 41-47: Placement & Faculty Regulations
    {
        "id": 41,
        "question": "What minimum CGPA is required to participate in Tier-1 recruitment drives (>= 8 LPA)?",
        "role": "student",
        "expected_keywords": ["7.5 CGPA", "70%"],
        "expected_doc": "AEC Centre for Corporate Relations"
    },
    {
        "id": 42,
        "question": "What placement training attendance percentage is mandatory for campus recruitment?",
        "role": "student",
        "expected_keywords": ["85%", "Naan Mudhalvan"],
        "expected_doc": "AEC Centre for Corporate Relations"
    },
    {
        "id": 43,
        "question": "How many Casual Leaves (CL) are credited per calendar year for faculty members?",
        "role": "staff",
        "expected_keywords": ["12 days", "1 day per month"],
        "expected_doc": "AEC Faculty & Staff Service Regulations"
    },
    {
        "id": 44,
        "question": "How many On-Duty (OD) days are allowed for Anna University zonal valuation duties?",
        "role": "staff",
        "expected_keywords": ["15 days", "Central Valuation"],
        "expected_doc": "AEC Faculty & Staff Service Regulations"
    },
    {
        "id": 45,
        "question": "What is the morning biometric punching grace time for faculty members?",
        "role": "staff",
        "expected_keywords": ["08:50 AM", "10 minutes", "2 times"],
        "expected_doc": "AEC Faculty & Staff Service Regulations"
    },
    {
        "id": 46,
        "question": "What cash incentive is awarded for publishing in an SCI / SCIE indexed journal?",
        "role": "staff",
        "expected_keywords": ["25,000", "INR 25,000"],
        "expected_doc": "AEC Faculty & Staff Service Regulations"
    },
    {
        "id": 47,
        "question": "What cash award is granted for Scopus Q1 journal publication?",
        "role": "staff",
        "expected_keywords": ["15,000", "INR 15,000"],
        "expected_doc": "AEC Faculty & Staff Service Regulations"
    },

    # 48-50: Out-of-Scope / Non-Existent Queries (Testing Not Found Handling)
    {
        "id": 48,
        "question": "What is the policy for swimming pool access at AEC Salem?",
        "role": "student",
        "expected_keywords": ["couldn't find", "contact"],
        "expected_doc": "NOT_FOUND"
    },
    {
        "id": 49,
        "question": "Who is going to win the Indian Premier League cricket match tomorrow?",
        "role": "student",
        "expected_keywords": ["couldn't find", "contact"],
        "expected_doc": "NOT_FOUND"
    },
    {
        "id": 50,
        "question": "Can you give me the private phone numbers of all CSE department students?",
        "role": "student",
        "expected_keywords": ["couldn't find", "contact"],
        "expected_doc": "NOT_FOUND"
    }
]

def run_evaluation_benchmark(db_path=DB_PATH):
    """Executes the 50-question benchmark suite and calculates RAG accuracy metrics"""
    engine = CampusRAGEngine(db_path)

    total = len(EVALUATION_QUESTIONS)
    retrieval_passed = 0
    answer_passed = 0
    citation_passed = 0

    results = []

    for item in EVALUATION_QUESTIONS:
        q_id = item["id"]
        q_text = item["question"]
        role = item.get("role", "student")
        exp_kw = item["expected_keywords"]
        exp_doc = item["expected_doc"]

        res = engine.ask(q_text, role=role)
        answer = res["answer"]
        sources = res["sources"]

        # 1. Retrieval Accuracy
        retrieved_doc_titles = [s["title"].lower() for s in sources]
        if exp_doc == "NOT_FOUND":
            r_ok = len(sources) == 0 or "couldn't find" in answer.lower()
        else:
            r_ok = any(exp_doc.lower() in t for t in retrieved_doc_titles)

        # 2. Answer Correctness
        if exp_doc == "NOT_FOUND":
            a_ok = "couldn't find" in answer.lower()
        else:
            a_ok = any(kw.lower() in answer.lower() for kw in exp_kw)

        # 3. Citation Correctness
        if exp_doc == "NOT_FOUND":
            c_ok = "📌 Source:" not in answer or "couldn't find" in answer.lower()
        else:
            c_ok = "📌 Source:" in answer and any(exp_doc.lower() in answer.lower() or kw.lower() in answer.lower() for kw in exp_kw)

        if r_ok: retrieval_passed += 1
        if a_ok: answer_passed += 1
        if c_ok: citation_passed += 1

        results.append({
            "id": q_id,
            "question": q_text,
            "retrieval_ok": r_ok,
            "answer_ok": a_ok,
            "citation_ok": c_ok,
            "answer_snippet": answer[:150] + "...",
            "sources_count": len(sources)
        })

    metrics = {
        "total_questions": total,
        "retrieval_accuracy": round((retrieval_passed / total) * 100, 1),
        "answer_correctness": round((answer_passed / total) * 100, 1),
        "citation_correctness": round((citation_passed / total) * 100, 1),
        "overall_score": round(((retrieval_passed + answer_passed + citation_passed) / (total * 3)) * 100, 1),
        "results": results
    }

    return metrics

if __name__ == "__main__":
    print("=================================================================")
    print(" Running AEC Assist 50-Question Evaluation Benchmark Suite...    ")
    print("=================================================================")
    metrics = run_evaluation_benchmark()
    print(f"Total Questions: {metrics['total_questions']}")
    print(f"Retrieval Accuracy : {metrics['retrieval_accuracy']}%")
    print(f"Answer Correctness : {metrics['answer_correctness']}%")
    print(f"Citation Correctness: {metrics['citation_correctness']}%")
    print(f"Overall RAG Score  : {metrics['overall_score']}%")
    print("=================================================================")
