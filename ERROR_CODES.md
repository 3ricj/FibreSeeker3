# Error Codes

A community-maintained reference of FibreSeeker 3 error codes — what they mean, what causes them, and which firmware versions address them.

> **Note:** Error codes are listed as reported by the community. Where a fix is attributed to a firmware release, it's based on changelog analysis, not an official statement — treat it as the best available guidance. See [FIRMWARE.md](FIRMWARE.md) for firmware downloads.

## Index

| Code | Description | Likely fixed in |
|------|-------------|-----------------|
| [`10052`](#10052---z-axis-out-of-range) | Z axis out of range | `2.2.38.721.295` |

---

## 10052 — Z axis out of range

**Example message:** `code 10052, z axis out of range -0.4050`

The reported Z position falls outside the machine's valid travel range. A small negative value such as `-0.4050` typically indicates a bad Z reading rather than a genuine crash into the travel bound.

**Probable cause:** An inaccurate Z-offset from deviation calibration — a tilted calibration key can produce a spurious offset reading, which then trips the out-of-range check.

**Fix:** This was likely resolved in firmware **`2.2.38.721.295`**:

> *"Fixed Z-offset inaccuracies caused by key tilt affecting deviation calibration."*

A bad calibration reading producing a spurious `-0.405` Z value would trip an out-of-range check, so this fix removes the root cause.

**What to do:**

1. Check that your firmware is at **`2.2.38.721.295` or above** (current release: `2.2.42.831.320` — see [FIRMWARE.md](FIRMWARE.md)).
2. After updating, run a full-process print calibration to reset Z-offset values.
3. If the error persists on current firmware, open an [issue](../../issues) with your firmware version, what you were doing when it appeared (print start vs. pause/resume), and whether recalibration cleared it.

---

*Know what a code means or how you resolved it? Contribute an entry — this page grows one code at a time.*
