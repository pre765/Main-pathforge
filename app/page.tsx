import UploadForm from "./components/UploadForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-semibold">Resume Analyzer</h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Upload your PDF resume and paste a job description to get an ATS-style analysis.
      </p>
      <UploadForm />
    </main>
  );
}
