import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: '4px',
};

const SkeletonRow = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div style={{ ...shimmerStyle, height: '16px', width: `${60 + Math.random() * 40}%` }}></div>
      </td>
    ))}
  </tr>
);

const TableSkeleton = ({ rows = 5, cols = 5, headerColor = 'primary', title = 'Loading...' }) => (
  <>
    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
    <div className="card shadow-sm border-0">
      <div className={`card-header bg-${headerColor} text-white`}>
        <h5 className="card-title mb-0"><i className="bi bi-hourglass-split me-2"></i>{title}</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i}><div style={{ ...shimmerStyle, height: '14px', width: '70%' }}></div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} cols={cols} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

const CardSkeleton = ({ count = 3 }) => (
  <>
    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
    <div className="row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-md-6 col-lg-4 mb-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header" style={{ ...shimmerStyle, height: '48px' }}></div>
            <div className="card-body">
              <div style={{ ...shimmerStyle, height: '16px', width: '80%', marginBottom: '8px' }}></div>
              <div style={{ ...shimmerStyle, height: '16px', width: '60%', marginBottom: '8px' }}></div>
              <div style={{ ...shimmerStyle, height: '24px', width: '30%' }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);

export { TableSkeleton, CardSkeleton };
