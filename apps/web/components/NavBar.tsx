'use client';

import {
  BookOpenIcon,
  Brain,
  HomeIcon,
  LogIn,
  LogOutIcon,
  MessageCircleIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkClass = (active: boolean) =>
  `inline-block rounded-[10px] border px-2.5 py-2 no-underline ${
    active
      ? 'border-[rgba(79,140,255,0.45)] bg-[rgba(79,140,255,0.14)] font-[650] text-[#cfe2ff]'
      : 'border-transparent font-medium text-(--text)'
  }`;

export function NavBar({
  isAuthed,
  onLogout,
}: {
  isAuthed: boolean;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const appTitle = process.env.NEXT_PUBLIC_TITLE ?? 'Stocks101';

  return (
    <header className='sticky top-0 z-10 border-b border-(--border) bg-[rgba(6,10,20,0.85)] px-4 py-3.5 backdrop-blur-sm'>
      <div className='mx-auto flex max-w-[980px] flex-wrap items-center gap-3'>
        <h1 className='m-0 font-extrabold text-white'>{appTitle}</h1>
        <nav className='ml-auto flex flex-wrap gap-2'>
          {isAuthed ? (
            <>
              <Link
                href='/dashboard'
                className={linkClass(pathname === '/dashboard')}
              >
                <HomeIcon className='w-4 h-4 inline-block' />
              </Link>
              <Link href='/risk' className={linkClass(pathname === '/risk')}>
                <Brain className='w-4 h-4 inline-block' />
              </Link>
              <Link href='/coach' className={linkClass(pathname === '/coach')}>
                <MessageCircleIcon className='w-4 h-4 inline-block' />
              </Link>
              <Link href='/brief' className={linkClass(pathname === '/brief')}>
                <BookOpenIcon className='w-4 h-4 inline-block' />
              </Link>
              <Link
                href='/settings'
                aria-label='Settings'
                className={linkClass(pathname === '/settings')}
              >
                <SettingsIcon className='w-4 h-4 inline-block' />
              </Link>
              <button
                onClick={onLogout}
                aria-label='Log out'
                className='cursor-pointer rounded-[10px] border border-(--border) bg-[rgba(255,255,255,0.03)] px-2.5 py-2 font-semibold text-(--text)'
              >
                <LogOutIcon className='w-4 h-4 inline-block' />
              </button>
            </>
          ) : (
            <>
              <Link
                href='/auth/login'
                aria-label='Log in'
                className={linkClass(pathname === '/auth/login')}
              >
                <LogIn className='w-4 h-4 inline-block' />
              </Link>
              <Link
                href='/auth/signup'
                aria-label='Sign up'
                className={linkClass(pathname === '/auth/signup')}
              >
                <LogIn className='w-4 h-4 inline-block' />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
