CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_status AS ENUM ('invited', 'active', 'suspended', 'deactivated');
CREATE TYPE publication_type AS ENUM (
    'journal_article',
    'conference_paper',
    'book',
    'book_chapter',
    'technical_report',
    'thesis',
    'dissertation',
    'working_paper',
    'other'
);
CREATE TYPE record_status AS ENUM (
    'draft',
    'submitted',
    'department_review',
    'faculty_review',
    'iptto_review',
    'approved',
    'rejected',
    'published',
    'archived'
);
CREATE TYPE access_level AS ENUM ('public', 'restricted', 'private');
CREATE TYPE file_purpose AS ENUM (
    'research_document',
    'publication',
    'innovation_support',
    'patent_support',
    'profile_image',
    'other'
);
CREATE TYPE innovation_status AS ENUM (
    'draft',
    'under_review',
    'approved',
    'published',
    'archived'
);
CREATE TYPE patent_status AS ENUM (
    'idea_disclosure',
    'prior_art_search',
    'filed',
    'pending',
    'granted',
    'licensed',
    'abandoned'
);
CREATE TYPE commercialization_type AS ENUM (
    'licensing',
    'partnership',
    'spinout',
    'industry_engagement',
    'grant',
    'milestone',
    'other'
);
CREATE TYPE review_decision AS ENUM ('approved', 'changes_requested', 'rejected');
CREATE TYPE approval_action AS ENUM (
    'submitted',
    'approved',
    'rejected',
    'changes_requested',
    'published',
    'archived'
);

CREATE TABLE auth_user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    username VARCHAR(64) UNIQUE,
    display_username VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_session (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider_id, account_id)
);

CREATE TABLE auth_verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX auth_session_user_id_idx ON auth_session(user_id);
CREATE INDEX auth_account_user_id_idx ON auth_account(user_id);
CREATE INDEX auth_verification_identifier_idx ON auth_verification(identifier);

CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(32) UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(32) UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(320) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status user_status NOT NULL DEFAULT 'invited',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_signed_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title VARCHAR(64),
    bio TEXT,
    research_interests TEXT[],
    orcid VARCHAR(32),
    phone VARCHAR(64),
    public_email VARCHAR(320),
    avatar_file_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(96) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(160) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    assigned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(80) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    payload JSONB NOT NULL DEFAULT '{}',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

CREATE INDEX background_jobs_status_idx ON background_jobs(status);
CREATE INDEX background_jobs_type_idx ON background_jobs(type);
CREATE INDEX background_jobs_updated_at_idx ON background_jobs(updated_at);

