import { getProfile, saveProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { getProfileCompleteness } from '@/lib/profile-completeness'

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
        {profile && (
          <p className="text-sm text-muted-foreground mt-2">
            {getProfileCompleteness(profile).label}
          </p>
        )}
      </div>
      <ProfileForm
        initialData={profile ?? undefined}
        onSave={saveProfile}
        saveLabel="Save changes"
      />
    </div>
  )
}
