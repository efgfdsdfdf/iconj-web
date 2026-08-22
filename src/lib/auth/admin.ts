import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = 'ezeilodavid292@gmail.com';

/**
 * Centrally verifies if the current authenticated user is the authorized admin.
 * @returns {Promise<{ isAdmin: boolean, userId: string | null }>}
 */
export async function verifyAdmin() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return { isAdmin: false, userId: user?.id || null };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * Throws an error if the user is not an admin. Use this in Server Actions to strictly block unauthorized access.
 */
export async function requireAdmin() {
  const { isAdmin, userId } = await verifyAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required.');
  }
  return userId;
}
