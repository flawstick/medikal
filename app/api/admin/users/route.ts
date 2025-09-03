import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabase as authSupabase } from "@/lib/supabase-auth"

// Define role hierarchy for permission checking
const ROLE_HIERARCHY = {
  operator: 1,
  manager: 2,
  admin: 3
}

function canManageUsers(userRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY]
  const requiredLevel = ROLE_HIERARCHY.manager
  return userLevel >= requiredLevel
}

export async function GET() {
  try {
    // Get current user using auth client
    const authClient = await authSupabase()
    const { data: { user: currentUser }, error: userError } = await authClient.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check current user's permissions
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !currentUserProfile) {
      return NextResponse.json(
        { error: "Unable to verify permissions" },
        { status: 403 }
      )
    }

    if (!canManageUsers(currentUserProfile.user_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only managers and admins can manage users." },
        { status: 403 }
      )
    }

    // Fetch all user profiles
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, name, user_role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      return NextResponse.json(
        { error: `Failed to fetch users: ${usersError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Get current user using auth client
    const authClient = await authSupabase()
    const { data: { user: currentUser }, error: userError } = await authClient.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check current user's permissions
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !currentUserProfile) {
      return NextResponse.json(
        { error: "Unable to verify permissions" },
        { status: 403 }
      )
    }

    if (!canManageUsers(currentUserProfile.user_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only managers and admins can delete users." },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Delete from user_profiles first
    const { error: profileDeleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      return NextResponse.json(
        { error: `Failed to delete user profile: ${profileDeleteError.message}` },
        { status: 500 }
      )
    }

    // Delete from Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      return NextResponse.json(
        { error: `Failed to delete auth user: ${authDeleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    const { name, user_role, email } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (user_role && !['admin', 'manager', 'operator'].includes(user_role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, manager, or operator" },
        { status: 400 }
      )
    }

    // Get current user using auth client
    const authClient = await authSupabase()
    const { data: { user: currentUser }, error: userError } = await authClient.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check current user's permissions
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !currentUserProfile) {
      return NextResponse.json(
        { error: "Unable to verify permissions" },
        { status: 403 }
      )
    }

    if (!canManageUsers(currentUserProfile.user_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only managers and admins can edit users." },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (name !== undefined) updateData.name = name
    if (user_role !== undefined) updateData.user_role = user_role
    if (email !== undefined) updateData.email = email

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update user: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Update auth user metadata if name or role changed
    if (name !== undefined || user_role !== undefined) {
      const authUpdateData: any = {}
      if (name !== undefined) authUpdateData.display_name = name
      if (user_role !== undefined) authUpdateData.user_role = user_role

      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: authUpdateData }
      )

      if (authUpdateError) {
        // Log error but don't fail the request since profile was updated
        console.error('Failed to update auth metadata:', authUpdateError)
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "User updated successfully"
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}