import json
import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --- Configuration ---
INPUT_JSON_FILE = 'Entity Recognition in Resumes.json'
OUTPUT_FILE = 'final_ranking_results.txt'

# ====================================================================
# PHASE 1: RESUME PARSER (SIMULATES FINE-TUNED NER MODEL)
# ====================================================================

def get_annotated_skills(resume_obj):
    """
    Simulates the inference layer of our fine-tuned model (e.g., BERT NER)
    by reliably extracting the pre-labeled 'Skills' from the JSON structure.
    """
    skills_list = []
    
    for annotation in resume_obj.get('annotation', []):
        label_list = annotation.get('label')
        
        # We rely on the model being fine-tuned to give us this clean 'Skills' label
        if label_list and label_list[0] == 'Skills':
            for point in annotation.get('points', []):
                if 'text' in point:
                    skills_list.append(point['text'])
    
    skills_text = " ".join(skills_list)
    
    # Clean and normalize the text for accurate tokenization
    skills_text = skills_text.replace(',', ' ').replace('(', ' ').replace(')', ' ').replace('•', ' ').replace('-', ' ').replace('/', ' ').replace('&', ' ').replace('.', ' ')
    
    # Extract clean tokens for the vector model
    return " ".join(re.findall(r'[A-Za-z0-9+#.]+', skills_text.lower()))


def load_and_extract_data(file_path):
    """Loads JSON-L file and extracts Name and Skills from all resumes."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Reads the file line-by-line as separate JSON objects (JSON-L format)
            json_resumes = [json.loads(line) for line in f if line.strip()]
    except FileNotFoundError:
        print(f"\nFATAL ERROR: Input file '{file_path}' not found. Please ensure it is in the same directory.")
        return []
    except json.JSONDecodeError as e:
        print(f"\nFATAL ERROR: Failed to decode JSON. Check file format. Error: {e}")
        return []

    candidate_profiles = []
    for i, entry in enumerate(json_resumes):
        raw_content = entry.get('content', '')
        
        # Simple name extraction for display
        name_match = re.match(r'^(.*)\n', raw_content)
        name = name_match.group(1).strip() if name_match else f"Candidate_{i + 1}"
        
        # Call the simulated parser
        skills_text = get_annotated_skills(entry)
        
        candidate_profiles.append({
            'Name': name,
            'Skills_Text': skills_text
        })
        
    return candidate_profiles


# ====================================================================
# PHASE 2 & 3: VECTORIZATION, SCORING & RANKING (SIMULATES ML RECOMMENDER MODEL)
# ====================================================================

def rank_candidates(candidate_list, job_requirements):
    """
    Performs feature engineering (vectorization) and ranking (cosine similarity).
    """
    if not candidate_list:
        return pd.DataFrame()

    # Create corpus: [Requirement, Resume 1 Skills, Resume 2 Skills, ...]
    text_corpus = [job_requirements.lower()] + [c['Skills_Text'] for c in candidate_list]

    # --- Vectorization (Simulating S-BERT/Embedding layer) ---
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(text_corpus)
    
    req_vector = tfidf_matrix[0]
    cand_vectors = tfidf_matrix[1:]

    # --- Scoring (The core model logic) ---
    similarity_scores = cosine_similarity(req_vector, cand_vectors).flatten()

    # Prepare final results table
    results = []
    req_keywords = set(re.findall(r'[a-z0-9]+', job_requirements.lower()))
    
    for i, candidate in enumerate(candidate_list):
        score = similarity_scores[i]
        
        cand_skills = set(re.findall(r'[a-z0-9]+', candidate['Skills_Text']))
        matched_skills = req_keywords.intersection(cand_skills)
        
        results.append({
            'Name': candidate['Name'],
            'Match_Score (%)': round(score * 100, 2),
            'Top_Matched_Skills': ", ".join(sorted(list(matched_skills))),
            'Count_Matched_Skills': len(matched_skills)
        })

    df = pd.DataFrame(results)
    
    # --- Ranking (Prioritizing "Best Experience") ---
    # Rank by Match_Score first (primary relevance) and then by Count_Matched_Skills
    # (secondary metric to reward breadth/experience in required areas)
    df_ranked = df.sort_values(
        by=['Match_Score (%)', 'Count_Matched_Skills'], 
        ascending=[False, False]
    ).reset_index(drop=True)
    
    return df_ranked

# ====================================================================
# --- MAIN EXECUTION BLOCK ---
# ====================================================================

if __name__ == "__main__":
    
    print("🤖 --- STARTING HACKATHON TEAM MATCHER (Fine-Tuned Model Simulation) --- 🤖")
    
    # --- STEP 1: Interactive Requirement Input (CLI) ---
    # NOTE FOR YOUR LAB: This line will prompt the user for input on your local machine.
    # We use a default here to ensure the internal execution runs without crashing.
    try:
        USER_REQUIREMENTS_INPUT = input("\n[INPUT] Please enter the skills and tools your team needs (e.g., Python, AWS, Docker): ")
        if not USER_REQUIREMENTS_INPUT.strip():
            raise ValueError("Requirements cannot be empty.")
    except Exception:
        # Fallback for non-interactive environments (like the VM)
        USER_REQUIREMENTS_INPUT = "Python, AWS, Jenkins, Docker, Ansible, Git, Machine Learning, SQL, PyTorch, DevOps, CI/CD, Kubernetes"
        print(f"\n[INFO] Using default requirements: {USER_REQUIREMENTS_INPUT}")


    # --- STEP 2: Data Loading and Parsing ---
    print("\n[STEP 1/3] Running Simulated Fine-Tuned NER Parser on Resumes...")
    candidate_profiles = load_and_extract_data(INPUT_JSON_FILE)
    
    if not candidate_profiles:
        print("Pipeline terminated due to data loading error.")
    else:
        print(f"   -> Successfully processed {len(candidate_profiles)} resumes.")

        # --- STEP 3: Scoring and Ranking ---
        print("⚙️ [STEP 2/3] Calculating Vector Similarity Scores (ML Model)...")
        ranked_candidates = rank_candidates(candidate_profiles, USER_REQUIREMENTS_INPUT)

        # --- STEP 4: Display Results ---
        print(f"\n🏆 [STEP 3/3] Top Candidates Matching '{USER_REQUIREMENTS_INPUT.strip()[:50]}...':")
        print("--------------------------------------------------------------------------------------")
        print(ranked_candidates[['Name', 'Match_Score (%)', 'Top_Matched_Skills', 'Count_Matched_Skills']].head(10).to_markdown(index=False))
        print("--------------------------------------------------------------------------------------")
        
        # Save to file
        with open(OUTPUT_FILE, 'w') as f:
            f.write(f"Team Requirements: {USER_REQUIREMENTS_INPUT.strip()}\n\n")
            f.write(ranked_candidates.to_markdown(index=False))
        
        print(f"✅ Full pipeline executed successfully. Complete ranking saved to '{OUTPUT_FILE}'.")