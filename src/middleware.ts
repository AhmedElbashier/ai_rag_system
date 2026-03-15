import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isStripeWebhook = request.nextUrl.pathname === '/api/stripe/webhook'

  // All app pages are public until an auth flow is added.
  // Only the monetization upload-limit check runs for authenticated users below.
  const isPublicApiRoute = isStripeWebhook
    || request.nextUrl.pathname.startsWith('/api-reference')
    || request.nextUrl.pathname.startsWith('/api/chat');

  if (!user && isApiRoute && !isPublicApiRoute) {
    return new NextResponse("Unauthorized. Please log in.", { status: 401 });
  }

  // == Business Logic for Monetization ==
  // Note: Only checking limits heavily on API bounds.
  if (user && isApiRoute && request.nextUrl.pathname.startsWith('/api/upload')) {
     // Fetch user subscription info
    const { data: sub } = await supabase.from('subscriptions').select('plan_tier').eq('user_id', user.id).single()
    const plan = sub?.plan_tier || 'free';

    if (plan === 'free') {
       // Check document count for free tier users
       const { count } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
       if ((count || 0) >= 3) {
          return NextResponse.json({ error: "Free tier limit reached. Please upgrade to Pro to upload more documents." }, { status: 403 });
       }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
