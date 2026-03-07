import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithAuth, requestJson } from '../api';
import { CardSkeleton } from './Skeleton';

const MEDAL_GRADIENTS = [
  'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', // gold
  'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)', // silver
  'linear-gradient(135deg, #d4a373 0%, #a0522d 100%)', // bronze
];
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buildComputedLeaderboard = async () => {
      const [teamsData, activitiesData] = await Promise.all([
        requestJson(`${getApiBaseUrl()}/teams/`),
        requestJson(`${getApiBaseUrl()}/activities/`),
      ]);

      const teams = Array.isArray(teamsData?.results) ? teamsData.results : (Array.isArray(teamsData) ? teamsData : []);
      const activities = Array.isArray(activitiesData?.results) ? activitiesData.results : (Array.isArray(activitiesData) ? activitiesData : []);

      const nowIso = new Date().toISOString().slice(0, 10);
      const computed = teams
        .map((team, index) => {
          const members = Array.isArray(team.members) ? team.members : [];
          const score = activities
            .filter((activity) => members.includes(activity.user))
            .reduce((acc, activity) => acc + Number(activity.calories || 0), 0);

          return {
            id: `computed-${team.id || index}`,
            team: team.id,
            team_name: team.name,
            score: Math.round(score),
            week: nowIso,
          };
        })
        .sort((a, b) => b.score - a.score);

      return computed;
    };

    const fetchLeaderboard = async () => {
      try {
        const apiUrl = `${getApiBaseUrl()}/leaderboard/`;
        const response = await fetchWithAuth(apiUrl);
        if (!response.ok) {
          if (response.status === 401) throw new Error('Unauthorized. Please login first.');
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const leaderboardList = data.results || data;
        const sortedList = Array.isArray(leaderboardList)
          ? leaderboardList.sort((a, b) => b.score - a.score)
          : [];

        if (sortedList.length > 0) {
          setLeaderboard(sortedList);
        } else {
          const computed = await buildComputedLeaderboard();
          setLeaderboard(computed);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.score), 1) : 1;

  const getMedalEmoji = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return null;
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="d-flex align-items-center mb-1">
        <div className="lb-icon-circle me-3">
          <i className="bi bi-trophy-fill"></i>
        </div>
        <div>
          <h1 className="display-6 fw-bold mb-0">Leaderboard</h1>
          <p className="text-muted mb-0">Compete with your team and climb the rankings</p>
        </div>
      </div>

      <div className="mt-3">
        {loading && <CardSkeleton count={3} />}

        {error && !loading && (
          <div className="alert alert-danger"><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div className="card border-0 shadow-sm text-center py-5">
            <i className="bi bi-trophy fs-1 text-muted"></i>
            <p className="text-muted mt-2 mb-0">No leaderboard data yet.</p>
          </div>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <>
            {/* Podium - Top 3 */}
            {leaderboard.length >= 3 && (
              <div className="row g-3 mb-4 justify-content-center align-items-end">
                {[1, 0, 2].map((rank) => {
                  const entry = leaderboard[rank];
                  if (!entry) return null;
                  const isFirst = rank === 0;
                  const medalColors = ['#f5af19', '#8e8e8e', '#a0522d'];
                  const pct = maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0;
                  return (
                    <div key={entry.id || rank} className={`col-sm-4 ${isFirst ? 'order-sm-2' : rank === 1 ? 'order-sm-1' : 'order-sm-3'}`}>
                      <div className={`lb-podium-card text-center ${isFirst ? 'lb-podium-first' : ''}`}>
                        <div className="lb-medal-emoji">{getMedalEmoji(rank)}</div>
                        <div className="lb-podium-avatar mx-auto" style={{ background: MEDAL_GRADIENTS[rank], width: isFirst ? 72 : 56, height: isFirst ? 72 : 56, fontSize: isFirst ? '1.8rem' : '1.3rem' }}>
                          {(entry.team_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <h6 className="fw-bold mt-2 mb-1">{entry.team_name || entry.team}</h6>
                        <div className="lb-score" style={{ color: medalColors[rank] }}>{entry.score.toLocaleString()}</div>
                        <small className="text-muted">calories</small>
                        <div className="lb-podium-meter mt-2">
                          <div className="lb-podium-meter-fill" style={{ width: `${pct}%`, background: MEDAL_GRADIENTS[rank] }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Ranking Table */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="px-3 py-3 border-bottom">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-list-ol text-primary"></i>
                    Full Rankings
                    <span className="badge bg-light text-dark ms-auto">{leaderboard.length} teams</span>
                  </h6>
                </div>
                {leaderboard.map((entry, index) => {
                  const pct = maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0;
                  const bg = index < 3 ? MEDAL_GRADIENTS[index] : GRADIENTS[(index - 3) % GRADIENTS.length];
                  const isTop3 = index < 3;

                  return (
                    <div key={entry.id || `${entry.team}-${index}`} className={`lb-rank-row ${index === leaderboard.length - 1 ? '' : 'border-bottom'}`}>
                      <div className="d-flex align-items-center gap-3 px-3 py-3">
                        {/* Position */}
                        <div className="lb-rank-pos" style={isTop3 ? { background: bg } : {}}>
                          {getMedalEmoji(index) ? (
                            <span>{getMedalEmoji(index)}</span>
                          ) : (
                            <span className="fw-bold text-muted">#{index + 1}</span>
                          )}
                        </div>

                        {/* Team avatar */}
                        <div className="lb-rank-avatar" style={{ background: bg }}>
                          {(entry.team_name || '?').charAt(0).toUpperCase()}
                        </div>

                        {/* Team name */}
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="fw-bold mb-0 text-truncate">{entry.team_name || entry.team}</h6>
                          <div className="lb-rank-bar-wrap mt-1">
                            <div className="lb-rank-bar-fill" style={{ width: `${pct}%`, background: bg }}></div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-end flex-shrink-0">
                          <div className={`fw-bold ${isTop3 ? 'fs-5' : ''}`} style={{ color: isTop3 ? ['#d4930d', '#6c757d', '#8b5e3c'][index] : '#4a5568' }}>
                            {entry.score.toLocaleString()}
                          </div>
                          <small className="text-muted">cal</small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
