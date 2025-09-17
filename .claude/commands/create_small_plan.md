# Small Plan Creator

You are tasked with creating concise implementation plans for small, surgical changes. This command is designed for quick fixes, minor features, and targeted improvements that don't require extensive research or complex multi-phase implementation.

## When to Use This Command

Use this command for:
- Bug fixes that affect 1-3 files
- Small feature additions
- Minor UI improvements
- Simple refactoring tasks
- Configuration changes
- Quick optimizations

**Do NOT use for:**
- New major features
- Architecture changes
- Multi-system integrations
- Complex workflows

## Initial Response

When invoked:

1. **If parameters provided** (file path or task description):
   - Read any provided files immediately
   - Begin rapid assessment

2. **If no parameters**, respond with:
```
I'll create a focused plan for a small change. 

Describe the task in 1-2 sentences:
- What needs to be changed?
- Which files/components are affected?

For reference to docs: `/create_small_plan docs/TASK_DESCRIPTION.md`
```

## Process Steps

### Step 1: Quick Assessment (2-3 minutes max)

1. **Read mentioned files** (without spawning sub-agents)
2. **Quick search** for relevant files using Glob/Grep
3. **Identify scope**:
   - Which specific files need changes
   - What type of change (fix, addition, update)
   - Any obvious dependencies

### Step 2: Simple Plan Creation

Create the plan immediately to:
`docs/YYYY-MM-DD_{descriptive_name}_SMALL_PLAN.md`

Use this minimal template:

```markdown
# [Task Name] - Small Plan

**Date:** YYYY-MM-DD  
**Type:** [Bug Fix | Small Feature | Minor Update]  
**Estimated Time:** [15-60 minutes]  
**Files Affected:** [1-3 files typically]

## 🎯 What We're Doing

[1-2 sentence description]

## 📍 Files to Change

### `path/to/file1.ext`
- [Brief change description]
- [Specific line numbers if known]

### `path/to/file2.ext` (if needed)
- [Brief change description]

## ✅ Success Criteria

**Quick Verification:**
- [ ] Code compiles/builds: `[specific command]`
- [ ] No linting errors: `[specific command]`  
- [ ] Feature works as expected

**Test:**
- [ ] [Specific test to run or manual check]

## 📝 Implementation Notes

[Any gotchas, edge cases, or specific requirements - keep it brief]
```

## Key Differences from Full Planning

1. **No sub-agent spawning** - Use direct tools only
2. **No iterative process** - Write plan in one go
3. **No extensive research** - Focus on the immediate task
4. **No multi-phase approach** - Single implementation block
5. **Minimal success criteria** - Just essential checks
6. **No extensive documentation** - Concise notes only

## Guidelines

1. **Be Direct**: Skip the collaborative back-and-forth for obvious tasks
2. **Be Specific**: Include exact file paths and line numbers when possible
3. **Be Quick**: Entire process should take 5 minutes max
4. **Be Focused**: Don't expand scope or suggest improvements
5. **Be Practical**: Include only necessary verification steps

## Example Usage

```
User: /create_small_plan Fix the typo in the homepage title
Assistant: [Searches for homepage files, finds the typo, creates immediate plan]

User: /create_small_plan Add a loading spinner to the search component
Assistant: [Locates search component, identifies where to add spinner, writes focused plan]
```

## Success Criteria Format

Keep success criteria minimal but actionable:

```markdown
✅ Success Criteria:
- [ ] Fix implemented: `cd react-frontend && npm run build`
- [ ] No console errors when testing feature manually
- [ ] Original functionality preserved
```

## When to Escalate

If during assessment you discover:
- More than 5 files need changes
- Complex business logic is involved  
- Multiple systems are affected
- Unclear requirements need research

**STOP** and suggest using `/create_plan` instead:

```
This task is more complex than expected. I recommend using `/create_plan [description]` for a full planning process as it involves [specific complexity reason].
```

## TodoWrite Integration

For small plans, use TodoWrite minimally:
- Mark plan creation as complete
- Don't track detailed sub-tasks
- Focus on the implementation phase tracking

This command prioritizes speed and simplicity over thoroughness, making it perfect for quick fixes and small improvements that experienced developers can implement immediately.