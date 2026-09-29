# FibreSeeker SK3 Controller — Hardware Information

**File:** `Exploration/HardwareInfo.md`
**Equipment:** Anisoprint FibreSeeker SK3 / FibreSeeker3 printer controller
**Visible PCB revision:** `V2.2`  
**Status:** Pre-publication working inventory compiled from board markings, boot messages, and firmware configuration; not a manufacturer schematic or a verified wiring guide.

> **Principal finding:** The controller combines an RK3568 Linux host with an STM32H723 motherboard motion/I/O controller and a separate STM32F405 toolhead controller, both connected by USB CDC. The live configuration carries **six TMC2240 SPI drivers** on the motherboard (X, Y, Z, and three feed extruders), which answers the "missing Z driver" question: Z is `[stepper_z]` / "Motor3" from the included `piezoelectric_ceramic.cfg`. Lighting has two independent paths: a PWM `MAIN_LED` chamber light on the H723, and a **37-pixel WS2812B addressable strip driven from the RK3568's SPI3 via `spidev`** by the vendor `ws2812b_spi` Klipper extension, which implements `M2000`. No physical SWD, JTAG, or UART header pinout has yet been verified; close-up inspection gives CN42 the only readable serial legend on the board (`G RX TX NC`), and routing confirmation shows its UART runs directly into the STM32H723 — an MCU-side serial port, **not** an RK3568 console. The installed harness is mapped in 5.9: all populated headers are cabled except seven service/expansion candidates (5.8), and the CAN header CN36 is cabled. Off-board components and the resulting power architecture are in Section 13. Unit-specific identifiers are omitted from this report.

## Contents

