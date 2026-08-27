import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'

import { LayoutDashboard, MessagesSquare, Users, FileText, MessageCircle } from 'lucide-react'

import { Button } from '@mtu/ui/button'
import { Separator } from '@mtu/ui/separator'

import { signOut } from '@/lib/actions/auth'
import { requireAdminProfile } from '@/lib/auth'

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/forums', label: 'Forums', icon: MessagesSquare },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/comments', label: 'Comments', icon: MessageCircle },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdminProfile()
  if (!admin) redirect('/login')

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <Image
            src="/logo.jpeg"
            alt="MTU Hub"
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-lg object-cover"
            priority
          />
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold tracking-tight">
              MTU Admin
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              @{admin.username}
            </p>
          </div>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
