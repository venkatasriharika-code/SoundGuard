# SoundGuard enhancement checklist

## Continuous monitoring update

- [x] Replace the worker-facing manual live-check action with an automatic monitoring status surface.
- [x] Add a simulated background scan cadence, last-scan timestamp, and critical anomaly threshold indicator.
- [x] Trigger the existing English-then-Hindi risk alarm automatically when the monitored risk state crosses the escalation threshold.
- [x] Keep a clearly labelled supervisor-only test control without presenting it as the normal worker workflow.
- [x] Validate the automatic escalation and run a type/build check.

## Automatic alarms and machine onboarding

- [x] Replace manual language selection with a single automatic English-then-Hindi risk advisory sequence.
- [x] Add a visible automation mode indicator that explains alarms trigger when a critical anomaly is detected.
- [x] Add an Add Machine dialog with category selection, a custom category option, machine identity, location, and baseline-duration fields.
- [x] Insert newly created machines into the monitoring ledger and operational rail as locally managed prototype data.
- [x] Validate the automatic alarm sequence and new-machine form, then run a type/build check.

- [x] Define separate Overview, Live Monitoring, Detection Studio, Maintenance, and Pilot Evidence views with persistent navigation.
- [x] Source and license-check small healthy and faulty industrial audio samples from the DCASE/MIMII benchmark ecosystem.
- [x] Upload the selected audio assets to project-linked storage and record their source attribution.
- [x] Add real audio playback, browser microphone recording, and local audio-file upload with waveform display.
- [x] Add 30-day health-history visualization with selectable machine context.
- [x] Add risk-alarm experience with machine-specific English and Hindi spoken advisory, clear recommended action, and acknowledge workflow.
- [x] Preserve the Signal Ledger visual system and ensure controls work on desktop and mobile.
- [x] Run type/build checks and validate key interaction paths before delivery.
