'use server';

import { userService } from '@/services/di';
import { auth } from '@/lib/better-auth/server';
import { headers } from 'next/headers';
import { User } from '@/generated/prisma';
import { authLogger } from '@/lib/logger';

export interface ProfileData {
  user: Partial<User> & { avatarUrl?: string | null };
  stats: {
    totalPosts: number;
    totalReads: number;
    totalLikes: number;
  };
}

export async function getCurrentUserProfile(): Promise<ProfileData | null> {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return null;
    }

    const [userResult, statsResult] = await Promise.all([
      userService.getUserById(session.user.id).toPromise(),
      userService.getUserStats(session.user.id).toPromise(),
    ]);

    return {
      user: userResult,
      stats: statsResult,
    };
  } catch (error) {
    authLogger.error({ error, userId: session?.user?.id }, 'Failed to fetch user profile');
    return null;
  }
}

export async function updateUserProfile(data: {
  name?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
}) {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const result = await userService.updateProfile(session.user.id, data).toPromise();
    return { success: true, data: result };
  } catch (error) {
    authLogger.error({ error, userId: session?.user?.id }, 'Failed to update profile');
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
  }
}

export async function uploadUserAvatar(formData: FormData) {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    const result = await userService.uploadAvatar(session.user.id, file).toPromise();
    return { success: true, data: result };
  } catch (error) {
    authLogger.error({ error, userId: session?.user?.id }, 'Failed to upload avatar');
    return { success: false, error: error instanceof Error ? error.message : 'Failed to upload avatar' };
  }
}

export async function removeUserAvatar() {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const result = await userService.removeAvatar(session.user.id).toPromise();
    return { success: true, data: result };
  } catch (error) {
    authLogger.error({ error, userId: session?.user?.id }, 'Failed to remove avatar');
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove avatar' };
  }
}