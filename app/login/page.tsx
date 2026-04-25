type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next = "/admin", error } = await searchParams;

  return (
    <section style={{ maxWidth: 380, margin: "48px auto" }}>
      <h2>Coach sign-in</h2>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>
        Enter the admin password to manage players and matches.
      </p>
      <form action="/api/login" method="post" className="form">
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          autoComplete="current-password"
        />
        {error && <div className="error">Incorrect password.</div>}
        <button type="submit">Sign in</button>
      </form>
    </section>
  );
}
