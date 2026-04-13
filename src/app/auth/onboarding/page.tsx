import { OnboardingForm } from '@/components/auth/OnboardingForm'

export default function OnboardingPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#0c0c0e' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#e8a027' }}>
            One last thing
          </p>
          <h1
            className="text-3xl mb-2"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            Choose your handle
          </h1>
          <p className="text-sm" style={{ color: '#8a8a96' }}>
            Your public identity on CultureDB.
          </p>
        </div>

        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
        >
          <OnboardingForm />
        </div>
      </div>
    </main>
  )
}
