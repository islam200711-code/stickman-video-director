#!/usr/bin/env bash
# Style C visual benchmark -> out/benchmark/*.png  (see docs/STYLE_GUIDE.md §10)
set -euo pipefail
cd "$(dirname "$0")/.."
O=out/benchmark; rm -rf "$O"; mkdir -p "$O/raw"
# scene starts: expressions 0, dialogue 6, locomotion 10, trio 14.5, push 18.5, outdoor 23, indoor 27
EXPR=$(python3 -c "print(' '.join(str(round(0.35+0.5*i,2)) for i in range(12)))")
GAIT="10.6 10.72 10.84 10.96 11.08 11.2 13.0 13.07 13.14 13.21 13.28 13.35"
npx tsx scripts/stills.ts style-benchmark $EXPR $GAIT 7.4 16.2 20.0 22.3 26.0 29.5 --out "$O/raw" >/dev/null
f() { printf "%s/raw/%.2fs.png" "$O" "$1"; }
crop() { local i=0 s=""; for _ in "$@"; do s="$s[$i]$CROP[c$i];"; i=$((i+1)); done; echo "$s"; }
CROP="crop=360:380:460:110"; set -- $EXPR
ffmpeg -v error -y $(for t in $EXPR; do echo -i $(f $t); done) -filter_complex "$(crop $EXPR)[c0][c1][c2][c3][c4][c5]hstack=6[a];[c6][c7][c8][c9][c10][c11]hstack=6[b];[a][b]vstack,scale=1620:-2" "$O/1-expressions.png"
cp "$(f 7.4)" "$O/2-dialogue.png"
CROP="crop=320:440:480:170"
ffmpeg -v error -y $(for t in $GAIT; do echo -i $(f $t); done) -filter_complex "$(crop $GAIT)[c0][c1][c2][c3][c4][c5]hstack=6[a];[c6][c7][c8][c9][c10][c11]hstack=6[b];[a][b]vstack,scale=1620:-2" "$O/3-walk-run.png"
cp "$(f 16.2)" "$O/4-three-characters.png"
ffmpeg -v error -y -i "$(f 20.0)" -i "$(f 22.3)" -filter_complex hstack "$O/5-push-ik.png"
cp "$(f 26.0)" "$O/6-outdoor.png"
cp "$(f 29.5)" "$O/7-indoor.png"
ffmpeg -v error -y -i "$O/2-dialogue.png" -i "$O/4-three-characters.png" -i "$(f 20.0)" -i "$O/6-outdoor.png" -i "$O/7-indoor.png" -i "$(f 10.84)" -filter_complex "[0][1][2][3][4][5]xstack=inputs=6:layout=0_0|w0_0|0_h0|w0_h0|0_h0+h0|w0_h0+h0,scale=1600:-2" "$O/overview.png"
echo "✔ benchmark images in $O"
