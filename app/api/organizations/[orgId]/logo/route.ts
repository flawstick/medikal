import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;
    const { logo_url } = await request.json();

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClientComponentClient();

    // Update organization logo
    const { error } = await supabase
      .from('organizations')
      .update({ logo_url })
      .eq('id', orgId);

    if (error) {
      console.error('Error updating organization logo:', error);
      return NextResponse.json(
        { error: 'Failed to update organization logo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[orgId]/logo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}