import React from 'react'
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout } from './ui/Layout'
import { ApplicationsPage } from './routes/ApplicationsPage'
import { BoardPage } from './routes/BoardPage'
import { ApplicationDetailPage } from './routes/ApplicationDetailPage'
import { PlatformsPage } from './routes/PlatformsPage'
import { ReferrersPage } from './routes/ReferrersPage'
import { ProfilePage } from './routes/ProfilePage'

const rootRoute = createRootRoute({
  component: () => <Layout />,
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: ApplicationsPage })
const appsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/applications', component: ApplicationsPage })
const appDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/applications/$id', component: ApplicationDetailPage })
const boardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/board', component: BoardPage })
const platformsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/platforms', component: PlatformsPage })
const referrersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/referrers', component: ReferrersPage })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: ProfilePage })

const routeTree = rootRoute.addChildren([
  indexRoute,
  appsRoute,
  appDetailRoute,
  boardRoute,
  platformsRoute,
  referrersRoute,
  profileRoute,
])

export const router = createRouter({ routeTree })


