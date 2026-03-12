import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, Building2, ArrowRight, CheckCircle2, X, Upload, Loader2, Calendar } from 'lucide-react';
import { supabase, isSupabaseReady } from '../../services/supabase';
import Modal from '../../components/ui/Modal';

const MOCK_JOBS = [
  { id: 1, position: 'Senior React Developer', department: 'Engineering', location: 'Casablanca', contract_type: 'Full-time', salary_range: '18K-22K MAD', description: 'Build and maintain React applications for the Flowly product suite. Work with modern technologies including React 18, TypeScript, and TailwindCSS.', requirements: '5+ years React experience, TypeScript proficiency, strong CSS skills', applicants_count: 12, created_at: '2026-01-20' },
  { id: 2, position: 'Product Manager', department: 'Product', location: 'Rabat', contract_type: 'Full-time', salary_range: '20K-25K MAD', description: 'Lead product strategy and roadmap for our SaaS platform. Define features, prioritize backlog, and work closely with engineering and design teams.', requirements: '3+ years product management, SaaS experience, excellent communication', applicants_count: 8, created_at: '2026-01-25' },
  { id: 3, position: 'UI/UX Designer', department: 'Design', location: 'Remote', contract_type: 'Full-time', salary_range: '14K-18K MAD', description: 'Design intuitive user experiences for enterprise software. Create wireframes, prototypes, and high-fidelity designs.', requirements: 'Figma expertise, portfolio required, enterprise software experience', applicants_count: 15, created_at: '2026-02-01' },
];

const inp = 'w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200';
const lbl = 'block text-sm font-semibold text-gray-700 mb-2';
const btnPrimary = 'px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary = 'px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Careers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cover_letter: '',
    linkedin_url: '',
    portfolio_url: '',
    experience_years: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    if (!isSupabaseReady) {
      setJobs(MOCK_JOBS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recrutements')
        .select('*')
        .eq('status', 'open')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs(MOCK_JOBS);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      cover_letter: '',
      linkedin_url: '',
      portfolio_url: '',
      experience_years: '',
    });
    setCvFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF and Word documents are allowed');
      return;
    }

    setCvFile(file);
  };

  const uploadCV = async (file, candidateId) => {
    if (!isSupabaseReady) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${candidateId}_${Date.now()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      setUploadProgress(30);

      const { data, error } = await supabase.storage
        .from('candidate-cvs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from('candidate-cvs')
        .getPublicUrl(filePath);

      setUploadProgress(100);

      return publicUrl;
    } catch (err) {
      console.error('CV upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cvFile) {
      alert('Please upload your CV');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      if (!isSupabaseReady) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSubmitted(true);
        setSubmitting(false);
        return;
      }

      setUploadProgress(10);

      const candidateData = {
        recrutement_id: selectedJob.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cover_letter: formData.cover_letter,
        linkedin_url: formData.linkedin_url,
        portfolio_url: formData.portfolio_url,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        applied_position: selectedJob.position,
        status: 'new',
        stage: 'HR Screen',
      };

      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert(candidateData)
        .select()
        .single();

      if (candidateError) throw candidateError;

      setUploadProgress(20);

      const cvUrl = await uploadCV(cvFile, candidate.id);

      if (cvUrl) {
        const { error: updateError } = await supabase
          .from('candidates')
          .update({ cv_url: cvUrl })
          .eq('id', candidate.id);

        if (updateError) throw updateError;
      }

      setSubmitted(true);
      
      setTimeout(() => {
        setShowApplyModal(false);
        setUploadProgress(0);
      }, 3000);

    } catch (err) {
      console.error('Application submission error:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <Briefcase size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Flowly Careers</h1>
                <p className="text-xs text-gray-500">Join our team</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-500 to-brand-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Build the Future of HR Tech</h2>
          <p className="text-xl text-brand-50 max-w-2xl mx-auto">
            Join our talented team and help transform how companies manage their workforce
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-brand-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>Remote-friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>Competitive salary</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>Growth opportunities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Open Positions</h3>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${jobs.length} position${jobs.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No open positions at the moment</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
                onClick={() => handleApplyClick(job)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-brand-600 transition-colors">
                      {job.position}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 size={14} />
                      <span>{job.department}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0">
                    <Briefcase size={20} className="text-white" />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400" />
                    <span>{job.contract_type}</span>
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign size={14} className="text-gray-400" />
                      <span>{job.salary_range}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>Posted {formatDate(job.created_at)}</span>
                  </div>
                  <button className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Apply <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Application Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => !submitting && setShowApplyModal(false)}
        title={submitted ? 'Application Submitted!' : `Apply for ${selectedJob?.position}`}
        maxWidth="max-w-2xl"
      >
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you for applying!</h3>
            <p className="text-gray-600 mb-6">
              We've received your application for <strong>{selectedJob?.position}</strong>.
              Our HR team will review it and get back to you soon.
            </p>
            <button
              onClick={() => setShowApplyModal(false)}
              className={btnPrimary}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className={inp}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className={lbl}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className={inp}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+212 6XX XXX XXX"
                  className={inp}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className={lbl}>Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  placeholder="5"
                  className={inp}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>LinkedIn Profile</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/johndoe"
                  className={inp}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className={lbl}>Portfolio URL</label>
                <input
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                  placeholder="https://portfolio.com"
                  className={inp}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Cover Letter / Motivation *</label>
              <textarea
                required
                rows={4}
                value={formData.cover_letter}
                onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                placeholder="Tell us why you're a great fit for this role..."
                className={inp + ' resize-none'}
                disabled={submitting}
              />
            </div>

            <div>
              <label className={lbl}>Upload CV/Resume * (PDF or Word, max 5MB)</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                  disabled={submitting}
                />
                <label
                  htmlFor="cv-upload"
                  className={`${inp} cursor-pointer flex items-center justify-between ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className={cvFile ? 'text-gray-900' : 'text-gray-400'}>
                    {cvFile ? cvFile.name : 'Choose file...'}
                  </span>
                  <Upload size={18} className="text-gray-400" />
                </label>
              </div>
              {cvFile && (
                <p className="text-xs text-gray-500 mt-1">
                  {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            {submitting && uploadProgress > 0 && (
              <div className="bg-brand-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-brand-700">Uploading...</span>
                  <span className="text-sm font-bold text-brand-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-brand-200 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className={btnSecondary}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={btnPrimary}
                disabled={submitting || !cvFile}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
