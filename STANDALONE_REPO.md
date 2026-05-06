# Publishing only this folder to GitHub

The public repository [github.com/NamelessNATM/AIGroceryPlanner](https://github.com/NamelessNATM/AIGroceryPlanner) should contain **only** the files from `ai_grocery_planner/` (the repo root looks like this folder, not a nested `ai_grocery_planner/` directory).

**Do not commit:** Firebase service accounts, `.firebaserc`, root monorepo `firebase.json`, API keys, `.env`, or anything outside this directory.

## One-time bootstrap

From the StreamBuddy repo root:

```bash
# Export folder contents to a new directory (repo root = planner root)
rsync -a --delete ai_grocery_planner/ /tmp/AIGroceryPlanner-src/
cd /tmp/AIGroceryPlanner-src
git init
git add .
git commit -m "Initial AI Grocery Planner sources"
git branch -M main
git remote add origin git@github.com:NamelessNATM/AIGroceryPlanner.git
git push -u origin main
```

## Ongoing sync options

### Option A — Copy / rsync (simple)

After editing files under `ai_grocery_planner/` in the monorepo:

```bash
rsync -a --delete /path/to/StreamBuddy/ai_grocery_planner/ /path/to/AIGroceryPlanner-clone/
cd /path/to/AIGroceryPlanner-clone
git add -A && git commit -m "Sync from monorepo" && git push
```

### Option B — git subtree split (single source of truth in monorepo)

From the StreamBuddy repo (with full history for this subtree):

```bash
git subtree split --prefix=ai_grocery_planner -b ai-grocery-planner-publish
git push git@github.com:NamelessNATM/AIGroceryPlanner.git ai-grocery-planner-publish:main --force
```

Use `--force` only if you intend to replace the remote branch with the split history. For a normal incremental workflow, Option A is often easier.

## Deployment reminder

Hosting deploys from the **monorepo** with Firebase CLI (see root `DEPLOYMENT.md` and `deploy-groceries.sh`). The GitHub repo is source-only for contributors; it does not need to contain deployment secrets.
