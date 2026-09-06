# Plan: Import Existing Skills to Kilo Configuration

## Goal
Register all existing skill directories from the user's CLI toolchain into Kilo's `skills.paths` configuration so they are formally discovered and available within the LoadSaathi Kilo project.

## Background

Kilo (OpenCode-based) auto-discovers skills from certain paths, but they are not formally registered in the `kilo.jsonc` config. The user has skills scattered across 4 directories. Currently, the global config at `C:\Users\sanja\.config\kilo\kilo.jsonc` only has a `permission` section — no `skills` section.

## Discovered Skill Directories

| # | Directory | Skill Count | Already Accessible? |
|---|-----------|-------------|---------------------|
| 1 | `C:\Users\sanja\.agents\skills` | ~70 skills | Yes (external_directory: `C:\Users\sanja\.agents\skills\*`) |
| 2 | `C:\Users\sanja\.claude\skills` | ~73 skills | Yes (external_directory: `C:\Users\sanja\.claude\*`) |
| 3 | `C:\Users\sanja\.kilocode\skills` | 11 skills | Indirectly (covered by catch-all `C:\Users\sanja\*`) |
| 4 | `D:\Users\sanja\dyad-apps\load-saathi-app-1-osrm\.claude\skills` | 2 skills | Yes (covered by `D:\*`) |

**Total: ~156 unique skill directories** (some skills overlap between directories 1 and 2 — e.g., `seo-audit`, `shadcn`, `hyperframes` family, etc. appear in both. Directory 3 is a subset of directory 2.)

## Changes Required

### 1. Update Global Kilo Config — Add `skills` Section

**File:** `C:\Users\sanja\.config\kilo\kilo.jsonc`

Add a `skills` top-level section (after the `permission` block) with all 4 skill directory paths:

```jsonc
"skills": {
  "paths": [
    "C:\\Users\\sanja\\.agents\\skills",
    "C:\\Users\\sanja\\.claude\\skills",
    "C:\\Users\\sanja\\.kilocode\\skills",
    "D:\\Users\\sanja\\dyad-apps\\load-saathi-app-1-osrm\\.claude\\skills"
  ]
}
```

### 2. Update Global Kilo Config — Add Explicit External Directory Permission

**File:** `C:\Users\sanja\.config\kilo\kilo.jsonc`

Add explicit permission for `.kilocode\skills` (currently only covered by the catch-all `C:\Users\sanja\*` pattern). Add this line to the `external_directory` block:

```
"C:\\Users\\sanja\\.kilocode\\skills\\*": "allow",
```

### 3. Create Project-Local `kilo.json` (Optional but Recommended)

**File:** `D:\Users\sanja\dyad-apps\load-saathi-app-1-osrm\kilo.json`

Create a project-level `kilo.json` to make the project self-documenting and portable. This ensures skill paths travel with the project:

```json
{
  "$schema": "https://app.kilo.ai/config.json",
  "skills": {
    "paths": [
      "C:\\Users\\sanja\\.agents\\skills",
      "C:\\Users\\sanja\\.claude\\skills",
      "C:\\Users\\sanja\\.kilocode\\skills",
      ".claude\\skills"
    ]
  }
}
```

## Exact Edits

### Edit 1: Add `.kilocode\skills` permission to global config

In `C:\Users\sanja\.config\kilo\kilo.jsonc`, within the `external_directory` block, add after the `.agents\skills` line:

```diff
      "C:\\Users\\sanja\\.agents\\skills\\*": "allow",
+     "C:\\Users\\sanja\\.kilocode\\skills\\*": "allow",
      "C:\\Users\\sanja\\*": "allow"
```

### Edit 2: Add `skills` section to global config

In `C:\Users\sanja\.config\kilo\kilo.jsonc`, add after the closing `}` of the `permission` block (before the final closing `}`):

```diff
  }
+ },
+ "skills": {
+   "paths": [
+     "C:\\Users\\sanja\\.agents\\skills",
+     "C:\\Users\\sanja\\.claude\\skills",
+     "C:\\Users\\sanja\\.kilocode\\skills",
+     "D:\\Users\\sanja\\dyad-apps\\load-saathi-app-1-osrm\\.claude\\skills"
+   ]
+ }
}
```

### Edit 3 (Optional): Create project-level `kilo.json`

Create `D:\Users\sanja\dyad-apps\load-saathi-app-1-osrm\kilo.json`:

```json
{
  "$schema": "https://app.kilo.ai/config.json",
  "skills": {
    "paths": [
      "C:\\Users\\sanja\\.agents\\skills",
      "C:\\Users\\sanja\\.claude\\skills",
      "C:\\Users\\sanja\\.kilocode\\skills",
      ".claude\\skills"
    ]
  }
}
```

## Validation

1. Verify `kilo.jsonc` is valid JSON (use a JSON validator with JSONC support)
2. Restart Kilo and confirm skills appear in the skill registry
3. Verify the `skill` tool can invoke skills from all 4 directories by name (e.g., `seo-audit`, `clerk`, `hyperframes`)
4. Verify no `external_directory` permission errors when loading skills from `.kilocode\skills`

## Risks & Edge Cases

- **Duplicate skill names**: The same skill (e.g., `seo-audit`, `shadcn`, `hyperframes`) exists in both `.agents\skills` and `.claude\skills`. Kilo will use whichever it discovers first. To avoid conflicts, consider only registering the `.claude\skills` directory (which is the more complete set with newer skills) and dropping `.agents\skills` if desired.
- **Path separators**: Windows paths use backslashes in the JSON string. Ensure proper escaping (`\\`).
- **Catch-all coverage**: `C:\Users\sanja\*` already covers `.kilocode\skills`, but adding an explicit entry is clearer and more maintainable.