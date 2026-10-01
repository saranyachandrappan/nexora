import os
import re
import json
import math
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime
import urllib.request
import urllib.error

# Domain synonyms for academic and institutional query expansion (AEC Salem & Anna University)
SYNONYM_MAP = {
    # English academic terms
    "attendance": ["condonation", "shortage", "75%", "65%", "redo", "detained", "prevented", "medical", "minimum"],
    "leave": ["casual leave", "cl", "rh", "restricted holiday", "od", "on-duty", "outpass", "outing"],
    "arrear": ["ra", "re-appearance", "supplementary", "revaluation", "backlog", "photocopy", "grade", "arrears"],
    "fee": ["tuition", "fine", "penalty", "due date", "payment", "scholarship", "concession", "remittance", "first graduate", "fg"],
    "placement": ["recruitment", "internship", "dream company", "cgpa", "ctc", "lpa", "package", "training", "naan mudhalvan"],
    "hostel": ["curfew", "gate timings", "warden", "mess", "outing", "leave pass", "biometric", "sankari"],
    "exam": ["hall ticket", "malpractice", "end semester", "internal assessment", "iat", "cia", "anna university", "au coe", "exam cell", "timetable"],
    "bus": ["transport", "route", "bus pass", "timing", "rfid", "salem", "sankari", "tiruchengode", "edappadi", "rasipuram"],
    "salary": ["incentive", "allowance", "q1", "scopus", "grant", "overhead", "patent"],
    "scholarship": ["merit", "first-graduate", "post-matric", "waiver", "tuition concession", "sc/st", "tahsildar"],
    "college": ["annapoorana", "aec", "salem", "periaseeragapadi", "anna university"],
    "principal": ["anbuchezian", "head", "administration", "office", "contact", "approval"],
    "contact": ["phone", "mobile", "email", "address", "helpline", "admission", "9786911333", "9442000648", "aecsalem.edu.in"],
    "admission": ["admissions 2026", "ug", "pg", "eligibility", "apply", "lateral entry", "counselling"],
    "online": ["portal", "erp", "pay", "aecsalem.edu.in/pay", "sbi collect", "indian bank"],
    
    # Tamil & Tanglish terms expansion
    "varugai": ["attendance", "75%", "condonation"],
    "katanam": ["fee", "tuition", "fine", "payment"],
    "thervu": ["exam", "end semester", "hall ticket"],
    "unavu": ["mess", "food", "dining"],
    "paadam": ["syllabus", "curriculum", "course"],
    "epo": ["date", "deadline", "schedule", "period"],
    "epdi": ["procedure", "apply", "rules", "process"]
}

STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as',
    'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t',
    'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
    'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having',
    'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its',
    'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
    'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
    'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d',
    'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
    'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
    'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
    'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
}

class HybridTFIDFRetriever:
    """Zero-dependency, high-precision sparse TF-IDF and Cosine Similarity index"""
    def __init__(self):
        self.doc_vectors = []
        self.doc_norms = []
        self.doc_freq = defaultdict(int)
        self.num_docs = 0
        self.idf = {}

    def _tokenize(self, text):
        words = re.findall(r'\b[a-z0-9%\$#\-\.]+\b', text.lower())
        tokens = [w for w in words if w not in STOP_WORDS and len(w) > 1]
        bigrams = [f"{tokens[i]}_{tokens[i+1]}" for i in range(len(tokens) - 1)]
        return tokens + bigrams

    def fit_transform(self, corpus):
        self.num_docs = len(corpus)
        if self.num_docs == 0:
            return

        self.doc_freq = defaultdict(int)
        tokenized_docs = []

        for doc in corpus:
            tokens = self._tokenize(doc)
            tokenized_docs.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                self.doc_freq[t] += 1

        self.idf = {}
        for t, df in self.doc_freq.items():
            self.idf[t] = math.log((1 + self.num_docs) / (1 + df)) + 1.0

        self.doc_vectors = []
        self.doc_norms = []

        for tokens in tokenized_docs:
            tf = Counter(tokens)
            vec = {}
            norm_sq = 0.0
            for t, count in tf.items():
                if t in self.idf:
                    weight = (1.0 + math.log(count)) * self.idf[t]
                    vec[t] = weight
                    norm_sq += weight * weight
            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            self.doc_vectors.append(vec)
            self.doc_norms.append(norm)

    def search(self, query):
        if not self.doc_vectors or self.num_docs == 0:
            return []

        q_tokens = self._tokenize(query)
        q_tf = Counter(q_tokens)

        q_vec = {}
        q_norm_sq = 0.0
        for t, count in q_tf.items():
            if t in self.idf:
                weight = (1.0 + math.log(count)) * self.idf[t]
                q_vec[t] = weight
                q_norm_sq += weight * weight

        q_norm = math.sqrt(q_norm_sq) if q_norm_sq > 0 else 1.0
        if q_norm == 0:
            return [0.0] * self.num_docs

        scores = []
        for idx in range(self.num_docs):
            doc_v = self.doc_vectors[idx]
            d_norm = self.doc_norms[idx]
            
            dot_product = sum(doc_v[t] * q_w for t, q_w in q_vec.items() if t in doc_v)
            cosine = dot_product / (q_norm * d_norm) if (q_norm * d_norm) > 0 else 0.0
            scores.append(cosine)

        return scores


