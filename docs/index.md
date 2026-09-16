# BRAIN BUCKET SPAR
> an app for testing a devruntime

test 4.2
### authorship + version

`@mrspartan38` \| `2026-09-16` \| `GOLF`

### deployments, codebase, & repo features 

  | Resource                     | Link |
|------------------------------|------|
| PROD codebase                | [`main`](https://github.com/mrspartan38/charlie-brain-bucket-spar) |
| PROD server                  | GCP (`34.55.74.112`) |
| DEV codebase                 | [`dev`](https://github.com/mrspartan38/charlie-brain-bucket-spar/tree/dev) |
| DEV server                   | [Render](https://charlie-brain-bucket-spar.onrender.com) |
| docs                         | [`docs/`](URL) |
| published docs               | [GitHub Pages](URL) |
| CI/CD workflow               | [`deploy.yml`](URL) |
| successful PROD deployment   | [GitHub Action](URL) |
| resolved GOLF issue          | [issue \#](URL) |

### user story

- **As a** burgeoning full-stack developer,
- **I want** a CI/CD infrastructure
- **so that** I can develop locally, manage my code in GitHub, and
    automatically deploy changes to DEV and PROD environments.

### narrative

> In 2--4 sentences, briefly describe your GOLF infrastructure and whatyou built/deployed.

In this project, we build a complete front-end and back-end ecosystem. The front end was built using a prexisting project. The back-end was built with GCP.

### architecture

``` text
LOCAL
  │
  ▼
GitHub
  │
  ├── dev  ──► Render ─────────► DEV
  │
  └── main ──► GitHub Actions ─► GCP ──► PROD
```

### stack

`HTML/CSS/JS` \| `Node.js` \| `Express` \| `Git/GitHub` \| `Render` \|
`GCP` \| `Linux` \| `Nginx` \| `PM2` \| `Certbot` \| `GitHub Actions`

### project structure

Use `tree` to show your actual project structure.

``` text
app/
├── .github/
│   └── workflows/
├── docs/
│   └── index.md
├── public/
├── server/
├── .gitignore
└── ...
```

### GCP

external IP: `34.55.74.112`\
Linux user: `mrspartan38`\
instructor SSH public key installed: `yes`

