import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabase as authSupabase } from "@/lib/supabase-auth"

// Define role hierarchy for permission checking
const ROLE_HIERARCHY = {
  operator: 1,
  manager: 2,
  admin: 3
}

function canCreateUsers(userRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY]
  const requiredLevel = ROLE_HIERARCHY.manager
  return userLevel >= requiredLevel
}

export async function POST(request: NextRequest) {
  try {
    const { email, role, displayName } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'manager', 'operator'].includes(role)) {
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

    if (!canCreateUsers(currentUserProfile.user_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only managers and admins can create users." },
        { status: 403 }
      )
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || null,
        user_role: role,
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: "Failed to get user ID from auth creation" },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileCreateError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: authData.user.id,
          email: email,
          user_role: role,
          name: displayName || null,
        }
      ])

    if (profileCreateError) {
      // Clean up auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileCreateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        displayName,
      },
      tempPassword,
      message: `User created successfully. Temporary password: ${tempPassword}. Please share this password with the user securely.`
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}