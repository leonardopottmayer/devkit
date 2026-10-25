import { Outlet } from 'react-router'

/** The frame shared by every page: navigation around the current page. */
export function AppLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
