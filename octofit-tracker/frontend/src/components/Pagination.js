import React from 'react';

const Pagination = ({ page, hasNext, hasPrev, onPageChange, total }) => {
  if (!hasNext && !hasPrev) return null;

  return (
    <nav aria-label="Page navigation" className="mt-3">
      <div className="d-flex justify-content-between align-items-center">
        <small className="text-muted">{total != null ? `${total} total results` : ''}</small>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${!hasPrev ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)} disabled={!hasPrev}>&laquo; Prev</button>
          </li>
          <li className="page-item active">
            <span className="page-link">{page}</span>
          </li>
          <li className={`page-item ${!hasNext ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)} disabled={!hasNext}>Next &raquo;</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Pagination;
