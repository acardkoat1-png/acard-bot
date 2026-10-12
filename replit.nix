{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.libuuid
    pkgs.cairo
    pkgs.pango
    pkgs.libpng
    pkgs.libjpeg
    pkgs.giflib
    pkgs.librsvg
    pkgs.pkg-config
    pkgs.python311
    pkgs.python311Packages.setuptools
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.libuuid
      pkgs.cairo
      pkgs.pango
      pkgs.libpng
      pkgs.libjpeg
      pkgs.giflib
      pkgs.librsvg
    ];
  };
}