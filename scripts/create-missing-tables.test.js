const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

async function main() {
  const envSources = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../backend/.env'),
  ];

  const envFromFiles = envSources.reduce((acc, filePath) => {
    return { ...acc, ...parseDotEnv(filePath) };
  }, {});

  const env = {
    ...process.env,
    ...envFromFiles,
  };

  const requiredVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'];
  const missing = requiredVars.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const connectionString = `postgresql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD)}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?sslmode=require`;
  const pool = new Pool({ connectionString });

  const createStatements = [
    `CREATE TABLE IF NOT EXISTS resumes (
      id uuid PRIMARY KEY,
      name text,
      email text UNIQUE,
      phone text,
      summary text,
      experience_status text,
      years_of_experience text,
      suitable_roles jsonb,
      path text,
      text text,
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS job_descriptions (
      id uuid PRIMARY KEY,
      title text,
      text text,
      department text,
      employment_type text,
      location text,
      experience_level text,
      summary text,
      skills text,
      description text,
      path text,
      status text DEFAULT 'Open',
      total_openings integer DEFAULT 0,
      occupied_openings integer DEFAULT 0,
      submitted_by jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS reports (
      id uuid PRIMARY KEY,
      resume_id uuid REFERENCES resumes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      job_description_id uuid REFERENCES job_descriptions(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      content jsonb,
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS interview_rounds (
      id uuid PRIMARY KEY,
      round_name text,
      description text,
      round_order integer DEFAULT 1,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS members (
      id uuid PRIMARY KEY,
      name text,
      email text UNIQUE,
      department text,
      role text,
      expertise text,
      invitation_token text,
      invitation_status text,
      invitation_expiry timestamptz,
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS panels (
      id uuid PRIMARY KEY,
      panel_name text,
      department text,
      positions text,
      interviews_completed integer DEFAULT 0,
      status text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS applications (
      id uuid PRIMARY KEY,
      resume_id uuid REFERENCES resumes(id),
      job_description_id uuid REFERENCES job_descriptions(id),
      candidate_name text,
      candidate_email text,
      candidate_phone text,
      total_experience text,
      current_ctc text,
      expected_ctc text,
      current_company text,
      current_location text,
      current_job_title text,
      notice_period text,
      resume_url text,
      job_title text,
      jd_url text,
      report_url text,
      suitable_roles jsonb,
      similarity numeric,
      source text,
      status text,
      department text,
      current_round_id uuid REFERENCES interview_rounds(id),
      applied_date timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS member_panels (
      member_id uuid REFERENCES members(id) ON DELETE CASCADE,
      panel_id uuid REFERENCES panels(id) ON DELETE CASCADE,
      PRIMARY KEY (member_id, panel_id)
    );`,

    `CREATE TABLE IF NOT EXISTS dashboard_stats (
      id uuid PRIMARY KEY,
      month_year text,
      resumes integer,
      job_descriptions integer,
      applications integer,
      hired integer,
      applied_date timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS availability_requests (
      token text PRIMARY KEY,
      member_id uuid REFERENCES members(id),
      application_id uuid REFERENCES applications(id),
      round_id uuid REFERENCES interview_rounds(id),
      requested_date timestamptz,
      requested_by_id uuid REFERENCES members(id),
      expires_at timestamptz,
      response text,
      responded_at timestamptz,
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS interviews (
      id uuid PRIMARY KEY,
      application_id uuid REFERENCES applications(id),
      round_id uuid REFERENCES interview_rounds(id),
      panel_id uuid REFERENCES panels(id),
      scheduled_by_id uuid REFERENCES members(id),
      scheduled_date timestamptz,
      meeting_link text,
      meeting_location text,
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS application_status_history (
      id uuid PRIMARY KEY,
      application_id uuid REFERENCES applications(id),
      status text,
      feedback text,
      changed_by_id uuid REFERENCES members(id),
      changed_by_name text,
      changed_by_email text,
      created_at timestamptz DEFAULT now()
    );`,
  ];

  const alterStatements = [
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS expertise text;`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS invitation_status text;`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS invitation_expiry timestamptz;`,
  ];

  const client = await pool.connect();
  try {
    console.log('Connected to Postgres using', connectionString);

    for (const statement of createStatements) {
      await client.query(statement);
      const firstLine = statement.split('\n')[0].trim();
      const tableMatch = firstLine.match(/CREATE TABLE IF NOT EXISTS ([^\s(]+)/i);
      const tableName = tableMatch ? tableMatch[1] : firstLine;
      console.log(`Ensured table exists: ${tableName}`);
    }

    for (const statement of alterStatements) {
      await client.query(statement);
      console.log(`Ensured altered schema: ${statement}`);
    }

    console.log('All required tables have been created or verified.');
  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
    process.exit(1);
  });
