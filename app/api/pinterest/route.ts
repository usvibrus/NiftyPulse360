import { NextResponse } from 'next/server'

export async function GET() {
  const authUrl = `https://www.pinterest.com/oauth/?client_id=1571383&redirect_uri=${encodeURIComponent('https://niftypulse360.com/pinterest/callback')}&response_type=code&scope=boards:read,pins:read,pins:write`
  return NextResponse.redirect(authUrl)
}
