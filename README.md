# DeployDock

A self-hosted CI/CD platform for automating deployments via SSH, Docker, and PM2 — with multi-tenant support, webhook triggers, real-time logs, and notification integrations.


---

## Features

### Deployment
- SSH-based remote deployment workers
- Docker container deployment support
- PM2 process management (start, stop)
- Git-based rollback via `git checkout <sha>`
- Environment variable encryption with `.env` file writing over SSH

### Automation & Triggers
- GitHub webhook integration
- React Flow–based visual automation editor
- Deployment pipeline configuration per project
- Cron job scheduling

### Monitoring & Logs
- Real-time terminal-style log viewer with per-line classification
- Collapsible log sections
- PM2 log streaming over Server-Sent Events (SSE)
- Webhook log UI with grouped timeline design

### Notifications
- SMTP email notifications
- ZeptoMail integration
- Twilio SMS alerts
- META WhatsApp messaging

### Multi-Tenant Architecture
- Per-tenant MongoDB databases


---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (native driver, multi-tenant) |
| Process Management | PM2 |
| Realtime | Server-Sent Events (SSE) |
| Deployment Targets | SSH remote servers, Docker |

---

## Project Structure

```
DeployDock/
├── Frontend/                        # Next.js frontend
│   ├── app/
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   ├── forgot-password/
│   │   │   └── layout.tsx
│   │   ├── (main)/                  # Protected route group
│   │   │   ├── automation/
│   │   │   ├── deployments/
│   │   │   ├── integrations/
│   │   │   ├── processes/
│   │   │   ├── projects/
│   │   │   ├── servers/
│   │   │   ├── settings/
│   │   │   ├── webhook-events/
│   │   │   ├── dashboard.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui-elements/             # Reusable component library
│   │   │   ├── AppButton.tsx
│   │   │   ├── AppCheckBox.tsx
│   │   │   ├── AppIconButton.tsx
│   │   │   ├── AppModal.tsx
│   │   │   ├── AppSelect.tsx
│   │   │   ├── AppSwitch.tsx
│   │   │   ├── AppTable.tsx
│   │   │   ├── AppTextArea.tsx
│   │   │   ├── AppTextInput.tsx
│   │   │   ├── BreadCrumbs.tsx
│   │   │   ├── DebounceSearchInput.tsx
│   │   │   └── Loader.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── SciptEditor.tsx
│   ├── contexts/
│   │   └── SSEProvider.tsx
│   ├── helpers/
│   ├── hooks/
│   │   └── useMe.tsx
│   ├── libs/
│   │   └── axios.ts
│   ├── utils/
│   │   └── providers.tsx
│   └── public/
│
└── Backend/                         # Express + Node.js backend
    ├── controllers/
    │   ├── ai.controller.ts
    │   ├── auth.controller.ts
    │   ├── automation.controller.ts
    │   ├── cron.controller.ts
    │   ├── dashboard.controller.ts
    │   ├── deployment.controller.ts
    │   ├── integrations.controller.ts
    │   ├── processes.controller.ts
    │   ├── project.controller.ts
    │   ├── servers.controller.ts
    │   ├── settings.controller.ts
    │   └── webhooks.controller.ts
    ├── routes/
    ├── services/
    │   ├── automation.service.ts
    │   ├── github.service.ts
    │   └── mail.service.ts
    ├── workers/
    │   ├── deploy.worker.ts
    │   └── rollback.worker.ts
    ├── middlewares/
    ├── helpers/
    │   ├── Encryption.ts
    │   ├── GenerateDeployUID.ts
    │   └── LogErrors.ts
    ├── libs/
    │   ├── jwt.ts
    │   ├── mongodb.ts
    │   └── SSE.ts
    ├── app.ts
    ├── app.constants.ts
    ├── Dockerfile
    └── tsconfig.json
```

---


## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- PM2 (`npm install -g pm2`)

### Installation

```bash
# Clone the repository
git clone https://github.com/vickynot-10/DeployDock.git
cd deploydock

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### Running Locally

```bash
# Start the backend
cd Backend
npm run dev

# Start the frontend
cd Frontend
npm run dev
```

---


## Rollback

DeployDock supports git-based rollback. Each deployment records its commit SHA, allowing you to roll back to any previous state. This is handled automatically through the UI from the deployment history page.

---


## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE).

See the [LICENSE](./LICENSE) file for full details.