CREATE TABLE rate_limit_windows (
    key TEXT PRIMARY KEY,
    bucket VARCHAR(80) NOT NULL,
    identity TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX rate_limit_windows_bucket_reset_idx ON rate_limit_windows(bucket, reset_at);

CREATE TABLE research_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(520) NOT NULL UNIQUE,
    abstract TEXT NOT NULL,
    status record_status NOT NULL DEFAULT 'draft',
    access_level access_level NOT NULL DEFAULT 'public',
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    research_area VARCHAR(255),
    started_on DATE,
    completed_on DATE,
    published_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320),
    affiliation VARCHAR(255),
    orcid VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE research_authors (
    research_record_id UUID NOT NULL REFERENCES research_records(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    is_corresponding BOOLEAN NOT NULL DEFAULT false,
    contribution TEXT,
    PRIMARY KEY (research_record_id, author_id)
);

CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE research_keywords (
    research_record_id UUID NOT NULL REFERENCES research_records(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (research_record_id, keyword_id)
);

CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_record_id UUID REFERENCES research_records(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    type publication_type NOT NULL,
    publisher VARCHAR(255),
    journal VARCHAR(255),
    volume VARCHAR(64),
    issue VARCHAR(64),
    pages VARCHAR(64),
    doi VARCHAR(255) UNIQUE,
    isbn VARCHAR(64),
    url TEXT,
    published_on DATE,
    citation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_key TEXT NOT NULL UNIQUE,
    bucket VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    checksum VARCHAR(255),
    access_level access_level NOT NULL DEFAULT 'private',
    purpose file_purpose NOT NULL DEFAULT 'other',
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    research_record_id UUID REFERENCES research_records(id) ON DELETE CASCADE,
    publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE innovations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(520) NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    status innovation_status NOT NULL DEFAULT 'draft',
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    lead_researcher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    research_record_id UUID REFERENCES research_records(id) ON DELETE SET NULL,
    technology_readiness_level INTEGER,
    industry_applications TEXT[],
    intellectual_property_notes TEXT,
    published_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320),
    affiliation VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE innovation_inventors (
    innovation_id UUID NOT NULL REFERENCES innovations(id) ON DELETE CASCADE,
    inventor_id UUID NOT NULL REFERENCES inventors(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (innovation_id, inventor_id)
);

CREATE TABLE patents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    innovation_id UUID REFERENCES innovations(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    application_number VARCHAR(160) UNIQUE,
    patent_number VARCHAR(160) UNIQUE,
    jurisdiction VARCHAR(120),
    status patent_status NOT NULL DEFAULT 'idea_disclosure',
    filed_on DATE,
    granted_on DATE,
    expires_on DATE,
    abstract TEXT,
    claims_summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patent_inventors (
    patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    inventor_id UUID NOT NULL REFERENCES inventors(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (patent_id, inventor_id)
);

CREATE TABLE commercialization_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    innovation_id UUID REFERENCES innovations(id) ON DELETE CASCADE,
    patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
    type commercialization_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    partner_name VARCHAR(255),
    status VARCHAR(120) NOT NULL,
    amount NUMERIC(14, 2),
    currency VARCHAR(3),
    started_on DATE,
    completed_on DATE,
    notes TEXT,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE iptto_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    innovation_id UUID REFERENCES innovations(id) ON DELETE CASCADE,
    patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    decision review_decision NOT NULL,
    notes TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE supporting_files (
    file_id UUID PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
    innovation_id UUID REFERENCES innovations(id) ON DELETE CASCADE,
    patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
    label VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_record_id UUID REFERENCES research_records(id) ON DELETE CASCADE,
    innovation_id UUID REFERENCES innovations(id) ON DELETE CASCADE,
    patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
    action approval_action NOT NULL,
    from_status VARCHAR(120),
    to_status VARCHAR(120),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(160) NOT NULL,
    target_type VARCHAR(160) NOT NULL,
    target_id UUID,
    ip_address VARCHAR(64),
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO faculties (id, name, slug, code)
VALUES ('00000000-0000-0000-0000-000000000101', 'Faculty of Technology', 'faculty-of-technology', 'TECH');

INSERT INTO departments (id, faculty_id, name, slug, code)
VALUES (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'Computer Science and Engineering',
    'computer-science-and-engineering',
    'CSE'
);

INSERT INTO roles (id, key, name, is_system)
VALUES
    ('00000000-0000-0000-0000-000000000301', 'visitor', 'Visitor', true),
    ('00000000-0000-0000-0000-000000000302', 'lecturer', 'Lecturer', true),
    ('00000000-0000-0000-0000-000000000303', 'department_administrator', 'Department Administrator', true),
    ('00000000-0000-0000-0000-000000000304', 'faculty_administrator', 'Faculty Administrator', true),
    ('00000000-0000-0000-0000-000000000305', 'iptto_officer', 'IPTTO Officer', true),
    ('00000000-0000-0000-0000-000000000306', 'super_administrator', 'Super Administrator', true);

INSERT INTO permissions (id, key, description)
VALUES
    ('00000000-0000-0000-0000-000000000401', 'research.read_public', 'Read published public research records'),
    ('00000000-0000-0000-0000-000000000402', 'research.submit', 'Submit research records for review'),
    ('00000000-0000-0000-0000-000000000403', 'research.review_department', 'Review research records at department level'),
    ('00000000-0000-0000-0000-000000000404', 'research.review_faculty', 'Review research records at faculty level'),
    ('00000000-0000-0000-0000-000000000405', 'innovation.manage', 'Manage innovation and patent records'),
    ('00000000-0000-0000-0000-000000000406', 'system.admin', 'Administer users, roles, and system settings');

INSERT INTO users (id, staff_id, email, name, status, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000501',
    'OAU-IPTTO-001',
    'demo.lecturer@oauife.edu.ng',
    'Demo Lecturer',
    'active',
    true
);

INSERT INTO user_profiles (user_id, faculty_id, department_id, title, research_interests)
VALUES (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    'Dr',
    ARRAY['innovation systems', 'research repositories']
);

INSERT INTO user_roles (user_id, role_id, faculty_id, department_id)
VALUES (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201'
);

INSERT INTO research_records (
    id,
    title,
    slug,
    abstract,
    status,
    access_level,
    faculty_id,
    department_id,
    owner_id,
    research_area,
    published_at
)
VALUES (
    '00000000-0000-0000-0000-000000000601',
    'Digital Research Repository Adoption in Nigerian Universities',
    'digital-research-repository-adoption-in-nigerian-universities',
    'A demo research record for local development and repository workflows.',
    'published',
    'public',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000501',
    'Research Information Systems',
    now()
);

INSERT INTO authors (id, user_id, name, email, affiliation)
VALUES (
    '00000000-0000-0000-0000-000000000701',
    '00000000-0000-0000-0000-000000000501',
    'Demo Lecturer',
    'demo.lecturer@oauife.edu.ng',
    'Obafemi Awolowo University'
);

INSERT INTO research_authors (research_record_id, author_id, position, is_corresponding)
VALUES (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000701',
    1,
    true
);

INSERT INTO keywords (id, value)
VALUES
    ('00000000-0000-0000-0000-000000000801', 'research repository'),
    ('00000000-0000-0000-0000-000000000802', 'technology transfer');

INSERT INTO research_keywords (research_record_id, keyword_id)
VALUES
    ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000801'),
    ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000802');

INSERT INTO publications (id, research_record_id, title, type, publisher, published_on)
VALUES (
    '00000000-0000-0000-0000-000000000901',
    '00000000-0000-0000-0000-000000000601',
    'Digital Research Repository Adoption in Nigerian Universities',
    'journal_article',
    'OAU IPTTO Demo Journal',
    '2026-01-15'
);

INSERT INTO files (
    id,
    object_key,
    bucket,
    filename,
    mime_type,
    file_size_bytes,
    checksum,
    access_level,
    purpose,
    uploader_id,
    research_record_id,
    publication_id
)
VALUES (
    '00000000-0000-0000-0000-000000001001',
    'demo/research/digital-repository-adoption.pdf',
    'oau-ippto-research',
    'digital-repository-adoption.pdf',
    'application/pdf',
    1048576,
    'sha256-demo-checksum',
    'public',
    'research_document',
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000901'
);

INSERT INTO innovations (
    id,
    title,
    slug,
    summary,
    status,
    faculty_id,
    department_id,
    lead_researcher_id,
    research_record_id,
    technology_readiness_level,
    industry_applications,
    published_at
)
VALUES (
    '00000000-0000-0000-0000-000000001101',
    'Repository Visibility Analytics Toolkit',
    'repository-visibility-analytics-toolkit',
    'A demo innovation record for IPTTO review and commercialization workflows.',
    'published',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000601',
    5,
    ARRAY['university repositories', 'research analytics'],
    now()
);

INSERT INTO inventors (id, user_id, name, email, affiliation)
VALUES (
    '00000000-0000-0000-0000-000000001201',
    '00000000-0000-0000-0000-000000000501',
    'Demo Lecturer',
    'demo.lecturer@oauife.edu.ng',
    'Obafemi Awolowo University'
);

INSERT INTO innovation_inventors (innovation_id, inventor_id, position)
VALUES (
    '00000000-0000-0000-0000-000000001101',
    '00000000-0000-0000-0000-000000001201',
    1
);

INSERT INTO patents (id, innovation_id, title, application_number, jurisdiction, status, filed_on)
VALUES (
    '00000000-0000-0000-0000-000000001301',
    '00000000-0000-0000-0000-000000001101',
    'Repository Visibility Analytics Toolkit',
    'NG/PT/DEMO/2026/001',
    'NG',
    'filed',
    '2026-02-01'
);

INSERT INTO patent_inventors (patent_id, inventor_id, position)
VALUES (
    '00000000-0000-0000-0000-000000001301',
    '00000000-0000-0000-0000-000000001201',
    1
);

INSERT INTO commercialization_activities (
    id,
    innovation_id,
    patent_id,
    type,
    title,
    partner_name,
    status,
    currency,
    created_by_id
)
VALUES (
    '00000000-0000-0000-0000-000000001401',
    '00000000-0000-0000-0000-000000001101',
    '00000000-0000-0000-0000-000000001301',
    'industry_engagement',
    'Initial industry validation',
    'Demo Partner',
    'in_progress',
    'NGN',
    '00000000-0000-0000-0000-000000000501'
);

INSERT INTO iptto_reviews (id, innovation_id, patent_id, reviewer_id, decision, notes)
VALUES (
    '00000000-0000-0000-0000-000000001501',
    '00000000-0000-0000-0000-000000001101',
    '00000000-0000-0000-0000-000000001301',
    '00000000-0000-0000-0000-000000000501',
    'approved',
    'Demo IPTTO review record.'
);

INSERT INTO supporting_files (file_id, innovation_id, patent_id, label)
VALUES (
    '00000000-0000-0000-0000-000000001001',
    '00000000-0000-0000-0000-000000001101',
    '00000000-0000-0000-0000-000000001301',
    'Demo supporting document'
);

INSERT INTO approval_history (
    research_record_id,
    innovation_id,
    patent_id,
    action,
    from_status,
    to_status,
    actor_id,
    comment
)
VALUES (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000001101',
    '00000000-0000-0000-0000-000000001301',
    'published',
    'approved',
    'published',
    '00000000-0000-0000-0000-000000000501',
    'Demo publication approval history.'
);

INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
VALUES (
    '00000000-0000-0000-0000-000000000501',
    'seed.created',
    'research_record',
    '00000000-0000-0000-0000-000000000601',
    '{"source": "db/init.sql"}'
);

INSERT INTO faculties (id, name, slug, code, description)
VALUES
    (
        '00000000-0000-0000-0000-000000000102',
        'Faculty of Science',
        'faculty-of-science',
        'SCI',
        'Demo science faculty for cross-faculty repository workflows.'
    ),
    (
        '00000000-0000-0000-0000-000000000103',
        'Faculty of Agriculture',
        'faculty-of-agriculture',
        'AGR',
        'Demo agriculture faculty for innovation and patent workflows.'
    );

INSERT INTO departments (id, faculty_id, name, slug, code, description)
VALUES
    (
        '00000000-0000-0000-0000-000000000202',
        '00000000-0000-0000-0000-000000000102',
        'Biochemistry and Molecular Biology',
        'biochemistry-and-molecular-biology',
        'BMB',
        'Demo department for life science research outputs.'
    ),
    (
        '00000000-0000-0000-0000-000000000203',
        '00000000-0000-0000-0000-000000000103',
        'Crop Production and Protection',
        'crop-production-and-protection',
        'CPP',
        'Demo department for agriculture innovation outputs.'
    );

INSERT INTO users (id, staff_id, email, name, status, email_verified)
VALUES
    (
        '00000000-0000-0000-0000-000000000502',
        'OAU-CSE-ADM-001',
        'department.admin@oauife.edu.ng',
        'Demo Department Administrator',
        'active',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000503',
        'OAU-SCI-ADM-001',
        'faculty.admin@oauife.edu.ng',
        'Demo Faculty Administrator',
        'active',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000504',
        'OAU-IPTTO-002',
        'iptto.officer@oauife.edu.ng',
        'Demo IPTTO Officer',
        'active',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000505',
        'OAU-SUPER-001',
        'super.admin@oauife.edu.ng',
        'Demo Super Administrator',
        'active',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000506',
        'OAU-AGR-LEC-001',
        'agriculture.lecturer@oauife.edu.ng',
        'Demo Agriculture Lecturer',
        'active',
        true
    );

INSERT INTO user_profiles (user_id, faculty_id, department_id, title, research_interests)
VALUES
    (
        '00000000-0000-0000-0000-000000000502',
        '00000000-0000-0000-0000-000000000101',
        '00000000-0000-0000-0000-000000000201',
        'Prof',
        ARRAY['software engineering', 'research governance']
    ),
    (
        '00000000-0000-0000-0000-000000000503',
        '00000000-0000-0000-0000-000000000102',
        '00000000-0000-0000-0000-000000000202',
        'Prof',
        ARRAY['molecular biology', 'faculty research administration']
    ),
    (
        '00000000-0000-0000-0000-000000000504',
        NULL,
        NULL,
        'Mr',
        ARRAY['technology transfer', 'commercialization']
    ),
    (
        '00000000-0000-0000-0000-000000000505',
        NULL,
        NULL,
        'Dr',
        ARRAY['research policy', 'institutional repositories']
    ),
    (
        '00000000-0000-0000-0000-000000000506',
        '00000000-0000-0000-0000-000000000103',
        '00000000-0000-0000-0000-000000000203',
        'Dr',
        ARRAY['seed systems', 'crop protection']
    );

INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000401'),
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000401'),
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000402'),
    ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000401'),
    ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000403'),
    ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000401'),
    ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000404'),
    ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000401'),
    ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000405'),
    ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000401'),
    ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000406');

INSERT INTO user_roles (user_id, role_id, faculty_id, department_id, assigned_by_id)
VALUES
    (
        '00000000-0000-0000-0000-000000000502',
        '00000000-0000-0000-0000-000000000303',
        '00000000-0000-0000-0000-000000000101',
        '00000000-0000-0000-0000-000000000201',
        '00000000-0000-0000-0000-000000000505'
    ),
    (
        '00000000-0000-0000-0000-000000000503',
        '00000000-0000-0000-0000-000000000304',
        '00000000-0000-0000-0000-000000000102',
        NULL,
        '00000000-0000-0000-0000-000000000505'
    ),
    (
        '00000000-0000-0000-0000-000000000504',
        '00000000-0000-0000-0000-000000000305',
        NULL,
        NULL,
        '00000000-0000-0000-0000-000000000505'
    ),
    (
        '00000000-0000-0000-0000-000000000505',
        '00000000-0000-0000-0000-000000000306',
        NULL,
        NULL,
        '00000000-0000-0000-0000-000000000505'
    ),
    (
        '00000000-0000-0000-0000-000000000506',
        '00000000-0000-0000-0000-000000000302',
        '00000000-0000-0000-0000-000000000103',
        '00000000-0000-0000-0000-000000000203',
        '00000000-0000-0000-0000-000000000505'
    );

INSERT INTO research_records (
    id,
    title,
    slug,
    abstract,
    status,
    access_level,
    faculty_id,
    department_id,
    owner_id,
    research_area,
    started_on,
    completed_on,
    published_at,
    metadata
)
VALUES
    (
        '00000000-0000-0000-0000-000000000602',
        'Enzyme Biomarkers for Rapid Water Quality Assessment',
        'enzyme-biomarkers-for-rapid-water-quality-assessment',
        'A demo science research record for publication, keyword, and file metadata workflows.',
        'approved',
        'restricted',
        '00000000-0000-0000-0000-000000000102',
        '00000000-0000-0000-0000-000000000202',
        '00000000-0000-0000-0000-000000000503',
        'Environmental Biotechnology',
        '2025-03-01',
        '2025-11-30',
        NULL,
        '{"funding": "OAU Senate Research Grant"}'
    ),
    (
        '00000000-0000-0000-0000-000000000603',
        'Low-cost Seed Coating for Improved Germination',
        'low-cost-seed-coating-for-improved-germination',
        'A demo agriculture research record linked to innovation disclosure and patent tracking.',
        'published',
        'public',
        '00000000-0000-0000-0000-000000000103',
        '00000000-0000-0000-0000-000000000203',
        '00000000-0000-0000-0000-000000000506',
        'Agricultural Technology',
        '2024-06-15',
        '2025-08-20',
        now(),
        '{"field_trial_sites": 3}'
    );

INSERT INTO authors (id, user_id, name, email, affiliation)
VALUES
    (
        '00000000-0000-0000-0000-000000000702',
        '00000000-0000-0000-0000-000000000503',
        'Demo Faculty Administrator',
        'faculty.admin@oauife.edu.ng',
        'Obafemi Awolowo University'
    ),
    (
        '00000000-0000-0000-0000-000000000703',
        '00000000-0000-0000-0000-000000000506',
        'Demo Agriculture Lecturer',
        'agriculture.lecturer@oauife.edu.ng',
        'Obafemi Awolowo University'
    );

INSERT INTO research_authors (research_record_id, author_id, position, is_corresponding, contribution)
VALUES
    (
        '00000000-0000-0000-0000-000000000602',
        '00000000-0000-0000-0000-000000000702',
        1,
        true,
        'Principal investigator'
    ),
    (
        '00000000-0000-0000-0000-000000000603',
        '00000000-0000-0000-0000-000000000703',
        1,
        true,
        'Technology development and field validation'
    );

INSERT INTO keywords (id, value)
VALUES
    ('00000000-0000-0000-0000-000000000803', 'biomarkers'),
    ('00000000-0000-0000-0000-000000000804', 'water quality'),
    ('00000000-0000-0000-0000-000000000805', 'seed coating'),
    ('00000000-0000-0000-0000-000000000806', 'crop protection');

INSERT INTO research_keywords (research_record_id, keyword_id)
VALUES
    ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000803'),
    ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000804'),
    ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000805'),
    ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000806');

INSERT INTO publications (id, research_record_id, title, type, publisher, journal, published_on, citation)
VALUES
    (
        '00000000-0000-0000-0000-000000000902',
        '00000000-0000-0000-0000-000000000602',
        'Enzyme Biomarkers for Rapid Water Quality Assessment',
        'conference_paper',
        'OAU Faculty of Science',
        NULL,
        '2026-04-10',
        'Demo Faculty Administrator. Enzyme biomarkers for rapid water quality assessment.'
    ),
    (
        '00000000-0000-0000-0000-000000000903',
        '00000000-0000-0000-0000-000000000603',
        'Low-cost Seed Coating for Improved Germination',
        'technical_report',
        'OAU Faculty of Agriculture',
        NULL,
        '2026-05-20',
        'Demo Agriculture Lecturer. Low-cost seed coating for improved germination.'
    );

INSERT INTO files (
    id,
    object_key,
    bucket,
    filename,
    mime_type,
    file_size_bytes,
    checksum,
    access_level,
    purpose,
    uploader_id,
    research_record_id,
    publication_id,
    metadata
)
VALUES
    (
        '00000000-0000-0000-0000-000000001002',
        'demo/research/enzyme-biomarkers.pdf',
        'oau-ippto-research',
        'enzyme-biomarkers.pdf',
        'application/pdf',
        2097152,
        'sha256-demo-biomarkers',
        'restricted',
        'research_document',
        '00000000-0000-0000-0000-000000000503',
        '00000000-0000-0000-0000-000000000602',
        '00000000-0000-0000-0000-000000000902',
        '{"pages": 14}'
    ),
    (
        '00000000-0000-0000-0000-000000001003',
        'demo/research/seed-coating-report.pdf',
        'oau-ippto-research',
        'seed-coating-report.pdf',
        'application/pdf',
        1572864,
        'sha256-demo-seed-coating',
        'public',
        'research_document',
        '00000000-0000-0000-0000-000000000506',
        '00000000-0000-0000-0000-000000000603',
        '00000000-0000-0000-0000-000000000903',
        '{"pages": 22}'
    );

INSERT INTO innovations (
    id,
    title,
    slug,
    summary,
    status,
    faculty_id,
    department_id,
    lead_researcher_id,
    research_record_id,
    technology_readiness_level,
    industry_applications,
    intellectual_property_notes,
    published_at,
    metadata
)
VALUES
    (
        '00000000-0000-0000-0000-000000001102',
        'Rapid Water Quality Enzyme Test Kit',
        'rapid-water-quality-enzyme-test-kit',
        'A demo innovation for environmental monitoring and IPTTO assessment.',
        'approved',
        '00000000-0000-0000-0000-000000000102',
        '00000000-0000-0000-0000-000000000202',
        '00000000-0000-0000-0000-000000000503',
        '00000000-0000-0000-0000-000000000602',
        4,
        ARRAY['water utilities', 'public health laboratories'],
        'Protect assay protocol and kit configuration.',
        NULL,
        '{"market_readiness": "prototype"}'
    ),
    (
        '00000000-0000-0000-0000-000000001103',
        'Biodegradable Seed Coating Formulation',
        'biodegradable-seed-coating-formulation',
        'A demo innovation for crop germination support in smallholder farming.',
        'published',
        '00000000-0000-0000-0000-000000000103',
        '00000000-0000-0000-0000-000000000203',
        '00000000-0000-0000-0000-000000000506',
        '00000000-0000-0000-0000-000000000603',
        6,
        ARRAY['seed companies', 'extension programmes'],
        'Patent filing prepared for composition and process claims.',
        now(),
        '{"pilot_batches": 2}'
    );

INSERT INTO inventors (id, user_id, name, email, affiliation)
VALUES
    (
        '00000000-0000-0000-0000-000000001202',
        '00000000-0000-0000-0000-000000000503',
        'Demo Faculty Administrator',
        'faculty.admin@oauife.edu.ng',
        'Obafemi Awolowo University'
    ),
    (
        '00000000-0000-0000-0000-000000001203',
        '00000000-0000-0000-0000-000000000506',
        'Demo Agriculture Lecturer',
        'agriculture.lecturer@oauife.edu.ng',
        'Obafemi Awolowo University'
    );

INSERT INTO innovation_inventors (innovation_id, inventor_id, position)
VALUES
    ('00000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000001202', 1),
    ('00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000001203', 1);

INSERT INTO patents (
    id,
    innovation_id,
    title,
    application_number,
    jurisdiction,
    status,
    filed_on,
    abstract,
    claims_summary
)
VALUES
    (
        '00000000-0000-0000-0000-000000001302',
        '00000000-0000-0000-0000-000000001102',
        'Rapid Water Quality Enzyme Test Kit',
        'NG/PT/DEMO/2026/002',
        'NG',
        'pending',
        '2026-03-12',
        'Demo patent record for enzyme-based water quality testing.',
        'Claims cover reagent composition, sensor workflow, and kit packaging.'
    ),
    (
        '00000000-0000-0000-0000-000000001303',
        '00000000-0000-0000-0000-000000001103',
        'Biodegradable Seed Coating Formulation',
        'NG/PT/DEMO/2026/003',
        'NG',
        'filed',
        '2026-06-01',
        'Demo patent record for seed coating formulation.',
        'Claims cover biodegradable binder composition and coating process.'
    );

INSERT INTO patent_inventors (patent_id, inventor_id, position)
VALUES
    ('00000000-0000-0000-0000-000000001302', '00000000-0000-0000-0000-000000001202', 1),
    ('00000000-0000-0000-0000-000000001303', '00000000-0000-0000-0000-000000001203', 1);

INSERT INTO commercialization_activities (
    id,
    innovation_id,
    patent_id,
    type,
    title,
    partner_name,
    status,
    started_on,
    notes,
    created_by_id,
    metadata
)
VALUES
    (
        '00000000-0000-0000-0000-000000001402',
        '00000000-0000-0000-0000-000000001102',
        '00000000-0000-0000-0000-000000001302',
        'partnership',
        'Prototype validation with water testing laboratory',
        'Demo Water Lab',
        'planned',
        '2026-08-01',
        'Pending IPTTO partner review.',
        '00000000-0000-0000-0000-000000000504',
        '{"next_step": "technical due diligence"}'
    ),
    (
        '00000000-0000-0000-0000-000000001403',
        '00000000-0000-0000-0000-000000001103',
        '00000000-0000-0000-0000-000000001303',
        'licensing',
        'Seed company licensing discussion',
        'Demo Agro Industries',
        'in_progress',
        '2026-07-15',
        'Initial non-confidential discussion completed.',
        '00000000-0000-0000-0000-000000000504',
        '{"nda_required": true}'
    );

INSERT INTO iptto_reviews (id, innovation_id, patent_id, reviewer_id, decision, notes)
VALUES
    (
        '00000000-0000-0000-0000-000000001502',
        '00000000-0000-0000-0000-000000001102',
        '00000000-0000-0000-0000-000000001302',
        '00000000-0000-0000-0000-000000000504',
        'changes_requested',
        'Add validation data and clarify claims before publication.'
    ),
    (
        '00000000-0000-0000-0000-000000001503',
        '00000000-0000-0000-0000-000000001103',
        '00000000-0000-0000-0000-000000001303',
        '00000000-0000-0000-0000-000000000504',
        'approved',
        'Ready for public innovation showcase.'
    );

INSERT INTO supporting_files (file_id, innovation_id, patent_id, label)
VALUES
    (
        '00000000-0000-0000-0000-000000001002',
        '00000000-0000-0000-0000-000000001102',
        '00000000-0000-0000-0000-000000001302',
        'Prototype validation report'
    ),
    (
        '00000000-0000-0000-0000-000000001003',
        '00000000-0000-0000-0000-000000001103',
        '00000000-0000-0000-0000-000000001303',
        'Field trial and patent support report'
    );

INSERT INTO approval_history (
    research_record_id,
    innovation_id,
    patent_id,
    action,
    from_status,
    to_status,
    actor_id,
    comment
)
VALUES
    (
        '00000000-0000-0000-0000-000000000602',
        '00000000-0000-0000-0000-000000001102',
        '00000000-0000-0000-0000-000000001302',
        'changes_requested',
        'under_review',
        'under_review',
        '00000000-0000-0000-0000-000000000504',
        'Demo IPTTO review requested additional validation.'
    ),
    (
        '00000000-0000-0000-0000-000000000603',
        '00000000-0000-0000-0000-000000001103',
        '00000000-0000-0000-0000-000000001303',
        'published',
        'approved',
        'published',
        '00000000-0000-0000-0000-000000000504',
        'Demo innovation cleared for public showcase.'
    );

INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent, metadata)
VALUES
    (
        '00000000-0000-0000-0000-000000000504',
        'seed.iptto_reviewed',
        'innovation',
        '00000000-0000-0000-0000-000000001102',
        '127.0.0.1',
        'db/init.sql',
        '{"source": "db/init.sql", "decision": "changes_requested"}'
    ),
    (
        '00000000-0000-0000-0000-000000000505',
        'seed.roles_assigned',
        'user',
        '00000000-0000-0000-0000-000000000506',
        '127.0.0.1',
        'db/init.sql',
        '{"source": "db/init.sql", "role": "lecturer"}'
    );
