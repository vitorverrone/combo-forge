# Combo Forge

Language, git, and skill-sequence rules for this project come from the
`CLAUDE.md` at the root of `D:\Sites\JOGOS` (inherited automatically by any
session opened inside here) — don't repeat those rules in this file.

Use this file only for what's specific to this game: chosen stack,
build/test/run commands, setup particulars.

## Git workflow

Every change to this repo follows the same cycle as tickets: branch → commit
→ merge `--no-ff` into `master` → delete the branch. This includes
`improve-codebase` refactors and other cleanup, not just `feat/<NN>` work —
and once a refactor/change is approved, commit and merge it without asking
permission each time.

<!-- /setup-matt-pocock-skills fills in the issue-tracker/domain-docs part of
"## Agent skills" below -->

## Agent skills

### Discipline skills

Installed locally from `gamedev-skills/awesome-gamedev-agent-skills` and
`ghaida/intent` — not inherited from the JOGOS root, since this game is its
own git repo and skill discovery stops at a repo boundary (see the root
`CLAUDE.md`). Trigger on their own, same as the root's cross-cutting ones.

Universal (same set installed in every other game):
- **`audio-design`** — audio buses, ducking, adaptive/dynamic music, SFX variation, beat sync.
- **`create-game-assets`** — art direction, style bibles, sprite/tile/UI asset production.
- **`game-ui-ux`** — HUD, menus, anchor-based layout, resolution/safe-area scaling, screen-state stack.
- **`save-systems`** — save/load design, slots, atomic writes, schema versioning/migration.
- **`wireframe`** — screen structure before visual design: lo-fi idea boards, full wireframes, click-through prototypes.

Specific to this game's design:
- **`game-feel`** — juice: screen shake, hit-stop, tweened motion, squash & stretch.
