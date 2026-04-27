"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Wallet, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/venda", icon: ShoppingCart, label: "Nova Venda" },
  { href: "/deposito", icon: Wallet, label: "Depósito" },
  { href: "/produtos", icon: Package, label: "Produtos" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col min-h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-lg">
            🥐
          </div>
          <div>
            <p className="font-bold text-sm leading-none text-foreground">
              Cantina
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Escolar</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon
                size={18}
                className={active ? "text-primary" : ""}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          API: {process.env.NEXT_PUBLIC_API_URL || "localhost:3000"}
        </p>
      </div>
    </aside>
  )
}
