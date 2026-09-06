# LoomShift

Stub implementation for: [loomshift-smoke] delivery gate fixture — safe to close

Opened automatically by the LoomShift delivery gate (SCRUM-313). It exists so every
deploy can prove the hosted worker still turns an issue into a pull request.

Leave it open. Each deploy runs it with the stub implementer, opens a draft PR,
checks the result and then closes that PR and deletes its branch.

Acceptance Criteria:
- The repository’s own verify commands run and report real exit codes.
- A branch is pushed and a pull request is opened for it.

Source issue: https://github.com/thomashagstrom/LoomShift-example/issues/143
