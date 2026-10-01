import os
import json
import sqlite3
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from db import init_db, DB_PATH, seed_aec_salem_data, get_db_connection
from rag_engine import CampusRAGEngine
from evaluation_suite import run_evaluation_benchmark

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32 MB max upload

# Initialize database
init_db()

# Initialize RAG Engine
rag_engine = CampusRAGEngine(DB_PATH)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'doc', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'md'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = [
        "Academic Regulations",
        "Circulars & Notices",
        "Examination & Timetables",
        "Fee Structure & Scholarships",
        "Placements & Internships",
        "Hostel & Transport",
        "Faculty & Staff Service Rules",
        "Campus Facilities & Library"
    ]
    departments = [
        "All Departments",
        "Computer Science & Engineering (CSE)",
        "Artificial Intelligence & Data Science (AI&DS)",
        "Information Technology (IT)",
        "Electronics & Communication (ECE)",
        "Electrical & Electronics (EEE)",
        "Mechanical Engineering (MECH)",
        "Automobile Engineering",
        "Civil Engineering (CIVIL)",
        "Biomedical Engineering (BME)",
        "Science & Humanities (S&H)",
        "Academic Affairs",
        "Anna University Examination Cell",
        "Finance & Accounts Section",
        "Training & Placement Cell",
        "Hostel Administration",
        "Campus Transportation",
        "Library Services",
        "Administration & HR"
    ]
    return jsonify({
        "categories": categories,
        "departments": departments,
        "roles": ["student", "staff", "admin"]
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    query = data.get('query', '').strip()
    role = data.get('role', 'student')
    category = data.get('category', None)
    department = data.get('department', None)
    session_id = data.get('session_id', 'default_session')

    if not query:
        return jsonify({"error": "Query cannot be empty"}), 400

    result = rag_engine.ask(
        query=query,
        role=role,
        category=category,
        department=department,
        session_id=session_id
    )
    return jsonify(result)

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json() or {}
    chat_id = data.get('chat_id')
    question = data.get('question', '')
    rating = data.get('rating', 'up')  # 'up' or 'down'
    comment = data.get('comment', '')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO feedback (chat_id, question, rating, comment)
        VALUES (?, ?, ?, ?)
    ''', (chat_id, question, rating, comment))
    conn.commit()
    conn.close()

    return jsonify({"message": "Thank you for your feedback!"})

@app.route('/api/unanswered', methods=['GET'])
def get_unanswered_queries():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, query, user_role, department, timestamp
        FROM unanswered_queries
        ORDER BY id DESC LIMIT 50
    ''')
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route('/api/benchmark', methods=['GET', 'POST'])
def run_benchmark():
    metrics = run_evaluation_benchmark(DB_PATH)
    return jsonify(metrics)

@app.route('/api/search', methods=['GET'])
def search_passages():
    query = request.args.get('q', '').strip()
    role = request.args.get('role', 'student')
    category = request.args.get('category', None)
    department = request.args.get('department', None)
    top_k = int(request.args.get('top_k', 5))

    if not query:
        return jsonify([])

    results = rag_engine.retrieve(
        query=query,
        role=role,
        category=category,
        department=department,
        top_k=top_k
    )
    return jsonify(results)

@app.route('/api/documents', methods=['GET'])
def get_documents():
    category = request.args.get('category')
    department = request.args.get('department')
    role = request.args.get('role')
    search = request.args.get('search', '').strip().lower()

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        SELECT id, title, filename, file_type, department, doc_type, year_regulation, access_level,
               effective_date, urgency, chunk_count, uploaded_at
        FROM documents WHERE 1=1
    '''
    params = []

    if category and category.lower() != 'all':
        query += ' AND (doc_type = ? OR department = ?)'
        params.extend([category, category])

    if department and department.lower() != 'all':
        query += ' AND department = ?'
        params.append(department)

    if role and role.lower() != 'all' and role.lower() != 'admin':
        query += ' AND (access_level = ? OR access_level = "all")'
        params.append(role)

    if search:
        query += ' AND (LOWER(title) LIKE ? OR LOWER(department) LIKE ? OR LOWER(raw_text) LIKE ?)'
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])

    query += ' ORDER BY CASE WHEN urgency = "urgent" THEN 0 ELSE 1 END, id DESC'

    cursor.execute(query, params)
    docs = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(docs)

@app.route('/api/documents/<int:doc_id>', methods=['GET'])
def get_document_detail(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM documents WHERE id = ?', (doc_id,))
    doc_row = cursor.fetchone()
    if not doc_row:
        conn.close()
        return jsonify({"error": "Document not found"}), 404

    doc = dict(doc_row)

    cursor.execute('''
        SELECT chunk_index, page_number, content, metadata_json
        FROM document_chunks WHERE document_id = ?
        ORDER BY chunk_index ASC
    ''', (doc_id,))
    chunks = [dict(row) for row in cursor.fetchall()]
    doc['chunks'] = chunks

    conn.close()
    return jsonify(doc)

@app.route('/api/documents', methods=['POST'])
def create_or_upload_document():
    if request.content_type and 'multipart/form-data' in request.content_type:
        title = request.form.get('title', '').strip()
        department = request.form.get('department', 'General Administration').strip()
        doc_type = request.form.get('doc_type', 'circular').strip()
        year_regulation = request.form.get('year_regulation', 'R2021').strip()
        access_level = request.form.get('access_level', 'all').strip()
        urgency = request.form.get('urgency', 'normal').strip()
        effective_date = request.form.get('effective_date', '').strip()

        file = request.files.get('file')
        raw_text_content = request.form.get('raw_text', '').strip()

        if not title:
            return jsonify({"error": "Document title is required"}), 400

        if file and file.filename:
            if not allowed_file(file.filename):
                return jsonify({"error": "Invalid file type. Allowed: .pdf, .docx, .xlsx, .png, .jpg, .txt, .md"}), 400
            
            orig_filename = secure_filename(file.filename)
            saved_filename = f"{int(os.times().elapsed)}_{orig_filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
            file.save(save_path)

            try:
                doc_id, chunk_count = rag_engine.parse_and_index_file(
                    file_path=save_path,
                    filename=orig_filename,
                    title=title,
                    department=department,
                    doc_type=doc_type,
                    year_regulation=year_regulation,
                    access_level=access_level,
                    urgency=urgency,
                    effective_date=effective_date
                )
                return jsonify({
                    "message": "File uploaded and indexed successfully",
                    "id": doc_id,
                    "chunk_count": chunk_count
                }), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        elif raw_text_content:
            temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"notice_{title[:20]}.txt")
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(raw_text_content)

            try:
                doc_id, chunk_count = rag_engine.parse_and_index_file(
                    file_path=temp_path,
                    filename=f"{title}.txt",
                    title=title,
                    department=department,
                    doc_type=doc_type,
                    year_regulation=year_regulation,
                    access_level=access_level,
                    urgency=urgency,
                    effective_date=effective_date
                )
                return jsonify({
                    "message": "Notice published and indexed successfully",
                    "id": doc_id,
                    "chunk_count": chunk_count
                }), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        else:
            return jsonify({"error": "Please provide a document file or enter notice text"}), 400

    else:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        raw_text = data.get('raw_text', '').strip()
        department = data.get('department', 'General Administration').strip()
        doc_type = data.get('doc_type', 'circular').strip()
        year_regulation = data.get('year_regulation', 'R2021').strip()
        access_level = data.get('access_level', 'all').strip()
        urgency = data.get('urgency', 'normal').strip()
        effective_date = data.get('effective_date', '').strip()

        if not title or not raw_text:
            return jsonify({"error": "Title and text content are required"}), 400

        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"notice_{title[:20]}.txt")
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(raw_text)

        try:
            doc_id, chunk_count = rag_engine.parse_and_index_file(
                file_path=temp_path,
                filename=f"{title}.txt",
                title=title,
                department=department,
                doc_type=doc_type,
                year_regulation=year_regulation,
                access_level=access_level,
                urgency=urgency,
                effective_date=effective_date
            )
            return jsonify({
                "message": "Notice created and indexed successfully",
                "id": doc_id,
                "chunk_count": chunk_count
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
    cursor.execute('DELETE FROM document_chunks WHERE document_id = ?', (doc_id,))
    conn.commit()
    conn.close()

    rag_engine._refresh_index()
    return jsonify({"message": "Document deleted successfully"})

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) FROM documents')
    total_docs = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(*) FROM document_chunks')
    total_chunks = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(*) FROM search_analytics')
    total_searches = cursor.fetchone()[0]

    cursor.execute('SELECT AVG(top_similarity) FROM search_analytics WHERE matched_count > 0')
    avg_score_row = cursor.fetchone()[0]
    avg_confidence = round((avg_score_row or 0.0) * 100, 1)

    cursor.execute('SELECT department, COUNT(*) as count FROM documents GROUP BY department ORDER BY count DESC')
    dept_distribution = [dict(row) for row in cursor.fetchall()]

    cursor.execute('SELECT doc_type as category, COUNT(*) as count FROM documents GROUP BY doc_type ORDER BY count DESC')
    cat_distribution = [dict(row) for row in cursor.fetchall()]

    cursor.execute('''
        SELECT query, user_role, matched_count, top_similarity, timestamp
        FROM search_analytics
        ORDER BY id DESC LIMIT 10
    ''')
    recent_searches = [dict(row) for row in cursor.fetchall()]

    cursor.execute('SELECT COUNT(*) FROM unanswered_queries')
    total_unanswered = cursor.fetchone()[0]

    conn.close()

    return jsonify({
        "total_documents": total_docs,
        "total_chunks": total_chunks,
        "total_searches": total_searches,
        "total_unanswered": total_unanswered,
        "avg_confidence": avg_confidence,
        "dept_distribution": dept_distribution,
        "cat_distribution": cat_distribution,
        "recent_searches": recent_searches
    })

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    session_id = request.args.get('session_id', 'default_session')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, user_role, question, answer, intent, sources_json, confidence, timestamp
        FROM chat_history
        WHERE session_id = ?
        ORDER BY id ASC LIMIT 50
    ''', (session_id,))
    rows = cursor.fetchall()
    conn.close()

    history = []
    for r in rows:
        d = dict(r)
        d['sources'] = json.loads(d['sources_json']) if d['sources_json'] else []
        history.append(d)
    return jsonify(history)

