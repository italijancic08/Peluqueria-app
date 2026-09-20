export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6E4D3] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-[#EDD9C4] p-8">
        {children}
      </div>
    </div>
  );
}