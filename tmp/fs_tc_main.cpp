// Runner for the shim harness: executes the real test file against the real
// FiberToolChange translation unit. main() lives here so the test file itself
// stays byte-identical to what the CMake build compiles.
#include "catch2/catch_all.hpp"

int main() { return ::fs_test_shim::run(); }
