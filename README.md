# Salus (/ˈsaː.lus/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/rexdotsh/salus) [![Website Deployed](https://deploy-badge.vercel.app/vercel?url=https%3A%2F%2Fsalus.rex.wf&name=Vercel)](https://salus.rex.wf)

> [!NOTE]
> Winner of the BMS Hackaphasia Hackathon (1st place).

> Salus is the Latin word for "health," "safety," or "welfare." In Roman mythology, Salus was also the goddess of safety and well-being.

A comprehensive telemedicine solution engineered for low-bandwidth, high-latency environments, enabling reliable healthcare consultations in underserved regions with limited internet access.

## Project Overview

Salus addresses healthcare accessibility challenges through a three-tier architecture:
- **Web Platform**: PeerJS-powered video consultations with AI triage
- **Terminal Interface**: Ultra-low bandwidth SSH fallback (< 1KB/s)
- **AI Medical Assistant**: Custom-deployed medical reasoning model

## Architecture

### AI Infrastructure
- **Model**: [II-Medical-8B](https://huggingface.co/Intelligent-Internet/II-Medical-8B) - Advanced 8B parameter medical reasoning model
- **Deployment**: VLLM on Vast.ai GPU infrastructure
- **Features**: Medical Q&A, symptom analysis, triage recommendations

### Model Details

**II-Medical-8B** is specifically fine-tuned for medical reasoning:
- **Training Data**: 555K carefully curated medical samples including:
  - 103K public medical reasoning datasets
  - 225K synthetic medical Q&A generated with QwQ
  - 338K curated medical R1 traces (domain-filtered via clustering)
  - 15K supplementary math reasoning traces

### Web Application (Next.js)
- **Video Conferencing**: P2P WebRTC via PeerJS for bandwidth efficiency
- **AI Triage System**: Intelligent patient routing based on symptoms
- **Progressive Web App**: Offline-capable with service workers
- **Real-time Features**: Convex for data synchronization across interfaces

### Terminal Interface (TUI)
- **SSH Access**: `ssh tui.salus.rex.wf -t SESSION_ID`
- **Built with**: OpenTUI (Zig) with React bindings
- **Bandwidth**: Under 1KB/s for extreme connectivity constraints

## Quick Start

### Prerequisites
- Bun
- Docker (for AI model)
- Convex account

### Installation

```bash
# Clone repository
git clone https://github.com/rexdotsh/salus
cd salus

# Install dependencies
bun install

# Setup environment
cp .env.example .env.local
# Configure: CONVEX_URL, VLLM_API_KEY, VLLM_BASE_URL

# Run development server
bun run dev
```

## Tech Stack

- **Frontend**: Next.js 14, Shadcn UI, AI SDK
- **Video/Audio**: PeerJS (WebRTC)
- **Backend**: Convex, Better-Auth
- **AI Model**: II-Medical-8B via VLLM
- **TUI**: OpenTUI
- **Deployment**: Vercel, Vast.ai
