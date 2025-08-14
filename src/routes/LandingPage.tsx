import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { BlurFade } from '@/components/magicui/blur-fade'
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { FloatingShapes } from '@/components/magicui/floating-shapes'
import { ParticleField } from '@/components/magicui/particle-field'

export function LandingPage() {
	const { isSignedIn } = useUser()
	const navigate = useNavigate()
	
	const mouseX = useMotionValue(0)
	const mouseY = useMotionValue(0)
	const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 })
	const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 })

	useEffect(() => {
		if (isSignedIn) {
			navigate({ to: '/applications' })
		}
	}, [isSignedIn, navigate])

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const { clientX, clientY } = e
			mouseX.set(clientX)
			mouseY.set(clientY)
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [mouseX, mouseY])

	return (
		<div className="min-h-screen flex flex-col relative overflow-hidden">
			{/* Enhanced background layers */}
			<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95"></div>
			<ParticleField />
			<DotPattern 
				width={20} 
				height={20} 
				cx={1} 
				cy={1} 
				cr={1} 
				className="fill-muted-foreground/[0.02] dark:fill-muted-foreground/[0.05]" 
			/>
			<FloatingShapes />
			
			{/* Interactive cursor follow effect */}
			<motion.div
				className="pointer-events-none fixed w-6 h-6 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 blur-lg"
				style={{
					x: smoothMouseX,
					y: smoothMouseY,
					translateX: '-50%',
					translateY: '-50%',
				}}
			/>
			
			<motion.header 
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="relative z-50 w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between"
			>
				<motion.div 
					className="flex items-center space-x-3"
					whileHover={{ scale: 1.02 }}
					transition={{ duration: 0.2 }}
				>
					<motion.div 
						className="relative flex h-9 w-9 items-center justify-center"
						whileHover={{ rotate: 5 }}
						transition={{ duration: 0.3 }}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-full h-full">
							<defs>
								<linearGradient id="heroIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
									<stop offset="100%" style={{stopColor:'#1D4ED8', stopOpacity:1}} />
								</linearGradient>
								<linearGradient id="heroTierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" style={{stopColor:'#60A5FA', stopOpacity:0.8}} />
									<stop offset="100%" style={{stopColor:'#3B82F6', stopOpacity:0.6}} />
								</linearGradient>
							</defs>
							
							{/* Background circle for better icon definition */}
							<circle cx="24" cy="24" r="22" fill="url(#heroIconGradient)" opacity="0.1"/>
							
							{/* H symbol with tier elements for icon */}
							<g fill="url(#heroIconGradient)">
								{/* Main H structure */}
								<rect x="12" y="12" width="4" height="24" rx="2"/>
								<rect x="32" y="12" width="4" height="24" rx="2"/>
								<rect x="12" y="22" width="24" height="4" rx="2"/>
								
								{/* Tier steps ascending - simplified for icon */}
								<rect x="38" y="32" width="6" height="2" rx="1" fill="url(#heroTierGradient)"/>
								<rect x="40" y="28" width="6" height="2" rx="1" fill="url(#heroTierGradient)"/>
								<rect x="42" y="24" width="4" height="2" rx="1" fill="url(#heroIconGradient)"/>
							</g>
						</svg>
					</motion.div>
					<span className="text-xl font-semibold tracking-tight">Huntier</span>
				</motion.div>
				<motion.div 
					className="flex items-center gap-3"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					<SignInButton mode="modal">
						<Button variant="ghost" size="sm" className="hover:scale-105 transition-transform duration-200">Sign in</Button>
					</SignInButton>
					<SignUpButton mode="modal">
						<Button size="sm" className="hover:scale-105 transition-transform duration-200 shadow-soft">Join beta</Button>
					</SignUpButton>
				</motion.div>
			</motion.header>

			<main className="relative z-40 flex-1 w-full max-w-7xl mx-auto px-6 py-20 md:py-32">
				<div className="text-center space-y-16 max-w-5xl mx-auto">
					{/* Hero content */}
					<div className="space-y-12">
						<BlurFade delay={0.3} duration={0.6}>
							<motion.div 
								className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 text-primary text-sm font-medium shadow-soft"
								whileHover={{ scale: 1.05, y: -2 }}
								transition={{ duration: 0.2 }}
							>
								<motion.div 
									className="w-2 h-2 bg-primary rounded-full shadow-lg"
									animate={{ 
										scale: [1, 1.3, 1],
										boxShadow: ["0 0 0 0 rgb(59 130 246 / 0.4)", "0 0 0 4px rgb(59 130 246 / 0.1)", "0 0 0 0 rgb(59 130 246 / 0)"]
									}}
									transition={{ duration: 2, repeat: Infinity }}
								></motion.div>
								<span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-semibold">
									Private Beta
								</span>
							</motion.div>
						</BlurFade>
						
						<BlurFade delay={0.5} duration={0.8}>
							<div className="space-y-8">
								<motion.h1 
									className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight"
									whileHover={{ scale: 1.02 }}
									transition={{ duration: 0.3 }}
								>
									<motion.span 
										className="block bg-gradient-to-b from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.6, duration: 0.6 }}
									>
										Job hunting is
									</motion.span>
									<motion.span 
										className="block bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.8, duration: 0.6 }}
									>
										exhausting.
									</motion.span>
									<motion.span 
										className="block bg-gradient-to-r from-primary via-blue-500 to-cyan-400 bg-clip-text text-transparent mt-2"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 1.0, duration: 0.6 }}
									>
										We made it simple.
									</motion.span>
								</motion.h1>
								
								{/* Enhanced decorative elements */}
								<div className="flex items-center justify-center gap-4">
									<motion.div 
										className="w-12 h-px bg-gradient-to-r from-transparent via-primary/50 to-primary/80"
										initial={{ scaleX: 0, originX: 0 }}
										animate={{ scaleX: 1 }}
										transition={{ delay: 1.2, duration: 0.8 }}
									/>
									<motion.div 
										className="w-2 h-2 rounded-full bg-primary"
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ delay: 1.4, duration: 0.4 }}
									/>
									<motion.div 
										className="w-12 h-px bg-gradient-to-r from-primary/80 via-primary/50 to-transparent"
										initial={{ scaleX: 0, originX: 1 }}
										animate={{ scaleX: 1 }}
										transition={{ delay: 1.2, duration: 0.8 }}
									/>
								</div>
							</div>
						</BlurFade>
						
						<BlurFade delay={0.7} duration={0.8}>
							<div className="max-w-4xl mx-auto space-y-8">
								<AnimatedShinyText className="text-lg md:text-xl leading-relaxed font-light">
									Stop drowning in spreadsheets and scattered notes. Find peace in your job search.
								</AnimatedShinyText>
								
								<div className="grid md:grid-cols-3 gap-6 text-center">
									{[
										{ emoji: "😫", text: "Endless spreadsheets", bad: true },
										{ emoji: "→", text: "becomes", neutral: true },
										{ emoji: "😌", text: "Calm organization", good: true }
									].map((item, index) => (
										<motion.div
											key={index}
											className={`p-4 rounded-2xl ${
												item.bad ? 'bg-red-500/5 border border-red-500/20' :
												item.good ? 'bg-green-500/5 border border-green-500/20' :
												'bg-muted/20'
											}`}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 1.5 + index * 0.2, duration: 0.6 }}
											whileHover={{ scale: 1.05, y: -2 }}
										>
											<div className="text-3xl mb-2">{item.emoji}</div>
											<p className={`text-sm font-medium ${
												item.bad ? 'text-red-600/80' :
												item.good ? 'text-green-600/80' :
												'text-muted-foreground'
											}`}>
												{item.text}
											</p>
										</motion.div>
									))}
								</div>
								
								<motion.p 
									className="text-base md:text-lg text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 2.1, duration: 0.6 }}
								>
									<span className="text-primary font-medium">Finally</span>, a job tracker that reduces stress instead of adding to it.
								</motion.p>
							</div>
						</BlurFade>
					</div>

					{/* CTA Section */}
					<BlurFade delay={0.9} duration={0.6}>
						<div className="space-y-8">
							<div className="flex flex-col sm:flex-row items-center justify-center gap-6">
								<SignUpButton mode="modal">
									<motion.div
										whileHover={{ scale: 1.02, y: -4 }}
										whileTap={{ scale: 0.98 }}
										transition={{ duration: 0.2 }}
										className="relative group"
									>
										{/* Enhanced glow effect */}
										<div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-cyan-400 opacity-20 group-hover:opacity-50 rounded-3xl blur-lg transition-all duration-500"></div>
										<div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-30 group-hover:opacity-60 rounded-2xl blur transition-all duration-300"></div>
										
										<Button size="lg" className="relative h-18 px-10 text-xl font-bold bg-gradient-to-r from-primary via-blue-600 to-primary hover:from-blue-600 hover:via-primary hover:to-blue-600 shadow-soft-lg hover:shadow-soft-lg border-0 rounded-2xl overflow-hidden">
											{/* Animated background */}
											<motion.div
												className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
												initial={{ x: '-100%' }}
												whileHover={{ x: '100%' }}
												transition={{ duration: 0.6 }}
											/>
											<span className="relative flex items-center gap-4">
												<span className="flex flex-col items-start">
													<span className="text-lg leading-none">Start your PEACEFUL HUNT</span>
												</span>
												<motion.svg 
													className="w-6 h-6"
													initial={{ x: 0 }}
													whileHover={{ x: 6 }}
													transition={{ duration: 0.2 }}
													fill="currentColor" 
													viewBox="0 0 20 20"
												>
													<path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
												</motion.svg>
											</span>
										</Button>
									</motion.div>
								</SignUpButton>
								

							</div>
							
							{/* Enhanced trust indicators */}
							<motion.div 
								className="flex flex-wrap items-center justify-center gap-4 text-sm"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.8, duration: 0.6 }}
							>
								{[
									{ icon: "🔒", text: "Secure & Private" },
									{ icon: "⚡", text: "Instant Setup" }
								].map((item, index) => (
									<motion.div
										key={item.text}
										className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 border border-border/20 min-w-[140px] justify-center"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 2.0 + index * 0.1, duration: 0.4 }}
										whileHover={{ scale: 1.05 }}
									>
										<span className="text-lg">{item.icon}</span>
										<span className="font-medium text-foreground/80 whitespace-nowrap">{item.text}</span>
									</motion.div>
								))}
							</motion.div>
						</div>
					</BlurFade>

					{/* Features section */}
					<div className="pt-20 md:pt-32">
						<BlurFade delay={1.1} duration={0.8}>
							<div className="space-y-12 max-w-4xl mx-auto">
								<div className="text-center space-y-6">
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 1.3, duration: 0.6 }}
									>
										<motion.h2 
											className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
											whileHover={{ scale: 1.02 }}
											transition={{ duration: 0.3 }}
										>
											Everything in three buckets
										</motion.h2>
										<motion.p 
											className="text-base md:text-lg text-muted-foreground/70 mt-4 max-w-2xl mx-auto leading-relaxed"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 1.5, duration: 0.6 }}
										>
											No overwhelming dashboards. No confusing metrics. Just the essentials that actually matter.
										</motion.p>
									</motion.div>
									
									{/* Social proof elements */}
									<div className="flex flex-wrap items-center justify-center gap-4">
										<motion.div
											className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: 1.7, duration: 0.5 }}
											whileHover={{ scale: 1.05 }}
										>
											<span className="text-2xl">💭</span>
											<span className="text-sm font-medium text-foreground/80">
												"I wish job tracking was this simple everywhere"
											</span>
										</motion.div>
									</div>
								</div>
								
								<div className="grid md:grid-cols-3 gap-6">
									{[
										{ 
											title: "Applications", 
											desc: "Track where you applied and current status. No endless columns.",
											icon: "📝",
											gradient: "from-blue-500/10 to-blue-600/5",
											highlight: "Simple tracking"
										},
										{ 
											title: "Conversations", 
											desc: "Log recruiter calls and emails. Remember important details.",
											icon: "💬",
											gradient: "from-green-500/10 to-green-600/5",
											highlight: "Never forget context"
										},
										{ 
											title: "Interviews", 
											desc: "Schedule rounds and track feedback. Stay organized.",
											icon: "🗓️",
											gradient: "from-purple-500/10 to-purple-600/5",
											highlight: "Timeline clarity"
										}
									].map((item, index) => (
										<BlurFade key={item.title} delay={1.5 + index * 0.15} duration={0.6}>
											<motion.div 
												className={`group relative h-full flex flex-col p-6 rounded-2xl bg-gradient-to-br ${item.gradient} backdrop-blur border border-border/20 hover:border-primary/30 transition-all duration-300 overflow-hidden`}
												whileHover={{ scale: 1.02, y: -4 }}
												transition={{ duration: 0.3, ease: "easeOut" }}
											>
												{/* Enhanced glow effect */}
												<motion.div 
													className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
													initial={false}
												/>
												
												{/* Floating particles on hover */}
												<motion.div
													className="absolute top-3 right-3 w-1 h-1 bg-primary/40 rounded-full"
													animate={{
														y: [0, -8, 0],
														opacity: [0.3, 1, 0.3],
													}}
													transition={{
														duration: 3,
														repeat: Infinity,
														delay: index * 0.5,
													}}
												/>
												
												<div className="relative flex flex-col h-full text-center">
													<motion.div 
														className="text-3xl mb-4"
														whileHover={{ scale: 1.2, rotate: 10 }}
														transition={{ duration: 0.3, ease: "backOut" }}
													>
														{item.icon}
													</motion.div>
													
													<div className="flex flex-col flex-1 space-y-3">
														<h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
															{item.title}
														</h3>
														<p className="text-muted-foreground/80 text-sm leading-relaxed flex-1">
															{item.desc}
														</p>
														<motion.div
															className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mt-auto"
															initial={{ opacity: 0, scale: 0.8 }}
															whileInView={{ opacity: 1, scale: 1 }}
															transition={{ delay: 0.2, duration: 0.4 }}
														>
															<motion.div
																className="w-1.5 h-1.5 bg-primary rounded-full"
																animate={{ scale: [1, 1.5, 1] }}
																transition={{ duration: 2, repeat: Infinity }}
															/>
															{item.highlight}
														</motion.div>
													</div>
												</div>
											</motion.div>
										</BlurFade>
									))}
								</div>
							</div>
						</BlurFade>
					</div>

				</div>
			</main>

			<BlurFade delay={2.2} duration={0.8}>
				<footer className="relative w-full mt-32 border-t border-border/10 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur-xl">
					{/* Subtle gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-primary/[0.02]"></div>
					
					<div className="relative w-full max-w-7xl mx-auto px-6 py-16">
						<div className="flex flex-col items-center space-y-12">
							{/* Logo section */}
							<motion.div 
								className="flex flex-col items-center space-y-4"
								whileHover={{ scale: 1.02 }}
								transition={{ duration: 0.3 }}
							>
								<div className="relative flex h-12 w-12 items-center justify-center">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-full h-full">
										<defs>
											<linearGradient id="footerIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:0.8}} />
												<stop offset="100%" style={{stopColor:'#1D4ED8', stopOpacity:0.6}} />
											</linearGradient>
										</defs>
										<circle cx="24" cy="24" r="22" fill="url(#footerIconGradient)" opacity="0.1"/>
										<g fill="url(#footerIconGradient)">
											<rect x="12" y="12" width="4" height="24" rx="2"/>
											<rect x="32" y="12" width="4" height="24" rx="2"/>
											<rect x="12" y="22" width="24" height="4" rx="2"/>
											<rect x="38" y="32" width="6" height="2" rx="1"/>
											<rect x="40" y="28" width="6" height="2" rx="1"/>
											<rect x="42" y="24" width="4" height="2" rx="1"/>
										</g>
									</svg>
								</div>
								<div className="text-center space-y-2">
									<h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
										Huntier
									</h3>
									<p className="text-muted-foreground/70 text-sm">
										Job hunting, simplified.
									</p>
								</div>
							</motion.div>
							
							{/* Elegant tagline */}
							<div className="text-center max-w-lg space-y-4">
								<p className="text-muted-foreground/80 leading-relaxed">
									Private beta access for professionals who value clarity and peace of mind during their job search journey.
								</p>
								
								{/* Sign in CTA */}
								<SignInButton mode="modal">
									<motion.button 
										className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent/30 to-accent/20 hover:from-accent/40 hover:to-accent/30 border border-border/30 text-sm font-medium text-foreground hover:text-foreground transition-all duration-200"
										whileHover={{ scale: 1.02, y: -2 }}
										transition={{ duration: 0.2 }}
									>
										<span>Already have an account?</span>
										<motion.svg 
											className="w-4 h-4"
											initial={{ x: 0 }}
											whileHover={{ x: 2 }}
											transition={{ duration: 0.2 }}
											fill="currentColor" 
											viewBox="0 0 20 20"
										>
											<path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
										</motion.svg>
									</motion.button>
								</SignInButton>
							</div>
							
							{/* Bottom section */}
							<div className="w-full pt-8 border-t border-border/10">
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
									<div className="flex items-center gap-6">
										<span>© 2025 Huntier</span>
										<div className="w-px h-4 bg-border/20"></div>
										<span>All rights reserved</span>
									</div>
									<div className="flex items-center gap-4">
										<span className="flex items-center gap-2">
											<div className="w-2 h-2 bg-green-500/60 rounded-full animate-pulse"></div>
											<span>Private & Secure</span>
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</footer>
			</BlurFade>
		</div>
	)
}
