// fs_export_dump.cpp - measured non-CF byte-identity proof driver.
//
// Slices the same plastic-only model (fs_fiber_enabled forced off) through the
// real exporter and writes the .gcode to the given path, so two different
// builds of the same source tree can be compared byte for byte. Deliberately
// free of Catch2 so it links against either the pristine 12205f3623
// libslic3r.lib or the modified one.
//
// usage: fs_export_dump <preset-dir> <out.gcode>

#include "libslic3r/Config.hpp"
#include "libslic3r/Model.hpp"
#include "libslic3r/Print.hpp"
#include "libslic3r/TriangleMesh.hpp"

#include <boost/filesystem.hpp>

#include <cstdio>
#include <iostream>
#include <map>
#include <string>

using namespace Slic3r;

static void load_preset(DynamicPrintConfig& onto, const boost::filesystem::path& file)
{
    DynamicPrintConfig                 cfg;
    std::map<std::string, std::string> key_values;
    std::string                        reason;
    cfg.load_from_json(file.string(), ForwardCompatibilitySubstitutionRule::Disable, key_values, reason);
    onto.apply(std::move(cfg));
}

int main(int argc, char* argv[])
{
    if (argc < 3) {
        std::fprintf(stderr, "usage: %s <preset-dir> <out.gcode>\n", argv[0]);
        return 2;
    }
    const boost::filesystem::path dir(argv[1]);
    const std::string             out = argv[2];

    try {
        DynamicPrintConfig config = DynamicPrintConfig::full_print_config();
        load_preset(config, dir / "fs3_t1_plastic_machine.json");
        load_preset(config, dir / "fs3_t1_plastic_process.json");
        load_preset(config, dir / "fs3_t1_plastic_filament.json");

        // Explicit, so the proof does not depend on a default flipping.
        config.set_key_value("fs_fiber_enabled", new ConfigOptionBool(false));

        Model model;
        ModelObject* obj = model.add_object("cube", "", make_cube(20., 20., 20.));
        obj->add_instance();
        obj->set_offset(Vec3d(150., 150., 0.));

        Print print;
        print.apply(model, config);
        print.process();
        if (!print.is_step_done(psSlicingFinished)) {
            std::fprintf(stderr, "slicing did not finish\n");
            return 3;
        }
        const std::string written = print.export_gcode(out, nullptr, nullptr);
        std::printf("exported=%s\n", written.empty() ? out.c_str() : written.c_str());
    }
    catch (std::exception& ex) {
        std::fprintf(stderr, "EXCEPTION: %s\n", ex.what());
        return 4;
    }
    return 0;
}
