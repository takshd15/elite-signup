import Link from 'next/link'

export default function LandingPage () {
	return (
		<div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-100 dark:from-slate-900 dark:to-slate-950'>
			{/* Header */}
			<header className='w-full flex items-center justify-between px-8 py-4 shadow-sm bg-white dark:bg-slate-900'>
				<div className='flex items-center gap-4'>
					<img src='/placeholder-logo.svg' alt='Elite Score Logo' className='h-8 w-8'/>
					<span className='text-xl font-bold tracking-tight'>Elite Score</span>
					<nav className='hidden md:flex gap-6 ml-8'>
						<Link href='#home' className='hover:text-blue-600 transition'>Home</Link>
						<Link href='#about' className='hover:text-blue-600 transition'>About</Link>
						<Link href='#features' className='hover:text-blue-600 transition'>Features</Link>
						<Link href='#contact' className='hover:text-blue-600 transition'>Contact</Link>
					</nav>
				</div>
				<div className='flex items-center gap-4'>
					<Link href='/login' className='text-sm font-medium hover:underline'>Log In</Link>
					<Link href='/signup' className='bg-blue-600 text-white px-4 py-2 rounded-md font-semibold shadow hover:bg-blue-700 transition'>Sign Up</Link>
				</div>
			</header>

			{/* Hero Section */}
			<section id='home' className='flex flex-col items-center justify-center flex-1 text-center px-4 py-16'>
				<h1 className='text-4xl md:text-6xl font-extrabold mb-4'>Compete. Improve. Achieve.</h1>
				<p className='text-lg md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl'>Track your journey to excellence with Elite Score. Join a community of ambitious students and professionals, and level up your skills through gamified challenges and real progress.</p>
				<Link href='/login' className='bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-700 transition'>Get Started</Link>
				<div className='mt-12'>
					<img src='/placeholder.jpg' alt='App Preview' className='mx-auto rounded-xl shadow-lg w-full max-w-2xl'/>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-16 bg-slate-50 dark:bg-slate-900'>
				<div className='max-w-5xl mx-auto px-4'>
					<h2 className='text-3xl font-bold text-center mb-10'>Why Elite Score?</h2>
					<div className='grid md:grid-cols-3 gap-8'>
						<div className='bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center'>
							<span className='text-blue-600 text-4xl mb-4'>🏆</span>
							<h3 className='font-semibold text-lg mb-2'>Personalized Roadmaps</h3>
							<p className='text-slate-600 dark:text-slate-300 text-center'>Get daily, weekly, and monthly challenges tailored to your goals.</p>
						</div>
						<div className='bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center'>
							<span className='text-blue-600 text-4xl mb-4'>🎮</span>
							<h3 className='font-semibold text-lg mb-2'>Gamified Progress</h3>
							<p className='text-slate-600 dark:text-slate-300 text-center'>Earn XP, badges, and level up as you complete real activities.</p>
						</div>
						<div className='bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center'>
							<span className='text-blue-600 text-4xl mb-4'>🤝</span>
							<h3 className='font-semibold text-lg mb-2'>Peer Comparison</h3>
							<p className='text-slate-600 dark:text-slate-300 text-center'>See how you stack up against friends and top performers.</p>
						</div>
					</div>
					<div className='grid md:grid-cols-2 gap-8 mt-8'>
						<div className='bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center'>
							<span className='text-blue-600 text-4xl mb-4'>🌐</span>
							<h3 className='font-semibold text-lg mb-2'>Communities</h3>
							<p className='text-slate-600 dark:text-slate-300 text-center'>Join groups, network, and collaborate on projects.</p>
						</div>
						<div className='bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center'>
							<span className='text-blue-600 text-4xl mb-4'>🧑‍🏫</span>
							<h3 className='font-semibold text-lg mb-2'>Mentorship</h3>
							<p className='text-slate-600 dark:text-slate-300 text-center'>Access mentors and AI guidance for every step.</p>
						</div>
					</div>
				</div>
			</section>

			{/* Screenshots/Mockups Section */}
			<section className='py-16'>
				<div className='max-w-4xl mx-auto px-4 text-center'>
					<h2 className='text-3xl font-bold mb-6'>See Elite Score in Action</h2>
					<img src='/placeholder.jpg' alt='Dashboard Screenshot' className='mx-auto rounded-xl shadow-lg w-full max-w-2xl'/>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className='py-16 bg-slate-50 dark:bg-slate-900'>
				<div className='max-w-4xl mx-auto px-4'>
					<h2 className='text-3xl font-bold text-center mb-10'>What Our Users Say</h2>
					<div className='grid md:grid-cols-2 gap-8'>
						<div className='bg-white dark:bg-slate-800 rounded-lg shadow p-6'>
							<p className='text-slate-700 dark:text-slate-200 mb-4'>“Elite Score helped me get into my dream university!”</p>
							<span className='font-semibold'>— Student</span>
						</div>
						<div className='bg-white dark:bg-slate-800 rounded-lg shadow p-6'>
							<p className='text-slate-700 dark:text-slate-200 mb-4'>“A unique platform for real growth and motivation.”</p>
							<span className='font-semibold'>— Mentor</span>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='w-full py-8 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto'>
				<div className='max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4'>
					<div className='flex items-center gap-2'>
						<img src='/placeholder-logo.svg' alt='Elite Score Logo' className='h-6 w-6'/>
						<span className='font-semibold'>Elite Score</span>
					</div>
					<nav className='flex gap-6'>
						<Link href='#about' className='hover:underline'>About</Link>
						<Link href='#features' className='hover:underline'>Features</Link>
						<Link href='#contact' className='hover:underline'>Contact</Link>
					</nav>
					<div className='text-slate-500 text-sm'>&copy; {new Date().getFullYear()} Elite Score. All rights reserved.</div>
				</div>
			</footer>
		</div>
	)
} 