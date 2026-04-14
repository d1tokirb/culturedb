import { CreateGroupForm } from '@/components/groups/CreateGroupForm'

export default function NewGroupPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#e8a027' }}>Groups</p>
      <h1 className="text-3xl mb-8" style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}>
        Create a Group
      </h1>
      <CreateGroupForm />
    </div>
  )
}
