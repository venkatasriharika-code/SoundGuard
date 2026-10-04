# Hosting cost sources

- Google Cloud Run pricing: https://cloud.google.com/run/pricing
  - Request-based free tier shown on 2026-10-04: 180,000 vCPU-seconds/month, 360,000 GiB-seconds/month, and 2 million requests/month.
  - Default listed rates in the fetched page: $0.000024 per vCPU-second, $0.0000025 per GiB-second, and $0.40 per million requests.
  - Google’s example for 10 million requests/month at 1 vCPU, 512 MiB, 400 ms average latency is $13.69/month with the free tier, or $18.91 without it.

- Render pricing: https://render.com/pricing
  - Hobby workspace: $0/month + compute.
  - Free service: $0/month, 512 MB RAM, with usage limits.
  - Paid service under 1 CPU / 512 MB: $7/month.
  - 1 CPU / 2 GB: $25/month.
  - Paid compute is prorated to the second.
