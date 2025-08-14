import { SignIn } from '@clerk/clerk-react'

export default function AuthPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="glass border-border/20 rounded-xl p-6">
				<SignIn routing="path" path="/auth" signUpUrl="/auth?mode=signup" />
			</div>
		</div>
	)
}
