 
# APP NAME
 Charlie Brain Bucket Spar
Dev runtime example project #2, to set up a complete dev pipeline with front and back end wiht MongoDB & complete CRUD pipeline.
test
### authorship + version

`@mrspartan38` \| `2026-10-13` \| `HOTEL`

### deployments, codebase, & repo features 

| requirement | evidence |
|---|---|
| MongoDB connection | [server code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/583d3f31508f586f3bb920c31162138277c0dc65/server/mongo.js#L23) |
| GET all | [code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/583d3f31508f586f3bb920c31162138277c0dc65/public/hotel.html#L149) |
| GET one | [code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/583d3f31508f586f3bb920c31162138277c0dc65/public/hotel.html#L189) |
| filtered GET | [code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/583d3f31508f586f3bb920c31162138277c0dc65/public/hotel.html#L232) |
| POST | [code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/583d3f31508f586f3bb920c31162138277c0dc65/public/hotel.html#L267) |
| PATCH | [code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/583d3f31508f586f3bb920c31162138277c0dc65/public/hotel.html#L297) |
| DELETE | [code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/583d3f31508f586f3bb920c31162138277c0dc65/public/hotel.html#L331) |
| frontend `fetch()` | [client code](https://github.com/mrspartan38/charlie-brain-bucket-spar/blob/bba701e0864c94ea1ed10a5f4bf0c62b0801c3f9/public/hotel.html#L33) |
| PROD app | [app](URL) |
| HOTEL milestone | [milestone](https://github.com/mrspartan38/charlie-brain-bucket-spar/milestone/1) |
| example issue | [issue](URL) |
| development branch | [branch](https://github.com/mrspartan38/charlie-brain-bucket-spar/tree/dev) |
| feature → dev | [PR](https://github.com/mrspartan38/charlie-brain-bucket-spar/pull/10) |
| dev → main | [PR](https://github.com/mrspartan38/charlie-brain-bucket-spar/pull/11) |
| PROD deployment | [Action](https://github.com/mrspartan38/charlie-brain-bucket-spar/actions/runs/38313577173) |

### user story

- **As a** burgeoning full-stack developer,
- **I want** a CI/CD infrastructure
- **so that** I can develop locally, manage my code in GitHub, and
    automatically deploy changes to DEV and PROD environments.

### narrative

This hotel project is designed to implent a CRUD system within a cloud hosted website. 
The backend connects to Mongodb and utilizes JSONs to write data and sends it back and forth via fetch calls.
This project is designed to be the bones of in terms of what our end of semester project is going to be. (A full stack app that utilizes fetch and a form of restfulAPI)

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
repo/
├── .github/
│   └── workflows/
├── docs/
│   └── README.md
├── public/
├── server/
├── .gitignore
└── ...
```

### GCP

external IP: `34.55.77.112`\
Linux user: `mrspartan38`\
instructor SSH public key installed: `maybe?`

## Golf Documentation

Full docs for Golf are available here:  
**[View Documentation](https://mrspartan38.github.io/charlie-brain-bucket-spar/)**
