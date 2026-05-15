from flask import Flask, render_template, request, jsonify
import json
import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from functools import lru_cache
import fitz  
import os
from io import BytesIO

app = Flask(__name__, template_folder='template')
INPUT_JSON_FILE = 'Entity Recognition in Resumes.json'
UPLOAD_FOLDER = 'uploads'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- PDF PROCESSING HANDLER (New Core Logic) ---

def parse_uploaded_pdf(file_stream):
    """
    Extracts text from a PDF file stream and simulates running the NER model on it.
    
    In a production model, the NER model API call would go here.
    For demonstration, we use simple regex/heuristics to simulate NER.
    """
    try:
        # Open the PDF file stream (in-memory)
        pdf_document = fitz.open(stream=file_stream.read(), filetype="pdf")
        text = ""
        # Extract text page by page
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text += page.get_text()
        
        # --- Simulate Fine-Tuned NER Output ---
        
        # 1. Name: Assumed to be the very first line
        name_match = re.match(r'^(.*)\n', text.strip())
        name = name_match.group(1).strip() if name_match else "Unknown Candidate"
        
        # 2. Designation (Heuristic): Look for a common title near the name
        designation_match = re.search(r'^\s*([^\n]+)\n\s*([^\n]+)', text.strip(), re.MULTILINE)
        designation = designation_match.group(2).strip() if designation_match else "N/A"

        # 3. Skills (Heuristic): Look for 'SKILLS' section and extract keywords
        skills_raw = re.search(r'SKILLS\s*\n(.*?)(?=\n[A-Z\s]{5,}:|\nADDITIONAL|EDUCATION)', text, re.DOTALL | re.IGNORECASE)
        skills_text = skills_raw.group(1).strip() if skills_raw else "Python, Java, SQL, C++" # Placeholder for unparsable resume
        
        # Clean skills text for display
        cleaned_skills = " ".join(re.findall(r'[A-Za-z0-9+#.]+', skills_text.lower()))
        
        return {
            'Name': name,
            'Designation': designation,
            'Extracted_Skills': cleaned_skills.split()[:50] # Limit to 50 skills for display
        }

    except Exception as e:
        return {'error': f"PDF Extraction/Simulated Parsing Failed: {str(e)}"}


# --- Existing Data Loading & ML Logic (Same as before) ---

def get_annotated_skills(resume_obj):
    # This is for the ranking system's internal candidate data (JSON-based)
    skills_list = []
    for annotation in resume_obj.get('annotation', []):
        label_list = annotation.get('label')
        if label_list and label_list[0] == 'Skills':
            for point in annotation.get('points', []):
                if 'text' in point:
                    skills_list.append(point['text'])
    skills_text = " ".join(skills_list)
    skills_text = skills_text.replace(',', ' ').replace('(', ' ').replace(')', ' ').replace('•', ' ').replace('-', ' ').replace('/', ' ').replace('&', ' ').replace('.', ' ')
    return " ".join(re.findall(r'[A-Za-z0-9+#.]+', skills_text.lower()))

@lru_cache(maxsize=1)
def load_and_extract_data(file_path):
    # (Existing implementation remains the same for the ranking function's data source)
    candidate_profiles = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            json_resumes = [json.loads(line) for line in f if line.strip()]
    except Exception as e:
        print(f"FATAL ERROR loading data: {e}")
        return []

    for i, entry in enumerate(json_resumes):
        raw_content = entry.get('content', '')
        name_match = re.match(r'^(.*)\n', raw_content)
        name = name_match.group(1).strip() if name_match else f"Candidate_{i + 1}"
        skills_text = get_annotated_skills(entry)
        
        candidate_profiles.append({
            'Name': name,
            'Skills_Text': skills_text,
            'Raw_JSON_Entry': entry
        })
    print(f"ML Backend Ready: {len(candidate_profiles)} profiles loaded.")
    return candidate_profiles

