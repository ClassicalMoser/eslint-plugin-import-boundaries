/**
 * Unit tests for boundaryDetection.ts
 * Tests boundary detection and alias subpath checking.
 */

import type { Boundary } from "./types.js";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkAliasSubpath,
  getFileData,
  resolveToSpecifiedBoundary,
} from "./boundaryDetection.js";

describe("boundaryDetection", () => {
  const cwd = "/project";
  const rootDir = "src";

  const entitiesBoundary: Boundary = {
    dir: "domain/entities",
    alias: "@entities",
    absDir: path.resolve(cwd, rootDir, "domain/entities"),
  };

  const queriesBoundary: Boundary = {
    dir: "domain/queries",
    alias: "@queries",
    absDir: path.resolve(cwd, rootDir, "domain/queries"),
  };

  const transformsBoundary: Boundary = {
    dir: "domain/transforms",
    alias: "@transforms",
    absDir: path.resolve(cwd, rootDir, "domain/transforms"),
  };

  const boundaries = [entitiesBoundary, queriesBoundary, transformsBoundary];

  describe("checkAliasSubpath", () => {
    it("should detect alias subpaths", () => {
      const result = checkAliasSubpath("@entities/army", boundaries);

      expect(result.isSubpath).toBe(true);
      expect(result.baseAlias).toBe("@entities");
    });

    it("should not detect base alias as subpath", () => {
      const result = checkAliasSubpath("@entities", boundaries);

      expect(result.isSubpath).toBe(false);
      expect(result.baseAlias).toBeUndefined();
    });

    it("should detect nested subpaths", () => {
      const result = checkAliasSubpath("@entities/army/unit", boundaries);

      expect(result.isSubpath).toBe(true);
      expect(result.baseAlias).toBe("@entities");
    });

    it("should return false for unknown aliases", () => {
      const result = checkAliasSubpath("@unknown/path", boundaries);

      expect(result.isSubpath).toBe(false);
      expect(result.baseAlias).toBeUndefined();
    });
  });

  describe("resolveToSpecifiedBoundary", () => {
    it("should resolve to boundary with rules", () => {
      const boundaryWithRules: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        allowImportsFrom: ["@domain"],
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/application",
        "file.ts",
      );

      const result = resolveToSpecifiedBoundary(filename, [boundaryWithRules]);

      expect(result).toBe(boundaryWithRules);
    });

    it("should resolve to parent boundary when child has no rules", () => {
      const parentBoundary: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        allowImportsFrom: ["@domain"],
      };

      const childBoundary: Boundary = {
        dir: "domain/application/ports",
        alias: "@ports",
        absDir: path.resolve(cwd, rootDir, "domain/application/ports"),
        // No rules specified
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/application/ports",
        "file.ts",
      );

      const result = resolveToSpecifiedBoundary(filename, [
        parentBoundary,
        childBoundary,
      ]);

      expect(result).toBe(parentBoundary);
    });

    it("should resolve to most specific boundary with rules", () => {
      const parentBoundary: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        allowImportsFrom: ["@domain"],
      };

      const childBoundary: Boundary = {
        dir: "domain/application/ports",
        alias: "@ports",
        absDir: path.resolve(cwd, rootDir, "domain/application/ports"),
        allowImportsFrom: ["@infrastructure"],
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/application/ports",
        "file.ts",
      );

      const result = resolveToSpecifiedBoundary(filename, [
        parentBoundary,
        childBoundary,
      ]);

      expect(result).toBe(childBoundary);
    });

    it("should return null when no boundaries with rules are found", () => {
      const boundaryWithoutRules: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        // No rules specified
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/application",
        "file.ts",
      );

      const result = resolveToSpecifiedBoundary(filename, [
        boundaryWithoutRules,
      ]);

      expect(result).toBeNull();
    });

    it("should return null for files outside all boundaries", () => {
      const boundary: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        allowImportsFrom: ["@domain"],
      };

      const filename = path.resolve(cwd, "other", "file.ts");

      const result = resolveToSpecifiedBoundary(filename, [boundary]);

      expect(result).toBeNull();
    });

    it("should handle denyImportsFrom as rules", () => {
      const boundaryWithDeny: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        denyImportsFrom: ["@infrastructure"],
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/application",
        "file.ts",
      );

      const result = resolveToSpecifiedBoundary(filename, [boundaryWithDeny]);

      expect(result).toBe(boundaryWithDeny);
    });

    it("should handle allowTypeImportsFrom as rules", () => {
      const boundaryWithTypeOnly: Boundary = {
        dir: "domain/infrastructure",
        alias: "@infrastructure",
        absDir: path.resolve(cwd, rootDir, "domain/infrastructure"),
        allowTypeImportsFrom: ["@application"], // Only type imports allowed
        // No allowImportsFrom or denyImportsFrom
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/infrastructure",
        "file.ts",
      );

      const result = resolveToSpecifiedBoundary(filename, [
        boundaryWithTypeOnly,
      ]);

      expect(result).toBe(boundaryWithTypeOnly);
    });
  });

  describe("getFileData", () => {
    it("should detect file in boundary with rules", () => {
      const boundaryWithRules: Boundary = {
        dir: "domain/queries",
        alias: "@queries",
        absDir: path.resolve(cwd, rootDir, "domain/queries"),
        allowImportsFrom: ["@domain"],
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/queries",
        "getLine.ts",
      );

      const result = getFileData(filename, [boundaryWithRules]);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(path.resolve(cwd, rootDir, "domain/queries"));
      expect(result.fileBoundary).toBe(boundaryWithRules);
    });

    it("should detect file in nested directory within boundary with rules", () => {
      const boundaryWithRules: Boundary = {
        dir: "domain/queries",
        alias: "@queries",
        absDir: path.resolve(cwd, rootDir, "domain/queries"),
        allowImportsFrom: ["@domain"],
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/queries",
        "subdir",
        "deep",
        "file.ts",
      );

      const result = getFileData(filename, [boundaryWithRules]);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(
        path.resolve(cwd, rootDir, "domain/queries", "subdir", "deep"),
      );
      expect(result.fileBoundary).toBe(boundaryWithRules);
    });

    it("should return null boundary for files outside all boundaries", () => {
      const boundaryWithRules: Boundary = {
        dir: "domain/queries",
        alias: "@queries",
        absDir: path.resolve(cwd, rootDir, "domain/queries"),
        allowImportsFrom: ["@domain"],
      };

      const filename = path.resolve(cwd, "other", "file.ts");

      const result = getFileData(filename, [boundaryWithRules]);

      expect(result.isValid).toBe(true);
      expect(result.fileDir).toBe(path.resolve(cwd, "other"));
      expect(result.fileBoundary).toBeNull();
    });

    it("should return actual boundary when child has no rules (for same-boundary detection)", () => {
      const parentBoundary: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        allowImportsFrom: ["@domain"],
      };

      const childBoundary: Boundary = {
        dir: "domain/application/ports",
        alias: "@ports",
        absDir: path.resolve(cwd, rootDir, "domain/application/ports"),
        // No rules
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/application/ports",
        "file.ts",
      );

      // getFileData now returns the actual boundary (for same-boundary detection)
      // Rule checking will resolve to parent via resolveToSpecifiedBoundary
      const result = getFileData(filename, [parentBoundary, childBoundary]);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(childBoundary); // Returns actual boundary, not parent
    });

    it("should return most specific boundary with rules for nested boundaries", () => {
      const parentBoundary: Boundary = {
        dir: "domain/application",
        alias: "@application",
        absDir: path.resolve(cwd, rootDir, "domain/application"),
        allowImportsFrom: ["@domain"],
      };

      const childBoundary: Boundary = {
        dir: "domain/application/ports",
        alias: "@ports",
        absDir: path.resolve(cwd, rootDir, "domain/application/ports"),
        allowImportsFrom: ["@infrastructure"],
      };

      const filename = path.resolve(
        cwd,
        rootDir,
        "domain/application/ports",
        "file.ts",
      );

      const result = getFileData(filename, [parentBoundary, childBoundary]);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(childBoundary);
    });

    it("should return invalid for non-absolute paths", () => {
      const filename = "relative/path/file.ts";

      const result = getFileData(filename, boundaries);

      expect(result.isValid).toBe(false);
      expect(result.fileDir).toBeUndefined();
      expect(result.fileBoundary).toBeUndefined();
    });

    it("should handle Windows paths", () => {
      // Use a Unix-style path for cross-platform compatibility
      // The actual Windows path handling is tested implicitly through path.resolve
      const windowsCwd = "/C/project";
      const windowsBoundaries: Boundary[] = [
        {
          dir: "domain/entities",
          alias: "@entities",
          absDir: path.resolve(windowsCwd, rootDir, "domain/entities"),
          allowImportsFrom: [], // Has rules (empty allow list = deny all by default)
        },
      ];

      const filename = path.resolve(
        windowsCwd,
        rootDir,
        "domain/entities",
        "file.ts",
      );

      const result = getFileData(filename, windowsBoundaries);

      expect(result.isValid).toBe(true);
      expect(result.fileBoundary).toBe(windowsBoundaries[0]);
    });
  });
});
