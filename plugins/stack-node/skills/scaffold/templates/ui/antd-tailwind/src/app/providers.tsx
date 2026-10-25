import type { ReactNode } from 'react'
import { StyleProvider } from '@ant-design/cssinjs'
import { App as AntdApp, ConfigProvider, theme } from 'antd'
import enUS from 'antd/locale/en_US'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

/** Every app-wide provider, in one place. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // layer: antd writes its styles into the "antd" CSS layer (see src/index.css).
    <StyleProvider layer>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={enUS} theme={{ algorithm: theme.defaultAlgorithm, token: { borderRadius: 6 } }}>
          {/* App: gives message, notification and modal access to the theme. */}
          <AntdApp className="h-full">{children}</AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </StyleProvider>
  )
}
