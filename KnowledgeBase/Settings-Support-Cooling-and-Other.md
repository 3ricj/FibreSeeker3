# Settings Support Cooling and Other

This page lists the Profile settings for support (tree and normal), ooze prevention (retraction, Z-hop, coast, wipe), the wipe tower, the per-layer cooling table, minimum layer time, arc fitting and the other speed switches, plus the rule for custom G-code fields. Many retraction switches are inert with factory materials; this page says which. Column meanings are on [Settings overview](Settings-Overview.md).

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unmarked claims are *Behaviour analysis*; factory values are from the factory preset files. Factory S / R / F = the profile group "PETG 0.2 mm | CFC PETG+X-CCF / PETG" in Speedy / Reinforced / Fortified.

## Profile › Support

**Factory support is Tree, style Slim, in every profile. It is enabled only in Reinforced.** The fields shown depend on type and style; the table covers the ones that matter. Tree XY and top Z distances are 0.4 and 0.2 mm in every profile. Normal support adds a hard rule: support and interface line widths must exceed the macro layer height (0 = automatic is exempt). Width 0 means automatic everywhere.

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Enable support | `GenerateSupport` |  | off / on / off | no spread | Support on/off. Sidebar "Support type". | **On in every factory Reinforced profile**; switching to R adds tree support. |
| Type (support) | `CurrentSupportType` |  | Tree / Tree / Tree | no spread | Tree or Normal. | Sidebar Normal also forces style Grid. |
| Tree support styles | `CurrentTreeSupportStyle` |  | Slim / Slim / Slim | no spread | Slim or Strong. | Hybrid/Organic exist in the slicer but are not offered. |
| Threshold angle | `SupportThresholdAngleDegree` | ° | 30 / 30 / 30 | no spread | Overhang angle from horizontal. Higher → more support. | Integer only. |
| Build plate only | `GenerateInternalSupport` |  | on / on / on | no spread | Stored value, shown inverted as "Build plate only". | Factory true shows as Build plate only **off**: support may also start on the model *(Inferred)*. Not inverted for the Hybrid twin. |
| Support speed | `SupportSpeed` | mm/s | 150 / 120 / 120 | S 80–150; F 120–180 | Support body speed. | Integer only. |
| Support line width | `SupportEWMM` | mm | 0.4 / 0.42 / 0.4 | S 0.39–0.4; F 0.4–0.42 | Support line width; 0 = automatic. | Normal support needs width > macro height or the slice is blocked. |
| Support interface line width | `SupportInterfaceEWMM` | mm | 0.4 / 0.4 / 0.4 | S 0.39–0.4 | Interface line width. | Same rule for Normal interfaces. |
| Use independent support layer height | `TreeSupportUseIndependentLayerHeight` |  | on / on / on | no spread | Support layers independent of the part (min 0.08, max 0.28 mm). | Min/max must be positive and max ≥ min, or saving is blocked. |

**Related limits.**

- The support-geometry check runs on every sidebar change and Apply. While it fails, mode, printer, material and profile switching are blocked.
- Hidden styles: tree Hybrid and Organic, and normal Default and Snug, exist but are not offered; tree support interface offers Zigzag only. See [Settings overview](Settings-Overview.md).
- Support blocker and Support enforcer masks add or remove support regions; there is no paint-on support (see [Masks and layups](Masks-and-Layups.md)).

## Profile › Ooze prevention, wipe tower, cooling and Other

**Retraction and travel switches live in the profile, while their lengths live in the material.** Several of these switches are therefore inert with factory materials.

**Cooling table.** The Cooling section is a per-layer table (`LayersAndFanSpeedsArray`: layer index → auxiliary and exhaust fan %), empty in the Speedy baseline. Its values stay on after the print (*G-code*, 1.3.1).

