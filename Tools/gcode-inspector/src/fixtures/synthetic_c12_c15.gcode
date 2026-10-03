; Synthetic C12/C15 exercising fixture — NOT slicer output.
; Generated with FibreSeek Rocket Slicer v1.3.1.480 on 10/3/2026 at 1:00 PM
; Printer Processor Type: SK3
; LAYER_COUNT: 2
; PRINTING_MODE: Composite Only
;
; Purpose: the real corpus contains no print that puts fibre in part geometry on
; layer 1 of a non-fortified slice, and no print that emits a machine-assist
; command. Both branches therefore need a hand-written fixture or they are
; unverified. This file triggers exactly:
;   C12  critical — fibre inside `Inset 0` on layer 1, CurrentSliceType=1
;   C13  info     — fibre-only, header agrees with observed deposition
;   C14  info     — 3 segments, 2 cuts: the third window closes without M2800,
;                   which is the "segment ended uncut" warning branch
;   C15  info     — homing + bed mesh + AI detection PRESENT (the absent branch
;                   is exercised by every real fixture)
; It deliberately avoids C03/C05/C06/C08/C09/C10/C11/C13-warning triggers: closed
; perimeter, two layers, M1001/M1002 paired, no Z-hop, geometry well inside
; 305x305, and a header mode that matches what is actually deposited.
SET_PRINT_STATS_INFO TOTAL_LAYER=2
SET_VELOCITY_LIMIT MINIMUM_CRUISE_RATIO=0
M140 S75
M141 S0
G21
G90
M83
G92 E0
G28
BED_MESH_CALIBRATE
AI_DETECT_START
M190 S75
M191 S0
M400
M109 S270 T0
T0 R ; switch extruder type to:FIBER
M1001 L60
G1 F1500 U55 ; Extrude restart
G0 X100.000 Y100.000 Z0.200 F3000
G1 X100.000 Y100.000 V4 ; Extrude restart
; LAYER:1 [0.2]
SET_PRINT_STATS_INFO CURRENT_LAYER=1
; Inset 0 start
G1 X110.000 V0.08400 U1.20000 P0.07 F300
G1 X110.000 Y110.000 V0.08400 U1.20000 P0.07 F300
G1 X100.000 Y110.000 V0.08400 U1.20000 P0.07 F300
G1 X100.000 Y100.000 V0.08400 U1.20000 P0.07 F300
; Inset 0 end
; Start to cut
M2800
M400
;CUT DISTANCE 54.8
G0 X100.500 F120
G1 X101.500 V0.21840
; Cutting completed.
G1 X102.000 V-0.5 ; Retract
G0 X195.500 F480
M1002
T1 ; switch extruder type to:PLASTIC
; LAYER:2 [0.4]
SET_PRINT_STATS_INFO CURRENT_LAYER=2
T0 R ; switch extruder type to:FIBER
M1001 L60
G1 F1500 U55 ; Extrude restart
G0 X100.000 Y100.000 Z0.400 F3000
; Fiber infill start
G1 X110.000 V0.08400 U1.20000 P0.07 F300
G1 X110.000 Y110.000 V0.08400 U1.20000 P0.07 F300
; Fiber infill end
; Start to cut
M2800
M400
;CUT DISTANCE 54.8
G1 X111.000 V-0.5 ; Retract
M1002
; Third fibre window opened and closed WITHOUT M2800 — the C14 "segment ended
; uncut" warning branch. M1002 is present so C08 stays silent; only the missing
; blade fire is a defect.
T0 R ; switch extruder type to:FIBER
M1001 L60
G1 F1500 U55 ; Extrude restart
G0 X120.000 Y100.000 Z0.400 F3000
; Fiber infill start
G1 X130.000 V0.08400 U1.20000 P0.07 F300
; Fiber infill end
M1002
; Deposited fibre = 4.8 (L1 Inset 0) + 2.4 (L2 fiber infill) + 1.2 (L3) = 8.4 mm,
; so the declared tow Length below must stay 0.0084 m or C14 flags a mismatch.
; MATERIAL_PRINT_DATA: [{"Type":1,"Extruder":{"Index":0,"Name":"CFC"},"Materials":[{"MaterialType":1,"Name":"X-CCF","Length":0.0084,"Volume":0.0,"Mass":0.0,"Cost":0.0}]}]
; SESSION: {"Profile":{"CurrentSliceTypeIgnored":0,"MustGenerateFiberPerimeters":false,"DoZHop":true,"MinLayerTimeForSlowing":8,"LayerTimeForMaxCooling":15,"StartGCode":"","EndGCode":""},"Printer":{"Name":"SK3","TravelSpeedXY":500,"TravelSpeedZ":10,"AreaSizeX":305,"AreaSizeY":305,"StartGCode":"","EndGCode":""},"CurrentSliceType":1,"PPType":3,"EntitySizes":{"INSET0":{"Width":0.4},"INFILL_FIBER":{"Width":0.8}}}
; thumbnail start
; thumbnail end