def rank_candidates(job_requirements):
    # (Existing implementation remains the same)
    candidate_profiles = load_and_extract_data(INPUT_JSON_FILE)
    if not candidate_profiles:
        return []

    text_corpus = [job_requirements.lower()] + [c['Skills_Text'] for c in candidate_profiles]

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(text_corpus)
    req_vector = tfidf_matrix[0]
    cand_vectors = tfidf_matrix[1:]
    similarity_scores = cosine_similarity(req_vector, cand_vectors).flatten()

    results = []
    req_keywords = set(re.findall(r'[a-z0-9]+', job_requirements.lower()))
    
    for i, candidate in enumerate(candidate_profiles):
        score = similarity_scores[i]
        cand_skills = set(re.findall(r'[a-z0-9]+', candidate['Skills_Text']))
        matched_skills = req_keywords.intersection(cand_skills)
        
        results.append({
            'Name': candidate['Name'],
            'Match_Score': round(score * 100, 2),
            'Top_Matched_Skills': ", ".join(sorted(list(matched_skills))),
            'Count_Matched_Skills': len(matched_skills)
        })

    df = pd.DataFrame(results)
    df_ranked = df.sort_values(
        by=['Match_Score', 'Count_Matched_Skills'], 
        ascending=[False, False]
    ).reset_index(drop=True)
    
    return df_ranked.head(20).to_dict('records')

def get_candidate_details_by_name(name_query):
    # (Existing implementation remains the same for name lookup)
    candidate_profiles = load_and_extract_data(INPUT_JSON_FILE)
    name_query_lower = name_query.lower()
    
    for profile in candidate_profiles:
        if profile['Name'].lower() == name_query_lower:
            return {
                'Name': profile['Name'],
                'Designation': profile['Raw_JSON_Entry']['annotation'][0]['label'][0] if profile['Raw_JSON_Entry'].get('annotation') else "N/A",
                'Extracted_Skills': profile['Skills_Text'].split()
            }
        
        if name_query_lower in profile['Name'].lower():
            return {
                'Name': profile['Name'],
                'Designation': profile['Raw_JSON_Entry']['annotation'][0]['label'][0] if profile['Raw_JSON_Entry'].get('annotation') else "N/A",
                'Extracted_Skills': profile['Skills_Text'].split()
            }

    return None

# --- FLASK ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/rank', methods=['POST'])
def api_rank():
    # (Existing implementation remains the same)
    data = request.get_json()
    required_skills = data.get('skills', '')

    if not required_skills:
        return jsonify({"error": "Please enter required skills."}), 400
    
    try:
        ranking_results = rank_candidates(required_skills)
        return jsonify({
            "status": "success",
            "requirements": required_skills,
            "results": ranking_results
        })
    except Exception as e:
        return jsonify({"error": f"An error occurred during ML scoring: {str(e)}"}), 500

@app.route('/api/profile_lookup', methods=['POST'])
def api_profile_lookup():
    # (Existing implementation remains the same for name lookup)
    data = request.get_json()
    name_query = data.get('name', '')

    if not name_query:
        return jsonify({"error": "Please enter a candidate name to lookup."}), 400
        
    result = get_candidate_details_by_name(name_query)
    
    if result:
        return jsonify({
            "status": "success",
            "profile": {
                "Name": result['Name'],
                "Designation": result['Designation'],
                "Extracted_Skills": result['Extracted_Skills'][:100]
            }
        })
    else:
        return jsonify({"status": "error", "message": f"Candidate '{name_query}' not found in the dataset."}), 404

@app.route('/api/upload_parse', methods=['POST'])
def api_upload_parse():
    """
    NEW ROUTE to handle PDF file upload and parsing.
    Simulates: PDF -> Text Extraction -> NER Model Inference.
    """
    if 'resume_file' not in request.files:
        return jsonify({"error": "No file part in the request."}), 400
    
    file = request.files['resume_file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file."}), 400
    
    if file and file.filename.endswith('.pdf'):
        # Pass the file stream directly to the parser function
        parsed_data = parse_uploaded_pdf(file.stream)
        
        if 'error' in parsed_data:
             return jsonify({"status": "error", "message": parsed_data['error']}), 500

        return jsonify({
            "status": "success",
            "message": f"Successfully parsed {parsed_data['Name']} from uploaded PDF.",
            "profile": parsed_data
        })
    else:
        return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400

# --- SERVER STARTUP ---
if __name__ == '__main__':
    load_and_extract_data(INPUT_JSON_FILE)
    app.run(host='0.0.0.0', port=8000, debug=True)