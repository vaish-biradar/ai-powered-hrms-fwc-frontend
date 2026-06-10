import postgresDB from "@/lib/storage/cosmos-client";

/**
 * Fetch all items from a specific table.
 */
export async function getAllItems(tableName: string) {

  const start = performance.now();


  const result = await postgresDB.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
  const end = performance.now();

  const durationInSeconds = ((end - start) / 1000).toFixed(2); // seconds with 2 decimals
  console.log(`-------------------${tableName} query took ${durationInSeconds} seconds`);
  return result.rows;
}

export async function getAllApplicationsWithJoin() {
  const query = `
    SELECT 
      a.id,
      a.resume_id,
      a.job_description_id,
      a.candidate_name,
      a.candidate_email,
      a.candidate_phone,
      a.total_experience,
      a.current_ctc,
      a.expected_ctc,
      a.current_company,
      a.current_location,
      a.current_job_title,
      a.notice_period,
      r.path AS resume_url,         -- from resumes
      jd.path AS jd_url,            -- from job_descriptions
      a.job_title,
      a.report_url,
      a.suitable_roles,
      a.similarity,
      a.source,
      a.status,
      a.applied_date,
      a.created_at
    FROM applications a
    LEFT JOIN resumes r ON a.resume_id = r.id
    LEFT JOIN job_descriptions jd ON a.job_description_id = jd.id
    ORDER BY a.created_at DESC;
  `;

  const result = await postgresDB.query(query);
  return result.rows;
}


import { performance } from 'perf_hooks'; // Make sure this is imported at the top

export async function getJobDescriptionsWithApplications() {
  const query = `
    SELECT 
      jd.*, 
      COUNT(a.id) AS application_count,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'candidate_name', a.candidate_name,
            'candidate_email', a.candidate_email
          )
        ) FILTER (WHERE a.id IS NOT NULL), 
        '[]'
      ) AS applications
    FROM job_descriptions jd
    LEFT JOIN applications a 
      ON jd.id = a.job_description_id
    GROUP BY jd.id
    ORDER BY jd.created_at DESC
  `;

  const start = performance.now();
  const result = await postgresDB.query(query);
  const end = performance.now();

  const durationInSeconds = ((end - start) / 1000).toFixed(2); // seconds with 2 decimals
  console.log(`getJobDescriptionsWithApplications query took ${durationInSeconds} seconds`);

  return result.rows;
}




/**
 * Get a single item by ID.
 */
export async function getItemById(tableName: string, id: string) {
  const result = await postgresDB.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  return result.rows[0];
}

export async function getMemberByToken(token: string) {
  const result = await postgresDB.query(`SELECT * FROM members WHERE invitation_token = $1`, [token]);
  return result.rows[0];
}


/**
 * Insert a new item into a table.
 */
export async function insertItem<T extends Record<string, unknown>>(tableName: string, data: T) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const columns = ["id", "created_at", ...Object.keys(data)];
  const values = [id, createdAt, ...Object.values(data)];
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

  const query = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const result = await postgresDB.query(query, values);

  return result.rows[0];
}

/**
 * Update an item in a table.
 */
export async function updateItem(
  tableName: string,
  id: string,
  data: Partial<Record<string, unknown>>
) {
  const entries = Object.entries(data);
  if (entries.length === 0) throw new Error("No fields to update");

  const setClause = entries
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(", ");

  const values = entries.map(([, value]) => value);
  values.push(id); // Last param for WHERE clause

  const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
  const result = await postgresDB.query(query, values);

  return result.rows[0];
}

/**
 * Delete an item from a table.
 */
export async function deleteItem(tableName: string, id: string) {
  await postgresDB.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
  return { message: "Item deleted successfully" };
}
