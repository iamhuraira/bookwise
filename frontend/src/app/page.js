async function getBackendStatus() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      cache: 'no-store',
    });
    if (res.ok) return 'connected';
    return 'not connected';
  } catch {
    return 'not connected';
  }
}

export default async function Home() {
  const status = await getBackendStatus();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">BookWise</h1>
      <p>Backend status: {status}</p>
    </main>
  );
}
