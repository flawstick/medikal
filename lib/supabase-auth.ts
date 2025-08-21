import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const createSupabaseClientComponent = () => {
  return createClientComponentClient()
}

export const createSupabaseRouteHandler = () => {
  const cookieStore = cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}

export const createSupabaseServerComponent = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}