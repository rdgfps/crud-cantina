"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient é criado dentro do estado para evitar compartilhamento entre requests (SSR)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Revalida os dados quando o usuário volta para a aba
            refetchOnWindowFocus: true,
            // Retry apenas 1x em caso de erro
            retry: 1,
            staleTime: 30_000, // 30s — dados ficam "frescos" por esse tempo
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Toast global — aparece em qualquer página */}
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: "hsl(0 0% 9%)",
            border: "1px solid hsl(0 0% 18%)",
            color: "hsl(0 0% 96%)",
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
