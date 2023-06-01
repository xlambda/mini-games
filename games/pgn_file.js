const PGN_template = `
[Game "Chinese Chess"]
[Event "__EVENT__"]
[Site "__SITE__"]
[Date "__DATE__"]
[EventDate "__EVENTDATE__"]
[Round "__ROUND__"]
[Result "__RESULT__"]
[Red "__RED__"]
[Black "__BLACK__"]
[FEN "__FEN__"]
[ECO "C52"]
[WhiteElo "?"]
[BlackElo "?"]
[PlyCount "47"]

__MOVES__
`;

function savePGN() {
  let pgn = PGN_template;
  pgn = pgn.replace('__EVENT__', 'Chinese Chess');
  pgn = pgn.replace('__SITE__', '');
  pgn = pgn.replace('__DATE__', '');
  pgn = pgn.replace('__EVENTDATE__', '');

}