import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const isSignup = requestUrl.searchParams.get('signup')
  const tempId = requestUrl.searchParams.get('temp_id')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // If this is a signup flow, handle the profile creation
    if (isSignup && tempId && data.user) {
      try {
        // Get the temporary profile
        const { data: tempProfile, error: tempError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', tempId)
          .single()

        if (tempProfile && !tempError) {
          // Delete the temporary profile
          await supabase
            .from('user_profiles')
            .delete()
            .eq('id', tempId)

          // Create the real profile with the actual user ID
          await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: tempProfile.email,
              name: tempProfile.name,
              age: tempProfile.age,
              company: tempProfile.company,
              approved: false,
              created_at: new Date().toISOString()
            })
        }
      } catch (err) {
        console.error('Profile creation error:', err)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}