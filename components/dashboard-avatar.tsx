"use client";

import { useState } from "react";
import { AvatarUpload } from "@/components/avatar-upload";
import { updateProfile } from "@/lib/actions/profile";

type Props = {
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
};

export function DashboardAvatar({ userId, avatarUrl: initialUrl, fullName }: Props) {
  const [url, setUrl] = useState(initialUrl);

  async function handleUpload(newUrl: string) {
    setUrl(newUrl);
    await updateProfile({ avatar_url: newUrl });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <AvatarUpload
        currentUrl={url}
        userId={userId}
        onUpload={handleUpload}
        size="lg"
      />
      <p className="text-sm font-medium text-white">{fullName || "Your name"}</p>
    </div>
  );
}