- The auxiliary column (`M106 P3`) drives the auxiliary cooling fan, and any P3 command also switches the chamber heater off and opens the louvres.
- The exhaust column (`M106 P5`) drives the exhaust fan.
- Both per the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35) (*Community*; not independently verified). Fan behaviour is covered on [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md).

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Avoid crossing borders | `DoAvoidCrossingPerimeters` |  | on / on / – | no spread | Route travel inside the part. | – |
| Do retract only when crossing borders | `DoRetractOnlyWhenCrossingPerimeters` |  | off / off / – | S off/on; R off/on | Retract only on travels that cross walls. | Faster; ooze stays inside. With it on, 1.3.1 Reinforced files travel up to 52 mm inside the part unretracted (*Community*, [#1](https://github.com/3ricj/FibreSeeker3/issues/1)). |
| Do Z-hop when retract only | `DoZHop` |  | on / off / – | no spread | Z-hop on retract. | Expert. Height comes from the plastic's Z-hop height *(Inferred)*. Not honoured in 1.3.1: hops appear with it off (9,655 in the Fortified Benchy, 8,886 of them without a retract; *Community*, [#29](https://github.com/3ricj/FibreSeeker3/issues/29)). 1.4.0 untested. |
| Do coast before retract | `DoCoastAtEnd` |  | on / on / – | S off/on; R off/on | Coast before retract. | **Inert**: coast length is 0 in every plastic. |
| Do wipe nozzle | `DoWipeNozzle` |  | off / off / – | S off/on | Wipe on retract. | **Inert**: wipe length is 0 in every plastic. But the one 1.4.0 file with it on (custom profile, wipe length 0) writes no-op `G1 E0` lines where a retract would be, then travels up to 33 mm unretracted; the link is *(Inferred, untested)*. Keep it off. |
| Generate wipe tower | `GenerateWipeTower` |  | off / off / off | no spread | Wipe tower (expert tab). | Forced off in S. |
| Enable minimum layer time slowdown | `EnableSlowDownAtShortPrintTimeLayer` |  | on / on / on | no spread | Minimum layer time slowdown. | Scales all extrusion moves to one ceiling; travel not slowed. In 1.3.1 the slowdown stopped at ≈ 40 mm/s, leaving layers under target (*Community*, [#5](https://github.com/3ricj/FibreSeeker3/issues/5)); 1.4.0 adds a 10 mm/s floor setting, untested in output. |
| Minimum layer print time | `MinLayerTimeForSlowing` | s | 10 / 10 / 10 | no spread | Target minimum layer time. | Small parts print slowly; printing several at once avoids it *(Inferred)*. |
| Enable arc fitting | `EnableArcFitting` |  | off / off / – | no spread | G2/G3 arc fitting. | Also tightens outline simplification (10 → 2 µm). |
| Perimeter trim ratio | `TrimGapRatio` |  | 0 / 0 / – | S 0–1; R 0–1 | Seam gap on closed plastic loops (× width). | |
| Smooth speed discontinuity areas | `EnableWallSpeedSmoothing` |  | on / on / – | no spread | Ramps speed at overhang-slowdown boundaries. | Needs overhang slowdown. Not passed to the slicer in F. |
| Enable height-based speed limit | `EnableHeightSlowdown` |  | off / off / – | no spread | Speed limit by Z band. | End height must be > start or Apply fails silently. |

## Start G-code and custom G-code fields

**Always end any custom G-code field with a newline.** A field whose last character is a lowercase `n` or `\` loses it (`M117 fan` is written as `M117 fa`; *G-code*, 1.4.0.857, [#48](https://github.com/3ricj/FibreSeeker3/issues/48)).

The profile's Start G-code (`StartGCode`) carries the pressure-advance and motion lines and differs between profiles. Its contents and known defects (for example the malformed Speedy PET GF 0.1 start G-code, [#42](https://github.com/3ricj/FibreSeeker3/issues/42)) are on [Custom G-code and export](Custom-G-code-and-Export.md).

## See also

- [Settings overview](Settings-Overview.md)
- [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)
- [Custom G-code and export](Custom-G-code-and-Export.md)
- [Print time](Print-Time.md)
- [Known bugs](Known-Bugs.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
