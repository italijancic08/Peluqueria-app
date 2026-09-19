export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        {children}
      </div>
    </div>
  );
}