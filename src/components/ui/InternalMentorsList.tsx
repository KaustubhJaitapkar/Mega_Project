'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, User, Search, UserPlus, Mail, BookOpen, Building } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  email: string;
  department: string;
  expertise: string;
}

interface InternalMentorsListProps {
  mentors: Mentor[];
  onChange: (mentors: Mentor[]) => void;
}

export default function InternalMentorsList({
  mentors,
  onChange,
}: InternalMentorsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [availableMentors, setAvailableMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available mentors from the system
  useEffect(() => {
    const fetchMentors = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users?role=MENTOR');
        if (res.ok) {
          const data = await res.json();
          setAvailableMentors(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const addMentor = (mentorData?: any) => {
    const newMentor: Mentor = {
      id: `mentor-${Date.now()}`,
      name: mentorData?.name || '',
      email: mentorData?.email || '',
      department: mentorData?.department || '',
      expertise: mentorData?.expertise || '',
    };
    onChange([...mentors, newMentor]);
    setExpandedId(newMentor.id);
  };

  const updateMentor = (id: string, field: keyof Mentor, value: string) => {
    onChange(mentors.map(mentor =>
      mentor.id === id ? { ...mentor, [field]: value } : mentor
    ));
  };

  const removeMentor = (id: string) => {
    onChange(mentors.filter(mentor => mentor.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const filteredMentors = availableMentors.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedEmails = new Set(mentors.map(m => m.email));

  return (
    <div className="iml-container">
      <div className="iml-header">
        <div className="iml-title">
          <UserPlus size={18} />
          <span>Internal Mentors</span>
        </div>
        <span className="iml-count">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''} assigned</span>
      </div>

      <p className="iml-description">
        Add faculty or senior students as mentors for this hackathon.
        You can keep this list simple with just mentor details and expertise.
      </p>

      {/* Add from existing */}
      <div className="iml-search-section">
        <div className="iml-search-wrap">
          <Search size={16} className="iml-search-icon" />
          <input
            type="text"
            className="iml-search-input"
            placeholder="Search mentors to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery && (
          <div className="iml-search-results">
            {filteredMentors.length === 0 ? (
              <p className="iml-no-results">No mentors found</p>
            ) : (
              filteredMentors.slice(0, 5).map(mentor => {
                const isAssigned = assignedEmails.has(mentor.email);
                return (
                  <button
                    key={mentor.id}
                    type="button"
                    className={`iml-search-result ${isAssigned ? 'iml-search-result-assigned' : ''}`}
                    onClick={() => !isAssigned && addMentor(mentor)}
                    disabled={isAssigned}
                  >
                    <div className="iml-search-result-avatar">
                      {mentor.image ? (
                        <img src={mentor.image} alt="" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className="iml-search-result-info">
                      <span className="iml-search-result-name">{mentor.name}</span>
                      <span className="iml-search-result-email">{mentor.email}</span>
                    </div>
                    {isAssigned && <span className="iml-already-added">Added</span>}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Assigned mentors list */}
      {mentors.length === 0 ? (
        <div className="iml-empty">
          <div className="iml-empty-icon">👥</div>
          <p>No mentors assigned yet</p>
          <p className="iml-empty-hint">Search for mentors above or add manually</p>
        </div>
      ) : (
        <div className="iml-list">
          {mentors.map((mentor, index) => (
            <div
              key={mentor.id}
              className={`iml-card ${expandedId === mentor.id ? 'iml-card-expanded' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="iml-card-header"
                onClick={() => setExpandedId(expandedId === mentor.id ? null : mentor.id)}
              >
                <div className="iml-card-avatar">
                  <User size={20} />
                </div>
                <div className="iml-card-info">
                  <span className="iml-card-name">{mentor.name || 'Unnamed Mentor'}</span>
                  <span className="iml-card-dept">{mentor.department || mentor.expertise || mentor.email || 'No details'}</span>
                </div>
              </div>

              {expandedId === mentor.id && (
                <div className="iml-card-body">
                  <div className="iml-fields">
                    <div className="iml-field">
                      <label className="iml-field-label">
                        <User size={14} />
                        Name
                      </label>
                      <input
                        type="text"
                        className="org-input"
                        placeholder="Mentor name"
                        value={mentor.name}
                        onChange={(e) => updateMentor(mentor.id, 'name', e.target.value)}
                      />
                    </div>

                    <div className="iml-field">
                      <label className="iml-field-label">
                        <Mail size={14} />
                        Email
                      </label>
                      <input
                        type="email"
                        className="org-input"
                        placeholder="mentor@college.edu"
                        value={mentor.email}
                        onChange={(e) => updateMentor(mentor.id, 'email', e.target.value)}
                      />
                    </div>

                    <div className="iml-field">
                      <label className="iml-field-label">
                        <Building size={14} />
                        Department
                      </label>
                      <input
                        type="text"
                        className="org-input"
                        placeholder="e.g., Computer Science"
                        value={mentor.department}
                        onChange={(e) => updateMentor(mentor.id, 'department', e.target.value)}
                      />
                    </div>

                    <div className="iml-field">
                      <label className="iml-field-label">
                        <BookOpen size={14} />
                        Expertise
                      </label>
                      <input
                        type="text"
                        className="org-input"
                        placeholder="e.g., Machine Learning, Web Development"
                        value={mentor.expertise}
                        onChange={(e) => updateMentor(mentor.id, 'expertise', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="iml-card-actions">
                    <button
                      type="button"
                      className="iml-remove-btn"
                      onClick={() => removeMentor(mentor.id)}
                    >
                      <Trash2 size={14} />
                      <span>Remove Mentor</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button type="button" className="iml-add-btn" onClick={() => addMentor()}>
        <Plus size={16} />
        <span>Add Mentor Manually</span>
      </button>
    </div>
  );
}
