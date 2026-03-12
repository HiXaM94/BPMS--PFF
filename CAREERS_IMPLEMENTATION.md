# Job Posting & Candidate Application System

## Overview
This feature provides a **public-facing careers page** where candidates can view job openings and submit applications with their CVs. All applications are automatically integrated into the HR dashboard for review and management.

## Features Implemented

### 1. Public Careers Page (`/careers`)
- **URL**: `http://localhost:5173/careers` (or your domain)
- **Access**: Public (no authentication required)
- **Features**:
  - Clean, modern UI with company branding
  - List of all open job positions
  - Job details including:
    - Position title
    - Department
    - Location
    - Contract type (Full-time, Part-time, etc.)
    - Salary range
    - Description and requirements
    - Number of applicants
    - Posted date
  - Mobile-responsive design
  - Real-time job data from Supabase

### 2. Candidate Application Form
- **Trigger**: Click "Apply" button on any job posting
- **Required Fields**:
  - Full Name
  - Email
  - Phone
  - Cover Letter/Motivation
  - CV/Resume (PDF or Word, max 5MB)
- **Optional Fields**:
  - Years of Experience
  - LinkedIn Profile URL
  - Portfolio URL
- **Features**:
  - File validation (type and size)
  - Upload progress indicator
  - Success confirmation
  - Automatic submission to HR dashboard

### 3. HR Dashboard Integration
- **Location**: `/recruitment` page (HR/Admin access only)
- **Enhanced Features**:
  - View all candidate applications
  - Download candidate CVs directly
  - View detailed candidate profiles including:
    - Contact information
    - Cover letter
    - LinkedIn and portfolio links
    - Years of experience
    - Application date
  - AI scoring integration (existing feature)
  - Candidate pipeline management

## Database Schema Updates

### New Migration: `20260312100000_public_job_applications.sql`

**Tables Modified**:

1. **`recrutements` table** - Added fields:
   - `position` (TEXT) - Job title
   - `department` (TEXT) - Department name
   - `contract_type` (TEXT) - Full-time, Part-time, etc.
   - `salary_range` (TEXT) - Salary information
   - `closing_date` (DATE) - Application deadline
   - `applicants_count` (INTEGER) - Auto-incremented count
   - `shortlisted_count` (INTEGER) - Shortlisted candidates
   - `is_public` (BOOLEAN) - Whether job is visible publicly

2. **`candidates` table** - Added fields:
   - `applied_position` (TEXT) - Position applied for
   - `score` (INTEGER) - AI-generated score (0-100)
   - `cover_letter` (TEXT) - Candidate motivation
   - `portfolio_url` (TEXT) - Portfolio link

**Storage Bucket**:
- **Name**: `candidate-cvs`
- **Access**: Private (authenticated users only can view)
- **Upload**: Public (anyone can upload during application)

**Triggers**:
- Auto-increment `applicants_count` when candidate applies
- Auto-decrement `applicants_count` when candidate is deleted

## Security & RLS Policies

### Public Access
```sql
-- Anyone can view open public jobs
CREATE POLICY "Anyone can view public open jobs"
ON recrutements FOR SELECT
TO anon, authenticated
USING (status = 'open' AND is_public = true);

-- Anyone can submit applications
CREATE POLICY "Anyone can submit applications"
ON candidates FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

### HR/Admin Access
```sql
-- HR and Admin can view all candidates
CREATE POLICY "HR and Admin can view all candidates"
ON candidates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);
```

### Storage Policies
- Anonymous users can upload CVs during application
- Authenticated users (HR/Admin) can view CVs
- HR/Admin can delete CVs

## File Structure

```
src/
├── pages/
│   ├── public/
│   │   └── Careers.jsx          # Public careers page
│   └── modules/
│       └── Recruitment.jsx      # Enhanced HR dashboard
├── router/
│   └── index.jsx                # Added /careers route
└── services/
    └── supabase.js              # Database connection

supabase/
└── migrations/
    └── 20260312100000_public_job_applications.sql
```

## Setup Instructions

### 1. Run Database Migration

```bash
# Navigate to your project directory
cd d:\pfe-main\pfe-main

