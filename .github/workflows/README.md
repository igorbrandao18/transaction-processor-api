# GitHub Actions CI/CD Pipeline

This directory contains the GitHub Actions workflow for automated testing, building, and deployment.

## Workflow: `.github/workflows/deploy.yml`

### Triggers

- **Push to `main` or `develop`** - Runs tests and builds Docker image
- **Pull Requests to `main`** - Runs tests only (no deployment)
- **Push to `main`** - Full pipeline: tests → build → deploy

### Jobs

#### 1. Test Job
- Runs on: Every push and PR
- Services: PostgreSQL 15, Redis 7
- Steps:
  - Checkout code
  - Setup Node.js 18
  - Install dependencies
  - Run linter
  - Run unit tests
  - Run integration tests
  - Run E2E tests
  - Generate coverage report

#### 2. Build Job
- Runs on: Push to `main` or `develop` (after tests pass)
- Steps:
  - Checkout code
  - Setup Docker Buildx
  - Login to DigitalOcean Container Registry
  - Build and push Docker image
  - Cache layers for faster builds

#### 3. Deploy Job
- Runs on: Push to `main` only (after build)
- Steps:
  - Checkout code
  - Install doctl CLI
  - Update App Platform spec
  - Trigger deployment

### Required Secrets

Configure these in GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean API token | [Create token](https://cloud.digitalocean.com/account/api/tokens) |
| `DIGITALOCEAN_PROJECT_NAME` | Your DO project name | Your DigitalOcean project name |
| `DIGITALOCEAN_APP_ID` | App Platform app ID | After creating app in DO dashboard |
| `DIGITALOCEAN_APP_URL` | Your app URL | Your app's domain (e.g., `app-xyz.ondigitalocean.app`) |

### Environment Variables

The workflow uses GitHub Environments for deployment:
- `production` - Used for main branch deployments
- Includes URL: `https://${{ secrets.DIGITALOCEAN_APP_URL }}`

### Manual Trigger

You can manually trigger the workflow:
1. Go to `Actions` tab in GitHub
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select branch and run

### Troubleshooting

**Tests failing:**
- Check service health (PostgreSQL, Redis)
- Verify environment variables in workflow
- Check test database exists

**Build failing:**
- Verify Dockerfile is correct
- Check DigitalOcean token has registry permissions
- Verify project name matches your DO project

**Deploy failing:**
- Verify `DIGITALOCEAN_APP_ID` is correct
- Check `.do/app.yaml` is valid
- Verify doctl has correct permissions
- Check App Platform logs in DO dashboard



