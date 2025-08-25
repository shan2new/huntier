import { SignIn } from '@clerk/clerk-react'

export default function AuthPage() {
	return (
		<div className="flex items-center justify-center p-6">
			<div className="rounded-xl p-6 border border-border bg-card">
				<SignIn routing="path" path="/auth" signUpUrl="/auth?mode=signup" />
			</div>
		</div>
	)
}
