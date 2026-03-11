---
description: Update documentation files based on recent code changes
---
# Update Documentation Workflow

This workflow automatically updates the project's documentation files based on the recent changes made to the codebase. It analyzes git status and diffs, and reflects those changes into the relevant `docs/` files and `README.md`.

## Instructions for the AI Agent

1. **Check Git Status & Diffs**:
   - Run `git status` to see what files have been modified or added.
   - Run `git diff` or `git log -p -1` to understand the exact changes made in the recent commits or current working tree.
2. **Review Existing Documentation**:
   - Read the relevant documentation files in `docs/` (`01_architecture.md`, `02_data_model.md`, `03_features.md`, `04_ui_design.md`, `05_future_roadmap.md`) to understand the current documented state.
   - For example, if you changed CSS or HTML layout, check `04_ui_design.md`. If you added a new `localStorage` field, check `02_data_model.md`.
3. **Plan Updates**:
   - Explicitly list out which documentation files need to be modified and what kind of information should be added or changed.
4. **Update the Documentation**:
   - Use your file editing tools (`replace_file_content` or `multi_replace_file_content`) to update the markdown files. Ensure the tone remains professional and factual.
5. **Review UI Changes**:
   - If UI changes were made and you are running a browser session, capture new screenshots and replace the ones in `docs/images/`, then update the markdown links if necessary.
6. **Commit Documentation Changes**:
   - Run `git add docs/ README.md`
   - Run `git commit -m "docs: auto-update documentation for recent changes"`
   - Provide a final summary to the user about which docs were updated.
