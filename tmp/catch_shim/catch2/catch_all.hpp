// Minimal stand-in for the vendored Catch2 v3 header, used ONLY to execute the
// FibreSeeker tool-change unit tests in an environment that cannot configure the
// real CMake build. Same macro surface the test file uses; failures are counted
// and reported, exit code non-zero on any failure.
#pragma once
#include <cmath>
#include <cstddef>
#include <cstdio>
#include <string>
#include <vector>

namespace Catch {

struct Approx
{
    double m_value;
    double m_epsilon = 1e-9;
    explicit Approx(double v) : m_value(v) {}
    Approx& epsilon(double e) { m_epsilon = e; return *this; }
    Approx& margin(double m) { m_epsilon = m; return *this; }
    friend bool operator==(double lhs, const Approx& rhs) { return std::fabs(lhs - rhs.m_value) <= rhs.m_epsilon; }
};

} // namespace Catch

namespace fs_test_shim {

struct Case
{
    const char* name;
    void (*fn)();
};

inline std::vector<Case>& cases() { static std::vector<Case> v; return v; }
inline int& failures() { static int n = 0; return n; }
inline int& checks() { static int n = 0; return n; }
inline const char*& current() { static const char* s = ""; return s; }

struct Registrar
{
    Registrar(const char* name, void (*fn)()) { cases().push_back(Case{name, fn}); }
};

inline int run()
{
    for (const Case& c : cases()) {
        current() = c.name;
        const int before = failures();
        c.fn();
        const bool ok = failures() == before;
        std::printf("%-6s %s\n", ok ? "[PASS]" : "[FAIL]", c.name);
    }
    std::printf("\n%zu cases, %d checks, %d failures\n", cases().size(), checks(), failures());
    return failures() == 0 ? 0 : 1;
}

} // namespace fs_test_shim

#define FS_SHIM_CAT2(a, b) a##b
#define FS_SHIM_CAT(a, b) FS_SHIM_CAT2(a, b)

#define FS_TEST_CASE_IMPL(name, id) \
    static void FS_SHIM_CAT(fs_test_fn_, id)(); \
    static ::fs_test_shim::Registrar FS_SHIM_CAT(fs_test_reg_, id)(name, &FS_SHIM_CAT(fs_test_fn_, id)); \
    static void FS_SHIM_CAT(fs_test_fn_, id)()

#define TEST_CASE(name, ...) FS_TEST_CASE_IMPL(name, __COUNTER__)

#define CATCH_CHECK(cond) do { ++::fs_test_shim::checks(); if (!(cond)) { ++::fs_test_shim::failures(); \
    std::printf("   %s:%d CHECK failed: %s   (in %s)\n", __FILE__, __LINE__, #cond, ::fs_test_shim::current()); } } while (false)

#define CHECK(cond) CATCH_CHECK(cond)
#define REQUIRE(cond) CATCH_CHECK(cond)

#define CHECK_FALSE(cond) CATCH_CHECK(!(cond))
#define REQUIRE_FALSE(cond) CATCH_CHECK(!(cond))
