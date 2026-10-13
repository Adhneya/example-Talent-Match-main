'use client';

import { useParams } from 'next/navigation';
import RoleDetailSheet from '@/components/swipe/RoleDetailSheet';

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  return <RoleDetailSheet key={roleId} roleId={roleId} />;
}
