# Authentication and cloud synchronization

The dashboard supports optional Google and GitHub sign-in through Supabase Auth.
Anonymous use remains available through **Continue as guest** and continues to
store data only in the browser.
Authenticated users additionally synchronize one dashboard record to Supabase
PostgreSQL.

## 1. Apply the database schema

In the Supabase dashboard, open **SQL Editor**, create a new query, paste the
contents of [`supabase/schema.sql`](../supabase/schema.sql), and select **Run**.

The script creates `public.dashboard_states`, enables Row Level Security, removes
anonymous access, and allows authenticated users to operate only on the row whose
`user_id` matches their signed-in identity. It is safe to run the script again.

Never add a Supabase service-role key to this application. Browser operations use
the publishable key and are authorized by the user's JWT plus RLS.

## 2. Configure local environment variables

Open **Project Settings > API** in Supabase. Copy the project URL and publishable
key into a new `.env.local` file:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use [`.env.example`](../.env.example) as the template. `.env.local` is ignored by
Git and must never be committed. Restart the development server after changing
environment variables.

## 3. Configure redirect URLs

In **Authentication > URL Configuration** set:

- **Site URL** to `http://localhost:3000` while developing, or the production
  origin after deployment;
- **Redirect URLs** to `http://localhost:3000/auth/callback` and the equivalent
  HTTPS production callback.

Only add origins controlled by the project owner.

## 4. Enable Google

1. In Google Auth Platform create an OAuth client of type **Web application**.
2. Add `http://localhost:3000` as an authorized JavaScript origin for development.
3. Copy the Supabase callback shown under **Authentication > Providers > Google**
   into Google's authorized redirect URIs. It has the form
   `https://PROJECT_REF.supabase.co/auth/v1/callback`.
4. Enable only `openid`, email, and profile scopes.
5. Paste the Google client ID and secret into the Supabase Google provider and
   enable it.

The Google secret belongs in Supabase, not in this repository.

## 5. Enable GitHub

1. Open **GitHub > Settings > Developer settings > OAuth Apps**.
2. Register a new OAuth application.
3. Use the dashboard origin as its homepage.
4. Use the callback displayed by Supabase's GitHub provider:
   `https://PROJECT_REF.supabase.co/auth/v1/callback`.
5. Put the resulting client ID and secret into Supabase and enable GitHub.

GitHub OAuth Apps accept one callback URL. Supabase remains the callback for both
local and production dashboard use.

## Synchronization behavior

- Anonymous changes are saved locally and the application remains fully usable.
- Guest mode creates no Supabase user or database row.
- On a user's first sign-in, an empty cloud account imports the current local
  dashboard automatically.
- If that user already has cloud data, the cloud dashboard is restored locally.
- Signed-in edits are written locally immediately and sent to Supabase after a
  short debounce.
- The most recently synchronized complete dashboard wins; this version does not
  merge simultaneous edits from two open devices.
- A failed cloud write leaves the local copy intact and displays an error state.
- Signing out does not delete either the local copy or the user's cloud row.

OAuth provider tokens are not stored in `dashboard_states`. The application uses
the provider only for identity and does not request access to Google or GitHub
content.

## Production checklist

- Configure the production Site URL and HTTPS callback in Supabase.
- Add the two public Supabase variables to the hosting platform.
- Keep RLS enabled and verify cross-account isolation with two test users.
- Customize Google consent-screen branding and publish status.
- Update provider homepage/privacy-policy URLs.
- Test first login, returning login, logout, two-device restoration, and offline
  behavior.
- Establish database export/backup procedures; downloadable managed backups are
  not included in Supabase's free plan.
