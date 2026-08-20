const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UNIVERSITY_DOMAIN = 'saiuniversity.edu.in'
const KNOWN_SCHOOL_CODES = new Set(['SCDS', 'SOL', 'SAS', 'SOAI', 'SOB', 'SOT', 'SOM', 'SAHS'])
const STUDENT_EMAIL_PATTERN = new RegExp(`^[a-z]+\\.[a-z]-\\d{2}@([a-z0-9]+)\\.${UNIVERSITY_DOMAIN.replace(/\./g, '\\.')}$`)
const FACULTY_EMAIL_PATTERN = new RegExp(`^[a-z]+\\.[a-z]@${UNIVERSITY_DOMAIN.replace(/\./g, '\\.')}$`)

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseUniversityEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  const studentMatch = normalized.match(STUDENT_EMAIL_PATTERN)
  if (studentMatch) {
    const school = studentMatch[1].toUpperCase()
    if (!KNOWN_SCHOOL_CODES.has(school)) {
      return { error: 'invalid_format' }
    }
    const local = normalized.split('@')[0]
    const [namePart, rest] = local.split('.')
    const [initial, year] = rest.split('-')
    return {
      kind: 'student',
      email: normalized,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      initial: initial.toUpperCase(),
      school,
      graduationYear: year,
    }
  }

  if (FACULTY_EMAIL_PATTERN.test(normalized)) {
    const local = normalized.split('@')[0]
    const [namePart, initial] = local.split('.')
    return {
      kind: 'faculty',
      email: normalized,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      initial: initial.toUpperCase(),
    }
  }

  return { error: 'invalid_format' }
}

async function findAuthUserIdByEmail(supabaseUrl, serviceRoleKey, email) {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    },
  )

  if (!response.ok) {
    return null
  }

  const payload = await response.json()
  const users = Array.isArray(payload?.users) ? payload.users : Array.isArray(payload) ? payload : []
  const match = users.find((user) => String(user?.email ?? '').toLowerCase() === email)
  return match?.id ?? null
}

function isAlreadyRegistered(error) {
  const message = String(error?.message ?? '').toLowerCase()
  const code = String(error?.code ?? '').toLowerCase()
  return (
    code === 'email_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('user already exists')
  )
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const adminEmail = String(Deno.env.get('ADMIN_EMAIL') ?? '').trim().toLowerCase()
  const studentPassword = Deno.env.get('STUDENT_STANDARD_PASSWORD') ?? ''
  const facultyPassword = Deno.env.get('FACULTY_STANDARD_PASSWORD') ?? ''

  if (!supabaseUrl || !serviceRoleKey || !studentPassword || !facultyPassword) {
    return jsonResponse({ error: 'not_configured' }, 500)
  }

  let payload = {}
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, 400)
  }

  const parsed = parseUniversityEmail(payload.email)
  if (parsed.error) {
    return jsonResponse({ error: 'invalid_format' }, 400)
  }

  if (adminEmail && parsed.email === adminEmail) {
    return jsonResponse({ status: 'skipped' })
  }

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.1')
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const standardPassword = parsed.kind === 'student' ? studentPassword : facultyPassword

  let userId = null
  let created = false

  const createdUser = await admin.auth.admin.createUser({
    email: parsed.email,
    password: standardPassword,
    email_confirm: true,
  })

  if (createdUser.error) {
    if (!isAlreadyRegistered(createdUser.error)) {
      return jsonResponse({ error: 'provision_failed' }, 500)
    }

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, role')
      .eq('email', parsed.email)
      .maybeSingle()

    if (existingProfile?.id) {
      userId = existingProfile.id
    } else {
      userId = await findAuthUserIdByEmail(supabaseUrl, serviceRoleKey, parsed.email)
    }
  } else {
    userId = createdUser.data.user?.id ?? null
    created = true
  }

  if (!userId) {
    return jsonResponse({ status: 'exists' })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role === 'admin' || profile?.role === 'editor') {
    return jsonResponse({ status: 'exists' })
  }

  if (!profile) {
    const role = parsed.kind === 'student' ? 'student' : 'faculty'
    const fullRow = {
      id: userId,
      email: parsed.email,
      role,
      name: parsed.name,
      initial: parsed.initial,
      school: parsed.school ?? null,
      graduation_year: parsed.graduationYear ?? null,
      academic_setup_completed: false,
    }
    const minimalRow = {
      id: userId,
      email: parsed.email,
      role,
      academic_setup_completed: false,
    }

    const firstTry = await admin.from('profiles').insert(fullRow)
    if (firstTry.error && firstTry.error.code !== '23505') {
      const secondTry = await admin.from('profiles').insert(minimalRow)
      if (secondTry.error && secondTry.error.code !== '23505') {
        return jsonResponse({ error: 'profile_failed' }, 500)
      }
    }
  }

  if (parsed.kind === 'faculty') {
    const { data: matches } = await admin
      .from('faculty_members')
      .select('id')
      .eq('is_active', true)
      .is('profile_id', null)
      .ilike('email', parsed.email)

    if (matches?.length === 1) {
      await admin
        .from('faculty_members')
        .update({ profile_id: userId, updated_at: new Date().toISOString() })
        .eq('id', matches[0].id)
        .is('profile_id', null)
    }
  }

  return jsonResponse({ status: created ? 'created' : 'exists' })
})
