import Header, { BottomNav } from '@/components/Header';

/** Zone C · application shell — profile live. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header shell />
      <main className="wrap shell-main">{children}</main>
      <BottomNav />
    </>
  );
}
