import { AddMediaForm } from '@/components/media/AddMediaForm'

export default function AddPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#e8a027' }}>
        Add to the database
      </p>
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
      >
        New Entry
      </h1>
      <AddMediaForm />
    </div>
  )
}
