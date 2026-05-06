#!/bin/bash

# Test Runner Helper Script
# 
# Usage:
#   ./run-tests.sh static    # Run tests against static mode server
#   ./run-tests.sh prisma    # Run tests against prisma mode server
#   ./run-tests.sh watch     # Run tests in watch mode

MODE=${1:-static}

case "$MODE" in
  static)
    echo "[TEST] Running tests in STATIC mode"
    echo "[TEST] Make sure server is running: CATALOG_READ_SOURCE=static npm run dev"
    MODE=static TEST_BASE_URL=http://localhost:3000 npx vitest run
    ;;
  prisma)
    echo "[TEST] Running tests in PRISMA mode"
    echo "[TEST] Make sure server is running with: DATABASE_URL='postgresql://postgres:Ezenagu101@127.0.0.1:5432/charme_local?schema=public' CATALOG_READ_SOURCE=prisma npm run dev"
    MODE=prisma TEST_BASE_URL=http://localhost:3000 npx vitest run
    ;;
  watch)
    echo "[TEST] Running tests in WATCH mode"
    echo "[TEST] Make sure server is running: CATALOG_READ_SOURCE=static npm run dev"
    MODE=static TEST_BASE_URL=http://localhost:3000 npx vitest --watch
    ;;
  *)
    echo "Usage: ./run-tests.sh [static|prisma|watch]"
    echo ""
    echo "Examples:"
    echo "  ./run-tests.sh static    # Run tests against static mode server"
    echo "  ./run-tests.sh prisma    # Run tests against prisma mode server"
    echo "  ./run-tests.sh watch     # Run tests in watch mode"
    exit 1
    ;;
esac
