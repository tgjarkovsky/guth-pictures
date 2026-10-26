# Pose pack: zamčený styl

Každý prompt začíná tímto blokem beze změny. Díky tomu drží celý balík jeden vzhled.

## Stylový prompt (verbatim)

> Editorial fashion illustration of one person, loose expressive single-weight line with
> minimal flat fills. Warm off-white paper background #f4f1ea with subtle paper texture.
> Figure drawn in near-black ink #11100e, one small red accent #c93a2b (a garment detail).
> No facial details beyond a suggestion, no text, no logos, no background props. Vertical
> 4:5 format. Whole pose clearly readable.

Tmavá burgundská varianta (`#1A0A0F` / `#EDE2D9` / `#B87333`) byla v pilotu zamítnutá.

## Za stylový blok se přidá

1. framing podle `shot`:
   - `headshot`: head-and-shoulders framing
   - `three-quarter`: three-quarter (knees-up) framing
   - `full`: full-body framing, head to feet
   - `seated`: seated figure, full pose visible
   - `hands`: close framing emphasizing hands and gesture
   - `environmental`: figure within a suggested minimal environment
2. `direction` z `poses.json` (anglicky, konkrétní pokyn pro tělo).

Příklad: `<stylový blok> Three-quarter (knees-up) framing. Weight on back foot, hands loosely in pockets, chin slightly down, looking off-camera left.`

## Štítky (`tags` v poses.json)

Typ focení, víc štítků na pózu je v pořádku: `portrét`, `business`, `boudoir`, `páry`,
`svatba`, `event`, `lifestyle`, `prádlo` (katalog prádla). Navíc místo: `gauč`, `postel`,
`okno`, `kuchyně`, `detail`. Galerie podle nich filtruje.
