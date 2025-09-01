import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? '/'

  // Handle error from Supabase
  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)
    const supabase = createSupabaseReqResClient(request, response)
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError && data?.session) {
        console.log('Successfully exchanged code for session')
        return response
      }
      
      console.error('Session exchange failed:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError?.message || 'Session exchange failed')}`)
    } catch (err) {
      console.error('Unexpected error during session exchange:', err)
      return NextResponse.redirect(`${origin}/auth/login?error=Unexpected authentication error`)
    }
  }

  // No code parameter found
  console.error('No code parameter in callback')
  return NextResponse.redirect(`${origin}/auth/login?error=Missing authentication code`)
}