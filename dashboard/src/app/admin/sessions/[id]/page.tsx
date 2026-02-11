import { notFound } from 'next/navigation';
import AdminSessionChat from './AdminSessionChat';

export const dynamic = 'force-dynamic';

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  return <AdminSessionChat sessionId={id} />;
}
