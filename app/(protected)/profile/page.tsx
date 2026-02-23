import { getProfileWithWorkspace } from "@/lib/db/profile";
import { listWorkspaceBackups } from "@/lib/db/backups";
import { BackupPanel } from "@/components/profile/backup-panel";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const { user, profile, workspace } = await getProfileWithWorkspace();
  const backups = profile.role === "ADMIN" ? await listWorkspaceBackups() : [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Perfil</h2>
      <ProfileForm
        fullName={profile.full_name ?? ""}
        workspaceName={workspace.name}
        email={user.email ?? ""}
        role={profile.role}
      />
      {profile.role === "ADMIN" ? <BackupPanel backups={backups} /> : null}
    </div>
  );
}
