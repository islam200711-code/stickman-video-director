#!/usr/bin/env bash
# Forensic reference tooling (ffmpeg only). usage: scripts/reference-analyze.sh reference/<file>.mp4
# Outputs to out/reference/: shots.csv (start,end,duration), per-shot contact sheets, audio profile.
set -euo pipefail
IN="$1"; O=out/reference; rm -rf "$O"; mkdir -p "$O/shots"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
ffmpeg -v info -i "$IN" -vf "select='gt(scene,0.3)',showinfo" -an -f null - 2>&1 | grep -o 'pts_time:[0-9.]*' | cut -d: -f2 > "$O/cuts.txt"
{ echo "shot,start,end,duration"; prev=0; i=1; for c in $(cat "$O/cuts.txt") "$D"; do printf "%d,%.3f,%.3f,%.3f\n" $i $prev $c $(echo "$c-$prev"|bc); prev=$c; i=$((i+1)); done; } > "$O/shots.csv"
tail -n +2 "$O/shots.csv" | while IFS=, read n s e d; do
  ffmpeg -v error -y -ss "$s" -t "$d" -i "$IN" -vf "fps=4,scale=320:-2,tile=6x2" -frames:v 1 "$O/shots/shot-$(printf %03d $n).jpg" || true; done
ffmpeg -v info -i "$IN" -af "ebur128=peak=true,silencedetect=n=-40dB:d=0.5" -f null - 2> "$O/audio-profile.txt" || true
echo "✔ $(($(wc -l < "$O/shots.csv")-1)) shots → $O"
