// src/app/dashboard/profile/components/ProfileNavbarLink.tsx

"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { useRouter } from "next/navigation";

export function ProfileNavbarLink() {
  const { user } = useAuthWithRole();
  const router = useRouter();

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

  return (
    <Button 
      onClick={handleProfileClick}
      variant="ghost" 
      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
    >
      <User size={16} className="text-gray-500" />
      <span className="font-medium">
        {user.name || user.email?.split('@')[0] || 'Utilisateur'}
      </span>
    </Button>
  );
}

// Alternative avec avatar si tu préfères :
export function ProfileNavbarLinkWithAvatar() {
  const { user } = useAuthWithRole();
  const router = useRouter();

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

  return (
    <Button 
      onClick={handleProfileClick}
      variant="ghost" 
      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50"
    >
      <Avatar className="h-6 w-6">
        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-medium">
          {getInitials(user.name || user.email || 'User')}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium text-gray-900">
        {user.name || user.email?.split('@')[0] || 'Utilisateur'}
      </span>
    </Button>
  );
}