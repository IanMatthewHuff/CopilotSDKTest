import { homedir } from "os";
import { join } from "path";
import { readFile, writeFile, mkdir, access, unlink } from "fs/promises";
import type { UserProfile } from "../types/index.js";

/**
 * Get the directory where user profiles are stored.
 */
export function getProfileDir(): string {
  return join(homedir(), ".retirement-planner");
}

/**
 * Get the path to the user profile file.
 */
export function getProfilePath(): string {
  return join(getProfileDir(), "profile.json");
}

/**
 * Result of attempting to load a user profile.
 */
export interface LoadProfileResult {
  found: boolean;
  profile: UserProfile | null;
  error?: string;
}

/**
 * Result of attempting to save a user profile.
 */
export interface SaveProfileResult {
  success: boolean;
  path: string;
  error?: string;
}

/**
 * Check if a profile exists.
 *
 * @param profilePath - Optional custom path for testing
 * @returns True if a saved profile exists
 */
export async function profileExists(profilePath?: string): Promise<boolean> {
  const path = profilePath ?? getProfilePath();
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load a previously saved user profile.
 *
 * @param profilePath - Optional custom path for testing
 * @returns Object indicating if profile was found and the profile data
 */
export async function loadProfile(profilePath?: string): Promise<LoadProfileResult> {
  const path = profilePath ?? getProfilePath();
  try {
    const data = await readFile(path, "utf-8");
    const profile = JSON.parse(data) as UserProfile;
    return { found: true, profile };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";

    // File not found is expected, not an error
    if (error.includes("ENOENT")) {
      return { found: false, profile: null };
    }

    return { found: false, profile: null, error };
  }
}

/**
 * Save a user profile to disk.
 *
 * @param profile - The user profile to save
 * @param profilePath - Optional custom path for testing
 * @returns Object indicating success and the path where saved
 */
export async function saveProfile(
  profile: UserProfile,
  profilePath?: string
): Promise<SaveProfileResult> {
  const path = profilePath ?? getProfilePath();
  const dir = join(path, "..");

  try {
    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Add timestamp
    const profileWithTimestamp: UserProfile = {
      ...profile,
      savedAt: new Date().toISOString(),
    };

    await writeFile(path, JSON.stringify(profileWithTimestamp, null, 2));

    return { success: true, path };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return { success: false, path, error };
  }
}

/**
 * Delete the saved profile (useful for testing or reset).
 *
 * @param profilePath - Optional custom path for testing
 * @returns True if profile was deleted
 */
export async function deleteProfile(profilePath?: string): Promise<boolean> {
  const path = profilePath ?? getProfilePath();
  try {
    await unlink(path);
    return true;
  } catch {
    return false;
  }
}
