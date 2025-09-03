import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabase as authSupabase } from "@/lib/supabase-auth"

export async function GET() {
  try {
    const authClient = await authSupabase()
    const { data: { user }, error: userError } = await authClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: userError?.message },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id)

    // Use admin client for database operations (bypasses RLS)
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Creating new profile for user:', user.id, user.email)
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'User',
          user_role: 'admin'
        })
        .select()
        .single()

      if (createError) {
        console.log('Profile create error:', createError)
        return NextResponse.json(
          { error: "Failed to create profile", details: createError.message },
          { status: 500 }
        )
      }
      
      profile = newProfile
    } else if (profileError) {
      console.log('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || null
    })

  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await authSupabase()
    const { data: { user }, error: userError } = await authClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, avatar_url } = body

    // Update user profile using admin client
    const { data: updatedProfile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        name: name || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: `Failed to update profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile
    })

  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}