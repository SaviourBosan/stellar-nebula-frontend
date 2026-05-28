import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'

const Home = lazy(() => import('../pages/Home'))
const Marketplace = lazy(() => import('../pages/Marketplace'))
const NebulaView = lazy(() => import('../pages/NebulaView'))
const NotFound = lazy(() => import('../pages/NotFound'))
const ShipDashboard = lazy(() => import('../pages/ShipDashboard'))

const withSuspense = (component: ReactNode) => (
  <Suspense fallback={<div className="route-loader">Charting course...</div>}>
    {component}
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<Home />),
      },
      {
        path: 'nebula',
        element: withSuspense(<NebulaView />),
      },
      {
        path: 'dashboard',
        element: withSuspense(<ShipDashboard />),
      },
      {
        path: 'marketplace',
        element: withSuspense(<Marketplace />),
      },
      {
        path: '*',
        element: withSuspense(<NotFound />),
      },
    ],
  },
])