# Run the migration using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard SQL Editor
# Copy contents of: supabase/migrations/20260312100000_public_job_applications.sql
```

### 2. Create Storage Bucket (if not auto-created)

In Supabase Dashboard:
1. Go to **Storage** → **Create bucket**
2. Name: `candidate-cvs`
3. Public: **No** (private)
4. Apply the storage policies from the migration

### 3. Test the Application

#### A. Post a Job (HR Dashboard)
1. Login as HR or Admin user
2. Navigate to `/recruitment`
3. Click "Post New Job"
4. Fill in job details:
   - Job Title: "Senior React Developer"
   - Department: "Engineering"
   - Location: "Casablanca"
   - Type: "Full-time"
   - Salary: 18K-22K MAD
   - Description: Job requirements and responsibilities
5. Click "Post Job"

#### B. Apply for Job (Public Page)
1. Open browser (can be incognito/private mode)
2. Navigate to `http://localhost:5173/careers`
3. Click on a job posting
4. Fill in application form:
   - Name, Email, Phone
   - Cover Letter
   - Upload CV (PDF or Word)
   - Optional: LinkedIn, Portfolio, Experience
5. Click "Submit Application"
6. Verify success message

#### C. Review Application (HR Dashboard)
1. Login as HR/Admin
2. Navigate to `/recruitment`
3. Scroll to "Active Candidates" section
4. See new application appear
5. Click "View" icon to see full profile
6. Click "Download" icon to get CV
7. Review cover letter, links, and details

## Usage Examples

### Sharing the Careers Page

**Public URL**: `https://yourdomain.com/careers`

You can:
- Add link to company website footer
- Share on social media
- Include in job board postings
- Email to potential candidates
- Add QR code on recruitment materials

### Managing Applications

**HR Workflow**:
1. Candidate submits application via `/careers`
2. Application appears in `/recruitment` dashboard
3. HR reviews candidate profile and CV
4. HR updates candidate stage (HR Screen → Interview → Offer)
5. HR can use AI scoring for candidate ranking
6. HR can move candidate through pipeline
7. HR can delete or archive candidates

## Customization Options

### Branding
Edit `src/pages/public/Careers.jsx`:
- Update company logo and colors
- Modify hero section text
- Add company benefits/perks
- Customize job card design

### Job Fields
Add more fields to job postings:
1. Update migration to add columns
2. Update `Recruitment.jsx` form
3. Update `Careers.jsx` display

### Application Fields
Add custom questions:
1. Update `Careers.jsx` form
2. Update `candidates` table schema
3. Update HR dashboard to display new fields

## Troubleshooting

### Issue: Jobs not appearing on careers page
**Solution**:
- Check job status is `'open'`
- Check `is_public` is `true`
- Verify RLS policies are applied
- Check browser console for errors

### Issue: CV upload fails
**Solution**:
- Verify storage bucket `candidate-cvs` exists
- Check storage policies are applied
- Ensure file is PDF or Word format
- Ensure file is under 5MB
- Check Supabase storage quota

### Issue: Application not appearing in HR dashboard
**Solution**:
- Check RLS policies for candidates table
- Verify user has HR or ADMIN role
- Clear cache and refresh page
- Check browser console for errors

### Issue: CV download not working
**Solution**:
- Verify storage bucket is configured
- Check user is authenticated
- Verify RLS policies allow SELECT on storage
- Check `cv_url` field is populated

## API Endpoints Used

### Fetch Public Jobs
```javascript
const { data } = await supabase
  .from('recrutements')
  .select('*')
  .eq('status', 'open')
  .eq('is_public', true)
  .order('created_at', { ascending: false });
```

### Submit Application
```javascript
const { data } = await supabase
  .from('candidates')
  .insert({
    recrutement_id: jobId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+212 6XX XXX XXX',
    cover_letter: 'I am interested...',
    // ... other fields
  })
  .select()
  .single();
```

### Upload CV
```javascript
const { data } = await supabase.storage
  .from('candidate-cvs')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### Fetch Candidates (HR)
```javascript
const { data } = await supabase
  .from('candidates')
  .select('*')
  .order('created_at', { ascending: false });
```

## Performance Considerations

- **Caching**: Job listings are cached for 2 minutes
- **Pagination**: Consider adding pagination for 100+ jobs
- **File Size**: 5MB limit prevents storage bloat
- **Indexes**: Database indexes on status and is_public for fast queries

## Future Enhancements

### Potential Features
- [ ] Email notifications to HR on new applications
- [ ] Candidate application tracking portal
- [ ] Multi-step application process
- [ ] Video introduction uploads
- [ ] Automated screening questions
- [ ] Interview scheduling integration
- [ ] Applicant tracking system (ATS) integration
- [ ] Job alerts for candidates
- [ ] Social media sharing buttons
- [ ] Analytics dashboard for recruitment metrics

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase logs
3. Check browser console errors
4. Verify database schema matches migration
5. Test with mock data first

---

**Implementation Date**: March 12, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
