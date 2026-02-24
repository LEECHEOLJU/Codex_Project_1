'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/', '대시보드'],
  ['/tickets', '티켓 워크벤치'],
  ['/admin/connectors', 'SIEM 연동 관리'],
  ['/admin/mappings', '필드 매핑'],
  ['/admin/custom-fields', '커스텀 필드'],
  ['/admin/workflows', '워크플로우'],
  ['/admin/users', '사용자 계정'],
  ['/admin/templates', '이메일 템플릿'],
  ['/admin/queue', '큐 운영'],
  ['/admin/notifications', '고객 통지 이력']
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <div className="nav">
      {links.map(([href, label]) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className={active ? 'active' : ''}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
