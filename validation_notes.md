# Validation notes

## 2026-08-21 — Initial browser verification

The enhanced site loads with separate Overview, Live Monitoring, Detection Studio, Maintenance, and Pilot Evidence views. The Detection Studio visibly exposes normal and anomalous MIMII/DCASE sample controls, browser microphone recording, local audio-file selection, and an illustrative inference panel. The benchmark-audio source is explicitly labelled in the interface.

Playback of the anomalous benchmark recording was browser-verified: the control changes to a pause state and the inference panel updates to "faulty benchmark audio" with a high deviation state. Live Monitoring was browser-verified: the selected Pump Assembly C view shows machine-specific baseline data and a 30-day health chart with its intervention threshold.

The urgent risk-alarm modal was browser-verified. It identifies Pump Assembly C, provides its machine code, health and confidence, shows the anomalous fingerprint, and gives an explicit lubrication/bearing-seat action with repeat-advisory and acknowledgement controls. The global language switch sits outside the modal, so the next check will switch the language before opening the advisory.

The risk advisory was closed successfully and the global selector was then browser-verified to switch into Hindi mode before an alarm is opened. The next alarm invocation uses the Hindi visual and speech-advisory branch.

The Hindi risk advisory was browser-verified. It displayed the Hindi action label, Hindi lubrication/bearing-seat guidance, and Hindi-labelled repeat-advisory and acknowledgement controls for Pump Assembly C.

For a controlled upload validation, the Detection Studio was reopened and the hidden browser file input was temporarily exposed in the preview only. No project source files or user-facing behaviour were changed by this test setup.

The local audio-upload workflow was browser-verified with `soundguard-normal-valve.wav`, a real selected benchmark WAV. The file name is shown in the Detection Studio, local playback and demonstration-analysis controls appear, the inference panel identifies the uploaded source, and the interface confirms that the file is not uploaded to a server.

The final desktop review confirmed the operational rail now displays plant scope, calibration status, machine identifiers, machine health, and edge-gateway state. Metric and action panels contain time, machine, calibration, and acoustic-fingerprint evidence. The final mobile review confirmed the compact tab strip, hero, evidence records, and actions remain readable at a 390-pixel viewport.

## 2026-08-21 — Automatic alarm and onboarding update

The updated overview visibly shows the automatic `EN + HI` alarm mode and an Add Machine control. The Add Machine dialog was browser-verified to expose a machine name, preset machine-category selector, custom category option, plant location, baseline-duration selector, and a clear calibration requirement before automatic anomaly alerts are enabled.

An end-to-end onboarding test added an Air Compressor record to the monitoring ledger, operational rail, selected fingerprint panel, and 30-day health context. The new record is visibly marked as pending calibration, with 0% model confidence and a 14-day baseline requirement. The test also identified that the temporary identifier generator should be changed to derive the next unused machine number instead of using the machine count.

The automatic risk-alarm dialog was browser-verified after reloading the identifier fix. It contains no manual language selector and visibly presents the English and Hindi actions together. The control flow explicitly states that it sounds the alarm, announces English first, then announces Hindi using installed browser voices.

The alarm modal was closed and machine onboarding was reopened after the identifier-generator correction. The onboarding dialog reset cleanly, ready to test a selected category and the next unused SoundGuard identifier.

The corrected onboarding form accepted the Compressor category and the Air Compressor D / Line 2 · Bay 4 details. The final submission will validate that the next unused SoundGuard identifier and selected category are carried into the monitoring ledger.

The final onboarding submission was browser-verified. Air Compressor D appeared as `SG-08 / COMPRES` in the rail, fleet ledger, selected fingerprint, and 30-day health context. It retained its Compressor category and pending 14-day calibration state. The final type check and production build completed successfully.

## 2026-08-21 — Continuous monitoring update

The updated prototype was loaded without any monitoring action being clicked. After the background scan interval, the automatic risk-alarm dialog opened for Pump Assembly C. This verifies that the critical calibrated state triggers the English-then-Hindi advisory independently of the worker-facing interface.

The worker-facing Live Monitoring view was browser-verified after closing the alarm. It no longer exposes a Run live check button; instead it shows automatic-monitoring state, countdown to the next scan, critical threshold, and last-scan timestamp alongside the fleet ledger.

The final desktop visual review assessed the updated design as ready to ship. The final mobile preview retained legible navigation, operating context, evidence records, and the continuous-monitoring story at a 390-pixel viewport.
