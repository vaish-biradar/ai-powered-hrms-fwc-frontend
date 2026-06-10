import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client'; // adjust the import path as needed

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
        panel_name,
        department,
        positions,
        status = 'active',
        members = [],
      } = body;
      
      let interviewsCompleted = parseInt(body.interviewsCompleted);
      if (isNaN(interviewsCompleted)) {
        interviewsCompleted = 0;
      }
      
console.log("Position-----------------",positions);
const cleanedPositions = Array.isArray(positions)
  ? positions.join(', ')
  : positions;
  console.log(cleanedPositions);
  
    if (!panel_name || !department || !positions || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const panelId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Insert into panels table
    const insertPanelQuery = `
      INSERT INTO panels (id, panel_name, department, positions, interviews_completed, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7,$7)
      RETURNING *;
    `;

    const panelValues = [
      panelId,
      panel_name,
      department,
      cleanedPositions,
      interviewsCompleted,
      status,
      createdAt,
    ];

    const result = await postgresDB.query(insertPanelQuery, panelValues);
    const panel = result.rows[0];

    // Insert member-panel relations
    if (members.length > 0) {
    const valuesClause: string = members
      .map((_: string, i: number) => `($${i * 2 + 1}, $${i * 2 + 2})`)
      .join(', ');
    const values: (string | undefined)[] = members.flatMap((memberId: string) => [memberId, panelId]);

      const insertMembersQuery = `
        INSERT INTO member_panels (member_id, panel_id)
        VALUES ${valuesClause}
        ON CONFLICT DO NOTHING;
      `;

      await postgresDB.query(insertMembersQuery, values);
    }
console.log(`Inserted panel: ${JSON.stringify(panel)}`);

    return NextResponse.json(
      {
        message: 'Panel and members successfully created',
        panel,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error inserting panel:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}






type Member = {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
  };
  
  type RawPanelRow = {
    id: string;
    panel_name: string;
    department: string;
    positions: string | string[];
    status: string;
    created_at: string;
    interviews_completed: number;
    members: (Member | null)[];
  };
  
  type InterviewPanel = {
    id: string;
    name: string;
    department: string;
    members: Member[];
    positions: string[];
    active: boolean;
    createdAt: string;
    interviewsCompleted: number;
  };
  
  export async function GET() {
    try {
      const query = `
        SELECT 
          p.id,
          p.panel_name,
          p.department,
          p.positions,
          p.status,
          p.created_at,
          p.interviews_completed,
          json_agg(
            json_build_object(
              'id', m.id,
              'name', m.name,
              'department', m.department,
              'email', m.email,
              'role', m.role
            )
          ) AS members
        FROM panels p
        LEFT JOIN member_panels mp ON p.id = mp.panel_id
        LEFT JOIN members m ON mp.member_id = m.id
        GROUP BY p.id
        ORDER BY p.created_at ASC;
      `;
  
      const result = await postgresDB.query<RawPanelRow>(query);
  
      const interviewPanels: InterviewPanel[] = result.rows.map((row) => ({
        id: row.id,
        name: row.panel_name,
        department: row.department,
        members: (row.members || []).filter((m): m is Member => m !== null),
        positions: typeof row.positions === 'string'
          ? row.positions.split(',').map((p) => p.trim())
          : row.positions,
        active: row.status === 'active',
        interviewsCompleted: row.interviews_completed,
        createdAt: new Date(row.created_at).toISOString().split('T')[0],
      }));
      
      
  
      return NextResponse.json(interviewPanels, { status: 200 });
    } catch (error) {
      console.error('Error fetching panels with members:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
