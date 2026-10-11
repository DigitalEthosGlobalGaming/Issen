# Unused artwork archive

These generated colour maps are retained for reference but are not loaded or
shipped by the game. Subdirectories preserve their former repository paths.
Original authoring PNGs, material recipes and active normal/surface/emissive
planes remain in their owning directories.

The checked-in [cleanup manifest](../../scripts/assets/asset-cleanup.json) records
original paths, archive paths, hashes and canonical runtime sources. Exact
duplicates were removed instead of archived. Catalogue regeneration uses these
aliases so archived colour maps do not return to the runtime build.

Moving files here reduces shipped assets, not repository storage. Review actual
consumers before restoring a map or changing its alias; enemy and player colour
maps still used by prepared figures remain active.
