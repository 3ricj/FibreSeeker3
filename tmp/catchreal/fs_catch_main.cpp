// Real Catch2 entry point for the standalone FibreSeeker3 tool-change test
// binary. Catch2Main.lib from the warm tree carries no usable entry point for
// this link, so the session is driven explicitly.
#include <catch2/catch_session.hpp>

int main(int argc, char* argv[])
{
    Catch::Session session;
    session.applyCommandLine(argc, argv);
    return session.run();
}
