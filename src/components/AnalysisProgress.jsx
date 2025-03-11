import React from 'react';
import PropTypes from 'prop-types';

const AnalysisProgress = ({ agentId, agentStates }) => {
  const state = agentStates[agentId];
  
  return (
    <div className="relative pt-1">
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
            {agentId}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-blue-600">
            {state.progress}%
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
        <div
          style={{ width: `${state.progress}%` }}
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
        />
      </div>
    </div>
  );
};

AnalysisProgress.propTypes = {
  agentId: PropTypes.oneOf(['jtbd', 'curse', 'problemFit', 'priming', 'recommendations']).isRequired,
  agentStates: PropTypes.object.isRequired
};

export default AnalysisProgress;
