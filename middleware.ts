import { NextRequest, NextResponse } from 'next/server'

// Hard-block bots that often ignore robots.txt. Returns 403 at the edge,
// so they don't burn compute on full page renders.
//
// Tip: Add new bot names to this list as you spot them in your access logs.
const BLOCKED_USER_AGENTS = [
  // AI/LLM training scrapers
  'gptbot',
  'chatgpt-user',
  'oai-searchbot',
  'ccbot',
  'anthropic-ai',
  'claude-web',
  'claudebot',
  // 'claude-searchbot',  // Allowed: this is Anthropic's grounding/search bot for Claude citations.
  //                         Can drive small referral traffic. Block if it gets aggressive.
  'cohere-ai',
  'perplexitybot',
  'google-extended',
  'facebookbot',
  'meta-externalagent',
  'bytespider',
  'diffbot',
  'omgili',
  'omgilibot',
  'imagesiftbot',
  'youbot',
  // Apple / Amazon / Huawei assistant bots
  'amazonbot',
  'applebot',          // Apple's general crawler (Siri, Spotlight) - low traffic value for finance site
  'applebot-extended', // Apple AI training
  // SEO crawlers (heavy hits, no traffic)
  'ahrefsbot',
  'semrushbot',
  'mj12bot',
  'dotbot',
  'blexbot',
  'serpstatbot',
  'zoominfobot',
  'dataforseobot',
  'petalbot',
  'awariorssbot',
  'awariosmartbot',
]

// Pre-compile a single regex for fast matching
const BLOCKED_REGEX = new RegExp(`(${BLOCKED_USER_AGENTS.join('|')})`, 'i')

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''

  if (ua && BLOCKED_REGEX.test(ua)) {
    return new NextResponse('Forbidden', {
      status: 403,
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  return NextResponse.next()
}

// Run on all routes except static assets and the robots/sitemap themselves
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon files
     * - robots.txt, sitemap*.xml (must be reachable so allowed bots can read rules)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon|robots.txt|.*sitemap.*\\.xml).*)',
  ],
}
