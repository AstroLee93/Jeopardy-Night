import React from 'react';
import { Plus, Minus, Edit2 } from 'lucide-react';
import { Podium } from './Podium';

export interface Team {
  id: number;
  name: string;
  score: number;
  avatar?: string;
  color: {
    bg: string;
    border: string;
  };
}

interface ScoreBoardProps {
  teams: Team[];
  activeTeamId?: number | null;
  onAdjustScore: (teamId: number, delta: number) => void;
  onSelectTeam?: (teamId: number) => void;
  onOpenScoreEditor?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  teams,
  activeTeamId,
  onAdjustScore,
  onSelectTeam,
  onOpenScoreEditor
}) => {
  return (
    <div className="podium-row w-full">
      {teams.map((team) => (
        <Podium
          key={team.id}
          name={team.name}
          color={team.color.border}
          score={team.score}
          active={activeTeamId === team.id}
          onClick={onSelectTeam ? () => onSelectTeam(team.id) : undefined}
        >
          <button type="button" className="podium-btn" onClick={() => onAdjustScore(team.id, -200)} aria-label={`Take $200 from ${team.name}`}>
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="podium-btn" onClick={() => onAdjustScore(team.id, 200)} aria-label={`Give $200 to ${team.name}`}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          {onOpenScoreEditor && (
            <button type="button" className="podium-btn" onClick={onOpenScoreEditor} aria-label={`Edit ${team.name}`}>
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </Podium>
      ))}
    </div>
  );
};
