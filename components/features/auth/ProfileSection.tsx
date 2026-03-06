'use client';

import { useState } from 'react';
import { ProfileCard } from './ProfileCard';
import { ProfileEditForm } from './ProfileEditForm';

interface ProfileSectionProps {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  studentId: string | null;
}

export function ProfileSection({ userId, name, email, avatarUrl, studentId }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ProfileEditForm
        userId={userId}
        initialName={name}
        initialStudentId={studentId}
        initialAvatarUrl={avatarUrl}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => setIsEditing(false)}
      />
    );
  }

  return (
    <ProfileCard
      name={name}
      email={email}
      avatarUrl={avatarUrl}
      studentId={studentId}
      onEdit={() => setIsEditing(true)}
    />
  );
}
