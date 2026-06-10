import { NextResponse } from 'next/server';
import postgresDB from '@/lib/storage/cosmos-client'; // Make sure this exports a valid pg Client or Pool

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: panelId } = await params;
        console.log('Panel ID:', panelId);
        
        if (!panelId) {
          return NextResponse.json(
            { success: false, message: 'Panel ID is required' },
            { status: 400 }
          );
        }
        const body = await request.json();
        if (body.name && !body.panel_name) {
            body.panel_name = body.name;
            delete body.name;
          }
          if (Array.isArray(body.positions)) {
            body.positions = body.positions.join(', ');
          }
          
    console.log('Request body:', body);
        if (!panelId || Object.keys(body).length === 0) {
          return NextResponse.json(
            { success: false, message: 'No fields provided for update' },
            { status: 400 }
          );
        }
    
        const allowedFields = [
          'panel_name',
          'department',
          'positions',
          'interviews_completed',
          'status',
        ];
    
        const updates: string[] = [];
        const values: (string | number | boolean | null)[] = [];
    
        let i = 1;
        for (const key of Object.keys(body)) {
          if (allowedFields.includes(key)) {
            updates.push(`${key} = $${i}`);
            values.push(body[key]);
            i++;
          }
        }
    
        if (updates.length === 0) {
          return NextResponse.json(
            { success: false, message: 'No valid fields to update' },
            { status: 400 }
          );
        }
    
        // Add updated_at
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
        const query = `
          UPDATE panels
          SET ${updates.join(', ')}
          WHERE id = $${i}
          RETURNING *;
        `;
        values.push(panelId);
    
        const result = await postgresDB.query(query, values);
    
        if (result.rowCount === 0) {
          return NextResponse.json(
            { success: false, message: 'Panel not found' },
            { status: 404 }
          );
        }
    
        return NextResponse.json({ success: true, data: result.rows[0] });
      } catch (error) {
        console.error('Failed to update panel:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to update panel' },
          { status: 500 }
        );
      }
    }

    export async function DELETE(
        _request: Request,
        { params }: { params: Promise<{ id: string }> }
      ) {
        try {
            const { id: panelId } = await params;
      
          if (!panelId) {
            return NextResponse.json(
              { success: false, message: 'Panel ID is required' },
              { status: 400 }
            );
          }
      
          const result = await postgresDB.query(
            `DELETE FROM panels WHERE id = $1 RETURNING *`,
            [panelId]
          );
      
          if (result.rowCount === 0) {
            return NextResponse.json(
              { success: false, message: 'Panel not found or already deleted' },
              { status: 404 }
            );
          }
      
          return NextResponse.json({
            success: true,
            message: 'Panel deleted successfully',
            data: result.rows[0],
          });
        } catch (error) {
          console.error('Failed to delete panel:', error);
          return NextResponse.json(
            { success: false, message: 'Failed to delete panel' },
            { status: 500 }
          );
        }
      }