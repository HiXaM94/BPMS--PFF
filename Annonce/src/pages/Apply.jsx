import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobs } from '../data/jobs';
import { ArrowLeft, UploadCloud, CheckCircle, FileText } from 'lucide-react';

export default function Apply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = jobs.find((j) => j.id === id);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    coverLetter: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!job) return <div className="text-center py-20 text-2xl font-bold">Job Not Found</div>;

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload a PDF file.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a PDF file.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError('CV upload is required.');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000); // Redirect after success
    }, 1500);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-32 px-4 text-center">
        <div className="bg-emerald-50 rounded-3xl p-12 border border-emerald-100 shadow-xl inline-block w-full">
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6 drop-shadow-sm" />
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Application Submitted!</h2>
          <p className="text-lg text-emerald-800 font-medium">Thank you for applying to the <span className="font-bold">{job.title}</span> position.</p>
          <p className="text-slate-500 mt-4">Redirecting you back to jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to={`/job/${job.id}`} className="inline-flex items-center text-slate-500 hover:text-black font-medium mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to job details
      </Link>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-black p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-neutral-800 rounded-full blur-3xl opacity-50"></div>
          <h1 className="text-3xl font-black mb-2 relative z-10">{job.title}</h1>
          <p className="text-neutral-300 relative z-10 font-medium text-lg">Submit your application</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Full Name *</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-slate-50 focus:bg-white text-slate-900"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Email Address *</label>
              <input
                required
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-slate-50 focus:bg-white text-slate-900"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Phone Number *</label>
              <input
                required
                type="tel"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-slate-50 focus:bg-white text-slate-900"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">LinkedIn Profile</label>
              <input
                type="url"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-slate-50 focus:bg-white text-slate-900"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedin}
                onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Cover Letter *</label>
            <textarea
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black focus:border-black outline-none transition resize-none bg-slate-50 focus:bg-white text-slate-900"
              placeholder="Tell us why you're a great fit for this role..."
              value={formData.coverLetter}
              onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Upload CV/Resume *</label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-slate-50 ${
                file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 hover:border-black hover:bg-neutral-50'
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                id="resume-upload"
                onChange={handleFileChange}
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                {file ? (
                  <>
                    <FileText className="w-12 h-12 text-emerald-500 mb-3" />
                    <span className="text-emerald-700 font-bold text-lg">{file.name}</span>
                    <span className="text-emerald-600/70 text-sm mt-1 cursor-pointer font-medium hover:underline">Change file</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                    <span className="text-slate-700 font-bold mb-1">Click to upload or drag to drop</span>
                    <span className="text-slate-500 text-sm">PDF format only (Max. 5MB)</span>
                  </>
                )}
              </label>
            </div>
            {error && <p className="text-red-500 text-sm font-semibold mt-2 flex items-center gap-1">⚠️ {error}</p>}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-neutral-800 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-black/20 disabled:opacity-75 disabled:cursor-not-allowed text-lg tracking-wide flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
