import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-primary">{SITE_NAME}</h1>
      <p className="mt-3 max-w-md text-lg text-muted">{SITE_TAGLINE}</p>
    </main>
  );
}
