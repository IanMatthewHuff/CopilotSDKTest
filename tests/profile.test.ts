import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { mkdir, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import type { UserProfile } from "../src/types/index.js";
import {
  profileExists,
  loadProfile,
  saveProfile,
  deleteProfile,
} from "../src/lib/profile.js";

// Create a test profile
const testProfile: UserProfile = {
  age: 42,
  targetRetirementAge: 60,
  maritalStatus: "married",
  currentSavings: 280000,
  monthlyContribution: 1500,
  riskTolerance: "moderate",
  expectedMonthlyExpenses: 4000,
  savedAt: "",
};

describe("profile storage", () => {
  let testDir: string;
  let testProfilePath: string;

  beforeEach(async () => {
    // Create unique test directory for each test
    testDir = join(tmpdir(), "retirement-planner-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
    testProfilePath = join(testDir, "profile.json");
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("profileExists", () => {
    it("should return false when no profile exists", async () => {
      const exists = await profileExists(testProfilePath);
      expect(exists).toBe(false);
    });

    it("should return true when profile exists", async () => {
      await writeFile(testProfilePath, JSON.stringify(testProfile));
      const exists = await profileExists(testProfilePath);
      expect(exists).toBe(true);
    });
  });

  describe("saveProfile", () => {
    it("should save profile successfully", async () => {
      const result = await saveProfile(testProfile, testProfilePath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(testProfilePath);
      expect(result.error).toBeUndefined();
    });

    it("should create directory if it does not exist", async () => {
      // Remove the test directory
      await rm(testDir, { recursive: true, force: true });

      const result = await saveProfile(testProfile, testProfilePath);

      expect(result.success).toBe(true);
    });

    it("should add savedAt timestamp", async () => {
      await saveProfile(testProfile, testProfilePath);
      const result = await loadProfile(testProfilePath);

      expect(result.profile?.savedAt).toBeDefined();
      expect(result.profile?.savedAt).not.toBe("");
    });
  });

  describe("loadProfile", () => {
    it("should return found: false when no profile exists", async () => {
      const result = await loadProfile(testProfilePath);

      expect(result.found).toBe(false);
      expect(result.profile).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should load saved profile successfully", async () => {
      await saveProfile(testProfile, testProfilePath);
      const result = await loadProfile(testProfilePath);

      expect(result.found).toBe(true);
      expect(result.profile).not.toBeNull();
      expect(result.profile?.age).toBe(42);
      expect(result.profile?.currentSavings).toBe(280000);
      expect(result.profile?.riskTolerance).toBe("moderate");
    });

    it("should return error for invalid JSON", async () => {
      await writeFile(testProfilePath, "not valid json");
      const result = await loadProfile(testProfilePath);

      expect(result.found).toBe(false);
      expect(result.profile).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe("deleteProfile", () => {
    it("should delete existing profile", async () => {
      await saveProfile(testProfile, testProfilePath);
      expect(await profileExists(testProfilePath)).toBe(true);

      const deleted = await deleteProfile(testProfilePath);

      expect(deleted).toBe(true);
      expect(await profileExists(testProfilePath)).toBe(false);
    });

    it("should return false when no profile to delete", async () => {
      const deleted = await deleteProfile(testProfilePath);
      expect(deleted).toBe(false);
    });
  });

  describe("round trip", () => {
    it("should save and load profile with all fields intact", async () => {
      const fullProfile: UserProfile = {
        age: 35,
        targetRetirementAge: 55,
        maritalStatus: "single",
        currentSavings: 150000,
        monthlyContribution: 2000,
        riskTolerance: "aggressive",
        expectedMonthlyExpenses: 5000,
        savedAt: "",
      };

      await saveProfile(fullProfile, testProfilePath);
      const result = await loadProfile(testProfilePath);

      expect(result.found).toBe(true);
      expect(result.profile?.age).toBe(35);
      expect(result.profile?.targetRetirementAge).toBe(55);
      expect(result.profile?.maritalStatus).toBe("single");
      expect(result.profile?.currentSavings).toBe(150000);
      expect(result.profile?.monthlyContribution).toBe(2000);
      expect(result.profile?.riskTolerance).toBe("aggressive");
      expect(result.profile?.expectedMonthlyExpenses).toBe(5000);
    });
  });
});
