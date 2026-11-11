Visual check of $ARGUMENTS (an episode JSON, optionally followed by segment ids).

Run `AT=0.3,0.85 npm run stills -- $ARGUMENTS` and Read only the contact sheet it prints.
List problems per segment id in one line each (empty frame, overlap, text off-screen, mascot covering
an event, wrong date badge) and fix them in the JSON. Re-run stills only for the segments you changed.
