import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

// GET /api/organizations/[orgId]/members - Get organization members
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const orgId = params.orgId

    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization with members using admin client to bypass RLS
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, members, invitations')
      .eq('id', orgId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      organization: org,
      members: org.members || [],
      invitations: org.invitations || []
    })

  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/organizations/[orgId]/members - Add or invite member
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const orgId = params.orgId
    const { email, role = 'member', action = 'invite' } = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('members, invitations')
      .eq('id', orgId)
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (action === 'invite') {
      // Check if already invited
      const existingInvitation = (org.invitations || []).find((inv: any) => inv.email === email)
      if (existingInvitation) {
        return NextResponse.json({ error: 'User already invited' }, { status: 400 })
      }

      // Add invitation to array
      const newInvitation = {
        email,
        role,
        invited_at: new Date().toISOString(),
        invited_by: user.id
      }

      const updatedInvitations = [...(org.invitations || []), newInvitation]

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ invitations: updatedInvitations })
        .eq('id', orgId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Invitation sent successfully',
        invitation: newInvitation
      })

    } else if (action === 'add') {
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', email)
        .single()

      if (userError || !existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if already a member
      const existingMember = (org.members || []).find((member: any) => member.id === existingUser.id)
      if (existingMember) {
        return NextResponse.json({ error: 'User already a member' }, { status: 400 })
      }

      // Add user as member
      const newMember = {
        id: existingUser.id,
        email: existingUser.email,
        role,
        joined_at: new Date().toISOString()
      }

      const updatedMembers = [...(org.members || []), newMember]

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ members: updatedMembers })
        .eq('id', orgId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Member added successfully',
        member: newMember
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error managing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/organizations/[orgId]/members - Remove member or invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const orgId = params.orgId
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const type = searchParams.get('type') // 'member' or 'invitation'

    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('members, invitations')
      .eq('id', orgId)
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (type === 'invitation' && email) {
      // Remove invitation from array
      const updatedInvitations = (org.invitations || []).filter((inv: any) => inv.email !== email)

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ invitations: updatedInvitations })
        .eq('id', orgId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Invitation removed' })

    } else if (type === 'member' && userId) {
      // Remove member from array
      const updatedMembers = (org.members || []).filter((member: any) => member.id !== userId)

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ members: updatedMembers })
        .eq('id', orgId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Member removed' })
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })

  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/organizations/[orgId]/members - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const orgId = params.orgId
    const { userId, role } = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('members')
      .eq('id', orgId)
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Update member role in array
    const updatedMembers = (org.members || []).map((member: any) => 
      member.id === userId ? { ...member, role } : member
    )

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ members: updatedMembers })
      .eq('id', orgId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Member role updated',
      member: { userId, role }
    })

  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}