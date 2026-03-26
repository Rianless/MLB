export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const today = koreaTime.toISOString().split('T')[0];
    
    // 한국시간 오전 6시 이전이면 어제 날짜도 포함
    const isEarlyMorning = koreaTime.getHours() < 6;
    const yesterday = new Date(koreaTime.getTime() - 24*60*60*1000).toISOString().split('T')[0];
    const dateParam = isEarlyMorning ? yesterday : today;

    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateParam}&hydrate=linescore,probablePitcher`;
    
    const r = await fetch(url);
    const data = await r.json();
    
    const games = (data.dates?.[0]?.games || []).map(g => ({
      id: g.gamePk,
      status: g.status.detailedState,
      away: {
        name: g.teams.away.team.name,
        score: g.teams.away.score ?? '-',
        record: `${g.teams.away.leagueRecord.wins}-${g.teams.away.leagueRecord.losses}`,
        pitcher: g.teams.away.probablePitcher?.fullName ?? null,
      },
      home: {
        name: g.teams.home.team.name,
        score: g.teams.home.score ?? '-',
        record: `${g.teams.home.leagueRecord.wins}-${g.teams.home.leagueRecord.losses}`,
        pitcher: g.teams.home.probablePitcher?.fullName ?? null,
      },
      inning: g.linescore?.currentInning ?? null,
      inningHalf: g.linescore?.inningHalf ?? null,
      awayInnings: g.linescore?.innings?.map(i => i.away?.runs ?? null) ?? [],
      homeInnings: g.linescore?.innings?.map(i => i.home?.runs ?? null) ?? [],
      startTime: g.gameDate,
      venue: g.venue.name,
    }));
    
    res.status(200).json({ date: dateParam, games });
    
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
