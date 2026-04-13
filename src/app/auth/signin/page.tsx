import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#0c0c0e' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1
            className="text-4xl mb-2"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            CultureDB
          </h1>
          <p className="text-sm" style={{ color: '#8a8a96' }}>
            Rate everything worth experiencing.
          </p>
        </div>

        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
        >
          <SignInForm />
        </div>
      </div>
    </main>
  )
}
