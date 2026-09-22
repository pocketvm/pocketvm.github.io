# Pocket VM 🔥

A static HTML virtual machine runner for GitHub Pages 🖥️. No build step, backend, account, or API key required 🚀.

## Use ‼️

Select the Linux demo and Start machine, or choose your own ISO 💿, raw hard disk image 💽, or floppy image 💾. Match the image type to your file; `.img` can be either a hard disk or floppy. Select memory before starting. Click the display to type; click outside to release keyboard input. Restart reboots the guest with its current in-memory disk; Power off discards the machine 🔌. Fullscreen depends on browser support ✅.

Local images are read in browser memory and are never uploaded 🌐. The page caps local images at 512 MB to limit memory pressure . Guest disk changes are temporary: there is no automatic saving or disk export. No guest networking relay is configured 🛜. This emulates a 32-bit x86 PC; it is not a modern 64-bit VM host 💻. A desktop browser with a physical keyboard works best ⌨️.

The Linux demo downloads about 6.2 MB from https://i.copy.sh/linux.iso and requires an internet connection. Its availability is controlled by the upstream host. All emulator and firmware assets are bundled locally 🧑‍💻. Use only disk images you are entitled to use.

## Local preview

Serve this folder with a static web server (opening `index.html` with `file://` is not supported). For example, if Python is installed:

    python3 -m http.server 8000

Then visit http://localhost:8000.

## Files and licensing 📁

- `index.html`, `style.css`, `app.js`: the runner interface 📃.
- `vendor/libv86.js`, `v86.wasm`, `v86-fallback.wasm`: v86 0.5.458 from https://www.npmjs.com/package/v86/v/0.5.458. BSD-2-Clause license in `vendor/V86-LICENSE`. Source: https://github.com/copy/v86 🖥️.
- `vendor/seabios.bin`, `vgabios.bin`: firmware from copy/v86 commit `d96be774e549a83371b038b86e819804c96b921f`. LGPL license in `vendor/BIOS-LICENSE`. Corresponding SeaBIOS source: https://github.com/coreboot/seabios/tree/rel-1.16.2. Build configuration and upstream build script are included in `vendor/` 💿.
- The Linux demo is fetched from upstream and is not included in this distribution. Image information: https://github.com/copy/images 💾.

Enjoy :)
