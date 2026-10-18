# Corrections

Every time the user corrects where something was filed, how it was linked, or what was archived, the agent appends one line here.
The weekly cleanup reads this file, looks for repeated patterns (2+ similar corrections), and proposes a fix to
`_meta/categories.md` (better `belongs` text or `examples`) or `_meta/my-rules.md`. Applied proposals are marked `-> applied YYYY-MM-DD`.

Format: `- YYYY-MM-DD | input: "<short quote>" | was: <what agent did> | should: <what user wanted> | why: <user's reason if given>`

## Log