1. [Scope, evidence, and confidence](#1-scope-evidence-and-confidence)
2. [Board identity and architecture](#2-board-identity-and-architecture)
3. [Linux host inventory](#3-linux-host-inventory)
4. [Motion controllers and firmware interfaces](#4-motion-controllers-and-firmware-interfaces)
5. [Physical connector inventory](#5-physical-connector-inventory)
6. [Major ICs and active circuitry](#6-major-ics-and-active-circuitry)
7. [Software-to-hardware signal map](#7-software-to-hardware-signal-map)
8. [Motor channels and driver mapping](#8-motor-channels-and-driver-mapping)
9. [CAN, USB, display, and peripheral topology](#9-can-usb-display-and-peripheral-topology)
10. [Lighting and accessory-output interpretation](#10-lighting-and-accessory-output-interpretation)
11. [Debug, programming, and recovery interfaces](#11-debug-programming-and-recovery-interfaces)
12. [Non-destructive verification plan](#12-non-destructive-verification-plan)
13. [Off-board components and power architecture](#13-off-board-components-and-power-architecture)
14. [Outstanding questions and next evidence](#14-outstanding-questions-and-next-evidence)
15. [Technical references](#15-technical-references)

## 1. Scope, evidence, and confidence

This report consolidates board markings, system boot messages, firmware configuration, and component documentation used to check general specifications and STM32 package-pin assignments.

No continuity measurements, voltage measurements, firmware writes, or live printer commands were performed. Underside and heatsink-covered IC markings remain unverified.

### 1.1 Confidence levels

| Level | Meaning |
|---|---|
| **Established** | Directly visible marking, or a value stated verbatim in boot messages or the active firmware configuration. |
| **Strong candidate** | Several independent indications agree, but a decisive confirmation (tracing, register read, clearer marking) is still outstanding. |
| **Inference** | Proposed interpretation from position, circuitry, labels, or agreement between board observation and software reports. |
| **Unknown** | Insufficient information to identify the device, function, electrical characteristics, or physical routing. |

Named link tags such as [ST-H723] or [TMC2240] cite external technical references; they establish component behavior or pin functions, not this PCB's wiring.

High confidence refers to the particular claim being made. A connector label can be clear while its contact order, operating voltage, or MCU routing remains unknown. A configuration entry can identify an intended function without proving that every associated device is fitted, connected, or communicating successfully.

### 1.2 Electrical boundaries

**Do not use this report as an unverified pinout.** Contact counts are approximate where obscured. Signal legends are transcribed as visible text, not guaranteed mating-side contact order. Neither connector series nor pitch has been measured.

Disconnect power before continuity testing or moving harnesses. Before debugging, electrically isolate heater, SSR-control, and motor circuits as appropriate, and do not halt/reset a controller during a print. Never apply mains voltage to a header identified here as an SSR-control connection. Off-board inspection confirms mains-voltage wiring inside the enclosure (see 13.1 and 13.2): the SSR control inputs are low-voltage DC, but their load terminals connect to mains-side heater wiring. A connector's `5V` supply marking does not establish that its signal contacts tolerate 5 V. Do not assume the two large power connectors are paralleled. Observed wire colors are recorded in 5.9 as harness identification aids only; insulation color establishes neither polarity, voltage, nor coil pairing, and the installed photographs do not resolve contact order at any header.

## 2. Board identity and architecture

### 2.1 Physical orientation

All position descriptions use the board component-side up, with the large white power connectors at the **top**, the long narrow heatsink on the **right**, and the long black fine-pitch connector near the **bottom-left**.

The main visible regions are:

| Region | Observed hardware and interpretation |
|---|---|
| Left/center | Large heatsink over the likely Linux compute section; AP6256-family wireless module and antenna connection nearby. |
| Center/right | Exposed STM32H723, local regulation, sensor/interface circuitry, and service-header candidates. |
| Right edge | Five motor connectors and associated capacitors beside a long heatsink. |
| Upper-middle | Sixth motor connector (`Feed1`), small separate heatsink, power conversion, fan/accessory headers. |
| Lower and left edges | USB-style connections, display candidate, CAN, and multiple low-voltage sensor/peripheral connections. |

The functional assignments of covered regions are inferences; the exposed connectors and heatsinks themselves are directly visible.

### 2.2 PCB markings

The upper-right silkscreen is partly obscured by the heatsink. Readable portions are approximately:

```text
…01-PCB-020(A2)
…S3_CTRL_BOARD
…0260113    V2.2
```

`V2.2` is clear. Leading characters and the complete numeric string remain unverified; a second close-up pass corroborated the visible strings but did not expose the hidden prefix. Do not convert the partly visible string into a manufacturing date without clearer visual confirmation.

### 2.3 Manufacturer and module identity

The reported Linux model string is:

```text
ITX-3568Q HDMI+LVDS
```

This is a **firmware/device-tree identification**, not a physical board-manufacturer determination. The kernel build identity includes `alientek`.

Firefly documents ITX-3568Q as an iCore-3568JQ core board with a baseboard. Linux device-tree information describes the platform supplied to the kernel; a custom board can retain inherited names. Consequently, neither the Firefly platform name nor the Alientek build identity establishes the exact module or carrier manufacturer in this printer. [FIREINTRO] [DEVICETREE]

**Inventory wording:** Custom printer controller with an RK3568 Linux compute section; device-tree model string `ITX-3568Q HDMI+LVDS`; Alientek-associated kernel build. Exact compute-module and carrier manufacturers are unverified.

### 2.4 Logical architecture

The following is a logical inventory, **not a wiring diagram**. Functions come from the firmware configuration, with physical-region assignments from board observation.

```text
RK3568 Linux host
 |
  +-- System RAM: approximately 4 GiB, reported LPDDR4
  +-- eMMC: Y1Y064, reported 58.3 GiB
  +-- SPI4.0: Winbond W25Q128FW, 16 MiB
  +-- Power management: RK809 + fan53555-driver-compatible CPU regulator
  +-- SDIO Wi-Fi: AP6256 / reported BCM43456C5
  +-- LVDS display; I2C touch controller ILI2130
  +-- USB camera and USB mass-storage device
  +-- SPI3 via spidev -> WS2812B addressable strip (37 px)
  +-- UART devices / possible host debug console
  +-- Rockchip CAN controller -> can0 (application traffic unproven)
 |
  +-- USB CDC -> STM32H723 motherboard MCU
 |              +-- Six configured TMC2240 channels (X, Y, Z, three feeds)
 |              +-- Bed/chamber control and temperature inputs
 |              +-- Board/filter/blower/exhaust fans
 |              +-- Chamber-light and wax/guide-motor outputs
 |              +-- Additional sensors / peripheral I/O
 |
  +-- USB CDC -> STM32F405 toolhead MCU
                 +-- Nozzle/toolhead temperature inputs
                 +-- Toolhead fan outputs
                 +-- ADXL345 accelerometer (SPI1) + piezo bed-mesh input (PC0)
                 +-- Other toolhead functions not fully enumerated here
```

The AP6256 module family provides a UART Bluetooth interface, but the available inventory does not independently establish an active Bluetooth session. [AMPAK]

### 2.5 Firmware-derived architecture diagram

Where §2.4 is a logical inventory, the diagram below consolidates what the **firmware artifacts** establish: the shipped fibrepack and its embedded `.config`, the vendor Klipper tree with its five build configurations (`klipper/config/*`), the as-built `.config` on the machine, the live and factory printer configurations, the vendor Klipper extras, and the boot logs. Confidence labels follow §1.1.

```text
RK3568 host — clock-sync peer of every Klipper MCU; every path below is firmware-evidenced
 |
 +-- USB host controller (DWC3 fcc00000, forced to host mode by the boot script)
 |    +-- [mcu]          STM32H723ZET6 (U1)  CDC 1d50:614e  serial "motherboard"
 |    +-- [mcu toolhead] STM32F405           CDC 1d50:6162  serial "toolhead"
 |    +-- [mcu eddy]     RP2040 probe board  by-id ...rp2040_aniso...  (present in config, NOT included live)
 |    `-- UVC camera, USB mass storage
 |
 +-- SPI0 -> /dev/spidev0.0 -> U5 CS1237 24-bit load-cell ADC at CN12  [tension_sensor] (see 6.4)
 +-- SPI3 -> /dev/spidev3.0 -> WS2812B 37-pixel strip                  [ws2812b_spi] M2000 (see 10.2)
 +-- CAN-FD fe580000 -> can0 (up at every boot, ERROR-ACTIVE) -> most plausibly U14 TJA1042T/3 -> CN36
 +-- LVDS -> touch panel (I2C ILI2130) · SDIO -> AP6256 · eMMC · SPI NOR · FIQ serial console

STM32H723 — motherboard motion + peripheral controller ([mcu], app linked @ 0x8020000)
 +-- Six TMC2240 drivers on ONE software SPI (PG6/PG7/PG8; CS PE13/PE9/PF7/PA4/PG5/PG15)
 |      X step PB4 · Y step PG13 · Z step PB8 · feed steps PE4 / PA15 / PE6
 +-- Bed heater PC12 (sensor PB1) · chamber heater PG9 (sensor PB0) · fiber heater PB11 (sensor PC4)
 +-- Fans: main PB13 + tach PA10 · filter PE5 · blower PB5 + tach PG12 · exhaust PA8
 +-- Hall/switch inputs: blinds PF10/PF9 · door !PE3 · fiber runout ^PG4 · rear ^PE0 ^PF2
 +-- Z probe PF5 · chamber light !PD2 (PWM) · wax/guide motor PF3
 `-- 0x08000000–0x08020000 reserved: a bootloader of unknown identity (see 4.1)

STM32F405 — toolhead controller ([mcu toolhead], app linked @ 0x8008000)
 +-- Vendor USB bootloader at 0x08000000: CDC 1d50:6177, serial "toolhead_bootloader"
 +-- Nozzle heaters PB1 / PB0 (sensors PC2 PT1000 / PC1 NTC) · toolhead_temp PC3
 +-- Fans: fan1 PC7 + tach PC8 · fan2 PB7 + tach PB6 · fan3 PB5 · fan4 PC9
 +-- ADXL345 on hardware SPI1 (CS PA4) · piezo bed-mesh ADC PC0 + trigger PA8
 +-- Fiber cutter: servo PB8, arm switch PB9, cut-detect halls PC11/PC12
 `-- CAN fallback build exists: bxCAN on PB12/PB13 @ 1 Mbit/s, uuid aabbccddee11 -> host can0
```

What this adds beyond §2.4:

- **Motion control lives entirely on the H723** — all six stepper axes and the three extrusion feeds are step/dir/enable-driven on that one MCU; the toolhead F405 is a thermal/sensor/cutter slave, not a motion controller. **Established** (pin map in §7–§8).
- **Only two active slave processors** — H723 and F405. The `TMC2240`, `CS1237`, `WS2812B`, `ADXL345`, and `LDC1612` are peripherals, not processors. The only other MCU named anywhere in the firmware is the optional RP2040 eddy board (§4.4). **Established**.
- **The host talks directly to two "sensor" peripherals over its own SPI controllers** (tension ADC on SPI0, LED strip on SPI3) while everything else goes through the Klipper MCUs. This unusual split is proven by the vendor Python extras, not inferred (§6.4, §10.2). **Established**.
- **CAN is a designed-in fallback transport, not the live transport** — see §9.1. **Strong candidate**.
- **Both MCUs sit behind vendor bootloaders** with different recovery routes (§4.1, §4.2). **Established** for the F405; the H723 bootloader region is reserved but its firmware is not in any shipped artifact. **Unknown identity**.

## 3. Linux host inventory

This section normalizes values reported by the boot log and firmware; interpretation notes are cited individually.

### 3.1 Processor, operating system, and memory

| Item | Reported value | Qualification |
|---|---|---|
| Main SoC | Rockchip RK3568 | `rockchip-cpuinfo` SoC ID `35685000`. |
| SoC serial | *(omitted — unit-specific)* | A unit-unique SoC serial is present in boot output; the value is intentionally omitted. |
| CPU cores | 4 × Cortex-A55 **r2p0** | MIDR `0x412fd050` recorded for all four cores; decoding gives variant 2, revision 0 (**r2p0**). |
| CPU frequency limit | `l_limit=1800000000`, approximately 1.8 GHz | Reported configured limit, not proof that the CPU always runs at this rate. |
| Architecture | `aarch64` / arm64 | Host software architecture. |
| Kernel | `5.10.198` | Boot banner: built by `alientek@alientek-virtual-machine`, GNU toolchain 10.3-2021.07, build #5 SMP dated 2026-04-23. |
| SDK identifier | `rk356x_linux5.10_release_20241220_v1.4.0c` | Preserve as a software-build identifier. |
| Userland | Ubuntu 20.04 arm64 | Reported installation, not a claim about support status. |
| systemd | `245.4` | Reported version. |
| Hostname | `anisoprint` | Reported host name. |
| Verified boot | `androidboot.verifiedbootstate=orange` | U-Boot reports an unlocked/unsigned boot chain. |
| RAM | Approximately 4 GiB; reported LPDDR4 | Chip manufacturer, exact type marking, and package count remain hidden. |
| Memory log | `Memory: 3890100K/4175872K` | Boot-line figure; the capacity alone does not prove LPDDR4 technology. |
| Memory-controller figures | Normal 780 MHz / boost 1560 MHz, as summarized | Further context is needed to distinguish clock conventions, OPPs, and effective data rates. |
| CMA | 16 MiB | Reported reserved contiguous-memory allocation. |
| Swap | `zram0` | Reported compressed-RAM swap device. |

**CPU revision:** The boot log prints only the MIDR `0x412fd050` (physical CPU 0 banner and the CPU1–CPU3 secondary bring-up lines). Decoding yields variant 2, revision 0 → **Cortex-A55 r2p0**. [MIDR]

### 3.2 Integrated SoC functions

| Block | Reported identifier / details |
|---|---|
| GPU | Mali-G52, `fde60000.gpu`; architecture `7.4.0 r1p0`; DDK `g18p0`. |
| Graphics accelerator | RGA2. |
| NPU | RKNPU, `fde40000.npu`. |
| Video processing | `mpp`, `rkvenc`, `rkvdec2`. |
| Display controller | VOP2, reported output to an LVDS panel. |

These are reported **SoC functional blocks**, not additional discrete motherboard ICs. Driver initialization does not demonstrate that the printer application uses every accelerator.

### 3.3 Storage

| Device | Reported details | Interpretation / unresolved points |
|---|---|---|
| eMMC | `mmc0`, controller `fe310000`, product string `Y1Y064`, 58.3 GiB | Exact manufacturer and package part number remain unknown. |
| eMMC user partitions | `p1` through `p7`; `ENVS` also mentioned | Full partition names, offsets, and sizes were not recorded. |
| eMMC boot areas | `mmcblk0boot0` and `mmcblk0boot1`, 4 MiB each | Presence does not identify which boot area, if any, is selected. |
| eMMC RPMB | 16 MiB | Reported size; provisioning state not investigated. |
| Root selection | `root=PARTLABEL=rootfs` | Reported kernel argument. |
| Overlay setup | `overlayroot=userdata` | Reported boot configuration; exact mount arrangement not independently checked. |
| SPI NOR | Winbond `w25q128fw`, `spi4.0`, 16 MiB / 128 Mbit | Detected device does not by itself establish the active boot source or contents. |
| USB storage | `sda`, 2.10 GB, `Generic Flash Disk 8.07` | Factory USB disk. Boot log: a single device `058f:6387` ("Mass Storage"/"Generic") on `usb 7-1`, bound by `usb-storage` → SCSI → `sda`. The device's USB serial string is intentionally omitted. |

**eMMC mode:** The boot log records `mmc0: new HS200 MMC card at address 0001` — HS200 only, which is a 200 MHz **SDR** mode; the mode is SDR, not DDR. Do not infer HS400. [HS200]

**USB vendor:** Vendor ID `058f` is **Alcor Micro**, not Realtek. The boot log shows exactly one such device: `058f:6387` on `usb 7-1` (Alcor "flash drive" product ID). Product `6362` (card reader) never appears. [USBIDS]

### 3.4 Power management and audio

| Item | Reported evidence | Conclusion |
|---|---|---|
| Main PMIC | `rk808 0-0020`, chip ID `0x8090` | RK809 reported detected at I²C address `0x20`. The `rk808` driver prefix is not a conflicting chip identity. |
| CPU regulator | `fan53555` associated with `vdd_cpu` | A regulator supported by that driver is reported; exact chip identity is not yet established. |
| PMIC RTC | `rk808-rtc` disabled | The RK809 RTC sub-function is disabled in this configuration. |
| Separate RTC | HYM8563 absent from the boot inventory | No discrete real-time-clock chip is fitted. |
| Audio | No sound card registered | No functioning audio device is demonstrated. |

The upstream `fan53555` driver supports multiple compatible parts, including FAN53555 and Silergy SYR827/SYR828. Its name alone is insufficient for a precise BOM entry. [FAN53555]

This controller has **no functioning hardware real-time clock**: the RK809 RTC sub-function is disabled in the device tree, no discrete RTC chip is present, and no backup battery is fitted, so wall-clock time must be re-established at each boot. [RKRTC]

### 3.5 Wireless, touch, camera, and serial devices

| Function | Reported details |
|---|---|
| Wireless module | AP6256; `bcmdhd` over SDIO. |
| Wi-Fi silicon identification | `BCM43456C5`, revision `0x9`. |
| Wi-Fi firmware | `fw_bcm43456c5_ag.bin`; AP6256 NVRAM selection. |
| Device-tree discrepancy | Wireless DT name reportedly says `ap6275s`. |
| Wi-Fi MAC | *(omitted — unit-specific)*. A firmware-generated MAC is present; the value is intentionally omitted. |
| Regulatory selection | Country `CN`, as reported; no regulatory changes evaluated. |
| Touch controller | ILITEK ILI2130 at `1-0041`; input name `ilitek_ts`. |
| Touch firmware / coordinates | `07-00-00-00`; reported coordinate resolution 16384. This is not the panel's pixel resolution. |
| Camera | UVC USB camera `090c:337b`, product `MGM1`, exposing `/dev/video*`. |
| Serial devices | `ttyS0` (MMIO `fdd50000`) and `ttyS8` (`fe6c0000`), both 16550A with base baud 1,500,000; console is `ttyFIQ0` with `earlycon=uart8250,mmio32,0xfe660000` (UART2). |

The AP6256 family has SDIO Wi-Fi and UART Bluetooth interfaces. Its installed Bluetooth firmware/revision and actual operational use are not established by the reported Wi-Fi identification. [AMPAK]

### 3.6 Configured but not successfully detected

| Device / block | Reported failure | Inventory treatment |
|---|---|---|
| IMX415 | Probe at `4-0037` failed | Not counted as an installed, working camera. |
| XC7160 HDMI input | Probe at `4-001b` failed | Not counted as a working HDMI-input subsystem. |
| WK2xxx SPI-UART | `spi1.0`, error `-22` | Physical presence and function unresolved. |
| I²C controller `fe5b0000.i2c` | Pinmux conflict associated with `fe590000.can` | Firmware resource conflict reported; not evidence of an external I²C device. |

A failed probe can reflect unused device-tree entries, absent hardware, or an initialization failure on fitted hardware. The available data does not distinguish these possibilities.

## 4. Motion controllers and firmware interfaces

### 4.1 Motherboard MCU

| Item | Identification |
|---|---|
| Visible chip | **STM32H723ZET6**. |
| Physical location | Large exposed ST device to the right of the central heatsink; `U1` marking visible nearby. |
| Role | Motherboard motion and peripheral controller, reported running Klipper firmware. |
| USB VID:PID | `1d50:614e`. |
| USB product / serial | `stm32h723xx` / `motherboard`. |
| Reported node | `ttyACM0`. |
| Reported stable path | `/dev/serial/by-id/usb-Klipper_stm32h723xx_motherboard-if00`. |

The STM32H723ZET6 is an LQFP144 Cortex-M7 device with 512 KiB flash and 564 KiB total SRAM; the family supports up to 550 MHz. These are component specifications, **not measurements of this firmware's clock or available application memory**. [ST-H723]

**Firmware build identity.** Two H723 Klipper build variants exist in the recovered artifacts:

| Variant | CPU clock | USB serial string | Initial pins | Where found |
|---|---|---|---|---|
| A | 520 MHz (25 MHz HSE × PLL) | `motherboard` | `!PB5` (blower forced off at startup) | `klipper/config/klipper_config_motherboard` (vendor reference config kept in the tree) |
| B | 400 MHz (25 MHz HSE) | `aniso` | none | `klipper/.config` on the machine **and** `klipper.config` inside the shipped fibrepack (identical) |

The live by-ID device path reports `..._motherboard-if00`, so the **running** firmware matches Variant A, while the saved build tree and the shipped fibrepack carry Variant B's `.config`. Either the flashed firmware was built from a third, similar configuration, or the tree is not the image on the chip; a klippy startup banner would settle it (§14). Both variants: 256 KiB application region beginning at `0x08020000` (a 128 KiB bootloader gap that no shipped artifact accounts for), RAM at `0x20000000` (128 KiB), DFU ROM address `0x1ff09800` recorded for recovery, and **every CAN option disabled** while FDCAN support is compiled in (`HAVE_STM32_FDCANBUS=y`). The USB pin set is `PA11/PA12`.

The firmware also consumes the H723's JTAG pins: `PB4` (`NJTRST`) is the X step, `PB3` (`JTDO`) is the extruder2 direction, and `PA15` (`JTDI`) is the extruder1 direction. Full JTAG and SWO trace are therefore impossible while Klipper runs; only two-wire SWD (`PA13`/`PA14`) remains (see §11.2).

### 4.2 Toolhead MCU

| Item | Identification |
|---|---|
| Reported MCU | **STM32F405**; full package suffix not recorded. |
| Physical location | Separate toolhead controller, not an additional exposed IC on this motherboard. |
| USB VID:PID | `1d50:6162`, as reported. |
| USB serial | `toolhead`. |
| Reported node | `ttyACM1`. |
| Alternative configuration | `toolhead_can.cfg` exists but is **not** referenced by the active include chain; the active transport is USB CDC (`printer_data/config/toolhead.cfg`). |
| Additional fitted functions | `adxl345` accelerometer (CS `toolhead:PA4`, MCU `spi1`, 800 Hz) feeding `[resonance_tester]`; piezo bed-mesh `[aniso_bed_mesh]` (ADC `toolhead:PC0`, trigger `toolhead:PA8`). |

The alternate CAN file is not evidence that the current toolhead connection uses CAN. Treat `ttyACM0`/`ttyACM1` as snapshot enumeration names; use an actually present stable by-ID path for persistent configuration rather than assuming enumeration order.

**Firmware build identity.** The toolhead firmware is an STM32F405 build at 168 MHz derived from an **8 MHz HSE** — the toolhead PCB carries its own 8 MHz crystal, independent of the motherboard's 25 MHz (`X1`). 512 KiB flash, application linked at `0x8008000`, USB `1d50:6162` serial `toolhead`, DFU ROM `0x1fff0000`. The vendor ships the source-level configuration of a **custom USB bootloader** (`bootloader_toolhead_config`): it lives at `0x08000000`, enumerates as `1d50:6177` serial `toolhead_bootloader`, jumps to the app at `0x8008000`, and uses 64-byte flash blocks — so toolhead firmware updates are performed through this vendor bootloader rather than through ST DFU. A CAN-transport build configuration also exists (`klipper_config_toolhead_can`: bxCAN on `PB12/PB13`, 1 Mbit/s, CAN-ID filtering, `CANSERIAL`, provisional serial string `12345`), and pairs with the factory `toolhead_can.cfg` (`canbus_uuid: aabbccddee11`, `canbus_interface: can0`) — the fallback transport terminates on the RK3568's own `can0` (§9.1). One build option is not upstream Klipper: `CONFIG_WANT_ADS131M08=y`, indicating TI **ADS131M08** three-channel ADC support compiled into the toolhead image — no live configuration uses it, so it most plausibly serves an alternate toolhead hardware revision (§14). The physical per-head power/thermal connectors sit on a separate toolhead daughter board, documented in 13.8.

### 4.3 Configuration boundary

The configuration assignments establish which MCU owns each reported signal, and the vendor Klipper extras resolve two devices that earlier looked MCU-side: the CS1237 tension ADC is read by klippy directly over `/dev/spidev0.0` (§6.4), and the WS2812B strip is driven over `/dev/spidev3.0` (§10.2). The previously vendor-internal hall pins are now fully documented in `filament_switch_sensor.cfg` (blinds `PF10`/`PF9`, door `!PE3`, cutter halls `toolhead:PC11`/`PC12`). What the firmware still does not reveal is the PCB routing from MCUs to headers, the harness arrangement, and every unconfigured component.

### 4.4 Optional third MCU: eddy/probe board (RP2040)

`eddy.cfg` — present as both a factory default and in `printer_data/config`, but **not referenced by the live include chain** — defines a third Klipper MCU `[mcu eddy]` at `/dev/serial/by-id/usb-Klipper_rp2040_aniso-if00`, with a `temperature_sensor` reading that MCU. In this variant the eddy board owns `stepper_z` (step `PB8`, dir `!PF15`, enable `!PG1`), a four-pin piezo homing front end `[aniso_bed_mesh]` (`pin1..pin4 = PF10/PF9/PF6/PF5`, ADC trigger 180), an **LDC1612 eddy-current probe** on the board's hardware I²C0 (`probe_eddy_current`, `i2c_bus: i2c0f`) used for bed mesh, and its own probe thermistor (`eddy:gpio26`). The header comment translates to "base plate homes with piezo ceramic; eddy current performs bed-mesh compensation." Two caveats keep this at *inference* rather than *established*: the file mixes an RP2040 USB identity with STM32-style `PFxx`/`PBxx` pin names (RP2040 Klipper pins are `gpioN`, as used for the probe thermistor), so parts of the file are stale or templated; and the board is absent from the active configuration, meaning this machine does not run it. If a small probe board is found in the machine, this is its firmware family.

## 5. Physical connector inventory

This section accounts for the distinguishable connection points visible on the component side of the board. Hidden underside/module connections are outside its coverage. Reference designators marked `?` are tentative readings. A dash means unreadable, **not absent**. The separate toolhead daughter board has its own connector inventory in 13.8; its reference numbering collides with this board's series, so an unqualified reference always means the main board.

### 5.1 Top edge: lighting, heater controls, and power

Software associations are explicitly marked as inferences.

| Label / reference | Contacts / visible legend | Function and confidence |
|---|---|---|
| **RGB LED — CN46** | 3; `5V`, `DATA`, `GND` | High confidence: powered digital/addressable-style LED interface. The firmware supports a WS2812B addressable strip (see 10.2); this header as its carrier is untraced. Distinct from the chamber-light output. |
| **SSR-BED — reference obscured** | 2 | High confidence: external bed-heater SSR control. Likely software counterpart: bed control `PC12`. Routing and output electrical characteristics unverified. |
| **SSR-CHAM — CN48** | 2; `−` and `+` | High confidence: external chamber-heater SSR control; reference read in close-up as CN48. Counterpart: chamber control `PG9`. Never apply mains voltage here. |
| **WAX_MOTOR? — CN71** | 2; label partly obscured | Strong candidate for wax/wire-guide motor output. Counterpart confirmed in the live config: `SENSOR_MOTOR`, `PF3`, `pwm: True`. |
| **ChamberLED (24V) — CN2** | 4; `−` `+` `−` `+`; 24 V printed in label | High confidence: chamber lighting; reference read in close-up as CN2. The doubled `−`/`+` legend implies two 24 V pairs whose individual roles are not yet assigned. Strong candidate for `MAIN_LED`, `!PD2`. |
| **Black 2×2 power connector — CN66** | 4 substantial contacts; nearby `24V` and `printborad` text (PCB typo for "printboard") | Probable 24 V electronics power connection; reference read in close-up as CN66. Input/output direction, duplicate contacts, and protection scheme unverified. |
| **Large white power connector, left — reference obscured** | 2; `−` and `+` | High-confidence DC power connection. Supply domain and current rating unknown. |
| **Large white power connector, right — reference obscured** | 2; `−` and `+` | Second DC power connection. Do not assume a parallel connection to the first or apply power without tracing. |

The two large power-connector references must not be reconstructed as `CN7` and `CN8` from exposed final digits; Close-up inspection has since identified those other headers as HLFJ (CN7) and AMS-P (CN8); they are accessory headers, not the power inputs.

### 5.2 Motor connections

Feed-channel-to-extruder mapping has not been established; the motor label pairing recorded in 13.3 - a matched, fully labeled X/Y pair distinct from the third inspected stepper - is the first hardware-side constraint on it.

| Label | Reference | Position | Interpretation |
|---|---|---|---|
| **Feed1** | **CN35** | Top edge, left of the narrow heatsink | Four-contact motor-phase connection; material-feed channel 1. The only fully readable phase legend in the set: `T2B` `T2A` `T1A` `T1B` over pads `T24`/`T23`/`T22`/`T21`. |
| **MotorY** | CN34 | Uppermost right-edge motor connector | Y-axis motor output; reference confirmed by close-up inspection. |
| **MotorX** | CN33 | Second down the right edge | X-axis motor output. |
| **MotorZ** | CN32 | Third down the right edge | Z-axis motor connection; corresponds to the configured `stepper_z` stage (see 8.3). A four-conductor harness is fitted (colors in 5.9.2); the far end and driver route remain untraced. |
| **Feed2** | CN31 | Fourth down the right edge | Material-feed channel 2; reference confirmed by close-up inspection. |
| **Feed0** | CN30 | Lowest right-edge motor connector | Material-feed channel 0; reference confirmed by close-up inspection. |

The four-wire phase-output interpretation is supported by the visible contacts, trace widths, nearby capacitors, and heatsink arrangement. Phase polarity/pairing is not mapped. `Feed0/1/2` must not be equated automatically to `extruder/extruder1/extruder2` by numerical order.

Close-up inspection confirms the full motor reference set: **CN30 Feed0, CN31 Feed2, CN32 MotorZ, CN33 MotorX, CN34 MotorY, CN35 Feed1**. Each channel has an associated four-pad group in the `T01`-`T20` series (leading zeros are part of the marking); the groups are phase-access points, not a confirmed contact order. Nearby electrolytic capacitors carry the markings `KNS` / `220` / `35V` / `AM`; one beside Feed1 reads **C102**.

### 5.3 Upper-middle: fans, optical input, and accessories

Proposed fan/motor associations remain untraced.

| Label / reference | Contacts / visible legend | Function and confidence |
|---|---|---|
| **AMS-P — CN8** | 3; `+24V` `GND` `FB` | Accessory interface; reference and legend read in close-up as a three-contact `+24V GND FB` header. The `FB` legend implies an accessory-provided feedback or sense line; protocol, current capability, and contact order remain unverified. |
| **optical Sensor — CN23** | 3; `+`, `−`, `O` | High confidence: powered optical-sensor interface. Firmware identifies this as the fiber-channel strand-presence sensor input (see 13.4); `O` lands on main-MCU pin `PG4` as `[filament_switch_sensor filament_sensor]`. Supply voltage still unmeasured. |
| **ZBSR - CN5** | 4; `O` `I` `-` `+` | Mainboard-cooling fan connection; close-up confirms reference CN5 with legend `O I - +`. Identified with the live `[fan]` on `PB13`, tach `PA10` (see 13.5): a four-contact fan header pairing 24 V supply with a tachometer pair, unlike the 2-wire nameplate fans of 13.5. |
| **HLFJ - CN7** | 4; `+` `-` `I` `O` | Probable enclosure/model cooling fan connection; close-up confirms reference CN7 with legend `+ - I O`. Strong candidate for the tacho-equipped `fan6` stanza (`PG12`, see 13.5); its four contacts match a tacho fan rather than a 2-wire nameplate unit. Exact spelling/meaning of the label requires verification. |
| **PFFS - CN14** | 2; nearby `Q41`, `D100`, `TP15`, `TP16` | Probable exhaust or filter fan; strong candidate for `fan7` on `PA8`. The two contacts match the 2-wire SNOWFAN YY6025L24B nameplate units of 13.5, whose likely stanzas (fan5/fan7) declare no tachometer. |
| **GLFS - CN77** | 2; nearby `Q33`, `D138`, `TP3`, and a mark read as `FP4` | Probable filter fan; strong candidate for `fan5` on `PE5`. The two contacts match the 2-wire SNOWFAN YY6025L24B nameplate units of 13.5. |

The abbreviations `ZBSR`, `HLFJ`, `PFFS`, and `GLFS` remain untranslated; the header-to-fan associations above rest on contact count, the fan nameplates and live fan configuration of 13.5, and board proximity, not on the labels themselves. Close-up reading shows CN5 and CN7 list their contacts in different orders (`O I - +` versus `+ - I O`): the two fan cables are not interchangeable by analogy, and each must be documented in its actual orientation.

### 5.4 Left edge and lower-left: wireless, USB, display, and service

| Label / reference | Visible details | Function and confidence |
|---|---|---|
| **ANT0** | Miniature coax socket, black antenna lead, rectangular antenna | High confidence: RF antenna connection for the adjacent wireless module. Exact connector mating series unmeasured. |
| **CN16** | Wider connector, about 8 contacts; partial power/USB-like markings | Probable combined peripheral harness with USB and additional signals. Some text was previously read as possible `CL/CH`; CAN presence here is unverified. |
| **CAMERA header; label appears U17 CAMERA** | About 5 contacts; legend approximately `EG`, `G`, `DP`, `DM`, `5V` | High-confidence USB-style camera interface. `EG` may indicate shield/chassis-related ground; verify before treating it as signal ground. |
| **Second USB-style header below CAMERA; reference unreadable** | Similar contact count and `DP/DM/5V`-type markings | Probable second USB peripheral/camera connection. Actual attached device unknown. |
| **CN44** | Small connector below USB-style headers, above CN40; about 4 contacts | Unresolved. Candidate host UART/service connection; close-up inspection still found no readable TX/RX legend or verified pinout. The board's only readable serial legend belongs to CN42, which is H723-side (see 5.7 and 11.4). Installed-state inspection: no mating cable attached. |
| **CN40** | Long black fine-pitch ribbon connector | Probable display/panel connection. Reported LVDS use strengthens the LVDS hypothesis but does not establish protocol, panel voltage, or pinout at this connector. |

The USB-style headers should not be mistaken for UART connections merely because they have a small number of contacts.

### 5.5 Bottom edge, left to right

Close-up inspection resolved most bottom-edge legends; what remains unknown stays unknown despite resemblance to common printer headers.

| Reference / label | Visible details | Function and confidence |
|---|---|---|
| **CN15 - CP-Break/Clog** | 4 contacts; `5V S1 S2 GND` | Close-up label reads CP-Break/Clog: a powered two-signal break/clog detection interface. The live firmware declares exactly two sensor pairs of exactly this shape (a runout switch plus a motion encoder, see 13.6); this header is one of the two physical counterparts, assignment untraced. |
| **CN37 - PP-Break/Clog** | 4 contacts; `5V S1 S2 GND` | Second break/clog interface of the same visible type as CN15; the other physical counterpart of the 13.6 sensor pairs. |
| **CN24 - Photo bottom** | About 3 contacts; `S GND 5V` | Close-up label reads Photo bottom: a bottom photo/endstop sensor interface. |
| **CN67 - HallTem?** | Small connector; legend `S G 3V3` | Reference re-read as CN67; the printed label reads best as `HallTem`, though the suffix is not fully clear. 3.3 V-powered Hall sensor candidate. |
| **CN59 - HallBlade** | 4 contacts; legend `OFF ON G 3V3` | 3.3 V Hall sensor with an explicit `OFF`/`ON` threshold legend; blade/wiper-position candidate. |
| **CN58 - HallDoor** | 3 contacts; first signal legend ambiguous between `T` and `I` | Door-position Hall sensor candidate from its close-up label; pin order unverified. |
| **CN3 - HeatBed Temp.** | 2 contacts; `G T`; nearby `100K` | Close-up label reads HeatBed Temp.: bed thermistor input, consistent with `PB1` in 7.1. |
| **CN4 - Cham Temp** | 2 contacts; `G T`; nearby `100K` | Chamber thermistor input, consistent with `PB0` in 7.1. |
| **CN56** | About 9 contacts; partially readable legend ending `C+SC-SPI`; `L C G 5V 3V3 O I K D` visible | Multi-signal low-voltage connector with SPI-related legends. Not classified further; do not attach an adapter. |
| **Tension Sensor - CN12** | Connector below U5, at lower-right of MCU region | High confidence in the label, read in close-up as Tension Sensor (not "Torsion"). Physical counterpart of `[tension_sensor]`; see 6.4 for the CS1237 circuit reading. |

### 5.6 Inner lower row

| Reference / label | Visible details | Function and confidence |
|---|---|---|
| **CN25** | Connector below/right of central heatsink; 3 contacts; legend begins `S` and ends `5V` | Probable powered single-signal sensor interface; full label remains unclear. |
| **CN22 - Photo Sensor** | 3 contacts; `S GND 3.3V`; legend partly obstructed | High confidence: 3.3 V-powered single-signal photo sensor interface, per its close-up label. |
| **CAN - CN36** | 4 contacts; `GND H L 5V` | High confidence: powered CAN-bus connection behind transceiver U14 (see 6.5); the reference is confirmed in close-up. A mating plug with three pale conductors is fitted (see 5.9.5); occupation of the fourth contact is not established. Controller-side routing still untraced. |

### 5.7 Debug candidates and unpopulated interfaces

Detailed investigation is in Section 11.

| Connection | Position / markings | Interpretation |
|---|---|---|
| **CN41 (header below U3)** | Above-left of STM32; 4 contacts; near T120/T121/T122 and D50/D51 | Reference read in close-up as CN41; the count is corrected from about five to four contacts. First H723 SWD candidate to trace. Not a confirmed debug port. No mating cable in installed-state inspection (see 5.8). |
| **CN42** | Above-right of STM32; near T140/T141/T142 | Readable legend `G RX TX NC`: a UART-style header plumbed directly into the STM32H723 — an MCU-side serial port, not an RK3568 console. Voltage domain and USART pins unrecorded; `NC` is a not-connected marking, not a VCC marking. Local landmarks: D48/D49 and R236/R239. |
| **CN43** | Unpopulated footprint above SW4; 4 contact lands plus 2 large anchor lands; near TP36-TP38 and D52/D53 | Unpopulated option footprint. Its position above a service button suggests a possible secondary serial or debug provision, but the function is entirely speculative until populated and traced. |
| **CN73** | Upper unpopulated long footprint between STM32 and narrow heatsink | Likely external motor-drive interface, not JTAG; visible pulse/direction/enable-style legends. |
| **CN72** | Lower unpopulated long footprint in the same region | Similar likely external motor-drive interface. |
| **Numbered T/TP pads** | Distributed across PCB | Manufacturing/test access points. Numbering alone does not identify signal or protocol. |

CN72 and CN73 are two unpopulated **ten-contact** footprints carrying the same repeated legend `5V PLS 5V DIR 5V ENA 3V3 PEND 3V3 ALM`. Likely meanings are pulse, direction, enable, positioning complete, and alarm, so the footprints favor an external motor-drive interface rather than JTAG. This is a functional inference, not a verified interface standard or electrical specification.

### 5.8 Installed-harness status

Installed-state inspection (machine powered down) records which populated connectors carry a mating harness.

**Cabled:** every populated connector otherwise listed in this section, specifically the six motor headers CN30-CN35, both SSR control headers, CN71, CN2, CN46, CN66, the two large white power inputs, CN8, the fan headers CN5/CN7/CN14/CN77, the bottom-edge sensor headers, **CN36 (CAN)**, CN16, the camera and second USB-style header, and CN40. Observed conductor colors and their reading convention are in 5.9.

**Not cabled:** **CN44**, **CN67**, **CN25**, **CN22**, **CN56**, **CN41**, and **CN42**. An earlier working note also listed CN36 among the uncabled connectors; that entry was incorrect, and inspection confirms **CN36 is connected**.

Interpretation limits: an uncabled connector is not evidence that it is unpopulated, electrically inactive, a debug port, or a deleted factory option. Several of these connectors (CN41, CN42, CN44) remain the leading candidates for the interfaces of Section 11 precisely because they are accessible on the board. The absence of a cable at rest changes what is connected, not what the circuitry can do. Conversely, a fitted cable establishes only that a connector is mated: it does not by itself identify the far-end device, the voltage carried, or whether the associated firmware path is active.

### 5.9 Installed wire colors and harness register

Installed-state inspection recorded insulation colors at the visible wire entries and the occupancy of each header. Colors identify a harness during reassembly; they are **not** an electrical pinout. Insulation color establishes no polarity, voltage domain, coil pairing, or signal direction, and no manufacturer pin-1 marking is implied. Pale insulation printed with a colored tracer is recorded separately from solid-colored conductors, and heat-shrink or outer sleeves are landmarks, not wires. Color observations are Medium confidence: lighting and adjacent bundles affect hue reading, and warm reds are written **red/orange-red** where the exact shade is uncertain.

#### 5.9.1 Orientation convention

The installed views place the long motor-driver heatsink horizontally along the bottom, the power and SSR connectors to the right, the USB-style headers along the top, and the sensor row to the left. Rotating that view 90 degrees counterclockwise recovers the standard orientation of 2.1. The motor sequences below are read **left-to-right at the wire-entry side in the unrotated installed view**; in the standard orientation the same sequences run bottom-to-top. This records what enters the plug, not the contact order on the mating face.

#### 5.9.2 Motor harnesses (CN30-CN35)

| Reference | Role | Wire-entry colors, installed-view left to right | Note |
|---|---|---|---|
| **CN30** | Feed0 | **brown/tan, pink-red, black, blue** | All four positions occupied. |
| **CN31** | Feed2 | **black, green, white, red** | Same four color names as X/Y but a different order; cables are not interchangeable by analogy. |
| **CN32** | MotorZ | **brown/tan, pink-red, black, blue** | Confirms a fitted Z harness; does not identify the driver or the far-end motor. |
| **CN33** | MotorX | **white, red, green, black** | Read at the wire entries before the conductors cross. |
| **CN34** | MotorY | **white, red, green, black** | Same visible order as X at this end. |
| **CN35** | Feed1 | **not assigned** | A plug is present near the large power connections, but overlapping power leads prevent a reliable order. Do not copy another channel's colors onto it. |

No sequence above is translated into `A+`/`A-`/`B+`/`B-` or into the `T01`-`T24` phase-pad labels. The two feed motors sharing the brown/pink/black/blue set and the two axis motors sharing the white/red/green/black set are observations, not evidence of a factory wiring standard.

#### 5.9.3 Power, SSR, lighting, and accessory leads

| Reference | Observed conductors | Limit |
|---|---|---|
| SSR-BED (reference obscured) | black + red/orange-red | Two-lead control plug; in the standard orientation the dark lead reads left. Not a polarity assignment. |
| **CN48** SSR-CHAM | black + red/orange-red | Control-side lead only; the relay load wiring is separate and mains-side (see 13.2). |
| **CN71** WAX MOTOR | black + red/orange-red | Route to the mechanism not followed end to end. |
| **CN2** ChamberLED | four pale gray/white | All four positions occupied; the printed `−` `+` `−` `+` pairs are not distinguished by color. |
| **CN46** RGB LED | three pale gray/white | Physically cabled; consistent with, but not proof of, the addressable strip of 10.2. |
| **CN66** black 2x2 | red/pink and blue visible | Mated plug; overlapping sleeves prevent a four-position map. Do not substitute a PC-power convention. |
| Two large white power inputs | thick red and black | Installed power cabling confirmed; per-terminal assignment and separate destinations unresolved. |
| **CN8** AMS-P | three pale gray/white | All three positions occupied; the `+24V GND FB` legend is not a color map. |

#### 5.9.4 Fans, sensors, USB, and display

| Reference | Observed conductors | Confidence / limit |
|---|---|---|
| **CN5** ZBSR | blue and yellow clearest at entry | Red/black appear in the partly hidden group; a full four-contact order is not established. |
| **CN7** HLFJ | pale gray with pink/red printing | Printed tracer, not four solid-pink conductors; signal roles unresolved. |
| **CN14** PFFS | red + black twisted pair | Directly visible; consistent with a 2-wire YY6025L24B nameplate fan (13.5); actual fan supply not measured. |
| **CN77** GLFS | red/orange-red + black | Directly visible; consistent with a 2-wire YY6025L24B nameplate fan (13.5). |
| **CN23** optical Sensor | brown/orange, blue, dark/black group | Association with the 3-wire `+ / − / O` optical-sensor interface is firmware-corroborated (13.4); observed colors are consistent with the Omron brown=+/blue=−/black=output convention, but contact-by-contact order is still not isolated visually. |
| **CN15** / **CN37** Break/Clog | pale gray ribbon leads, pink index/tracer | Plugs partly obscured; S1/S2 not assigned by color. The rear modules of 13.6 are the expected far end; the routes were not followed. |
| **CN24** Photo bottom | pale gray ribbon leads, pink index | Contact-by-contact order not isolated; nearby sleeve text is a landmark only. |
| **CN59** HallBlade | pale gray ribbon leads, pink edge lead | Four-contact plug present; a red sleeve farther along is not a conductor. |
| **CN58** HallDoor | pale gray leads, pink edge lead | Three-contact plug present; order not assigned. |
| **CN3** HeatBed Temp. | red/orange-red + dark/black | A red/dark pair at a thermistor header: color alone does not indicate a power feed. |
| **CN4** Cham Temp | unresolved | Position obscured by adjacent wiring. |
| **CN12** Tension Sensor | pink/magenta and pale gray with black printing | Excitation and differential pairs not separated by color. |
| **CN36** CAN | three pale gray/white conductors | See 5.9.5. |
| **CN16** | red, white, green, black/dark plus shield-like leads | Cabled; no contact map. |
| Camera and second USB-style header | red, white, green, black/dark | Both cabled; similar colors do not identify the attached device. |
| **CN40** display | dense dark-blue fine-wire bundle | A harness is installed; LVDS channels and panel power unresolved. |
| **ANT0** | thin black coax lead | Antenna relationship established by the coax, not by color. |

The recurrence of red/dark pairs on unrelated functions (heaters, fans, and a temperature sensor alike) is the main reason conductor color cannot be used to infer a voltage domain.

#### 5.9.5 CN36 - CAN, connected

The CAN header **CN36** carries a mating plug with **three pale gray/white conductors**; the fourth contact (the `5V` position by the printed legend) cannot be confirmed as wired from the visible side. **CN36 is connected**, and the earlier note listing it as uncabled was incorrect. A fitted cable does not establish CAN traffic, identify the controller behind U14, or name the far-end device, so the ownership question in 6.5 and 14 remains open; it does mean a CAN harness leaves the board and can be followed to its destination.

## 6. Major ICs and active circuitry

### 6.1 Identified or reported major devices

| Device / location | Identification | Evidence and remaining uncertainty |
|---|---|---|
| Linux compute section | **Rockchip RK3568** | Reported boot identification; physical package hidden, likely under central heatsink. |
| System memory | Approximately **4 GiB, reported LPDDR4** | manufacturer, package count, and markings unknown. |
| eMMC | **Y1Y064**, 58.3 GiB reported | full part number and location not visually identified. |
| SPI NOR | **Winbond W25Q128FW**, 16 MiB | physical reference and contents unknown. |
| PMIC | **RK809** | reported chip ID; package hidden/unlocated. |
| CPU regulator | **fan53555-driver-compatible regulator** | exact part unresolved. Driver compatibility is not a package identification. [FAN53555] |
| **U96**, beside ANT0 | **AP6256**, reported BCM43456C5 radio | Partial marking and antenna relationship, consistent with the reported radio identity. |
| **U1**, exposed ST MCU | **STM32H723ZET6** | Clear package marking and agreeing USB identity. |
| **U5**, below the MCU region at CN12 | **CHIPSEA CS1237-SO** | Marking read in close-up; a 24-bit precision ADC consistent with the tension-sensor circuit (see 6.4). [CS1237] |
| **U14**, below-left of STM32 near CAN | **NXP TJA1042T/3** | Marking read in close-up; high-speed CAN transceiver (see 6.5). [TJA1042] |
| Covered motor-driver stages | **Six configured TMC2240 channels** (X, Y, Z, three feeds) | Per the firmware configuration; no visible chip markings, package variants, or complete physical mapping. |
| Separate toolhead board | **STM32F405** | Reported; full package suffix unknown; not on the main motherboard. |
| Display/touch assembly | **ILITEK ILI2130** | exact mounting location and connector route unverified. |

### 6.2 Partially identified exposed devices

| Reference / position | Best present identification | Confidence / limitation |
|---|---|---|
| **U12**, above the large `150` inductor (inductor reference **L8**) | **TI TPS5450** | Close-up top mark reads `5450`. Landmarks: **D9** (`MDD 49F SS54C`) beside U12 and **C253** (`JerCap 100 35V MA`) in the same area. TPS5450 is a 5.5–36 V-input converter rated up to 5 A with a 500 kHz nominal oscillator [TPS5450] [TPS5450-DS]; the switching frequency, output rail, and compensation of this board are unknown. |
| **U3**, above-left of STM32 | **AMS1117-3.3**, manufacturer mark `UMW S2542` | Close-up adds a manufacturer/lot line (`UMW`, suffix `S2542`). AMS1117-3.3 is a multi-sourced outline designation, and the actual output is not electrically verified. |
| **U91 / U92**, beside USB-style headers | **Possible USB power/protection devices** | Repeated local circuits suggest related functions; load-switch identification is provisional. |
| **U105**, left of STM32 | **Unidentified eight-pin support/interface IC** | No reliable exact marking. Memory, interface, or other support function unresolved. |
| **U95**, below/right of STM32 | **Unidentified small support IC** | Close-up reading of the top code yields `XCBY`; no matching public marking was identified. Reset/power support or signal conditioning remain possibilities. |
| **U108**, in accessory/fan region | **Unidentified support device** | Reference read in close-up as U108. Top code reads approximately `1SD`; no public marking match identified. Previously inferred accessory/fan-control role remains unconfirmed. |

### 6.3 Switching, clock, and thermal features

`Q21` and `Q22` are near SSR outputs; `Q24` is near CN71; `Q33`, `Q40`, and `Q41` occur in the fan/accessory region. Nearby diodes include `D100` and `D138`. A second close-up pass fixes several power-domain landmarks: `D9` marked `MDD 49F SS54C` beside U12, the `150` inductor referenced **L8**, `C253` marked `JerCap 100 35V MA` near CN66, `C238` marked `JerCap 220 25V MA`, `R91` marked `2001`, and `C102` marked `KNS 220 35V AM` near Feed1. These are useful circuit-tracing landmarks, but no complete transistor/diode/capacitor BOM is established.

`X1`, near the STM32, is marked **YXC 25.000**: a 25 MHz clock element (Yangxing). `X2`, near the wireless module, is clock-related, but its frequency is not reliably transcribed. The block marked `150` is an inductor (reference **L8**), not an IC.

| Heatsink | Interpretation | Qualification |
|---|---|---|
| Large central finned heatsink | Linux compute section | Likely processor/module cooling; individual covered devices not visible. |
| Long narrow right-hand heatsink | Motor-driver/power stages | Layout supports this assignment; device-by-device mapping unknown. |
| Small separate heatsink near Feed1 | Possible additional motor-driver/power stage | Must not be called the sixth stepper driver without exposing or tracing the circuit. |

Do not pry off a bonded heatsink for identification. Removal, where mechanically appropriate, should preserve insulating pads and thermal interfaces and be done only with power disconnected.

### 6.4 Tension-sensor circuit - CS1237

Close-up inspection reads **U5** as **CHIPSEA CS1237-SO**, a 24-bit precision ADC with an internal programmable gain stage, in a small signal chain beside the CN12 `Tension Sensor` header. The part type is typical of load-cell/strain-gauge readback, which fits the firmware's `[tension_sensor]` feature. [CS1237] The part is a digital load-cell ADC rather than an analog conditioner.

**The firmware resolves the controller question: the CS1237 is host-side, not on the H723.** The vendor Klipper extra `klippy/extras/tension_sensor.py` implements its own `MySerial` class over Linux **spidev**, default device **`/dev/spidev0.0`** (`spi_device` option, mode 0, approximately 1 MHz): each sample is one SPI transfer (one CS cycle) of 3 raw bytes, decoded as a 24-bit two's-complement value with `GAIN 128`, `VREF 3.3`, full scale 2^23-1, plus baseline/jam/tangle detection logic and an extensive Gcode surface (`TENSION_SENSOR_START`, `TENSION_UPDATE_BASELINE`, `GET_RAW_FORCE_DATA`, and others). The live `[tension_sensor]` stanza exposes only `jam_deviation_limit: 55000` (plus `trigger_sample_count = 6` under `#*#` in `printer.cfg`) precisely because the wiring is fixed in the driver and the SPI bus is the RK3568's own. **Confidence: established for the read path; strong candidate for the U5/CN12 to SPI0 physical correspondence, which still wants a trace.** The sensing element and filter network between CN12 and U5 remain untraced. An earlier reading of this section assumed the lines reached the H723; the vendor driver contradicts that, and the 7.1 tension row has been corrected accordingly.

### 6.5 CAN transceiver - TJA1042T/3

**U14**, below-left of the STM32 near the CAN area, is marked **NXP TJA1042T/3**, a high-speed CAN transceiver in an SO8 package (leg 1 `TXD`, 2 `GND`, 3 `VCC`, 4 `RXD`, 5 `VIO`, 6 `CANL`, 7 `CANH`, 8 `STB`). [TJA1042] The marking supports the CN36 `GND H L 5V` header being a transceiver-backed CAN port.

**Firmware evidence now favors the RK3568 as U14's controller.** No shipped or as-built H723 `.config` enables any CAN or UART transport — every `CONFIG_STM32_CANBUS_*` / `SERIAL_*` option is unset in both the fibrepack build and the on-machine `.config`; FDCAN is merely compiled in, unused. Conversely, the factory `toolhead_can.cfg` attaches the toolhead's CAN fallback to **`canbus_interface: can0`** (uuid `aabbccddee11`) — the RK3568's own `rockchip_canfd` interface, which the boot logs show is deliberately brought up at every boot. The simplest consistent reading: the CAN transceiver path exists to serve the host controller, most plausibly U14 to CN36, so the optional CAN-transport toolhead could talk to `can0` through an external port. This remains a **strong candidate, not a traced fact** — U14's `TXD`/`RXD` routing and the CN36 harness far end still need physical confirmation (see 9.1 and 14), and **CN36 must not be automatically equated with the Linux `can0` interface** until traced.

## 7. Software-to-hardware signal map

### 7.1 Motherboard H723 signals

MCU port assignments come from the firmware configuration. Physical-header associations are **inferences**, not continuity-tested wiring. Package numbers are checked against ST's **LQFP144** pinout and apply only to the identified H723 package. [ST-H723]

| Reported function | H723 signal | LQFP144 leg | Proposed physical connection | Status |
|---|---|---:|---|---|
| Bed heater control | `PC12` | 113 | SSR-BED | Strong functional match. |
| Bed temperature | `PB1` | 47 | CN3 (HeatBed Temp.) | Close-up header label matches the MCU assignment; continuity tracing still pending. |
| Chamber heater control | `PG9` | 124 | SSR-CHAM (CN48) | Strong functional match. |
| Chamber temperature | `PB0` | 46 | CN4 (Cham Temp) | Close-up header label matches the MCU assignment; continuity tracing still pending. |
| Mainboard fan control, `[fan]` | `PB13` | 74 | ZBSR (CN5) | Strong candidate. |
| Mainboard fan tach | `PA10` | 102 | ZBSR (CN5) | Strong candidate. |
| Filter fan, `fan5` | `PE5` | 4 | GLFS (CN77) | Strong candidate. |
| Blower, `fan6` | `PB5` | 135 | HLFJ (CN7) | Strong candidate; contact assignment at CN7 unverified. |
| `fan6` tachometer | `PG12` | 127 | HLFJ (CN7) | Resolved: live `fans.cfg` sets `tachometer_pin: PG12`. |
| Exhaust fan, `fan7` | `PA8` | 100 | PFFS (CN14) | Strong candidate. |
| Chamber light, `MAIN_LED` | `!PD2` | 116 | ChamberLED (CN2, 24V) | Strong candidate; live stanza sets `pwm: True`, `cycle_time: 0.01`. CN2 contact assignment unverified. |
| Wax/wire-guide motor, `SENSOR_MOTOR` | `PF3` | 13 | CN71 (WAX MOTOR) | Strong candidate; the `WAX MOTOR` label is now fully readable. |
| `[tension_sensor]` | **Not an H723 signal** — read by klippy directly from `/dev/spidev0.0` (RK3568 SPI0) per vendor `tension_sensor.py` | — | CN12 (Tension Sensor) via U5/CS1237 on host SPI0 | Firmware-resolved read path (see 6.4); physical U5-to-SPI0 trace still pending. |

These MCU legs generally connect to **driver inputs, transistor gates, resistors, or conditioning circuitry**, not directly to every load/sensor contact. An output contact may legitimately have no direct continuity to the named MCU leg.

### 7.2 Toolhead temperature inputs

Port names below belong to the **STM32F405 toolhead MCU**, not the motherboard H723. No F405 physical package-leg numbers are assigned because its full part/package is not recorded.

| Configured measurement | Owning MCU | Pin | Verified sensor type | Heater output |
|---|---|---|---|---|
| `extruder` | Toolhead F405 | `PC2` | PT1000 | `toolhead:PB1` |
| `extruder1` | Toolhead F405 | `PC1` | Generic 3950 (NTC) | `toolhead:PB0` |
| `extruder2` | **Motherboard H723** | `PC4` | `my_custom_resistance_adc` (four-point linear voltage calibration) | `PB11` (motherboard) |
| `toolhead_temp` | Toolhead F405 | `PC3` | Generic 3950 | — (temperature sensor only) |
| `heater_bed` | Motherboard H723 | `PB1` | Generic 3950 | `PC12` |
| `chamber` (`heater_generic`) | Motherboard H723 | `PB0` | Generic 3950 | `PG9` |

Note: the `extruder2` sensor/heater carry **no `toolhead:` prefix** — they are motherboard-side. Nozzle heater-output pins are identified for all three tools. The bed/chamber temperature sensor pairs resolve the §14 question only at the MCU-pin level; physical headers remain untraced.

### 7.3 Toolhead fans

| Configured fan | Reported toolhead signal(s) | Function / uncertainty |
|---|---|---|
| `heater_fan fan1` | pin `toolhead:PC7`, tach `toolhead:PC8` | Resolved: on above 45 °C with `heater: extruder` (composite-head throat fan). |
| `heater_fan fan2` | pin `toolhead:PB7`, tach `toolhead:PB6` | Resolved: on above 45 °C with `heater: extruder1` (plastic-head throat fan). |
| `fan_generic fan3` | `PB5` | Part-cooling fan. |
| `fan4` | `PC9` | Fiber-related fan. |

`M106` is remapped by `fans.cfg`: plain `M106 S<n>` sets fan3 + fan4 together; `P0`→fan5 (filter), `P1`→fan3, `P2`→fan4, `P3`→fan6 (with chamber-heater and blinds-monitor side effects). A raw `M106` number is therefore not a physical header number.

### 7.4 Pin names and polarity

Preserve the MCU prefix and inversion flags when transferring configuration information. The same port name, such as `PB5`, can occur on both MCUs and refer to different hardware. In Klipper, `!` reverses pin polarity; it does not specify the load voltage or prove a particular high-side/low-side transistor topology. [KLIPPER]

## 8. Motor channels and driver mapping

### 8.1 Reported configured drivers

| Klipper channel | Reported driver / interface | Physical identity of the motor it feeds |
|---|---|---|
| `stepper_x` | TMC2240, SPI | Strong correspondence with MotorX; routing not traced. |
| `stepper_y` | TMC2240, SPI | Strong correspondence with MotorY; routing not traced. |
| `extruder` | TMC2240, SPI | **Left-head plastic drive** (FFF, tool T0, 0.7 mm nozzle). GUI/slicer alias "V"; macro `ACTIVATE_LEFT_P_EXTRUDER`; config comment 左塑料挤出机. |
| `extruder1` | TMC2240, SPI | **Right-head plastic drive** (FFF, tool T1, 0.4 mm nozzle). Alias "T1"; macro `ACTIVATE_RIGHT_P_EXTRUDER`; config comment 右塑料挤出机. |
| `extruder2` | TMC2240, SPI | **Left-head dry-fiber feed (CFC channel)** — co-extrudes fiber + resin through the same left 0.7 mm nozzle; *not* a separate head or tool. Alias "U"/"CFC"; macro `ACTIVATE_LEFT_F_EXTRUDER`; 37.5 `rotation_distance` calibrated by `ALIGN_FIBRE_LENGTH`. Its melt zone is motherboard-side (heater `PB11`, sensor `PC4`). |
| `stepper_z` | **TMC2240, SPI** (found in live config) | Live `[stepper_z]  # Motor3` + `[tmc2240 stepper_z]` in the included `piezoelectric_ceramic.cfg`; strong correspondence with MotorZ, routing not traced. |

The three feed channels are **semantically resolved** by [`Exploration/Heads.md`](Heads.md) (vocabulary layering, `SET_EXTRUDER_MODE` semantics, and the v1.x version-skew trap: in `printer_base_v1.1`–`v1.3` the same Klipper names drove different hardware — `extruder` was the *fiber* motor and `extruder2` a co-extruder). What remains open is only the board-side pairing: which physical Feed0/Feed1/Feed2 header serves which of these three logical channels (color-order evidence in 5.9.2).

Six configuration sections do not by themselves prove successful runtime register reads, the complete fitted driver count, or the absence of unused hardware. All six drivers share one bit-banged SPI bus (`spi_software_mosi/miso/sclk` = `PG6/PG7/PG8`) with individual chip selects: X `PE13`, Y `PE9`, Z `PF7`, extruder `PA4`, extruder1 `PG5`, extruder2 `PG15`. X and Y home sensorless via `diag0_pin` (`^!PE10` / `^!PD8`, `driver_SGT: 1`); an `[extruder_stall_detector extruder]` monitor uses the driver's StallGuard readout.

The TMC2240 supports STEP/DIR operation and serial configuration/diagnostics, including SPI. “SPI driver” should not be interpreted as proof that every motion step is commanded as a Linux SPI transaction. In the reported topology, the H723 manages these devices; Linux need not enumerate them directly. [TMC2240]

### 8.2 Sensorless homing

X/Y are reported configured for sensorless homing, with a virtual-endstop form such as:

```ini
endstop_pin: tmc2240_stepper_x:virtual_endstop
```

This establishes the reported homing configuration, not the driver DIAG-pin routing, tuning parameters, or absence of unused physical endstop inputs. Z is excluded: live `[stepper_z]` uses `endstop_pin: probe:z_virtual_endstop` with a physical `[probe]` on H723 `PF5` ("z轴限位开关" — Z limit switch), so Z homing uses the probe/switch, not sensorless detection.

### 8.3 Z driver — resolved

The live include chain (`printer.cfg` → `printer_base.cfg` → `piezoelectric_ceramic.cfg`) contains the missing Z stage. `piezoelectric_ceramic.cfg` (机头压电陶瓷方案配置) defines `[stepper_z]  # Motor3` with step `PB8`, dir `!PF15`, enable `!PG1`, microsteps 16, rotation distance 2.67, `endstop_pin: probe:z_virtual_endstop`, plus its own **`[tmc2240 stepper_z]`** (CS `PF7`, DIAG0 `^!PG0`, run 0.5 A, hold 0.3 A, rref 12000). The Z stanza lives in the separately included piezo file, so reading the `printer_base_v2.x` template alone shows only five driver sections.

All six visible motor headers now map to configured TMC2240 drivers: `Motor1`=X, `Motor2`=Y, `Motor3`=Z, plus the three feed motors (`extruder` step/dir/enable `PE4/!PF4/!PF11` = left plastic; `extruder1` `PA15/!PG2/!PA9` = right plastic; `extruder2` `PE6/!PB3/!PC14` = left-head fiber feed — identities per [`Exploration/Heads.md`](Heads.md)). What remains open is only physical: which header and harness the Z output actually feeds (MotorZ/CN32 is the obvious candidate), the covered driver markings, and which physical Feed0/1/2 header serves which logical channel. CN72/CN73 remain external-drive option footprints unrelated to the fitted Z stage.

## 9. CAN, USB, display, and peripheral topology

### 9.1 CAN

| Item | Reported state |
|---|---|
| Linux CAN controller | `rockchip_canfd`, `fe580000.can`. |
| Interface | `can0`, brought up. |
| Timing note | Bitrate error reported as 0.3%; exact requested bitrate not recorded. |
| Error state | `ERROR-ACTIVE`. |
| Second controller | `fe590000.can` enabled in DT; pinmux conflict associated with `fe5b0000.i2c`. |
| Initialization history | CAN bring-up logging records initialization since 2025-09-05. |
| Current MCU transport | Confirmed USB CDC in the live config: `[mcu]` and `[mcu toolhead]` both use by-ID serial paths. |
| Alternative toolhead file | `toolhead_can.cfg` exists but is not included by the live `printer.cfg` chain. |

`ERROR-ACTIVE` is a CAN-controller error state, **not proof of an attached peer or successful application traffic**. Packet counters, bus observation, and the active application configuration are needed to establish use. [SOCKETCAN]

No active CAN accessory board is demonstrated by the available inventory. That is narrower than claiming that no CAN-capable hardware is fitted. CN36's `H/L` legend and the U14 TJA1042T/3 marking (see 6.5) establish a transceiver-backed CAN port, but U14's controller-side routing still needs tracing; do not equate CN36 automatically with the Linux `can0` interface. Installed-state inspection records a mating plug with three pale conductors on CN36 (see 5.9.5), so a CAN harness does leave the board, although the fourth contact is unconfirmed and the far end is unidentified. That establishes a physical external connection but not traffic, controller ownership, or termination.

**What the firmware adds (2026-09-29 pass).** CAN is best understood as a *designed-in fallback transport*, not the live one:

- Both H723 builds ship with every CAN/UART transport option disabled — the H723 never owns a CAN port on this product.
- The vendor ships a complete CAN-transport toolhead stack: `klipper_config_toolhead_can` (F405 bxCAN on `PB12/PB13`, 1 Mbit/s, `CANBUS_FILTER`, `CANSERIAL`) plus the factory `toolhead_can.cfg` (`canbus_uuid: aabbccddee11`, `canbus_interface: can0`). If a toolhead ever enumerates as uuid `aabbccddee11`, the intended path is that toolhead's CAN pin pair, out to the CN36-class external port, into RK3568 `can0`.
- The boot script brings `can0` up on every boot (logged `ERROR-ACTIVE` since 2025-09-05) — consistent with a standing init for an optional bus rather than an idle unused one. `ERROR-ACTIVE` with no peer is exactly what a transceiver-enabled but quiet bus reports.
- `kern.log` shows a devicetree pinmux conflict where `fe5b0000.i2c` cannot claim `gpio4-13` already requested by `fe590000.can` — evidence that two host CAN controllers are described in the vendor DT, and that pinmux budgeting near them was imperfect.

These are configuration facts, not bus traffic. The physical U14-to-`can0` trace (and the CN36 far end) remains the decisive evidence.

### 9.2 USB

The reported host has USB CDC MCU devices, a UVC camera, and USB mass storage. Their electrical path through hubs, internal headers, or harnesses has not been mapped. A boot's `ttyACM` or `/dev/video` numbering should not be used to infer which physical connector carries a device.

The initialization script reportedly touches:

```text
/sys/kernel/debug/usb/fcc00000.dwc3/mode
```

This is evidence of software interacting with the DWC3 controller's mode selection. It does **not** prove that every USB-style header supports device mode or identify the recovery connector.

### 9.3 Display and touch

VOP2-to-LVDS output and the ILI2130 touch controller are reported. CN40 is the leading physical display candidate because of its form and trace routing, but LVDS channel arrangement, panel power, backlight control, and touch routing are not known. CN16 must not be designated a particular screen/toolhead harness without further evidence.

## 10. Lighting and accessory-output interpretation

### 10.1 Chamber light

The firmware configuration defines:

```ini
[output_pin MAIN_LED]
pin: !PD2
```

The complete live stanza is `pwm: True`, `value: 0`, `cycle_time: 0.01` — PWM dimming **is** enabled, overriding the upstream non-PWM default. [KLIPPER] Note, however, that `M2000` does **not** drive this output: the chamber light and the color animation are separate subsystems (see 10.2).

A logged color tuple such as `(255, 50, 0)` belongs to the WS2812B strip state maintained by the vendor `ws2812b_spi` extension, not to the single-channel chamber-light output.

### 10.2 Addressable RGB strip — `ws2812b_spi`

An active LED subsystem is present. The live `printer_base.cfg` contains a bare `[ws2812b_spi]` section (comment: "spi3控制RGB灯带 与v1.2不同" — SPI3 controls the RGB strip), implemented by the vendor Klipper extension `klipper/klippy/extras/ws2812b_spi.py`. That module opens Linux **`spidev` bus 3, device 0** (`/dev/spidev3.0`, mode 0, up to 3.3 MHz) and emulates the **WS2812B** protocol in software: every color byte is expanded to three wire bytes, order GRB, with a ≥80 µs all-low reset preamble. The strip is assumed to be **37 pixels**, default brightness 30, with breath/blink/progress effects and printer-state color modes. **`M2000` is registered by this extension itself** (`M2000 L<mode> [S<print_mode>] [R G B] [C<count>] [F<start>]`), which explains both the syslog color tuples and the `L0–L6`/`S0–S4` variants seen in `print_control.cfg`.

This is a host-side LED controller: the RK3568 SPI3 controller emits the one-wire data stream, and the driver ICs are the WS2812B modules in the strip itself (no discrete LED-controller IC on the board is needed or detected). The CN46 `5V / DATA / GND` header is the leading physical counterpart — consistent with a 5 V WS2812B data line; a 3.3 V→5 V level shift on the SPI data is implied but untraced.

**Supported conclusion:** Two independent lighting subsystems are confirmed: the chamber light (`MAIN_LED`, H723 `!PD2`, PWM) and a 37-pixel WS2812B addressable strip driven from RK3568 SPI3 via `spidev` by the vendor extension and its `M2000` command. No dedicated LED-controller IC is on the board; the drivers are inside the strip.

### 10.3 Wax / wire-guide motor

The reported output is:

```ini
[output_pin SENSOR_MOTOR]
pin: PF3
```

The label near CN71 reads `WAX MOTOR`, and the software function supports that interpretation. Record CN71 as a **probable wax/wire-guide motor connection** pending tracing. The live stanza drives it with `pwm: True`, `cycle_time: 0.01` (speed-controllable output class), but operating voltage, current limit, switching topology, and full control behavior remain unknown.

## 11. Debug, programming, and recovery interfaces

### 11.1 Status at a glance

| Candidate | Intended investigation | Present confidence |
|---|---|---|
| CN41 (header below U3) | STM32H723 SWD | Reference read as CN41, four contacts; function and contact order still unverified. No mating cable in installed-state inspection (see 5.8). |
| CN44 | RK3568 UART console/service | Location-based candidate only; close-up shows no readable legend, so the console header remains unidentified. No mating cable in installed-state inspection (see 5.8). |
| CN42 | H723-side UART (`G RX TX NC`) | Routed directly into the STM32H723; an MCU serial/console candidate, not a host console. Voltage domain and USART mapping unrecorded. |
| CN72/CN73 | External motor-drive interfaces | Stronger evidence for drive I/O than for JTAG. |
| CN43 (unpopulated) | Possible secondary serial/debug provision | Footprint only; entirely speculative. |
| Unidentified DWC3-connected port | RK3568 USB recovery | Software suggests a device-mode path; physical connector unlocated. |

### 11.2 STM32H723 SWD/JTAG tracing reference

The exposed H723 supports SWD/JTAG. The package-reference signals below are checked against the ST datasheet, including the LQFP144 top-view pinout. **They are not connector pin numbers and do not apply to the F405 toolhead package.** [ST-H723]

| Function | MCU signal | LQFP144 leg |
|---|---|---:|
| SWD data / JTAG mode select | `PA13 / SWDIO / JTMS` | 105 |
| SWD/JTAG clock | `PA14 / SWCLK / JTCK` | 109 |
| Reset | `NRST` | 25 |
| JTAG data input | `PA15 / JTDI` | 110 |
| JTAG data output / optional SWO trace | `PB3 / JTDO / TRACESWO` | 133 |
| Optional JTAG reset | `PB4 / NJTRST` | 134 |
| Boot-mode investigation | `BOOT0` | 138 |

Ground and target-voltage reference must be identified independently. BOOT0 is a boot-control signal, not part of the normal minimal SWD connection.

The header below U3 is now read as four-contact CN41. Four contacts can accommodate ground, SWDIO, SWCLK, and reset, so CN41 remains worth tracing, although a header intended for SWD plus a dedicated voltage reference more typically motivates five contacts, and many non-debug interfaces also use four. Do not attach an ST-LINK solely on this basis.

### 11.3 Firmware preservation

Do not accept an “unlock,” “remove protection,” “erase,” or option-byte write while attempting to preserve the original firmware. ST documents that H7 readout-protection regression from level 1 to level 0 causes a mass erase, while level 2 is irreversible. The board's current protection level is unknown. Debug access can also halt execution; isolate hazardous loads before connecting. [RDP]

Use a properly matched target-voltage reference and normal board power arrangement. Do not attempt to power this entire controller from a debugger header or attach a programmer's power output to an unidentified contact.

### 11.4 UART headers and the RK3568 console

#### CN42: readable serial legend

Close-up inspection gives CN42 the four-contact legend `G RX TX NC` (ground, receive, transmit, no connect), read with a specific board orientation; confirm orientation before connecting anything. CN42 is therefore the only header on this board with an explicit RX/TX legend. Routing confirmation shows CN42 is plumbed directly into the STM32H723, so it should be treated as an MCU-side UART (a candidate H723 console/diagnostic port) and **not** as a path to the RK3568 console. `NC` is a not-connected marking, not a voltage supply; do not substitute an assumed VCC contact.

#### CN43: unpopulated footprint above SW4

Close-up inspection finds an unpopulated four-contact footprint (plus two large anchor lands) directly above SW4, referenced CN43, with TP36-TP38 and D52/D53 nearby. An unpopulated footprint carries no function claim: treat CN43 as a factory option whose purpose cannot be inferred from position alone.

#### CN44 and the Linux-console question

The reported `ttyFIQ0` is a useful host-console clue. It does not identify CN44 by itself, and close-up inspection of CN44 found no readable legend. With CN42 traced to the H723, the header carrying the host console remains unidentified. Firefly documents **1,500,000 baud, 8N1, no flow control** for its ITX-3568Q reference platform. The kernel command line corroborates the console choice (`earlycon=uart8250,mmio32,0xfe660000 console=ttyFIQ0` — UART2; the RK3x serial driver reports base baud 1,500,000), but the physical header carrying it, and its contact order, remain unidentified. [FIRESERIAL] Installed-state inspection shows no cable on CN44, consistent with a factory configuration that exposes no host console cable.

Before connecting an adapter, determine ground and measure the logic-high level. Start with adapter RX receiving board TX and a common ground; leave adapter VCC disconnected. Do not assume 3.3 V rather than 1.8 V merely from the RK3568 name, and do not use an RS-232-voltage interface directly.

### 11.5 RK3568 USB recovery

Firefly documents Loader and MaskROM recovery modes for the reference platform. The printer's DWC3 mode hook suggests that a USB device-mode path is worth locating, but neither the port nor a recovery button is identified here. [FIREBOOT]

Do not short unknown test pads or storage pins to force recovery. Do not apply a stock Firefly firmware image merely because the printer reports a Firefly device-tree model string. No recovery or flashing procedure is authorized by this inventory.

### 11.6 Buttons and other service clues

| Marking | Position | Interpretation |
|---|---|---|
| **SW5 / RESET1** | Below-right of STM32 | Clearly labeled reset; likely H723 reset. Trace to NRST to confirm scope. |
| **SW2** | Below-left of STM32 | Unidentified service button. Not confirmed as BOOT0 or recovery. |
| **SW4** | Left of STM32 near compute/regulator region, directly below the unpopulated CN43 footprint | Unidentified; host/reset/service function possible. |
| **SW3** | Near wireless module/top of central heatsink | Unidentified; host reset/recovery possible but unverified. |
| **U101 / ON / OFF** | Unpopulated footprint left of STM32 | Appears to be a slide-switch footprint despite its reference prefix; function unknown. |

The test pads near each candidate should be photographed and mapped rather than assumed to follow a standard programming-header order.

## 12. Non-destructive verification plan

**The commands below are proposed collection steps; they were not executed on the printer for this report.** Run them on an idle, safely secured printer. They read software state and do not intentionally flash firmware or drive GPIO. Some files require privileges or may not exist on the vendor image; do not change configuration merely to make an inventory command work.

### 12.1 Confirm host identity and console selection

```bash
uname -a
cat /etc/os-release
cat /proc/cmdline

for name in model compatible chosen/stdout-path; do
    path="/sys/firmware/devicetree/base/$name"
    if [ -r "$path" ]; then
        printf '\n%s:\n' "$name"
        tr '\0' '\n' < "$path"
        printf '\n'
    fi
done
```

The command line and `stdout-path` may reveal the console selection and baud rate. They still do not establish physical header contact order.

### 12.2 Confirm USB devices and storage

```bash
lsusb
lsusb -t
ls -l /dev/serial/by-id/ 2>/dev/null
lsblk -o NAME,SIZE,TYPE,FSTYPE,LABEL,PARTLABEL,MOUNTPOINT
cat /proc/mtd 2>/dev/null

for field in name cid manfid oemid; do
    path="/sys/block/mmcblk0/device/$field"
    if [ -r "$path" ]; then
        printf '%s: ' "$field"
        cat "$path"
    fi
done
```

Record USB bus paths as well as VID:PID and serial strings. Preserve the eMMC CID/manufacturer fields before attempting a manufacturer identification from `Y1Y064` alone. Do not write eMMC boot configuration, RPMB, or MTD contents during inventory collection.

### 12.3 Read CAN status without transmitting test traffic

```bash
ip -details -statistics link show can0
```

Capture counters at two known times and compare them. Increasing receive counts would show traffic reception during that interval, but application ownership still needs configuration/log correlation. Do not change bitrate, bring interfaces down, or send CAN test frames during printing.

### 12.4 Read existing device-tree and regulator information

```bash
# Decompile only when dtc is already installed. Warnings may occur on vendor DTs.
if command -v dtc >/dev/null 2>&1; then
    dtc -I fs -O dts /sys/firmware/devicetree/base
fi
```

Capture the output on the workstation as an evidence file. Inspect the actual regulator-compatible strings, UART pinmux, CAN pinmux, USB role definitions, display endpoint, and connector-related GPIO labels. A compatible string remains a firmware declaration; actual chip marking/ID is stronger evidence of silicon identity.

### 12.5 Capture active printer configuration

The most useful sections are `[mcu]`, `[mcu toolhead]`, `[stepper_z]`, every `[tmc2240 ...]` section, `[tension_sensor]`, the full `fan6` stanza, `[output_pin MAIN_LED]`, and `[output_pin SENSOR_MOTOR]`. Preserve the include chain so inactive alternatives are not confused with the running configuration.

For the expected configuration directory, this command identifies matching section headers without changing files:

```bash
cfg_dir="$HOME/printer_data/config"
if [ -d "$cfg_dir" ]; then
    grep -RInE --include='*.cfg' \
      '^\[(mcu([[:space:]][^]]*)?|stepper_z|tmc2240[[:space:]][^]]*|tension_sensor|fan_generic[[:space:]]fan6|output_pin[[:space:]](MAIN_LED|SENSOR_MOTOR))\]' \
      "$cfg_dir"
else
    printf 'Configuration directory not found: %s\n' "$cfg_dir" >&2
fi
```

This search finds candidate files, not proof they are active. Review complete sections and their includes. Prefer any already recorded successful TMC register reads over issuing new diagnostic transactions while the machine is operating.

### 12.6 Physical tracing priorities

First photograph the underside and candidate service-header regions. With all power sources disconnected, identify ground and then measure paths from CN41 (the header below U3) to SWDIO/SWCLK, allowing for series resistors. Record actual resistance rather than relying only on a continuity buzzer.

Next trace named outputs toward their transistor/driver inputs, not simply toward the load contacts. Trace U14/TJA1042 (`TXD`/`RXD`/`VIO`) to its owning controller, document which H723 USART sits behind CN42, confirm CN3/CN4 against `PB1`/`PB0`, and follow CN12 through U5/CS1237. Trace CN41 toward `PA13`/`PA14`/`NRST`, document the CN43 footprint net list if it is ever populated, and map the power interconnect (which rail U12/TPS5450 feeds via L8; how CN66 relates to the two large white inputs; how CN2 receives 24 V). Establish the power domains before attaching adapters or test loads. Two harness traces now carry particular value: follow the CN36 cable to its far end, and follow the fiber-amplifier output wiring and optical fiber of 13.4 to their board header and sensing point. Two further harness traces are now cheap and informative: follow the CN14/CN77 cables to the two nameplate fans, and follow the CN15/CN37 ribbon runs to the rear modules of 13.6.

For each confirmed connection, record the reference, connector orientation, contact number, signal name, intermediate components, measured voltage where relevant, and the evidence/photo used. Leave blank entries rather than filling unknown contacts from a common connector convention.

## 13. Off-board components and power architecture

Component inspection outside the controller board identified the discrete assemblies recorded below: the main switching power supply, two panel-mount solid-state relays, the frame steppers, the enclosure cooling fans, the fiber-optic sensor amplifier, the rear filament-motion sensors, and the toolhead daughter board. This section records them and consolidates the resulting power architecture. Confidence levels follow 1.1; nothing here is a substitute for tracing the actual load wiring.

### 13.1 Main power supply - CZL-450D-24

A sealed switching supply marked **CZL-450D-24** carries a label stating output **24 VDC at 18.8 A** (nominally about 450 W) and input selection for roughly **200-240 VAC at 7.5 A** or **100-120 VAC at 12 A**. The terminal strip reads `L` `N` (earth) `COM COM COM +V +V +V +V ADJ`: mains input, protective earth, three DC-negative terminals, four +24 V terminals, and an output-voltage trim. This establishes the machine as a **24 V DC system** at the electronics level and corroborates the `24V` markings seen at CN66 and the ChamberLED header. The relationship between this supply, the board's two large white power connectors, and CN66 remains to be traced.

### 13.2 Heater relays - two DELIXI CDG1-1DA/25A

Two panel-mount solid-state relays are marked **DELIXI CDG1-1DA/25A**: single-phase units with a **3-32 VDC control input** and a semiconductor **AC output rated 25 A at up to 480 VAC**. Two details matter. First, the CDG1-**DA** variant is a DC-controlled, AC-output device: its triac output is intended for alternating-current loads and is not a DC switching device. A board SSR header carrying a 3-32 V control signal therefore fits these units exactly on the control side, while the load side implies **mains AC heater loads**, not 24 V DC ones. The count (two relays) matches the two board headers SSR-BED (`PC12`) and SSR-CHAM/CN48 (`PG9`). Second, the 25 A figure is a device rating under favorable thermal conditions, and derating applies inside a warm enclosure. **Conclusion (Strong inference):** the bed and chamber heaters are almost certainly mains-side AC loads switched by these SSRs, which is consistent with a 450 W 24 V supply being reserved for electronics, motors, and fans. Which relay serves which heater remains untraced, and the load wiring should be verified with power disconnected before any assumption is relied upon. Treat the relay load terminals and their cabling as hazardous live. [DELIXI-SSR]

### 13.3 Feed stepper - NEMA-17-class bipolar

The two steppers mounted for the X and Y axes carry a complete matching nameplate: **STEPPING MOTOR / BTA20D29-74Y07 / LOT NO. 260131J** on both units - same model, same lot, so the X/Y pair is one matched part ordered together. A third inspected stepper (a fibre-push unit) is a standard **42 mm frame bipolar stepper** with four conductors - two phases, no center taps, the normal pairing for stepper-driver outputs - whose stamp remains legible only beyond a leading figure resembling `42...`; whether it is the same model is not established. Two consequences. The 42 mm frame and phase structure fit the six configured bipolar TMC2240 channels and the four-pad phase headers of 5.2. And because the two fully labeled motors are the X/Y pair, any label-based attempt to identify the feed motors must not assume all six are interchangeable; the color-order evidence of 5.9.2 already separates Feed0/Z from Feed2 from X/Y, and the label pairing adds an independent hardware grouping. Motor brand is not claimed beyond the printed marking.

### 13.4 Fiber-optic sensor amplifier - Omron E3NX-FA family

A narrow black module with a `S TUNE` marking, a dual numeric display, and `UP` / `DOWN` / `MODE` / `L-D` controls matches the control layout of an **Omron E3NX-FA-series smart fiber amplifier**, or a faithful compatible unit in the same enclosure. This is photoelectric sensing electronics, not a current meter or temperature controller: the amplifier drives light through an attached optical fiber and switches a transistor output based on returned or transmitted light, with the display showing received intensity. Family devices typically run from 10-30 VDC. The exact suffix (output polarity, output count, connector style) is not legible. Gray hardware around the module is DIN/end-mounting, not sensing electronics.

**Firmware-side identification (2026-09-29):** the shipped `anisotouch-config` maps a single powered optical input as `[filament_switch_sensor filament_sensor]`, commented `# (F)纤维断料检测传感器` ("(F) fiber runout detection sensor") under a `光纤传感器` ("fiber-optic sensor") section header, on main-MCU pin `^PG4` (v1.1 firmware used `^PD5`; the pin is otherwise unused). Its runout handler pauses with "extruder fiber filament ran out!" and the resume gate refuses to continue while it reads empty ("Left fiber missing"). The 3-contact CN23 legend `+ − O`, the brown/blue/black harness colors at CN23 (5.9.4), and the Omron brown=+/blue=−/black=OUT wire convention all agree: **CN23 is this sensor's interface, and the amplifier's transistor output is the `O` conductor**. Because CN23 is on the main board and the toolhead has its own MCU (head sensors are all `toolhead:`-prefixed; only the cutter halls live there), the sensing point is frame-side on the continuous-fiber feed path, not inside the head. Jam/tangle detection is a separate mechanism driven by the CS1237 tension sensor, not this input. The remaining open item is purely physical: follow the optical fiber to its exact sensing point; `QUERY_FILAMENT_SENSOR SENSOR=filament_sensor` in the console should flip the state when fiber passes or clears that point. [OMRON-E3NX] [FW-FS2.2]

### 13.5 Cooling fans - SNOWFAN YY6025L24B and the configured fan tree

Both installed enclosure-airflow fans inspected at close range - the case unit and the filter unit - carry the same readable nameplate: **SNOWFAN YY6025L24B**, marked **DC 24 V, 0.21 A**. The `YY6025` size code nominally describes a **60 x 60 x 25 mm** axial frame, and 24 V at 0.21 A is roughly **5 W** of rated input each. The visible power connection on both units is a **2-wire** plug: no tachometer or PWM conductor is documented at either fan. The brand and electrical marking are read directly; the frame dimensions are inferred from the model code. [SNOWFAN]

The live `fans.cfg` declares eight fan outputs (`[fan]` plus `fan1`–`fan7`), several on the toolhead MCU:

| Output | Pin | Tachometer | Role (config comment) |
|---|---|---|---|
| `[fan]` | `PB13` | `PA10` | Mainboard fan |
| `fan1` | `toolhead:PC7` | `toolhead:PC8` | Composite-head throat cooling |
| `fan2` | `toolhead:PB7` | `toolhead:PB6` | Plastic-head throat cooling |
| `fan3` | `toolhead:PB5` | none | Plastic-side model cooling |
| `fan4` | `toolhead:PC9` | none | Fiber-side model cooling |
| `fan5` | `PE5` | none | Filter fan |
| `fan6` | `PB5` | `PG12` | Constant-flow fan (hardware PWM, 1 kHz) |
| `fan7` | `PA8` | none | Exhaust fan |

Read together with the board: the two nameplate fans are 2-wire, and the only two-contact fan headers on the board (CN14 and CN77) correspond most naturally to fan5 and fan7, which are exactly the main-MCU stanzas that declare **no** tachometer. The four-contact headers CN5 and CN7 carry `O`/`I` contacts consistent with a tachometer and pair instead with the tacho-declaring main-MCU stanzas `[fan]`/`PA10` and `fan6`/`PG12`. Which nameplate unit sits behind CN14 versus CN77 (case versus filter) is **not established**; the abbreviation-based candidates in 5.3 stand unconfirmed. The board-side drive stages remain untraced (`Q41`/`Q33` are plausible drive devices beside the two-contact headers). Two 5 W fans plus the toolhead fans and steppers sit comfortably inside the PSU budget of 13.1, but per-fan current under load is unmeasured.

### 13.6 Rear filament sensors - SFS-style motion/blockage modules

The two black modules mounted at the rear filament entry are consistent with BIGTREETECH **Smart Filament Sensor (SFS)** style modules, and the housing reads closest to the **V1.0** generation. [BTT-SFS] These are not simple filament-present switches: the module is a filament **motion/blockage detector**. Filament runs straight through two Bowden fittings and turns an internal wheel coupled to the encoder mechanism associated with the large circular feature in the housing; the onboard electronics emit a transition roughly every nominal **7 mm** of filament travel, and firmware infers a jam, stripped filament, broken strand, or empty spool when commanded motion produces no transitions. The later SFS V2.0 variant adds a separate presence switch and a finer motion interval and is configured differently in Klipper; that variant is not the installed housing.

The live configuration carries exactly two such motion channels, each paired with a normally-closed (`^`) runout switch on an adjacent main-MCU pin:

| Section | `switch_pin` | `extruder` | `detection_length` | Paired runout switch |
|---|---|---|---|---|
| `[filament_motion_sensor filament_sensor_2]` | `^PE1` | `extruder` | **7** (the SFS V1.0 nominal) | `[filament_switch_sensor filament_sensor_1]` on `^PE0` |
| `[filament_motion_sensor filament_sensor_4]` | `^PF1` | `extruder1` | **12** | `[filament_switch_sensor filament_sensor_3]` on `^PF2` |

Both motion stanzas set `pause_on_runout: False` and run vendor handlers that pause with a material-specific message, gated so each handler acts only when its bound material line is the active one (the `^PE0`/`^PE1` pair gates on `extruder`/`extruder2`, the coextrusion path; the `^PF2`/`^PF1` pair gates on `extruder1`, the plastic path). The physical counterparts are the two bottom-edge headers **CN15 CP-Break/Clog** and **CN37 PP-Break/Clog** (`5V S1 S2 GND`, see 5.5): a 5 V supply plus exactly two signal contacts per header matches one module per header carrying a Break (presence) contact and a Clog (motion) contact on a four-conductor cable, and each header maps naturally to one motion/switch pair, though header-to-stanza assignment and the cable routes to the rear modules are untraced. The 7 mm value equals the SFS V1.0 vendor nominal; the 12 mm value on the second channel is a vendor retune, not evidence of different hardware. The board headers carry pale gray ribbon plugs (5.9.4), but the far ends were not confirmed visually to be these modules. If the installed V1.0-style housing is the motion-only type, the paired runout contacts may be served by a separate element of the same assembly; close inspection does not resolve this. This sensing channel is distinct from the fiber-path detection of 13.4 and the CS1237 tension path of 6.4.

### 13.7 Consolidated power architecture

```text
AC mains ---> CZL-450D-24 PSU ---> 24 V DC bus
                                    |-> controller board (CN66 / power inputs)
                                    |-> stepper motors, fans, valves, sensors
AC mains ---> SSR load terminals ---|-> bed heater (AC, untraced which SSR)
             (2x CDG1-1DA/25A)      \-> chamber heater (AC, untraced)
E3NX-FA fiber amplifier --- output (untraced header) -> controller input
NEMA-17-class steppers -----> TMC2240 stages -> CN30-CN35 phase headers
YY6025L24B case/filter fans (2x) -> 24 V DC, ~5 W each -> CN14/CN77 (fan5/fan7 candidates)
SFS-style rear modules (2x) ----- 4-wire ----> CN15/CN37 (5V S1 S2, routes untraced)
24 V bus (route untraced) ---> toolhead daughter board CN10; logic via FPC1 ribbon
                             -> both nozzle heaters/thermistors, both throat fans (13.8)
```

The two-tier picture - mains AC for high-power heater loads, 24 V DC for everything else - is now the working model, with the caveats above. Headers earlier recorded as "24 V candidate" sit on a supply domain that the PSU label corroborates, though per-header voltage confirmation is still outstanding.

### 13.8 Toolhead daughter board - connector inventory

Close-up photo inspection identified a separate small PCB at the toolhead carrying the board power input and both heads' thermal, fan, and auto-level connections (photographs `1000075629.jpg`, `1000075630.jpg`, `1000075633.jpg`, `1000075635.jpg`, `1000075636.jpg`, `1000075637.jpg`, held outside this repository). No MCU is visible on its component side, so the board reads as the power/sensor breakout of the head assembly; all logic arrives through the FPC1 ribbon. PCB silkscreen is preserved literally, including probable typos, and no contact order is claimed at any header - the limits of 1.2 apply here unchanged, and the observed colors follow the same harness-identification-only convention of 5.9. Orientation convention used below: component side facing the viewer, **CN10** at upper left, **FPC1** at upper right.

**Reference-designator collision warning:** this PCB runs its own numbering series and reuses designators that also exist on the main controller board with entirely different functions - toolhead **CN4** is `TEMPERATURE-L` where main-board CN4 is `Cham Temp`; toolhead **CN5** is `Auto Level` where main-board CN5 is the `ZBSR` board fan; toolhead **CN7**/**CN8** are `FAN-NEAK-R`/`FAN-NEAK-L` where main-board CN7/CN8 are `HLFJ`/`AMS-P`. Always qualify which PCB a bare reference belongs to.

| Ref. | Silkscreen / function | Contacts | Fitted? | Conductors observed at header | Notes |
|---|---|---|---|---|---|
| **CN10** | POWER | 2; silkscreen **GND** (upper), **24V** (lower) | Yes | harness shows red/pink, blue and dark conductors; contact mapping not resolvable | High-current board power input. **C3** (220 µF / 35 V electrolytic) at the input is consistent with the 24 V domain of 13.1 |
| **CN5** | Auto Level | 2 | Yes | red + black twisted pair | Strong candidate for the bed-mesh piezo front end of 4.2: a two-conductor sensor matches the two-signal `aniso_bed_mesh` front end (ADC `toolhead:PC0` + trigger `toolhead:PA8`). Untraced; distinct from the motherboard's Z probe (`PF5`, see 8.2) |
| **CN4** | TEMPERATURE-L | 2 | Yes | 2 × light gray / white | Strong candidate for the left nozzle thermistor `extruder` `toolhead:PC2` (PT1000, see 7.2). Untraced |
| ref obscured | TEMPERATURE-R | 2 | Yes | 2 × translucent gray | Immediately right of CN4; the right thermistor channel `extruder1` `toolhead:PC1` (NTC) is the natural counterpart. Reference designator not legible |
| ref obscured | HEAT-L | 2 (high-current) | Yes | pair in tan/beige woven fiberglass sleeving; conductor colors hidden | Left nozzle heater `extruder` `toolhead:PB1` (7.2) is the natural counterpart. Protected by adjacent **F2**. Reference hidden by the connector body |
| ref obscured | HEAT-R | 2 (high-current) | Yes | 2 × translucent/light gray | Right nozzle heater `extruder1` `toolhead:PB0` is the natural counterpart. Protected by adjacent **F1** |
| **CN6** | FAN-R | 2 | **no plug fitted** | none | Empty fan header; `24V` printed vertically beside it, second pin not legible. A model-cooling fan of 7.3 (`fan3`/`fan4`) is the plausible counterpart |
| **CN8** | FAN-NEAK-L *(literal)* | 4; silkscreen `PWM` `ETR` `GND` `24V` left to right | Yes | blue, yellow, black, red in that same order | Left throat fan; strong candidate for `heater_fan fan1` (`toolhead:PC7`, tach `toolhead:PC8`, see 7.3). `ETR` preserved literally; a tachometer meaning is plausible but unverified |
| **CN7** | FAN-NEAK-R *(literal)* | 4; `PWM` `ETR` `GND` `24V` | Yes | blue, yellow, black, red in that same order | Right throat fan; strong candidate for `heater_fan fan2` (`toolhead:PB7`, tach `toolhead:PB6`, see 7.3) |
| **FPC1** | flat-flex ribbon interconnect | exact count not confirmed | Yes | white/translucent FFPC with blue stiffener | The logic interconnect to the adjacent head assembly / carriage electronics. Exact contact count should be established by direct count or connector part number before any electrical documentation |

The L/R designation lines up consistently with the two-head convention of [`Exploration/Heads.md`](Heads.md): **L** = left composite head (T0), **R** = right plastic head (T1). `NEAK` in the fan labels reads best as a silkscreen typo for `HEAT` - these being the two heater-paired throat fans - and is preserved here exactly as printed.

**Firmware cross-reference.** The connector set maps cleanly onto the toolhead MCU's configured surface (7.2, 7.3): two heaters, two nozzle thermistors, two 4-wire PWM+tacho fans. `toolhead_temp` (`PC3`) has no counterpart on this board and sits logic-side or elsewhere. All assignments above are **strong candidate / inference** by label-side agreement, not continuity measurements, and the switching stage driving HEAT-L/HEAT-R was not visually identified (this board or the logic board). The daughter board may also be relevant to the unresolved `CONFIG_WANT_ADS131M08=y` option of 4.2: a three-channel ADC on an alternate revision would plausibly serve an auto-level/piezo front end of the CN5 class.

**Board landmarks** (not external connectors; tracing aids): **F1** beside HEAT-R and **F2** beside HEAT-L (heater-channel fuse/protection devices); **Q8** above FAN-NEAK-L and **Q6** above FAN-NEAK-R (small transistors, plausible fan-channel switches); **LED2** near the HEAT-L area; **LED3** near the Auto Level/FPC area; **C3** 220 µF / 35 V near the power input.

**Still worth verifying physically:** the FPC1 contact count and signal map; the hidden references of the TEMPERATURE-R, HEAT-L and HEAT-R connectors; the second pin/function of CN6; whether `ETR` is tachometer feedback or a vendor-specific function; the CN10 harness-conductor-to-contact mapping; and which conductors (ribbon or otherwise) carry the heater drive signals.

## 14. Outstanding questions and next evidence

| Priority | Question | Most useful next evidence |
|---|---|---|
| High | Which header exposes H723 SWD? | Close visual inspection below U3 and on the underside, plus power-off SWDIO/SWCLK tracing. |
| Resolved | What drives Z? | Answered: `[stepper_z]` + `[tmc2240 stepper_z]` in `piezoelectric_ceramic.cfg` — the sixth TMC2240. Harness destination and covered markings still untraced. |
| Mostly resolved | What are the power inputs and domains? | One 24 V/450 W PSU (CZL-450D-24) and mains-fed SSR heater loads are identified in 13; remaining: the two large white board connector references, their role in the 24 V tree, and cautious power-off verification. |
| Resolved | Which physical headers carry bed and chamber temperature? | Close-up labels identify CN3 (HeatBed Temp.) and CN4 (Cham Temp); continuity tracing from PB1/PB0 still pending. |
| Mostly resolved | Which processor owns CN42's RX/TX? | Traced directly into the STM32H723; remaining: which USART, the voltage domain, and whether an active console is present (receive-only capture with a matched-level adapter). |
| High | What is CN44, given its missing legend? | Underside inspection, console configuration, voltage measurement, receive-only boot capture. |
| Firmware-narrowed | Is CN36 (behind U14 TJA1042T/3) connected to RK3568 CAN or another controller? | Firmware evidence (see 6.5/9.1): H723 ships with all CAN options disabled, and the factory CAN fallback binds the toolhead to host `can0` — RK3568 ownership is now the strong-candidate answer. Remaining: physical trace of U14 `TXD`/`RXD` and the CN36 far end. |
| Mostly resolved | Which motor channel is which extruder, given two distinct four-wire color orders? | Semantics settled by [`Exploration/Heads.md`](Heads.md): `extruder`=left plastic (T0), `extruder1`=right plastic (T1), `extruder2`=left-head fiber feed (CFC, "U"). Remaining: only the board-side pairing — which physical Feed0/1/2 header serves which logical channel (5.9.2 color orders are the tracing aid). |
| Medium | Does the CN36 plug use its fourth contact, and what terminates the bus? | Direct inspection of the far-end connector and a passive bus capture; the visible side cannot resolve the `5V` contact. |
| Medium | How do Feed0/Feed1/Feed2 headers pair with the (now-identified) logical channels left-plastic / right-plastic / fiber? | Power-off harness trace from each feed header to its motor; the naming map removes all semantic ambiguity, leaving only this continuity question. |
| High | Which SSR serves which heater, and is the load wiring confirmed AC? | Power-off load-wiring trace from each CDG1-1DA output to the bed and chamber elements. |
| Mostly resolved | What are the rear filament sensors, and how are they configured? | Answered: SFS V1.0-style motion/blockage modules with paired runout switches, on the two `filament_motion_sensor` stanzas (`^PE1` at 7 mm, `^PF1` at 12 mm) and switches `^PE0`/`^PF2` (13.6). Remaining: CN15/CN37 header-to-stanza routing and the rear cable runs. |
| Medium | Which two-contact header serves the case fan and which the filter fan? | Both nameplated units are SNOWFAN YY6025L24B 2-wire fans (13.5); power-off trace from CN14 and CN77 to the two units settles the pairing. |
| Medium | Do the feed steppers share the X/Y label model BTA20D29-74Y07? | Read the remaining motor nameplates; the X/Y pair already matches on model and lot, and any feed-axis match would be an independent check on the Feed-to-extruder mapping of 5.2. |
| Mostly resolved | Where does the E3NX-FA output land, and what does its fiber sense? | Firmware answer: the output lands on CN23 `O` and is read as the F-channel fiber-presence input `^PG4` (13.4). Remaining: follow the optical fiber to the physical sensing point and confirm with `QUERY_FILAMENT_SENSOR SENSOR=filament_sensor`. This fiber channel is separate from the rear SFS-style motion sensors of 13.6. |
| Medium | Which rail does U12 (TPS5450) produce, and what feeds CN2 and CN66? | Follow L8, map the 24 V/interconnect tree, cautious voltage documentation. |
| Medium | Was CN43 ever populated in another configuration, and with what? | Underside and sibling-board documentation; netlist tracing if populated. |
| Resolved | What does PG12 do for fan6? | Answered: `tachometer_pin` of the hardware-PWM `fan6` in the live `fans.cfg`. |
| Resolved | Is MAIN_LED PWM or only on/off? | Answered: `pwm: True`, `cycle_time: 0.01` in the live stanza. |
| Mostly resolved | Is CN46 used, and what protocol does it carry? | Firmware now confirms a WS2812B addressable strip via SPI3; whether CN46 specifically carries it, and the level-shift path, still need photo/trace confirmation. |
| Mostly resolved | What is the tension measurement circuit? | U5 read as CS1237 and CN12 labeled Tension Sensor; firmware resolves the read path — host-side CS1237 on RK3568 SPI0 via `tension_sensor.py`/spidev (6.4). Remaining: sensing element, filter network, and the U5-to-SPI0 physical trace. |
| Medium | What is the exact compute module and RAM/eMMC BOM? | Underside/module labels; safely exposed package markings; eMMC CID and DDR initialization details. |
| Medium | Which connector carries LVDS, touch, and backlight? | Display harness map, panel label, CN40/CN16 contact legends and live device tree. |
| Lower | What are U91/U92/U105/U108, and U95 (top code `XCBY`, still unresolved)? | Direct marking readings under good lighting, with nearby reference designators. |
| Lower | Which remaining details (CN16, CN25 full label, CN56 class, the obstructed CN22 legend, the meaning of AMS-P's `FB` contact) are still unresolved? | Straight-down close-up documentation of the bottom edge plus harness destinations. |
| New (firmware pass) | Which H723 clock build is actually flashed — 400 MHz (`.config` in fibrepack and on disk) or 520 MHz (vendor reference config, matching the `motherboard` USB serial string)? | Klipper startup banner / `QUERY_RESTART` version string in `klippy.log`, or reading `RCC_CFGBUS`-derived clock via SWD; reconcile with the flashed binary if extracted. |
| New (firmware pass) | What occupies the H723's reserved 128 KiB bootloader region (`0x08000000–0x08020000`)? No shipped artifact covers an H723 bootloader (the shipped `bootloader_motherboard_config` is a stray AVR atmega2560 leftover). | SWD read of the first 128 KiB once an SWD header is confirmed; USB enumeration behavior on failed-app boot. |
| New (firmware pass) | What hardware consumes the toolhead build's `CONFIG_WANT_ADS131M08=y` (three-channel ADC) option? Not referenced by any live or factory config. | Toolhead-board inspection for an ADS131M08 package; alternate-toolhead variant documentation. |
| New (firmware pass) | Is an eddy/probe board (RP2040, `eddy.cfg` family, LDC1612 + four-pin piezo front end) fitted on any sibling machine? | Physical inspection for a small probe board; `ls /dev/serial/by-id/` on other units. |
| New (firmware pass) | Toolhead CAN fallback pins: `klipper_config_toolhead_can` says bxCAN on `PB12/PB13` — do those map to a connector pair on the toolhead board (candidates include the toolhead's CN16-class interconnect)? | Toolhead-board photo/trace once accessible; would also corroborate the CN36-to-`can0` hypothesis above. |

| New (toolhead-board pass) | Toolhead daughter board: hidden references of TEMPERATURE-R/HEAT-L/HEAT-R, FPC1 contact count and signal map, location of the heater switching stage | Close-up of the obscured designators; FPC connector part number or direct count; power-off continuity. |
| New (toolhead-board pass) | Is FAN-NEAK `ETR` the fan tachometer, and does the CN8/CN7 to `fan1`/`fan2` L/R mapping hold? | Fan datasheet or bench tach observation; would corroborate the full left/right thermal mapping of 13.8. |
| New (toolhead-board pass) | Is CN5 `Auto Level` the `aniso_bed_mesh` piezo front end (`toolhead:PC0`/`PA8`)? | Continuity from CN5 to the front-end network; homing behavior during a bed-mesh test. |

**Completion criterion:** Every populated connector should eventually have a verified reference, measured connector geometry, orientation-specific contact map, voltage domain, function, and supporting evidence. Until then, this report is a discovery record rather than a substitute for the schematic.

## 15. Technical references

All boot-derived and configuration-derived values in this report were checked against system boot messages and the active firmware configuration. Unit-specific identifiers (SoC serial, network MAC addresses, device serial strings) are intentionally omitted from this report.

### External technical references

References below were consulted during preparation of this report. Upstream documentation describes general component/software behavior; it is not proof that the vendor fork or custom PCB implements every feature in the same way.

| Key | Reference | Use in this report |
|---|---|---|
| **ST-H723** | [STMicroelectronics, DS13313 Rev 5: STM32H723xE/G datasheet][ST-H723] | Device specification and LQFP144 pinout; Figure 6, printed page 55, plus pin/function tables. |
| **FIREINTRO** | [Firefly iCore-3568JQ / ITX-3568Q introduction][FIREINTRO] | Distinguishes the reference platform name from verified printer-module identity. |
| **DEVICETREE** | [Linux kernel documentation: Linux and the Devicetree][DEVICETREE] | Device-tree platform-description limitations. |
| **AMPAK** | [AMPAK AP6256 product information][AMPAK] | Module-family SDIO Wi-Fi and UART Bluetooth interfaces. |
| **FAN53555** | [Linux v5.10 fan53555 regulator driver][FAN53555] | Multiple supported compatible chips; driver-name caveat. |
| **RKRTC** | [Linux v5.15 RK8xx MFD driver][RKRTC] | RK809 selection of the device family containing the RTC function. Not the printer's exact vendor source. |
| **TMC2240** | [Analog Devices TMC2240 product documentation][TMC2240] | STEP/DIR and SPI/UART configuration interfaces. |
| **TPS5450** | [Texas Instruments TPS5450 product information][TPS5450] | Capability check for the re-read power-converter marking U12. |
| **TPS5450-DS** | [Texas Instruments TPS5450 datasheet][TPS5450-DS] | Input range, 5 A output, and nominal switching-frequency claims. |
| **CS1237** | [ChipSEA CS1237 product page][CS1237] | Marking verification for the U5 24-bit ADC. |
| **TJA1042** | [NXP TJA1042 datasheet][TJA1042] | Marking verification and pin functions for the U14 CAN transceiver. |
| **KLIPPER** | [Klipper configuration reference][KLIPPER] | Output-pin defaults and MCU-pin notation; vendor differences remain possible. |
| **MIDR** | [Linux v5.10 arm64 CPU-identification definitions][MIDR] | Variant/revision decoding of the reported MIDR value. |
| **HS200** | [Linux v5.10 MMC definitions][HS200] | Distinguishes 200 MHz SDR HS200 from DDR modes. |
| **USBIDS** | [USB ID Repository: vendor 058f][USBIDS] | Alcor Micro identity and distinction between products 6362/6387. |
| **SOCKETCAN** | [Linux kernel documentation: SocketCAN][SOCKETCAN] | CAN controller states and interface-status interpretation. |
| **FIRESERIAL** | [Firefly ITX-3568Q serial debugging][FIRESERIAL] | Reference-platform 1,500,000-baud console settings; not a printer-header pinout. |
| **FIREBOOT** | [Firefly firmware-update/boot-mode introduction][FIREBOOT] | Reference-platform Loader and MaskROM modes. |
| **RDP** | [ST technical article: Read Out Protection on STM32H7][RDP] | Mass-erase and irreversible-protection warnings. |
| **DELIXI-SSR** | [DELIXI Electric official site][DELIXI-SSR] | CDG1-1DA series identification: DC-control, AC-output solid-state relays; family ratings. |
| **OMRON-E3NX** | [Omron official site][OMRON-E3NX] | E3NX-FA family identification by control layout; supply and output family behavior. |
| **SNOWFAN** | [SnowFan official site][SNOWFAN] | YY6025L24B nameplate brand identification; YY6025 60 x 60 x 25 mm axial fan family conventions. |
| **BTT-SFS** | [BIGTREETECH Smart Filament Sensor documentation][BTT-SFS] | SFS V1.0 motion-detection principle, nominal 7 mm detection length, and Klipper `filament_motion_sensor` usage. |

[ST-H723]: https://www.st.com/resource/en/datasheet/stm32h723ve.pdf
[FIREINTRO]: https://wiki.t-firefly.com/en/iCore-3568JQ/started.html
[DEVICETREE]: https://docs.kernel.org/devicetree/usage-model.html
[AMPAK]: https://www.ampak.com.tw/product/WiFi-Bluetooth/stamp-type-1T1R/AP6256
[FAN53555]: https://raw.githubusercontent.com/torvalds/linux/v5.10/drivers/regulator/fan53555.c
[RKRTC]: https://raw.githubusercontent.com/torvalds/linux/v5.15/drivers/mfd/rk808.c
[TMC2240]: https://www.analog.com/en/products/tmc2240.html
[TPS5450]: https://www.ti.com/product/TPS5450
[TPS5450-DS]: https://www.ti.com/lit/ds/symlink/tps5450.pdf
[KLIPPER]: https://www.klipper3d.org/Config_Reference.html
[HS200]: https://raw.githubusercontent.com/torvalds/linux/v5.10/include/linux/mmc/mmc.h
[USBIDS]: https://usb-ids.gowdy.us/read/UD/058f
[SOCKETCAN]: https://docs.kernel.org/networking/can.html
[FIRESERIAL]: https://wiki.t-firefly.com/en/iCore-3568JQ/debug.html
[FIREBOOT]: https://wiki.t-firefly.com/en/iCore-3568JQ/01-bootmode.html
[RDP]: https://community.st.com/stm32-mcus-60/how-to-change-the-read-out-protection-on-stm32h7-63
[DELIXI-SSR]: https://www.delixi-electric.com/
[OMRON-E3NX]: https://www.omron.com/
[SNOWFAN]: https://www.snowfan.com/
[BTT-SFS]: https://github.com/bigtreetech/smart-filament-detection-module
[MIDR]: https://raw.githubusercontent.com/torvalds/linux/v5.10/arch/arm64/include/asm/cputype.h
[CS1237]: https://en.chipsea.com/product/details/?id=1155&pid=77
[TJA1042]: https://www.nxp.com/docs/en/data-sheet/TJA1042.pdf
