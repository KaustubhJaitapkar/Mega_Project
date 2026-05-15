from flask import Flask, render_template, request, jsonify
import json
import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__, template_folder='template')
INPUT_JSON_FILE = 'Entity Recognition in Resumes.json'
CANDIDATE_PROFILES = []

# ====================================================================
# ML Pipeline Functions (The core logic is moved into helper functions)
# ====================================================================

# [PHASE 1: RESUME PARSER - SIMULATES FINE-TUNED NER MODEL]
def get_annotated_skills(resume_obj):
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

def load_and_extract_data(file_path):
    global CANDIDATE_PROFILES
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            json_resumes = [json.loads(line) for line in f if line.strip()]
    except Exception as e:
        print(f"Error loading data: {e}")
        return
    
    for i, entry in enumerate(json_resumes):
        raw_content = entry.get('content', '')
        name_match = re.match(r'^(.*)\n', raw_content)
        name = name_match.group(1).strip() if name_match else f"Candidate_{i + 1}"
        skills_text = get_annotated_skills(entry)
        
        CANDIDATE_PROFILES.append({
            'Name': name,
            'Skills_Text': skills_text
        })
    print(f"Data Loaded: {len(CANDIDATE_PROFILES)} candidate profiles extracted.")

# [PHASE 2 & 3: VECTORIZATION, SCORING & RANKING]
def rank_candidates(job_requirements):
    if not CANDIDATE_PROFILES:
        return []

    # Prepare corpus for vectorization
    text_corpus = [job_requirements.lower()] + [c['Skills_Text'] for c in CANDIDATE_PROFILES]

    # Vectorization (Simulated Embedding)
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(text_corpus)
    req_vector = tfidf_matrix[0]
    cand_vectors = tfidf_matrix[1:]

    # Scoring (Cosine Similarity)
    similarity_scores = cosine_similarity(req_vector, cand_vectors).flatten()

    results = []
    req_keywords = set(re.findall(r'[a-z0-9]+', job_requirements.lower()))
    
    for i, candidate in enumerate(CANDIDATE_PROFILES):
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
    
    # Ranking Logic
    df_ranked = df.sort_values(
        by=['Match_Score', 'Count_Matched_Skills'], 
        ascending=[False, False]
    ).reset_index(drop=True)
    
    # Convert to a list of dictionaries for JSON response
    return df_ranked.head(20).to_dict('records') # Only return top 20 matches

# ====================================================================
# Flask Routes (The Web Interface)
# ====================================================================

@app.route('/')
def index():
    # Serves the HTML frontend
    return render_template('index.html')

@app.route('/rank', methods=['POST'])
def handle_ranking_request():
    # Handles the AJAX request from the web page
    data = request.get_json()
    required_skills = data.get('skills', '')

    if not required_skills:
        return jsonify({"error": "Please enter required skills."}), 400
    
    # Runs the core ML logic
    ranking_results = rank_candidates(required_skills)
    
    return jsonify({
        "status": "success",
        "requirements": required_skills,
        "results": ranking_results
    })

# Load the data once when the server starts
load_and_extract_data(INPUT_JSON_FILE)

# In app.py, change the last line:
if __name__ == '__main__':
    load_and_extract_data(INPUT_JSON_FILE)
    app.run(debug=True, port=5000)