# Country flags

SVGs from [lipis/flag-icons](https://github.com/lipis/flag-icons), MIT licensed.
Downloaded from the `flags/4x3` set, so every file shares a 4:3 aspect ratio and
they line up without per-flag adjustment.

Only the countries the product actually offers are here. Anything else falls
back to the line-drawn globe in `components/ui/flag.tsx`, so an unknown code
degrades to something sensible rather than a broken image.

To add one:

    curl -sfL https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/<code>.svg \
      -o public/flags/<code>.svg

Then add the code to `COUNTRIES` in `lib/countries.ts`.

## Why these are not next/image

They are tiny local SVGs. Running them through the image optimiser would cost a
request each and return the same bytes, and Next does not rasterise SVG anyway.
A plain `<img>` with explicit width and height is correct here.
