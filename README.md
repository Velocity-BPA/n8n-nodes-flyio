# n8n-nodes-flyio

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Fly.io, the platform for running full-stack apps and databases close to users worldwide. This node enables workflow automation for managing Fly Apps, Machines (fast-launching VMs), Volumes, Secrets, Certificates, IP Addresses, Organizations, and Regions through Fly.io's Machines REST API and GraphQL API.

![n8n](https://img.shields.io/badge/n8n-community%20node-FF6D5A)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Apps Management**: Create, list, get, and delete Fly Apps
- **Machines Management**: Full lifecycle control including create, start, stop, restart, signal, cordon/uncordon, and execute commands
- **Volumes Management**: Create, extend, snapshot, and restore persistent storage volumes
- **Secrets Management**: Set, unset, and deploy application secrets
- **Certificates Management**: Add, check, and remove SSL/TLS certificates
- **IP Addresses Management**: Allocate and release IPv4/IPv6 addresses
- **Organizations**: View organization details and members
- **Regions**: List available deployment regions
- **Polling Trigger**: Monitor Machine and Volume state changes

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-flyio`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the node
npm install n8n-nodes-flyio

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-flyio.git
cd n8n-nodes-flyio

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-flyio

# Restart n8n
```

## Credentials Setup

### Creating API Tokens

1. **Install flyctl CLI**: Follow instructions at [fly.io/docs/hands-on/install-flyctl](https://fly.io/docs/hands-on/install-flyctl/)
2. **Authenticate**: Run `fly auth login`
3. **Create Token**:
   - Deploy token: `fly tokens create deploy -a <app-name>`
   - Org token: `fly tokens create org`
   - Read-only token: `fly tokens create readonly`

Or via Dashboard: Account > Settings > Access Tokens > Create Access Token

### Credential Configuration

| Field | Description | Default |
|-------|-------------|---------|
| API Token | Your Fly.io API token | Required |
| Base URL | API endpoint | `https://api.machines.dev` |

## Resources & Operations

### Apps

| Operation | Description |
|-----------|-------------|
| Create | Create a new Fly App |
| Delete | Delete an app |
| Get | Get app details |
| List | List all apps in an organization |

### Machines

| Operation | Description |
|-----------|-------------|
| Create | Create a new Machine |
| Delete | Delete a Machine |
| Get | Get Machine details |
| List | List all Machines in an app |
| Update | Update Machine configuration |
| Start | Start a stopped Machine |
| Stop | Stop a running Machine |
| Restart | Restart a Machine |
| Signal | Send a signal (SIGTERM, SIGKILL, etc.) |
| Wait | Wait for a Machine state |
| Cordon | Remove from load balancer |
| Uncordon | Add back to load balancer |
| Execute | Run a command on a Machine |
| Get Lease | Get current lease |
| Acquire Lease | Acquire a lease |
| Release Lease | Release a lease |
| List Events | List Machine events |
| List Processes | List running processes |
| Get Metadata | Get metadata key |
| Update Metadata | Set metadata key |
| Delete Metadata | Remove metadata key |

### Volumes

| Operation | Description |
|-----------|-------------|
| Create | Create a new volume |
| Delete | Delete a volume |
| Get | Get volume details |
| List | List all volumes |
| Update | Update volume settings |
| Extend | Extend volume size |
| List Snapshots | List volume snapshots |
| Create Snapshot | Create an on-demand snapshot |
| Restore from Snapshot | Create volume from snapshot |

### Secrets

| Operation | Description |
|-----------|-------------|
| List | List secret names (not values) |
| Set | Set one or more secrets |
| Unset | Remove secrets |
| Deploy | Deploy staged secrets |

### Certificates

| Operation | Description |
|-----------|-------------|
| Add | Add certificate for hostname |
| Check | Check certificate/DNS status |
| Delete | Remove certificate |
| Get | Get certificate details |
| List | List all certificates |

### IP Addresses

| Operation | Description |
|-----------|-------------|
| Allocate | Allocate new IP (v4/v6/private_v6) |
| List | List allocated IPs |
| Release | Release an IP address |

### Organizations

| Operation | Description |
|-----------|-------------|
| Get | Get organization details |
| List | List accessible organizations |

### Regions

| Operation | Description |
|-----------|-------------|
| List | List all available regions |
| Get Backup | Get backup regions for primary |

## Trigger Node

The Fly.io Trigger node polls for state changes at configurable intervals.

### Supported Events

- **Machine State Changed**: Any Machine state transition
- **Machine Created**: New Machine detected
- **Machine Started**: Machine transitioned to started
- **Machine Stopped**: Machine transitioned to stopped
- **Machine Destroyed**: Machine removed
- **Volume State Changed**: Volume created, updated, or deleted

### Configuration

| Field | Description |
|-------|-------------|
| App Name | App to monitor |
| Event Type | Type of event to trigger on |
| Include Machine Config | Include full config in output |
| Region Filter | Only trigger for specific region |

## Usage Examples

### Create and Start a Machine

```json
{
  "resource": "machine",
  "operation": "create",
  "appName": "my-app",
  "region": "ord",
  "image": "nginx:latest",
  "machineConfig": {
    "cpuKind": "shared",
    "cpus": 1,
    "memoryMb": 256
  }
}
```

### Scale Machines by Region

1. Use "List Machines" to get all machines
2. Filter by region using n8n expressions
3. Use "Start" or "Stop" operations in a loop

### Deploy with Volume

```json
{
  "resource": "volume",
  "operation": "create",
  "appName": "my-app",
  "volumeName": "data",
  "region": "ord",
  "sizeGb": 10
}
```

Then create a Machine with mount configuration:

```json
{
  "resource": "machine",
  "operation": "create",
  "machineConfig": {
    "mounts": "[{\"volume\": \"vol_xxx\", \"path\": \"/data\"}]"
  }
}
```

## Fly.io Concepts

### Machines
Fly Machines are fast-launching Firecracker microVMs that can start in sub-second time. They run your Docker images and can be scaled globally.

### Volumes
Fly Volumes provide persistent NVMe storage attached to Machines. Volumes are region-specific and support snapshots for backup.

### Regions
Fly.io runs in 30+ regions worldwide. Common regions include:
- `ord` - Chicago
- `iad` - Ashburn
- `cdg` - Paris
- `sin` - Singapore
- `syd` - Sydney

### Leases
Machine leases provide coordination primitives for distributed systems, allowing exclusive access to Machine operations.

## Error Handling

The node includes comprehensive error handling:

- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Invalid API token
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource state conflict
- **429 Too Many Requests**: Rate limit exceeded

Rate limits: 1 req/s per action per machine (burst to 3 req/s), Get Machine at 5 req/s (burst to 10 req/s).

## Security Best Practices

1. **Use scoped tokens**: Create deploy tokens for specific apps rather than org-wide tokens
2. **Rotate tokens regularly**: Create new tokens and revoke old ones periodically
3. **Never commit tokens**: Use n8n credentials, not hardcoded values
4. **Use read-only tokens**: When only reading data, use read-only tokens

## Development

```bash
# Install dependencies
npm install

# Run in watch mode
npm run dev

# Run linting
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-flyio/issues)
- **Documentation**: [Fly.io Docs](https://fly.io/docs/machines/api/)
- **n8n Community**: [community.n8n.io](https://community.n8n.io/)

## Acknowledgments

- [Fly.io](https://fly.io) for their excellent platform and API documentation
- [n8n](https://n8n.io) for the workflow automation platform
- The n8n community for their support and feedback
