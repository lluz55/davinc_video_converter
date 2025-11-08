{
  description = "A Nix-based development environment for the Davinci Video Converter";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        # Use a recent LTS Node.js version. You can change this if needed.
        nodejs = pkgs.nodejs_20;

        # This script is what `nix run .#` will execute.
        runScript = pkgs.writeShellApplication {
          name = "run-davinci-converter";
          runtimeInputs = [ nodejs pkgs.bash ];
          text = ''
            # Default port, taken from your config.json
            export PORT=3005

            # Parse command-line arguments for --port
            # This allows running `nix run .# -- --port <number>`
            while [[ $# -gt 0 ]]; do
              case "$1" in
                --port)
                  export PORT="$2"
                  shift 2
                  ;;
                *)
                  # Unknown options are passed to the node script, though it doesn't use them.
                  break
                  ;;
              esac
            done

            # This script is executed from your project's root directory.
            # If node_modules doesn't exist, run npm install.
            if [ ! -d "node_modules" ]; then
              echo "Node modules not found. Running 'npm install'..."
              npm install
            fi

            echo "Starting DaVinci Video Converter server on port $PORT..."
            # Ensure required directories for the app exist.
            mkdir -p uploads output logs

            # Start the server. The PORT env var is already exported.
            node server.js
          '';
        };
      in
      {
        # The development environment, accessible via `nix develop`.
        devShells.default = pkgs.mkShell {
          packages = [
            nodejs
            (pkgs.nodePackages.pm2)
          ];
          shellHook = ''
            echo "Entered development shell for DaVinci Video Converter."
            echo "Run 'npm install' if you haven't already."
            # Add locally installed node packages to the PATH.
            export PATH=$PWD/node_modules/.bin:$PATH
          '';
        };

        # The default application, accessible via `nix run .#`.
        apps.default = {
          type = "app";
          program = "${runScript}/bin/run-davinci-converter";
        };

        # The default package, accessible via `nix build .#`.
        packages.default = runScript;
      });
}
