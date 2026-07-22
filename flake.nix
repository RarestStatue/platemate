{
  description = "Platemate dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            nodePackages.typescript
            nodePackages.typescript-language-server

            prisma-engines
            openssl

            postgresql_16
            redis

            docker
            docker-compose

            git
            jq
          ];

          shellHook = ''
            export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
            export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
            export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
            export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"

            export PATH="$PWD/frontend/node_modules/.bin:$PATH"

            if [ -f .env ]; then
              set -a; . ./.env; set +a
            fi

            echo "platemate dev shell"
            echo "  node   $(node --version)"
            echo "  npm    $(npm --version)"
            echo "  psql   $(psql --version | awk '{print $3}')"
            echo ""
            echo "next steps:"
            echo "  1. cp .env.example .env  (if not done)"
            echo "  2. docker compose up -d"
            echo "  3. cd frontend && npm install && npx prisma generate"
            echo "  4. npm run dev"
          '';
        };
      });
}
