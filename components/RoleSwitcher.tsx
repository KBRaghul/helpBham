'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLES } from '@/lib/roles';

export default function RoleSwitcher() {
  const pathname = usePathname();
  return (
    <header style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', borderBottom: '1px solid #ddd', background: '#fff', overflowX: 'auto' }}>
      <Link href="/" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Birmingham Aid</Link>
      <nav style={{ display: 'flex', gap: 8 }}>
        {ROLES.map((r) => {
          const active = pathname.startsWith(`/${r.id}`);
          return (
            <Link
              key={r.id}
              href={`/${r.id}`}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 14,
                whiteSpace: 'nowrap',
                background: active ? '#000' : '#eee',
                color: active ? '#fff' : '#000',
              }}
            >
              {r.label}
            </Link>
          );
        })}
      </nav>
      <span style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 4, fontSize: 12, background: '#fef3c7', color: '#78350f', whiteSpace: 'nowrap' }}>
        Demo mode: no login
      </span>
    </header>
  );
}