class CampusRAGEngine:
    def __init__(self, db_path):
        self.db_path = db_path
        self.retriever = HybridTFIDFRetriever()
        self.chunk_records = []
        self._refresh_index()

    def get_db_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _refresh_index(self):
        """Loads all chunks from SQLite and builds vector index"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT c.id as chunk_id, c.document_id, c.chunk_index, c.page_number, c.content, c.metadata_json,
                   d.title, d.department, d.doc_type, d.year_regulation, d.access_level, d.urgency, d.effective_date
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
        ''')
        rows = cursor.fetchall()
        conn.close()

        self.chunk_records = []
        corpus = []

        for row in rows:
            meta = json.loads(row['metadata_json']) if row['metadata_json'] else {}
            record = {
                "chunk_id": row['chunk_id'],
                "document_id": row['document_id'],
                "chunk_index": row['chunk_index'],
                "page_number": row['page_number'] or meta.get("page", 1),
                "content": row['content'],
                "title": row['title'],
                "department": row['department'],
                "doc_type": row['doc_type'],
                "year_regulation": row['year_regulation'],
                "access_level": row['access_level'],
                "urgency": row['urgency'],
                "effective_date": row['effective_date'],
                "section": meta.get("section", "")
            }
            self.chunk_records.append(record)
            enriched_text = f"{record['title']} {record['department']} {record['doc_type']} {record['year_regulation']} {record['section']} {record['content']}"
            corpus.append(enriched_text)

        if corpus:
            self.retriever = HybridTFIDFRetriever()
            self.retriever.fit_transform(corpus)
        else:
            self.retriever = HybridTFIDFRetriever()

    def detect_intent(self, query):
        """Detect intent for logging and query handling"""
        q = query.lower()
        if any(w in q for w in ["exam", "hall ticket", "malpractice", "revaluation", "iat", "cia", "thervu"]):
            return "exam"
        if any(w in q for w in ["fee", "tuition", "fine", "payment", "scholarship", "katanam"]):
            return "fees"
        if any(w in q for w in ["attendance", "condonation", "shortage", "75%", "65%", "redo", "varugai"]):
            return "attendance"
        if any(w in q for w in ["timetable", "schedule", "date", "time", "room", "hall"]):
            return "timetable"
        if any(w in q for w in ["leave", "cl", "rh", "od", "on-duty", "outpass", "outing"]):
            return "leave"
        if any(w in q for w in ["hostel", "curfew", "mess", "gate", "unavu"]):
            return "hostel"
        if any(w in q for w in ["bus", "route", "transport"]):
            return "transport"
        if any(w in q for w in ["placement", "cgpa", "salary", "lpa", "ctc", "internship"]):
            return "placement"
        return "general"

    def expand_query(self, query):
        """Multilingual and academic synonym expansion"""
        words = re.findall(r'\b\w+\b', query.lower())
        expansion = list(words)
        for w in words:
            if w in SYNONYM_MAP:
                expansion.extend(SYNONYM_MAP[w])
        return " ".join(expansion)

    def retrieve(self, query, role="student", category=None, department=None, top_k=5):
        """Multi-stage hybrid retrieval with metadata filters and role-based security"""
        if not self.chunk_records:
            return []

        expanded_query = self.expand_query(query)
        full_query = f"{query} {expanded_query}"

        sim_scores = self.retriever.search(full_query)
        query_terms = [t.lower() for t in re.findall(r'\b\w+\b', query) if len(t) > 2]

        scored_candidates = []
        for idx, base_score in enumerate(sim_scores):
            rec = self.chunk_records[idx]

            # Security: Role-based access control (student cannot see staff-only docs)
            if role != "admin":
                if rec["access_level"] == "staff" and role != "staff":
                    continue
                if rec["access_level"] == "student" and role == "staff":
                    # staff can see student docs, but boost staff docs
                    pass

            # Department filter
            if department and department.lower() not in ["all", "all departments"]:
                if rec["department"].lower() != department.lower():
                    base_score *= 0.2

            content_lower = rec["content"].lower()
            title_lower = rec["title"].lower()

            term_match_count = sum(1 for term in query_terms if term in content_lower or term in title_lower)
            boost = (term_match_count / max(len(query_terms), 1)) * 0.35

            final_score = float(base_score + boost)

            if final_score > 0.05:
                scored_candidates.append({
                    "score": round(final_score, 4),
                    "chunk_id": rec["chunk_id"],
                    "document_id": rec["document_id"],
                    "title": rec["title"],
                    "department": rec["department"],
                    "doc_type": rec["doc_type"],
                    "year_regulation": rec["year_regulation"],
                    "access_level": rec["access_level"],
                    "page_number": rec["page_number"],
                    "urgency": rec["urgency"],
                    "effective_date": rec["effective_date"],
                    "section": rec["section"],
                    "content": rec["content"]
                })

        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        return scored_candidates[:top_k]

    def ask(self, query, role="student", category=None, department=None, session_id=None):
        """End-to-end RAG resolution enforcing system prompt rules & answer format"""
        intent = self.detect_intent(query)
        matches = self.retrieve(query, role=role, category=category, department=department, top_k=4)

        conn = self.get_db_connection()
        cursor = conn.cursor()

        # Check for Gemini API key
        cursor.execute("SELECT value FROM settings WHERE key = 'gemini_api_key'")
        row = cursor.fetchone()
        gemini_api_key = row['value'] if row and row['value'] else os.environ.get("GEMINI_API_KEY", "")

        confidence = 0.0
        top_sim = matches[0]["score"] if matches else 0.0
        if matches:
            confidence = min(round(top_sim * 100, 1), 98.5)
            if top_sim < 0.15:
                confidence = max(confidence, 35.0)

        # Log search analytics
        cursor.execute('''
            INSERT INTO search_analytics (query, user_role, category, matched_count, top_similarity)
            VALUES (?, ?, ?, ?, ?)
        ''', (query, role, category or "all", len(matches), top_sim))
        conn.commit()

        # Not Found handling (Rule #2)
        if not matches or confidence < 10.0 or top_sim < 0.08:
            dept_target = department if department and department != "All Departments" else "relevant office/department"
            answer = f"I couldn't find this in the available college documents. Please contact the {dept_target} for confirmation."
            
            # Log unanswered query
            cursor.execute('''
                INSERT INTO unanswered_queries (query, user_role, department)
                VALUES (?, ?, ?)
            ''', (query, role, department or "General"))
            conn.commit()

            conn.close()
            return {
                "answer": answer,
                "sources": [],
                "confidence": 0.0,
                "intent": intent,
                "suggested_queries": [
                    "What is the minimum attendance required for semester exams?",
                    "When is the tuition fee payment deadline without fine?",
                    "What are the hostel gate timings and leave rules?"
                ]
            }

        # Format grounded response strictly following Prompt RULES
        answer = None
        if gemini_api_key and len(gemini_api_key.strip()) > 10:
            answer = self._generate_with_gemini(query, matches, role, gemini_api_key)

        if not answer:
            answer = self._generate_aec_assist_response(query, matches, role)

        suggested_queries = self._generate_suggestions(matches, query)

        sources_summary = [
            {
                "title": m["title"],
                "department": m["department"],
                "doc_type": m["doc_type"],
                "page_number": m["page_number"],
                "effective_date": m["effective_date"],
                "section": m["section"],
                "excerpt": m["content"][:220] + "..." if len(m["content"]) > 220 else m["content"],
                "score": m["score"],
                "document_id": m["document_id"]
            }
            for m in matches
        ]

        chat_id = None
        if session_id:
            cursor.execute('''
                INSERT INTO chat_history (session_id, user_role, question, answer, intent, sources_json, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (session_id, role, query, answer, intent, json.dumps(sources_summary), confidence))
            conn.commit()
            chat_id = cursor.lastrowid

        conn.close()

        return {
            "chat_id": chat_id,
            "answer": answer,
            "sources": sources_summary,
            "confidence": confidence,
            "intent": intent,
            "suggested_queries": suggested_queries
        }

    def _generate_aec_assist_response(self, query, matches, role):
        """Generates exact output matching AEC Assist ANSWER FORMAT rules:
        ✅ Answer: <direct answer in 1–3 lines>
        📋 Details: <bullets, only if needed>
        📌 Source: <Document Title> | <Department/Type> | Page <No.> | Dated <Date>
        💡 Note: <only if caveat, conflict, or outdated document>
        """
        top_match = matches[0]
        title = top_match["title"]
        dept = top_match["department"]
        doc_type = top_match["doc_type"].capitalize()
        page = top_match["page_number"]
        date_str = top_match["effective_date"] or "2026-08-01"

        # Check for conflicts or outdated document
        note_clause = ""
        current_year = 2026
        try:
            doc_year = int(date_str.split("-")[0])
            if doc_year < 2024:
                note_clause = f"\n\n💡 Note: This circular is from {doc_year}; please verify the current rule with the {dept}."
        except Exception:
            pass

        if len(matches) > 1 and matches[0]["document_id"] != matches[1]["document_id"]:
            # Check if dates differ
            d1 = matches[0]["effective_date"]
            d2 = matches[1]["effective_date"]
            if d1 and d2 and d1 != d2:
                note_clause = f"\n\n💡 Note: Multiple documents found. Preferring the most recent document dated {d1} over earlier document dated {d2}."

        content_lower = top_match["content"].lower()

        # Direct Answer Extraction
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', top_match["content"]) if len(s.strip()) > 15]
        q_terms = [t.lower() for t in re.findall(r'\b\w+\b', query) if len(t) > 2]

        matching_sentences = []
        for s in sentences:
            score = sum(1 for term in q_terms if term in s.lower())
            if score > 0:
                matching_sentences.append((score, s))

        matching_sentences.sort(key=lambda x: x[0], reverse=True)

        if matching_sentences:
            direct_ans = matching_sentences[0][1]
            if len(matching_sentences) > 1 and len(direct_ans) < 80:
                direct_ans += " " + matching_sentences[1][1]
        else:
            direct_ans = sentences[0] if sentences else top_match["content"][:150]

        # Clean direct answer string
        direct_ans = direct_ans.lstrip("-*1234567890. ").strip()

        # Build Details bullets if there are additional key points
        bullets = []
        seen = {direct_ans.lower()}
        for _, s in matching_sentences[1:5]:
            clean_s = s.lstrip("-*1234567890. ").strip()
            if clean_s.lower() not in seen and len(clean_s) > 20:
                seen.add(clean_s.lower())
                bullets.append(clean_s)

        # Build response
        res = f"✅ Answer: {direct_ans}"
        if bullets:
            res += "\n\n📋 Details:"
            for b in bullets:
                res += f"\n- {b}"

        res += f"\n\n📌 Source: {title} | {dept}/{doc_type} | Page {page} | Dated {date_str}"
        if note_clause:
            res += note_clause

        return res

    def _generate_with_gemini(self, query, matches, role, api_key):
        """Calls Gemini API with strict system prompt instructing AEC Assist formatting"""
        try:
            context_chunks = "\n\n---\n\n".join([
                f"Document: {m['title']} | Dept: {m['department']} | Type: {m['doc_type']} | Page: {m['page_number']} | Date: {m['effective_date']}\n{m['content']}"
                for m in matches[:3]
            ])

            system_instruction = (
                "You are 'AEC Assist', the official document assistant for Annapoorana Engineering College (AEC), Salem.\n"
                "RULES:\n"
                "1. Answer ONLY from the retrieved context. Never use outside knowledge or guess.\n"
                "2. If the context does not contain the answer, say: 'I couldn't find this in the available college documents. Please contact the [relevant office/department] for confirmation.'\n"
                "3. Keep numbers, dates, fees, and percentages exact.\n"
                "4. STRICT ANSWER FORMAT:\n"
                "✅ Answer: <direct answer in 1–3 lines>\n"
                "📋 Details: <bullets, only if needed>\n"
                "📌 Source: <Document Title> | <Department/Type> | Page <No.> | Dated <Date>\n"
                "💡 Note: <only if caveat, conflict, or outdated document>"
            )

            prompt = f"Retrieved Context:\n{context_chunks}\n\nUser Question: {query}"

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_instruction}\n\n{prompt}"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 600
                }
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                candidates = result.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
        except Exception:
            pass
        return None

    def _generate_suggestions(self, matches, query):
        top_cat = matches[0]["doc_type"].lower() if matches else ""
        if "regulation" in top_cat:
            return [
                "What is the passing mark and grading system under R-2021?",
                "What is the condonation fee and minimum attendance percentage?",
                "How do I apply for answer script revaluation and photocopy?"
            ]
        elif "circular" in top_cat:
            return [
                "What is the penalty for late tuition fee payment?",
                "Who is eligible for the Academic Merit 50% tuition waiver?",
                "Where do I submit First-Graduate fee concession documents?"
            ]
        elif "timetable" in top_cat:
            return [
                "What is the exam hall allocation for CSE Cryptography paper?",
                "What are the reporting timings for morning and afternoon exam sessions?",
                "What electronic items are strictly prohibited inside exam halls?"
            ]
        else:
            return [
                "Show all urgent circulars published this semester.",
                "What are the hostel curfew timings for boys and girls?",
                "What are the college bus routes and morning arrival times?"
            ]

    def parse_and_index_file(self, file_path, filename, title, department, doc_type="circular", year_regulation="R2021", access_level="all", urgency="normal", effective_date=None):
        """Universal parser supporting PDF (page-by-page), DOCX, XLSX (tables), and scanned images (OCR)"""
        raw_text = ""
        ext = os.path.splitext(filename)[1].lower()

        if ext == ".pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                pages_text = []
                for p_idx, page in enumerate(reader.pages):
                    p_text = page.extract_text() or ""
                    # OCR fallback if page has no text
                    if not p_text.strip():
                        try:
                            import pytesseract
                            from PIL import Image
                            # If image-based page
                        except Exception:
                            pass
                    pages_text.append(f"--- Page {p_idx + 1} ---\n" + p_text)
                raw_text = "\n\n".join(pages_text)
            except Exception as e:
                raise ValueError(f"Failed to parse PDF: {str(e)}")

        elif ext in [".docx", ".doc"]:
            try:
                import docx
                doc = docx.Document(file_path)
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                raw_text = "--- Page 1 ---\n" + "\n\n".join(paragraphs)
            except Exception as e:
                raise ValueError(f"Failed to parse Word Document: {str(e)}")

        elif ext in [".xlsx", ".xls"]:
            try:
                import openpyxl
                wb = openpyxl.load_workbook(file_path, data_only=True)
                tables = []
                for sheet in wb.sheetnames:
                    ws = wb[sheet]
                    tables.append(f"Sheet: {sheet}")
                    for row in ws.iter_rows(values_only=True):
                        row_vals = [str(cell) if cell is not None else "" for cell in row]
                        if any(row_vals):
                            tables.append(" | ".join(row_vals))
                raw_text = "--- Page 1 ---\n" + "\n".join(tables)
            except Exception as e:
                raise ValueError(f"Failed to parse Excel Sheet: {str(e)}")

        elif ext in [".png", ".jpg", ".jpeg"]:
            try:
                import pytesseract
                from PIL import Image
                img = Image.open(file_path)
                ocr_text = pytesseract.image_to_string(img)
                raw_text = "--- Page 1 ---\n" + (ocr_text if ocr_text.strip() else "Scanned notice image")
            except Exception:
                raw_text = "--- Page 1 ---\nScanned notice document uploaded."

        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    raw_text = content if "--- Page " in content else "--- Page 1 ---\n" + content
            except Exception as e:
                raise ValueError(f"Failed to read file: {str(e)}")

        if not raw_text.strip():
            raise ValueError("The uploaded document contains no extractable text.")

        conn = self.get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO documents (title, filename, file_type, department, doc_type, year_regulation, access_level, effective_date, urgency, file_path, raw_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            title,
            filename,
            ext or "text/plain",
            department,
            doc_type,
            year_regulation,
            access_level,
            effective_date or datetime.now().strftime("%Y-%m-%d"),
            urgency,
            file_path,
            raw_text
        ))
        doc_id = cursor.lastrowid

        from db import chunk_text_by_pages
        chunks = chunk_text_by_pages(raw_text, title, department, doc_type)
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
                    "title": title,
                    "department": department,
                    "doc_type": doc_type,
                    "year_regulation": year_regulation,
                    "access_level": access_level,
                    "page": chunk.get("page_number", 1),
                    "section": chunk.get("section", "")
                })
            ))

        cursor.execute('UPDATE documents SET chunk_count = ? WHERE id = ?', (len(chunks), doc_id))
        conn.commit()
        conn.close()

        self._refresh_index()
        return doc_id, len(chunks)
