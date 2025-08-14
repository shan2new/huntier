
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout } from './ui/Layout'
import { PublicLayout } from './ui/PublicLayout'
import { LandingPage } from './routes/LandingPage'
import AuthPage from './routes/AuthPage'
import { ApplicationsPage } from './routes/ApplicationsPage'
import { BoardPage } from './routes/BoardPage'
import { ApplicationDetailPage } from './routes/ApplicationDetailPage'
import { PlatformsPage } from './routes/PlatformsPage'
import { ReferrersPage } from './routes/ReferrersPage'
import { ProfilePage } from './routes/ProfilePage'

// Single root for the app
const rootRoute = createRootRoute()

// Public layout branch (layout routes should have an id, not a path)
const publicLayout = createRoute({
	getParentRoute: () => rootRoute,
	id: 'public',
	component: PublicLayout,
})

const landing = createRoute({ getParentRoute: () => publicLayout, path: '/', component: LandingPage })
const auth = createRoute({ getParentRoute: () => publicLayout, path: '/auth', component: AuthPage })

// App (protected via Clerk in main.tsx, but organized under an app layout)
const appLayout = createRoute({
	getParentRoute: () => rootRoute,
	id: 'app',
	component: Layout,
})

const appsRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications', component: ApplicationsPage })
const appDetailRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications/$id', component: ApplicationDetailPage })
const boardRoute = createRoute({ getParentRoute: () => appLayout, path: '/board', component: BoardPage })
const platformsRoute = createRoute({ getParentRoute: () => appLayout, path: '/platforms', component: PlatformsPage })
const referrersRoute = createRoute({ getParentRoute: () => appLayout, path: '/referrers', component: ReferrersPage })
const profileRoute = createRoute({ getParentRoute: () => appLayout, path: '/profile', component: ProfilePage })

const routeTree = rootRoute.addChildren([
	publicLayout.addChildren([landing, auth]),
	appLayout.addChildren([
		appsRoute,
		appDetailRoute,
		boardRoute,
		platformsRoute,
		referrersRoute,
		profileRoute,
	]),
])

export const router = createRouter({ routeTree })