@app.route('/api/chat/history', methods=['DELETE'])
def clear_chat_history():
    session_id = request.args.get('session_id', 'default_session')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM chat_history WHERE session_id = ?', (session_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Chat history cleared"})

@app.route('/api/settings', methods=['GET', 'POST'])
def manage_settings():
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.get_json() or {}
        key = data.get('key')
        value = data.get('value', '').strip()
        if key:
            cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, value))
            conn.commit()
        conn.close()
        return jsonify({"message": "Setting updated successfully"})

    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()

    settings_dict = {}
    for r in rows:
        val = r['value']
        if r['key'] == 'gemini_api_key' and val:
            settings_dict[r['key']] = val[:4] + "..." + val[-4:] if len(val) > 8 else "***"
            settings_dict['has_gemini_key'] = True
        else:
            settings_dict[r['key']] = val

    if 'has_gemini_key' not in settings_dict:
        settings_dict['has_gemini_key'] = bool(os.environ.get("GEMINI_API_KEY"))

    return jsonify(settings_dict)

@app.route('/api/reset-sample', methods=['POST'])
def reset_sample_data():
    init_db(force_reseed=True)
    rag_engine._refresh_index()
    return jsonify({"message": "Annapoorana Engineering College knowledge base restored with sample official documents."})

if __name__ == '__main__':
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    print("==========================================================================")
    print(" [AEC Assist] Annapoorana Engineering College Document Assistant          ")
    print(" Serving at: http://127.0.0.1:5000                                        ")
    print("==========================================================================")
    app.run(host='0.0.0.0', port=5000, debug=True)
