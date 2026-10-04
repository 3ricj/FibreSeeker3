// Prints the real emitted tool-change blocks for the shipped FibreSeeker3 SK3 CF
// profile, at the values the exporter resolves them to. Used to produce the
// before/after evidence in the report rather than a hand transcription.
#include "libslic3r/Fiber/FiberToolChange.hpp"

#include <cstdio>
#include <string>

using namespace Slic3r::Fiber;

static void show(const char* title, const std::string& s)
{
    std::printf("%s\n", title);
    size_t pos = 0;
    while (pos < s.size()) {
        size_t eol = s.find('\n', pos);
        std::printf("  | %s\n", s.substr(pos, eol == std::string::npos ? eol - pos : eol - pos).c_str());
        if (eol == std::string::npos) break;
        pos = eol + 1;
    }
    std::printf("\n");
}

int main()
{
    // Shipped CF-nozzle profile: fs_t0_temp 270, standby defaults 150/120,
    // fs_toolchange_retract_v 4 @ 600, brush on. Plastic working temperature for
    // the PETG filament in the profile is 250. Cooling resolved at full.
    FiberToolChangeParams p;
    p.t0_temp_c               = 270;
    p.t0_standby_c            = 150;
    p.t1_standby_c            = 120;
    p.t1_working_c            = 250;
    p.toolchange_retract_v_mm = 4.0;
    p.toolchange_retract_v_f  = 600.0;
    p.brush_on_toolchange     = true;
    p.part_cooling_pct        = 100;

    std::printf("=== AFTER: mid-plate window, cooling at 100%% ===\n\n");
    std::printf("Caller-side lines around the helper (E is the active-extruder axis, so\n"
                "the withdrawal is the caller's, before, and the recovery the caller's, after):\n");
    std::printf("  | G1 E-10 F1500 ; retract for toolchange\n");
    std::printf("  | G92 E0\n\n");
    show("plastic -> fibre  [emit_toolchange_to_fiber]", emit_toolchange_to_fiber(p));
    std::printf("  ... window body: M1001 .. strand .. M1002 ...\n\n");
    show("fibre -> plastic  [emit_toolchange_to_plastic]", emit_toolchange_to_plastic(p));
    std::printf("  | G1 F1500 E10 ; unretract        <- caller, after T1\n\n");

    FiberToolChangeParams first = p;
    first.emit_readiness_wait = false;
    std::printf("=== AFTER: first window of a primed plate (preamble already paid the wait) ===\n\n");
    show("plastic -> fibre  [emit_toolchange_to_fiber]", emit_toolchange_to_fiber(first));
    show("fibre -> plastic  [emit_toolchange_to_plastic]", emit_toolchange_to_plastic(first));

    FiberToolChangeParams lowfan = p;
    lowfan.part_cooling_pct = 50;
    std::printf("=== AFTER: cooling demand at 50%% (routed, not invented) ===\n\n");
    show("plastic -> fibre  [emit_toolchange_to_fiber]", emit_toolchange_to_fiber(lowfan));

    FiberToolChangeParams nofan = p;
    nofan.part_cooling_pct = -1;
    std::printf("=== AFTER: cooling demand unresolved (-1) -> no fan lines at all ===\n\n");
    show("plastic -> fibre  [emit_toolchange_to_fiber]", emit_toolchange_to_fiber(nofan));

    std::printf("=== stationary-V ledger, one complete fibre cycle ===\n");
    std::printf("  before (no tool-change withdrawal):  prime 4 - retract 1 - 0 = %+.3f mm\n",
                fiber_cycle_net_stationary_v_mm(4.0, 1.0, 0.0));
    std::printf("  after  (V-4 at the tool change):     prime 4 - retract 1 - 4 = %+.3f mm\n",
                fiber_cycle_net_stationary_v_mm(4.0, 1.0, 4.0));
    std::printf("  vendor reference                                        = -1.000 mm\n");
    return 0;
}
