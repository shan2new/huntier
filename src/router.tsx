
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Error500 } from './components/Error500'
import { Layout } from './ui/Layout'
import { PublicLayout } from './ui/PublicLayout'
import { LandingPage } from './routes/LandingPage'
import AuthPage from './routes/AuthPage'
import { ApplicationsPage } from './routes/ApplicationsPage'
import { InProgressApplicationsPage } from './routes/applications/InProgressPage'
import { InterviewingApplicationsPage } from './routes/applications/InterviewingPage'
import { CompletedApplicationsPage } from './routes/applications/CompletedPage'
import { ArchivedApplicationsPage } from './routes/applications/ArchivedPage'
import { WishlistApplicationsPage } from './routes/applications/WishlistPage'
import { BoardPage } from './routes/BoardPage'
import { ApplicationDetailPage } from './routes/ApplicationDetailPage'
import { PlatformsPage } from './routes/PlatformsPage'
import { ReferrersPage } from './routes/ReferrersPage'
import { ContactsPage } from './routes/ContactsPage'
import { ProfilePage } from './routes/ProfilePage'
import { ResumeList } from './routes/resumes/index'
import { ResumeBuilder } from './routes/resumes/ResumeBuilder'
import { DashboardPage } from './routes/DashboardPage'
import ResumePrintPage from './routes/resumes/ResumePrintPage'
import { ExtensionConnectPage } from './routes/extension/Connect'
import { CompaniesPage } from './routes/CompaniesPage'
import AutofillInputsPage from './routes/autofill/InputsPage'
import AutofillTemplatesPage from './routes/autofill/TemplatesPage'
import { CompanyGroupsPage } from './routes/companies/GroupsPage'
import { CompanyGroupDetailPage } from './routes/companies/$groupId'
 
 
// Single root for the app with error fallback
const rootRoute = createRootRoute({
  component: undefined,
  errorComponent: () => <Error500 />,
})

// Public layout branch (layout routes should have an id, not a path)
const publicLayout = createRoute({
	getParentRoute: () => rootRoute,
	id: 'public',
	component: PublicLayout,
})

const landing = createRoute({ getParentRoute: () => publicLayout, path: '/', component: LandingPage })
const auth = createRoute({ getParentRoute: () => publicLayout, path: '/auth', component: AuthPage })
const resumePrintRoute = createRoute({ getParentRoute: () => publicLayout, path: '/p/resumes/$resumeId', component: () => {
	const { resumeId } = resumePrintRoute.useParams()
	return <ResumePrintPage resumeId={resumeId} />
} })
const extConnectRoute = createRoute({ getParentRoute: () => publicLayout, path: '/extension/connect', component: ExtensionConnectPage })

// App (protected via Clerk in main.tsx, but organized under an app layout)
const appLayout = createRoute({
	getParentRoute: () => rootRoute,
	id: 'app',
	component: Layout,
})

const appsRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications', component: ApplicationsPage })
const dashboardRoute = createRoute({ getParentRoute: () => appLayout, path: '/dashboard', component: DashboardPage })
const appsInProgressRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications/in-progress', component: InProgressApplicationsPage })
const appsInterviewingRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications/interviewing', component: InterviewingApplicationsPage })
const appsCompletedRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications/completed', component: CompletedApplicationsPage })
const appsWishlistRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications/wishlist', component: WishlistApplicationsPage })
const appsArchivedRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications/archived', component: ArchivedApplicationsPage })
const appDetailRoute = createRoute({ getParentRoute: () => appLayout, path: '/applications/$id', component: ApplicationDetailPage })
const boardRoute = createRoute({ getParentRoute: () => appLayout, path: '/board', component: BoardPage })
const platformsRoute = createRoute({ getParentRoute: () => appLayout, path: '/platforms', component: PlatformsPage })
const referrersRoute = createRoute({ getParentRoute: () => appLayout, path: '/referrers', component: ReferrersPage })
const contactsRoute = createRoute({ getParentRoute: () => appLayout, path: '/contacts', component: ContactsPage })
const profileRoute = createRoute({ getParentRoute: () => appLayout, path: '/profile', component: ProfilePage })
const companiesRoute = createRoute({ getParentRoute: () => appLayout, path: '/companies', component: CompaniesPage })
const companiesGroupsRoute = createRoute({ getParentRoute: () => appLayout, path: '/companies/groups', component: CompanyGroupsPage })
const companyGroupDetailRoute = createRoute({ getParentRoute: () => appLayout, path: '/companies/groups/$groupId', component: () => {
  const { groupId } = companyGroupDetailRoute.useParams()
  return <CompanyGroupDetailPage groupId={groupId} />
} })

// Autofill assistant (split)
const autofillInputsRoute = createRoute({ getParentRoute: () => appLayout, path: '/autofill/inputs', component: AutofillInputsPage })
const autofillTemplatesRoute = createRoute({ getParentRoute: () => appLayout, path: '/autofill/templates', component: AutofillTemplatesPage })
const autofillRedirectRoute = createRoute({ getParentRoute: () => appLayout, path: '/autofill', component: () => {
  // Client-side redirect to inputs
  if (typeof window !== 'undefined') {
    window.location.replace('/autofill/inputs')
  }
  return null
} })
 

// Resume routes
const resumeListRoute = createRoute({ getParentRoute: () => appLayout, path: '/resumes', component: ResumeList })
const resumeBuilderRoute = createRoute({ 
  getParentRoute: () => appLayout, 
  path: '/resumes/$resumeId', 
  component: () => {
    const { resumeId } = resumeBuilderRoute.useParams()
    return <ResumeBuilder resumeId={resumeId} />
  }
})

const routeTree = rootRoute.addChildren([
	publicLayout.addChildren([landing, auth, resumePrintRoute, extConnectRoute]),
	appLayout.addChildren([
		dashboardRoute,
		appsRoute,
		appsWishlistRoute,
		appsArchivedRoute,
		appsInProgressRoute,
		appsInterviewingRoute,
		appsCompletedRoute,
		appDetailRoute,
		boardRoute,
		platformsRoute,
		contactsRoute,
		referrersRoute,
		profileRoute,
		companiesRoute,
		companiesGroupsRoute,
		companyGroupDetailRoute,
		autofillRedirectRoute,
		autofillInputsRoute,
		autofillTemplatesRoute,
		resumeListRoute,
		resumeBuilderRoute,
	]),
])

export const router = createRouter({ routeTree })
