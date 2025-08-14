import { Outlet } from '@tanstack/react-router'

export function PublicLayout() {
	return (
		<div className="min-h-screen">
			<Outlet />
		</div>
	)
}
