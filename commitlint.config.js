// Plain Conventional Commits for the public OSS repo. No trailing-ticket rule
// (that's a base-app-internal convention; external contributors have no
// tracker). Agent-authored setup commits still carry a `#000` sentinel to
// satisfy base-app's parent PreToolUse git hook — see the parent AGENTS.md
// "repos/iab-emulator" sibling entry.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};
