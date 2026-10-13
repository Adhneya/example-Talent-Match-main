import SwipeDeck from '@/components/swipe/SwipeDeck';

/**
 * The deck lives in the layout so it is retained while /swipe/[roleId]
 * renders the detail over it.
 */
export default function SwipeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SwipeDeck />
      {children}
    </>
  );
}
